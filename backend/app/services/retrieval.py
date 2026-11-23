"""Retrieve disclosure passages, preserving explicit fiscal-quarter constraints."""

import re

from app.services.supabase_client import get_client
from app.services.gemini_service import embed_text

QUARTER_PATTERN = re.compile(r"\bQ([1-4])\s*FY\s*(?:20)?(\d{2})\b", re.IGNORECASE)


def retrieve_top_k(query: str, k: int = 5, market: str | None = None) -> list[dict]:
    """Embed the query and run a pgvector cosine-similarity search via the
    match_chunks Postgres function (see schema.sql / migrations for the RPC
    definition to add in Supabase)."""
    if not query.strip() or k < 1:
        raise ValueError("A question and a positive result count are required")

    requested_quarter = QUARTER_PATTERN.search(query)
    query_embedding = embed_text(query, task_type="retrieval_query")
    client = get_client()

    params = {"query_embedding": query_embedding, "match_count": max(k, 40) if requested_quarter else k}
    if market:
        params["filter_market"] = market

    resp = client.rpc("match_chunks", params).execute()
    candidates = resp.data or []
    if not requested_quarter or not candidates:
        return candidates[:k]

    document_ids = list({chunk["document_id"] for chunk in candidates})
    documents = client.table("documents").select("id,fiscal_period").in_("id", document_ids).execute().data or []
    period_by_document = {document["id"]: document.get("fiscal_period", "") for document in documents}
    quarter_key = requested_quarter.groups()
    matching_chunks = []
    for chunk in candidates:
        fiscal_period = period_by_document.get(chunk["document_id"], "")
        document_quarter = QUARTER_PATTERN.search(fiscal_period or "")
        if document_quarter and document_quarter.groups() == quarter_key:
            matching_chunks.append({**chunk, "fiscal_period": fiscal_period})
    return matching_chunks[:k]
