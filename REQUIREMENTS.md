# Project Requirements

Cross-Market LLM Disclosure Analysis — pilot study. Compiled from the locked stack and current build state.

## 1. Technical Requirements

### 1.1 Accounts / credentials
| Item | Status | Notes |
|---|---|---|
| Gemini API key (Google AI Studio) | Have it | Confirmed working key, tied to Google AI Pro plan |
| Supabase project | Partial | Have URL + `anon`/publishable key. Still need the **`service_role`** key for backend writes (Settings → API) |
| Supabase schema applied | **Not done** | `backend/schema.sql` needs to be run in the Supabase SQL Editor — nothing exists in the DB yet |
| Render account | Needed | For FastAPI backend deploy (free tier) |
| Vercel account | Needed | For Next.js frontend deploy (free tier) |
| GitHub PAT with repo write access | **Blocked** | Current token authenticates but is denied push access — needs "Contents: Read and write" scoped to `MajorProject-new` |

### 1.2 Runtime / dependencies
- Backend: Python 3.11+, `fastapi`, `uvicorn`, `google-generativeai`, `supabase-py`, `pydantic`, `python-dotenv`, `httpx` (all in `backend/requirements.txt`)
- Frontend: Node.js 18+, Next.js 14.2.35, Tailwind CSS — scaffolded and live-tested (dashboard, per-document report, chat page, all reading through the FastAPI backend rather than calling Supabase directly, so no anon key is needed client-side yet)
- Database: Postgres with `pgvector` extension (Supabase-managed)

### 1.3 Network / deployment
- Render and Vercel both need unrestricted outbound access to `generativelanguage.googleapis.com` and `*.supabase.co` — this is a non-issue on those platforms (only my dev sandbox here has a restrictive allowlist, which is why I couldn't live-test the Gemini/Supabase calls directly)
- CORS: backend currently allows `*`, should be tightened to the Vercel domain once deployed
- Environment variables: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` on Render (backend only, never exposed to frontend); `NEXT_PUBLIC_SUPABASE_URL` + anon key on Vercel (frontend, safe to expose — protected by RLS)

### 1.4 Data source access
- SEC EDGAR: public, free, no key required. Best practice is a descriptive `User-Agent` header with contact info on automated requests (SEC's fair-access policy)
- Earnings/concall transcripts: pulled from Motley Fool and company IR sites — no API, manual/search-based collection (see §3.2 for the copyright angle)
- Loughran-McDonald dictionary: free download from University of Notre Dame's site

## 2. Financial Requirements

| Component | Tier | Expected cost |
|---|---|---|
| Gemini API (embeddings + generation) | Google AI Pro plan (existing) | $0 marginal, **but verify below** |
| Supabase | Free tier (500MB DB, 1GB storage, 2GB bandwidth) | $0 — well within limits for ~20 documents |
| Render | Free web service tier | $0 — note: spins down after ~15 min idle, ~30s cold start |
| Vercel | Hobby (free) plan | $0 |
| GitHub | Free tier | $0 |
| Domain name | Not required — `*.vercel.app` / `*.onrender.com` subdomains work fine | $0 |

**One thing to verify, not assume:** Google's consumer "AI Pro" subscription (Gemini app / Google One) and the **developer API** billing (`generativelanguage.googleapis.com`, what our backend calls) are historically separate products. Some Pro plans include a bundled API quota; others don't, and API usage bills separately through a linked Cloud Billing account once you exceed the free tier. Worth checking your Google AI Studio billing page before the demo so there's no surprise charge — flagging this rather than assuming $0 across the board.

**Total expected cost: $0**, assuming everything stays on free tiers and the Gemini Pro plan does cover our API calls.

## 3. Legal / Compliance Requirements

### 3.1 SEC EDGAR data
Public domain, free to use and redistribute. No licensing concern.

### 3.2 Earnings call transcripts (Motley Fool, company IR PDFs)
These are typically copyrighted by the publisher (or the company, for IR-hosted PDFs). Using short excerpts for non-commercial academic analysis is generally defensible as fair use, but:
- Don't commit full verbatim transcripts to a **public** GitHub repo or expose them wholesale in the public dashboard — store derived signals (sentiment/risk/summary) publicly, keep source excerpts as supporting evidence rather than full republished text
- Currently `data/raw/**/*.pdf` and `.html` are gitignored, but the `.txt` excerpts I've been writing are **not** — worth deciding whether those should stay untracked too, given they contain sourced transcript quotes
- Always retain the source attribution (already doing this in each file's header)

### 3.3 NSE/BSE disclosures
Regulatory filings, generally free to access; factual content can be republished, but bulk scraping/redistribution of full announcement PDFs may be subject to exchange-specific terms of use if this scales beyond the pilot's 5 companies.

### 3.4 Loughran-McDonald dictionary
Free for academic/research use with attribution (Notre Dame). No cost, no restrictive license for this use case.

### 3.5 Gemini API terms
Review Google's Generative AI Prohibited Use Policy and API terms re: data retention/training use of submitted text. Not a concern here since all input data is already-public corporate disclosures, not confidential material — but worth a quick read given results feed a dashboard.

### 3.6 Investment-advice disclaimer
The dashboard surfaces sentiment/risk signals derived from financial disclosures — close enough to "investment analysis" that a visible disclaimer is warranted: **for research/educational purposes only, not investment advice.** This also matters because SEBI (India) and the SEC (US) both regulate investment advisory activity: a disclaimer keeps the tool clearly on the "research assistant" side of that line rather than looking like unregistered advisory output.

### 3.7 Academic integrity
Since this is a course deliverable, worth a quick check of your institution's policy on disclosing AI-tool usage (Gemini for extraction, and this session for build assistance) in the writeup/README — most programs are fine with it as long as it's disclosed, but policies vary.

### 3.8 Data privacy
No personal/private individual data is processed — inputs are public corporate disclosures and public statements by company executives on investor calls. No GDPR or India's DPDP Act exposure from this pipeline as currently scoped.

---
**Status as of 2026-08-10:** Schema applied to Supabase, 10 documents / 36 chunks embedded and stored, all 36 chunks extracted (Groq, since Gemini generateContent is billing-gated on Google AI Pro — embeddings stay on Gemini), LM dictionary scores computed as a labeling aid, frontend scaffolded and live-tested end to end against real data, repo pushed to GitHub.

**Benchmark gold labels — provenance disclosure (important for the writeup, §3.7):**
`benchmark_labels.gold_sentiment` / `gold_risk_flags` / `gold_topics` are **not** independent
human labels. docs/METHODOLOGY.md's design assumes a human adjudicates each chunk against the
LM score aid (§A.1, §A.4); by explicit decision (this is a course pilot, not a research-grade
benchmark), that step was done by AI instead — the first 19 chunks by Gemini
(`gemini-flash-latest`, which hit its 20-requests/day free-tier cap partway through) and the
remaining 17 by Groq (`openai/gpt-oss-120b`), a different model family from the
`llama-3.3-70b-versatile` used to generate the extractions being evaluated, so the comparison
isn't purely a model grading itself. Each row's `labeled_by` column records exactly which model
produced it. `scripts/evaluate.py` result as of this run: US macro-F1 0.71, India macro-F1 0.55,
gap 0.16 — directionally the finding the project is testing for, but treat the specific numbers
as illustrative given the label provenance above, not as a rigorous result. **Disclose this in
the writeup per §3.7** rather than presenting it as hand-labeled.

**Open items requiring your action:**
- Render/Vercel account creation + deploy
- Confirming Gemini API billing status (only matters if you want to move generation back off Groq later)
- Decision on whether to keep `.txt` transcript excerpts out of git
