from __future__ import annotations

from typing import Any

from ai_backend.fallback import build_chat_question_fallback, build_negotiate_fallback
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


def generate_chat_question_suggestions(
    *,
    pair_label: str,
    conflict_summary: list[str],
    recent_messages: list[str],
    current_speaker_name: str | None = None,
    other_speaker_name: str | None = None,
) -> dict[str, Any]:
    if not conflict_summary and not recent_messages:
        fallback = build_chat_question_fallback(
            pair_label=pair_label,
            conflict_summary=[],
            recent_messages=[],
            current_speaker_name=current_speaker_name,
            other_speaker_name=other_speaker_name,
        )
        fallback["skipped"] = True
        return fallback

    try:
        text = get_llm_client().generate(
            "chat_questions",
            {
                "pair_label": pair_label,
                "conflict_summary": conflict_summary,
                "recent_messages": recent_messages,
                "current_speaker_name": current_speaker_name or "",
                "other_speaker_name": other_speaker_name or "",
            },
        )
        questions = [line.strip("- ").strip() for line in text.splitlines() if line.strip()]
        if not questions:
            raise LLMClientError("empty_chat_questions", "No chat question suggestions returned.")
    except LLMClientError:
        fallback = build_chat_question_fallback(
            pair_label=pair_label,
            conflict_summary=conflict_summary,
            recent_messages=recent_messages,
            current_speaker_name=current_speaker_name,
            other_speaker_name=other_speaker_name,
        )
        fallback["skipped"] = False
        return fallback

    return {"questions": questions[:3], "source": "llm", "skipped": False}
