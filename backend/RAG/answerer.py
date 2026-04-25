"""
api/answerer.py
---------------
Step 3 of the RAG pipeline: Generation.

Takes the retrieved trade context + the user's question,
sends both to the LLM, and returns a structured answer.

The system prompt is the key — it tells the LLM exactly
how to behave as a trading coach.
"""

from openai import OpenAI

CHAT_MODEL = "gpt-4o"   # or "gpt-4-turbo" or "gpt-3.5-turbo" (cheaper)

SYSTEM_PROMPT = """
You are an expert trading coach and performance analyst.
You have access to a trader's personal trade history.

Your job is to:
1. Analyze the provided trades to answer the trader's question
2. Identify patterns in their behavior, execution, and outcomes
3. Give specific, actionable feedback — not generic advice
4. Always reference specific trades from the context when making a point
5. Be honest about weaknesses, but constructive

When answering:
- Cite specific examples from the trade data (e.g. "In your trade on Feb 14...")
- Highlight patterns you notice (e.g. "7 out of 10 early entries resulted in losses")
- Separate facts (from the data) from interpretations (your analysis)
- Keep answers clear and structured

If the trade data doesn't contain enough information to answer confidently,
say so clearly rather than guessing.

The trader's data uses these fields:
- outcome: "win" or "loss"
- entry_execution: "early", "perfect", or "late"
- emotional_state: calm, anxious, confident, fearful, etc.
- market_condition: ranging, trending, volatile, etc.
- is_fomo: true if the trade was FOMO-driven
- is_greed: true if the trade was greed-driven
- rule_violations: list of rules the trader broke
- pl: profit/loss in currency
- rr: risk-reward ratio
"""


class TradeAnswerer:
    def __init__(self, openai_client: OpenAI):
        self.openai = openai_client

    def answer(
        self,
        question: str,
        context: str,
        conversation_history: list[dict] = None
    ) -> str:
        """
        Send the question + retrieved trade context to the LLM.

        Args:
            question:             The user's question
            context:              Formatted trade texts from the retriever
            conversation_history: Previous messages (for multi-turn chat)

        Returns:
            The LLM's answer as a string
        """

        # Build the user message — question + context together
        user_message = f"""
Question: {question}

---
{context}
---

Please analyze the trades above and answer my question.
"""

        # Build message list for the API call
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Add conversation history if provided (for follow-up questions)
        if conversation_history:
            messages.extend(conversation_history)

        messages.append({"role": "user", "content": user_message})

        # Call the LLM
        response = self.openai.chat.completions.create(
            model=CHAT_MODEL,
            messages=messages,
            temperature=0.3,    # Low temperature = more focused, less creative
            max_tokens=1500
        )

        return response.choices[0].message.content
