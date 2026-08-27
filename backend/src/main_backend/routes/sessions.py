from typing import Any

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from main_backend.services.session_service import SessionNotFoundError, session_service

router = APIRouter(prefix="/sessions", tags=["sessions"])


class StudentProfile(BaseModel):
    student_id: str = Field(min_length=1)
    profile_id: str | None = None
    nickname: str | None = None
    gender: str | None = None
    region: str | None = None
    move_in_period: str | None = None
    stay_duration_months: int | None = None
    lifestyle: dict[str, str] = Field(default_factory=dict)
    required_rules: list[str] = Field(default_factory=list)
    preferences: dict[str, int] = Field(default_factory=dict)
    interview: dict[str, Any] = Field(default_factory=dict)
    character: dict[str, Any] = Field(default_factory=dict)


class SessionCreateRequest(BaseModel):
    session_name: str = Field(min_length=1)
    students: list[StudentProfile] = Field(min_length=2)
    preset_id: str = Field(default="default", min_length=1)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_session(payload: SessionCreateRequest) -> dict[str, object]:
    if len(payload.students) % 2 != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="student_count_must_be_even",
        )

    session = session_service.create_session(payload.model_dump())
    return {"status": "accepted", "session": session, "next_step": "run-session-match"}


@router.get("/{session_id}")
def get_session(session_id: str) -> dict[str, object]:
    session = session_service.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="session_not_found")
    return {"status": "ok", "session": session}


@router.get("/{session_id}/result")
def get_session_result(session_id: str) -> dict[str, object]:
    session = session_service.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="session_not_found")

    result = session_service.get_result(session_id)
    if result is not None:
        return result

    return {"status": "pending", "session_id": session_id, "matches": [], "errors": []}


@router.post("/{session_id}/match")
async def run_session_match(session_id: str) -> JSONResponse:
    try:
        result = await session_service.run_matching(session_id)
    except SessionNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="session_not_found")

    status_code = status.HTTP_200_OK if result["status"] == "ok" else status.HTTP_502_BAD_GATEWAY
    return JSONResponse(status_code=status_code, content=result)
