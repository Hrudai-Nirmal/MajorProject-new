# Frontend Context

## Purpose

Next.js dashboard for browsing the disclosure benchmark, comparing US and India companies, viewing
risk/topic indexes, and asking retrieval-grounded questions.

## Key Decisions

- The dashboard reads data through the FastAPI API rather than directly from Supabase.
- The dashboard error state distinguishes a dead API from a healthy API with broken Supabase access,
  because `/api/health` can pass while document queries still fail.
- Document cards and detail pages surface source fidelity so users can tell full-transcript-derived
  India records from shorter curated summaries.
- Until the live Supabase table has the `source_fidelity` column, the UI falls back to `doc_id`
  (`_full_` means full transcript) so the distinction is still visible.

## Gotchas

- `NEXT_PUBLIC_API_URL` must point at the deployed FastAPI service, not the frontend domain.
- Document-list failures often come from backend Supabase configuration or project availability,
  especially when the API process itself is still reachable.
