from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import documents, chat

app = FastAPI(title="Cross-Market Disclosure Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to the Vercel domain once deployed
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
