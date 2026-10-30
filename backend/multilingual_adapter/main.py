"""Isolated multilingual gateway for AI Sahaay; existing API remains untouched."""
from __future__ import annotations

import asyncio
import json
import os
import threading
from pathlib import Path
from typing import Any, Literal

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from google import genai
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
load_dotenv(PROJECT_DIR / ".env")
BACKEND_URL = os.getenv("AI_SAHAAY_API_URL", "http://127.0.0.1:8000").rstrip("/")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
SUPPORTED_LANGUAGES = {"en", "ta", "te", "kn", "ml", "hi"}
LANGUAGE_NAMES = {"en": "English", "ta": "Tamil", "te": "Telugu", "kn": "Kannada", "ml": "Malayalam", "hi": "Hindi"}
_client: genai.Client | None = None
_client_lock = threading.Lock()

app = FastAPI(title="AI Sahaay Multilingual Adapter", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5175", "http://127.0.0.1:5175"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    language: Literal["en", "ta", "te", "kn", "ml", "hi"] = "en"


class RecommendRequest(BaseModel):
    language: Literal["en", "ta", "te", "kn", "ml", "hi"] = "en"
    age: int | None = Field(default=None, ge=0, le=120)
    state: str = ""
    occupation: str = ""
    income: float | None = Field(default=None, ge=0)
    category: str = ""
    gender: str = ""
    disability: str = ""


def gemini_client() -> genai.Client:
    global _client
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured for the multilingual adapter.")
    if _client is None:
        with _client_lock:
            if _client is None:
                _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


def generate(prompt: str) -> str:
    response = gemini_client().models.generate_content(model=GEMINI_MODEL, contents=prompt)
    text = (getattr(response, "text", "") or "").strip()
    if not text:
        raise RuntimeError("The translation service returned an empty response.")
    return text


async def generate_async(prompt: str) -> str:
    try:
        return await asyncio.to_thread(generate, prompt)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Multilingual AI is unavailable: {exc}") from exc


async def backend_request(method: str, path: str, **kwargs: Any) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.request(method, f"{BACKEND_URL}{path}", **kwargs)
            response.raise_for_status()
            return response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=503, detail=f"AI Sahaay backend is unavailable: {exc}") from exc


async def to_english(text: str, language: str) -> str:
    if language == "en":
        return text
    return await generate_async(
        f"Translate the user's question from {LANGUAGE_NAMES[language]} into English for a government scheme search. "
        "Return only the translated question. Preserve scheme names, locations, numbers, and meaning. Do not answer it.\n\n"
        f"Question: {text}"
    )


@app.get("/api/health")
async def health() -> dict[str, Any]:
    result = await backend_request("GET", "/health")
    return {"adapter": "ok", "backend": result.get("status"), "scheme_count": result.get("scheme_count")}


@app.post("/api/ask")
async def ask(payload: AskRequest) -> dict[str, Any]:
    english_question = await to_english(payload.question, payload.language)
    result = await backend_request("GET", "/search", params={"query": english_question, "k": 8})
    schemes = result.get("results") or result.get("schemes") or []
    if not schemes:
        return {"answer": "", "sources": [], "language": payload.language}

    grounded = [{key: scheme.get(key, "") for key in (
        "scheme_name", "details", "benefits", "eligibility", "application", "documents", "official_urls"
    )} for scheme in schemes[:8]]
    answer = await generate_async(
        f"Answer the question in {LANGUAGE_NAMES[payload.language]}. Use only facts in the supplied scheme records. "
        "Do not invent, infer, or add scheme names, eligibility, benefits, deadlines, documents, or URLs. "
        "Keep official scheme names and URLs exactly as written. Be concise and mention uncertainty when the records do not answer part of the question.\n\n"
        f"Question (English translation): {english_question}\n\nScheme records (JSON):\n{json.dumps(grounded, ensure_ascii=False)}"
    )
    sources = [{"scheme_name": s.get("scheme_name", ""), "official_urls": s.get("official_urls", [])} for s in schemes]
    return {"answer": answer, "sources": sources, "language": payload.language}


@app.post("/api/recommend")
async def recommend(payload: RecommendRequest) -> dict[str, Any]:
    profile = payload.model_dump(exclude={"language"})
    result = await backend_request("POST", "/recommend", json=profile)
    schemes = result.get("recommendations", [])
    if payload.language == "en" or not schemes:
        return {**result, "language": payload.language}

    translatable = [
        {"details": s.get("details", ""), "benefits": s.get("benefits", ""),
         "eligibility": s.get("eligibility", ""), "application": s.get("application", ""),
         "documents": s.get("documents", ""), "category": s.get("category", ""),
         "level": s.get("level", ""), "match_reasons": s.get("match_reasons", []),
         "match_status": s.get("match_status", "")}
        for s in schemes[:12]
    ]
    translated_json = await generate_async(
        f"Translate the string values in this JSON into {LANGUAGE_NAMES[payload.language]}. "
        "Return only valid JSON array with the same order, keys, value types, numbers, URLs, and empty values. "
        "Do not translate proper scheme names or URLs; none are included. Do not add facts.\n\n"
        f"JSON:\n{json.dumps(translatable, ensure_ascii=False)}"
    )
    try:
        translations = json.loads(translated_json[translated_json.find("["):translated_json.rfind("]") + 1])
        if len(translations) != len(translatable):
            raise ValueError("Translation count mismatch")
    except (ValueError, TypeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=503, detail="Multilingual recommendation translation returned invalid data. Please retry.") from exc

    for scheme, translated in zip(schemes, translations):
        for key, value in translated.items():
            scheme[key] = value
    return {**result, "language": payload.language}


app.mount("/", StaticFiles(directory=BASE_DIR / "ui", html=True), name="multilingual-ui")
