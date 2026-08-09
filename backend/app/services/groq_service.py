"""Groq wrapper for generation (extraction + chat Q&A).

Gemini's generateContent is billing-gated on this project (Google AI Pro
doesn't cover developer API billing -> 429 RESOURCE_EXHAUSTED, limit: 0 on
every model). Groq's free developer tier needs no billing account at all, so
generation moved here. Embeddings stay on Gemini (embedContent has separate,
open quota) — see gemini_service.py.

Live-tested 2026-08-09 via raw HTTP against api.groq.com/openai/v1, both
plain chat and response_format={"type": "json_object"} JSON mode.
"""
import json
from openai import OpenAI
from app.config import GROQ_API_KEY, GROQ_GENERATION_MODEL, GROQ_BASE_URL

client = OpenAI(api_key=GROQ_API_KEY, base_url=GROQ_BASE_URL)


EXTRACTION_PROMPT = """You are a financial disclosure analyst. Given the following excerpt from a
corporate disclosure ({doc_type}, {company}, {market} market), extract:

1. sentiment_label: one of "positive", "negative", "neutral" (overall management tone)
2. sentiment_score: float from -1.0 (very negative) to 1.0 (very positive)
3. risk_flags: list of short strings naming any disclosed risks/concerns (empty list if none)
4. topics: list of short topic tags (e.g. "guidance", "margins", "litigation", "regulatory")
5. summary: one-sentence summary of the excerpt

Respond ONLY with valid JSON matching this shape:
{{"sentiment_label": "...", "sentiment_score": 0.0, "risk_flags": [], "topics": [], "summary": "..."}}

Excerpt:
\"\"\"{chunk_text}\"\"\"
"""


def extract_signals(chunk_text: str, company: str, market: str, doc_type: str) -> dict:
    prompt = EXTRACTION_PROMPT.format(
        doc_type=doc_type, company=company, market=market, chunk_text=chunk_text
    )
    response = client.chat.completions.create(
        model=GROQ_GENERATION_MODEL,
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": prompt}],
    )
    return json.loads(response.choices[0].message.content)


CHAT_PROMPT = """You are a financial disclosure Q&A assistant. Answer the user's question
using ONLY the retrieved excerpts below. If the excerpts don't contain the
answer, say so explicitly rather than guessing. Cite which company/market
each fact comes from.

Retrieved excerpts:
{context}

Question: {question}
"""


def answer_question(question: str, retrieved_chunks: list[dict]) -> str:
    context = "\n\n".join(
        f"[{c['company']} / {c['market']} / {c['doc_type']}]: {c['text']}"
        for c in retrieved_chunks
    )
    prompt = CHAT_PROMPT.format(context=context, question=question)
    response = client.chat.completions.create(
        model=GROQ_GENERATION_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content
