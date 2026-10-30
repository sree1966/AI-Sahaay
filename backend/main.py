"""AI Sahaay FastAPI service."""
from __future__ import annotations
import os, re, threading
from multilingual import translate_to_english, translate_from_english
from pathlib import Path
from typing import Any
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from pydantic import BaseModel, Field

load_dotenv(Path(__file__).with_name(".env"))
BASE_DIR = Path(__file__).resolve().parent
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
CHROMA_PATH = Path(os.getenv("CHROMA_PATH", str(BASE_DIR.parent / "data" / "chroma_db"))).expanduser().resolve()
COLLECTION_NAME = os.getenv("CHROMA_COLLECTION", "government_schemes")
_INIT_LOCK = threading.RLock()
_EMBEDDINGS = None
_VECTOR_STORE = None

def configured_origins():
    defaults = ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"]
    extra = [x.strip() for x in os.getenv("CORS_ORIGINS", "").split(",") if x.strip()]
    return list(dict.fromkeys(defaults + extra))

app = FastAPI(title="AI Sahaay", description="AI-powered Government Scheme Assistant", version="1.1.0")
app.add_middleware(CORSMiddleware, allow_origins=configured_origins(), allow_credentials=False, allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type"])

class Question(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    language: str = Field(default="en", max_length=10)

class UserProfile(BaseModel):
    age: int | None = Field(default=None, ge=0, le=120)
    state: str = ""
    occupation: str = ""
    income: float | None = Field(default=None, ge=0)
    category: str = ""
    gender: str = ""
    disability: str = ""

def clean_text(value: Any) -> str:
    if value is None: return ""
    text = str(value).strip()
    return "" if text.lower() in {"nan", "none", "null"} else text

def normalize(value: Any) -> str: return clean_text(value).lower().strip()

def extract_urls(text: str) -> list[str]:
    return list(dict.fromkeys(u.rstrip(".,;") for u in re.findall(r"https?://[^\s\]\)>,]+", text or "")))

def document_to_scheme(document: Document) -> dict[str, Any]:
    metadata, text = document.metadata or {}, document.page_content or ""
    keys = ("scheme_name", "slug", "level", "category", "tags", "details", "benefits", "eligibility", "application", "documents")
    scheme = {key: clean_text(metadata.get(key, "")) for key in keys}
    patterns = {
        "details": r"Details:\s*(.*?)(?=\n(?:Benefits|Eligibility|Application Process|Documents Required):|\Z)",
        "benefits": r"Benefits:\s*(.*?)(?=\n(?:Eligibility|Application Process|Documents Required):|\Z)",
        "eligibility": r"Eligibility:\s*(.*?)(?=\n(?:Application Process|Documents Required):|\Z)",
        "application": r"Application Process:\s*(.*?)(?=\nDocuments Required:|\Z)",
        "documents": r"Documents Required:\s*(.*?)(?:\Z)",
    }
    for key, pattern in patterns.items():
        if not scheme[key]:
            match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            if match: scheme[key] = clean_text(match.group(1))
    scheme["official_urls"] = extract_urls(" ".join(scheme[k] for k in ("details", "benefits", "eligibility", "application", "documents")))
    return scheme

def get_embeddings():
    global _EMBEDDINGS
    if _EMBEDDINGS is None:
        with _INIT_LOCK:
            if _EMBEDDINGS is None:
                _EMBEDDINGS = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    return _EMBEDDINGS

def get_vector_store():
    global _VECTOR_STORE
    if _VECTOR_STORE is None:
        with _INIT_LOCK:
            if _VECTOR_STORE is None:
                if not CHROMA_PATH.exists(): raise RuntimeError(f"Chroma database directory does not exist: {CHROMA_PATH}")
                _VECTOR_STORE = Chroma(collection_name=COLLECTION_NAME, embedding_function=get_embeddings(), persist_directory=str(CHROMA_PATH))
    return _VECTOR_STORE

def retrieve_schemes(query: str, k: int = 10) -> list[Document]:
    if not clean_text(query): return []
    try: docs = get_vector_store().similarity_search(clean_text(query), k=max(1, min(k, 30)))
    except Exception as exc: raise RuntimeError(f"Scheme retrieval failed: {exc}") from exc
    results, seen = [], set()
    for doc in docs:
        name = normalize(document_to_scheme(doc)["scheme_name"])
        if name and name not in seen: seen.add(name); results.append(doc)
    return results

def scheme_results(query: str, k: int = 10): return [document_to_scheme(d) for d in retrieve_schemes(query, k)]

def get_collection_count():
    try:
        import chromadb
        return int(chromadb.PersistentClient(path=str(CHROMA_PATH)).get_collection(COLLECTION_NAME).count())
    except Exception: return None

@app.get("/")
def root(): return {"service": "AI Sahaay", "status": "ok", "docs": "/docs"}

@app.get("/health")
def health():
    count = get_collection_count()
    return {"status": "ok" if count is not None else "degraded", "database": str(CHROMA_PATH), "collection": COLLECTION_NAME, "scheme_count": count, "gemini_configured": bool(GEMINI_API_KEY)}

@app.get("/search")
def search(query: str = Query(default="", max_length=1000), q: str = Query(default="", max_length=1000), k: int = Query(default=10, ge=1, le=30), category: str = "", state: str = "", language: str = "en"):
    term = query or q
    if not term: raise HTTPException(422, "Provide a query parameter (query or q).")
    search_term = translate_to_english(term, language) if language != "en" else term
    try: schemes = scheme_results(search_term, k)
    except RuntimeError as exc: raise HTTPException(503, str(exc)) from exc
    if category: schemes = [s for s in schemes if normalize(category) in normalize(s["category"] + " " + s["tags"])]
    if state: schemes = [s for s in schemes if not s["level"] or "state" in normalize(s["level"]) or state.lower() in normalize(s["eligibility"] + " " + s["details"])]
    return {"query": term, "results": schemes, "schemes": schemes, "count": len(schemes)}

def fallback_answer(schemes):
    if not schemes: return "I could not find a relevant government scheme in the available database. Try a more specific query."
    items = []
    for s in schemes[:4]:
        item = s["scheme_name"]
        summary = s["details"] or s["benefits"]
        if summary: item += ": " + summary[:450]
        if s["official_urls"]: item += " Official information: " + s["official_urls"][0]
        items.append(item)
    return "\n\n".join(items)

@app.post("/ask")
def ask(payload: Question):
    lang = payload.language or "en"
    english_question = translate_to_english(payload.question, lang) if lang != "en" else payload.question
    try: schemes = scheme_results(english_question, 8)
    except RuntimeError as exc: raise HTTPException(503, str(exc)) from exc
    answer = fallback_answer(schemes)
    if GEMINI_API_KEY and schemes:
        try:
            from google import genai
            response = genai.Client(api_key=GEMINI_API_KEY).models.generate_content(model=GEMINI_MODEL, contents=f"Answer concisely using only the government scheme facts in this context. Do not infer eligibility, benefits, or links.\nContext:\n{schemes[:8]}\nQuestion: {english_question}")
            answer = clean_text(getattr(response, "text", "")) or answer
        except Exception as exc: print(f"Gemini generation failed; using retrieved facts: {exc}")
    if lang != "en":
        answer = translate_from_english(answer, lang)
    return {"answer": answer, "sources": schemes}

def recommend_score(scheme, profile):
    text = normalize(" ".join(str(scheme.get(k, "")) for k in ("scheme_name", "details", "eligibility", "category", "tags")))
    score, reasons = 0, []
    for key, value in (("state", profile.state), ("occupation", profile.occupation), ("category", profile.category), ("gender", profile.gender)):
        if normalize(value) and normalize(value) in text: score += 2; reasons.append(f"Matches your {key}")
    if profile.disability and normalize(profile.disability) not in {"no", "none", "false"} and any(w in text for w in ("disability", "disabled", "divyang")): score += 3; reasons.append("Mentions disability support")
    if profile.age is not None:
        ages = [int(n) for n in re.findall(r"\b(\d{1,3})\s*(?:years?|yrs?)\b", normalize(scheme.get("eligibility", "")))]
        if ages and min(ages) <= profile.age <= max(ages): score += 2; reasons.append("Age appears to match stated eligibility")
    return score, reasons

@app.post("/recommend")
def recommend(profile: UserProfile):
    terms = [profile.occupation, profile.category, profile.gender, profile.state, "government schemes"]
    if profile.disability and normalize(profile.disability) not in {"no", "none", "false"}: terms.append("disability")
    try: docs = retrieve_schemes(" ".join(terms), 30)
    except RuntimeError as exc: raise HTTPException(503, str(exc)) from exc
    ranked = []
    for doc in docs:
        scheme = document_to_scheme(doc); score, reasons = recommend_score(scheme, profile)
        scheme.update(match_score=score, match_reasons=reasons, match_status="Potential match" if reasons else "Review eligibility")
        ranked.append(scheme)
    ranked.sort(key=lambda item: item["match_score"], reverse=True)
    return {"recommendations": ranked[:20], "count": min(len(ranked), 20)}
