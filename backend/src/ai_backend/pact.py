from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from ai_backend.fallback import build_pact_fallback
from ai_backend.llm_client import LLMClientError, get_llm_client


def _minutes(time_value: str | None) -> int | None:
    if not time_value:
        return None
    hour, minute = time_value.split(":")
    return int(hour) * 60 + int(minute)


def _add_topic(
    topics: list[dict[str, Any]],
    *,
    code: str,
    label: str,
    severity: int,
    reason: str,
    draft_rule: str,
) -> None:
    topics.append(
        {
            "code": code,
            "label": label,
            "severity": severity,
            "reason": reason,
            "draft_rule": draft_rule,
        }
    )


def extract_pact_conflict_topics(
    *,
    profile_a: dict[str, Any],
    profile_b: dict[str, Any],
    interview_a: dict[str, Any],
    interview_b: dict[str, Any],
) -> list[dict[str, Any]]:
    topics: list[dict[str, Any]] = []
    pair_label = f"{profile_a['nickname']} & {profile_b['nickname']}"

    sleep_a = _minutes(interview_a.get("sleep_time")) or 0
    sleep_b = _minutes(interview_b.get("sleep_time")) or 0
    sleep_gap = abs(sleep_a - sleep_b)
    if sleep_gap >= 90:
        _add_topic(
            topics,
            code="sleep_time_gap",
            label="취침 시간 차이",
            severity=95,
            reason="두 사람의 취침 시간이 많이 달라 늦은 시간 생활 리듬 충돌 가능성이 커요.",
            draft_rule=(
                f"{pair_label}는 밤 시간대 활동이 겹치지 않도록 "
                "늦은 시간에는 이어폰을 사용한다."
            ),
        )

    quiet_gap = abs(
        (_minutes(interview_a.get("quiet_hours_start")) or 0)
        - (_minutes(interview_b.get("quiet_hours_start")) or 0)
    )
    if quiet_gap >= 60 or interview_a.get("noise_sensitive") != interview_b.get("noise_sensitive"):
        _add_topic(
            topics,
            code="quiet_hours",
            label="조용한 시간 기준",
            severity=92,
            reason="조용해야 하는 시간과 소음 민감도가 달라 생활 소음 관련 갈등이 생길 수 있어요.",
            draft_rule=(
                f"{pair_label}는 조용한 시간 이후에는 통화, 영상, 게임 소리를 "
                "이어폰으로 듣는다."
            ),
        )

    cleaning_a = int(str(interview_a.get("cleaning_frequency", "0")).replace("매일", "7"))
    cleaning_b = int(str(interview_b.get("cleaning_frequency", "0")).replace("매일", "7"))
    cleaning_gap = abs(cleaning_a - cleaning_b)
    if cleaning_gap >= 2:
        _add_topic(
            topics,
            code="cleaning_frequency",
            label="청소 빈도",
            severity=88,
            reason=(
                "청소 주기에 대한 기대치 차이가 커서 "
                "공용 공간 관리 기준을 먼저 맞출 필요가 있어요."
            ),
            draft_rule=f"{pair_label}는 주간 청소 요일이나 빈도를 미리 정하고 함께 맞춘다.",
        )

    dishes_order = {"바로": 0, "그날 이내에": 1, "다음날 아침": 2}
    dishes_gap = abs(
        dishes_order.get(interview_a.get("dishes_deadline"), 1)
        - dishes_order.get(interview_b.get("dishes_deadline"), 1)
    )
    if dishes_gap >= 1:
        _add_topic(
            topics,
            code="dishes_deadline",
            label="설거지와 정리 마감",
            severity=84,
            reason="설거지와 정리를 끝내야 하는 기준이 달라 작은 불편이 누적될 수 있어요.",
            draft_rule=f"{pair_label}는 공용 물건 정리와 설거지를 늦어도 당일 안에 끝낸다.",
        )

    guest_a = int(str(interview_a.get("guest_frequency", "0")).replace("매일", "7"))
    guest_b = int(str(interview_b.get("guest_frequency", "0")).replace("매일", "7"))
    guest_gap = abs(guest_a - guest_b)
    if guest_gap >= 2:
        _add_topic(
            topics,
            code="guest_frequency",
            label="방문객 허용 빈도",
            severity=93,
            reason=(
                "손님 방문 허용 범위 차이가 커서 사전 합의가 없으면 "
                "바로 갈등으로 이어질 수 있어요."
            ),
            draft_rule=(
                f"{pair_label}는 지인 초대가 필요하면 최소 하루 전에 "
                "서로에게 먼저 공유한다."
            ),
        )

    smoking_mismatch = interview_a.get("smokes") != interview_b.get("smokes")
    smoking_place_mismatch = (
        interview_a.get("smoking_place") != interview_b.get("smoking_place")
    )
    if smoking_mismatch or smoking_place_mismatch:
        _add_topic(
            topics,
            code="smoking_rule",
            label="흡연 기준",
            severity=97,
            reason="흡연 여부나 허용 장소 기준이 달라 생활 만족도에 큰 영향을 줄 수 있어요.",
            draft_rule=f"{pair_label}는 흡연이 필요한 경우 실내가 아닌 합의된 장소에서만 한다.",
        )

    access_order = {"자유롭게": 0, "노크 혹은 허락": 1, "불가능": 2}
    access_gap = abs(
        access_order.get(interview_a.get("personal_space_access"), 1)
        - access_order.get(interview_b.get("personal_space_access"), 1)
    )
    if access_gap >= 1:
        _add_topic(
            topics,
            code="personal_space_access",
            label="개인 공간 출입 기준",
            severity=90,
            reason="개인 공간에 대한 경계 기준이 달라 예민한 갈등으로 번질 수 있어요.",
            draft_rule=(
                f"{pair_label}는 서로의 방이나 개인 공간에 들어갈 때 "
                "먼저 노크하거나 허락을 구한다."
            ),
        )

    security_order = {"상관없음": 0, "외출시": 1, "항시 잠금": 2}
    security_gap = abs(
        security_order.get(interview_a.get("security_preference"), 1)
        - security_order.get(interview_b.get("security_preference"), 1)
    )
    if security_gap >= 1:
        _add_topic(
            topics,
            code="security_preference",
            label="문단속 기준",
            severity=82,
            reason="보안에 대한 기대치가 달라 외출이나 취침 전 확인 기준을 맞출 필요가 있어요.",
            draft_rule=f"{pair_label}는 외출 전과 취침 전 문과 창문 잠금 상태를 함께 확인한다.",
        )

    if interview_a.get("shared_cost_rule") != interview_b.get("shared_cost_rule"):
        _add_topic(
            topics,
            code="shared_cost_rule",
            label="공동 생활비 관리 방식",
            severity=78,
            reason="생활비를 나누는 기준이 달라 금전 관련 오해가 생길 수 있어요.",
            draft_rule=f"{pair_label}는 관리비와 공용 생활비 정산 기준을 입주 초기에 먼저 정한다.",
        )

    if not topics:
        _add_topic(
            topics,
            code="general_alignment",
            label="기본 생활 합의",
            severity=50,
            reason="큰 충돌 신호는 적지만 초반 생활 기준을 가볍게 맞춰두는 것이 좋아요.",
            draft_rule=(
                f"{pair_label}는 입주 첫 주에 수면, 청소, 공용 공간 사용 기준을 "
                "함께 확인한다."
            ),
        )

    topics.sort(key=lambda item: (-item["severity"], item["code"]))
    return topics[:5]


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


def generate_roommate_pact(
    *,
    room_id: str,
    profile_a: dict[str, Any],
    profile_b: dict[str, Any],
    interview_a: dict[str, Any],
    interview_b: dict[str, Any],
    character_a: dict[str, Any] | None = None,
    character_b: dict[str, Any] | None = None,
) -> dict[str, Any]:
    topics = extract_pact_conflict_topics(
        profile_a=profile_a,
        profile_b=profile_b,
        interview_a=interview_a,
        interview_b=interview_b,
    )
    pair_label = f"{profile_a['nickname']} & {profile_b['nickname']}"
    draft_rules = [item["draft_rule"] for item in topics[:5]]
    pact = generate_pact(pair_label=pair_label, shared_rules=draft_rules)
    generated_at = datetime.now(UTC).isoformat()
    return {
        "room_id": room_id,
        "participant_a_profile_id": profile_a["profile_id"],
        "participant_b_profile_id": profile_b["profile_id"],
        "participants": [
            {
                "profile_id": profile_a["profile_id"],
                "nickname": profile_a["nickname"],
                "character": character_a or {},
            },
            {
                "profile_id": profile_b["profile_id"],
                "nickname": profile_b["nickname"],
                "character": character_b or {},
            },
        ],
        "rules": pact["rules"][:5],
        "source": pact["source"],
        "conflict_topics": topics,
        "generated_at": generated_at,
        "updated_at": generated_at,
    }
