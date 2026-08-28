from __future__ import annotations

import asyncio
import json
from collections import defaultdict
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import WebSocket

from ai_backend.negotiate import generate_chat_question_suggestions
from ai_backend.pact import generate_roommate_pact
from main_backend.services.storage import get_storage_backend


class ChatServiceError(Exception):
    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


class ChatService:
    def __init__(self) -> None:
        self._connections: dict[str, dict[str, set[WebSocket]]] = defaultdict(
            lambda: defaultdict(set)
        )
        self._inbox_connections: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    @staticmethod
    def _participant_payload(profile: dict[str, Any]) -> dict[str, Any]:
        interview = get_storage_backend().get_profile_interview(profile["profile_id"]) or {}
        character = interview.get("character") or {}
        return {
            "profile_id": profile["profile_id"],
            "nickname": profile["nickname"],
            "gender": profile["gender"],
            "region": profile["region"],
            "character": {
                "type_code": character.get("type_code"),
                "type_name": character.get("type_name"),
            },
        }

    def _enrich_room_participants(self, room: dict[str, Any]) -> bool:
        storage = get_storage_backend()
        changed = False
        participants: list[dict[str, Any]] = []

        for participant in room.get("participants", []):
            profile_id = participant.get("profile_id")
            profile = storage.get_profile(profile_id) if profile_id else None
            if profile is None:
                participants.append(participant)
                continue

            enriched = self._participant_payload(profile)
            if participant != enriched:
                changed = True
            participants.append(enriched)

        if changed:
            participants.sort(key=lambda item: item["profile_id"])
            room["participants"] = participants

        return changed

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
        self._ensure_not_already_confirmed(profile_id)
        self._ensure_not_already_confirmed(other_profile_id)

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
        self._ensure_not_already_confirmed(request["participant_a_profile_id"])
        self._ensure_not_already_confirmed(request["participant_b_profile_id"])

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

    def reject_match_request(self, request_id: str, profile_id: str) -> dict[str, Any]:
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
        if profile_id != request["target_profile_id"] and request["status"] == "pending":
            raise ChatServiceError("match_request_rejector_mismatch")
        if request["status"] == "accepted":
            raise ChatServiceError("accepted_match_request_cannot_be_rejected")
        if request["status"] == "rejected":
            return deepcopy(request)

        now = datetime.now(UTC).isoformat()
        request["target_accepted"] = False
        request["status"] = "rejected"
        request["rejected_by_profile_id"] = profile_id
        request["rejected_at"] = now
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
            if request["status"] == "accepted" or (
                request["status"] == "pending"
                and request["requester_profile_id"] == profile_id
            ):
                room = storage.find_chat_room(
                    request["participant_a_profile_id"],
                    request["participant_b_profile_id"],
                )
                room_id = room["room_id"] if room is not None else None
            roommate_confirmation = None
            last_message_preview = None
            latest_activity_at = request.get("updated_at")
            if room_id is not None:
                self._ensure_roommate_confirmation(room)
                roommate_confirmation = deepcopy(room.get("roommate_confirmation"))
                messages = storage.list_chat_messages(room_id)
                if messages:
                    last_message_preview = messages[-1].get("text")
                    latest_activity_at = messages[-1].get("sent_at") or latest_activity_at
                elif room is not None:
                    latest_activity_at = room.get("updated_at") or latest_activity_at
            unread_count = 0
            if room_id is not None and request.get("status") == "accepted":
                unread_count = self.get_unread_count(room_id, profile_id)

            enriched.append(
                {
                    **deepcopy(request),
                    "peer_profile_id": peer_id,
                    "peer_nickname": peer_profile["nickname"] if peer_profile else None,
                    "peer_region": peer_profile["region"] if peer_profile else None,
                    "peer_type_code": (
                        storage.get_profile_interview(peer_id) or {}
                    ).get("character", {}).get("type_code"),
                    "peer_type_name": (
                        storage.get_profile_interview(peer_id) or {}
                    ).get("character", {}).get("type_name"),
                    "room_id": room_id,
                    "roommate_confirmation": roommate_confirmation,
                    "last_message_preview": last_message_preview,
                    "unread_count": unread_count,
                    "updated_at": latest_activity_at,
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
        self._ensure_not_already_confirmed(profile_id)
        self._ensure_not_already_confirmed(other_profile_id)

        participant_a, participant_b = sorted([profile_id, other_profile_id])
        request = storage.find_match_request(participant_a, participant_b)
        if request is None:
            raise ChatServiceError("chat_requires_mutual_acceptance")
        if request.get("status") == "rejected":
            raise ChatServiceError("chat_requires_mutual_acceptance")
        if (
            request.get("status") != "accepted"
            and request.get("requester_profile_id") != profile_id
        ):
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
                self._participant_payload(profile),
                self._participant_payload(other_profile),
            ],
            "created_at": now,
            "updated_at": now,
        }
        room["participants"].sort(key=lambda item: item["profile_id"])
        self._ensure_roommate_confirmation(room)
        storage.save_chat_room(room)
        return deepcopy(room)

    def get_room(self, room_id: str) -> dict[str, Any] | None:
        storage = get_storage_backend()
        room = storage.get_chat_room(room_id)
        if room is None:
            return None
        if self._enrich_room_participants(room):
            storage.save_chat_room(room)
        self._ensure_roommate_confirmation(room)
        return deepcopy(room)

    def get_room_match_status(self, room_id: str) -> str | None:
        room = self.get_room(room_id)
        if room is None:
            return None

        request = get_storage_backend().find_match_request(
            room["participant_a_profile_id"],
            room["participant_b_profile_id"],
        )
        if request is None:
            return None
        return str(request.get("status") or "pending")

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

        other_profile_id = (
            room["participant_b_profile_id"]
            if profile_id == room["participant_a_profile_id"]
            else room["participant_a_profile_id"]
        )
        self._ensure_not_already_confirmed(profile_id, except_room_id=room_id)
        self._ensure_not_already_confirmed(other_profile_id, except_room_id=room_id)

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

    @staticmethod
    def _ensure_not_already_confirmed(
        profile_id: str,
        *,
        except_room_id: str | None = None,
    ) -> None:
        confirmed_room = get_storage_backend().find_confirmed_room_for_profile(profile_id)
        if confirmed_room is None:
            return
        if except_room_id and confirmed_room.get("room_id") == except_room_id:
            return
        raise ChatServiceError("profile_already_roommate_confirmed")

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

    def get_chat_question_suggestions(self, room_id: str, profile_id: str) -> dict[str, Any]:
        storage = get_storage_backend()
        room = self.get_room(room_id)
        if room is None:
            raise ChatServiceError("chat_room_not_found")

        participant_ids = {
            room["participant_a_profile_id"],
            room["participant_b_profile_id"],
        }
        if profile_id not in participant_ids:
            raise ChatServiceError("chat_room_forbidden")

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
            raise ChatServiceError("chat_question_requires_profile_interview")

        latest_messages = storage.list_chat_messages(room_id)
        participant_a_profile_id = room["participant_a_profile_id"]
        participant_b_profile_id = room["participant_b_profile_id"]
        peer_profile_id = (
            participant_b_profile_id
            if profile_id == participant_a_profile_id
            else participant_a_profile_id
        )
        current_profile = profile_a if profile_a["profile_id"] == profile_id else profile_b
        peer_profile = profile_a if profile_a["profile_id"] == peer_profile_id else profile_b
        recent_texts = []
        for item in latest_messages[-6:]:
            text = item.get("text", "").strip()
            if not text:
                continue
            speaker_name = (
                current_profile["nickname"]
                if item.get("sender_profile_id") == current_profile["profile_id"]
                else peer_profile["nickname"]
            )
            recent_texts.append(f"{speaker_name}: {text}")
        pair_conflicts = self._build_chat_conflict_summary(
            interview_a_record["interview"],
            interview_b_record["interview"],
        )
        result = generate_chat_question_suggestions(
            pair_label=f"{profile_a['nickname']} & {profile_b['nickname']}",
            conflict_summary=pair_conflicts,
            recent_messages=recent_texts,
            current_speaker_name=current_profile["nickname"],
            other_speaker_name=peer_profile["nickname"],
        )
        return {
            "room_id": room_id,
            "questions": result["questions"],
            "source": result["source"],
            "generated_at": datetime.now(UTC).isoformat(),
        }

    def update_roommate_pact(
        self,
        room_id: str,
        profile_id: str,
        additional_rules: list[str],
    ) -> dict[str, Any]:
        storage = get_storage_backend()
        room = self.get_room(room_id)
        if room is None:
            raise ChatServiceError("chat_room_not_found")
        if profile_id not in {
            room["participant_a_profile_id"],
            room["participant_b_profile_id"],
        }:
            raise ChatServiceError("chat_room_forbidden")

        pact = storage.get_roommate_pact(room_id)
        if pact is None:
            raise ChatServiceError("roommate_pact_not_found")

        custom_rules = pact.get("custom_rules", [])
        existing_texts = {item.get("rule", "").strip() for item in custom_rules}
        for rule in additional_rules:
            value = rule.strip()
            if not value or value in existing_texts:
                continue
            custom_rules.append(
                {
                    "rule_id": f"custom-{uuid4().hex[:10]}",
                    "rule": value,
                    "created_by_profile_id": profile_id,
                    "created_at": datetime.now(UTC).isoformat(),
                }
            )
            existing_texts.add(value)

        pact["custom_rules"] = custom_rules
        pact["updated_at"] = datetime.now(UTC).isoformat()
        storage.save_roommate_pact(room_id, pact)
        return deepcopy(pact)

    def sign_roommate_pact(
        self,
        room_id: str,
        profile_id: str,
        signer_name: str,
        signature_data_url: str,
        agreed: bool,
    ) -> dict[str, Any]:
        storage = get_storage_backend()
        room = self.get_room(room_id)
        if room is None:
            raise ChatServiceError("chat_room_not_found")
        if profile_id not in {
            room["participant_a_profile_id"],
            room["participant_b_profile_id"],
        }:
            raise ChatServiceError("chat_room_forbidden")
        if not agreed:
            raise ChatServiceError("signature_agreement_required")
        if not signer_name.strip():
            raise ChatServiceError("signature_name_required")
        if not signature_data_url.strip().startswith("data:image/"):
            raise ChatServiceError("signature_image_required")

        pact = storage.get_roommate_pact(room_id)
        if pact is None:
            raise ChatServiceError("roommate_pact_not_found")

        signed_at = datetime.now(UTC).isoformat()
        signatures = pact.get("signatures", {})
        signatures[profile_id] = {
            "profile_id": profile_id,
            "signer_name": signer_name.strip(),
            "signature_data_url": signature_data_url.strip(),
            "agreed": True,
            "signed_at": signed_at,
        }
        pact["signatures"] = signatures
        pact["updated_at"] = signed_at
        participant_ids = {
            pact["participant_a_profile_id"],
            pact["participant_b_profile_id"],
        }
        pact["signature_status"] = (
            "completed" if participant_ids.issubset(set(signatures.keys())) else "pending"
        )
        storage.save_roommate_pact(room_id, pact)
        return deepcopy(pact)

    def list_messages(self, room_id: str) -> list[dict[str, Any]]:
        return deepcopy(get_storage_backend().list_chat_messages(room_id))

    def get_unread_count(self, room_id: str, profile_id: str) -> int:
        room = self.get_room(room_id)
        if room is None:
            raise ChatServiceError("chat_room_not_found")
        if profile_id not in {
            room["participant_a_profile_id"],
            room["participant_b_profile_id"],
        }:
            raise ChatServiceError("chat_room_forbidden")
        read_state = get_storage_backend().get_chat_read_state(room_id, profile_id)
        return get_storage_backend().count_unread_messages(
            room_id,
            profile_id,
            read_state.get("last_read_at") if read_state else None,
        )

    def mark_room_as_read(self, room_id: str, profile_id: str) -> dict[str, Any]:
        room = self.get_room(room_id)
        if room is None:
            raise ChatServiceError("chat_room_not_found")
        if profile_id not in {
            room["participant_a_profile_id"],
            room["participant_b_profile_id"],
        }:
            raise ChatServiceError("chat_room_forbidden")

        messages = get_storage_backend().list_chat_messages(room_id)
        latest_message = messages[-1] if messages else None
        read_state = {
            "room_id": room_id,
            "profile_id": profile_id,
            "last_read_message_id": latest_message.get("message_id") if latest_message else None,
            "last_read_at": (
                latest_message.get("sent_at")
                if latest_message
                else datetime.now(UTC).isoformat()
            ),
            "updated_at": datetime.now(UTC).isoformat(),
        }
        get_storage_backend().save_chat_read_state(room_id, profile_id, read_state)
        return {
            "status": "read",
            **deepcopy(read_state),
            "unread_count": 0,
        }

    def build_inbox_snapshot(self, profile_id: str) -> dict[str, Any]:
        items = self.list_match_requests(profile_id)
        notification_count = 0
        for item in items:
            if item.get("target_profile_id") == profile_id and item.get("status") == "pending":
                notification_count += 1
            confirmation = item.get("roommate_confirmation") or {}
            if (
                item.get("status") == "accepted"
                and confirmation.get("status") == "pending"
                and confirmation.get("pending_for_profile_id") == profile_id
            ):
                notification_count += 1
            notification_count += int(item.get("unread_count") or 0)
        return {
            "type": "inbox_snapshot",
            "profile_id": profile_id,
            "notification_count": notification_count,
            "items": items,
            "generated_at": datetime.now(UTC).isoformat(),
        }

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
        if self.get_room_match_status(room_id) != "accepted":
            raise ChatServiceError("chat_message_requires_acceptance")

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

    async def connect(self, room_id: str, profile_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[room_id][profile_id].add(websocket)

    async def disconnect(self, room_id: str, profile_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            by_profile = self._connections.get(room_id)
            if by_profile is None:
                return
            connections = by_profile.get(profile_id)
            if connections is None:
                return
            connections.discard(websocket)
            if not connections:
                by_profile.pop(profile_id, None)
            if not by_profile:
                self._connections.pop(room_id, None)

    async def broadcast_message(self, room_id: str, message: dict[str, Any]) -> None:
        room = self.get_room(room_id)
        if room is not None:
            for profile_id in {
                room["participant_a_profile_id"],
                room["participant_b_profile_id"],
            }:
                if self._is_profile_connected_to_room(room_id, profile_id):
                    self._mark_room_as_read_to_message(room_id, profile_id, message)

        payload = json.dumps({"type": "message", "message": message}, ensure_ascii=False)
        async with self._lock:
            recipients = [
                websocket
                for connections in self._connections.get(room_id, {}).values()
                for websocket in connections
            ]

        stale: list[WebSocket] = []
        for websocket in recipients:
            try:
                await websocket.send_text(payload)
            except RuntimeError:
                stale.append(websocket)

        for websocket in stale:
            await self._disconnect_stale_room_socket(room_id, websocket)

        if room is not None:
            for profile_id in {
                room["participant_a_profile_id"],
                room["participant_b_profile_id"],
            }:
                await self.broadcast_inbox_snapshot(profile_id)

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
            recipients = [
                websocket
                for connections in self._connections.get(room_id, {}).values()
                for websocket in connections
            ]

        stale: list[WebSocket] = []
        for websocket in recipients:
            try:
                await websocket.send_text(envelope)
            except RuntimeError:
                stale.append(websocket)

        for websocket in stale:
            await self._disconnect_stale_room_socket(room_id, websocket)

        room = payload.get("room") or self.get_room(room_id)
        if room is None:
            return

        for profile_id in {
            room["participant_a_profile_id"],
            room["participant_b_profile_id"],
        }:
            await self.broadcast_inbox_snapshot(profile_id)

    async def connect_inbox(self, profile_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._inbox_connections[profile_id].add(websocket)

    async def disconnect_inbox(self, profile_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            connections = self._inbox_connections.get(profile_id)
            if connections is None:
                return
            connections.discard(websocket)
            if not connections:
                self._inbox_connections.pop(profile_id, None)

    async def broadcast_inbox_snapshot(self, profile_id: str) -> None:
        snapshot = self.build_inbox_snapshot(profile_id)
        payload = json.dumps(snapshot, ensure_ascii=False)
        async with self._lock:
            recipients = list(self._inbox_connections.get(profile_id, set()))

        stale: list[WebSocket] = []
        for websocket in recipients:
            try:
                await websocket.send_text(payload)
            except RuntimeError:
                stale.append(websocket)

        for websocket in stale:
            await self.disconnect_inbox(profile_id, websocket)

    def _mark_room_as_read_to_message(
        self,
        room_id: str,
        profile_id: str,
        message: dict[str, Any],
    ) -> None:
        read_state = {
            "room_id": room_id,
            "profile_id": profile_id,
            "last_read_message_id": message.get("message_id"),
            "last_read_at": message.get("sent_at"),
            "updated_at": datetime.now(UTC).isoformat(),
        }
        get_storage_backend().save_chat_read_state(room_id, profile_id, read_state)

    def _is_profile_connected_to_room(self, room_id: str, profile_id: str) -> bool:
        return bool(self._connections.get(room_id, {}).get(profile_id))

    async def _disconnect_stale_room_socket(self, room_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            by_profile = self._connections.get(room_id)
            if by_profile is None:
                return
            empty_profiles: list[str] = []
            for profile_id, connections in by_profile.items():
                if websocket in connections:
                    connections.discard(websocket)
                if not connections:
                    empty_profiles.append(profile_id)
            for profile_id in empty_profiles:
                by_profile.pop(profile_id, None)
            if not by_profile:
                self._connections.pop(room_id, None)

    @staticmethod
    def _build_chat_conflict_summary(
        interview_a: dict[str, Any],
        interview_b: dict[str, Any],
    ) -> list[str]:
        summary: list[str] = []
        if interview_a.get("quiet_hours_start") != interview_b.get("quiet_hours_start"):
            summary.append("조용한 시간 기준")
        if interview_a.get("guest_frequency") != interview_b.get("guest_frequency"):
            summary.append("방문객 허용 빈도")
        if interview_a.get("cleaning_frequency") != interview_b.get("cleaning_frequency"):
            summary.append("청소 빈도")
        if interview_a.get("dishes_deadline") != interview_b.get("dishes_deadline"):
            summary.append("설거지와 정리 마감")
        if interview_a.get("personal_space_access") != interview_b.get("personal_space_access"):
            summary.append("개인 공간 출입 기준")
        if interview_a.get("shared_cost_rule") != interview_b.get("shared_cost_rule"):
            summary.append("공동 생활비 관리 방식")
        if interview_a.get("security_preference") != interview_b.get("security_preference"):
            summary.append("보안 기준")
        if interview_a.get("smokes") != interview_b.get("smokes"):
            summary.append("흡연 기준")

        return summary[:4]


chat_service = ChatService()
