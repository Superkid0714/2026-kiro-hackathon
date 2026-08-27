from __future__ import annotations

from typing import Any

from ai_backend.fallback import build_scenario_fallback
from ai_backend.llm_client import LLMClientError, get_llm_client


def generate_scenario(
    *,
    pair_label: str,
    preset_id: str,
    conflict_summary: list[str],
) -> dict[str, Any]:
    if not conflict_summary:
        return {"narrative": "", "source": "skipped", "skipped": True}

    payload = {
        "pair_label": pair_label,
        "preset_id": preset_id,
        "conflict_summary": conflict_summary,
    }
    try:
        narrative = get_llm_client().generate("scenario", payload)
    except LLMClientError:
        result = build_scenario_fallback(
            pair_label=pair_label,
            preset_id=preset_id,
            conflict_summary=conflict_summary,
        )
        result["skipped"] = False
        return result

    return {"narrative": narrative, "source": "llm", "skipped": False}
