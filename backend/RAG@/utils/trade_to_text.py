"""Utility to convert a trade dict into a readable text chunk for embeddings."""

from __future__ import annotations


def _safe(value: object, default: str = "unknown") -> str:
    if value is None:
        return default
    text = str(value).strip()
    return text if text else default


def trade_to_text(trade: dict) -> str:
    """Convert one trade document into a compact natural-language summary."""
    trade_id = _safe(trade.get("_id"), "na")
    side = _safe(trade.get("type"))
    qty = _safe(trade.get("quantity"), "0")

    entry_price = _safe(trade.get("entry_price"), "0")
    exit_price = _safe(trade.get("exit_price"), "0")
    stop_loss = _safe(trade.get("stop_loss"), "na")
    take_profit = _safe(trade.get("take_profit"), "na")

    outcome = _safe(trade.get("outcome"))
    pl = _safe(trade.get("pl"), "0")
    returns = _safe(trade.get("returns"), "0")
    rr = _safe(trade.get("rr"), "na")
    actual_rr = _safe(trade.get("actual_rr"), "na")

    trade_date = _safe(trade.get("trade_date"), "na")
    market_condition = _safe(trade.get("market_condition"))
    emotional_state = _safe(trade.get("emotional_state"))
    confidence = _safe(trade.get("confidence_level"), "na")

    entry_execution = _safe(trade.get("entry_execution"))
    exit_execution = _safe(trade.get("exit_execution"))
    is_fomo = _safe(trade.get("is_fomo"), "False")
    is_greed = _safe(trade.get("is_greed"), "False")

    entry_reason = _safe(trade.get("entry_reason"), "na")
    exit_reason = _safe(trade.get("exit_reason"), "na")
    notes = _safe(trade.get("notes"), "none")
    reflections = _safe(trade.get("post_trade_thoughts"), "none")

    rule_violations_raw = trade.get("rule_violations", [])
    if isinstance(rule_violations_raw, (list, tuple)):
        rule_violations = ", ".join(str(v) for v in rule_violations_raw if str(v).strip()) or "none"
    else:
        rule_violations = _safe(rule_violations_raw, "none")

    tags_raw = trade.get("tags", [])
    if isinstance(tags_raw, (list, tuple)):
        tags = ", ".join(str(v) for v in tags_raw if str(v).strip()) or "none"
    else:
        tags = _safe(tags_raw, "none")

    return (
        f"trade_id={trade_id}; date={trade_date}; side={side}; quantity={qty}; "
        f"entry={entry_price}; exit={exit_price}; stop_loss={stop_loss}; take_profit={take_profit}; "
        f"outcome={outcome}; pl={pl}; returns={returns}; rr={rr}; actual_rr={actual_rr}; "
        f"entry_execution={entry_execution}; exit_execution={exit_execution}; "
        f"market_condition={market_condition}; emotional_state={emotional_state}; confidence={confidence}; "
        f"is_fomo={is_fomo}; is_greed={is_greed}; "
        f"entry_reason={entry_reason}; exit_reason={exit_reason}; "
        f"rule_violations={rule_violations}; tags={tags}; "
        f"notes={notes}; reflections={reflections}"
    )
