# Cross-Market LLM Disclosure Analysis — Pilot Report

*Course pilot / proof-of-concept. Report generated 2026-08-11, updated 2026-09-26 after expanding
the dataset to 13 company pairs plus six full-source India variants — every number below comes from `benchmark/metrics.json`,
`benchmark/retrieval_metrics.json`, or the live Supabase database, not estimated or reconstructed
after the fact.*

## 1. Executive Summary

This pilot built a RAG pipeline that ingests earnings-call and concall transcripts for thirteen
sector-matched US/India company pairs, extracts sentiment, risk flags, topics, and financial
ratios via LLM, stores everything in a pgvector-backed Postgres database, and serves it through a
FastAPI backend and Next.js dashboard with retrieval-grounded chat.

The headline finding — the cross-market generalization gap the project set out to measure — is now
a **0.063 macro-F1 gap** between US sentiment-classification performance (0.717) and India
performance (0.653), on the full 32-document / 128-chunk dataset. This narrowed materially after
adding six full-source-derived India disclosure variants, which supports the project’s main
diagnosis: source completeness was a large confound in the earlier India underperformance.
Retrieval quality remains healthy, though the larger India set is harder on the self-retrieval
proxy (MRR 0.947 US, 0.827 India). Section 5 discusses this in more depth, including a caveat that
matters more than the headline number: the gold labels used to compute it are AI-generated, not
independently hand-labeled (Section 6), so the specific magnitude of the gap should be read as
illustrative for this course pilot rather than a rigorous empirical result.

## 2. Methodology

**Data.** Thirty-two disclosure records — thirteen US (AAPL, JPM, MSFT, PFE, WMT, XOM, F, VZ, PG, V,
NVDA, CAT, KO) and thirteen India (TCS, HDFC Bank, Infosys, Reliance, Sun Pharma, ONGC, Tata
Motors, Bharti Airtel, Hindustan Unilever, Bajaj Finance, Dixon Technologies, Larsen & Toubro,
Varun Beverages), plus six fuller India source variants for Infosys, TCS, HDFC Bank, Reliance,
Larsen & Toubro, and Varun Beverages. The September 2026 expansion added semiconductors /
electronics, industrials / capital goods, beverages / consumer staples, and then a first source-
fidelity slice for core India names. Sources still vary in fidelity, but the added India variants
reduce the earlier one-sided summary-source bias.

**Pipeline.** Raw text is chunked into ~150-220 word segments (`scripts/chunk_documents.py`,
stdlib-only, no network calls), producing 128 chunks total (64 US, 64 India). Each chunk is embedded
with Gemini's `gemini-embedding-001` (truncated to 768 dimensions via `outputDimensionality`, since
pgvector's `ivfflat`/`hnsw` index types cap at 2,000 dimensions and the model's native output is
3,072) and stored in Supabase Postgres with the `pgvector` extension. Sentiment/risk/topic
extraction and financial-ratio extraction run on Groq (`openai/gpt-oss-120b` for sentiment
extraction, chat, financial ratios, and — after Gemini's free tier
proved billing-gated for `generateContent` — for the gold-label adjudication pass too). Retrieval
is a plain cosine-similarity `ORDER BY ... LIMIT` query via a Postgres function (`match_chunks`);
notably, **no approximate-nearest-neighbor index is used**, after an `ivfflat` index tried early on
was found to silently return zero results for some real queries on a table this small (see Section
6.3) — a sequential scan over 128 rows is both exact and effectively instant, so there's no
approximation trade-off worth making at this scale.

**Evaluation design.** Per `docs/METHODOLOGY.md` §A.2, sentiment classification is scored with
per-class precision/recall/F1, macro-averaged, segmented by market; the cross-market gap is
`Macro-F1(US) − Macro-F1(India)`. Retrieval quality (§A.3) is scored with Recall@k and Mean
Reciprocal Rank. Both are reported below with the label-provenance caveats that apply to each.

## 3. Benchmark: Sentiment Classification (P/R/F1 by Market)

128/128 benchmark chunks have a gold label. Source: `benchmark/metrics.json`.

### US (n=64)

| Class | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| Positive | 0.956 | 0.915 | 0.935 | 47 |
| Negative | 1.00 | 0.429 | 0.60 | 7 |
| Neutral | 0.50 | 0.80 | 0.615 | 10 |

**Macro-F1: 0.717** · Accuracy: 0.844

### India (n=64)

| Class | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| Positive | 0.808 | 0.750 | 0.778 | 28 |
| Negative | 1.00 | 0.250 | 0.400 | 4 |
| Neutral | 0.730 | 0.844 | 0.783 | 32 |

**Macro-F1: 0.653** · Accuracy: 0.766

### Cross-market gap

**Macro-F1(US) − Macro-F1(India) = 0.7167 − 0.6535 = 0.0633**

The negative class is still the weak point in both markets, but the additional full-source India
variants lifted India negative F1 from zero to 0.400 and doubled India support from 34 to 64
chunks overall. The positive and neutral classes are now much closer across markets than before:
US positive F1 remains higher, while India neutral F1 is stronger than the US neutral score. The
latest source-fidelity slice narrowed the gap from about 0.192 to 0.063, making source completeness
the strongest current explanation for the earlier market gap.

## 4. Retrieval Quality (Recall@k, MRR, Latency by Market)

Source: `benchmark/retrieval_metrics.json`. Method: each chunk's own Groq-generated summary is used
as a synthetic query, and we check whether querying it retrieves the chunk it summarizes — a
self-retrieval sanity check, not a human-curated relevance benchmark (see Section 6.2 for why).

| Market | n | Recall@1 | Recall@3 | Recall@5 | Recall@10 | MRR | Latency (mean / p95) |
|---|---|---|---|---|---|---|---|
| US | 64 | 0.906 | 0.984 | 0.984 | 1.00 | 0.947 | 663ms / 753ms |
| India | 64 | 0.734 | 0.922 | 0.969 | 0.984 | 0.827 | 655ms / 753ms |

Both markets retrieve quickly. The larger India set is less near-perfect than the prior smaller
set, mainly because the new full-source variants add semantically overlapping chunks for the same
companies and periods. This is still acceptable for a 10-result retrieval window, but it is now a
real follow-up area rather than a solved component.

## 5. Cross-Market Generalization Gap: Discussion

The 0.063 macro-F1 gap sits primarily in the classification/extraction step, though retrieval now
also shows a smaller India-side degradation on the self-retrieval proxy. Three
candidate explanations, in rough order of how well the data supports them:

**Data fidelity asymmetry (most likely driver, now partially tested).** Adding six fuller India
source variants materially improved India macro-F1 and narrowed the gap. That is direct evidence
that a model extracting sentiment from a summary has less context — tone, hedging,
analyst-management back-and-forth — than one reading fuller disclosure text.

**Transcript formatting/terminology differences.** India concall transcripts use different
conventions (INR crore/lakh figures, RBI/SEBI-specific terminology, different call structure) that
weren't present in the training distribution's most common financial-text sources to the same
degree as US 10-K/earnings-call boilerplate. This is plausible but still not cleanly isolated from
source fidelity, even after the first India full-source slice.

**Genuine small-sample noise.** With 64 India benchmark chunks and only 4 India negative examples,
a handful of different classifications still move macro-F1 substantially. The sample is larger
than the original pilot but still too small for strong inferential claims.

Given the remaining confound between data fidelity and market, **this pilot still cannot cleanly
attribute the residual gap to market/language/terminology effects versus data-collection-quality
effects**. However, the first source-fidelity slice shows that improving India source quality moves
the metric in the expected direction, which should shape the next expansion.

## 6. Limitations

**6.1 Data fidelity asymmetry.** Covered in Section 5 — source completeness still differs by
market, although six fuller India variants now reduce that imbalance. This remains the dominant
confound in the cross-market comparison.

**6.2 Gold labels are AI-generated, not independently hand-labeled.** `docs/METHODOLOGY.md`'s
original design calls for a human to read each chunk and adjudicate a gold sentiment/risk/topic
label against the Loughran-McDonald lexical score as an aid. By explicit decision for this course
pilot, that step was done by AI instead: for the original 36 chunks, the first 19 by Gemini
(`gemini-flash-latest`, which hit its 20-requests/day free-tier cap partway through the run), the
remaining 17 by Groq (`openai/gpt-oss-120b`); the later 92 chunks added through the corpus and
source-fidelity expansions were also labeled by Groq (`openai/gpt-oss-120b`). The labels are still not an
independent human judgment. `benchmark_labels.labeled_by` records exactly which model produced each row if this needs
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
generation), one fiscal quarter per company/source variant, 128 benchmark chunks total across 32
document records. No
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
| US | NVDA | NVIDIA Corporation | Semiconductors / Electronics | Q2 FY2026 | Official earnings release |
| US | CAT | Caterpillar Inc. | Industrials / Capital Goods | Q2 2026 | Official earnings release |
| US | KO | The Coca-Cola Company | Beverages / Consumer Staples | Q2 2026 | Official earnings release |
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
| India | DIXON | Dixon Technologies (India) Ltd | Semiconductors / Electronics | Q1 FY27 | Search summary |
| India | LT | Larsen & Toubro Ltd | Industrials / Capital Goods | Q1 FY27 | Transcript summary |
| India | VBL | Varun Beverages Ltd | Beverages / Consumer Staples | Q2 CY2026 | Presentation / transcript summary |
| India | INFY | Infosys Ltd | Technology | Q1 FY26 | Full transcript-derived variant |
| India | TCS | Tata Consultancy Services | Technology | Q1 FY27 | Full transcript-derived variant |
| India | HDFC | HDFC Bank Ltd | Banking | Q1 FY26 | Full transcript-derived variant |
| India | RIL | Reliance Industries Ltd | Retail / Consumer | Q1 FY27 | Full transcript-derived variant |
| India | LT | Larsen & Toubro Ltd | Industrials / Capital Goods | Q1 FY27 | Full transcript-derived variant |
| India | VBL | Varun Beverages Ltd | Beverages / Consumer Staples | Q2 CY2026 | Full transcript-derived variant |

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
