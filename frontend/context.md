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
- The home page filters by source fidelity and counts distinct companies separately from
  disclosure records. Detail pages show financial-field coverage and an explicit pending state.
- New official release excerpts are labeled separately from paraphrased summaries; new
  sentiment results can come from a different model and must not be described by the existing F1.

## Gotchas

- `NEXT_PUBLIC_API_URL` must point at the deployed FastAPI service, not the frontend domain.
- Document-list failures often come from backend Supabase configuration or project availability,
  especially when the API process itself is still reachable.
