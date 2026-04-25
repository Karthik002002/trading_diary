# Trading RAG — AI Analysis of Your Trade History

Ask natural language questions about your 1000+ trades and get AI-powered insights.

## How It Works

```
Your MongoDB trades
       ↓
Convert each trade to readable text
       ↓
Embed text → store in ChromaDB (vector database)
       ↓
User asks a question → find the most relevant trades
       ↓
Send those trades as context to GPT-4
       ↓
Get a specific, data-backed answer
```

---

## Project Structure

```
trading-rag/
├── .env.example          ← copy to .env and fill in your keys
├── requirements.txt      ← Python packages needed
├── test_rag.py           ← quick end-to-end test (run this first!)
│
├── utils/
│   └── trade_to_text.py  ← converts trade JSON → human-readable text
│
├── ingest/
│   └── ingest.py         ← fetches from MongoDB, embeds, stores in ChromaDB
│
└── api/
    ├── server.py          ← FastAPI server (your endpoints)
    ├── retriever.py       ← semantic search over ChromaDB
    └── answerer.py        ← sends context + question to GPT-4
```

---

## Setup

### 1. Install Python packages
```bash
pip install -r requirements.txt
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env and add your keys
```

### 3. Test the pipeline (no MongoDB needed yet)
```bash
python test_rag.py
```
This uses fake trades to confirm everything works.

### 4. Run the ingestion (connects to your real MongoDB)
```bash
python ingest/ingest.py
```
This will:
- Fetch all trades from MongoDB
- Convert each to text
- Embed using OpenAI
- Store in ChromaDB

It's safe to run multiple times — already-ingested trades are skipped.

### 5. Start the API server
```bash
uvicorn api.server:app --reload --port 8000
```

---

## API Endpoints

### Ask a single question
```bash
POST http://localhost:8000/ask
{
    "question": "Why do I keep losing on early entries?",
    "n_results": 20
}
```

### Ask with filters (only look at losing trades)
```bash
POST http://localhost:8000/ask
{
    "question": "What patterns do you see?",
    "n_results": 30,
    "filters": {"outcome": "loss"}
}
```

### Multi-turn conversation
```bash
POST http://localhost:8000/chat
{
    "messages": [
        {"role": "user", "content": "Why am I losing?"},
        {"role": "assistant", "content": "Based on your trades..."},
        {"role": "user", "content": "What about my FOMO trades specifically?"}
    ]
}
```

### Raw semantic search (no LLM)
```bash
POST http://localhost:8000/search
{
    "query": "FOMO trades that lost money",
    "n_results": 5,
    "filters": {"is_fomo": "True"}
}
```

### Check index stats
```bash
GET http://localhost:8000/stats
```

---

## Example Questions to Ask

**Behavioral patterns:**
- "Why do I keep losing?"
- "What do my worst trades have in common?"
- "Am I better when I'm calm vs anxious?"
- "How much does FOMO affect my P&L?"

**Execution analysis:**
- "What happens when I enter early?"
- "Should I be exiting earlier or later?"
- "Which strategy performs best?"

**Market conditions:**
- "Do I perform better in trending or ranging markets?"
- "When should I stop trading for the day?"

**Improvement:**
- "What are my top 3 things to improve?"
- "What rule violations cost me the most money?"

---

## Costs (approximate)

| Operation | Model | Cost per 1000 trades |
|---|---|---|
| Ingestion (embedding) | text-embedding-3-small | ~$0.02 |
| Each question | gpt-4o | ~$0.01–0.05 |

Very cheap for personal use.

---

## Adding New Trades

Just re-run the ingestion script — it skips already-indexed trades:
```bash
python ingest/ingest.py
```

Or hit the API endpoint:
```bash
POST http://localhost:8000/ingest
```
