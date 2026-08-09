from app.services.supabase_client import get_client
from app.services.gemini_service import embed_text


def retrieve_top_k(query: str, k: int = 5, market: str | None = None) -> list[dict]:
    """Embed the query and run a pgvector cosine-similarity search via the
    match_chunks Postgres function (see schema.sql / migrations for the RPC
    definition to add in Supabase)."""
    query_embedding = embed_text(query, task_type="retrieval_query")
    client = get_client()

    params = {"query_embedding": query_embedding, "match_count": k}
    if market:
        params["filter_market"] = market

    resp = client.rpc("match_chunks", params).execute()
    return resp.data or []
