"""
api/retriever.py
----------------
Step 2 of the RAG pipeline: Retrieval.

When the user asks a question, this module:
  1. Embeds the question (converts it to numbers)
  2. Searches ChromaDB for the most similar trade texts
  3. Returns those trades as context for the LLM

Think of it as a "semantic search" over your trades.
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openai import OpenAI
import chromadb

EMBEDDING_MODEL   = "text-embedding-3-small"
CHROMA_COLLECTION = "trades"


class TradeRetriever:
    def __init__(self, openai_client: OpenAI, chroma_path: str):
        self.openai  = openai_client
        self.chroma  = chromadb.PersistentClient(path=chroma_path)
        self.collection = self.chroma.get_or_create_collection(
            name=CHROMA_COLLECTION,
            metadata={"hnsw:space": "cosine"}
        )

    def embed_query(self, query: str) -> list[float]:
        """Convert the user's question into an embedding vector."""
        response = self.openai.embeddings.create(
            model=EMBEDDING_MODEL,
            input=[query]
        )
        return response.data[0].embedding

    def retrieve(
        self,
        query: str,
        n_results: int = 20,
        filters: dict = None
    ) -> list[dict]:
        """
        Find the most relevant trades for the user's question.

        Args:
            query:     The user's natural language question
            n_results: How many trades to retrieve (10-30 is a good range)
            filters:   Optional ChromaDB metadata filters, e.g.:
                       {"outcome": "loss"}  — only retrieve losing trades
                       {"emotional_state": "anxious"}

        Returns:
            List of dicts with 'text', 'metadata', and 'distance' keys
        """
        query_embedding = self.embed_query(query)

        # Build ChromaDB where clause from filters
        where_clause = None
        if filters:
            # ChromaDB filter format: {"field": {"$eq": "value"}}
            conditions = [
                {k: {"$eq": v}} for k, v in filters.items()
            ]
            if len(conditions) == 1:
                where_clause = conditions[0]
            else:
                where_clause = {"$and": conditions}

        # Query ChromaDB
        query_kwargs = {
            "query_embeddings": [query_embedding],
            "n_results": min(n_results, self.collection.count()),
            "include": ["documents", "metadatas", "distances"]
        }
        if where_clause:
            query_kwargs["where"] = where_clause

        results = self.collection.query(**query_kwargs)

        # Format results into clean dicts
        retrieved = []
        for i in range(len(results["ids"][0])):
            retrieved.append({
                "text":     results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "distance": round(results["distances"][0][i], 4),
                # distance: 0 = identical, 1 = completely different
                # Lower distance = more relevant to the question
            })

        return retrieved

    def format_context(self, retrieved_trades: list[dict]) -> str:
        """
        Format retrieved trades into a single context string for the LLM.
        Each trade is numbered so the LLM can reference specific ones.
        """
        if not retrieved_trades:
            return "No relevant trades found."

        lines = [f"Here are {len(retrieved_trades)} of your most relevant trades:\n"]
        for i, trade in enumerate(retrieved_trades, 1):
            lines.append(f"Trade {i}: {trade['text']}")
            lines.append("")  # blank line between trades

        return "\n".join(lines)
