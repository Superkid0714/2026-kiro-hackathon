from __future__ import annotations

from typing import Any
from uuid import uuid4

import httpx


class AIBackendClientError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


class AIBackendClient:
    def __init__(
        self,
        base_url: str,
        *,
        timeout: float = 20.0,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._transport = transport

    async def match_session(self, session: dict[str, Any]) -> dict[str, Any]:
        payload = {
            "request_id": f"req-{uuid4().hex[:10]}",
            "session_id": session["session_id"],
            "session_name": session.get("session_name", ""),
            "students": session["students"],
            "preset_id": session.get("preset_id", "default"),
        }
        try:
            async with httpx.AsyncClient(
                base_url=self._base_url,
                timeout=self._timeout,
                transport=self._transport,
            ) as client:
                response = await client.post("/match", json=payload)
                response.raise_for_status()
        except httpx.ConnectError as exc:
            raise AIBackendClientError("ai_backend_unreachable", str(exc)) from exc
        except httpx.TimeoutException as exc:
            raise AIBackendClientError("ai_backend_timeout", str(exc)) from exc
        except httpx.HTTPStatusError as exc:
            raise AIBackendClientError("ai_backend_http_error", exc.response.text) from exc
        except httpx.RequestError as exc:
            raise AIBackendClientError("ai_backend_request_error", str(exc)) from exc

        return response.json()
