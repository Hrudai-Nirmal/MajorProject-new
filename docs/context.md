# Docs Context

## Purpose

Project documentation for methodology, deployment, the report, and MVP/demo handoff.

## Key Decisions

- MVP messaging should present the app as a finished educational pilot, not an unfinished product.
- The headline MVP insight is that fuller India source variants narrowed the measured
  cross-market sentiment gap, making source quality a major confound.
- Demo materials must keep the AI-label and small-sample caveats visible without burying the main
  result.

## Gotchas

- Production currently deploys from GitHub's default branch, `main`; keep `main` and `master`
  aligned until the repository is consolidated to one branch.
- The untracked presentation documents in this workspace are user-owned and should not be committed
  unless explicitly requested.

## November 2026 dataset expansion

Eight source-linked quarterly releases were added for Microsoft, Apple, TCS, and Infosys
(four US and four India records). The 40-document corpus contains 148 chunks. Collection is
bounded to short excerpts so retrieval stays small; US official releases retain source text,
while India records are attributed paraphrases marked `summary_excerpt` because direct
downloads failed. The new 20 chunks are embedded and have LM dictionary scores plus local
Qwen 3.5 9B sentiment/risk/topic extraction. The configured Groq key returned 401 on
2026-11-22, so `scripts/run_extraction.py --local` was used for these records, and each
database row records the actual model. No gold labels were fabricated. Benchmark F1 still
covers only the original 128 chunks and is not comparable to the new model's outputs.
