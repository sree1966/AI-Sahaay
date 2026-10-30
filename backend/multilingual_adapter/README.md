# AI Sahaay multilingual sidecar

This is an optional, isolated multilingual experience. It does not replace or edit the existing frontend, `main.py`, `ingest.py`, Chroma data, or their API contracts. The sidecar UI is served from this adapter at `http://127.0.0.1:8001/`.

Supported UI and response languages: English (default), தமிழ், తెలుగు, ಕನ್ನಡ, മലയാളം, हिन्दी. The selected language is saved under the separate localStorage key `ai-sahaay.multilingual.language`.

## Run locally

Start the existing backend in one terminal from the project root:

```powershell
.\venv312\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Start the isolated multilingual adapter in another terminal, also from the project root:

```powershell
.\venv312\Scripts\python.exe -m uvicorn multilingual_adapter.main:app --host 127.0.0.1 --port 8001
```

Open `http://127.0.0.1:8001/`. The adapter reads `GEMINI_API_KEY` and optional `GEMINI_MODEL` from the project `.env`. Configure `AI_SAHAAY_API_URL` there only if the existing backend is running at another address. Never expose the Gemini key to the browser.

The sidecar uses the existing backend's `GET /search` endpoint after translating the question to English, then generates a response in the selected language from those retrieved records. The recommendation screen forwards the existing `/recommend` profile contract and translates the returned descriptive fields. Scheme names and official URLs are preserved. Errors from either service are shown in the selected UI language.

This sidecar has not been attached to the existing frontend homepage. To use it alongside the current application, open its separate URL. It requires a reachable existing backend, a working Gemini API key, and network access to Gemini for translation and answer generation.
