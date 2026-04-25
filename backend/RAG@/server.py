"""
api/server.py
-------------
The FastAPI server that exposes the RAG pipeline as HTTP endpoints.

Your frontend (or Postman) calls these endpoints to:
  - Ask questions about trades (/ask)
  - Have a conversation (/chat)
  - Search trades directly (/search)
  - Re-ingest trades (/ingest)

Start with:
  uvicorn server:app --reload --port 8000
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from openai import OpenAI
from retriever import TradeRetriever
from answerer import TradeAnswerer

load_dotenv()

# ── App setup ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Trading RAG API",
    description="Ask questions about your trading history using AI",
    version="1.0.0"
)

# Allow requests from your frontend (React, Next.js, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # In production, replace with your frontend URL
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Shared clients (created once at startup) ──────────────────────────────────

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
chroma_host   = os.getenv("CHROMA_HOST", "localhost")
chroma_port   = int(os.getenv("CHROMA_PORT", "8001"))
retriever     = TradeRetriever(openai_client, chroma_host, chroma_port)
answerer      = TradeAnswerer(openai_client)


# ── Request / Response models ─────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str
    n_results: int = 20        # how many trades to retrieve
    filters: dict = None       # optional: {"outcome": "loss"}

class AskResponse(BaseModel):
    question: str
    answer: str
    trades_used: int           # how many trades were retrieved as context
    retrieved_trades: list     # the actual trades used (for transparency)

class ChatMessage(BaseModel):
    role: str                  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]   # full conversation history
    n_results: int = 20
    filters: dict = None

class SearchRequest(BaseModel):
    query: str
    n_results: int = 10
    filters: dict = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    """Health check — confirms the server is running."""
    return {
        "status": "ok",
        "message": "Trading RAG API is running",
        "total_trades_indexed": retriever.collection.count()
    }


@app.post("/ask", response_model=AskResponse)
def ask(request: AskRequest):
    """
    Single question → answer.

    Example request:
    {
        "question": "Why do I keep losing on early entries?",
        "n_results": 20,
        "filters": {"entry_execution": "early"}
    }
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    if retriever.collection.count() == 0:
        raise HTTPException(
            status_code=400,
            detail="No trades indexed yet. Run: python ingest.py"
        )

    # Step 1: Retrieve relevant trades
    retrieved = retriever.retrieve(
        query=request.question,
        n_results=request.n_results,
        filters=request.filters
    )

    if not retrieved:
        raise HTTPException(
            status_code=404,
            detail="No matching trades found for this question"
        )

    # Step 2: Format as context string
    context = retriever.format_context(retrieved)

    # Step 3: Get LLM answer
    answer = answerer.answer(
        question=request.question,
        context=context
    )

    return AskResponse(
        question=request.question,
        answer=answer,
        trades_used=len(retrieved),
        retrieved_trades=retrieved
    )


@app.post("/chat")
def chat(request: ChatRequest):
    """
    Multi-turn conversation with memory.
    Send the full message history each time for follow-up questions.

    Example:
    {
        "messages": [
            {"role": "user", "content": "Why am I losing?"},
            {"role": "assistant", "content": "Based on your trades..."},
            {"role": "user", "content": "What about my FOMO trades specifically?"}
        ]
    }
    """
    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    # The last user message is the current question
    last_user_msg = next(
        (m for m in reversed(request.messages) if m.role == "user"), None
    )
    if not last_user_msg:
        raise HTTPException(status_code=400, detail="No user message found")

    # Retrieve trades relevant to the latest question
    retrieved = retriever.retrieve(
        query=last_user_msg.content,
        n_results=request.n_results,
        filters=request.filters
    )

    context = retriever.format_context(retrieved)

    # Pass conversation history (excluding the last user message,
    # since we re-attach it inside answerer.answer with context)
    history = [
        {"role": m.role, "content": m.content}
        for m in request.messages[:-1]  # all but the last
    ]

    answer = answerer.answer(
        question=last_user_msg.content,
        context=context,
        conversation_history=history
    )

    return {
        "answer": answer,
        "trades_used": len(retrieved)
    }


@app.post("/search")
def search(request: SearchRequest):
    """
    Raw semantic search — returns matching trades without LLM analysis.
    Useful for debugging or building your own UI.

    Example:
    {
        "query": "FOMO trades that lost money",
        "n_results": 5,
        "filters": {"is_fomo": "True"}
    }
    """
    retrieved = retriever.retrieve(
        query=request.query,
        n_results=request.n_results,
        filters=request.filters
    )
    return {
        "query": request.query,
        "count": len(retrieved),
        "results": retrieved
    }


@app.post("/ingest")
def trigger_ingest():
    """
    Re-run the ingestion pipeline from the API.
    Useful if you want a button in your UI to refresh the index.
    """
    try:
        from pymongo import MongoClient
        from ingest import fetch_trades_from_mongo, ingest_trades

        trades     = fetch_trades_from_mongo()
        collection = retriever.collection
        ingest_trades(trades, openai_client, collection)

        return {
            "status": "success",
            "message": f"Ingestion complete. Total indexed: {collection.count()}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats")
def stats():
    """Quick stats about what's indexed."""
    count = retriever.collection.count()
    return {
        "total_trades_indexed": count,
        "chroma_host": chroma_host,
        "chroma_port": chroma_port,
        "embedding_model": "text-embedding-3-small",
        "chat_model": "gpt-4o"
    }
