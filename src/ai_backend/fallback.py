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
            f"{pair_label}는 {primary}에 대해 입실 첫 주에 공통 기준을 정한다.",
            "사전 공유가 필요한 일정은 하루 전에 메시지로 알려준다.",
            "불편이 생기면 주 1회 10분 점검으로 조정한다.",
        ],
        "source": "fallback",
    }


def build_pact_fallback(
    *,
    pair_label: str,
    shared_rules: list[str],
) -> dict[str, Any]:
    rules = list(shared_rules[:3])
    if not rules:
        rules = [
            f"{pair_label}는 취침 전 공용 공간 정리를 함께 유지한다.",
            f"{pair_label}는 조용한 시간대를 서로 존중한다.",
        ]
    return {"rules": rules, "source": "fallback"}
