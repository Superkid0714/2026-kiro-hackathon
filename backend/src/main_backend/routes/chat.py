from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel, Field

from main_backend.services.chat_service import ChatServiceError, chat_service

router = APIRouter(tags=["chat"])
profiles_router = APIRouter(prefix="/profiles", tags=["chat"])


class ChatRoomCreateRequest(BaseModel):
    other_profile_id: str = Field(min_length=1, max_length=64)


@profiles_router.post("/{profile_id}/chat-rooms", status_code=status.HTTP_201_CREATED)
def create_chat_room(profile_id: str, payload: ChatRoomCreateRequest) -> dict[str, object]:
    try:
        room = chat_service.create_or_get_room(profile_id, payload.other_profile_id)
    except ChatServiceError as exc:
        if exc.code == "profile_not_found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.code) from exc
        if exc.code == "cannot_chat_with_self":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.code) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.code) from exc

    return {"status": "ready", "room": room}


@router.get("/chat-rooms/{room_id}/messages")
def get_chat_room_messages(room_id: str) -> dict[str, object]:
    room = chat_service.get_room(room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="chat_room_not_found")
    return {
        "status": "ok",
        "room": room,
        "messages": chat_service.list_messages(room_id),
    }


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

    await chat_service.connect(room_id, websocket)
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
        await chat_service.disconnect(room_id, websocket)
