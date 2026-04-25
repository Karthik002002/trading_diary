"""
ingest/ingest.py
----------------
Step 1 of the RAG pipeline.

This script:
  1. Connects to your MongoDB and fetches all trades
  2. Converts each trade to a text description
  3. Sends each text to OpenAI to get an embedding (a list of numbers)
  4. Stores everything in ChromaDB (your local vector database)

Run this once to build the index, and re-run whenever you add new trades.

Usage:
  python ingest/ingest.py
"""

import os
import sys
import time

# Allow imports from project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from pymongo import MongoClient
from openai import OpenAI
import chromadb

from utils.trade_to_text import trade_to_text

load_dotenv()

# ── Configuration ────────────────────────────────────────────────────────────

OPENAI_API_KEY  = os.getenv("OPENAI_API_KEY")
MONGO_URI       = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME   = os.getenv("MONGO_DB_NAME", "trading_db")
MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "trades")
CHROMA_PATH     = os.getenv("CHROMA_PATH", "./chroma_store")

# OpenAI embedding model — text-embedding-3-small is cheap and fast
EMBEDDING_MODEL = "text-embedding-3-small"

# ChromaDB collection name
CHROMA_COLLECTION = "trades"

# How many trades to embed in one API call (max 2048 per OpenAI batch)
BATCH_SIZE = 100


# ── Clients ──────────────────────────────────────────────────────────────────

def get_mongo_client():
    print(f"Connecting to MongoDB at {MONGO_URI}...")
    client = MongoClient(MONGO_URI)
    # Test connection
    client.admin.command("ping")
    print("MongoDB connected.")
    return client


def get_openai_client():
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not set in .env file")
    return OpenAI(api_key=OPENAI_API_KEY)


def get_chroma_collection():
    """
    Create or open the ChromaDB collection.
    ChromaDB stores data as files on disk at CHROMA_PATH.
    """
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    # get_or_create_collection: safe to call multiple times
    collection = client.get_or_create_collection(
        name=CHROMA_COLLECTION,
        metadata={"hnsw:space": "cosine"}  # cosine similarity for text
    )
    return collection


# ── Core logic ────────────────────────────────────────────────────────────────

def fetch_trades_from_mongo() -> list[dict]:
    """Fetch all trades from MongoDB."""
    client = get_mongo_client()
    db = client[MONGO_DB_NAME]
    collection = db[MONGO_COLLECTION]

    trades = list(collection.find({}))
    print(f"Fetched {len(trades)} trades from MongoDB.")
    return trades


def embed_texts(openai_client: OpenAI, texts: list[str]) -> list[list[float]]:
    """
    Send texts to OpenAI and get back embeddings.
    An embedding is a list of ~1536 numbers that captures meaning.
    Similar texts will have similar numbers.
    """
    response = openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts
    )
    # Extract the embedding vectors from the response
    return [item.embedding for item in response.data]


def already_ingested(collection, trade_id: str) -> bool:
    """Check if a trade is already in ChromaDB (to avoid duplicates)."""
    result = collection.get(ids=[trade_id])
    return len(result["ids"]) > 0


def ingest_trades(trades: list[dict], openai_client: OpenAI, collection):
    """
    Main ingestion loop:
    - Convert trades to text
    - Embed in batches
    - Store in ChromaDB
    """
    # Filter out trades already in ChromaDB
    new_trades = []
    for trade in trades:
        trade_id = str(trade["_id"])
        if not already_ingested(collection, trade_id):
            new_trades.append(trade)

    if not new_trades:
        print("All trades already ingested. Nothing to do.")
        return

    print(f"{len(new_trades)} new trades to ingest (skipping already-stored ones).")

    # Process in batches to avoid hitting API rate limits
    total_batches = (len(new_trades) + BATCH_SIZE - 1) // BATCH_SIZE

    for batch_num in range(total_batches):
        start = batch_num * BATCH_SIZE
        end   = start + BATCH_SIZE
        batch = new_trades[start:end]

        print(f"Processing batch {batch_num + 1}/{total_batches} ({len(batch)} trades)...")

        # Step 1: Convert each trade dict → readable text
        texts = [trade_to_text(t) for t in batch]

        # Step 2: Get embeddings from OpenAI
        embeddings = embed_texts(openai_client, texts)

        # Step 3: Prepare metadata to store alongside the vectors
        # This lets us filter by outcome, symbol, date etc. later
        ids       = [str(t["_id"]) for t in batch]
        metadatas = [
            {
                "trade_id":        str(t["_id"]),
                "outcome":         t.get("outcome", "unknown"),
                "type":            t.get("type", "unknown"),
                "symbol_id":       str(t.get("symbol_id", "")),
                "strategy_id":     str(t.get("strategy_id", "")),
                "emotional_state": t.get("emotional_state", "unknown"),
                "entry_execution": t.get("entry_execution", "unknown"),
                "market_condition":t.get("market_condition", "unknown"),
                "is_fomo":         str(t.get("is_fomo", False)),
                "is_greed":        str(t.get("is_greed", False)),
                "pl":              str(round(t.get("pl", 0), 2)),
                "trade_date":      str(t.get("trade_date", "")),
            }
            for t in batch
        ]

        # Step 4: Upsert into ChromaDB
        # upsert = insert if new, update if exists
        collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=texts,        # the raw text (returned in search results)
            metadatas=metadatas     # the structured fields (for filtering)
        )

        print(f"  Stored {len(batch)} trades in ChromaDB.")

        # Small delay to avoid OpenAI rate limits (optional but safe)
        if batch_num < total_batches - 1:
            time.sleep(0.5)

    print(f"\nIngestion complete! {len(new_trades)} trades stored in ChromaDB at '{CHROMA_PATH}'.")
    print(f"Total trades in collection: {collection.count()}")


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=== Trading RAG Ingestion Pipeline ===\n")

    trades          = fetch_trades_from_mongo()
    openai_client   = get_openai_client()
    collection      = get_chroma_collection()

    ingest_trades(trades, openai_client, collection)

    print("\nDone! You can now run the API server: uvicorn api.server:app --reload")
