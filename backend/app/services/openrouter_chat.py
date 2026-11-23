"""Grounded disclosure chat through three free OpenRouter models.

Free-model quota can be shared at account level, so failover helps with model
availability but cannot bypass a depleted account allowance.
"""

from openai import APIConnectionError, APIStatusError, OpenAI

from app.config import OPENROUTER_API_KEY
from app.services.groq_service import CHAT_PROMPT

CHAT_MODELS = (
    "nvidia/nemotron-3.5-lightning:free",
    "baidu/ernie-5.5-flash-preview:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
)

client = OpenAI(
    api_key=OPENROUTER_API_KEY or "not-configured",
    base_url="https://openrouter.ai/api/v1",
    max_retries=0,
    timeout=12.0,
)


def answer_question(question: str, retrieved_chunks: list[dict]) -> str:
    """Answer from retrieved passages, trying another free model on provider limits."""
    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY is not configured")
    if not question.strip():
        raise ValueError("Question must not be empty")

    context = "\n\n".join(
        f"[{chunk['company']} / {chunk['market']} / {chunk['doc_type']} / {chunk.get('fiscal_period', 'period unspecified')}]: {chunk['text']}"
        for chunk in retrieved_chunks
    )
    prompt = CHAT_PROMPT.format(context=context, question=question)
    last_error = None
    for model in CHAT_MODELS:
        try:
            model_options = {"extra_body": {"reasoning": {"enabled": False}}} if model.startswith("nvidia/") else {}
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=450,
                **model_options,
            )
            answer = response.choices[0].message.content
            if not answer:
                raise RuntimeError("OpenRouter returned an empty answer")
            return answer
        except APIConnectionError as error:
            last_error = error
        except APIStatusError as error:
            if error.status_code not in {404, 429, 500, 502, 503, 504}:
                raise
            last_error = error
    raise last_error or RuntimeError("No OpenRouter model was available")
