from fastapi import APIRouter
from pydantic import BaseModel

from app.services.retrieval import retrieve_top_k
from app.services.groq_service import answer_question

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
    answer = answer_question(req.question, chunks)
    return ChatResponse(answer=answer, sources=chunks)
