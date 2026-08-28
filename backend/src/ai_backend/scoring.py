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
    conflicts = _required_rule_conflicts(
        student_a,
        student_b,
    ) + _required_rule_conflicts(student_b, student_a)
    conflicts += _hardcut_conflicts(student_a, student_b)
    conflicts += _hardcut_conflicts(student_b, student_a)

    positive_factors: list[tuple[int, str]] = []
    mismatch_factors: list[str] = []
    score = 40

    if _has_interview(student_a) and _has_interview(student_b):
        score = 50
        interview_delta = _score_interview_pair(
            student_a,
            student_b,
            positive_factors,
            mismatch_factors,
            conflicts,
        )
        score += interview_delta
    else:
        score += _score_legacy_pair(student_a, student_b, positive_factors, mismatch_factors)

    eligible = not conflicts
    if not eligible:
        score = 0

    positive_factors.sort(key=lambda item: (-item[0], item[1]))
    reasons = [reason for _, reason in positive_factors[:3]]
    if not reasons:
        reasons = [_default_reason(student_a, student_b)]

    conflict_summary: list[str] = []
    for item in conflicts + mismatch_factors:
        if item not in conflict_summary:
            conflict_summary.append(item)

    return {
        "student_a": student_a["student_id"],
        "student_b": student_b["student_id"],
        "pair_key": "|".join(sorted([student_a["student_id"], student_b["student_id"]])),
        "score": max(min(int(round(score)), 100), 0),
        "eligible": eligible,
        "reasons": reasons,
        "conflict_summary": conflict_summary[:3],
    }


def _score_legacy_pair(
    student_a: dict[str, Any],
    student_b: dict[str, Any],
    positive_factors: list[tuple[int, str]],
    mismatch_factors: list[str],
) -> int:
    lifestyle_a = dict(student_a.get("lifestyle", {}))
    lifestyle_b = dict(student_b.get("lifestyle", {}))
    score_delta = 0

    for key in sorted(set(lifestyle_a) | set(lifestyle_b)):
        value_a = lifestyle_a.get(key)
        value_b = lifestyle_b.get(key)
        if value_a and value_b and value_a == value_b:
            score_delta += 12
            positive_factors.append((12, f"{_label(key)} 패턴이 유사합니다"))
        elif value_a and value_b and value_a != value_b:
            score_delta -= 5
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
            score_delta += bonus
            positive_factors.append((bonus, f"{_label(key)} 중요도가 함께 높습니다"))
        else:
            penalty = min(max(combined_weight // 2, 1), 8)
            score_delta -= penalty
            if combined_weight >= 6:
                mismatch_factors.append(f"{_label(key)} 기준을 먼저 조율해야 합니다")

    return score_delta


def _score_interview_pair(
    student_a: dict[str, Any],
    student_b: dict[str, Any],
    positive_factors: list[tuple[int, str]],
    mismatch_factors: list[str],
    conflicts: list[str],
) -> int:
    interview_a = dict(student_a.get("interview", {}))
    interview_b = dict(student_b.get("interview", {}))
    delta = 0

    delta += _time_closeness(
        interview_a.get("wake_up_time"),
        interview_b.get("wake_up_time"),
        positive_factors,
        mismatch_factors,
        "기상 시간대가 비슷합니다",
        "기상 시간이 많이 달라 생활 리듬을 맞춰야 합니다",
        best=8,
        medium=4,
        soft_limit=30,
        medium_limit=60,
        hard_penalty=-4,
    )
    delta += _time_closeness(
        interview_a.get("sleep_time"),
        interview_b.get("sleep_time"),
        positive_factors,
        mismatch_factors,
        "취침 시간대가 비슷합니다",
        "취침 시간이 많이 달라 밤 시간대 조율이 필요합니다",
        best=10,
        medium=5,
        soft_limit=30,
        medium_limit=90,
        hard_penalty=-5,
    )
    delta += _time_closeness(
        interview_a.get("quiet_hours_start"),
        interview_b.get("quiet_hours_start"),
        positive_factors,
        mismatch_factors,
        "조용히 지내고 싶은 시간대가 잘 맞습니다",
        "조용한 시간 기준이 달라 야간 생활 조율이 필요합니다",
        best=8,
        medium=4,
        soft_limit=30,
        medium_limit=60,
        hard_penalty=-4,
    )

    delta += _same_bool_score(
        interview_a.get("noise_sensitive"),
        interview_b.get("noise_sensitive"),
        positive_factors,
        mismatch_factors,
        reason="생활 소음에 대한 민감도가 비슷합니다",
        mismatch="생활 소음 민감도가 달라 소음 기준 조율이 필요합니다",
        bonus=6,
        penalty=-4,
    )
    delta += _ordinal_score(
        interview_a.get("cleaning_frequency"),
        interview_b.get("cleaning_frequency"),
        _frequency_value,
        positive_factors,
        mismatch_factors,
        reason="청소 빈도 기준이 비슷합니다",
        mismatch="청소 빈도 기준 차이가 커서 생활 규칙 조율이 필요합니다",
        best=8,
        medium=4,
        close_diff=0,
        medium_diff=1,
        penalty=-4,
    )
    delta += _ordinal_score(
        interview_a.get("dishes_deadline"),
        interview_b.get("dishes_deadline"),
        _dishes_deadline_value,
        positive_factors,
        mismatch_factors,
        reason="설거지와 정리 마감 기준이 비슷합니다",
        mismatch="설거지와 정리 마감 기준 차이가 큽니다",
        best=7,
        medium=3,
        close_diff=0,
        medium_diff=1,
        penalty=-4,
    )
    delta += _ordinal_score(
        interview_a.get("guest_frequency"),
        interview_b.get("guest_frequency"),
        _frequency_value,
        positive_factors,
        mismatch_factors,
        reason="손님 초대 허용 범위가 비슷합니다",
        mismatch="손님 초대 허용 범위 차이가 커서 조율이 필요합니다",
        best=6,
        medium=3,
        close_diff=0,
        medium_diff=1,
        penalty=-5,
    )
    delta += _ordinal_score(
        interview_a.get("drinking_frequency"),
        interview_b.get("drinking_frequency"),
        _frequency_value,
        positive_factors,
        mismatch_factors,
        reason="음주 빈도가 비슷합니다",
        mismatch="음주 빈도 차이가 있어 생활 패턴 조율이 필요합니다",
        best=4,
        medium=2,
        close_diff=0,
        medium_diff=1,
        penalty=-2,
    )
    delta += _ordinal_score(
        interview_a.get("home_stay_frequency"),
        interview_b.get("home_stay_frequency"),
        _frequency_value,
        positive_factors,
        mismatch_factors,
        reason="집에 머무는 빈도가 비슷합니다",
        mismatch="집에 머무는 빈도 차이가 큽니다",
        best=5,
        medium=3,
        close_diff=0,
        medium_diff=1,
        penalty=-3,
    )
    delta += _same_value_score(
        interview_a.get("meal_preference"),
        interview_b.get("meal_preference"),
        positive_factors,
        mismatch_factors,
        reason="식사 스타일 선호가 비슷합니다",
        mismatch="식사 스타일 선호가 다릅니다",
        bonus=2,
        penalty=-1,
    )
    delta += _ordinal_score(
        interview_a.get("home_activity_frequency"),
        interview_b.get("home_activity_frequency"),
        _frequency_value,
        positive_factors,
        mismatch_factors,
        reason="집에서 활동하는 빈도가 비슷합니다",
        mismatch="집에서 활동하는 빈도 차이가 있습니다",
        best=4,
        medium=2,
        close_diff=0,
        medium_diff=1,
        penalty=-3,
    )
    delta += _supplies_sharing_score(
        interview_a.get("supplies_sharing"),
        interview_b.get("supplies_sharing"),
        positive_factors,
        mismatch_factors,
    )
    delta += _temperature_score(
        interview_a.get("summer_temperature"),
        interview_b.get("summer_temperature"),
        positive_factors,
        mismatch_factors,
        season="여름",
    )
    delta += _temperature_score(
        interview_a.get("winter_temperature"),
        interview_b.get("winter_temperature"),
        positive_factors,
        mismatch_factors,
        season="겨울",
    )
    delta += _pet_score(
        interview_a,
        interview_b,
        positive_factors,
        mismatch_factors,
    )
    delta += _same_value_score(
        interview_a.get("conflict_resolution"),
        interview_b.get("conflict_resolution"),
        positive_factors,
        mismatch_factors,
        reason="문제 해결 방식 선호가 비슷합니다",
        mismatch="문제 해결 방식이 달라 대화 방식 조율이 필요합니다",
        bonus=5,
        penalty=-2,
    )
    delta += _same_value_score(
        interview_a.get("shared_cost_rule"),
        interview_b.get("shared_cost_rule"),
        positive_factors,
        mismatch_factors,
        reason="생활비 관리 기준이 비슷합니다",
        mismatch="생활비 관리 기준이 다릅니다",
        bonus=4,
        penalty=-2,
    )
    delta += _personal_space_access_score(
        interview_a.get("personal_space_access"),
        interview_b.get("personal_space_access"),
        positive_factors,
        mismatch_factors,
    )
    delta += _same_value_score(
        interview_a.get("personal_space_ratio"),
        interview_b.get("personal_space_ratio"),
        positive_factors,
        mismatch_factors,
        reason="개인 공간 배분 감각이 비슷합니다",
        mismatch="개인 공간 배분에 대한 기대가 다릅니다",
        bonus=4,
        penalty=-2,
    )
    delta += _security_score(
        interview_a.get("security_preference"),
        interview_b.get("security_preference"),
        positive_factors,
        mismatch_factors,
    )
    delta += _absence_notice_score(
        interview_a.get("absence_notice"),
        interview_b.get("absence_notice"),
        positive_factors,
        mismatch_factors,
    )
    delta += _region_score(student_a, student_b, positive_factors, mismatch_factors)
    delta += _move_in_score(student_a, student_b, positive_factors, mismatch_factors)
    delta += _stay_duration_score(student_a, student_b, positive_factors, mismatch_factors)
    delta += _character_score(student_a, student_b, positive_factors, mismatch_factors)

    smoker_a = bool(interview_a.get("smokes"))
    smoker_b = bool(interview_b.get("smokes"))
    if smoker_a != smoker_b:
        smoking_place_a = interview_a.get("smoking_place")
        smoking_place_b = interview_b.get("smoking_place")
        if smoking_place_a == "집 안" or smoking_place_b == "집 안":
            conflicts.append("비흡연자와 실내 흡연 선호 조합이라 같은 방 배정이 어렵습니다")
        else:
            delta -= 6
            mismatch_factors.append("흡연 여부가 달라 흡연 규칙을 먼저 조율해야 합니다")
    elif smoker_a and smoker_b:
        delta += _same_value_score(
            interview_a.get("smoking_place"),
            interview_b.get("smoking_place"),
            positive_factors,
            mismatch_factors,
            reason="흡연 장소 기준이 비슷합니다",
            mismatch="흡연 장소 기준이 달라 조율이 필요합니다",
            bonus=3,
            penalty=-2,
        )
    else:
        positive_factors.append((4, "비흡연 생활 기준이 같습니다"))
        delta += 4

    return delta


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


def _hardcut_conflicts(
    source_student: dict[str, Any],
    other_student: dict[str, Any],
) -> list[str]:
    source_interview = dict(source_student.get("interview", {}))
    other_interview = dict(other_student.get("interview", {}))
    conditions = source_interview.get("hardcut_conditions")
    if not isinstance(conditions, list) or not conditions:
        return []

    conflicts: list[str] = []
    for raw_condition in conditions:
        condition = _string_or_none(raw_condition)
        if not condition:
            continue

        message = _match_hardcut_condition(condition, other_interview)
        if message and message not in conflicts:
            conflicts.append(message)
    return conflicts


def _match_hardcut_condition(condition: str, other_interview: dict[str, Any]) -> str | None:
    guest_frequency = _frequency_value(other_interview.get("guest_frequency"))
    cleaning_frequency = _frequency_value(other_interview.get("cleaning_frequency"))
    quiet_start = _time_to_minutes(other_interview.get("quiet_hours_start"))
    sleep_time = _time_to_minutes(other_interview.get("sleep_time"))
    home_activity = _frequency_value(other_interview.get("home_activity_frequency"))

    if condition == "실내 흡연":
        if bool(other_interview.get("smokes")) and other_interview.get("smoking_place") == "집 안":
            return "상대가 실내 흡연 성향이라 Hardcut 조건과 충돌합니다"
        return None

    if condition == "잦은 손님 방문":
        if guest_frequency is not None and guest_frequency >= 4:
            return "상대의 손님 방문 빈도가 높아 Hardcut 조건과 충돌합니다"
        return None

    if condition == "반려동물 필수":
        if bool(other_interview.get("pet_ok")):
            return "상대가 반려동물 동거를 전제로 생활할 가능성이 있어 Hardcut 조건과 충돌합니다"
        return None

    if condition == "주야간 근무 불일치":
        wake_time = _time_to_minutes(other_interview.get("wake_up_time"))
        if (
            wake_time is not None
            and sleep_time is not None
            and (wake_time >= 11 * 60 or sleep_time >= 1 * 60)
        ):
            return "상대의 생활 리듬이 늦은 시간대로 치우쳐 있어 Hardcut 조건과 충돌합니다"
        return None

    if condition == "공용공간 미청소":
        if (
            cleaning_frequency is not None
            and cleaning_frequency <= 2
        ) or other_interview.get("dishes_deadline") == "다음날 아침":
            return "상대의 공용공간 정리 기준이 낮아 Hardcut 조건과 충돌합니다"
        return None

    if condition == "늦은 밤 소음":
        late_quiet = quiet_start is not None and quiet_start >= 23 * 60
        active_at_home = home_activity is not None and home_activity >= 5
        late_sleep = sleep_time is not None and sleep_time >= 1 * 60
        if late_quiet or (active_at_home and late_sleep):
            return "상대가 늦은 밤까지 활동할 가능성이 높아 Hardcut 조건과 충돌합니다"
        return None

    return None


def _has_interview(student: dict[str, Any]) -> bool:
    interview = student.get("interview")
    return isinstance(interview, dict) and bool(interview)


def _default_reason(student_a: dict[str, Any], student_b: dict[str, Any]) -> str:
    if _has_interview(student_a) and _has_interview(student_b):
        return "생활 인터뷰와 기본 프로필 기준으로 호환성을 비교했습니다"
    return "핵심 필수 조건 충돌이 없고 기본 생활 리듬을 비교했습니다"


def _time_closeness(
    value_a: Any,
    value_b: Any,
    positive_factors: list[tuple[int, str]],
    mismatch_factors: list[str],
    reason: str,
    mismatch: str,
    *,
    best: int,
    medium: int,
    soft_limit: int,
    medium_limit: int,
    hard_penalty: int,
) -> int:
    minutes_a = _time_to_minutes(value_a)
    minutes_b = _time_to_minutes(value_b)
    if minutes_a is None or minutes_b is None:
        return 0

    difference = abs(minutes_a - minutes_b)
    if difference > 12 * 60:
        difference = 24 * 60 - difference

    if difference <= soft_limit:
        positive_factors.append((best, reason))
        return best
    if difference <= medium_limit:
        positive_factors.append((medium, reason))
        return medium

    mismatch_factors.append(mismatch)
    return hard_penalty


def _same_bool_score(
    value_a: Any,
    value_b: Any,
    positive_factors: list[tuple[int, str]],
    mismatch_factors: list[str],
    *,
    reason: str,
    mismatch: str,
    bonus: int,
    penalty: int,
) -> int:
    if value_a is None or value_b is None:
        return 0
    if bool(value_a) == bool(value_b):
        positive_factors.append((bonus, reason))
        return bonus
    mismatch_factors.append(mismatch)
    return penalty


def _same_value_score(
    value_a: Any,
    value_b: Any,
    positive_factors: list[tuple[int, str]],
    mismatch_factors: list[str],
    *,
    reason: str,
    mismatch: str,
    bonus: int,
    penalty: int,
) -> int:
    if not value_a or not value_b:
        return 0
    if value_a == value_b:
        positive_factors.append((bonus, reason))
        return bonus
    mismatch_factors.append(mismatch)
    return penalty


def _ordinal_score(
    value_a: Any,
    value_b: Any,
    normalizer: Any,
    positive_factors: list[tuple[int, str]],
    mismatch_factors: list[str],
    *,
    reason: str,
    mismatch: str,
    best: int,
    medium: int,
    close_diff: int,
    medium_diff: int,
    penalty: int,
) -> int:
    normalized_a = normalizer(value_a)
    normalized_b = normalizer(value_b)
    if normalized_a is None or normalized_b is None:
        return 0

    difference = abs(normalized_a - normalized_b)
    if difference <= close_diff:
        positive_factors.append((best, reason))
        return best
    if difference <= medium_diff:
        positive_factors.append((medium, reason))
        return medium

    mismatch_factors.append(mismatch)
    return penalty


def _supplies_sharing_score(
    value_a: Any,
    value_b: Any,
    positive_factors: list[tuple[int, str]],
    mismatch_factors: list[str],
) -> int:
    normalized_a = _supplies_value(value_a)
    normalized_b = _supplies_value(value_b)
    if normalized_a is None or normalized_b is None:
        return 0

    difference = abs(normalized_a - normalized_b)
    if difference == 0:
        positive_factors.append((7, "생필품과 식재료 공유 기준이 비슷합니다"))
        return 7
    if difference == 1:
        positive_factors.append((3, "생필품 공유 범위를 무리 없이 맞출 수 있습니다"))
        return 3

    mismatch_factors.append("생필품과 식재료 공유 방식이 많이 다릅니다")
    return -5


def _temperature_score(
    value_a: Any,
    value_b: Any,
    positive_factors: list[tuple[int, str]],
    mismatch_factors: list[str],
    *,
    season: str,
) -> int:
    if value_a is None or value_b is None:
        return 0
    difference = abs(int(value_a) - int(value_b))
    if difference <= 1:
        positive_factors.append((4, f"{season} 실내 온도 선호가 비슷합니다"))
        return 4
    if difference <= 2:
        positive_factors.append((2, f"{season} 실내 온도 선호가 크게 다르지 않습니다"))
        return 2

    mismatch_factors.append(f"{season} 실내 온도 선호 차이가 큽니다")
    return -3


def _pet_score(
    interview_a: dict[str, Any],
    interview_b: dict[str, Any],
    positive_factors: list[tuple[int, str]],
    mismatch_factors: list[str],
) -> int:
    pet_ok_a = interview_a.get("pet_ok")
    pet_ok_b = interview_b.get("pet_ok")
    if pet_ok_a is None or pet_ok_b is None:
        return 0

    if bool(pet_ok_a) == bool(pet_ok_b):
        if pet_ok_a:
            pref_a = interview_a.get("pet_preference")
            pref_b = interview_b.get("pet_preference")
            if pref_a == pref_b:
                positive_factors.append((4, "반려동물 허용 범위가 비슷합니다"))
                return 4
            if "둘 다" in {pref_a, pref_b}:
                positive_factors.append((2, "반려동물 허용 범위가 크게 충돌하지 않습니다"))
                return 2
            mismatch_factors.append("허용 가능한 반려동물 종류가 다릅니다")
            return -2

        positive_factors.append((3, "반려동물 동거 기준이 같습니다"))
        return 3

    mismatch_factors.append("반려동물 동거 허용 여부가 달라 조율이 필요합니다")
    return -4


def _personal_space_access_score(
    value_a: Any,
    value_b: Any,
    positive_factors: list[tuple[int, str]],
    mismatch_factors: list[str],
) -> int:
    normalized_a = _personal_access_value(value_a)
    normalized_b = _personal_access_value(value_b)
    if normalized_a is None or normalized_b is None:
        return 0

    difference = abs(normalized_a - normalized_b)
    if difference == 0:
        positive_factors.append((7, "개인 공간 출입 기준이 비슷합니다"))
        return 7
    if difference == 1:
        positive_factors.append((3, "개인 공간 경계에 대한 감각이 크게 다르지 않습니다"))
        return 3

    mismatch_factors.append("개인 공간 출입 기준 차이가 커서 갈등 가능성이 있습니다")
    return -6


def _security_score(
    value_a: Any,
    value_b: Any,
    positive_factors: list[tuple[int, str]],
    mismatch_factors: list[str],
) -> int:
    normalized_a = _security_value(value_a)
    normalized_b = _security_value(value_b)
    if normalized_a is None or normalized_b is None:
        return 0

    difference = abs(normalized_a - normalized_b)
    if difference == 0:
        positive_factors.append((6, "보안과 잠금 기준이 비슷합니다"))
        return 6
    if difference == 1:
        positive_factors.append((2, "보안 기준이 크게 다르지 않습니다"))
        return 2

    mismatch_factors.append("보안과 잠금 기준 차이가 큽니다")
    return -4


def _absence_notice_score(
    value_a: Any,
    value_b: Any,
    positive_factors: list[tuple[int, str]],
    mismatch_factors: list[str],
) -> int:
    normalized_a = _absence_notice_value(value_a)
    normalized_b = _absence_notice_value(value_b)
    if normalized_a is None or normalized_b is None:
        return 0

    difference = abs(normalized_a - normalized_b)
    if difference == 0:
        positive_factors.append((4, "외출 공유 기준이 비슷합니다"))
        return 4
    if difference == 1:
        positive_factors.append((1, "외출 공유 기준을 무리 없이 맞출 수 있습니다"))
        return 1

    mismatch_factors.append("외출 공유 기준 차이가 큽니다")
    return -3


def _region_score(
    student_a: dict[str, Any],
    student_b: dict[str, Any],
    positive_factors: list[tuple[int, str]],
    mismatch_factors: list[str],
) -> int:
    region_a = _string_or_none(student_a.get("region"))
    region_b = _string_or_none(student_b.get("region"))
    if not region_a or not region_b:
        return 0
    if region_a == region_b:
        positive_factors.append((6, "희망 지역이 같습니다"))
        return 6
    mismatch_factors.append("희망 지역이 달라 생활권 조율이 필요합니다")
    return -30


def _move_in_score(
    student_a: dict[str, Any],
    student_b: dict[str, Any],
    positive_factors: list[tuple[int, str]],
    mismatch_factors: list[str],
) -> int:
    value_a = _move_in_value(student_a.get("move_in_period"))
    value_b = _move_in_value(student_b.get("move_in_period"))
    if value_a is None or value_b is None:
        return 0

    difference = abs(value_a - value_b)
    if difference <= 1:
        positive_factors.append((5, "입주 예정 시기가 비슷합니다"))
        return 5
    if difference <= 3:
        positive_factors.append((2, "입주 예정 시기가 크게 다르지 않습니다"))
        return 2

    mismatch_factors.append("입주 예정 시기 차이가 큽니다")
    return -4


def _stay_duration_score(
    student_a: dict[str, Any],
    student_b: dict[str, Any],
    positive_factors: list[tuple[int, str]],
    mismatch_factors: list[str],
) -> int:
    duration_a = student_a.get("stay_duration_months")
    duration_b = student_b.get("stay_duration_months")
    if duration_a is None or duration_b is None:
        return 0

    difference = abs(int(duration_a) - int(duration_b))
    if difference <= 3:
        positive_factors.append((4, "거주 예정 기간이 비슷합니다"))
        return 4
    if difference <= 6:
        positive_factors.append((2, "거주 예정 기간 차이가 크지 않습니다"))
        return 2

    mismatch_factors.append("거주 예정 기간 차이가 큽니다")
    return -3


def _character_score(
    student_a: dict[str, Any],
    student_b: dict[str, Any],
    positive_factors: list[tuple[int, str]],
    mismatch_factors: list[str],
) -> int:
    character_a = dict(student_a.get("character", {}))
    character_b = dict(student_b.get("character", {}))
    type_a = _string_or_none(character_a.get("type_code"))
    type_b = _string_or_none(character_b.get("type_code"))

    score = 0
    if type_a and type_b:
        pair = tuple(sorted((type_a, type_b)))
        pair_bonus = {
            ("DUDI", "DUDI"): 4,
            ("DUDI", "PEE"): 6,
            ("DUDI", "ROO"): 5,
            ("DUDI", "MOMO"): 1,
            ("MOMO", "MOMO"): 4,
            ("MOMO", "PEE"): -3,
            ("MOMO", "ROO"): -4,
            ("PEE", "PEE"): 3,
            ("PEE", "ROO"): -1,
            ("ROO", "ROO"): 4,
        }.get(pair, 0)
        score += pair_bonus
        if pair_bonus > 0:
            positive_factors.append((pair_bonus, "캐릭터 성향이 보조적으로 잘 맞습니다"))
        elif pair_bonus < 0:
            mismatch_factors.append("캐릭터 성향 차이가 있어 생활 규칙 합의가 더 중요합니다")

    rule_score_a = character_a.get("rule_score")
    rule_score_b = character_b.get("rule_score")
    sharing_score_a = character_a.get("sharing_score")
    sharing_score_b = character_b.get("sharing_score")
    if None in {rule_score_a, rule_score_b, sharing_score_a, sharing_score_b}:
        return score

    rule_gap = abs(float(rule_score_a) - float(rule_score_b))
    sharing_gap = abs(float(sharing_score_a) - float(sharing_score_b))
    if rule_gap <= 10 and sharing_gap <= 10:
        positive_factors.append((4, "생활 규칙성과 공유 성향의 균형이 비슷합니다"))
        return score + 4
    if rule_gap <= 20 and sharing_gap <= 20:
        positive_factors.append((2, "생활 성향 축 차이가 크지 않습니다"))
        return score + 2

    mismatch_factors.append("생활 성향 축 차이가 커서 세부 생활 규칙 조율이 필요합니다")
    return score - 2


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


def _time_to_minutes(value: Any) -> int | None:
    if not isinstance(value, str) or ":" not in value:
        return None
    try:
        hours, minutes = value.split(":", 1)
        return int(hours) * 60 + int(minutes)
    except ValueError:
        return None


def _frequency_value(value: Any) -> int | None:
    return {
        "1": 1,
        "2": 2,
        "3": 3,
        "4": 4,
        "5": 5,
        "6": 6,
        "매일": 7,
    }.get(_string_or_none(value))


def _dishes_deadline_value(value: Any) -> int | None:
    return {
        "바로": 0,
        "그날 이내에": 1,
        "다음날 아침": 2,
    }.get(_string_or_none(value))


def _supplies_value(value: Any) -> int | None:
    return {
        "각자": 0,
        "일부 공유": 1,
        "공동구매": 2,
    }.get(_string_or_none(value))


def _personal_access_value(value: Any) -> int | None:
    return {
        "불가능": 0,
        "노크 혹은 허락": 1,
        "자유롭게": 2,
    }.get(_string_or_none(value))


def _security_value(value: Any) -> int | None:
    return {
        "상관없음": 0,
        "외출시": 1,
        "항시 잠금": 2,
    }.get(_string_or_none(value))


def _absence_notice_value(value: Any) -> int | None:
    return {
        "필요 없음": 0,
        "하루 이상": 1,
        "항상": 2,
    }.get(_string_or_none(value))


def _move_in_value(value: Any) -> int | None:
    if not isinstance(value, str) or "-" not in value:
        return None
    try:
        year, month = value.split("-", 1)
        return int(year) * 12 + int(month)
    except ValueError:
        return None


def _string_or_none(value: Any) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None
