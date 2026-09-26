# Cross-Market LLM Disclosure Analysis: A Pilot Study of US and Indian Corporate Communications

**Author:** Hrudai Nirmal  
**Status:** Rough research-paper draft for project presentation and refinement  
**Date:** September 2026

## Abstract

Large language models are increasingly used to summarize, classify, and question-answer over
financial disclosures. However, most benchmark intuition around financial NLP is shaped by US-style
filings and earnings-call transcripts. This project investigates whether an LLM-based disclosure
analysis pipeline performs similarly on US and Indian corporate communications. The system ingests
earnings-call and concall transcripts, chunks and embeds the text, extracts sentiment, risk flags,
topics, and financial signals, and presents results through a dashboard and retrieval-grounded chat
interface. The pilot dataset contains 32 disclosure records across 13 sector-matched US/India
company pairs, producing 128 benchmark chunks. Sentiment extraction is evaluated with per-class
precision, recall, F1, macro-F1, and a US–India generalization gap.

The current MVP result shows a US macro-F1 of 0.717 and an India macro-F1 of 0.653, a gap of
0.063. This gap narrowed materially after adding fuller Indian source variants, suggesting that
source fidelity is a major confound in cross-market financial NLP evaluation. Retrieval quality
remains strong in both markets, with Recall@10 of 1.000 for US chunks and 0.984 for India chunks.
The study is best understood as an educational pilot rather than a definitive benchmark because
gold labels are AI-adjudicated and the sample remains small. Even so, the project demonstrates a
working end-to-end research and product pipeline for cross-market disclosure intelligence.

## 1. Introduction

Financial disclosures are a major information source for investors, analysts, regulators, and
researchers. Public companies explain performance, risks, guidance, and strategic priorities
through earnings calls, concall transcripts, investor presentations, annual reports, and regulatory
filings. These documents are long, semi-structured, and often written in market-specific language.
As a result, they are natural candidates for retrieval-augmented generation and LLM-based
information extraction.

However, a central question remains: does the same LLM pipeline work equally well across markets?
Financial NLP systems are often evaluated on US-heavy data, where disclosure formats, terminology,
and transcript conventions are relatively familiar. Indian corporate communications differ in
format, unit conventions, regulatory vocabulary, and transcript availability. For example, Indian
concall transcripts often mix qualitative management commentary with INR crore/lakh figures,
sector-specific metrics, and analyst questions that differ from US earnings-call norms.

This project studies that issue through a practical MVP. It builds a full-stack disclosure
analysis platform and uses it to compare extraction quality across US and Indian company
disclosures. The goal is not only to create a useful dashboard, but also to measure whether an
LLM-based pipeline generalizes across markets and where observed performance gaps may come from.

The main research question is:

> Does an LLM-based sentiment and risk extraction pipeline perform equally well on US and Indian
> corporate disclosure text?

The current answer is nuanced. The pipeline performs reasonably well in both markets, but the
measured India score initially lagged the US score. After adding fuller Indian source variants,
the India macro-F1 improved and the cross-market gap narrowed. This suggests that source quality
and transcript completeness are major confounds when comparing LLM performance across markets.

## 2. System Overview

The project is implemented as a full-stack retrieval-augmented analysis system. It has four main
layers:

1. **Data pipeline:** raw disclosure text is collected, cleaned, chunked, embedded, and stored.
2. **LLM extraction layer:** sentiment, risks, topics, and financial signals are extracted from
   each chunk or document.
3. **Evaluation layer:** extracted sentiment is compared against benchmark labels, and retrieval
   quality is evaluated using a self-retrieval proxy.
4. **Application layer:** a FastAPI backend and Next.js frontend expose the results through a
   dashboard, benchmark page, company comparison page, risk explorer, and chat interface.

The data pipeline stores documents, chunks, vector embeddings, extraction results, benchmark
labels, and financial snapshots in Supabase Postgres with pgvector. The backend exposes this data
through typed API routes. The frontend presents the results in a lightweight research dashboard.

The MVP intentionally prioritizes transparency. The app distinguishes fuller transcript-derived
records from summary-derived records through source-fidelity metadata, and the report discloses
that labels are AI-adjudicated rather than independently human-labeled.

## 3. Dataset

The pilot dataset contains 32 disclosure records from 13 sector-matched US/India company pairs.
The US side includes companies such as Microsoft, Apple, JPMorgan, Walmart, ExxonMobil, NVIDIA,
Caterpillar, and Coca-Cola. The India side includes Infosys, TCS, HDFC Bank, Reliance Industries,
Sun Pharma, ONGC, Tata Motors, Bharti Airtel, Hindustan Unilever, Bajaj Finance, Dixon
Technologies, Larsen & Toubro, and Varun Beverages.

The corpus contains 128 benchmark chunks: 64 US chunks and 64 India chunks. Six India companies
also have fuller source variants: Infosys, TCS, HDFC Bank, Reliance Industries, Larsen & Toubro,
and Varun Beverages. These fuller records were added after the initial benchmark showed a larger
US–India performance gap.

The dataset is deliberately small because this is a course-scale MVP. It is not intended to be a
statistically definitive benchmark. Instead, it is designed to demonstrate the end-to-end workflow
and surface practical issues that arise when applying LLM systems across markets.

## 4. Methodology

### 4.1 Chunking and Embedding

Raw disclosure text is chunked into approximately 150–220 word segments. Smaller chunks were used
because some source records are summary-derived and would otherwise produce too few retrieval
units. Each chunk is embedded using Gemini `gemini-embedding-001`, with output truncated to 768
dimensions. Embeddings and chunk metadata are stored in Supabase Postgres.

The project deliberately avoids approximate nearest-neighbor indexing at this scale. An earlier
ivfflat index caused some relevant queries to return zero rows because the table was too small for
the chosen index configuration. The current MVP uses exact similarity search through a sequential
scan, which is simple and fast for 128 chunks.

### 4.2 Extraction

The extraction pipeline uses Groq-hosted `openai/gpt-oss-120b` generation for:

- sentiment classification,
- risk-flag extraction,
- topic extraction,
- financial-snapshot extraction,
- retrieval-grounded chat answers,
- AI-adjudicated benchmark labels.

For financial snapshots, the prompt explicitly instructs the model to report only figures stated
in the collected text. If revenue, margin, EPS growth, free cash flow, or another metric is not
directly stated, the field remains blank. This avoids fabricated financial values.

### 4.3 Benchmarking

Sentiment classification is evaluated using precision, recall, and F1 for positive, negative, and
neutral classes. Macro-F1 is computed separately for US and India chunks. The cross-market
generalization gap is defined as:

`Macro-F1(US) - Macro-F1(India)`

Retrieval quality is evaluated using a self-retrieval proxy. Each chunk's generated summary is
used as a synthetic query, and the system checks whether the source chunk is retrieved in the top
results. Metrics include Recall@1, Recall@3, Recall@5, Recall@10, mean reciprocal rank, and
latency.

## 5. Results

### 5.1 Sentiment Classification

The current benchmark contains 128 labeled chunks. US chunks achieved a macro-F1 of 0.717 and
India chunks achieved a macro-F1 of 0.653. The resulting cross-market gap is 0.063.

| Market | n | Positive F1 | Negative F1 | Neutral F1 | Macro-F1 | Accuracy |
|---|---:|---:|---:|---:|---:|---:|
| US | 64 | 0.935 | 0.600 | 0.615 | 0.717 | 0.844 |
| India | 64 | 0.778 | 0.400 | 0.783 | 0.653 | 0.766 |

The negative class remains the weakest class in both markets. This is expected because negative
examples are rare in the dataset: the US subset has 7 negative examples and the India subset has 4.
Small changes in negative-class predictions can therefore move macro-F1 substantially.

### 5.2 Retrieval Quality

Retrieval quality is strong overall, especially at higher k values.

| Market | n | Recall@1 | Recall@3 | Recall@5 | Recall@10 | MRR | Mean latency |
|---|---:|---:|---:|---:|---:|---:|---:|
| US | 64 | 0.906 | 0.984 | 0.984 | 1.000 | 0.947 | 663 ms |
| India | 64 | 0.734 | 0.922 | 0.969 | 0.984 | 0.827 | 655 ms |

The lower India MRR likely reflects semantic overlap introduced by the fuller India variants. For
example, summary and full-source records for the same company can contain similar themes, making
the exact source chunk harder to retrieve at rank 1 even when a relevant chunk is retrieved.

## 6. Discussion

The most important project insight is that source quality strongly affects cross-market LLM
evaluation. Earlier in the project, the India subset was more summary-derived, and the measured
US–India macro-F1 gap was larger. After adding fuller Indian source variants, the India macro-F1
improved to 0.653 and the gap narrowed to 0.063.

This suggests that the initial performance difference should not be interpreted simply as "LLMs
perform worse on Indian disclosures." A more careful interpretation is that models perform worse
when source records contain less management tone, less Q&A context, fewer explicit figures, and
less disclosure structure. Since source completeness differed by market, source fidelity became a
confounding variable.

The result is useful because it changes what the next research step should be. Instead of
immediately fine-tuning a model or changing prompts, the highest-value improvement is to build a
more balanced full-source corpus for both markets. Only after source fidelity is balanced can the
project more cleanly test whether remaining gaps come from terminology, market conventions, or
model limitations.

## 7. Why the Project Is Unique and Useful

The project is unique because it combines an applied product with a benchmark question. Many
student AI projects stop at a chat interface over documents. This project goes further by asking
whether the pipeline is accurate, whether accuracy differs across markets, and what might explain
that difference.

The system is useful in three ways:

1. **Disclosure intelligence:** users can browse sentiment, risk flags, topics, and financial
   snapshots across companies.
2. **Research benchmarking:** the app measures US vs India performance instead of assuming that one
   model works equally well everywhere.
3. **Source-fidelity analysis:** the project shows that incomplete source material can create an
   apparent model-performance gap.

This makes the MVP both a working dashboard and a methodological case study in responsible LLM
evaluation.

## 8. Limitations

The project has several limitations. First, the benchmark labels are AI-adjudicated rather than
independently human-labeled. This means the metrics should be treated as illustrative rather than
as a rigorous empirical result. Second, the dataset is small: 128 chunks across 32 disclosure
records. Third, source fidelity remains uneven even after adding six fuller India variants. Fourth,
the financial snapshot extraction is intentionally sparse because the system only records numbers
explicitly stated in the collected source text.

The project also uses a single model stack. Results may differ with other embedding models,
generation models, prompt designs, or chunking strategies.

## 9. Future Work

Future work should focus on:

- adding full official source material for all India companies,
- adding more fiscal periods per company,
- replacing AI-adjudicated labels with independent human labels,
- adding a source-fidelity filter to compare summary-derived and full-transcript records,
- evaluating additional model providers,
- expanding retrieval evaluation with human-written queries and relevance judgments,
- improving financial extraction through official earnings releases and investor presentations.

The most important next step is full-source parity. Once both markets have comparable source
quality, the benchmark can more fairly evaluate genuine cross-market model generalization.

## 10. Conclusion

This project demonstrates a working cross-market financial disclosure analysis platform and uses it
to study LLM generalization across US and Indian corporate communications. The MVP ingests,
embeds, extracts, evaluates, and serves disclosure intelligence through a dashboard and chat
interface. The current result shows a small residual US–India sentiment gap, but the gap narrowed
substantially after adding fuller Indian source records. The central conclusion is that source
quality is a major confound in cross-market LLM evaluation. For practical financial NLP systems,
better data collection may be just as important as better models.

## References and Sources to Finalize

- Project benchmark outputs: `benchmark/metrics.json`, `benchmark/retrieval_metrics.json`.
- Project methodology: `docs/METHODOLOGY.md`.
- Project report: `docs/REPORT.md`.
- Gemini embedding model documentation.
- Groq/OpenAI-compatible generation model documentation.
- Supabase Postgres and pgvector documentation.
- Loughran-McDonald financial sentiment dictionary.
- Official company investor relations pages and transcript sources used in the corpus.
