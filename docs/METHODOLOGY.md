# Financial & Evaluation Methodology

Covers three things: the NLP/evaluation math the pipeline runs on, the traditional financial ratios pulled from disclosures, and the report structures the project should produce.

## A. NLP / Evaluation Formulas

### A.1 Loughran-McDonald (LM) sentiment score
Used as the labeling *aid* before manual adjudication, not as the final gold label.

```
LM_score = (Positive_count − Negative_count) / Total_word_count
```
where `Positive_count` / `Negative_count` are counts of words in the chunk matching the LM Positive/Negative master wordlists.

Alternative normalization (Net Tone, bounded [-1, 1]):
```
Net_Tone = (Positive_count − Negative_count) / (Positive_count + Negative_count)
```

### A.2 Precision, Recall, F1 (the core benchmark metric)
Computed per label class (e.g. sentiment = positive/negative/neutral, or risk-flag present/absent), then macro-averaged, then **segmented by market** (US subset vs. India subset) — this segmentation is the whole point of the cross-market comparison.

```
Precision = TP / (TP + FP)
Recall    = TP / (TP + FN)
F1        = 2 × (Precision × Recall) / (Precision + Recall)
Macro-F1  = mean(F1_positive, F1_negative, F1_neutral)
```
Cross-market generalization gap:
```
Gap = Macro-F1(US) − Macro-F1(India)
```
A large positive gap is the headline finding the project is testing for.

### A.3 Retrieval quality
Cosine similarity between query and chunk embeddings (what `match_chunks` in Supabase actually computes):
```
cosine_sim(q, c) = (q · c) / (‖q‖ × ‖c‖)
```
Recall@k — fraction of relevant chunks captured in the top-k retrieved:
```
Recall@k = (# relevant chunks in top k) / (total # relevant chunks)
```
Mean Reciprocal Rank, for "did we find the right chunk near the top":
```
MRR = (1/|Q|) × Σ (1 / rank_i)
```
where `rank_i` is the position of the first relevant chunk for query *i*.

### A.4 Label agreement (only relevant if more than one person hand-labels the benchmark)
Cohen's Kappa, correcting agreement for chance:
```
κ = (p_o − p_e) / (1 − p_e)
```
`p_o` = observed agreement rate, `p_e` = expected agreement by chance given each labeler's marginal label distribution.

### A.5 Latency
Simple descriptive stat, not a derived formula — mean and p95 response time (ms) per extraction call and per chat query, segmented by market (in case one market's documents are systematically longer/slower to process).

## B. Traditional Financial Ratios (computed from the disclosure figures themselves)

These are the standard metrics that show up in every earnings call and are worth extracting alongside the qualitative signals, since they give the dashboard something quantitative to plot next to sentiment.

```
Revenue growth % (YoY) = (Revenue_t − Revenue_t−1) / Revenue_t−1 × 100
Revenue growth % (QoQ) = (Revenue_t − Revenue_t−1) / Revenue_t−1 × 100   [prior quarter instead of prior year]
Gross margin %          = (Revenue − COGS) / Revenue × 100
Operating margin %      = Operating Income / Revenue × 100
Net margin %            = Net Income / Revenue × 100
EBITDA margin %         = EBITDA / Revenue × 100
EPS growth %            = (EPS_t − EPS_t−1) / EPS_t−1 × 100
Free Cash Flow          = Operating Cash Flow − Capital Expenditures
```

Sector-specific ratios that show up in this particular company set (good candidates for topic-tagged extraction, since they're the kind of number analysts actually watch per sector):
```
ROTCE (JPMorgan, banks)        = Net Income available to common / Average Tangible Common Equity
Credit-Deposit Ratio (HDFC Bank) = Total Advances / Total Deposits × 100
Attrition rate (TCS, IT services) = Employees departed / Average headcount × 100
```

Constant-currency growth (used heavily by MSFT, AAPL, WMT — matters for the US/India comparison since INR/USD moves distort raw growth numbers):
```
CC growth % = (Revenue_t at prior-year FX rates − Revenue_t−1) / Revenue_t−1 × 100
```

## C. Report Structures

### C.1 Per-company/per-document report (dashboard card level)
- Header: company, ticker, market, fiscal period, document type, source link
- Financial snapshot table: revenue, YoY/QoQ growth, margins, EPS growth (from §B)
- Sentiment: label + score (§A.1/A.2 output), trend arrow if multiple periods exist
- Risk flags: bulleted list, each with a supporting quote from the source chunk
- Topic tags
- Retrieval-grounded summary paragraph (LLM-generated, must cite which chunk each claim came from)
- Source excerpts panel: the actual retrieved chunks, so a reader can verify the summary against source text

### C.2 Cross-market comparative report (the pilot's main written deliverable)
1. Executive summary — headline generalization gap number, headline free-vs-paid finding (dropped per current scope, note as future work)
2. Methodology — data sources, chunking approach, benchmark construction, model used
3. Benchmark evaluation table — Precision/Recall/F1 by market, by sentiment class, macro-F1
4. Retrieval quality table — Recall@k, MRR, mean latency, by market
5. Cross-market generalization gap discussion — where and why the pipeline over/under-performs on Indian disclosures (e.g. transcript formatting differences, terminology, currency/unit conventions)
6. Limitations — data fidelity asymmetry (2 fully-fetched US transcripts vs. search-summary-derived excerpts for the other 8, per the earlier collection note), single model tier, small benchmark size (~25-30 chunks), single quarter per company
7. Appendix — company list, source URLs, labeling guidelines used for adjudication
