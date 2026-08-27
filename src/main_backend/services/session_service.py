from __future__ import annotations

from copy import deepcopy
from uuid import uuid4


class SessionService:
    def __init__(self) -> None:
        self._sessions: dict[str, dict[str, object]] = {}

    def create_session(self, payload: dict[str, object]) -> dict[str, object]:
        session_id = f"session-{uuid4().hex[:8]}"
        session = {
            "session_id": session_id,
            "session_name": payload["session_name"],
            "student_count": len(payload["students"]),
            "students": payload["students"],
            "status": "created",
        }
        self._sessions[session_id] = deepcopy(session)
        return deepcopy(session)

    def get_session(self, session_id: str) -> dict[str, object] | None:
        session = self._sessions.get(session_id)
        if session is None:
            return None
        return deepcopy(session)


session_service = SessionService()
