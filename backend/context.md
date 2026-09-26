# Backend Context

## Purpose

FastAPI service for the disclosure dashboard. It reads disclosure, extraction, benchmark, and
financial-snapshot data from Supabase and exposes those records to the Next.js frontend.

## Key Decisions

- Document routes translate Supabase connection-level failures into HTTP 503 responses so frontend
  users see a service-unavailable state instead of an opaque 500 traceback.
- The 503 detail intentionally points maintainers at `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY`, because a bad Render environment variable or paused/deleted
  Supabase project is the most likely cause when `/api/health` works but `/api/documents/` fails.
- `GROQ_GENERATION_MODEL` defaults to `openai/gpt-oss-120b` because the previous
  `llama-3.3-70b-versatile` model is no longer available to this Groq key.
- `documents.source_fidelity` distinguishes short curated excerpts from full-transcript-derived
  India documents, which lets the evaluation compare source quality instead of treating all
  disclosures as equally complete.

## Gotchas

- `/api/health` only proves the FastAPI process is alive; it does not prove Supabase is reachable.
- Keep literal routes such as `/metrics` registered before `/{document_id}` to avoid FastAPI route
  shadowing.
- If live ingestion warns about `source_fidelity`, apply `backend/schema.sql` in Supabase and rerun
  `scripts/embed_and_store.py`; the script only falls back so chunk ingestion can continue.
