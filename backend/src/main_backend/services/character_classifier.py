from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class WeightedAxisValue:
    value: float
    weight: float
    label: str


TYPE_NAMES = {
    "ROO": "함께둥글형",
    "DUDI": "함께정돈형",
    "PEE": "규칙중시형",
    "MOMO": "자유독립형",
}


def classify_character(interview: dict[str, Any]) -> dict[str, Any]:
    rule_entries = _rule_axis_entries(interview)
    sharing_entries = _sharing_axis_entries(interview)

    rule_score = _normalize(rule_entries)
    sharing_score = _normalize(sharing_entries)
    type_code = _resolve_type(rule_score, sharing_score)

    return {
        "rule_score": rule_score,
        "sharing_score": sharing_score,
        "type_code": type_code,
        "type_name": TYPE_NAMES[type_code],
        "top_factors": _top_factors(rule_entries, sharing_entries),
    }


def _normalize(entries: list[WeightedAxisValue]) -> float:
    total_weight = sum(entry.weight for entry in entries)
    if total_weight == 0:
        return 50.0
    weighted_sum = sum(entry.value * entry.weight for entry in entries)
    return round((weighted_sum / total_weight) * 100, 1)


def _resolve_type(rule_score: float, sharing_score: float) -> str:
    if rule_score >= 50 and sharing_score >= 50:
        return "DUDI"
    if rule_score >= 50 and sharing_score < 50:
        return "PEE"
    if rule_score < 50 and sharing_score >= 50:
        return "ROO"
    return "MOMO"


def _top_factors(
    rule_entries: list[WeightedAxisValue],
    sharing_entries: list[WeightedAxisValue],
) -> list[str]:
    combined = rule_entries + sharing_entries
    combined.sort(key=lambda entry: (-entry.weight, -entry.value, entry.label))
    labels: list[str] = []
    for entry in combined:
        if entry.value <= 0:
            continue
        if entry.label not in labels:
            labels.append(entry.label)
        if len(labels) == 3:
            break
    if not labels:
        labels.append("생활 인터뷰 기본 응답을 기준으로 성향을 계산했습니다")
    return labels


def _rule_axis_entries(interview: dict[str, Any]) -> list[WeightedAxisValue]:
    return [
        _entry(_bool(interview["noise_sensitive"]), 1.5, "생활 소음에 민감합니다"),
        _entry(
            _quiet_hours_score(interview["quiet_hours_start"]),
            1.5,
            "조용한 시간 기준이 분명합니다",
        ),
        _entry(
            _frequency_score(interview["cleaning_frequency"]),
            1.5,
            "청소 기준이 분명합니다",
        ),
        _entry(
            _deadline_score(interview["dishes_deadline"]),
            1.5,
            "공용 정리 마감이 빠른 편입니다",
        ),
        _entry(
            _frequency_score(interview["guest_frequency"]),
            0.5,
            "방문객 빈도 기준을 두는 편입니다",
        ),
        _entry(
            _conflict_resolution_score(interview["conflict_resolution"]),
            0.5,
            "문제가 생기면 바로 조율하려는 편입니다",
        ),
        _entry(
            _shared_cost_score(interview["shared_cost_rule"]),
            0.3,
            "공동 비용 기준을 명확히 두는 편입니다",
        ),
        _entry(
            _personal_access_rule_score(interview["personal_space_access"]),
            1.2,
            "개인 공간 출입 기준을 중요하게 생각합니다",
        ),
        _entry(
            _security_score(interview["security_preference"]),
            1.5,
            "보안과 잠금 기준을 중요하게 생각합니다",
        ),
        _entry(
            _absence_notice_score(interview["absence_notice"]),
            1.0,
            "외출 공유 규칙을 중요하게 생각합니다",
        ),
    ]


def _sharing_axis_entries(interview: dict[str, Any]) -> list[WeightedAxisValue]:
    return [
        _entry(
            _frequency_score(interview["guest_frequency"]),
            1.2,
            "방문객과 교류에 비교적 열려 있습니다",
        ),
        _entry(
            _frequency_score(interview["home_stay_frequency"]),
            0.5,
            "집에서 보내는 시간이 비교적 많습니다",
        ),
        _entry(
            _supplies_score(interview["supplies_sharing"]),
            1.7,
            "생필품과 식재료를 함께 쓰는 데 열려 있습니다",
        ),
        _entry(
            _conflict_resolution_score(interview["conflict_resolution"]),
            1.0,
            "문제가 생기면 바로 소통하는 편입니다",
        ),
        _entry(
            _shared_cost_score(interview["shared_cost_rule"]),
            0.8,
            "공동 비용을 함께 관리하는 편입니다",
        ),
        _entry(
            _personal_access_sharing_score(interview["personal_space_access"]),
            1.5,
            "개인 공간 경계가 비교적 개방적입니다",
        ),
        _entry(
            _personal_ratio_score(interview["personal_space_ratio"]),
            0.8,
            "공간을 유연하게 나누는 편입니다",
        ),
        _entry(
            _absence_notice_score(interview["absence_notice"]),
            1.0,
            "외출 여부를 공유하는 편입니다",
        ),
    ]


def _entry(value: float, weight: float, label: str) -> WeightedAxisValue:
    return WeightedAxisValue(value, weight, label)


def _bool(value: bool) -> float:
    return 1.0 if value else 0.0


def _quiet_hours_score(value: str) -> float:
    hour, minute = (int(part) for part in value.split(":"))
    total_minutes = hour * 60 + minute
    reference_start = 22 * 60
    reference_end = 2 * 60 + 24 * 60
    adjusted_minutes = (
        total_minutes if total_minutes >= reference_start else total_minutes + 24 * 60
    )
    if adjusted_minutes <= reference_start:
        return 1.0
    if adjusted_minutes >= reference_end:
        return 0.0
    return round(1 - ((adjusted_minutes - reference_start) / (reference_end - reference_start)), 4)


def _frequency_score(value: str) -> float:
    mapping = {
        "1": 0.0,
        "2": 0.17,
        "3": 0.33,
        "4": 0.50,
        "5": 0.67,
        "6": 0.83,
        "매일": 1.0,
    }
    return mapping[value]


def _deadline_score(value: str) -> float:
    return {
        "바로": 1.0,
        "그날 이내에": 0.5,
        "다음날 아침": 0.0,
    }[value]


def _conflict_resolution_score(value: str) -> float:
    return {
        "모아서 대면": 0.0,
        "즉시 대면": 1.0,
    }[value]


def _shared_cost_score(value: str) -> float:
    return {
        "거주 시간 비율": 0.0,
        "반반": 1.0,
    }[value]


def _personal_access_rule_score(value: str) -> float:
    return {
        "자유롭게": 0.0,
        "노크 혹은 허락": 0.7,
        "불가능": 1.0,
    }[value]


def _personal_access_sharing_score(value: str) -> float:
    return {
        "자유롭게": 1.0,
        "노크 혹은 허락": 0.5,
        "불가능": 0.0,
    }[value]


def _personal_ratio_score(value: str) -> float:
    return {
        "반반": 0.3,
        "필요한 만큼": 0.7,
    }[value]


def _security_score(value: str) -> float:
    return {
        "상관없음": 0.0,
        "외출시": 0.5,
        "항시 잠금": 1.0,
    }[value]


def _absence_notice_score(value: str) -> float:
    return {
        "필요 없음": 0.0,
        "하루 이상": 0.5,
        "항상": 1.0,
    }[value]


def _supplies_score(value: str) -> float:
    return {
        "각자": 0.0,
        "일부 공유": 0.5,
        "공동구매": 1.0,
    }[value]
