from fastapi.testclient import TestClient

from main_backend.app import app

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
    assert body["next_step"] == "call-ai-backend"
    assert body["session"]["session_name"] == "demo-session"
    assert body["session"]["student_count"] == 2
    assert body["session"]["session_id"].startswith("session-")


def test_get_unknown_session_returns_not_found() -> None:
    response = client.get("/sessions/missing")

    assert response.status_code == 404
    assert response.json() == {"detail": "session_not_found"}
