from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import documents, chat

app = FastAPI(title="Cross-Market Disclosure Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://major-project-new-plum.vercel.app",  # production frontend
        "http://localhost:3000",  # local frontend dev
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
