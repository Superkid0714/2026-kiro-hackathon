from __future__ import annotations

import asyncio
import json
from collections import defaultdict
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import WebSocket

from ai_backend.pact import generate_roommate_pact
from main_backend.services.storage import get_storage_backend


class ChatServiceError(Exception):
    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


class ChatService:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    @staticmethod
    def _ensure_roommate_confirmation(room: dict[str, Any]) -> dict[str, Any]:
        confirmation = room.get("roommate_confirmation") or {}
        participant_a_profile_id = room["participant_a_profile_id"]
        participant_b_profile_id = room["participant_b_profile_id"]
        participant_a_confirmed_at = confirmation.get("participant_a_confirmed_at")
        participant_b_confirmed_at = confirmation.get("participant_b_confirmed_at")

        if participant_a_confirmed_at and participant_b_confirmed_at:
            status = "confirmed"
            pending_for_profile_id = None
            confirmed_profile_ids = [participant_a_profile_id, participant_b_profile_id]
            confirmed_at = room.get("roommate_confirmed_at") or max(
                participant_a_confirmed_at,
                participant_b_confirmed_at,
            )
        elif participant_a_confirmed_at or participant_b_confirmed_at:
            status = "pending"
            pending_for_profile_id = (
                participant_b_profile_id
                if participant_a_confirmed_at
                else participant_a_profile_id
            )
            confirmed_profile_ids = [
                profile_id
                for profile_id, timestamp in (
                    (participant_a_profile_id, participant_a_confirmed_at),
                    (participant_b_profile_id, participant_b_confirmed_at),
                )
                if timestamp
            ]
            confirmed_at = None
        else:
            status = "idle"
            pending_for_profile_id = None
            confirmed_profile_ids = []
            confirmed_at = None

        normalized = {
            "status": status,
            "requested_by_profile_id": confirmation.get("requested_by_profile_id"),
            "pending_for_profile_id": pending_for_profile_id,
            "participant_a_confirmed_at": participant_a_confirmed_at,
            "participant_b_confirmed_at": participant_b_confirmed_at,
            "confirmed_profile_ids": confirmed_profile_ids,
            "confirmed_at": confirmed_at,
        }
        room["roommate_confirmation"] = normalized
        return normalized

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

    def list_match_requests(self, profile_id: str) -> list[dict[str, Any]]:
        storage = get_storage_backend()
        if storage.get_profile(profile_id) is None:
            raise ChatServiceError("profile_not_found")

        requests = storage.list_match_requests_for_profile(profile_id)
        enriched: list[dict[str, Any]] = []
        for request in requests:
            peer_id = (
                request["target_profile_id"]
                if request["requester_profile_id"] == profile_id
                else request["requester_profile_id"]
            )
            peer_profile = storage.get_profile(peer_id)
            room_id = None
            if request["status"] == "accepted":
                room = storage.find_chat_room(
                    request["participant_a_profile_id"],
                    request["participant_b_profile_id"],
                )
                room_id = room["room_id"] if room is not None else None

            enriched.append(
                {
                    **deepcopy(request),
                    "peer_profile_id": peer_id,
                    "peer_nickname": peer_profile["nickname"] if peer_profile else None,
                    "peer_region": peer_profile["region"] if peer_profile else None,
                    "room_id": room_id,
                }
            )

        enriched.sort(key=lambda item: item.get("updated_at") or "", reverse=True)
        return enriched

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
        self._ensure_roommate_confirmation(room)
        storage.save_chat_room(room)
        return deepcopy(room)

    def get_room(self, room_id: str) -> dict[str, Any] | None:
        room = get_storage_backend().get_chat_room(room_id)
        if room is None:
            return None
        self._ensure_roommate_confirmation(room)
        return deepcopy(room)

    def confirm_roommate(self, room_id: str, profile_id: str) -> dict[str, Any]:
        storage = get_storage_backend()
        room = storage.get_chat_room(room_id)
        if room is None:
            raise ChatServiceError("chat_room_not_found")

        participants = {
            room["participant_a_profile_id"],
            room["participant_b_profile_id"],
        }
        if profile_id not in participants:
            raise ChatServiceError("chat_room_forbidden")

        confirmation = self._ensure_roommate_confirmation(room)

        profile_a = storage.get_profile(room["participant_a_profile_id"])
        profile_b = storage.get_profile(room["participant_b_profile_id"])
        interview_a_record = storage.get_profile_interview(room["participant_a_profile_id"])
        interview_b_record = storage.get_profile_interview(room["participant_b_profile_id"])
        if (
            profile_a is None
            or profile_b is None
            or interview_a_record is None
            or interview_b_record is None
        ):
            raise ChatServiceError("roommate_confirmation_requires_profile_interview")

        if confirmation["status"] == "confirmed":
            existing = storage.get_roommate_pact(room_id)
            if existing is not None:
                return {
                    "status": "confirmed",
                    "room": deepcopy(room),
                    "pact": deepcopy(existing),
                }

        now = datetime.now(UTC).isoformat()
        if profile_id == room["participant_a_profile_id"]:
            confirmation["participant_a_confirmed_at"] = (
                confirmation["participant_a_confirmed_at"] or now
            )
        else:
            confirmation["participant_b_confirmed_at"] = (
                confirmation["participant_b_confirmed_at"] or now
            )
        confirmation["requested_by_profile_id"] = profile_id
        self._ensure_roommate_confirmation(room)

        if room["roommate_confirmation"]["status"] != "confirmed":
            room["updated_at"] = now
            storage.save_chat_room(room)
            return {
                "status": "pending",
                "room": deepcopy(room),
                "pending_for_profile_id": room["roommate_confirmation"]["pending_for_profile_id"],
            }

        confirmed_at = room["roommate_confirmation"]["confirmed_at"] or now
        room["roommate_confirmed_at"] = confirmed_at
        room["roommate_confirmed_by_profile_id"] = profile_id
        room["updated_at"] = confirmed_at
        storage.save_chat_room(room)

        pact = generate_roommate_pact(
            room_id=room_id,
            profile_a=profile_a,
            profile_b=profile_b,
            interview_a=interview_a_record["interview"],
            interview_b=interview_b_record["interview"],
            character_a=interview_a_record.get("character", {}),
            character_b=interview_b_record.get("character", {}),
        )

        storage.save_roommate_pact(room_id, pact)
        return {
            "status": "confirmed",
            "room": deepcopy(room),
            "pact": deepcopy(pact),
        }

    def get_roommate_pact(self, room_id: str, profile_id: str) -> dict[str, Any] | None:
        room = self.get_room(room_id)
        if room is None:
            raise ChatServiceError("chat_room_not_found")
        if profile_id not in {
            room["participant_a_profile_id"],
            room["participant_b_profile_id"],
        }:
            raise ChatServiceError("chat_room_forbidden")
        pact = get_storage_backend().get_roommate_pact(room_id)
        return deepcopy(pact) if pact is not None else None

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

    async def broadcast_roommate_confirmation(
        self,
        room_id: str,
        payload: dict[str, Any],
    ) -> None:
        envelope = json.dumps(
            {"type": "roommate_confirmation", **payload},
            ensure_ascii=False,
        )
        async with self._lock:
            recipients = list(self._connections.get(room_id, set()))

        stale: list[WebSocket] = []
        for websocket in recipients:
            try:
                await websocket.send_text(envelope)
            except RuntimeError:
                stale.append(websocket)

        for websocket in stale:
            await self.disconnect(room_id, websocket)


chat_service = ChatService()
