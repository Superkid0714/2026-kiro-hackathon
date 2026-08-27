from fastapi.testclient import TestClient

from main_backend.app import app

client = TestClient(app)


def test_create_profile_returns_expected_shape() -> None:
    response = client.post(
        "/profiles",
        json={
            "nickname": "민수",
            "age": 22,
            "gender": "male",
            "region": "Gwangju",
            "move_in_period": "2026-09",
            "stay_duration_months": 6,
        },
    )

    body = response.json()

    assert response.status_code == 201
    assert body["status"] == "created"
    assert body["profile"]["nickname"] == "민수"
    assert body["profile"]["profile_id"].startswith("profile-")


def test_list_profiles_returns_created_profile() -> None:
    create_response = client.post(
        "/profiles",
        json={
            "nickname": "서연",
            "age": 21,
            "gender": "female",
            "region": "Jeonju",
            "move_in_period": "2026-08",
            "stay_duration_months": 12,
        },
    )
    created_profile = create_response.json()["profile"]

    response = client.get("/profiles")
    body = response.json()

    assert response.status_code == 200
    assert body["status"] == "ok"
    assert body["count"] >= 1
    assert any(
        profile["profile_id"] == created_profile["profile_id"]
        for profile in body["profiles"]
    )


def test_get_unknown_profile_returns_not_found() -> None:
    response = client.get("/profiles/profile-missing")

    assert response.status_code == 404
    assert response.json() == {"detail": "profile_not_found"}
