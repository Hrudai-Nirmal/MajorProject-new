"""
Fill in benchmark_labels.gold_sentiment / gold_risk_flags / gold_topics for
chunks that don't have them yet.

IMPORTANT PROVENANCE NOTE: these are AI-generated adjudications, not
independent human labels. docs/METHODOLOGY.md's benchmark design assumes a
human reads each chunk and adjudicates against the LM score aid -- that step
is skipped here per an explicit decision for this course pilot (not a
research-grade benchmark). To keep the comparison at least somewhat
meaningful rather than a model grading itself, this uses Groq's
openai/gpt-oss-120b as the adjudicator -- a different model family from
llama-3.3-70b-versatile, which is what extraction_results (the thing being
evaluated) was generated with.

First attempt used Gemini gemini-flash-latest, but that free tier caps at
20 requests/day (hit after 19 chunks) -- switched to Groq to finish the
remaining chunks without a multi-day wait. labeled_by records which model
actually produced each row's label, since they're not all the same.

Usage:
    python scripts/label_benchmark_gold.py
"""
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from openai import OpenAI  # noqa: E402
from app.config import GROQ_API_KEY, GROQ_BASE_URL  # noqa: E402
from app.services.supabase_client import get_client  # noqa: E402

client_groq = OpenAI(api_key=GROQ_API_KEY, base_url=GROQ_BASE_URL)
ADJUDICATOR_MODEL = "openai/gpt-oss-120b"
LABELED_BY = f"{ADJUDICATOR_MODEL} via Groq (AI-generated adjudication, NOT an independent human label -- see scripts/label_benchmark_gold.py)"

ADJUDICATION_PROMPT = """You are adjudicating a benchmark label for a financial NLP pipeline. Read the
excerpt below carefully and independently -- do not assume any particular answer, judge only
what's actually stated in the text.

Excerpt ({doc_type}, {company}, {market} market):
\"\"\"{chunk_text}\"\"\"

Loughran-McDonald dictionary score for this excerpt (a rough lexical signal, not authoritative): {lm_score}

Provide your own careful judgment:
1. gold_sentiment: one of "positive", "negative", "neutral" -- the overall tone of management's
   statement in this excerpt specifically (not the company's stock performance in general)
2. gold_risk_flags: list of short strings naming risks/concerns actually disclosed in this excerpt
   (empty list if none)
3. gold_topics: list of short topic tags actually present in this excerpt

Respond ONLY with valid JSON: {{"gold_sentiment": "...", "gold_risk_flags": [], "gold_topics": []}}
"""


def adjudicate(prompt: str) -> dict:
    response = client_groq.chat.completions.create(
        model=ADJUDICATOR_MODEL,
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": prompt}],
    )
    return json.loads(response.choices[0].message.content)


def main():
    client = get_client()

    rows = (
        client.table("benchmark_labels")
        .select("id, chunk_id, market, lm_dictionary_score, gold_sentiment, chunks(text, documents(company, doc_type))")
        .execute()
        .data
    )
    todo = [r for r in rows if not r.get("gold_sentiment")]
    print(f"{len(rows)} benchmark_labels rows total, {len(todo)} still need gold labels.")

    for i, row in enumerate(todo, 1):
        chunk = row["chunks"]
        doc = chunk["documents"]
        prompt = ADJUDICATION_PROMPT.format(
            doc_type=doc["doc_type"],
            company=doc["company"],
            market=row["market"],
            chunk_text=chunk["text"],
            lm_score=row.get("lm_dictionary_score"),
        )

        result = None
        for attempt in range(3):
            try:
                result = adjudicate(prompt)
                break
            except Exception as e:
                print(f"    attempt {attempt + 1} failed: {e}")
                time.sleep(5)
        if result is None:
            print(f"  [{i}/{len(todo)}] {doc['company']}: FAILED after retries, skipping")
            continue

        client.table("benchmark_labels").update(
            {
                "gold_sentiment": result.get("gold_sentiment"),
                "gold_risk_flags": result.get("gold_risk_flags", []),
                "gold_topics": result.get("gold_topics", []),
                "labeled_by": LABELED_BY,
            }
        ).eq("id", row["id"]).execute()

        print(f"  [{i}/{len(todo)}] {doc['company']}: {result.get('gold_sentiment')}")

    print("\nDone.")


if __name__ == "__main__":
    main()
