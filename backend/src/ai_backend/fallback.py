from __future__ import annotations

from typing import Any


def build_scenario_fallback(
    *,
    pair_label: str,
    preset_id: str,
    conflict_summary: list[str],
) -> dict[str, Any]:
    details = ", ".join(conflict_summary[:2]) if conflict_summary else "생활 패턴 차이"
    return {
        "narrative": (
            f"{pair_label} 조합은 "
            f"{preset_id} 시나리오 기준에서 {details} 문제를 먼저 조율해야 합니다. "
            "입실 첫날에 수면, 소음, 청소 규칙을 먼저 확인하는 것이 좋습니다."
        ),
        "source": "fallback",
    }


def build_negotiate_fallback(
    *,
    pair_label: str,
    conflict_summary: list[str],
) -> dict[str, Any]:
    primary = conflict_summary[0] if conflict_summary else "생활 리듬 차이"
    return {
        "suggestions": [
            f"{pair_label}는 {primary}부터 먼저 이야기하고 두 사람 모두 편한 기준으로 맞춰본다.",
            "미리 공유가 필요한 일정은 하루 전에 메시지로 알려주기로 한다.",
            "불편한 점이 생기면 참아두기보다 짧게라도 바로 이야기해 조정한다.",
        ],
        "source": "fallback",
    }


def build_chat_question_fallback(
    *,
    pair_label: str,
    conflict_summary: list[str],
    recent_messages: list[str],
    current_speaker_name: str | None = None,
    other_speaker_name: str | None = None,
) -> dict[str, Any]:
    primary = conflict_summary[0] if conflict_summary else "생활 패턴"
    recent_hint = recent_messages[-1] if recent_messages else ""
    listener = other_speaker_name or "상대"

    questions = [
        f"{listener}님은 {primary}와 관련해서 꼭 맞춰두고 싶은 기준이 있는지 먼저 물어보면 좋아요.",
        f"{listener}님은 평일 기준으로 보통 몇 시쯤 자고 일어나는 편인지 가볍게 물어보면 좋아요.",
        "같이 살기 시작하면 초반에 어떤 약속부터 정해두면 좋을지 편하게 물어보면 좋아요.",
    ]
    if recent_hint:
        questions[1] = (
            "방금 나눈 이야기와 이어서, "
            f"\"{recent_hint}\"와 연결되는 생활 기준을 조금 더 물어보면 좋아요."
        )

    return {"questions": questions[:3], "source": "fallback"}


def build_pact_fallback(
    *,
    pair_label: str,
    shared_rules: list[str],
) -> dict[str, Any]:
    rules = list(shared_rules[:3])
    if not rules:
        rules = [
            f"{pair_label}는 취침 전에 공용 공간을 같이 한 번 정리해두기로 한다.",
            f"{pair_label}는 조용히 쉬고 싶은 시간대를 서로 먼저 확인하고 맞춰간다.",
        ]
    return {"rules": rules, "source": "fallback"}
