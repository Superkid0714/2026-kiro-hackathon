from __future__ import annotations

from copy import deepcopy
from os import getenv
from typing import Any
from uuid import uuid4

from main_backend.services.ai_backend_client import AIBackendClient, AIBackendClientError
from main_backend.services.storage import get_storage_backend


class SessionNotFoundError(Exception):
    pass


class SessionService:
    def __init__(self) -> None:
        self._ai_client = AIBackendClient(getenv("AI_BACKEND_BASE_URL", "http://127.0.0.1:8001"))

    def create_session(self, payload: dict[str, Any]) -> dict[str, Any]:
        session_id = f"session-{uuid4().hex[:8]}"
        session = {
            "session_id": session_id,
            "session_name": payload["session_name"],
            "student_count": len(payload["students"]),
            "students": payload["students"],
            "preset_id": payload.get("preset_id", "default"),
            "status": "created",
        }
        get_storage_backend().save_session(session)
        return deepcopy(session)

    def get_session(self, session_id: str) -> dict[str, Any] | None:
        session = get_storage_backend().get_session(session_id)
        return deepcopy(session) if session is not None else None

    def get_result(self, session_id: str) -> dict[str, Any] | None:
        result = get_storage_backend().get_result(session_id)
        return deepcopy(result) if result is not None else None

    async def run_matching(self, session_id: str) -> dict[str, Any]:
        session = self.get_session(session_id)
        if session is None:
            raise SessionNotFoundError(session_id)

        try:
            result = await self._ai_client.match_session(session)
        except AIBackendClientError as exc:
            return {
                "status": "error",
                "session_id": session_id,
                "matches": [],
                "errors": [{"code": exc.code, "message": exc.message}],
            }

        get_storage_backend().save_result(session_id, result)
        return deepcopy(result)

    def set_ai_client(self, ai_client: AIBackendClient) -> None:
        self._ai_client = ai_client


session_service = SessionService()
