from __future__ import annotations

import json
import os
import tempfile
import threading
from copy import deepcopy
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Protocol


class StorageBackend(Protocol):
    def save_profile(self, profile: dict[str, Any]) -> None: ...

    def list_profiles(self) -> list[dict[str, Any]]: ...

    def get_profile(self, profile_id: str) -> dict[str, Any] | None: ...

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
            return {"profiles": {}, "sessions": {}, "results": {}}

        with self.path.open("r", encoding="utf-8") as handle:
            content = json.load(handle)

        return {
            "profiles": content.get("profiles", {}),
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


_storage_backend: StorageBackend | None = None
_storage_key: tuple[str, str, str] | None = None


def get_storage_backend() -> StorageBackend:
    global _storage_backend, _storage_key

    backend_name = os.getenv("ROOMPACT_STORAGE_BACKEND", "local").lower()
    local_path = os.getenv("ROOMPACT_LOCAL_STORE_PATH", "data/roompact_store.json")
    table_name = os.getenv("ROOMPACT_DDB_TABLE", "")
    cache_key = (backend_name, local_path, table_name)

    if _storage_backend is not None and _storage_key == cache_key:
        return _storage_backend

    if backend_name == "dynamodb":
        if not table_name:
            raise RuntimeError("missing_dynamodb_table")
        _storage_backend = DynamoDbStorage(
            table_name=table_name,
            region_name=os.getenv("AWS_REGION"),
        )
    else:
        _storage_backend = LocalJsonStorage(Path(local_path))

    _storage_key = cache_key
    return _storage_backend


def reset_storage_backend() -> None:
    global _storage_backend, _storage_key
    _storage_backend = None
    _storage_key = None
