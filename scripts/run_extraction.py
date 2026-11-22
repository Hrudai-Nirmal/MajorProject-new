"""
Run sentiment/risk/topic extraction (Groq by default, optional local Ollama) over every
chunk currently stored in Supabase that doesn't have an extraction_results row
yet, and write the results back.

Requires schema.sql applied and scripts/embed_and_store.py already run (chunks
must exist in the DB first).

Usage:
    python scripts/run_extraction.py
    python scripts/run_extraction.py --local  # installed Qwen 3.5 9B, distinct model provenance
"""
import argparse
import json
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.services.groq_service import EXTRACTION_PROMPT, GROQ_GENERATION_MODEL, extract_signals  # noqa: E402
from app.services.supabase_client import get_client  # noqa: E402

LOCAL_MODEL = "batiai/qwen3.5-9b:q6"


def parse_args(arguments: list[str] | None = None):
    """Parse an explicit local-provider override for offline extraction."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--local", action="store_true", help="Use the installed Ollama model")
    return parser.parse_args(arguments)


def extract_local_signals(chunk_text: str, company: str, market: str, doc_type: str) -> dict:
    """Use the same extraction prompt with an installed local model."""
    prompt = EXTRACTION_PROMPT.format(
        doc_type=doc_type, company=company, market=market, chunk_text=chunk_text
    )
    payload = json.dumps({
        "model": LOCAL_MODEL, "prompt": prompt, "format": "json", "stream": False,
        "think": False, "options": {"num_ctx": 2048, "num_predict": 350, "temperature": 0},
    }).encode()
    request = urllib.request.Request(
        "http://localhost:11434/api/generate", data=payload,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        result = json.loads(json.load(response)["response"])
    if result.get("sentiment_label") not in {"positive", "negative", "neutral"}:
        raise ValueError("Invalid sentiment label from local model")
    return result


def main():
    arguments = parse_args()
    model_used = LOCAL_MODEL if arguments.local else GROQ_GENERATION_MODEL
    client = get_client()

    chunks = (
        client.table("chunks")
        .select("id, text, document_id, documents(company, market, doc_type)")
        .execute()
        .data
    )
    if not chunks:
        print("No chunks found in Supabase. Run scripts/embed_and_store.py first.")
        return

    existing = client.table("extraction_results").select("chunk_id").execute().data
    already_done = {row["chunk_id"] for row in existing}

    todo = [c for c in chunks if c["id"] not in already_done]
    print(f"{len(chunks)} chunks total, {len(already_done)} already extracted, {len(todo)} to process.")

    failed = []
    for i, c in enumerate(todo, 1):
        doc = c["documents"]
        result = None
        last_err = None
        for attempt in range(2):  # occasional malformed JSON from the model; one retry clears most
            try:
                if arguments.local:
                    result = extract_local_signals(
                        c["text"], company=doc["company"], market=doc["market"], doc_type=doc["doc_type"]
                    )
                else:
                    result = extract_signals(
                        c["text"], company=doc["company"], market=doc["market"], doc_type=doc["doc_type"]
                    )
                break
            except Exception as e:
                last_err = e
        if result is None:
            print(f"  [{i}/{len(todo)}] {doc['company']} chunk {c['id']}: FAILED after retry ({last_err}) -- skipped")
            failed.append(c["id"])
            continue
        client.table("extraction_results").insert(
            {
                "chunk_id": c["id"],
                "sentiment_label": result.get("sentiment_label"),
                "sentiment_score": result.get("sentiment_score"),
                "risk_flags": result.get("risk_flags", []),
                "topics": result.get("topics", []),
                "summary": result.get("summary"),
                "model_used": model_used,
            }
        ).execute()
        print(f"  [{i}/{len(todo)}] {doc['company']} chunk {c['id']}: {result.get('sentiment_label')}")

    if failed:
        print(f"\nDone, with {len(failed)} chunk(s) failed twice: {failed}. Rerun this script to retry them.")
    else:
        print("\nDone.")


if __name__ == "__main__":
    main()
