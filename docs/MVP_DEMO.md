# MVP Demo Script

## Goal

Show a working educational pilot that compares LLM-based sentiment and risk extraction on US and
India corporate disclosure text, with retrieval-grounded browsing and transparent benchmark
caveats.

## Demo path

1. Open the deployed dashboard.
   - Confirm the page loads without an API error.
   - Point out the pilot scope: 13 sector-matched US/India pairs, 32 disclosure records, and 128
     benchmark chunks.

2. Open one India full-source record.
   - Use an India card with a `Full transcript` badge, such as Infosys, HDFC Bank, Reliance,
     L&T, TCS, or Varun Beverages.
   - Explain that source fidelity matters because fuller transcripts preserve management tone,
     caveats, and Q&A context that short summaries miss.

3. Open the Benchmark page.
   - Highlight the current result: US macro-F1 about 0.717, India macro-F1 about 0.653, and a
     cross-market gap of about 0.063.
   - Explain the MVP insight: after adding fuller India sources, the India score improved and the
     measured gap narrowed, so source quality is a major confound.

4. Open Compare.
   - Pick one US company and one India company from matched or nearby sectors.
   - Show that the app compares disclosed financial figures only when they were explicitly stated
     in the collected text.

5. Open Risks.
   - Show that extracted risk flags and topics can be browsed across companies.
   - Mention that this is useful for quickly scanning common concerns, not for investment advice.

6. Open Chat.
   - Ask: `What did Infosys say about margins?`
   - Confirm the answer cites retrieved disclosure chunks.

## Talk track

This MVP is a proof-of-concept RAG dashboard for cross-market disclosure analysis. It ingests
company disclosures, chunks and embeds them, extracts sentiment/risk/topic signals, stores the
results in Supabase, and presents them through a FastAPI plus Next.js app. The research question is
whether the same LLM pipeline performs equally well on US and India disclosures.

The current answer is: mostly, but source quality matters. Earlier India performance looked much
worse when India records were more summary-derived. After adding fuller India source variants, the
India macro-F1 improved and the cross-market gap narrowed materially. That makes the project useful
as an MVP because it demonstrates the full pipeline and surfaces a defensible research insight.

## Required caveats

- This is research/educational software, not investment advice.
- Gold labels are AI-adjudicated, not independently human-labeled.
- The benchmark is small: 128 chunks across 32 disclosure records.
- Financial fields are intentionally sparse because the extractor only records figures explicitly
  stated in the collected source text.
- Remaining full-source coverage for all India companies is post-MVP work.

## MVP acceptance checklist

- Dashboard loads without `Couldn't reach the disclosure API`.
- Dashboard copy says 32 disclosure records / 128 chunks.
- Benchmark page shows 128 labeled chunks and a gap around 0.063.
- At least six India records show `Full transcript` badges.
- Compare page loads and renders two company cards.
- Risks page loads and shows extracted risk/topic entries.
- Chat returns an answer with sources for a real query.
