# Trading RAG â€” AI Analysis of Your Trade History

Ask natural language questions about your 1000+ trades and get AI-powered insights.

## How It Works

```
Your MongoDB trades
       â†“
Convert each trade to readable text
       â†“
Embed text â†’ store in ChromaDB (vector database)
       â†“
User asks a question â†’ find the most relevant trades
       â†“
Send those trades as context to GPT-4
       â†“
Get a specific, data-backed answer
```

---

## Project Structure

```
trading-rag/
â”œâ”€â”€ .env.example          â† copy to .env and fill in your keys
â”œâ”€â”€ requirements.txt      â† Python packages needed
â”œâ”€â”€ test_rag.py           â† quick end-to-end test (run this first!)
â”‚
â”œâ”€â”€ utils/
â”‚   â””â”€â”€ trade_to_text.py  â† converts trade JSON â†’ human-readable text
â”‚
â”œâ”€â”€ ingest/
â”‚   â””â”€â”€ ingest.py         â† fetches from MongoDB, embeds, stores in ChromaDB
â”‚
â””â”€â”€ api/
    â”œâ”€â”€ server.py          â† FastAPI server (your endpoints)
    â”œâ”€â”€ retriever.py       â† semantic search over ChromaDB
    â””â”€â”€ answerer.py        â† sends context + question to GPT-4
```

---

## Setup

### 1. Start ChromaDB in Docker
```bash
docker compose up -d
```
This starts ChromaDB in the background. It listens on `localhost:8001`.
Check it's running: `docker compose ps` or open `http://localhost:8001/api/v1/heartbeat`

### 2. Install Python packages
```bash
pip install -r requirements.txt
```

### 3. Set up environment variables
```bash
cp .env.example .env
# Edit .env and add your OpenAI key + MongoDB URI
```

### 4. Test the pipeline (no MongoDB needed yet)
```bash
python test_rag.py
```
This uses fake trades to confirm the pipeline works end to end.

### 5. Run the ingestion (connects to your real MongoDB)
```bash
python ingest.py
```
This will:
- Fetch all trades from MongoDB
- Convert each to text
- Embed using OpenAI
- Store in ChromaDB (Docker)

It's safe to re-run â€” already-ingested trades are skipped.

### 6. Start the API server
```bash
uvicorn server:app --reload --port 8000
```

### Docker commands reference
```bash
docker compose up -d        # start ChromaDB in background
docker compose down         # stop ChromaDB
docker compose logs chroma  # view ChromaDB logs
docker compose ps           # check if it's running
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
| Each question | gpt-4o | ~$0.01â€“0.05 |

Very cheap for personal use.

---

## Adding New Trades

Just re-run the ingestion script â€” it skips already-indexed trades:
```bash
python ingest.py
```

Or hit the API endpoint:
```bash
POST http://localhost:8000/ingest
```

> ChromaDB data is persisted in a Docker volume (`trading_chroma_data`).
> Your vectors survive `docker compose down` and restarts.

