"""
Run sentiment/risk/topic extraction (Groq, llama-3.3-70b-versatile) over every
chunk currently stored in Supabase that doesn't have an extraction_results row
yet, and write the results back.

Requires schema.sql applied and scripts/embed_and_store.py already run (chunks
must exist in the DB first).

Usage:
    python scripts/run_extraction.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.services.groq_service import GROQ_GENERATION_MODEL, extract_signals  # noqa: E402
from app.services.supabase_client import get_client  # noqa: E402


def main():
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

    for i, c in enumerate(todo, 1):
        doc = c["documents"]
        result = extract_signals(
            c["text"], company=doc["company"], market=doc["market"], doc_type=doc["doc_type"]
        )
        client.table("extraction_results").insert(
            {
                "chunk_id": c["id"],
                "sentiment_label": result.get("sentiment_label"),
                "sentiment_score": result.get("sentiment_score"),
                "risk_flags": result.get("risk_flags", []),
                "topics": result.get("topics", []),
                "summary": result.get("summary"),
                "model_used": GROQ_GENERATION_MODEL,
            }
        ).execute()
        print(f"  [{i}/{len(todo)}] {doc['company']} chunk {c['id']}: {result.get('sentiment_label')}")

    print("Done.")


if __name__ == "__main__":
    main()
