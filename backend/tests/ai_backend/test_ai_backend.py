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
