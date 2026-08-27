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
    def save_profile(self, profile: dict[str, Any]) -> None: ...

    def list_profiles(self) -> list[dict[str, Any]]: ...

    def get_profile(self, profile_id: str) -> dict[str, Any] | None: ...

    def save_profile_interview(self, profile_id: str, interview: dict[str, Any]) -> None: ...

    def get_profile_interview(self, profile_id: str) -> dict[str, Any] | None: ...

    def save_session(self, session: dict[str, Any]) -> None: ...

    def get_session(self, session_id: str) -> dict[str, Any] | None: ...

    def save_result(self, session_id: str, result: dict[str, Any]) -> None: ...

    def get_result(self, session_id: str) -> dict[str, Any] | None: ...


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

    def _read(self) -> dict[str, dict[str, Any]]:
        if not self.path.exists():
            return {"profiles": {}, "interviews": {}, "sessions": {}, "results": {}}

        with self.path.open("r", encoding="utf-8") as handle:
            content = json.load(handle)

        return {
            "profiles": content.get("profiles", {}),
            "interviews": content.get("interviews", {}),
            "sessions": content.get("sessions", {}),
            "results": content.get("results", {}),
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
