from __future__ import annotations

import asyncio
import json
from collections import defaultdict
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import WebSocket

from main_backend.services.storage import get_storage_backend


class ChatServiceError(Exception):
    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


class ChatService:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    def create_or_get_match_request(
        self, profile_id: str, other_profile_id: str
    ) -> dict[str, Any]:
        if profile_id == other_profile_id:
            raise ChatServiceError("cannot_chat_with_self")

        storage = get_storage_backend()
        profile = storage.get_profile(profile_id)
        other_profile = storage.get_profile(other_profile_id)
        if profile is None or other_profile is None:
            raise ChatServiceError("profile_not_found")

        participant_a, participant_b = sorted([profile_id, other_profile_id])
        existing = storage.find_match_request(participant_a, participant_b)
        if existing is not None:
            return deepcopy(existing)

        now = datetime.now(UTC).isoformat()
        request = {
            "request_id": f"match-{uuid4().hex[:10]}",
            "participant_a_profile_id": participant_a,
            "participant_b_profile_id": participant_b,
            "requester_profile_id": profile_id,
            "target_profile_id": other_profile_id,
            "status": "pending",
            "requester_accepted": True,
            "target_accepted": False,
            "created_at": now,
            "updated_at": now,
        }
        storage.save_match_request(request)
        return deepcopy(request)

    def accept_match_request(self, request_id: str, profile_id: str) -> dict[str, Any]:
        storage = get_storage_backend()
        request = storage.get_match_request(request_id)
        if request is None:
            raise ChatServiceError("match_request_not_found")

        participants = {
            request["participant_a_profile_id"],
            request["participant_b_profile_id"],
        }
        if profile_id not in participants:
            raise ChatServiceError("match_request_forbidden")
        if profile_id != request["target_profile_id"] and not request["target_accepted"]:
            raise ChatServiceError("match_request_acceptor_mismatch")

        if request["status"] == "accepted":
            return deepcopy(request)

        now = datetime.now(UTC).isoformat()
        request["target_accepted"] = True
        request["status"] = "accepted"
        request["accepted_by_profile_id"] = profile_id
        request["accepted_at"] = now
        request["updated_at"] = now
        storage.save_match_request(request)
        return deepcopy(request)

    def get_match_request_between(self, profile_id: str, other_profile_id: str) -> dict[str, Any] | None:
        participant_a, participant_b = sorted([profile_id, other_profile_id])
        request = get_storage_backend().find_match_request(participant_a, participant_b)
        return deepcopy(request) if request is not None else None

    def create_or_get_room(self, profile_id: str, other_profile_id: str) -> dict[str, Any]:
        if profile_id == other_profile_id:
            raise ChatServiceError("cannot_chat_with_self")

        storage = get_storage_backend()
        profile = storage.get_profile(profile_id)
        other_profile = storage.get_profile(other_profile_id)
        if profile is None or other_profile is None:
            raise ChatServiceError("profile_not_found")

        participant_a, participant_b = sorted([profile_id, other_profile_id])
        request = storage.find_match_request(participant_a, participant_b)
        if request is None or request.get("status") != "accepted":
            raise ChatServiceError("chat_requires_mutual_acceptance")

        room = storage.find_chat_room(participant_a, participant_b)
        if room is not None:
            return deepcopy(room)

        now = datetime.now(UTC).isoformat()
        room = {
            "room_id": f"room-{uuid4().hex[:10]}",
            "participant_a_profile_id": participant_a,
            "participant_b_profile_id": participant_b,
            "participants": [
                {
                    "profile_id": profile["profile_id"],
                    "nickname": profile["nickname"],
                    "gender": profile["gender"],
                    "region": profile["region"],
                },
                {
                    "profile_id": other_profile["profile_id"],
                    "nickname": other_profile["nickname"],
                    "gender": other_profile["gender"],
                    "region": other_profile["region"],
                },
            ],
            "created_at": now,
            "updated_at": now,
        }
        room["participants"].sort(key=lambda item: item["profile_id"])
        storage.save_chat_room(room)
        return deepcopy(room)

    def get_room(self, room_id: str) -> dict[str, Any] | None:
        room = get_storage_backend().get_chat_room(room_id)
        return deepcopy(room) if room is not None else None

    def list_messages(self, room_id: str) -> list[dict[str, Any]]:
        return deepcopy(get_storage_backend().list_chat_messages(room_id))

    def build_message(
        self,
        room_id: str,
        sender_profile_id: str,
        sender_nickname: str,
        text: str,
    ) -> dict[str, Any]:
        room = self.get_room(room_id)
        if room is None:
            raise ChatServiceError("chat_room_not_found")
        if sender_profile_id not in {
            room["participant_a_profile_id"],
            room["participant_b_profile_id"],
        }:
            raise ChatServiceError("chat_room_forbidden")

        normalized_text = text.strip()
        if not normalized_text:
            raise ChatServiceError("message_text_required")

        message = {
            "message_id": f"msg-{uuid4().hex[:12]}",
            "room_id": room_id,
            "sender_profile_id": sender_profile_id,
            "sender_nickname": sender_nickname,
            "text": normalized_text,
            "sent_at": datetime.now(UTC).isoformat(),
        }
        get_storage_backend().save_chat_message(room_id, message)
        return deepcopy(message)

    async def connect(self, room_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[room_id].add(websocket)

    async def disconnect(self, room_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            connections = self._connections.get(room_id)
            if connections is None:
                return
            connections.discard(websocket)
            if not connections:
                self._connections.pop(room_id, None)

    async def broadcast_message(self, room_id: str, message: dict[str, Any]) -> None:
        payload = json.dumps({"type": "message", "message": message}, ensure_ascii=False)
        async with self._lock:
            recipients = list(self._connections.get(room_id, set()))

        stale: list[WebSocket] = []
        for websocket in recipients:
            try:
                await websocket.send_text(payload)
            except RuntimeError:
                stale.append(websocket)

        for websocket in stale:
            await self.disconnect(room_id, websocket)


chat_service = ChatService()
