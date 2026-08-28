from __future__ import annotations

import json
import os
import tempfile
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from copy import deepcopy
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Protocol


class StorageBackend(Protocol):
    def save_user(self, user: dict[str, Any]) -> None: ...

    def get_user(self, user_id: str) -> dict[str, Any] | None: ...

    def get_user_by_provider(
        self, provider: str, provider_user_id: str
    ) -> dict[str, Any] | None: ...

    def link_user_profile(self, user_id: str, profile_id: str) -> dict[str, Any] | None: ...

    def save_profile(self, profile: dict[str, Any]) -> None: ...

    def list_profiles(self) -> list[dict[str, Any]]: ...

    def get_profile(self, profile_id: str) -> dict[str, Any] | None: ...

    def save_profile_interview(self, profile_id: str, interview: dict[str, Any]) -> None: ...

    def get_profile_interview(self, profile_id: str) -> dict[str, Any] | None: ...

    def list_profile_interviews(self) -> dict[str, dict[str, Any]]: ...

    def save_profile_recommendations(
        self,
        profile_id: str,
        recommendations: dict[str, Any],
    ) -> None: ...

    def get_profile_recommendations(self, profile_id: str) -> dict[str, Any] | None: ...

    def save_session(self, session: dict[str, Any]) -> None: ...

    def get_session(self, session_id: str) -> dict[str, Any] | None: ...

    def save_result(self, session_id: str, result: dict[str, Any]) -> None: ...

    def get_result(self, session_id: str) -> dict[str, Any] | None: ...

    def save_chat_room(self, room: dict[str, Any]) -> None: ...

    def find_chat_room(self, participant_a: str, participant_b: str) -> dict[str, Any] | None: ...

    def get_chat_room(self, room_id: str) -> dict[str, Any] | None: ...

    def save_match_request(self, request: dict[str, Any]) -> None: ...

    def find_match_request(
        self, participant_a: str, participant_b: str
    ) -> dict[str, Any] | None: ...

    def get_match_request(self, request_id: str) -> dict[str, Any] | None: ...

    def list_match_requests_for_profile(self, profile_id: str) -> list[dict[str, Any]]: ...

    def save_chat_message(self, room_id: str, message: dict[str, Any]) -> None: ...

    def list_chat_messages(self, room_id: str) -> list[dict[str, Any]]: ...

    def save_roommate_pact(self, room_id: str, pact: dict[str, Any]) -> None: ...

    def get_roommate_pact(self, room_id: str) -> dict[str, Any] | None: ...


@dataclass
class LocalJsonStorage:
    path: Path

    def __post_init__(self) -> None:
        self._lock = threading.RLock()
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def save_session(self, session: dict[str, Any]) -> None:
        with self._lock:
            payload = self._read()
            payload["sessions"][session["session_id"]] = deepcopy(session)
            self._write(payload)

    def save_profile(self, profile: dict[str, Any]) -> None:
        with self._lock:
            payload = self._read()
            payload["profiles"][profile["profile_id"]] = deepcopy(profile)
            self._write(payload)

    def save_user(self, user: dict[str, Any]) -> None:
        with self._lock:
            payload = self._read()
            payload["users"][user["user_id"]] = deepcopy(user)
            self._write(payload)

    def get_user(self, user_id: str) -> dict[str, Any] | None:
        with self._lock:
            payload = self._read()
            user = payload["users"].get(user_id)
            return deepcopy(user) if user is not None else None

    def get_user_by_provider(
        self, provider: str, provider_user_id: str
    ) -> dict[str, Any] | None:
        with self._lock:
            payload = self._read()
            for user in payload["users"].values():
                if user["provider"] == provider and user["provider_user_id"] == provider_user_id:
                    return deepcopy(user)
            return None

    def link_user_profile(self, user_id: str, profile_id: str) -> dict[str, Any] | None:
        with self._lock:
            payload = self._read()
            user = payload["users"].get(user_id)
            if user is None:
                return None
            user["profile_id"] = profile_id
            user["updated_at"] = datetime.now(UTC).isoformat()
            payload["users"][user_id] = user
            self._write(payload)
            return deepcopy(user)

    def list_profiles(self) -> list[dict[str, Any]]:
        with self._lock:
            payload = self._read()
            profiles = payload["profiles"].values()
            sorted_profiles = sorted(profiles, key=lambda item: item["created_at"], reverse=True)
            return deepcopy(sorted_profiles)

    def get_profile(self, profile_id: str) -> dict[str, Any] | None:
        with self._lock:
            payload = self._read()
            profile = payload["profiles"].get(profile_id)
            return deepcopy(profile) if profile is not None else None

    def save_profile_interview(self, profile_id: str, interview: dict[str, Any]) -> None:
        with self._lock:
            payload = self._read()
            payload["interviews"][profile_id] = deepcopy(interview)
            self._write(payload)

    def get_profile_interview(self, profile_id: str) -> dict[str, Any] | None:
        with self._lock:
            payload = self._read()
            interview = payload["interviews"].get(profile_id)
            return deepcopy(interview) if interview is not None else None

    def list_profile_interviews(self) -> dict[str, dict[str, Any]]:
        with self._lock:
            payload = self._read()
            return deepcopy(payload["interviews"])

    def save_profile_recommendations(
        self,
        profile_id: str,
        recommendations: dict[str, Any],
    ) -> None:
        with self._lock:
            payload = self._read()
            payload["recommendations"][profile_id] = deepcopy(recommendations)
            self._write(payload)

    def get_profile_recommendations(self, profile_id: str) -> dict[str, Any] | None:
        with self._lock:
            payload = self._read()
            item = payload["recommendations"].get(profile_id)
            return deepcopy(item) if item is not None else None

    def get_session(self, session_id: str) -> dict[str, Any] | None:
        with self._lock:
            payload = self._read()
            session = payload["sessions"].get(session_id)
            return deepcopy(session) if session is not None else None

    def save_result(self, session_id: str, result: dict[str, Any]) -> None:
        with self._lock:
            payload = self._read()
            payload["results"][session_id] = deepcopy(result)
            if session_id in payload["sessions"]:
                payload["sessions"][session_id]["status"] = result.get("status", "matched")
            self._write(payload)

    def get_result(self, session_id: str) -> dict[str, Any] | None:
        with self._lock:
            payload = self._read()
            result = payload["results"].get(session_id)
            return deepcopy(result) if result is not None else None

    def save_chat_room(self, room: dict[str, Any]) -> None:
        with self._lock:
            payload = self._read()
            payload["chat_rooms"][room["room_id"]] = deepcopy(room)
            self._write(payload)

    def find_chat_room(self, participant_a: str, participant_b: str) -> dict[str, Any] | None:
        with self._lock:
            payload = self._read()
            for room in payload["chat_rooms"].values():
                if (
                    room["participant_a_profile_id"] == participant_a
                    and room["participant_b_profile_id"] == participant_b
                ):
                    return deepcopy(room)
            return None

    def get_chat_room(self, room_id: str) -> dict[str, Any] | None:
        with self._lock:
            payload = self._read()
            room = payload["chat_rooms"].get(room_id)
            return deepcopy(room) if room is not None else None

    def save_match_request(self, request: dict[str, Any]) -> None:
        with self._lock:
            payload = self._read()
            payload["match_requests"][request["request_id"]] = deepcopy(request)
            self._write(payload)

    def find_match_request(self, participant_a: str, participant_b: str) -> dict[str, Any] | None:
        with self._lock:
            payload = self._read()
            for request in payload["match_requests"].values():
                if (
                    request["participant_a_profile_id"] == participant_a
                    and request["participant_b_profile_id"] == participant_b
                ):
                    return deepcopy(request)
            return None

    def get_match_request(self, request_id: str) -> dict[str, Any] | None:
        with self._lock:
            payload = self._read()
            request = payload["match_requests"].get(request_id)
            return deepcopy(request) if request is not None else None

    def list_match_requests_for_profile(self, profile_id: str) -> list[dict[str, Any]]:
        with self._lock:
            payload = self._read()
            return [
                deepcopy(request)
                for request in payload["match_requests"].values()
                if request["participant_a_profile_id"] == profile_id
                or request["participant_b_profile_id"] == profile_id
            ]

    def save_chat_message(self, room_id: str, message: dict[str, Any]) -> None:
        with self._lock:
            payload = self._read()
            payload["chat_messages"].setdefault(room_id, [])
            payload["chat_messages"][room_id].append(deepcopy(message))
            room = payload["chat_rooms"].get(room_id)
            if room is not None:
                room["updated_at"] = message["sent_at"]
            self._write(payload)

    def list_chat_messages(self, room_id: str) -> list[dict[str, Any]]:
        with self._lock:
            payload = self._read()
            return deepcopy(payload["chat_messages"].get(room_id, []))

    def save_roommate_pact(self, room_id: str, pact: dict[str, Any]) -> None:
        with self._lock:
            payload = self._read()
            payload["roommate_pacts"][room_id] = deepcopy(pact)
            self._write(payload)

    def get_roommate_pact(self, room_id: str) -> dict[str, Any] | None:
        with self._lock:
            payload = self._read()
            pact = payload["roommate_pacts"].get(room_id)
            return deepcopy(pact) if pact is not None else None

    def _read(self) -> dict[str, dict[str, Any]]:
        if not self.path.exists():
            return {
                "profiles": {},
                "users": {},
                "interviews": {},
                "recommendations": {},
                "sessions": {},
                "results": {},
                "chat_rooms": {},
                "match_requests": {},
                "chat_messages": {},
                "roommate_pacts": {},
            }

        with self.path.open("r", encoding="utf-8") as handle:
            content = json.load(handle)

        return {
            "profiles": content.get("profiles", {}),
            "users": content.get("users", {}),
            "interviews": content.get("interviews", {}),
            "recommendations": content.get("recommendations", {}),
            "sessions": content.get("sessions", {}),
            "results": content.get("results", {}),
            "chat_rooms": content.get("chat_rooms", {}),
            "match_requests": content.get("match_requests", {}),
            "chat_messages": content.get("chat_messages", {}),
            "roommate_pacts": content.get("roommate_pacts", {}),
        }

    def _write(self, payload: dict[str, dict[str, Any]]) -> None:
        with tempfile.NamedTemporaryFile(
            "w",
            encoding="utf-8",
            delete=False,
            dir=self.path.parent,
        ) as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
            temp_path = Path(handle.name)

        temp_path.replace(self.path)


class DynamoDbStorage:
    def __init__(self, table_name: str, region_name: str | None) -> None:
        try:
            import boto3
        except ImportError as exc:  # pragma: no cover
            raise RuntimeError("boto3_not_installed") from exc

        resource = boto3.resource("dynamodb", region_name=region_name)
        self._table = resource.Table(table_name)

    def save_profile(self, profile: dict[str, Any]) -> None:
        self._table.put_item(
            Item=self._item(
                f"PROFILE#{profile['profile_id']}",
                "PROFILE",
                profile,
                "active",
            )
        )

    def save_user(self, user: dict[str, Any]) -> None:
        self._table.put_item(
            Item=self._item(
                f"USER#{user['user_id']}",
                "USER",
                user,
                "active",
            )
        )

    def get_user(self, user_id: str) -> dict[str, Any] | None:
        response = self._table.get_item(Key={"pk": f"USER#{user_id}", "sk": "USER"})
        item = response.get("Item")
        return deepcopy(item["payload"]) if item is not None else None

    def get_user_by_provider(
        self, provider: str, provider_user_id: str
    ) -> dict[str, Any] | None:
        response = self._table.scan(
            FilterExpression=(
                "#sk = :user AND provider = :provider AND provider_user_id = :provider_user_id"
            ),
            ExpressionAttributeNames={"#sk": "sk"},
            ExpressionAttributeValues={
                ":user": "USER",
                ":provider": provider,
                ":provider_user_id": provider_user_id,
            },
        )
        items = response.get("Items", [])
        if not items:
            return None
        return deepcopy(items[0]["payload"])

    def link_user_profile(self, user_id: str, profile_id: str) -> dict[str, Any] | None:
        user = self.get_user(user_id)
        if user is None:
            return None
        user["profile_id"] = profile_id
        user["updated_at"] = datetime.now(UTC).isoformat()
        self.save_user(user)
        return deepcopy(user)

    def list_profiles(self) -> list[dict[str, Any]]:
        response = self._table.scan(
            FilterExpression="#sk = :profile",
            ExpressionAttributeNames={"#sk": "sk"},
            ExpressionAttributeValues={":profile": "PROFILE"},
        )
        items = response.get("Items", [])
        profiles = [item["payload"] for item in items]
        profiles.sort(key=lambda item: item["created_at"], reverse=True)
        return deepcopy(profiles)

    def get_profile(self, profile_id: str) -> dict[str, Any] | None:
        response = self._table.get_item(Key={"pk": f"PROFILE#{profile_id}", "sk": "PROFILE"})
        item = response.get("Item")
        return deepcopy(item["payload"]) if item is not None else None

    def save_profile_interview(self, profile_id: str, interview: dict[str, Any]) -> None:
        self._table.put_item(
            Item=self._item(
                f"PROFILE#{profile_id}",
                "INTERVIEW",
                interview,
                "saved",
            )
        )

    def get_profile_interview(self, profile_id: str) -> dict[str, Any] | None:
        response = self._table.get_item(Key={"pk": f"PROFILE#{profile_id}", "sk": "INTERVIEW"})
        item = response.get("Item")
        return deepcopy(item["payload"]) if item is not None else None

    def list_profile_interviews(self) -> dict[str, dict[str, Any]]:
        response = self._table.scan(
            FilterExpression="#sk = :interview",
            ExpressionAttributeNames={"#sk": "sk"},
            ExpressionAttributeValues={":interview": "INTERVIEW"},
        )
        items = response.get("Items", [])
        interviews: dict[str, dict[str, Any]] = {}
        for item in items:
            profile_id = item["pk"].replace("PROFILE#", "", 1)
            interviews[profile_id] = deepcopy(item["payload"])
        return interviews

    def save_profile_recommendations(
        self,
        profile_id: str,
        recommendations: dict[str, Any],
    ) -> None:
        self._table.put_item(
            Item=self._item(
                f"PROFILE#{profile_id}",
                "RECOMMENDATIONS",
                recommendations,
                "ready",
            )
        )

    def get_profile_recommendations(self, profile_id: str) -> dict[str, Any] | None:
        response = self._table.get_item(
            Key={"pk": f"PROFILE#{profile_id}", "sk": "RECOMMENDATIONS"}
        )
        item = response.get("Item")
        return deepcopy(item["payload"]) if item is not None else None

    def save_session(self, session: dict[str, Any]) -> None:
        self._table.put_item(
            Item=self._item(
                session["session_id"],
                "INPUT",
                session,
                session.get("status", "created"),
            )
        )

    def get_session(self, session_id: str) -> dict[str, Any] | None:
        response = self._table.get_item(Key={"pk": session_id, "sk": "INPUT"})
        item = response.get("Item")
        return deepcopy(item["payload"]) if item is not None else None

    def save_result(self, session_id: str, result: dict[str, Any]) -> None:
        self._table.put_item(
            Item=self._item(
                session_id,
                "MATCH_RESULT",
                result,
                result.get("status", "ok"),
            )
        )

    def get_result(self, session_id: str) -> dict[str, Any] | None:
        response = self._table.get_item(Key={"pk": session_id, "sk": "MATCH_RESULT"})
        item = response.get("Item")
        return deepcopy(item["payload"]) if item is not None else None

    def save_chat_room(self, room: dict[str, Any]) -> None:
        self._table.put_item(
            Item=self._item(
                f"CHATROOM#{room['room_id']}",
                "ROOM",
                room,
                "active",
            )
        )

    def find_chat_room(self, participant_a: str, participant_b: str) -> dict[str, Any] | None:
        response = self._table.scan(
            FilterExpression=(
                "#sk = :room AND participant_a_profile_id = :a "
                "AND participant_b_profile_id = :b"
            ),
            ExpressionAttributeNames={"#sk": "sk"},
            ExpressionAttributeValues={
                ":room": "ROOM",
                ":a": participant_a,
                ":b": participant_b,
            },
        )
        items = response.get("Items", [])
        if not items:
            return None
        return deepcopy(items[0]["payload"])

    def get_chat_room(self, room_id: str) -> dict[str, Any] | None:
        response = self._table.get_item(Key={"pk": f"CHATROOM#{room_id}", "sk": "ROOM"})
        item = response.get("Item")
        return deepcopy(item["payload"]) if item is not None else None

    def save_match_request(self, request: dict[str, Any]) -> None:
        self._table.put_item(
            Item=self._item(
                f"MATCHREQUEST#{request['request_id']}",
                "REQUEST",
                request,
                request["status"],
            )
        )

    def find_match_request(self, participant_a: str, participant_b: str) -> dict[str, Any] | None:
        response = self._table.scan(
            FilterExpression=(
                "#sk = :request AND participant_a_profile_id = :a "
                "AND participant_b_profile_id = :b"
            ),
            ExpressionAttributeNames={"#sk": "sk"},
            ExpressionAttributeValues={
                ":request": "REQUEST",
                ":a": participant_a,
                ":b": participant_b,
            },
        )
        items = response.get("Items", [])
        if not items:
            return None
        return deepcopy(items[0]["payload"])

    def get_match_request(self, request_id: str) -> dict[str, Any] | None:
        response = self._table.get_item(Key={"pk": f"MATCHREQUEST#{request_id}", "sk": "REQUEST"})
        item = response.get("Item")
        return deepcopy(item["payload"]) if item is not None else None

    def list_match_requests_for_profile(self, profile_id: str) -> list[dict[str, Any]]:
        response = self._table.scan(
            FilterExpression=(
                "#sk = :request AND "
                "(participant_a_profile_id = :profile_id OR participant_b_profile_id = :profile_id)"
            ),
            ExpressionAttributeNames={"#sk": "sk"},
            ExpressionAttributeValues={
                ":request": "REQUEST",
                ":profile_id": profile_id,
            },
        )
        return [deepcopy(item["payload"]) for item in response.get("Items", [])]

    def save_chat_message(self, room_id: str, message: dict[str, Any]) -> None:
        self._table.put_item(
            Item=self._item(
                f"CHATROOM#{room_id}",
                f"MESSAGE#{message['message_id']}",
                message,
                "sent",
            )
        )
        room = self.get_chat_room(room_id)
        if room is not None:
            room["updated_at"] = message["sent_at"]
            self.save_chat_room(room)

    def list_chat_messages(self, room_id: str) -> list[dict[str, Any]]:
        response = self._table.query(
            KeyConditionExpression="pk = :pk AND begins_with(sk, :prefix)",
            ExpressionAttributeValues={
                ":pk": f"CHATROOM#{room_id}",
                ":prefix": "MESSAGE#",
            },
        )
        items = response.get("Items", [])
        items.sort(key=lambda item: item["payload"]["sent_at"])
        return [deepcopy(item["payload"]) for item in items]

    def save_roommate_pact(self, room_id: str, pact: dict[str, Any]) -> None:
        self._table.put_item(
            Item=self._item(
                f"CHATROOM#{room_id}",
                "ROOMMATE_PACT",
                pact,
                "ready",
            )
        )

    def get_roommate_pact(self, room_id: str) -> dict[str, Any] | None:
        response = self._table.get_item(Key={"pk": f"CHATROOM#{room_id}", "sk": "ROOMMATE_PACT"})
        item = response.get("Item")
        return deepcopy(item["payload"]) if item is not None else None

    @staticmethod
    def _item(
        session_id: str,
        sort_key: str,
        payload: dict[str, Any],
        status: str,
    ) -> dict[str, Any]:
        return {
            "pk": session_id,
            "sk": sort_key,
            "created_at": datetime.now(UTC).isoformat(),
            "status": status,
            "payload": deepcopy(payload),
        }


class PostgresStorage:
    def __init__(self, *, host: str, port: int, dbname: str, user: str, password: str) -> None:
        self._conninfo = (
            f"host={host} port={port} dbname={dbname} user={user} password={password}"
        )

    def save_profile(self, profile: dict[str, Any]) -> None:
        with self._cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO profiles (
                    profile_id, nickname, age, gender, region, move_in_period,
                    stay_duration_months, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (profile_id) DO UPDATE SET
                    nickname = EXCLUDED.nickname,
                    age = EXCLUDED.age,
                    gender = EXCLUDED.gender,
                    region = EXCLUDED.region,
                    move_in_period = EXCLUDED.move_in_period,
                    stay_duration_months = EXCLUDED.stay_duration_months
                """,
                (
                    profile["profile_id"],
                    profile["nickname"],
                    profile["age"],
                    profile["gender"],
                    profile["region"],
                    profile["move_in_period"],
                    profile["stay_duration_months"],
                    profile["created_at"],
                ),
            )

    def save_user(self, user: dict[str, Any]) -> None:
        with self._cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO users (
                    user_id, provider, provider_user_id, profile_id, nickname, email,
                    profile_image_url, payload, created_at, updated_at, last_login_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s)
                ON CONFLICT (provider, provider_user_id) DO UPDATE SET
                    user_id = EXCLUDED.user_id,
                    profile_id = EXCLUDED.profile_id,
                    nickname = EXCLUDED.nickname,
                    email = EXCLUDED.email,
                    profile_image_url = EXCLUDED.profile_image_url,
                    payload = EXCLUDED.payload,
                    updated_at = EXCLUDED.updated_at,
                    last_login_at = EXCLUDED.last_login_at
                """,
                (
                    user["user_id"],
                    user["provider"],
                    user["provider_user_id"],
                    user.get("profile_id"),
                    user["nickname"],
                    user.get("email"),
                    user.get("profile_image_url"),
                    json.dumps(user, ensure_ascii=False),
                    user["created_at"],
                    user["updated_at"],
                    user["last_login_at"],
                ),
            )

    def get_user(self, user_id: str) -> dict[str, Any] | None:
        with self._cursor(row_factory="dict") as cursor:
            cursor.execute(
                "SELECT payload FROM users WHERE user_id = %s",
                (user_id,),
            )
            row = cursor.fetchone()
            return deepcopy(row["payload"]) if row is not None else None

    def get_user_by_provider(
        self, provider: str, provider_user_id: str
    ) -> dict[str, Any] | None:
        with self._cursor(row_factory="dict") as cursor:
            cursor.execute(
                """
                SELECT payload
                FROM users
                WHERE provider = %s AND provider_user_id = %s
                """,
                (provider, provider_user_id),
            )
            row = cursor.fetchone()
            return deepcopy(row["payload"]) if row is not None else None

    def link_user_profile(self, user_id: str, profile_id: str) -> dict[str, Any] | None:
        with self._cursor() as cursor:
            cursor.execute(
                """
                UPDATE users
                SET profile_id = %s,
                    updated_at = %s,
                    payload = jsonb_set(payload, '{profile_id}', to_jsonb(%s::text), true)
                WHERE user_id = %s
                """,
                (
                    profile_id,
                    datetime.now(UTC).isoformat(),
                    profile_id,
                    user_id,
                ),
            )
        return self.get_user(user_id)

    def list_profiles(self) -> list[dict[str, Any]]:
        with self._cursor(row_factory="dict") as cursor:
            cursor.execute(
                """
                SELECT profile_id, nickname, age, gender, region, move_in_period,
                       stay_duration_months, created_at
                FROM profiles
                ORDER BY created_at DESC
                """
            )
            return [self._profile_from_row(row) for row in cursor.fetchall()]

    def get_profile(self, profile_id: str) -> dict[str, Any] | None:
        with self._cursor(row_factory="dict") as cursor:
            cursor.execute(
                """
                SELECT profile_id, nickname, age, gender, region, move_in_period,
                       stay_duration_months, created_at
                FROM profiles
                WHERE profile_id = %s
                """,
                (profile_id,),
            )
            row = cursor.fetchone()
            return self._profile_from_row(row) if row is not None else None

    def save_profile_interview(self, profile_id: str, interview: dict[str, Any]) -> None:
        with self._cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO profile_interviews (profile_id, payload, updated_at)
                VALUES (%s, %s::jsonb, %s)
                ON CONFLICT (profile_id) DO UPDATE SET
                    payload = EXCLUDED.payload,
                    updated_at = EXCLUDED.updated_at
                """,
                (
                    profile_id,
                    json.dumps(interview, ensure_ascii=False),
                    interview["updated_at"],
                ),
            )

    def get_profile_interview(self, profile_id: str) -> dict[str, Any] | None:
        with self._cursor(row_factory="dict") as cursor:
            cursor.execute(
                "SELECT payload FROM profile_interviews WHERE profile_id = %s",
                (profile_id,),
            )
            row = cursor.fetchone()
            return deepcopy(row["payload"]) if row is not None else None

    def list_profile_interviews(self) -> dict[str, dict[str, Any]]:
        with self._cursor(row_factory="dict") as cursor:
            cursor.execute("SELECT profile_id, payload FROM profile_interviews")
            rows = cursor.fetchall()
            return {row["profile_id"]: deepcopy(row["payload"]) for row in rows}

    def save_profile_recommendations(
        self,
        profile_id: str,
        recommendations: dict[str, Any],
    ) -> None:
        with self._cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO profile_recommendations (profile_id, payload, updated_at)
                VALUES (%s, %s::jsonb, %s)
                ON CONFLICT (profile_id) DO UPDATE SET
                    payload = EXCLUDED.payload,
                    updated_at = EXCLUDED.updated_at
                """,
                (
                    profile_id,
                    json.dumps(recommendations, ensure_ascii=False),
                    recommendations["recommended_at"],
                ),
            )

    def get_profile_recommendations(self, profile_id: str) -> dict[str, Any] | None:
        with self._cursor(row_factory="dict") as cursor:
            cursor.execute(
                "SELECT payload FROM profile_recommendations WHERE profile_id = %s",
                (profile_id,),
            )
            row = cursor.fetchone()
            return deepcopy(row["payload"]) if row is not None else None

    def save_session(self, session: dict[str, Any]) -> None:
        with self._cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO sessions (
                    session_id, session_name, student_count, preset_id, status, payload, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s)
                ON CONFLICT (session_id) DO UPDATE SET
                    session_name = EXCLUDED.session_name,
                    student_count = EXCLUDED.student_count,
                    preset_id = EXCLUDED.preset_id,
                    status = EXCLUDED.status,
                    payload = EXCLUDED.payload
                """,
                (
                    session["session_id"],
                    session["session_name"],
                    session["student_count"],
                    session.get("preset_id", "default"),
                    session.get("status", "created"),
                    json.dumps(session, ensure_ascii=False),
                    datetime.now(UTC).isoformat(),
                ),
            )

    def get_session(self, session_id: str) -> dict[str, Any] | None:
        with self._cursor(row_factory="dict") as cursor:
            cursor.execute(
                "SELECT payload, status FROM sessions WHERE session_id = %s",
                (session_id,),
            )
            row = cursor.fetchone()
            if row is None:
                return None
            payload = deepcopy(row["payload"])
            payload["status"] = row["status"]
            return payload

    def save_result(self, session_id: str, result: dict[str, Any]) -> None:
        with self._cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO match_results (session_id, status, payload, updated_at)
                VALUES (%s, %s, %s::jsonb, %s)
                ON CONFLICT (session_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    payload = EXCLUDED.payload,
                    updated_at = EXCLUDED.updated_at
                """,
                (
                    session_id,
                    result.get("status", "ok"),
                    json.dumps(result, ensure_ascii=False),
                    datetime.now(UTC).isoformat(),
                ),
            )
            cursor.execute(
                "UPDATE sessions SET status = %s WHERE session_id = %s",
                (result.get("status", "ok"), session_id),
            )

    def get_result(self, session_id: str) -> dict[str, Any] | None:
        with self._cursor(row_factory="dict") as cursor:
            cursor.execute(
                "SELECT payload FROM match_results WHERE session_id = %s",
                (session_id,),
            )
            row = cursor.fetchone()
            return deepcopy(row["payload"]) if row is not None else None

    def save_chat_room(self, room: dict[str, Any]) -> None:
        with self._cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO chat_rooms (
                    room_id, participant_a_profile_id, participant_b_profile_id, payload,
                    created_at, updated_at
                )
                VALUES (%s, %s, %s, %s::jsonb, %s, %s)
                ON CONFLICT (room_id) DO UPDATE SET
                    payload = EXCLUDED.payload,
                    updated_at = EXCLUDED.updated_at
                """,
                (
                    room["room_id"],
                    room["participant_a_profile_id"],
                    room["participant_b_profile_id"],
                    json.dumps(room, ensure_ascii=False),
                    room["created_at"],
                    room["updated_at"],
                ),
            )

    def find_chat_room(self, participant_a: str, participant_b: str) -> dict[str, Any] | None:
        with self._cursor(row_factory="dict") as cursor:
            cursor.execute(
                """
                SELECT payload
                FROM chat_rooms
                WHERE participant_a_profile_id = %s AND participant_b_profile_id = %s
                """,
                (participant_a, participant_b),
            )
            row = cursor.fetchone()
            return deepcopy(row["payload"]) if row is not None else None

    def get_chat_room(self, room_id: str) -> dict[str, Any] | None:
        with self._cursor(row_factory="dict") as cursor:
            cursor.execute(
                "SELECT payload FROM chat_rooms WHERE room_id = %s",
                (room_id,),
            )
            row = cursor.fetchone()
            return deepcopy(row["payload"]) if row is not None else None

    def save_match_request(self, request: dict[str, Any]) -> None:
        with self._cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO match_requests (
                    request_id, participant_a_profile_id, participant_b_profile_id,
                    requester_profile_id, target_profile_id, status, payload,
                    created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s)
                ON CONFLICT (participant_a_profile_id, participant_b_profile_id) DO UPDATE SET
                    requester_profile_id = EXCLUDED.requester_profile_id,
                    target_profile_id = EXCLUDED.target_profile_id,
                    status = EXCLUDED.status,
                    payload = EXCLUDED.payload,
                    updated_at = EXCLUDED.updated_at
                """,
                (
                    request["request_id"],
                    request["participant_a_profile_id"],
                    request["participant_b_profile_id"],
                    request["requester_profile_id"],
                    request["target_profile_id"],
                    request["status"],
                    json.dumps(request, ensure_ascii=False),
                    request["created_at"],
                    request["updated_at"],
                ),
            )

    def find_match_request(self, participant_a: str, participant_b: str) -> dict[str, Any] | None:
        with self._cursor(row_factory="dict") as cursor:
            cursor.execute(
                """
                SELECT payload
                FROM match_requests
                WHERE participant_a_profile_id = %s AND participant_b_profile_id = %s
                """,
                (participant_a, participant_b),
            )
            row = cursor.fetchone()
            return deepcopy(row["payload"]) if row is not None else None

    def get_match_request(self, request_id: str) -> dict[str, Any] | None:
        with self._cursor(row_factory="dict") as cursor:
            cursor.execute(
                "SELECT payload FROM match_requests WHERE request_id = %s",
                (request_id,),
            )
            row = cursor.fetchone()
            return deepcopy(row["payload"]) if row is not None else None

    def list_match_requests_for_profile(self, profile_id: str) -> list[dict[str, Any]]:
        with self._cursor(row_factory="dict") as cursor:
            cursor.execute(
                """
                SELECT payload
                FROM match_requests
                WHERE participant_a_profile_id = %s OR participant_b_profile_id = %s
                """,
                (profile_id, profile_id),
            )
            rows = cursor.fetchall()
            return [deepcopy(row["payload"]) for row in rows]

    def save_chat_message(self, room_id: str, message: dict[str, Any]) -> None:
        with self._cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO chat_messages (
                    message_id, room_id, sender_profile_id, payload, created_at
                )
                VALUES (%s, %s, %s, %s::jsonb, %s)
                """,
                (
                    message["message_id"],
                    room_id,
                    message["sender_profile_id"],
                    json.dumps(message, ensure_ascii=False),
                    message["sent_at"],
                ),
            )
            cursor.execute(
                """
                UPDATE chat_rooms
                SET updated_at = %s,
                    payload = jsonb_set(payload, '{updated_at}', to_jsonb(%s::text), true)
                WHERE room_id = %s
                """,
                (message["sent_at"], message["sent_at"], room_id),
            )

    def list_chat_messages(self, room_id: str) -> list[dict[str, Any]]:
        with self._cursor(row_factory="dict") as cursor:
            cursor.execute(
                """
                SELECT payload
                FROM chat_messages
                WHERE room_id = %s
                ORDER BY created_at ASC, message_id ASC
                """,
                (room_id,),
            )
            rows = cursor.fetchall()
            return [deepcopy(row["payload"]) for row in rows]

    def save_roommate_pact(self, room_id: str, pact: dict[str, Any]) -> None:
        with self._cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO roommate_pacts (
                    room_id, participant_a_profile_id, participant_b_profile_id, payload,
                    generated_at, updated_at
                )
                VALUES (%s, %s, %s, %s::jsonb, %s, %s)
                ON CONFLICT (room_id) DO UPDATE SET
                    payload = EXCLUDED.payload,
                    generated_at = EXCLUDED.generated_at,
                    updated_at = EXCLUDED.updated_at
                """,
                (
                    room_id,
                    pact["participant_a_profile_id"],
                    pact["participant_b_profile_id"],
                    json.dumps(pact, ensure_ascii=False),
                    pact["generated_at"],
                    pact["updated_at"],
                ),
            )

    def get_roommate_pact(self, room_id: str) -> dict[str, Any] | None:
        with self._cursor(row_factory="dict") as cursor:
            cursor.execute(
                "SELECT payload FROM roommate_pacts WHERE room_id = %s",
                (room_id,),
            )
            row = cursor.fetchone()
            return deepcopy(row["payload"]) if row is not None else None

    @contextmanager
    def _cursor(self, row_factory: str | None = None) -> Iterator[Any]:
        try:
            import psycopg
            from psycopg.rows import dict_row
        except ImportError as exc:  # pragma: no cover
            raise RuntimeError("psycopg_not_installed") from exc

        with psycopg.connect(self._conninfo, autocommit=True) as connection:
            if row_factory == "dict":
                with connection.cursor(row_factory=dict_row) as cursor:
                    yield cursor
            else:
                with connection.cursor() as cursor:
                    yield cursor

    @staticmethod
    def _profile_from_row(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "profile_id": row["profile_id"],
            "nickname": row["nickname"],
            "age": row["age"],
            "gender": row["gender"],
            "region": row["region"],
            "move_in_period": row["move_in_period"],
            "stay_duration_months": row["stay_duration_months"],
            "created_at": row["created_at"].isoformat(),
        }


_storage_backend: StorageBackend | None = None
_storage_key: tuple[str, ...] | None = None


def get_storage_backend() -> StorageBackend:
    global _storage_backend, _storage_key

    backend_name = os.getenv("ROOMPACT_STORAGE_BACKEND", "local").lower()
    local_path = os.getenv("ROOMPACT_LOCAL_STORE_PATH", "data/roompact_store.json")
    table_name = os.getenv("ROOMPACT_DDB_TABLE", "")
    pg_host = os.getenv("ROOMPACT_POSTGRES_HOST", "127.0.0.1")
    pg_port = os.getenv("ROOMPACT_POSTGRES_PORT", "5432")
    pg_db = os.getenv("ROOMPACT_POSTGRES_DB", "roompact_campus")
    pg_user = os.getenv("ROOMPACT_POSTGRES_USER", "roompact")
    pg_password = os.getenv("ROOMPACT_POSTGRES_PASSWORD", "roompact2026")
    cache_key = (
        backend_name,
        local_path,
        table_name,
        pg_host,
        pg_port,
        pg_db,
        pg_user,
    )

    if _storage_backend is not None and _storage_key == cache_key:
        return _storage_backend

    if backend_name == "dynamodb":
        if not table_name:
            raise RuntimeError("missing_dynamodb_table")
        _storage_backend = DynamoDbStorage(
            table_name=table_name,
            region_name=os.getenv("AWS_REGION"),
        )
    elif backend_name == "postgres":
        _storage_backend = PostgresStorage(
            host=pg_host,
            port=int(pg_port),
            dbname=pg_db,
            user=pg_user,
            password=pg_password,
        )
    else:
        _storage_backend = LocalJsonStorage(Path(local_path))

    _storage_key = cache_key
    return _storage_backend


def reset_storage_backend() -> None:
    global _storage_backend, _storage_key
    _storage_backend = None
    _storage_key = None
