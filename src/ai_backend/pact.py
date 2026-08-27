from __future__ import annotations

from typing import Any

from ai_backend.fallback import build_pact_fallback
from ai_backend.llm_client import LLMClientError, get_llm_client


def generate_pact(
    *,
    pair_label: str,
    shared_rules: list[str],
) -> dict[str, Any]:
    if not shared_rules:
        result = build_pact_fallback(pair_label=pair_label, shared_rules=shared_rules)
        result["skipped"] = True
        return result

    try:
        text = get_llm_client().generate(
            "pact",
            {"pair_label": pair_label, "shared_rules": shared_rules},
        )
        rules = [line.strip("- ").strip() for line in text.splitlines() if line.strip()]
        if not rules:
            raise LLMClientError("empty_pact", "No pact rules returned.")
    except LLMClientError:
        result = build_pact_fallback(pair_label=pair_label, shared_rules=shared_rules)
        result["skipped"] = False
        return result

    return {"rules": rules[:3], "source": "llm", "skipped": False}
