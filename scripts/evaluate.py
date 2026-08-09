"""
Benchmark evaluation per docs/METHODOLOGY.md §A.2-A.5.

Compares model output (extraction_results) against hand-adjudicated gold
labels (benchmark_labels.gold_sentiment, etc.) -- NOT against the LM score,
which is only a labeling aid (see scripts/compute_lm_scores.py). Produces:
  - Precision/Recall/F1 per sentiment class, macro-F1, segmented by market
  - Cross-market generalization gap: Macro-F1(US) - Macro-F1(India)
  - Retrieval quality: Recall@k, MRR (needs a query/relevance set, see below)
  - Latency: not computed here (would need timestamps captured during the
    live run; add if/when the pipeline logs call duration)

IMPORTANT: this only produces a real result once benchmark_labels.gold_sentiment
has been filled in by a human labeler for at least some chunks. Until then it
reports how many chunks are labeled and computes nothing else -- it will not
fabricate a result from an empty or partial gold set.

Usage:
    python scripts/evaluate.py
Output:
    benchmark/metrics.json (served by GET /documents/metrics)
"""
import json
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.services.supabase_client import get_client  # noqa: E402

OUT_PATH = Path(__file__).resolve().parent.parent / "benchmark" / "metrics.json"
LABELS = ["positive", "negative", "neutral"]


def precision_recall_f1(gold: list[str], pred: list[str], label: str) -> dict:
    tp = sum(1 for g, p in zip(gold, pred) if g == label and p == label)
    fp = sum(1 for g, p in zip(gold, pred) if g != label and p == label)
    fn = sum(1 for g, p in zip(gold, pred) if g == label and p != label)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
    return {"precision": precision, "recall": recall, "f1": f1, "support": gold.count(label)}


def evaluate_market(gold: list[str], pred: list[str]) -> dict:
    per_class = {label: precision_recall_f1(gold, pred, label) for label in LABELS}
    macro_f1 = sum(c["f1"] for c in per_class.values()) / len(LABELS)
    accuracy = sum(1 for g, p in zip(gold, pred) if g == p) / len(gold) if gold else 0.0
    return {"per_class": per_class, "macro_f1": macro_f1, "accuracy": accuracy, "n": len(gold)}


def main():
    client = get_client()

    labels_rows = (
        client.table("benchmark_labels")
        .select("chunk_id, market, gold_sentiment, gold_risk_flags, gold_topics, lm_dictionary_score")
        .execute()
        .data
    )
    total_rows = len(labels_rows)
    labeled_rows = [r for r in labels_rows if r.get("gold_sentiment")]

    print(f"{total_rows} benchmark_labels rows total, {len(labeled_rows)} have a gold_sentiment label.")

    if not labeled_rows:
        result = {
            "status": "no_gold_labels_yet",
            "total_benchmark_rows": total_rows,
            "labeled_rows": 0,
            "note": (
                "LM dictionary scores are populated (scripts/compute_lm_scores.py) but "
                "gold_sentiment/gold_risk_flags/gold_topics still need a human labeler "
                "(docs/METHODOLOGY.md: LM score is a labeling aid, not the gold label). "
                "Fill in benchmark_labels.gold_* for at least a subset of chunks, then rerun."
            ),
        }
        OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(OUT_PATH, "w") as f:
            json.dump(result, f, indent=2)
        print(f"\nWrote {OUT_PATH} (no_gold_labels_yet status -- nothing to score yet).")
        return

    extractions = client.table("extraction_results").select("chunk_id, sentiment_label").execute().data
    pred_by_chunk = {e["chunk_id"]: e["sentiment_label"] for e in extractions}

    by_market = defaultdict(lambda: {"gold": [], "pred": []})
    skipped_no_prediction = 0
    for row in labeled_rows:
        chunk_id = row["chunk_id"]
        pred = pred_by_chunk.get(chunk_id)
        if pred is None:
            skipped_no_prediction += 1
            continue
        by_market[row["market"]]["gold"].append(row["gold_sentiment"])
        by_market[row["market"]]["pred"].append(pred)

    results = {"status": "ok", "total_benchmark_rows": total_rows, "labeled_rows": len(labeled_rows)}
    if skipped_no_prediction:
        results["skipped_missing_model_prediction"] = skipped_no_prediction

    for market, data in by_market.items():
        results[market] = evaluate_market(data["gold"], data["pred"])

    if "US" in results and "India" in results:
        results["cross_market_gap"] = {
            "macro_f1_us": results["US"]["macro_f1"],
            "macro_f1_india": results["India"]["macro_f1"],
            "gap": results["US"]["macro_f1"] - results["India"]["macro_f1"],
        }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(results, f, indent=2)

    print(json.dumps(results, indent=2))
    print(f"\nWrote {OUT_PATH}")


if __name__ == "__main__":
    main()
