"""Multilingual translation helper for AI Sahaay.

Uses the already-configured Gemini API to translate:
  1. User queries from any supported language → English  (for retrieval)
  2. Generated answers from English → the user's selected language

Supported language codes: en, ta, te, kn, ml, hi
When language is "en" or missing, every function is a no-op passthrough.
"""
from __future__ import annotations

import os
from typing import Optional

SUPPORTED_LANGUAGES = {
    "en": "English",
    "ta": "Tamil",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam",
    "hi": "Hindi",
}


def _is_english(lang: Optional[str]) -> bool:
    """Return True when the language is English or unspecified."""
    return not lang or lang.strip().lower() in ("en", "english", "")


def _get_gemini_client():
    """Return a google.genai Client using the existing GEMINI_API_KEY."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. "
            "Translation requires a valid Gemini API key in the backend .env file."
        )
    from google import genai
    return genai.Client(api_key=api_key)


def _get_model() -> str:
    return os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()


def translate_to_english(text: str, source_lang: str) -> str:
    """Translate *text* from *source_lang* to English.

    Returns the original text unchanged when the language is already English.
    """
    if _is_english(source_lang):
        return text

    lang_name = SUPPORTED_LANGUAGES.get(source_lang, source_lang)

    try:
        client = _get_gemini_client()
        prompt = (
            f"Translate the following {lang_name} text to English. "
            f"Return ONLY the English translation, nothing else.\n\n"
            f"{text}"
        )
        response = client.models.generate_content(model=_get_model(), contents=prompt)
        translated = getattr(response, "text", "").strip()
        return translated if translated else text
    except Exception as exc:
        print(f"[multilingual] translate_to_english failed: {exc}")
        return text  # safe fallback – use original text for retrieval


def translate_from_english(text: str, target_lang: str) -> str:
    """Translate *text* from English to *target_lang*.

    Returns the original text unchanged when the target is English.
    """
    if _is_english(target_lang):
        return text

    lang_name = SUPPORTED_LANGUAGES.get(target_lang, target_lang)

    try:
        client = _get_gemini_client()
        prompt = (
            f"Translate the following English text to {lang_name}. "
            f"Keep all scheme names, monetary amounts, percentages, dates, "
            f"and proper nouns as-is. Return ONLY the {lang_name} translation, "
            f"nothing else.\n\n"
            f"{text}"
        )
        response = client.models.generate_content(model=_get_model(), contents=prompt)
        translated = getattr(response, "text", "").strip()
        return translated if translated else text
    except Exception as exc:
        print(f"[multilingual] translate_from_english failed: {exc}")
        return text  # safe fallback – return the English answer

