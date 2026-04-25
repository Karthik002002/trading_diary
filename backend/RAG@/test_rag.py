"""
test_rag.py
-----------
Quick end-to-end test using fake trade data.
Run this BEFORE setting up MongoDB to confirm the pipeline works.

Usage:
  python test_rag.py
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from utils.trade_to_text import trade_to_text
from retriever import TradeRetriever
from answerer import TradeAnswerer
from openai import OpenAI
import chromadb

# ── Fake trade data (matches your schema) ─────────────────────────────────────

SAMPLE_TRADES = [
    {
        "_id": "trade_001",
        "type": "buy", "quantity": 35,
        "entry_price": 118.45, "exit_price": 117.36,
        "stop_loss": 117.36, "take_profit": 120.34,
        "pl": -38.15, "returns": -0.92, "rr": 1.73, "actual_rr": 1.0,
        "outcome": "loss", "trade_date": "2026-02-14T00:00:00Z",
        "entry_execution": "early", "exit_execution": "perfect",
        "emotional_state": "calm", "market_condition": "ranging",
        "confidence_level": 6, "is_fomo": False, "is_greed": False,
        "strategy_id": 2, "symbol_id": 7, "trade_type": "equity",
        "rule_violations": [], "tags": [], "status": "NIN",
        "entry_reason": "breakout", "exit_reason": "hit stop",
        "notes": "thought it was breaking out but was fake",
        "post_trade_thoughts": "entered too early"
    },
    {
        "_id": "trade_002",
        "type": "buy", "quantity": 50,
        "entry_price": 245.0, "exit_price": 252.0,
        "stop_loss": 240.0, "take_profit": 255.0,
        "pl": 350.0, "returns": 2.86, "rr": 2.0, "actual_rr": 1.4,
        "outcome": "win", "trade_date": "2026-02-17T00:00:00Z",
        "entry_execution": "perfect", "exit_execution": "early",
        "emotional_state": "confident", "market_condition": "trending",
        "confidence_level": 8, "is_fomo": False, "is_greed": False,
        "strategy_id": 1, "symbol_id": 3, "trade_type": "equity",
        "rule_violations": [], "tags": ["momentum"], "status": "closed",
        "entry_reason": "trend continuation", "exit_reason": "partial profit",
        "notes": "exited early, left money on the table",
        "post_trade_thoughts": "should have held longer"
    },
    {
        "_id": "trade_003",
        "type": "buy", "quantity": 20,
        "entry_price": 89.5, "exit_price": 86.0,
        "stop_loss": 87.0, "take_profit": 95.0,
        "pl": -70.0, "returns": -3.91, "rr": 1.5, "actual_rr": 0.7,
        "outcome": "loss", "trade_date": "2026-02-18T00:00:00Z",
        "entry_execution": "early", "exit_execution": "late",
        "emotional_state": "anxious", "market_condition": "ranging",
        "confidence_level": 4, "is_fomo": True, "is_greed": False,
        "strategy_id": 2, "symbol_id": 5, "trade_type": "equity",
        "rule_violations": ["no confirmation", "traded against trend"],
        "tags": ["FOMO"], "status": "closed",
        "entry_reason": "feared missing move", "exit_reason": "panic exit",
        "notes": "chased the move, entered without confirmation",
        "post_trade_thoughts": "classic FOMO mistake"
    },
    {
        "_id": "trade_004",
        "type": "sell", "quantity": 30,
        "entry_price": 310.0, "exit_price": 298.0,
        "stop_loss": 315.0, "take_profit": 295.0,
        "pl": 360.0, "returns": 3.87, "rr": 3.0, "actual_rr": 2.4,
        "outcome": "win", "trade_date": "2026-02-20T00:00:00Z",
        "entry_execution": "perfect", "exit_execution": "perfect",
        "emotional_state": "calm", "market_condition": "volatile",
        "confidence_level": 9, "is_fomo": False, "is_greed": False,
        "strategy_id": 3, "symbol_id": 9, "trade_type": "equity",
        "rule_violations": [], "tags": ["shorting", "high-confidence"],
        "status": "closed",
        "entry_reason": "bearish reversal", "exit_reason": "target hit",
        "notes": "followed the plan perfectly",
        "post_trade_thoughts": "best trade this month"
    },
]


def run_test():
    print("=== Trading RAG — End-to-End Test ===\n")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY not set in .env")
        return

    # ── Step 1: Convert trades to text ──────────────────────────────────────
    print("Step 1: Converting trades to text...")
    for trade in SAMPLE_TRADES:
        text = trade_to_text(trade)
        print(f"  [{trade['_id']}] {text[:100]}...")
    print()

    # ── Step 2: Ingest into ChromaDB (Docker) ───────────────────────────────
    print("Step 2: Ingesting into ChromaDB (Docker)...")
    openai_client = OpenAI(api_key=api_key)

    chroma_host = os.getenv("CHROMA_HOST", "localhost")
    chroma_port = int(os.getenv("CHROMA_PORT", "8001"))

    # Connect to ChromaDB running in Docker via HTTP
    chroma_client = chromadb.HttpClient(host=chroma_host, port=chroma_port)

    try:
        chroma_client.heartbeat()
    except Exception:
        print(f"ERROR: Cannot reach ChromaDB at {chroma_host}:{chroma_port}")
        print("Make sure Docker is running: docker compose up -d")
        return

    collection = chroma_client.get_or_create_collection(
        name="trades_test",
        metadata={"hnsw:space": "cosine"}
    )

    texts      = [trade_to_text(t) for t in SAMPLE_TRADES]
    embeddings_resp = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=texts
    )
    embeddings = [item.embedding for item in embeddings_resp.data]
    ids        = [t["_id"] for t in SAMPLE_TRADES]

    collection.upsert(ids=ids, embeddings=embeddings, documents=texts)
    print(f"  Stored {collection.count()} trades.\n")

    # ── Step 3: Retrieve ────────────────────────────────────────────────────
    print("Step 3: Retrieving relevant trades for a test question...")
    test_question = "Why do I keep losing on early entries?"

    retriever = TradeRetriever.__new__(TradeRetriever)
    retriever.openai     = openai_client
    retriever.collection = collection

    retrieved = retriever.retrieve(test_question, n_results=4)
    print(f"  Retrieved {len(retrieved)} trades.")
    for r in retrieved:
        print(f"  Distance: {r['distance']} | {r['text'][:80]}...")
    print()

    # ── Step 4: Generate answer ─────────────────────────────────────────────
    print("Step 4: Generating LLM answer...")
    context  = retriever.format_context(retrieved)
    answerer = TradeAnswerer(openai_client)
    answer   = answerer.answer(test_question, context)

    print(f"\nQuestion: {test_question}")
    print(f"\nAnswer:\n{answer}")
    print("\n=== Test complete! ===")

    # Cleanup test collection
    chroma_client.delete_collection("trades_test")


if __name__ == "__main__":
    run_test()
