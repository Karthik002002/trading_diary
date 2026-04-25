"""
answerer.py
-----------
Step 3 of the RAG pipeline: answer generation.

Takes user question + retrieved trade context and asks an LLM for
an analysis grounded in those trades.
"""

from openai import OpenAI


CHAT_MODEL = "gpt-4o"


class TradeAnswerer:
    def __init__(self, openai_client: OpenAI):
        self.openai = openai_client

    def answer(
        self,
        question: str,
        context: str,
        conversation_history: list[dict] | None = None,
    ) -> str:
        system_prompt = (
            "You are a trading performance coach. "
            "Use only the provided trade context. "
            "If context is insufficient, say so clearly. "
            "Be concise, practical, and specific."
        )

        messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]

        if conversation_history:
            for item in conversation_history:
                role = item.get("role")
                content = item.get("content", "")
                if role in {"user", "assistant"} and content:
                    messages.append({"role": role, "content": content})

        user_prompt = (
            f"Question:\n{question}\n\n"
            f"Retrieved trade context:\n{context}\n\n"
            "Provide:\n"
            "1) Key patterns\n"
            "2) Root causes\n"
            "3) Actionable next steps"
        )
        messages.append({"role": "user", "content": user_prompt})

        response = self.openai.chat.completions.create(
            model=CHAT_MODEL,
            messages=messages,
            temperature=0.2,
        )
        return response.choices[0].message.content or ""

