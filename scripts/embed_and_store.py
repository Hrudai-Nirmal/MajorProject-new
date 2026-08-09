"""
Embed the chunks in data/processed/chunks.jsonl (Gemini gemini-embedding-001,
768-dim) and upsert them into Supabase: one row per source document into
`documents`, one row per chunk into `chunks`.

Requires schema.sql to already be applied in the Supabase project (documents/
chunks tables + pgvector extension) -- this script only writes rows, it does
not run DDL.

Usage:
    cd backend && python -m scripts.embed_and_store   # or adjust PYTHONPATH
    (run from repo root with backend/ on the path, see __main__ sys.path hack below)
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.services.gemini_service import embed_text  # noqa: E402
from app.services.supabase_client import get_client  # noqa: E402

CHUNKS_PATH = Path(__file__).resolve().parent.parent / "data" / "processed" / "chunks.jsonl"


def load_chunks() -> list[dict]:
    rows = []
    with open(CHUNKS_PATH) as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def main():
    chunks = load_chunks()
    if not chunks:
        print(f"No chunks found in {CHUNKS_PATH}")
        return

    client = get_client()

    # One documents row per unique doc_id (idempotent via the doc_id unique constraint).
    doc_ids_seen = {}
    for c in chunks:
        doc_id = c["doc_id"]
        if doc_id in doc_ids_seen:
            continue
        resp = (
            client.table("documents")
            .upsert(
                {
                    "doc_id": doc_id,
                    "market": c["market"],
                    "company": c["company"],
                    "ticker": c["ticker"],
                    "doc_type": c["doc_type"],
                    "source_url": c.get("source"),
                    "fiscal_period": c.get("period"),
                },
                on_conflict="doc_id",
            )
            .execute()
        )
        row_id = resp.data[0]["id"]
        doc_ids_seen[doc_id] = row_id
        print(f"  documents: upserted {doc_id} -> {row_id}")

    total = 0
    for c in chunks:
        document_id = doc_ids_seen[c["doc_id"]]
        embedding = embed_text(c["text"], task_type="retrieval_document")
        client.table("chunks").upsert(
            {
                "document_id": document_id,
                "chunk_index": c["chunk_index"],
                "text": c["text"],
                "embedding": embedding,
            },
            on_conflict="document_id,chunk_index",
        ).execute()
        total += 1
        print(f"  chunks: embedded + stored {c['doc_id']} #{c['chunk_index']} ({total}/{len(chunks)})")

    print(f"\nDone. {len(doc_ids_seen)} documents, {total} chunks embedded and stored.")


if __name__ == "__main__":
    main()
