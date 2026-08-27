from __future__ import annotations

from typing import Any

from ai_backend.fallback import build_negotiate_fallback
from ai_backend.llm_client import LLMClientError, get_llm_client


def generate_negotiation(
    *,
    pair_label: str,
    conflict_summary: list[str],
) -> dict[str, Any]:
    if not conflict_summary:
        return {"suggestions": [], "source": "skipped", "skipped": True}

    try:
        text = get_llm_client().generate(
            "negotiate",
            {"pair_label": pair_label, "conflict_summary": conflict_summary},
        )
        suggestions = [line.strip("- ").strip() for line in text.splitlines() if line.strip()]
        if not suggestions:
            raise LLMClientError("empty_negotiation", "No negotiation suggestions returned.")
    except LLMClientError:
        result = build_negotiate_fallback(pair_label=pair_label, conflict_summary=conflict_summary)
        result["skipped"] = False
        return result

    return {"suggestions": suggestions[:3], "source": "llm", "skipped": False}
