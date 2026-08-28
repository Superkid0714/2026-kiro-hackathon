from __future__ import annotations

from typing import Any

PACT_KNOWLEDGE_BASE: list[dict[str, Any]] = [
    {
        "id": "kb-quiet-hours",
        "topic_codes": ["sleep_time_gap", "quiet_hours"],
        "title": "늦은 시간 소음 조율",
        "scenario": (
            "한 사람은 늦게 자고 다른 사람은 일찍 쉬려 할 때, "
            "영상 소리나 통화 소리가 예민하게 느껴질 수 있어요."
        ),
        "guidance": [
            "조용한 시간 시작 시각을 하나로 합의한다.",
            "밤 시간대에는 이어폰 사용을 기본으로 둔다.",
            "예외 상황은 미리 짧게 공유한다.",
        ],
        "rule_templates": [
            "밤 {quiet_hour} 이후에는 통화, 영상, 게임 소리를 이어폰으로 들어요.",
            "늦은 시간 활동이 필요할 때는 상대가 쉬는 시간을 먼저 배려해요.",
        ],
    },
    {
        "id": "kb-cleaning",
        "topic_codes": ["cleaning_frequency", "dishes_deadline"],
        "title": "청소와 정리 기준 맞추기",
        "scenario": (
            "한 사람은 바로 정리하길 원하고 다른 사람은 조금 여유 있게 생각하면 "
            "공용 공간 피로가 금방 쌓일 수 있어요."
        ),
        "guidance": [
            "공용 공간 정리 마감 시점을 명확히 둔다.",
            "주간 청소 루틴을 캘린더처럼 고정한다.",
            "쌓이기 쉬운 설거지와 분리수거부터 우선 규칙을 만든다.",
        ],
        "rule_templates": [
            "공용 공간 정리와 설거지는 늦어도 당일 안에 마무리해요.",
            "주 {cleaning_frequency}회 기준으로 공용 공간 청소 일정을 함께 맞춰요.",
        ],
    },
    {
        "id": "kb-guests",
        "topic_codes": ["guest_frequency"],
        "title": "손님 초대와 방문 기준",
        "scenario": "방문객 허용 기준이 다르면 휴식 시간과 사생활이 침범된다고 느끼기 쉬워요.",
        "guidance": [
            "방문 전 공유 시간 기준을 정한다.",
            "늦은 시간대 초대 여부를 따로 합의한다.",
            "공용 공간 사용 범위를 함께 정한다.",
        ],
        "rule_templates": [
            "지인을 초대해야 할 때는 최소 하루 전에 먼저 알려줘요.",
            "늦은 시간 방문은 두 사람 모두 괜찮을 때만 진행해요.",
        ],
    },
    {
        "id": "kb-smoking",
        "topic_codes": ["smoking_rule"],
        "title": "흡연 장소와 환기 기준",
        "scenario": (
            "흡연 여부나 장소 기준이 다르면 냄새와 위생 문제로 바로 "
            "생활 만족도가 떨어질 수 있어요."
        ),
        "guidance": [
            "실내 흡연 여부를 명확히 금지 또는 허용으로 정한다.",
            "허용 장소와 환기 방식을 함께 정한다.",
            "냄새가 남는 공용 공간은 피한다.",
        ],
        "rule_templates": [
            "흡연이 필요할 때는 실내가 아닌 합의된 장소에서만 해요.",
            "흡연 후에는 환기와 냄새 정리를 바로 해요.",
        ],
    },
    {
        "id": "kb-personal-space",
        "topic_codes": ["personal_space_access"],
        "title": "개인 공간 존중",
        "scenario": "개인 공간에 대한 경계가 다르면 작은 행동도 크게 불편하게 느껴질 수 있어요.",
        "guidance": [
            "방 출입 기준을 한 문장으로 정한다.",
            "물건을 빌릴 때의 절차를 따로 정한다.",
            "급한 상황 예외를 짧게 정의한다.",
        ],
        "rule_templates": [
            "서로의 방이나 개인 공간에 들어갈 때는 먼저 노크하거나 허락을 구해요.",
            "개인 물건은 사용 전 꼭 먼저 물어봐요.",
        ],
    },
    {
        "id": "kb-security",
        "topic_codes": ["security_preference"],
        "title": "문단속과 안전 체크",
        "scenario": "문단속 기준이 다르면 외출이나 취침 전 불안감이 쌓일 수 있어요.",
        "guidance": [
            "외출 전 확인 항목을 단순하게 정한다.",
            "취침 전 체크 여부를 합의한다.",
            "창문과 현관문 기준을 분리해 정한다.",
        ],
        "rule_templates": [
            "외출 전과 취침 전 문과 창문 상태를 함께 확인해요.",
            "마지막으로 나가는 사람이 잠금 상태를 한 번 더 체크해요.",
        ],
    },
    {
        "id": "kb-costs",
        "topic_codes": ["shared_cost_rule"],
        "title": "공동 생활비 정산",
        "scenario": (
            "생활비 정산 기준이 다르면 금액보다도 공정성에 대한 불만이 "
            "먼저 생길 수 있어요."
        ),
        "guidance": [
            "정산 주기와 기록 방식을 먼저 정한다.",
            "공용품 구매 범위를 구분한다.",
            "비용 분담 방식이 달라질 예외 상황을 미리 적어둔다.",
        ],
        "rule_templates": [
            "관리비와 공용 생활비 정산 기준은 입주 초기에 먼저 정해요.",
            "공용품 구매 내역은 함께 볼 수 있게 기록해요.",
        ],
    },
]


def retrieve_pact_guidance(conflict_topics: list[dict[str, Any]]) -> list[dict[str, Any]]:
    scored_entries: list[tuple[int, dict[str, Any]]] = []
    topic_codes = [topic.get("code") for topic in conflict_topics]
    for entry in PACT_KNOWLEDGE_BASE:
        overlap = len(set(entry["topic_codes"]) & set(topic_codes))
        if overlap == 0:
            continue
        severity_bonus = sum(
            int(topic.get("severity", 0))
            for topic in conflict_topics
            if topic.get("code") in entry["topic_codes"]
        )
        scored_entries.append((overlap * 100 + severity_bonus, entry))

    scored_entries.sort(key=lambda item: item[0], reverse=True)
    return [entry for _, entry in scored_entries[:4]]
