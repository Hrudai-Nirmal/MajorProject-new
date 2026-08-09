"""
Compute Loughran-McDonald sentiment scores per chunk as a labeling *aid*
(per docs/METHODOLOGY.md §A.1) -- NOT a substitute for the gold labels that
still need manual adjudication. This script only ever writes to the
lm_dictionary_score column; gold_sentiment / gold_risk_flags / gold_topics /
labeled_by are left for a human to fill in.

Formulas (docs/METHODOLOGY.md §A.1):
    LM_score  = (Positive_count - Negative_count) / Total_word_count
    Net_Tone  = (Positive_count - Negative_count) / (Positive_count + Negative_count)

Dictionary: data/lexicons/LM_MasterDictionary.csv, downloaded 2026-08-10 from
sraf.nd.edu (Loughran-McDonald Master Dictionary, updated March 2026).
Free for academic research use with attribution (see docs/REQUIREMENTS.md §3.4).

Usage:
    python scripts/compute_lm_scores.py
"""
import csv
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.services.supabase_client import get_client  # noqa: E402

LEXICON_PATH = Path(__file__).resolve().parent.parent / "data" / "lexicons" / "LM_MasterDictionary.csv"
WORD_RE = re.compile(r"[A-Za-z']+")


def load_lexicon() -> tuple[set[str], set[str]]:
    positive, negative = set(), set()
    with open(LEXICON_PATH) as f:
        for row in csv.DictReader(f):
            word = row["Word"].upper()
            if row["Positive"] not in ("0", ""):
                positive.add(word)
            if row["Negative"] not in ("0", ""):
                negative.add(word)
    return positive, negative


def score_text(text: str, positive: set[str], negative: set[str]) -> dict:
    words = [w.upper() for w in WORD_RE.findall(text)]
    total = len(words)
    if total == 0:
        return {"lm_score": 0.0, "net_tone": 0.0, "pos_count": 0, "neg_count": 0, "total_words": 0}
    pos_count = sum(1 for w in words if w in positive)
    neg_count = sum(1 for w in words if w in negative)
    lm_score = (pos_count - neg_count) / total
    net_tone = (pos_count - neg_count) / (pos_count + neg_count) if (pos_count + neg_count) > 0 else 0.0
    return {
        "lm_score": lm_score,
        "net_tone": net_tone,
        "pos_count": pos_count,
        "neg_count": neg_count,
        "total_words": total,
    }


def main():
    if not LEXICON_PATH.exists():
        print(f"Lexicon not found at {LEXICON_PATH}. Download it from sraf.nd.edu first.")
        return

    positive, negative = load_lexicon()
    print(f"Loaded LM lexicon: {len(positive)} positive words, {len(negative)} negative words.")

    client = get_client()
    chunks = (
        client.table("chunks")
        .select("id, text, chunk_index, document_id, documents(company, ticker, market, doc_type)")
        .execute()
        .data
    )
    if not chunks:
        print("No chunks found in Supabase. Run scripts/embed_and_store.py first.")
        return

    existing = client.table("benchmark_labels").select("chunk_id").execute().data
    already = {row["chunk_id"] for row in existing}

    created = 0
    for c in chunks:
        if c["id"] in already:
            continue
        scores = score_text(c["text"], positive, negative)
        doc = c["documents"]
        client.table("benchmark_labels").insert(
            {
                "chunk_id": c["id"],
                "market": doc["market"],
                "lm_dictionary_score": scores["lm_score"],
                # gold_sentiment / gold_risk_flags / gold_topics / labeled_by intentionally
                # left null -- these require a human to read the chunk and adjudicate.
                # See docs/METHODOLOGY.md §A.1: LM score is a labeling aid, not the gold label.
            }
        ).execute()
        created += 1
        print(
            f"  {doc['company']} ({doc['market']}) chunk #{c['chunk_index']}: "
            f"LM_score={scores['lm_score']:.4f}  net_tone={scores['net_tone']:.4f}  "
            f"pos={scores['pos_count']} neg={scores['neg_count']} words={scores['total_words']}"
        )

    print(f"\nDone. {created} benchmark_labels rows created (LM score only).")
    print("Gold labels (gold_sentiment, gold_risk_flags, gold_topics, labeled_by) still")
    print("need a human to read each chunk and adjudicate -- that's the whole point of")
    print("having an independent benchmark to evaluate the model against.")


if __name__ == "__main__":
    main()
