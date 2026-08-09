"""Thin wrapper around the Gemini API — embeddings only.

Generation (extraction + chat) moved to groq_service.py: Gemini's
generateContent is billing-gated on this project (Google AI Pro doesn't
cover developer API billing -> 429 RESOURCE_EXHAUSTED, limit: 0 on every
model). embedContent has separate, open free-tier quota, so embeddings stay
here.

Live-tested 2026-08-09 via raw HTTP against generativelanguage.googleapis.com.
gemini-embedding-001 native output is 3072-dim; truncated to 768 via
output_dimensionality since pgvector's ivfflat/hnsw indexes cap at 2000 dims.
text-embedding-004 (the original model this used) is retired (404).
"""
import google.generativeai as genai
from app.config import GEMINI_API_KEY, EMBEDDING_MODEL, EMBEDDING_DIM

genai.configure(api_key=GEMINI_API_KEY)


def embed_text(text: str, task_type: str = "retrieval_document") -> list[float]:
    """Embed a single chunk of text. task_type should be 'retrieval_document'
    when embedding corpus chunks, and 'retrieval_query' when embedding a
    user's chat question."""
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type=task_type,
        output_dimensionality=EMBEDDING_DIM,
    )
    return result["embedding"]


def embed_batch(texts: list[str], task_type: str = "retrieval_document") -> list[list[float]]:
    return [embed_text(t, task_type=task_type) for t in texts]
