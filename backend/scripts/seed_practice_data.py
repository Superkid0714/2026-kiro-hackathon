from __future__ import annotations

from copy import deepcopy
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from main_backend.services.chat_service import chat_service
from main_backend.services.profile_service import profile_service
from main_backend.services.storage import (
    LocalJsonStorage,
    PostgresStorage,
    get_storage_backend,
    reset_storage_backend,
)

DEMO_PROFILES: list[dict[str, Any]] = [
    {
        "profile_id": "demo-profile-jisu",
        "nickname": "지수",
        "age": 22,
        "gender": "female",
        "region": "광주광역시",
        "move_in_period": "2026-09",
        "stay_duration_months": 6,
    },
    {
        "profile_id": "demo-profile-minjun",
        "nickname": "민준",
        "age": 23,
        "gender": "male",
        "region": "광주광역시",
        "move_in_period": "2026-09",
        "stay_duration_months": 6,
    },
    {
        "profile_id": "demo-profile-seojun",
        "nickname": "서준",
        "age": 24,
        "gender": "male",
        "region": "광주광역시",
        "move_in_period": "2026-10",
        "stay_duration_months": 6,
    },
    {
        "profile_id": "demo-profile-haeun",
        "nickname": "하은",
        "age": 22,
        "gender": "female",
        "region": "광주광역시",
        "move_in_period": "2026-09",
        "stay_duration_months": 12,
    },
]

DEMO_INTERVIEWS: dict[str, dict[str, Any]] = {
    "demo-profile-jisu": {
        "wake_up_time": "07:00",
        "sleep_time": "23:30",
        "noise_sensitive": True,
        "quiet_hours_start": "22:00",
        "cleaning_frequency": "3",
        "dishes_deadline": "그날 이내에",
        "guest_frequency": "1",
        "smokes": False,
        "smoking_type": None,
        "smoking_place": None,
        "drinking_frequency": "2",
        "home_stay_frequency": "5",
        "meal_preference": "직접",
        "home_activity_frequency": "매일",
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
        "hardcut_conditions": ["실내 흡연"],
    },
    "demo-profile-minjun": {
        "wake_up_time": "07:10",
        "sleep_time": "23:20",
        "noise_sensitive": True,
        "quiet_hours_start": "22:10",
        "cleaning_frequency": "3",
        "dishes_deadline": "그날 이내에",
        "guest_frequency": "1",
        "smokes": False,
        "smoking_type": None,
        "smoking_place": None,
        "drinking_frequency": "2",
        "home_stay_frequency": "5",
        "meal_preference": "직접",
        "home_activity_frequency": "6",
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
        "hardcut_conditions": [],
    },
    "demo-profile-seojun": {
        "wake_up_time": "06:40",
        "sleep_time": "22:50",
        "noise_sensitive": False,
        "quiet_hours_start": "23:00",
        "cleaning_frequency": "2",
        "dishes_deadline": "다음날 아침",
        "guest_frequency": "2",
        "smokes": False,
        "smoking_type": None,
        "smoking_place": None,
        "drinking_frequency": "3",
        "home_stay_frequency": "4",
        "meal_preference": "배달",
        "home_activity_frequency": "4",
        "supplies_sharing": "각자",
        "summer_temperature": 25,
        "winter_temperature": 22,
        "pet_ok": False,
        "pet_preference": None,
        "conflict_resolution": "모아서 대면",
        "shared_cost_rule": "반반",
        "personal_space_access": "불가능",
        "personal_space_ratio": "반반",
        "security_preference": "항시 잠금",
        "absence_notice": "항상",
        "hardcut_conditions": ["잦은 손님 방문"],
    },
    "demo-profile-haeun": {
        "wake_up_time": "07:20",
        "sleep_time": "23:40",
        "noise_sensitive": True,
        "quiet_hours_start": "22:30",
        "cleaning_frequency": "4",
        "dishes_deadline": "그날 이내에",
        "guest_frequency": "1",
        "smokes": False,
        "smoking_type": None,
        "smoking_place": None,
        "drinking_frequency": "1",
        "home_stay_frequency": "6",
        "meal_preference": "직접",
        "home_activity_frequency": "매일",
        "supplies_sharing": "공동구매",
        "summer_temperature": 23,
        "winter_temperature": 21,
        "pet_ok": True,
        "pet_preference": "둘 다",
        "conflict_resolution": "즉시 대면",
        "shared_cost_rule": "반반",
        "personal_space_access": "노크 혹은 허락",
        "personal_space_ratio": "필요한 만큼",
        "security_preference": "외출시",
        "absence_notice": "하루 이상",
        "hardcut_conditions": [],
    },
}


def _cleanup_demo_rows(storage: Any) -> None:
    if isinstance(storage, PostgresStorage):
        with storage._cursor() as cursor:
            cursor.execute(
                "DELETE FROM chat_messages WHERE room_id LIKE 'room-demo-%' OR message_id LIKE 'msg-demo-%'"
            )
            cursor.execute(
                "DELETE FROM chat_rooms WHERE participant_a_profile_id LIKE 'demo-profile-%' "
                "OR participant_b_profile_id LIKE 'demo-profile-%'"
            )
            cursor.execute(
                "DELETE FROM match_requests WHERE participant_a_profile_id LIKE 'demo-profile-%' "
                "OR participant_b_profile_id LIKE 'demo-profile-%'"
            )
            cursor.execute(
                "DELETE FROM profile_recommendations WHERE profile_id LIKE 'demo-profile-%'"
            )
            cursor.execute(
                "DELETE FROM profile_interviews WHERE profile_id LIKE 'demo-profile-%'"
            )
            cursor.execute("DELETE FROM profiles WHERE profile_id LIKE 'demo-profile-%'")
        return

    if isinstance(storage, LocalJsonStorage):
        with storage._lock:
            payload = storage._read()
            demo_profile_ids = {
                key for key in payload["profiles"].keys() if key.startswith("demo-profile-")
            }
            payload["profiles"] = {
                key: value
                for key, value in payload["profiles"].items()
                if key not in demo_profile_ids
            }
            payload["interviews"] = {
                key: value
                for key, value in payload["interviews"].items()
                if key not in demo_profile_ids
            }
            payload["recommendations"] = {
                key: value
                for key, value in payload["recommendations"].items()
                if key not in demo_profile_ids
            }
            payload["chat_rooms"] = {
                key: value
                for key, value in payload["chat_rooms"].items()
                if not (
                    value["participant_a_profile_id"] in demo_profile_ids
                    or value["participant_b_profile_id"] in demo_profile_ids
                )
            }
            payload["match_requests"] = {
                key: value
                for key, value in payload["match_requests"].items()
                if not (
                    value["participant_a_profile_id"] in demo_profile_ids
                    or value["participant_b_profile_id"] in demo_profile_ids
                )
            }
            valid_room_ids = set(payload["chat_rooms"].keys())
            payload["chat_messages"] = {
                room_id: messages
                for room_id, messages in payload["chat_messages"].items()
                if room_id in valid_room_ids
            }
            storage._write(payload)


def _seed_profiles() -> None:
    storage = get_storage_backend()
    now = datetime.now(UTC).isoformat()
    for profile in DEMO_PROFILES:
        record = deepcopy(profile)
        record["created_at"] = now
        storage.save_profile(record)


def _seed_interviews() -> None:
    for profile in DEMO_PROFILES:
        interview = DEMO_INTERVIEWS[profile["profile_id"]]
        result = profile_service.save_interview(profile["profile_id"], deepcopy(interview))
        if result is None:
            raise RuntimeError(f"seed_interview_failed:{profile['profile_id']}")


def _seed_chat_demo() -> dict[str, Any]:
    request = chat_service.create_or_get_match_request(
        "demo-profile-jisu",
        "demo-profile-minjun",
    )
    if request["status"] != "accepted":
        request = chat_service.accept_match_request(
            request["request_id"],
            "demo-profile-minjun",
        )
    room = chat_service.create_or_get_room("demo-profile-jisu", "demo-profile-minjun")
    existing = chat_service.list_messages(room["room_id"])
    if not existing:
        first = chat_service.build_message(
            room_id=room["room_id"],
            sender_profile_id="demo-profile-minjun",
            sender_nickname="민준",
            text="안녕하세요! 연습용으로 먼저 인사 남겨봤어요.",
        )
        chat_service.build_message(
            room_id=room["room_id"],
            sender_profile_id="demo-profile-jisu",
            sender_nickname="지수",
            text="반가워요. 추천 이후 대화 흐름을 확인해보고 싶었어요.",
        )
        existing = [first, *chat_service.list_messages(room["room_id"])[1:]]
    return {
        "match_request": request,
        "room": room,
        "messages": existing,
    }


def seed_practice_data() -> dict[str, Any]:
    reset_storage_backend()
    storage = get_storage_backend()
    _cleanup_demo_rows(storage)
    _seed_profiles()
    _seed_interviews()
    chat = _seed_chat_demo()

    recommendations = {
        profile["profile_id"]: get_storage_backend().get_profile_recommendations(profile["profile_id"])
        for profile in DEMO_PROFILES
    }
    return {
        "seeded_profiles": [profile["profile_id"] for profile in DEMO_PROFILES],
        "recommendations": recommendations,
        "chat_room_id": chat["room"]["room_id"],
        "match_request_id": chat["match_request"]["request_id"],
        "message_count": len(chat["messages"]),
    }


def main() -> None:
    result = seed_practice_data()
    print("Seeded practice data successfully.")
    for profile_id in result["seeded_profiles"]:
        recommendation_block = result["recommendations"].get(profile_id) or {}
        count = len(recommendation_block.get("recommendations", []))
        print(f"- {profile_id}: recommendations={count}")
    print(f"- chat_room_id: {result['chat_room_id']}")
    print(f"- match_request_id: {result['match_request_id']}")
    print(f"- message_count: {result['message_count']}")


if __name__ == "__main__":
    main()
