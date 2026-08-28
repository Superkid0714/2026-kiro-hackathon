from fastapi.testclient import TestClient

from main_backend.app import app
from main_backend.services.auth_service import auth_service

client = TestClient(app)


def test_exchange_kakao_code_returns_service_token_and_user(monkeypatch) -> None:
    monkeypatch.setenv("JWT_SECRET", "test-secret-key-1234567890")
    monkeypatch.setenv("KAKAO_REST_API_KEY", "kakao-rest-key")
    monkeypatch.setenv("KAKAO_REDIRECT_URI", "http://localhost:3000/auth/kakao/callback")

    monkeypatch.setattr(
        auth_service,
        "_request_kakao_token",
        lambda code: {"access_token": f"access-for-{code}"},
    )
    monkeypatch.setattr(
        auth_service,
        "_request_kakao_user",
        lambda access_token: {
            "id": 123456789,
            "kakao_account": {
                "email": "roomonic@example.com",
                "profile": {
                    "nickname": "룸닉",
                    "profile_image_url": "https://example.com/profile.png",
                },
            },
            "properties": {"nickname": "룸닉"},
        },
    )

    response = client.post("/auth/kakao/exchange", json={"code": "sample-code"})
    body = response.json()

    assert response.status_code == 200
    assert body["status"] == "ok"
    assert body["token_type"] == "Bearer"
    assert body["access_token"]
    assert body["user"]["provider"] == "kakao"
    assert body["user"]["provider_user_id"] == "123456789"
    assert body["next_step"] == "complete-profile"


def test_get_auth_me_returns_current_user(monkeypatch) -> None:
    monkeypatch.setenv("JWT_SECRET", "test-secret-key-1234567890")
    monkeypatch.setenv("KAKAO_REST_API_KEY", "kakao-rest-key")
    monkeypatch.setenv("KAKAO_REDIRECT_URI", "http://localhost:3000/auth/kakao/callback")

    monkeypatch.setattr(
        auth_service,
        "_request_kakao_token",
        lambda code: {"access_token": f"access-for-{code}"},
    )
    monkeypatch.setattr(
        auth_service,
        "_request_kakao_user",
        lambda access_token: {
            "id": 123456789,
            "kakao_account": {
                "email": "roomonic@example.com",
                "profile": {"nickname": "룸닉"},
            },
            "properties": {"nickname": "룸닉"},
        },
    )

    exchange = client.post("/auth/kakao/exchange", json={"code": "sample-code"}).json()
    token = exchange["access_token"]

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    body = response.json()

    assert response.status_code == 200
    assert body["status"] == "ok"
    assert body["user"]["provider_user_id"] == "123456789"
    assert body["user"]["nickname"] == "룸닉"


def test_create_profile_links_to_authenticated_user(monkeypatch) -> None:
    monkeypatch.setenv("JWT_SECRET", "test-secret-key-1234567890")
    monkeypatch.setenv("KAKAO_REST_API_KEY", "kakao-rest-key")
    monkeypatch.setenv("KAKAO_REDIRECT_URI", "http://localhost:3000/auth/kakao/callback")

    monkeypatch.setattr(
        auth_service,
        "_request_kakao_token",
        lambda code: {"access_token": f"access-for-{code}"},
    )
    monkeypatch.setattr(
        auth_service,
        "_request_kakao_user",
        lambda access_token: {
            "id": 987654321,
            "kakao_account": {
                "email": "member@example.com",
                "profile": {"nickname": "카카오회원"},
            },
            "properties": {"nickname": "카카오회원"},
        },
    )

    exchange = client.post("/auth/kakao/exchange", json={"code": "sample-code"}).json()
    token = exchange["access_token"]

    profile_response = client.post(
        "/profiles",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "nickname": "민수",
            "age": 22,
            "gender": "male",
            "region": "광주광역시",
            "move_in_period": "2026-09",
            "stay_duration_months": 6,
        },
    )
    profile_id = profile_response.json()["profile"]["profile_id"]

    me_response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    me_body = me_response.json()

    assert profile_response.status_code == 201
    assert me_response.status_code == 200
    assert me_body["user"]["profile_id"] == profile_id


def test_authenticated_user_cannot_create_second_profile(monkeypatch) -> None:
    monkeypatch.setenv("JWT_SECRET", "test-secret-key-1234567890")
    monkeypatch.setenv("KAKAO_REST_API_KEY", "kakao-rest-key")
    monkeypatch.setenv("KAKAO_REDIRECT_URI", "http://localhost:3000/auth/kakao/callback")

    monkeypatch.setattr(
        auth_service,
        "_request_kakao_token",
        lambda code: {"access_token": f"access-for-{code}"},
    )
    monkeypatch.setattr(
        auth_service,
        "_request_kakao_user",
        lambda access_token: {
            "id": 1122334455,
            "kakao_account": {
                "email": "duplicate@example.com",
                "profile": {"nickname": "중복회원"},
            },
            "properties": {"nickname": "중복회원"},
        },
    )

    exchange = client.post("/auth/kakao/exchange", json={"code": "sample-code"}).json()
    token = exchange["access_token"]

    first_response = client.post(
        "/profiles",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "nickname": "첫프로필",
            "age": 22,
            "gender": "female",
            "region": "광주광역시",
            "move_in_period": "2026-09",
            "stay_duration_months": 6,
        },
    )
    second_response = client.post(
        "/profiles",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "nickname": "두번째프로필",
            "age": 23,
            "gender": "female",
            "region": "광주광역시",
            "move_in_period": "2026-10",
            "stay_duration_months": 12,
        },
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert second_response.json()["detail"] == "profile_already_linked"
