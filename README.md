# Cross-Market LLM Disclosure Analysis (Pilot)

Pilot RAG pipeline comparing US and India corporate disclosure analysis across matched sectors.
The project measures whether an LLM sentiment/risk extraction pipeline performs equally well on
Indian corporate disclosures as it does on US disclosures, then serves the results through a live
dashboard and retrieval-grounded chat interface.

## Stack
- Embeddings: Gemini `gemini-embedding-001` (768-dim). Generation (extraction, financial ratios,
  chat, gold-label adjudication): Groq `openai/gpt-oss-120b` — Gemini's `generateContent` is
  billing-gated on this project's Google AI Pro plan, `embedContent` isn't, see REQUIREMENTS.md
- Vector DB: Supabase (Postgres + pgvector), free tier — no ANN index at this scale, see schema.sql
- Backend: FastAPI, deployed on Render free tier
- Frontend: Next.js + Tailwind, deployed on Vercel free tier
- Benchmark labeling aid: Loughran-McDonald financial sentiment dictionary

## Structure
```
data/
  raw/us/          # US earnings-call transcripts and search-summary disclosures
  raw/india/       # India earnings/concall search-summary disclosures
  processed/        # cleaned + chunked output
scripts/            # collection, cleaning, chunking, embedding, eval scripts
backend/app/
  routers/          # FastAPI route handlers
  services/         # Gemini calls, Supabase client, retrieval logic
  models/           # pydantic schemas
frontend/            # Next.js dashboard
benchmark/           # AI-adjudicated labels + evaluation results
```

## Companies (13 sector-matched pairs)
| Sector | US | India |
|---|---|---|
| Technology | MSFT | INFY |
| Technology | AAPL | TCS |
| Banking | JPM | HDFC Bank |
| Pharma | PFE | Sun Pharma |
| Retail/Consumer | WMT | RIL |
| Energy | XOM | ONGC |
| Automotive | F | Tata Motors |
| Telecom | VZ | Bharti Airtel |
| FMCG | PG | Hindustan Unilever |
| Financial Services | V | Bajaj Finance |
| Semiconductors / Electronics | NVDA | Dixon Technologies |
| Industrials / Capital Goods | CAT | Larsen & Toubro |
| Beverages / Consumer Staples | KO | Varun Beverages |

## Status
Scope: pilot / proof-of-concept, single model stack (Gemini for embeddings, Groq for generation),
32 documents / 128 benchmark chunks, cross-market generalization as the primary research question.
Current benchmark result: US macro-F1 0.717 vs India macro-F1 0.653 (gap 0.063) — see
`benchmark/metrics.json` and REQUIREMENTS.md for the gold-label provenance disclosure
(AI-adjudicated, not independently hand-labeled).

## Report
See [docs/REPORT.md](docs/REPORT.md) for the full write-up: methodology, benchmark tables,
retrieval quality, the cross-market gap discussion, and limitations (including the AI-label
provenance disclosure and a real production bug that was caught and fixed mid-project).

## Deployment
See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Render (backend) + Vercel (frontend), both need a
one-time manual account/GitHub-authorization step, config is otherwise ready (`render.yaml`).
