from __future__ import annotations

import json

from fastapi.testclient import TestClient

from main_backend.app import app
from main_backend.services.chat_service import chat_service

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


def test_requester_can_enter_chat_room_before_target_accepts() -> None:
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
    assert room_response.status_code == 201
    assert room_response.json()["room"]["room_id"].startswith("room-")


def test_target_cannot_enter_chat_room_before_accepting() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")

    request_response = client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": second_profile},
    )
    room_response = client.post(
        f"/profiles/{second_profile}/chat-rooms",
        json={"other_profile_id": first_profile},
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


def test_get_chat_room_messages_includes_participant_character_metadata() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")
    _save_interview(first_profile)
    _save_interview(second_profile)

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

    response = client.get(f"/chat-rooms/{room_id}/messages")

    assert response.status_code == 200
    participants = response.json()["room"]["participants"]
    second_participant = next(
        item for item in participants if item["profile_id"] == second_profile
    )
    assert second_participant["character"]["type_code"] == "DUDI"
    assert second_participant["character"]["type_name"] == "함께정돈형"


def test_requester_cannot_send_message_before_target_accepts() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")
    client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": second_profile},
    )
    room_id = client.post(
        f"/profiles/{first_profile}/chat-rooms",
        json={"other_profile_id": second_profile},
    ).json()["room"]["room_id"]

    history_response = client.get(f"/chat-rooms/{room_id}/messages")
    assert history_response.status_code == 200
    assert history_response.json()["chat_state"]["match_status"] == "pending"
    assert history_response.json()["chat_state"]["can_send_message"] is False

    with client.websocket_connect(
        f"/ws/chat-rooms/{room_id}?profile_id={first_profile}&nickname=민수"
    ) as websocket:
        json.loads(websocket.receive_text())
        websocket.send_text(
            json.dumps(
                {
                    "type": "send_message",
                    "text": "먼저 인사 남겨둘게요!",
                },
                ensure_ascii=False,
            )
        )
        error_payload = json.loads(websocket.receive_text())

    assert error_payload["type"] == "error"
    assert error_payload["detail"] == "chat_message_requires_acceptance"
    assert client.get(f"/chat-rooms/{room_id}/messages").json()["messages"] == []


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


def test_reject_match_request_marks_request_as_rejected() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")

    create_response = client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": second_profile},
    )
    request_id = create_response.json()["match_request"]["request_id"]

    reject_response = client.post(
        f"/match-requests/{request_id}/reject",
        json={"profile_id": second_profile},
    )

    body = reject_response.json()
    assert create_response.status_code == 201
    assert reject_response.status_code == 200
    assert body["status"] == "rejected"
    assert body["match_request"]["status"] == "rejected"
    assert body["match_request"]["rejected_by_profile_id"] == second_profile


def test_rejected_match_request_blocks_chat_room_creation() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")

    request_id = client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": second_profile},
    ).json()["match_request"]["request_id"]

    reject_response = client.post(
        f"/match-requests/{request_id}/reject",
        json={"profile_id": second_profile},
    )
    room_response = client.post(
        f"/profiles/{first_profile}/chat-rooms",
        json={"other_profile_id": second_profile},
    )

    assert reject_response.status_code == 200
    assert room_response.status_code == 403
    assert room_response.json()["detail"] == "chat_requires_mutual_acceptance"


def test_list_match_requests_includes_peer_summary_and_room_id() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")
    _save_interview(second_profile)

    request_id = client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": second_profile},
    ).json()["match_request"]["request_id"]

    room_id = client.post(
        f"/profiles/{first_profile}/chat-rooms",
        json={"other_profile_id": second_profile},
    ).json()["room"]["room_id"]

    pending_view = client.get(f"/profiles/{second_profile}/match-requests")
    assert pending_view.status_code == 200
    pending_item = pending_view.json()["match_requests"][0]
    assert pending_item["status"] == "pending"
    assert pending_item["peer_profile_id"] == first_profile
    assert pending_item["peer_nickname"] == "민수"
    assert pending_item["room_id"] is None

    requester_pending_view = client.get(f"/profiles/{first_profile}/match-requests")
    requester_pending_item = requester_pending_view.json()["match_requests"][0]
    assert requester_pending_item["status"] == "pending"
    assert requester_pending_item["peer_profile_id"] == second_profile
    assert requester_pending_item["room_id"] == room_id

    client.post(
        f"/match-requests/{request_id}/accept",
        json={"profile_id": second_profile},
    )

    accepted_view = client.get(f"/profiles/{first_profile}/match-requests")
    accepted_item = accepted_view.json()["match_requests"][0]
    assert accepted_item["status"] == "accepted"
    assert accepted_item["peer_profile_id"] == second_profile
    assert accepted_item["peer_nickname"] == "서연"
    assert accepted_item["peer_type_code"] == "DUDI"
    assert accepted_item["peer_type_name"] == "함께정돈형"
    assert accepted_item["room_id"] == room_id


def test_list_match_requests_reflects_latest_chat_message() -> None:
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
        f"/ws/chat-rooms/{room_id}?profile_id={second_profile}&nickname=서연"
    ) as websocket:
        json.loads(websocket.receive_text())
        websocket.send_text(
            json.dumps(
                {
                    "type": "send_message",
                    "text": "안녕하세요, 메시지 잘 보이나요?",
                },
                ensure_ascii=False,
            )
        )
        json.loads(websocket.receive_text())

    inbox_response = client.get(f"/profiles/{first_profile}/match-requests")
    assert inbox_response.status_code == 200

    item = inbox_response.json()["match_requests"][0]
    assert item["room_id"] == room_id
    assert item["last_message_preview"] == "안녕하세요, 메시지 잘 보이나요?"
    assert item["unread_count"] == 1
    assert item["updated_at"] == item["accepted_at"] or item["updated_at"] > item["accepted_at"]


def test_mark_chat_room_as_read_resets_unread_count_and_new_messages_increment_again() -> None:
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
        f"/ws/chat-rooms/{room_id}?profile_id={second_profile}&nickname=서연"
    ) as websocket:
        json.loads(websocket.receive_text())
        for text in ["첫 번째 메시지", "두 번째 메시지"]:
            websocket.send_text(
                json.dumps({"type": "send_message", "text": text}, ensure_ascii=False)
            )
            json.loads(websocket.receive_text())

    unread_before = client.get(
        f"/profiles/{first_profile}/match-requests"
    ).json()["match_requests"][0]
    assert unread_before["unread_count"] == 2

    read_response = client.post(
        f"/chat-rooms/{room_id}/read",
        json={"profile_id": first_profile},
    )
    assert read_response.status_code == 200
    assert read_response.json()["unread_count"] == 0

    unread_after_read = client.get(
        f"/profiles/{first_profile}/match-requests"
    ).json()["match_requests"][0]
    assert unread_after_read["unread_count"] == 0

    with client.websocket_connect(
        f"/ws/chat-rooms/{room_id}?profile_id={second_profile}&nickname=서연"
    ) as websocket:
        json.loads(websocket.receive_text())
        websocket.send_text(
            json.dumps({"type": "send_message", "text": "세 번째 메시지"}, ensure_ascii=False)
        )
        json.loads(websocket.receive_text())

    unread_after_new_message = client.get(
        f"/profiles/{first_profile}/match-requests"
    ).json()["match_requests"][0]
    assert unread_after_new_message["unread_count"] == 1


def test_inbox_websocket_pushes_unread_updates() -> None:
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
        f"/ws/profiles/{first_profile}/inbox"
    ) as inbox_socket, client.websocket_connect(
        f"/ws/chat-rooms/{room_id}?profile_id={second_profile}&nickname=서연"
    ) as room_socket:
        initial_snapshot = json.loads(inbox_socket.receive_text())
        assert initial_snapshot["type"] == "inbox_snapshot"
        assert initial_snapshot["notification_count"] == 0

        room_connected = json.loads(room_socket.receive_text())
        assert room_connected["type"] == "connected"

        room_socket.send_text(
            json.dumps({"type": "send_message", "text": "지금 시간 괜찮아요?"}, ensure_ascii=False)
        )
        json.loads(room_socket.receive_text())

        updated_snapshot = json.loads(inbox_socket.receive_text())
        assert updated_snapshot["type"] == "inbox_snapshot"
        assert updated_snapshot["notification_count"] == 1
        assert updated_snapshot["items"][0]["unread_count"] == 1


def test_unread_does_not_increase_while_recipient_is_in_active_room() -> None:
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

        second_socket.send_text(
            json.dumps(
                {"type": "send_message", "text": "지금 바로 이야기 가능해요?"},
                ensure_ascii=False,
            )
        )
        json.loads(second_socket.receive_text())
        json.loads(first_socket.receive_text())

    inbox_item = client.get(f"/profiles/{first_profile}/match-requests").json()["match_requests"][0]
    assert inbox_item["unread_count"] == 0


def test_list_match_requests_includes_rejected_state() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")

    request_id = client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": second_profile},
    ).json()["match_request"]["request_id"]

    client.post(
        f"/match-requests/{request_id}/reject",
        json={"profile_id": second_profile},
    )

    rejected_view = client.get(f"/profiles/{first_profile}/match-requests")
    rejected_item = rejected_view.json()["match_requests"][0]
    assert rejected_item["status"] == "rejected"
    assert rejected_item["peer_profile_id"] == second_profile
    assert rejected_item["room_id"] is None


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


def test_roommate_confirmation_pending_appears_in_inbox_snapshot() -> None:
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
    inbox_response = client.get(f"/profiles/{second_profile}/match-requests")
    snapshot = chat_service.build_inbox_snapshot(second_profile)
    pact_response = client.get(
        f"/chat-rooms/{room_id}/pact",
        params={"profile_id": second_profile},
    )

    assert first_confirm_response.status_code == 200
    assert first_confirm_response.json()["status"] == "pending"
    assert inbox_response.status_code == 200
    inbox_item = inbox_response.json()["match_requests"][0]
    assert inbox_item["roommate_confirmation"]["status"] == "pending"
    assert inbox_item["roommate_confirmation"]["pending_for_profile_id"] == second_profile
    assert snapshot["notification_count"] == 1
    assert pact_response.status_code == 404
    assert pact_response.json()["detail"] == "roommate_pact_not_found"


def test_update_roommate_pact_allows_custom_rules() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")
    _save_interview(first_profile, guest_frequency="1")
    _save_interview(second_profile, guest_frequency="5")
    request_id = client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": second_profile},
    ).json()["match_request"]["request_id"]
    client.post(f"/match-requests/{request_id}/accept", json={"profile_id": second_profile})
    room_id = client.post(
        f"/profiles/{first_profile}/chat-rooms",
        json={"other_profile_id": second_profile},
    ).json()["room"]["room_id"]
    client.post(f"/chat-rooms/{room_id}/roommate-confirmation", json={"profile_id": first_profile})
    client.post(f"/chat-rooms/{room_id}/roommate-confirmation", json={"profile_id": second_profile})

    response = client.put(
        f"/chat-rooms/{room_id}/pact",
        json={
            "profile_id": first_profile,
            "additional_rules": ["외출이 길어질 때는 짧게라도 먼저 알려줘요."],
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "updated"
    assert response.json()["pact"]["custom_rules"][0]["created_by_profile_id"] == first_profile


def test_sign_roommate_pact_stores_drawn_signature() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")
    _save_interview(first_profile, guest_frequency="1")
    _save_interview(second_profile, guest_frequency="5")
    request_id = client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": second_profile},
    ).json()["match_request"]["request_id"]
    client.post(f"/match-requests/{request_id}/accept", json={"profile_id": second_profile})
    room_id = client.post(
        f"/profiles/{first_profile}/chat-rooms",
        json={"other_profile_id": second_profile},
    ).json()["room"]["room_id"]
    client.post(f"/chat-rooms/{room_id}/roommate-confirmation", json={"profile_id": first_profile})
    client.post(f"/chat-rooms/{room_id}/roommate-confirmation", json={"profile_id": second_profile})

    response = client.post(
        f"/chat-rooms/{room_id}/signatures",
        json={
            "profile_id": first_profile,
            "signer_name": "민수",
            "signature_data_url": "data:image/png;base64,AAAA",
            "agreed": True,
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "signed"
    assert response.json()["pact"]["signatures"][first_profile]["signer_name"] == "민수"
    assert response.json()["pact"]["signature_status"] == "pending"


def test_get_chat_question_suggestions_returns_three_questions() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")
    _save_interview(first_profile, guest_frequency="1")
    _save_interview(second_profile, guest_frequency="5")
    request_id = client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": second_profile},
    ).json()["match_request"]["request_id"]
    client.post(f"/match-requests/{request_id}/accept", json={"profile_id": second_profile})
    room_id = client.post(
        f"/profiles/{first_profile}/chat-rooms",
        json={"other_profile_id": second_profile},
    ).json()["room"]["room_id"]

    with client.websocket_connect(
        f"/ws/chat-rooms/{room_id}?profile_id={first_profile}&nickname=민수"
    ) as websocket:
        json.loads(websocket.receive_text())
        websocket.send_text(
            json.dumps(
                {
                    "type": "send_message",
                    "text": "저는 밤 11시 이후에는 조금 조용했으면 좋겠어요.",
                },
                ensure_ascii=False,
            )
        )
        json.loads(websocket.receive_text())

    response = client.get(
        f"/chat-rooms/{room_id}/question-suggestions",
        params={"profile_id": first_profile},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["room_id"] == room_id
    assert len(body["questions"]) == 3
    assert body["source"] in {"llm", "fallback"}


def test_get_chat_question_suggestions_requires_interviews() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")
    request_id = client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": second_profile},
    ).json()["match_request"]["request_id"]
    client.post(f"/match-requests/{request_id}/accept", json={"profile_id": second_profile})
    room_id = client.post(
        f"/profiles/{first_profile}/chat-rooms",
        json={"other_profile_id": second_profile},
    ).json()["room"]["room_id"]

    response = client.get(
        f"/chat-rooms/{room_id}/question-suggestions",
        params={"profile_id": first_profile},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "chat_question_requires_profile_interview"


def test_confirmed_profile_cannot_start_new_match_request() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")
    third_profile = _create_profile("지수")
    _save_interview(first_profile, guest_frequency="1")
    _save_interview(second_profile, guest_frequency="5")
    _save_interview(third_profile, guest_frequency="2")

    request_id = client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": second_profile},
    ).json()["match_request"]["request_id"]
    client.post(f"/match-requests/{request_id}/accept", json={"profile_id": second_profile})
    room_id = client.post(
        f"/profiles/{first_profile}/chat-rooms",
        json={"other_profile_id": second_profile},
    ).json()["room"]["room_id"]
    client.post(f"/chat-rooms/{room_id}/roommate-confirmation", json={"profile_id": first_profile})
    client.post(f"/chat-rooms/{room_id}/roommate-confirmation", json={"profile_id": second_profile})

    response = client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": third_profile},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "profile_already_roommate_confirmed"


def test_confirmed_profile_cannot_be_accepted_into_another_match() -> None:
    first_profile = _create_profile("민수")
    second_profile = _create_profile("서연")
    third_profile = _create_profile("지수")
    _save_interview(first_profile, guest_frequency="1")
    _save_interview(second_profile, guest_frequency="5")
    _save_interview(third_profile, guest_frequency="2")

    request_id = client.post(
        f"/profiles/{first_profile}/match-requests",
        json={"other_profile_id": second_profile},
    ).json()["match_request"]["request_id"]
    client.post(f"/match-requests/{request_id}/accept", json={"profile_id": second_profile})
    room_id = client.post(
        f"/profiles/{first_profile}/chat-rooms",
        json={"other_profile_id": second_profile},
    ).json()["room"]["room_id"]
    client.post(f"/chat-rooms/{room_id}/roommate-confirmation", json={"profile_id": first_profile})
    client.post(f"/chat-rooms/{room_id}/roommate-confirmation", json={"profile_id": second_profile})

    another_request_id = client.post(
        f"/profiles/{third_profile}/match-requests",
        json={"other_profile_id": second_profile},
    )

    assert another_request_id.status_code == 409
    assert another_request_id.json()["detail"] == "profile_already_roommate_confirmed"
