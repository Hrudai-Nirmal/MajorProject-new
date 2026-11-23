# Benchmark composition sensitivity test

Run on 23 November 2026 against the 128 labeled Supabase benchmark rows. The
original extraction predictions and reference labels were read without modifying
the database. All sentiment labels discussed here are model-generated.

## Original benchmark

| Market | Passages | Macro-F1 | Reference labels | Extraction models | Source fidelity |
| --- | ---: | ---: | --- | --- | --- |
| US | 64 | 0.717 | 47 positive, 10 neutral, 7 negative | 57 Llama 3.3 70B, 7 GPT OSS 120B | 64 summary excerpts |
| India | 64 | 0.653 | 28 positive, 32 neutral, 4 negative | 25 Llama 3.3 70B, 39 GPT OSS 120B | 34 summary excerpts, 30 full transcripts |

The observed US minus India macro-F1 gap is 0.063. The two market samples also
differ in disclosure type. All US benchmark passages are marked earnings
transcript, while all India passages are marked concall transcript.

## Disclosure-level resampling

We sampled documents with replacement within each market 5,000 times, retaining
all passages from each selected document, then recomputed macro-F1. The seed was
20261123. The percentile range for the gap was **-0.194 to +0.357** (median
+0.091). The gap was positive in 73.3% of resamples. This wide range indicates
that the sign and magnitude of the current gap are uncertain at the disclosure
level. This is an exploratory bootstrap range, not a validated population
confidence interval.

## Matched subset

We restricted both markets to summary excerpts extracted by Llama 3.3 70B and
matched counts by existing reference label. This leaves **23 passages per
market**, with 11 positive, 10 neutral, and 2 negative in each. One fixed US
sample was drawn using seed 20261123. The original labels gave US macro-F1
**0.749**, India macro-F1 **0.482**, and a gap of **0.267**. Across 5,000
alternative US draws with the same counts, the gap had median +0.297 and a
2.5–97.5 percentile range of +0.033 to +0.453. Those percentiles measure sample
selection sensitivity, not statistical confidence.

Passage length was not matched exactly. Median lengths in the fixed sample were
143 words for US and 133 for India. Disclosure type could not be matched because
the two markets have different type labels throughout this benchmark.

## Independent model labels on the fixed matched subset

Groq Qwen 3.8 27B independently classified the full text of the 46 matched
passages. It agreed with the existing reference labels on **27/46** passages
(14/23 US and 13/23 India). One answer used the word “mixed” outside the
three-class scheme, so that passage was re-prompted with an explicit instruction
to map mixed sentiment to neutral. No human adjudication was performed.

| Reference labels | US macro-F1 | India macro-F1 | Gap |
| --- | ---: | ---: | ---: |
| Existing AI labels | 0.749 | 0.482 | +0.267 |
| Fresh Qwen labels | 0.495 | 0.367 | +0.128 |

The matched subset does not show the original gap disappearing after controlling
for source fidelity, extraction model, and label counts. The change under a
second labeler shows that label choice materially affects the estimate. The
benchmark cannot isolate a market effect from disclosure type, source selection,
and AI label uncertainty. These results supersede the earlier working guess
that label balance was the leading explanation.

## Same current model in both markets

The 46 Qwen classifications above can also be scored as *predictions* against
the existing AI reference labels. This directly tests one model on both sides
of the fixed matched sample. The prompt asked for the sentiment of the whole
passage in both markets. Its wording differs from the original extraction
prompt, so these scores are a separate comparison.

| Market | Passages | Qwen macro-F1 | Agreements |
| --- | ---: | ---: | ---: |
| US | 23 | 0.565 | 14 |
| India | 23 | 0.500 | 13 |

The US minus India gap is **+0.065**. Each side contains passages from ten
documents. In 5,000 disclosure-level bootstrap resamples, the 2.5–97.5
percentile range for this gap was **-0.158 to +0.318**; 71.8% of resamples had
a positive gap. This is evidence that the point difference persists in this
one controlled sample, while the range does not establish a reliable direction.
The existing reference labels are AI-generated and disclosure type still differs
across markets.

## Expanded same-model sample for presentation

An additional Qwen run used existing labeled summary excerpts only. Groq returned
a rate-limit response while expanding the US side, so the run was stopped to
preserve API capacity for the presentation. Completed predictions, combined with
the earlier matched run, cover **44 US and 34 India passages**. No requests were
sent through the production backend and no Supabase rows were changed. The
completed predictions and matched identifiers are saved in
`benchmark/expanded_same_model.json` without source text or credentials.

A fixed-seed sample from the completed predictions matches 28 passages per
market, with 16 positive, 10 neutral, and 2 negative existing reference labels
on each side. Median passage lengths are 129 US and 126 India words. It spans
12 US and 13 India documents.

| Market | Matched passages | Qwen macro-F1 | Agreements |
| --- | ---: | ---: | ---: |
| US | 28 | 0.642 | 21 |
| India | 28 | 0.595 | 20 |

The expanded matched gap is **+0.047**. In 5,000 disclosure-level bootstrap
resamples, its 2.5–97.5 percentile range is **-0.161 to +0.306**; 69.1% of
resamples have a positive gap. The point estimate remains positive, but the
range crosses zero. The US completed set is partly determined by interruption
order, so the result is a sensitivity check rather than a representative new
benchmark. The two-negative-per-market count and AI-generated reference labels
remain substantial limitations.

The raw pilot input and model outputs were kept outside version control under
`tmp/` because they include the full passage text. The prior 20-passage context
pilot remains separately recorded in `benchmark/context_pilot.json`.
