from __future__ import annotations

from itertools import combinations
from typing import Any


def calculate_pair_scores(students: list[dict[str, Any]]) -> list[dict[str, Any]]:
    pair_scores = [
        _score_pair(student_a, student_b)
        for student_a, student_b in combinations(students, 2)
    ]
    pair_scores.sort(key=lambda item: (item["student_a"], item["student_b"]))
    return pair_scores


def _score_pair(student_a: dict[str, Any], student_b: dict[str, Any]) -> dict[str, Any]:
    lifestyle_a = dict(student_a.get("lifestyle", {}))
    lifestyle_b = dict(student_b.get("lifestyle", {}))
    conflicts = _required_rule_conflicts(
        student_a,
        student_b,
    ) + _required_rule_conflicts(student_b, student_a)

    positive_factors: list[tuple[int, str]] = []
    mismatch_factors: list[str] = []
    score = 40

    for key in sorted(set(lifestyle_a) | set(lifestyle_b)):
        value_a = lifestyle_a.get(key)
        value_b = lifestyle_b.get(key)
        if value_a and value_b and value_a == value_b:
            score += 12
            positive_factors.append((12, f"{_label(key)} 패턴이 유사합니다"))
        elif value_a and value_b and value_a != value_b:
            score -= 5
            mismatch_factors.append(f"{_label(key)} 선호가 다릅니다")

    for key in sorted(
        set(student_a.get("preferences", {})) | set(student_b.get("preferences", {}))
    ):
        weight_a = int(student_a.get("preferences", {}).get(key, 0))
        weight_b = int(student_b.get("preferences", {}).get(key, 0))
        combined_weight = weight_a + weight_b
        if combined_weight == 0:
            continue

        if lifestyle_a.get(key) and lifestyle_a.get(key) == lifestyle_b.get(key):
            bonus = min(combined_weight, 16)
            score += bonus
            positive_factors.append((bonus, f"{_label(key)} 중요도가 함께 높습니다"))
        else:
            score -= min(max(combined_weight // 2, 1), 8)
            if combined_weight >= 6:
                mismatch_factors.append(f"{_label(key)} 기준을 먼저 조율해야 합니다")

    eligible = not conflicts
    if not eligible:
        score = 0

    positive_factors.sort(key=lambda item: (-item[0], item[1]))
    reasons = [reason for _, reason in positive_factors[:3]]
    if not reasons:
        reasons = ["핵심 필수 조건 충돌이 없고 기본 생활 리듬을 비교했습니다"]

    conflict_summary: list[str] = []
    for item in conflicts + mismatch_factors:
        if item not in conflict_summary:
            conflict_summary.append(item)

    return {
        "student_a": student_a["student_id"],
        "student_b": student_b["student_id"],
        "pair_key": "|".join(sorted([student_a["student_id"], student_b["student_id"]])),
        "score": max(min(score, 100), 0),
        "eligible": eligible,
        "reasons": reasons,
        "conflict_summary": conflict_summary[:3],
    }


def _required_rule_conflicts(
    source_student: dict[str, Any],
    other_student: dict[str, Any],
) -> list[str]:
    conflicts: list[str] = []
    lifestyle = dict(other_student.get("lifestyle", {}))

    for rule in source_student.get("required_rules", []):
        parsed = _parse_rule(rule)
        if parsed is None:
            continue
        key, expected = parsed
        if lifestyle.get(key) != expected:
            conflicts.append(
                f"{source_student['student_id']}의 필수 조건 {_label(key)}={expected}를 "
                f"{other_student['student_id']}가 충족하지 않습니다"
            )
    return conflicts


def _parse_rule(rule: str) -> tuple[str, str] | None:
    for separator in ("=", ":"):
        if separator in rule:
            key, value = rule.split(separator, 1)
            return key.strip(), value.strip()
    return None


def _label(key: str) -> str:
    return {
        "sleep": "수면",
        "wake": "기상",
        "cleanliness": "청결",
        "noise": "소음",
        "study": "학습",
    }.get(key, key)
