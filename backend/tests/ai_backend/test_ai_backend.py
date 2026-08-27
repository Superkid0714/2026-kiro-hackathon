from __future__ import annotations

from fastapi.testclient import TestClient

from ai_backend.app import app
from ai_backend.scoring import calculate_pair_scores

client = TestClient(app)


def test_ai_healthcheck() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "ai-backend"}


def test_pair_scoring_is_deterministic_and_marks_required_conflict() -> None:
    students = [
        {
            "student_id": "S1",
            "lifestyle": {"sleep": "early", "noise": "low"},
            "required_rules": ["sleep=early"],
            "preferences": {"sleep": 4, "noise": 2},
        },
        {
            "student_id": "S2",
            "lifestyle": {"sleep": "late", "noise": "high"},
            "required_rules": [],
            "preferences": {"sleep": 4, "noise": 2},
        },
    ]

    first = calculate_pair_scores(students)
    second = calculate_pair_scores(students)

    assert first == second
    assert first[0]["eligible"] is False
    assert "필수 조건" in first[0]["conflict_summary"][0]


def test_pair_scoring_uses_interview_and_character_payload_when_available() -> None:
    students = [
        {
            "student_id": "S1",
            "region": "광주광역시",
            "move_in_period": "2026-09",
            "stay_duration_months": 6,
            "interview": {
                "wake_up_time": "07:00",
                "sleep_time": "23:30",
                "noise_sensitive": True,
                "quiet_hours_start": "22:00",
                "cleaning_frequency": "3",
                "dishes_deadline": "그날 이내에",
                "guest_frequency": "1",
                "smokes": False,
                "drinking_frequency": "2",
                "home_stay_frequency": "5",
                "meal_preference": "직접",
                "home_activity_frequency": "5",
                "supplies_sharing": "일부 공유",
                "summer_temperature": 24,
                "winter_temperature": 21,
                "pet_ok": True,
                "pet_preference": "고양이",
                "conflict_resolution": "즉시 대면",
                "shared_cost_rule": "반반",
                "personal_space_access": "노크 혹은 허락",
                "personal_space_ratio": "반반",
                "security_preference": "외출시",
                "absence_notice": "하루 이상",
            },
            "character": {
                "rule_score": 71.0,
                "sharing_score": 39.8,
                "type_code": "PEE",
            },
        },
        {
            "student_id": "S2",
            "region": "광주광역시",
            "move_in_period": "2026-09",
            "stay_duration_months": 7,
            "interview": {
                "wake_up_time": "07:20",
                "sleep_time": "23:40",
                "noise_sensitive": True,
                "quiet_hours_start": "22:10",
                "cleaning_frequency": "3",
                "dishes_deadline": "그날 이내에",
                "guest_frequency": "1",
                "smokes": False,
                "drinking_frequency": "2",
                "home_stay_frequency": "5",
                "meal_preference": "직접",
                "home_activity_frequency": "4",
                "supplies_sharing": "일부 공유",
                "summer_temperature": 24,
                "winter_temperature": 20,
                "pet_ok": True,
                "pet_preference": "고양이",
                "conflict_resolution": "즉시 대면",
                "shared_cost_rule": "반반",
                "personal_space_access": "노크 혹은 허락",
                "personal_space_ratio": "반반",
                "security_preference": "외출시",
                "absence_notice": "하루 이상",
            },
            "character": {
                "rule_score": 69.0,
                "sharing_score": 42.0,
                "type_code": "PEE",
            },
        },
    ]

    pair = calculate_pair_scores(students)[0]

    assert pair["eligible"] is True
    assert pair["score"] >= 85
    assert any("생활 리듬" not in reason for reason in pair["reasons"])
    assert "희망 지역이 같습니다" in pair["reasons"] or any(
        "시간대" in reason or "기준" in reason for reason in pair["reasons"]
    )


def test_pair_scoring_blocks_indoor_smoker_with_non_smoker() -> None:
    students = [
        {
            "student_id": "S1",
            "interview": {
                "wake_up_time": "07:00",
                "sleep_time": "23:00",
                "noise_sensitive": False,
                "quiet_hours_start": "23:00",
                "cleaning_frequency": "2",
                "dishes_deadline": "그날 이내에",
                "guest_frequency": "2",
                "smokes": True,
                "smoking_type": "연초",
                "smoking_place": "집 안",
                "drinking_frequency": "2",
                "home_stay_frequency": "4",
                "meal_preference": "배달",
                "home_activity_frequency": "3",
                "supplies_sharing": "각자",
                "summer_temperature": 24,
                "winter_temperature": 20,
                "pet_ok": False,
                "conflict_resolution": "모아서 대면",
                "shared_cost_rule": "반반",
                "personal_space_access": "노크 혹은 허락",
                "personal_space_ratio": "반반",
                "security_preference": "외출시",
                "absence_notice": "필요 없음",
            },
        },
        {
            "student_id": "S2",
            "interview": {
                "wake_up_time": "07:10",
                "sleep_time": "23:10",
                "noise_sensitive": False,
                "quiet_hours_start": "23:00",
                "cleaning_frequency": "2",
                "dishes_deadline": "그날 이내에",
                "guest_frequency": "2",
                "smokes": False,
                "drinking_frequency": "2",
                "home_stay_frequency": "4",
                "meal_preference": "배달",
                "home_activity_frequency": "3",
                "supplies_sharing": "각자",
                "summer_temperature": 24,
                "winter_temperature": 20,
                "pet_ok": False,
                "conflict_resolution": "모아서 대면",
                "shared_cost_rule": "반반",
                "personal_space_access": "노크 혹은 허락",
                "personal_space_ratio": "반반",
                "security_preference": "외출시",
                "absence_notice": "필요 없음",
            },
        },
    ]

    pair = calculate_pair_scores(students)[0]

    assert pair["eligible"] is False
    assert pair["score"] == 0
    assert "실내 흡연" in pair["conflict_summary"][0]


def test_match_request_returns_fallback_generation_fields() -> None:
    response = client.post(
        "/match",
        json={
            "session_id": "session-demo",
            "request_id": "req-demo",
            "preset_id": "orientation",
            "students": [
                {
                    "student_id": "S1",
                    "lifestyle": {"sleep": "early", "noise": "low", "cleanliness": "high"},
                    "preferences": {"sleep": 4, "noise": 2, "cleanliness": 3},
                },
                {
                    "student_id": "S2",
                    "lifestyle": {"sleep": "early", "noise": "high", "cleanliness": "medium"},
                    "preferences": {"sleep": 4, "noise": 4, "cleanliness": 2},
                },
            ],
        },
    )

    body = response.json()

    assert response.status_code == 200
    assert body["status"] == "ok"
    assert body["session_id"] == "session-demo"
    assert len(body["matches"]) == 1
    match = body["matches"][0]
    assert match["student_a"] == "S1"
    assert match["student_b"] == "S2"
    assert match["conflict_scenario_source"] == "fallback"
    assert match["negotiation_source"] == "fallback"
    assert match["pact_source"] == "fallback"
    assert isinstance(match["negotiation_suggestions"], list)
    assert isinstance(match["pact"], list)


def test_match_request_supports_interview_driven_matching_payload() -> None:
    response = client.post(
        "/match",
        json={
            "session_id": "session-interview",
            "students": [
                {
                    "student_id": "S1",
                    "profile_id": "profile-1",
                    "nickname": "민수",
                    "region": "광주광역시",
                    "move_in_period": "2026-09",
                    "stay_duration_months": 6,
                    "interview": {
                        "wake_up_time": "07:00",
                        "sleep_time": "23:30",
                        "noise_sensitive": True,
                        "quiet_hours_start": "22:00",
                        "cleaning_frequency": "3",
                        "dishes_deadline": "그날 이내에",
                        "guest_frequency": "1",
                        "smokes": False,
                        "drinking_frequency": "2",
                        "home_stay_frequency": "5",
                        "meal_preference": "직접",
                        "home_activity_frequency": "5",
                        "supplies_sharing": "일부 공유",
                        "summer_temperature": 24,
                        "winter_temperature": 21,
                        "pet_ok": True,
                        "pet_preference": "고양이",
                        "conflict_resolution": "즉시 대면",
                        "shared_cost_rule": "반반",
                        "personal_space_access": "노크 혹은 허락",
                        "personal_space_ratio": "반반",
                        "security_preference": "외출시",
                        "absence_notice": "하루 이상",
                    },
                    "character": {
                        "rule_score": 71.0,
                        "sharing_score": 39.8,
                        "type_code": "PEE",
                    },
                },
                {
                    "student_id": "S2",
                    "profile_id": "profile-2",
                    "nickname": "서연",
                    "region": "광주광역시",
                    "move_in_period": "2026-09",
                    "stay_duration_months": 7,
                    "interview": {
                        "wake_up_time": "07:20",
                        "sleep_time": "23:40",
                        "noise_sensitive": True,
                        "quiet_hours_start": "22:10",
                        "cleaning_frequency": "3",
                        "dishes_deadline": "그날 이내에",
                        "guest_frequency": "1",
                        "smokes": False,
                        "drinking_frequency": "2",
                        "home_stay_frequency": "5",
                        "meal_preference": "직접",
                        "home_activity_frequency": "4",
                        "supplies_sharing": "일부 공유",
                        "summer_temperature": 24,
                        "winter_temperature": 20,
                        "pet_ok": True,
                        "pet_preference": "고양이",
                        "conflict_resolution": "즉시 대면",
                        "shared_cost_rule": "반반",
                        "personal_space_access": "노크 혹은 허락",
                        "personal_space_ratio": "반반",
                        "security_preference": "외출시",
                        "absence_notice": "하루 이상",
                    },
                    "character": {
                        "rule_score": 69.0,
                        "sharing_score": 42.0,
                        "type_code": "PEE",
                    },
                },
            ],
        },
    )

    body = response.json()

    assert response.status_code == 200
    assert body["status"] == "ok"
    assert body["matches"][0]["score"] >= 85
    assert body["matches"][0]["reasons"]
