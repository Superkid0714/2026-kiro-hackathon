from __future__ import annotations

from copy import deepcopy
from typing import Any
from uuid import uuid4

from ai_backend.matching import compute_roommate_matching
from ai_backend.negotiate import generate_negotiation
from ai_backend.pact import generate_pact
from ai_backend.scenario import generate_scenario
from ai_backend.scoring import calculate_pair_scores
from main_backend.services.storage import get_storage_backend


class InputValidationError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def process_match_request(payload: dict[str, Any]) -> dict[str, Any]:
    session_id = payload.get("session_id", "")
    request_id = payload.get("request_id") or f"req-{uuid4().hex[:10]}"
    students = deepcopy(payload.get("students", []))
    preset_id = payload.get("preset_id", "default")

    if len(students) < 2:
        raise InputValidationError("insufficient_students", "최소 2명의 학생이 필요합니다.")
    if len(students) % 2 != 0:
        raise InputValidationError(
            "odd_student_count",
            "2인실 매칭을 위해 학생 수는 짝수여야 합니다.",
        )

    pair_scores = calculate_pair_scores(students)
    matching = compute_roommate_matching(students, pair_scores)
    if matching["status"] == "error":
        result = {
            "status": "error",
            "request_id": request_id,
            "session_id": session_id,
            "matches": [],
            "errors": matching["errors"],
        }
        get_storage_backend().save_result(session_id, result)
        return result

    students_by_id = {student["student_id"]: student for student in students}
    matches: list[dict[str, Any]] = []

    for pair in matching["pairs"]:
        student_a = students_by_id[pair["student_a"]]
        student_b = students_by_id[pair["student_b"]]
        pair_label = f"{pair['student_a']} & {pair['student_b']}"
        shared_rules = _build_shared_rules(student_a, student_b)
        scenario = generate_scenario(
            pair_label=pair_label,
            preset_id=preset_id,
            conflict_summary=pair["conflict_summary"],
        )
        negotiation = generate_negotiation(
            pair_label=pair_label,
            conflict_summary=pair["conflict_summary"],
        )
        pact = generate_pact(pair_label=pair_label, shared_rules=shared_rules)

        matches.append(
            {
                "student_a": pair["student_a"],
                "student_b": pair["student_b"],
                "score": pair["score"],
                "reasons": pair["reasons"],
                "conflict_summary": pair["conflict_summary"],
                "conflict_scenario": scenario["narrative"],
                "conflict_scenario_source": scenario["source"],
                "negotiation_suggestions": negotiation["suggestions"],
                "negotiation_source": negotiation["source"],
                "pact": pact["rules"],
                "pact_source": pact["source"],
            }
        )

    result = {
        "status": "ok",
        "request_id": request_id,
        "session_id": session_id,
        "matches": matches,
        "errors": [],
    }
    get_storage_backend().save_result(session_id, result)
    return result


def _build_shared_rules(student_a: dict[str, Any], student_b: dict[str, Any]) -> list[str]:
    rules: list[str] = []
    lifestyle_a = student_a.get("lifestyle", {})
    lifestyle_b = student_b.get("lifestyle", {})
    interview_a = student_a.get("interview", {})
    interview_b = student_b.get("interview", {})

    for key in sorted(set(lifestyle_a) & set(lifestyle_b)):
        if lifestyle_a[key] == lifestyle_b[key]:
            rules.append(f"{_label(key)} 기준은 {lifestyle_a[key]}로 함께 유지한다.")

    if interview_a and interview_b:
        if interview_a.get("quiet_hours_start") == interview_b.get("quiet_hours_start"):
            rules.append(
                f"조용한 시간은 {interview_a['quiet_hours_start']}부터 함께 지킨다."
            )
        if interview_a.get("cleaning_frequency") == interview_b.get("cleaning_frequency"):
            rules.append(
                f"청소는 주 {interview_a['cleaning_frequency']}회 기준으로 함께 맞춘다."
            )
        if interview_a.get("dishes_deadline") == interview_b.get("dishes_deadline"):
            rules.append(
                f"설거지와 공용 정리는 {interview_a['dishes_deadline']} 처리한다."
            )
        if interview_a.get("personal_space_access") == interview_b.get("personal_space_access"):
            rules.append(
                f"개인 공간 출입은 {interview_a['personal_space_access']} 기준으로 맞춘다."
            )
        if interview_a.get("security_preference") == interview_b.get("security_preference"):
            rules.append(
                f"문과 창문 관리는 {interview_a['security_preference']} 기준을 따른다."
            )

    shared_required = sorted(
        set(student_a.get("required_rules", [])) & set(student_b.get("required_rules", []))
    )
    for rule in shared_required:
        rules.append(f"공통 필수 조건 {rule}를 함께 지킨다.")

    unique_rules: list[str] = []
    for rule in rules:
        if rule not in unique_rules:
            unique_rules.append(rule)
    return unique_rules[:3]


def _label(key: str) -> str:
    return {
        "sleep": "취침",
        "wake": "기상",
        "cleanliness": "청결",
        "noise": "소음",
        "study": "학습",
    }.get(key, key)
