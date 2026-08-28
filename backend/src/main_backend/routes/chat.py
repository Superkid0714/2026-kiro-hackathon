from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel, Field

from main_backend.services.chat_service import ChatServiceError, chat_service

router = APIRouter(tags=["chat"])
profiles_router = APIRouter(prefix="/profiles", tags=["chat"])


class ChatRoomCreateRequest(BaseModel):
    other_profile_id: str = Field(min_length=1, max_length=64)


class MatchRequestAcceptRequest(BaseModel):
    profile_id: str = Field(min_length=1, max_length=64)


class RoommateConfirmationRequest(BaseModel):
    profile_id: str = Field(min_length=1, max_length=64)


class PactUpdateRequest(BaseModel):
    profile_id: str = Field(min_length=1, max_length=64)
    additional_rules: list[str] = Field(default_factory=list, max_length=5)


class PactSignatureRequest(BaseModel):
    profile_id: str = Field(min_length=1, max_length=64)
    signer_name: str = Field(min_length=1, max_length=40)
    signature_data_url: str = Field(min_length=20)
    agreed: bool


class ChatRoomReadRequest(BaseModel):
    profile_id: str = Field(min_length=1, max_length=64)


@profiles_router.post("/{profile_id}/match-requests", status_code=status.HTTP_201_CREATED)
def create_match_request(profile_id: str, payload: ChatRoomCreateRequest) -> dict[str, object]:
    try:
        request = chat_service.create_or_get_match_request(profile_id, payload.other_profile_id)
    except ChatServiceError as exc:
        if exc.code == "profile_not_found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.code) from exc
        if exc.code == "cannot_chat_with_self":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.code) from exc
        if exc.code == "profile_already_roommate_confirmed":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.code) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.code) from exc

    return {"status": request["status"], "match_request": request}


@profiles_router.get("/{profile_id}/match-requests")
def list_match_requests(profile_id: str) -> dict[str, object]:
    try:
        requests = chat_service.list_match_requests(profile_id)
    except ChatServiceError as exc:
        if exc.code == "profile_not_found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.code) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.code) from exc

    return {"status": "ok", "match_requests": requests}


@router.post("/match-requests/{request_id}/accept")
def accept_match_request(request_id: str, payload: MatchRequestAcceptRequest) -> dict[str, object]:
    try:
        request = chat_service.accept_match_request(request_id, payload.profile_id)
    except ChatServiceError as exc:
        if exc.code == "match_request_not_found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.code) from exc
        if exc.code in {"match_request_forbidden", "match_request_acceptor_mismatch"}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=exc.code) from exc
        if exc.code == "profile_already_roommate_confirmed":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.code) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.code) from exc

    return {"status": request["status"], "match_request": request}


@router.post("/match-requests/{request_id}/reject")
def reject_match_request(request_id: str, payload: MatchRequestAcceptRequest) -> dict[str, object]:
    try:
        request = chat_service.reject_match_request(request_id, payload.profile_id)
    except ChatServiceError as exc:
        if exc.code == "match_request_not_found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.code) from exc
        if exc.code in {"match_request_forbidden", "match_request_rejector_mismatch"}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=exc.code) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.code) from exc

    return {"status": request["status"], "match_request": request}


@profiles_router.post("/{profile_id}/chat-rooms", status_code=status.HTTP_201_CREATED)
def create_chat_room(profile_id: str, payload: ChatRoomCreateRequest) -> dict[str, object]:
    try:
        room = chat_service.create_or_get_room(profile_id, payload.other_profile_id)
    except ChatServiceError as exc:
        if exc.code == "profile_not_found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.code) from exc
        if exc.code == "cannot_chat_with_self":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.code) from exc
        if exc.code == "chat_requires_mutual_acceptance":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=exc.code) from exc
        if exc.code == "profile_already_roommate_confirmed":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.code) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.code) from exc

    return {"status": "ready", "room": room}


@router.get("/chat-rooms/{room_id}/messages")
def get_chat_room_messages(room_id: str) -> dict[str, object]:
    room = chat_service.get_room(room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="chat_room_not_found")
    match_status = chat_service.get_room_match_status(room_id) or "pending"
    return {
        "status": "ok",
        "room": room,
        "chat_state": {
            "match_status": match_status,
            "can_send_message": match_status == "accepted",
        },
        "messages": chat_service.list_messages(room_id),
    }


@router.post("/chat-rooms/{room_id}/read")
async def mark_chat_room_as_read(
    room_id: str, payload: ChatRoomReadRequest
) -> dict[str, object]:
    try:
        result = chat_service.mark_room_as_read(room_id, payload.profile_id)
    except ChatServiceError as exc:
        if exc.code == "chat_room_not_found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.code) from exc
        if exc.code == "chat_room_forbidden":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=exc.code) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.code) from exc

    await chat_service.broadcast_inbox_snapshot(payload.profile_id)
    return result


@router.post("/chat-rooms/{room_id}/roommate-confirmation")
async def confirm_roommate(room_id: str, payload: RoommateConfirmationRequest) -> dict[str, object]:
    try:
        result = chat_service.confirm_roommate(room_id, payload.profile_id)
    except ChatServiceError as exc:
        if exc.code == "chat_room_not_found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.code) from exc
        if exc.code == "chat_room_forbidden":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=exc.code) from exc
        if exc.code == "roommate_confirmation_requires_profile_interview":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.code) from exc
        if exc.code == "profile_already_roommate_confirmed":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.code) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.code) from exc

    await chat_service.broadcast_roommate_confirmation(room_id, result)
    return result


@router.get("/chat-rooms/{room_id}/pact")
def get_roommate_pact(
    room_id: str,
    profile_id: str = Query(..., min_length=1),
) -> dict[str, object]:
    try:
        pact = chat_service.get_roommate_pact(room_id, profile_id)
    except ChatServiceError as exc:
        if exc.code == "chat_room_not_found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.code) from exc
        if exc.code == "chat_room_forbidden":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=exc.code) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.code) from exc

    if pact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="roommate_pact_not_found")
    return {"status": "ok", "pact": pact}


@router.get("/chat-rooms/{room_id}/question-suggestions")
def get_chat_question_suggestions(
    room_id: str,
    profile_id: str = Query(..., min_length=1),
) -> dict[str, object]:
    try:
        suggestions = chat_service.get_chat_question_suggestions(room_id, profile_id)
    except ChatServiceError as exc:
        if exc.code == "chat_room_not_found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.code) from exc
        if exc.code == "chat_room_forbidden":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=exc.code) from exc
        if exc.code == "chat_question_requires_profile_interview":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.code) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.code) from exc
    return {"status": "ok", **suggestions}


@router.put("/chat-rooms/{room_id}/pact")
def update_roommate_pact(room_id: str, payload: PactUpdateRequest) -> dict[str, object]:
    try:
        pact = chat_service.update_roommate_pact(
            room_id,
            payload.profile_id,
            payload.additional_rules,
        )
    except ChatServiceError as exc:
        if exc.code in {"chat_room_not_found", "roommate_pact_not_found"}:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.code) from exc
        if exc.code == "chat_room_forbidden":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=exc.code) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.code) from exc
    return {"status": "updated", "pact": pact}


@router.post("/chat-rooms/{room_id}/signatures")
def sign_roommate_pact(room_id: str, payload: PactSignatureRequest) -> dict[str, object]:
    try:
        pact = chat_service.sign_roommate_pact(
            room_id,
            payload.profile_id,
            payload.signer_name,
            payload.signature_data_url,
            payload.agreed,
        )
    except ChatServiceError as exc:
        if exc.code in {"chat_room_not_found", "roommate_pact_not_found"}:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.code) from exc
        if exc.code == "chat_room_forbidden":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=exc.code) from exc
        if exc.code == "signature_agreement_required":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.code) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.code) from exc
    return {"status": "signed", "pact": pact}


@router.websocket("/ws/chat-rooms/{room_id}")
async def chat_room_socket(
    websocket: WebSocket,
    room_id: str,
    profile_id: str = Query(..., min_length=1),
    nickname: str = Query(..., min_length=1, max_length=30),
) -> None:
    room = chat_service.get_room(room_id)
    if room is None:
        await websocket.close(code=4404, reason="chat_room_not_found")
        return

    participants = {
        room["participant_a_profile_id"],
        room["participant_b_profile_id"],
    }
    if profile_id not in participants:
        await websocket.close(code=4403, reason="chat_room_forbidden")
        return

    await chat_service.connect(room_id, profile_id, websocket)
    chat_service.mark_room_as_read(room_id, profile_id)
    await chat_service.broadcast_inbox_snapshot(profile_id)
    await websocket.send_text(
        json.dumps({"type": "connected", "room_id": room_id}, ensure_ascii=False)
    )

    try:
        while True:
            raw_message = await websocket.receive_text()
            try:
                payload = json.loads(raw_message)
            except json.JSONDecodeError:
                await websocket.send_text(
                    json.dumps({"type": "error", "detail": "invalid_json"}, ensure_ascii=False)
                )
                continue

            if payload.get("type") != "send_message":
                await websocket.send_text(
                    json.dumps(
                        {"type": "error", "detail": "unsupported_message_type"},
                        ensure_ascii=False,
                    )
                )
                continue

            try:
                message = chat_service.build_message(
                    room_id=room_id,
                    sender_profile_id=profile_id,
                    sender_nickname=nickname,
                    text=str(payload.get("text", "")),
                )
            except ChatServiceError as exc:
                await websocket.send_text(
                    json.dumps({"type": "error", "detail": exc.code}, ensure_ascii=False)
                )
                continue

            await chat_service.broadcast_message(room_id, message)
    except WebSocketDisconnect:
        await chat_service.disconnect(room_id, profile_id, websocket)


@router.websocket("/ws/profiles/{profile_id}/inbox")
async def chat_inbox_socket(websocket: WebSocket, profile_id: str) -> None:
    from main_backend.services.storage import get_storage_backend

    if get_storage_backend().get_profile(profile_id) is None:
        await websocket.close(code=4404, reason="profile_not_found")
        return

    await chat_service.connect_inbox(profile_id, websocket)
    await websocket.send_text(
        json.dumps(chat_service.build_inbox_snapshot(profile_id), ensure_ascii=False)
    )

    try:
        while True:
            raw_message = await websocket.receive_text()
            try:
                payload = json.loads(raw_message)
            except json.JSONDecodeError:
                await websocket.send_text(
                    json.dumps({"type": "error", "detail": "invalid_json"}, ensure_ascii=False)
                )
                continue

            if payload.get("type") == "ping":
                await websocket.send_text(
                    json.dumps({"type": "pong"}, ensure_ascii=False)
                )
                continue

            if payload.get("type") == "sync":
                await websocket.send_text(
                    json.dumps(chat_service.build_inbox_snapshot(profile_id), ensure_ascii=False)
                )
                continue

            await websocket.send_text(
                json.dumps(
                    {"type": "error", "detail": "unsupported_message_type"},
                    ensure_ascii=False,
                )
            )
    except WebSocketDisconnect:
        await chat_service.disconnect_inbox(profile_id, websocket)
