# Cross-Market LLM Disclosure Analysis — Pilot Report

*Course pilot / proof-of-concept. Report generated 2026-08-11, updated 2026-08-12 after expanding
the dataset from 10 to 20 companies — every number below comes from `benchmark/metrics.json`,
`benchmark/retrieval_metrics.json`, or the live Supabase database, not estimated or reconstructed
after the fact.*

## 1. Executive Summary

This pilot built a RAG pipeline that ingests earnings-call and concall transcripts for ten
sector-matched US/India company pairs, extracts sentiment, risk flags, topics, and financial
ratios via LLM, stores everything in a pgvector-backed Postgres database, and serves it through a
FastAPI backend and Next.js dashboard with retrieval-grounded chat.

The headline finding — the cross-market generalization gap the project set out to measure — is a
**0.219 macro-F1 gap** between US sentiment-classification performance (0.713) and India
performance (0.493), on the full 20-company / 82-chunk dataset. Retrieval quality, by contrast,
showed **no meaningful market gap**: both markets scored well on a self-retrieval sanity check
(MRR 0.956 US, 0.927 India), which narrows the likely cause of the sentiment gap toward the
classification/labeling step rather than the embedding or retrieval step. Section 5 discusses this
in more depth, including a caveat that matters more than the headline number: the gold labels used
to compute it are AI-generated, not independently hand-labeled (Section 6), so the specific
magnitude of the gap should be read as illustrative for this course pilot rather than a rigorous
empirical result.

## 2. Methodology

**Data.** Twenty disclosures — ten US (AAPL, JPM, MSFT, PFE, WMT, XOM, F, VZ, PG, V) and ten India
(TCS, HDFC Bank, Infosys, Reliance, Sun Pharma, ONGC, Tata Motors, Bharti Airtel, Hindustan
Unilever, Bajaj Finance), one fiscal quarter each — the original ten collected August 2025, five
more US and five more India added August 2026 to widen sector coverage (Energy, Automotive,
Telecom, FMCG, Financial Services). Sources vary in fidelity: eight US companies (AAPL, JPM, MSFT,
XOM, F, VZ, PG, V) have full Motley Fool transcript text; the other twelve documents (PFE, WMT, and
all ten India companies) are derived from search-result summaries rather than the complete call
transcript, since full transcripts for those weren't freely accessible in the collection window.
This asymmetry is a real limitation, discussed further in Section 6 — and it got *more* pronounced
with this expansion (all five new US additions happened to have full-transcript access, while all
five new India additions did not), which is worth keeping in mind when reading Section 5.

**Pipeline.** Raw text is chunked into ~150-220 word segments (`scripts/chunk_documents.py`,
stdlib-only, no network calls), producing 82 chunks total (57 US, 25 India). Each chunk is embedded
with Gemini's `gemini-embedding-001` (truncated to 768 dimensions via `outputDimensionality`, since
pgvector's `ivfflat`/`hnsw` index types cap at 2,000 dimensions and the model's native output is
3,072) and stored in Supabase Postgres with the `pgvector` extension. Sentiment/risk/topic
extraction and financial-ratio extraction run on Groq (`llama-3.3-70b-versatile` for sentiment
extraction and chat, `openai/gpt-oss-120b` for financial ratios and — after Gemini's free tier
proved billing-gated for `generateContent` — for the gold-label adjudication pass too). Retrieval
is a plain cosine-similarity `ORDER BY ... LIMIT` query via a Postgres function (`match_chunks`);
notably, **no approximate-nearest-neighbor index is used**, after an `ivfflat` index tried early on
was found to silently return zero results for some real queries on a table this small (see Section
6.3) — a sequential scan over 82 rows is both exact and effectively instant, so there's no
approximation trade-off worth making at this scale.

**Evaluation design.** Per `docs/METHODOLOGY.md` §A.2, sentiment classification is scored with
per-class precision/recall/F1, macro-averaged, segmented by market; the cross-market gap is
`Macro-F1(US) − Macro-F1(India)`. Retrieval quality (§A.3) is scored with Recall@k and Mean
Reciprocal Rank. Both are reported below with the label-provenance caveats that apply to each.

## 3. Benchmark: Sentiment Classification (P/R/F1 by Market)

82/82 benchmark chunks have a gold label. Source: `benchmark/metrics.json`.

### US (n=57)

| Class | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| Positive | 0.947 | 0.90 | 0.923 | 40 |
| Negative | 1.00 | 0.429 | 0.60 | 7 |
| Neutral | 0.50 | 0.80 | 0.615 | 10 |

**Macro-F1: 0.713** · Accuracy: 0.825

### India (n=25)

| Class | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| Positive | 1.00 | 0.545 | 0.706 | 11 |
| Negative | 0.00 | 0.00 | 0.00 | 2 |
| Neutral | 0.632 | 1.00 | 0.774 | 12 |

**Macro-F1: 0.493** · Accuracy: 0.72

### Cross-market gap

**Macro-F1(US) − Macro-F1(India) = 0.7128 − 0.4934 = 0.2195**

The negative class is still the weak point in both markets, and its near-zero India score (F1 =
0.00 on only 2 support examples) is doing a lot of the work in the gap — with just 2 negative
examples in the India subset and 7 in the US subset, this benchmark is still too small for the
negative-class numbers specifically to be trustworthy. The positive and neutral classes tell a
more stable story: US positive F1 (0.923) comfortably beats India positive F1 (0.706), and the
pattern holds directionally even setting the negative class aside. Notably, the gap *widened* after
adding 10 more companies (0.161 → 0.219) rather than narrowing toward zero as the sample grew,
which is mild evidence against "this was just small-sample noise" and mild evidence for the data
fidelity explanation in Section 5, since the fidelity asymmetry between markets also widened over
the same expansion.

## 4. Retrieval Quality (Recall@k, MRR, Latency by Market)

Source: `benchmark/retrieval_metrics.json`. Method: each chunk's own Groq-generated summary is used
as a synthetic query, and we check whether querying it retrieves the chunk it summarizes — a
self-retrieval sanity check, not a human-curated relevance benchmark (see Section 6.2 for why).

| Market | n | Recall@1 | Recall@3 | Recall@5 | Recall@10 | MRR | Latency (mean / p95) |
|---|---|---|---|---|---|---|---|
| US | 57 | 0.912 | 1.00 | 1.00 | 1.00 | 0.956 | 645ms / 789ms |
| India | 25 | 0.88 | 1.00 | 1.00 | 1.00 | 0.927 | 632ms / 714ms |

Both markets retrieve near-perfectly and at essentially identical latency. This is a meaningful
data point for Section 5: whatever is driving the sentiment-classification gap, it is not a
retrieval-quality or embedding-quality problem — the embedding model treats US and India text
symmetrically well on this measure.

## 5. Cross-Market Generalization Gap: Discussion

The 0.219 macro-F1 gap sits entirely in the classification/extraction step, not retrieval. Three
candidate explanations, in rough order of how well the data supports them:

**Data fidelity asymmetry (most likely driver, and it got worse).** All ten India documents and two
of the ten US documents (PFE, WMT) are search-summary-derived rather than full transcripts, while
eight US documents (AAPL, JPM, MSFT, XOM, F, VZ, PG, V) have complete call text. A model extracting
sentiment from a search-engine's summary of a call has systematically less context — tone, hedging,
analyst-management back-and-forth — than one reading the full transcript. Since 100% of the India
subset falls into the lower-fidelity category and only 20% of the US subset does (down from 60% in
the original 10-company pilot, since 4 of the 5 newly-added US companies had full-transcript
access), this asymmetry alone could produce exactly the kind of gap observed, independent of any
genuine cross-market difficulty difference — and it plausibly explains why the gap widened rather
than narrowed as the dataset grew.

**Transcript formatting/terminology differences.** India concall transcripts use different
conventions (INR crore/lakh figures, RBI/SEBI-specific terminology, different call structure) that
weren't present in the training distribution's most common financial-text sources to the same
degree as US 10-K/earnings-call boilerplate. This is plausible but not directly measurable from
this pilot's data — it's confounded with the fidelity issue above, since the India subset is also
100% search-summary-derived.

**Genuine small-sample noise.** With only 25 India benchmark chunks (versus 57 US), a handful of
different classifications still move the macro-F1 substantially — the negative-class India F1 of
0.00 rests on just 2 support examples. The sample roughly doubled in this expansion and the gap
widened rather than shrank, which weakens (but doesn't eliminate) the small-sample-noise
explanation relative to the data-fidelity one above.

Given the confound between data fidelity and market, **this pilot cannot cleanly attribute the gap
to market/language/terminology effects versus data-collection-quality effects** — resolving that
would require an India subset with the same transcript-completeness distribution as the US subset,
which is the single highest-value follow-up if this work continues.

## 6. Limitations

**6.1 Data fidelity asymmetry.** Covered in Section 5 — eight of twenty documents have full
transcript text, twelve are search-summary derived, and the India subset (10/10) is entirely in the
latter category. This is very likely the dominant confound in the cross-market comparison, and it
grew more pronounced (not less) when the dataset was expanded from 10 to 20 companies.

**6.2 Gold labels are AI-generated, not independently hand-labeled.** `docs/METHODOLOGY.md`'s
original design calls for a human to read each chunk and adjudicate a gold sentiment/risk/topic
label against the Loughran-McDonald lexical score as an aid. By explicit decision for this course
pilot, that step was done by AI instead: for the original 36 chunks, the first 19 by Gemini
(`gemini-flash-latest`, which hit its 20-requests/day free-tier cap partway through the run), the
remaining 17 by Groq (`openai/gpt-oss-120b`); the 46 chunks added with the 10 new companies were
all labeled by Groq (`openai/gpt-oss-120b`) — deliberately a different model family from the
`llama-3.3-70b-versatile` used for the extractions being evaluated, so the comparison is a
cross-model check rather than a model grading itself, but it is still not an independent human
judgment. `benchmark_labels.labeled_by` records exactly which model produced each row if this needs
auditing later. Retrieval evaluation (Section 4) has an analogous limitation: no human-curated
query/relevance set exists, so a self-retrieval proxy was used instead (see the method note in
`scripts/evaluate_retrieval.py`).

**6.3 A real retrieval bug existed in production and was fixed mid-project.** An `ivfflat`
similarity index (`lists=50`) was applied to the `chunks` table early in deployment. Verifying the
live chat feature against a query it hadn't been tested with ("What did Infosys say about
margins?") surfaced that this index caused `match_chunks` to silently return **zero rows** for some
real queries, despite relevant chunks clearly existing (confirmed via a raw-SQL A/B test: the
indexed query returned 0 rows, a forced sequential scan on the identical query returned 5 relevant
chunks at similarity 0.68-0.76). Root cause: `lists=50` massively over-partitions an index over
only 36 rows, and `ivfflat`'s default single-probe search can miss the correct partition entirely
for some query vectors. The index was dropped in favor of an exact sequential scan, which is both
correct and effectively instant at this table size. This is disclosed here because it means any
external testing of the live app *before* this fix (if screenshots or notes exist from that window)
would show broken chat results for an unpredictable subset of queries — not a pipeline design flaw,
but a real bug that shipped and was later caught and fixed.

**6.4 Single model tier, single quarter, small sample.** One LLM stack (Gemini embeddings + Groq
generation), one fiscal quarter per company, 82 benchmark chunks total across 20 companies. No
claim here generalizes to other model tiers, other quarters, or a still-larger company set without
further work.

**6.5 Financial ratio extraction is incomplete by design, not by error.** `scripts/extract_financials.py`
only reports figures explicitly stated in the collected excerpt; many standard ratios (operating
margin, net margin, EBITDA margin, free cash flow — see each document's financial snapshot page)
are null for most companies simply because the source excerpt didn't state them. Walmart and HDFC
Bank have no revenue figure at all, for the same reason. These are honest gaps, not fabricated
zeros — but they mean the financial-ratio dataset is too sparse for company-to-company ratio
comparisons in its current state.

**6.6 Academic integrity disclosure.** Per this project's own `REQUIREMENTS.md` §3.7: this pipeline
and this report were built with substantial AI-tool assistance (Claude for build/debugging
assistance throughout; Gemini and Groq models for the extraction, embedding, and gold-labeling
steps documented above). Check your institution's disclosure policy for how this should be
represented in a submission.

## 7. Appendix

### 7.1 Company list and sources

| Market | Ticker | Company | Sector | Period | Source fidelity |
|---|---|---|---|---|---|
| US | AAPL | Apple Inc. | Technology | Q3 FY2025 (June qtr) | Full transcript (Motley Fool) |
| US | JPM | JPMorgan Chase & Co. | Banking | Q2 2025 | Full transcript (Motley Fool) |
| US | MSFT | Microsoft Corporation | Technology | Q4 FY2025 (qtr ended Jun 30, 2025) | Full transcript (Motley Fool) |
| US | PFE | Pfizer Inc. | Pharma | Q2 2025 | Search summary |
| US | WMT | Walmart Inc. | Retail / Consumer | Q2 FY2026 | Search summary |
| US | XOM | Exxon Mobil Corporation | Energy | Q1 2026 | Full transcript (Motley Fool) |
| US | F | Ford Motor Company | Automotive | Q1 2026 | Full transcript (Motley Fool) |
| US | VZ | Verizon Communications Inc. | Telecom | Q1 2026 | Full transcript (Motley Fool) |
| US | PG | The Procter & Gamble Company | Consumer Staples / FMCG | Q3 FY2026 | Full transcript (Motley Fool) |
| US | V | Visa Inc. | Financial Services | Q2 FY2026 | Full transcript (Motley Fool) |
| India | TCS | Tata Consultancy Services | Technology | Q1 FY26 (qtr ended Jun 2025) | Search summary |
| India | HDFC | HDFC Bank Ltd | Banking | Q1 FY26 | Search summary |
| India | INFY | Infosys Ltd | Technology | Q1 FY26 | Search summary |
| India | RIL | Reliance Industries Ltd | Retail / Consumer | Q1 FY26 (qtr ended Jun 2025) | Search summary |
| India | Sun | Sun Pharmaceutical Industries Ltd | Pharma | Q1 FY26 | Search summary |
| India | ONGC | Oil and Natural Gas Corporation Ltd | Energy | Q1 FY27 (qtr ended Jun 2026) | Search summary |
| India | TATAMOTORS | Tata Motors Ltd | Automotive | Q4 FY26 (qtr ended Mar 2026) | Search summary |
| India | BHARTIARTL | Bharti Airtel Ltd | Telecom | Q1 FY27 (qtr ended Jun 2026) | Search summary |
| India | HINDUNILVR | Hindustan Unilever Ltd | Consumer Staples / FMCG | Q1 FY27 (qtr ended Jun 2026) | Search summary |
| India | BAJFINANCE | Bajaj Finance Ltd | Financial Services | Q1 FY27 (qtr ended Jun 2026) | Search summary |

### 7.2 Sector-specific financial ratios extracted

Only where explicitly stated in the collected excerpt (`scripts/extract_financials.py`):

- JPMorgan Chase — ROTCE 21%
- HDFC Bank — Credit-Deposit Ratio 95%
- TCS — Attrition rate 13.8% (LTM)

### 7.3 Labeling guidelines used for gold-label adjudication

See the prompt in `scripts/label_benchmark_gold.py`: sentiment judged on management's tone in that
specific excerpt (not general stock performance), risk flags and topics limited to what's actually
disclosed in the excerpt. Full provenance disclosure in `REQUIREMENTS.md`.

### 7.4 Reproducing these numbers

```
python scripts/chunk_documents.py         # data/raw -> data/processed/chunks.jsonl
python scripts/embed_and_store.py         # embeds + stores in Supabase
python scripts/run_extraction.py          # sentiment/risk/topic extraction (Groq)
python scripts/extract_financials.py      # financial ratios (Groq)
python scripts/compute_lm_scores.py       # LM lexical score (labeling aid)
python scripts/label_benchmark_gold.py    # AI-adjudicated gold labels (see 6.2)
python scripts/evaluate.py                # -> benchmark/metrics.json (Section 3)
python scripts/evaluate_retrieval.py      # -> benchmark/retrieval_metrics.json (Section 4)
```
