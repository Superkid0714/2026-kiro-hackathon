import httpx
from fastapi.testclient import TestClient

from ai_backend.app import app as ai_app
from main_backend.app import app
from main_backend.services.ai_backend_client import AIBackendClient
from main_backend.services.session_service import session_service

client = TestClient(app)


def test_healthcheck() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "main-backend"}


def test_create_session_returns_expected_shape() -> None:
    response = client.post(
        "/sessions",
        json={
            "session_name": "demo-session",
            "students": [
                {"student_id": "S1", "lifestyle": {"sleep": "early"}},
                {"student_id": "S2", "lifestyle": {"sleep": "late"}},
            ],
        },
    )

    body = response.json()

    assert response.status_code == 201
    assert body["status"] == "accepted"
    assert body["next_step"] == "run-session-match"
    assert body["session"]["session_name"] == "demo-session"
    assert body["session"]["student_count"] == 2
    assert body["session"]["session_id"].startswith("session-")


def test_get_unknown_session_returns_not_found() -> None:
    response = client.get("/sessions/missing")

    assert response.status_code == 404
    assert response.json() == {"detail": "session_not_found"}


def test_run_session_match_returns_integrated_result() -> None:
    transport = httpx.ASGITransport(app=ai_app)
    session_service.set_ai_client(AIBackendClient("http://ai-backend", transport=transport))

    create_response = client.post(
        "/sessions",
        json={
            "session_name": "demo-session",
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
    session_id = create_response.json()["session"]["session_id"]

    match_response = client.post(f"/sessions/{session_id}/match")
    body = match_response.json()

    assert match_response.status_code == 200
    assert body["status"] == "ok"
    assert body["session_id"] == session_id
    assert len(body["matches"]) == 1
    assert body["matches"][0]["conflict_scenario_source"] == "fallback"

    result_response = client.get(f"/sessions/{session_id}/result")
    assert result_response.status_code == 200
    assert result_response.json()["status"] == "ok"


def test_create_session_accepts_interview_driven_student_payload() -> None:
    response = client.post(
        "/sessions",
        json={
            "session_name": "interview-session",
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

    assert response.status_code == 201
    assert body["status"] == "accepted"
    assert body["session"]["students"][0]["profile_id"] == "profile-1"
    assert body["session"]["students"][0]["interview"]["wake_up_time"] == "07:00"
