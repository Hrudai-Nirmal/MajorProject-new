# Cross-Market LLM Disclosure Analysis (Pilot)

Pilot RAG pipeline comparing US (SEC) vs India (NSE/BSE) corporate disclosure analysis using a single free-tier LLM stack (Gemini). Built as a 3-day course demo, structured to extend afterward.

## Stack
- Embeddings: Gemini `gemini-embedding-001` (768-dim). Generation (extraction, financial ratios,
  chat): Groq (`llama-3.3-70b-versatile` + `openai/gpt-oss-120b`) — Gemini's `generateContent` is
  billing-gated on this project's Google AI Pro plan, `embedContent` isn't, see REQUIREMENTS.md
- Vector DB: Supabase (Postgres + pgvector), free tier — no ANN index at this scale, see schema.sql
- Backend: FastAPI, deployed on Render free tier
- Frontend: Next.js + Tailwind, deployed on Vercel free tier
- Benchmark labeling aid: Loughran-McDonald financial sentiment dictionary

## Structure
```
data/
  raw/us/          # SEC filings + earnings transcripts
  raw/india/       # NSE/BSE announcements + concall transcripts
  processed/        # cleaned + chunked output
scripts/            # collection, cleaning, chunking, embedding, eval scripts
backend/app/
  routers/          # FastAPI route handlers
  services/         # Gemini calls, Supabase client, retrieval logic
  models/           # pydantic schemas
frontend/            # Next.js dashboard
benchmark/           # hand-labeled CSV + evaluation results
```

## Companies (5 sector-matched pairs)
| Sector | US | India |
|---|---|---|
| Tech | MSFT | INFY |
| Tech | AAPL | TCS |
| Banking | JPM | HDFC Bank |
| Pharma | PFE | Sun Pharma |
| Retail/Consumer | WMT | RIL |

## Status
Scope: pilot / proof-of-concept, single model tier (Gemini for embeddings, Groq for generation),
36 benchmark chunks, cross-market generalization as the primary research question. Live result
as of 2026-08-10: US macro-F1 0.71 vs India macro-F1 0.55 (gap 0.16) — see `benchmark/metrics.json`
and REQUIREMENTS.md for the gold-label provenance disclosure (AI-adjudicated, not hand-labeled).

## Report
See [docs/REPORT.md](docs/REPORT.md) for the full write-up: methodology, benchmark tables,
retrieval quality, the cross-market gap discussion, and limitations (including the AI-label
provenance disclosure and a real production bug that was caught and fixed mid-project).

## Deployment
See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Render (backend) + Vercel (frontend), both need a
one-time manual account/GitHub-authorization step, config is otherwise ready (`render.yaml`).
