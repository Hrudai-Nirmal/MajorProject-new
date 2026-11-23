from fastapi import APIRouter
from pydantic import BaseModel

from app.services.retrieval import retrieve_top_k
from app.services.openrouter_chat import answer_question

router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    market: str | None = None
    top_k: int = 5


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]


@router.post("/", response_model=ChatResponse)
def chat(req: ChatRequest):
    chunks = retrieve_top_k(req.question, k=req.top_k, market=req.market)
    if not chunks:
        return ChatResponse(answer="I couldn't find a disclosure matching that question in the indexed sources.", sources=[])
    answer = answer_question(req.question, chunks)
    return ChatResponse(answer=answer, sources=chunks)
