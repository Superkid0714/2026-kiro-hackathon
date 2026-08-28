from __future__ import annotations

import json

from fastapi.testclient import TestClient

from main_backend.app import app

client = TestClient(app)


def _create_profile(nickname: str) -> str:
    response = client.post(
        "/profiles",
        json={
            "nickname": nickname,
            "age": 22,
            "gender": "female",
            "region": "광주광역시",
            "move_in_period": "2026-09",
            "stay_duration_months": 6,
        },
    )
    return response.json()["profile"]["profile_id"]


def _save_interview(profile_id: str, *, guest_frequency: str = "1", smokes: bool = False) -> None:
    payload = {
        "wake_up_time": "07:00",
        "sleep_time": "23:30",
        "noise_sensitive": True,
        "quiet_hours_start": "22:00",
        "cleaning_frequency": "3",
        "dishes_deadline": "그날 이내에",
        "guest_frequency": guest_frequency,
        "smokes": smokes,
        "smoking_type": "전자담배" if smokes else None,
        "smoking_place": "베란다" if smokes else None,
        "drinking_frequency": "2",
        "home_stay_frequency": "5",
        "meal_preference": "직접",
        "home_activity_frequency": "매일",
        "supplies_sharing": "일부 공유",
        "summer_temperature": 24,
        "winter_temperature": 21,
        "pet_ok": False,
        "pet_preference": None,
        "conflict_resolution": "즉시 대면",
        "shared_cost_rule": "반반",
        "personal_space_access": "노크 혹은 허락",
        "personal_space_ratio": "반반",
        "security_preference": "외출시",
        "absence_notice": "하루 이상",
        "hardcut_conditions": [],
    }
    response = client.put(f"/profiles/{profile_id}/interview", json=payload)
    assert response.status_code == 200


def test_create_chat_room_reuses_existing_pair() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")

    request_response = client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": second_profile},
    )
    request_id = request_response.json()["match_request"]["request_id"]
    accept_response = client.post(
        f"/match-requests/{request_id}/accept",
        json={"profile_id": second_profile},
    )

    first_response = client.post(
        f"/profiles/{first_profile}/chat-rooms",
        json={"other_profile_id": second_profile},
    )
    second_response = client.post(
        f"/profiles/{second_profile}/chat-rooms",
        json={"other_profile_id": first_profile},
    )

    assert request_response.status_code == 201
    assert accept_response.status_code == 200
    assert first_response.status_code == 201
    assert second_response.status_code == 201
    assert first_response.json()["room"]["room_id"] == second_response.json()["room"]["room_id"]


def test_chat_room_requires_mutual_acceptance() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")

    request_response = client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": second_profile},
    )
    room_response = client.post(
        f"/profiles/{first_profile}/chat-rooms",
        json={"other_profile_id": second_profile},
    )

    assert request_response.status_code == 201
    assert room_response.status_code == 403
    assert room_response.json()["detail"] == "chat_requires_mutual_acceptance"


def test_get_chat_room_messages_returns_saved_history() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")
    request_id = client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": second_profile},
    ).json()["match_request"]["request_id"]
    client.post(
        f"/match-requests/{request_id}/accept",
        json={"profile_id": second_profile},
    )
    room_response = client.post(
        f"/profiles/{first_profile}/chat-rooms",
        json={"other_profile_id": second_profile},
    )
    room_id = room_response.json()["room"]["room_id"]

    with client.websocket_connect(
        f"/ws/chat-rooms/{room_id}?profile_id={first_profile}&nickname=민수"
    ) as websocket:
        connected_payload = json.loads(websocket.receive_text())
        assert connected_payload["type"] == "connected"

        websocket.send_text(
            json.dumps(
                {
                    "type": "send_message",
                    "text": "안녕하세요! 반가워요.",
                },
                ensure_ascii=False,
            )
        )
        message_payload = json.loads(websocket.receive_text())
        assert message_payload["type"] == "message"
        assert message_payload["message"]["text"] == "안녕하세요! 반가워요."

    history_response = client.get(f"/chat-rooms/{room_id}/messages")
    body = history_response.json()

    assert history_response.status_code == 200
    assert body["status"] == "ok"
    assert body["room"]["room_id"] == room_id
    assert len(body["messages"]) == 1
    assert body["messages"][0]["sender_profile_id"] == first_profile


def test_websocket_broadcasts_to_both_participants() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")
    request_id = client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": second_profile},
    ).json()["match_request"]["request_id"]
    client.post(
        f"/match-requests/{request_id}/accept",
        json={"profile_id": second_profile},
    )
    room_id = client.post(
        f"/profiles/{first_profile}/chat-rooms",
        json={"other_profile_id": second_profile},
    ).json()["room"]["room_id"]

    with client.websocket_connect(
        f"/ws/chat-rooms/{room_id}?profile_id={first_profile}&nickname=민수"
    ) as first_socket, client.websocket_connect(
        f"/ws/chat-rooms/{room_id}?profile_id={second_profile}&nickname=서연"
    ) as second_socket:
        json.loads(first_socket.receive_text())
        json.loads(second_socket.receive_text())

        first_socket.send_text(
            json.dumps(
                {
                    "type": "send_message",
                    "text": "생활수칙 같이 정해볼까요?",
                },
                ensure_ascii=False,
            )
        )

        first_message = json.loads(first_socket.receive_text())
        second_message = json.loads(second_socket.receive_text())

    assert first_message["type"] == "message"
    assert second_message["type"] == "message"
    assert first_message["message"]["message_id"] == second_message["message"]["message_id"]
    assert second_message["message"]["sender_nickname"] == "민수"


def test_accept_match_request_marks_request_as_accepted() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")

    create_response = client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": second_profile},
    )
    request_id = create_response.json()["match_request"]["request_id"]

    accept_response = client.post(
        f"/match-requests/{request_id}/accept",
        json={"profile_id": second_profile},
    )

    body = accept_response.json()
    assert create_response.status_code == 201
    assert accept_response.status_code == 200
    assert body["status"] == "accepted"
    assert body["match_request"]["status"] == "accepted"
    assert body["match_request"]["accepted_by_profile_id"] == second_profile


def test_list_match_requests_includes_peer_summary_and_room_id() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")

    request_id = client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": second_profile},
    ).json()["match_request"]["request_id"]

    pending_view = client.get(f"/profiles/{second_profile}/match-requests")
    assert pending_view.status_code == 200
    pending_item = pending_view.json()["match_requests"][0]
    assert pending_item["status"] == "pending"
    assert pending_item["peer_profile_id"] == first_profile
    assert pending_item["peer_nickname"] == "민수"
    assert pending_item["room_id"] is None

    client.post(
        f"/match-requests/{request_id}/accept",
        json={"profile_id": second_profile},
    )
    room_id = client.post(
        f"/profiles/{first_profile}/chat-rooms",
        json={"other_profile_id": second_profile},
    ).json()["room"]["room_id"]

    accepted_view = client.get(f"/profiles/{first_profile}/match-requests")
    accepted_item = accepted_view.json()["match_requests"][0]
    assert accepted_item["status"] == "accepted"
    assert accepted_item["peer_profile_id"] == second_profile
    assert accepted_item["peer_nickname"] == "서연"
    assert accepted_item["room_id"] == room_id


def test_list_match_requests_unknown_profile_returns_404() -> None:
    response = client.get("/profiles/does-not-exist/match-requests")
    assert response.status_code == 404


def test_roommate_confirmation_requires_both_participants() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")
    _save_interview(first_profile, guest_frequency="1")
    _save_interview(second_profile, guest_frequency="5")

    request_id = client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": second_profile},
    ).json()["match_request"]["request_id"]
    client.post(
        f"/match-requests/{request_id}/accept",
        json={"profile_id": second_profile},
    )
    room_id = client.post(
        f"/profiles/{first_profile}/chat-rooms",
        json={"other_profile_id": second_profile},
    ).json()["room"]["room_id"]

    first_confirm_response = client.post(
        f"/chat-rooms/{room_id}/roommate-confirmation",
        json={"profile_id": first_profile},
    )
    second_confirm_response = client.post(
        f"/chat-rooms/{room_id}/roommate-confirmation",
        json={"profile_id": second_profile},
    )
    get_response = client.get(
        f"/chat-rooms/{room_id}/pact",
        params={"profile_id": first_profile},
    )

    assert first_confirm_response.status_code == 200
    assert first_confirm_response.json()["status"] == "pending"
    assert (
        first_confirm_response.json()["room"]["roommate_confirmation"]["pending_for_profile_id"]
        == second_profile
    )
    assert second_confirm_response.status_code == 200
    assert second_confirm_response.json()["status"] == "confirmed"
    assert second_confirm_response.json()["pact"]["room_id"] == room_id
    assert second_confirm_response.json()["pact"]["rules"]
    assert second_confirm_response.json()["pact"]["conflict_topics"]
    assert get_response.status_code == 200
    assert get_response.json()["pact"]["room_id"] == room_id
    assert any(
        topic["code"] == "guest_frequency"
        for topic in get_response.json()["pact"]["conflict_topics"]
    )
