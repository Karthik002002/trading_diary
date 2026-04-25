"""
utils/trade_to_text.py
----------------------
Converts a raw MongoDB trade document into a human-readable sentence.
This is the core of RAG — we need text to embed, not raw JSON.

The richer the text, the better the retrieval will be.
"""

from datetime import datetime


def trade_to_text(trade: dict) -> str:
    """
    Convert one trade document into a descriptive sentence.

    Example output:
    "On 2026-02-14 (Saturday), I bought 35 units at entry ₹118.45,
     exited at ₹117.36. The trade was a loss with P&L of ₹-38.15.
     Entry execution was early, exit execution was perfect.
     Emotional state: calm. Market condition: ranging.
     Risk-reward planned: 1.73, actual: 1.0.
     Strategy ID: 2. Trade type: equity.
     Tags: none. Rule violations: none."
    """

    # --- Date formatting ---
    raw_date = trade.get("trade_date", "")
    try:
        dt = datetime.fromisoformat(str(raw_date).replace("Z", "+00:00"))
        date_str = dt.strftime("%Y-%m-%d (%A)")  # e.g. "2026-02-14 (Saturday)"
    except Exception:
        date_str = str(raw_date)

    # --- Core trade fields ---
    direction     = trade.get("type", "unknown")           # buy / sell
    quantity      = trade.get("quantity", 0)
    entry_price   = trade.get("entry_price", 0)
    exit_price    = trade.get("exit_price", 0)
    stop_loss     = trade.get("stop_loss", "N/A")
    take_profit   = trade.get("take_profit", "N/A")
    outcome       = trade.get("outcome", "unknown")        # win / loss / breakeven
    pl            = trade.get("pl", 0)
    returns_pct   = trade.get("returns", 0)

    # --- Execution quality ---
    entry_exec    = trade.get("entry_execution", "unknown")   # early / perfect / late
    exit_exec     = trade.get("exit_execution", "unknown")
    emotion       = trade.get("emotional_state", "unknown")   # calm / anxious / FOMO
    market        = trade.get("market_condition", "unknown")  # trending / ranging
    planned_rr    = trade.get("planned_rr", trade.get("rr", 0))
    actual_rr     = trade.get("actual_rr", 0)

    # --- Behavioural flags ---
    is_greed      = trade.get("is_greed", False)
    is_fomo       = trade.get("is_fomo", False)
    confidence    = trade.get("confidence_level", "N/A")      # 1-10

    # --- Meta ---
    strategy_id   = trade.get("strategy_id", "N/A")
    symbol_id     = trade.get("symbol_id", "N/A")
    trade_type    = trade.get("trade_type", "N/A")            # equity / futures / options
    status        = trade.get("status", "N/A")                # NIN / closed etc.

    # --- Lists ---
    tags          = trade.get("tags", [])
    violations    = trade.get("rule_violations", [])
    tags_str      = ", ".join(tags) if tags else "none"
    violations_str = ", ".join(violations) if violations else "none"

    # --- Notes ---
    entry_reason  = trade.get("entry_reason", "") or "not recorded"
    exit_reason   = trade.get("exit_reason", "") or "not recorded"
    notes         = trade.get("notes", "") or "none"
    post_thoughts = trade.get("post_trade_thoughts", "") or "none"

    # --- Behavioral flags as text ---
    flags = []
    if is_greed:
        flags.append("greed-driven")
    if is_fomo:
        flags.append("FOMO-driven")
    flags_str = ", ".join(flags) if flags else "no behavioral flags"

    # --- Assemble the full text ---
    text = (
        f"On {date_str}, I {direction} {quantity} units "
        f"at entry ₹{entry_price}, exited at ₹{exit_price} "
        f"(stop loss: ₹{stop_loss}, take profit: ₹{take_profit}). "
        f"The trade was a {outcome} with P&L of ₹{round(pl, 2)} ({returns_pct}% return). "
        f"Entry execution: {entry_exec}. Exit execution: {exit_exec}. "
        f"Emotional state: {emotion}. Market condition: {market}. "
        f"Confidence level: {confidence}/10. "
        f"Planned R:R: {round(float(planned_rr), 2)}, actual R:R: {round(float(actual_rr), 2)}. "
        f"Strategy: {strategy_id}. Symbol ID: {symbol_id}. "
        f"Trade type: {trade_type}. Status: {status}. "
        f"Behavioral flags: {flags_str}. "
        f"Tags: {tags_str}. Rule violations: {violations_str}. "
        f"Entry reason: {entry_reason}. Exit reason: {exit_reason}. "
        f"Notes: {notes}. Post-trade thoughts: {post_thoughts}."
    )

    return text


def trades_to_texts(trades: list[dict]) -> list[str]:
    """Convert a list of trade documents to a list of text strings."""
    return [trade_to_text(t) for t in trades]
