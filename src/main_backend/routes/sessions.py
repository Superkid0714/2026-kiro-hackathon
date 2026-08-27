from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from main_backend.services.session_service import session_service

router = APIRouter(prefix="/sessions", tags=["sessions"])


class StudentProfile(BaseModel):
    student_id: str = Field(min_length=1)
    lifestyle: dict[str, str] = Field(default_factory=dict)
    required_rules: list[str] = Field(default_factory=list)
    preferences: dict[str, int] = Field(default_factory=dict)


class SessionCreateRequest(BaseModel):
    session_name: str = Field(min_length=1)
    students: list[StudentProfile] = Field(min_length=2)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_session(payload: SessionCreateRequest) -> dict[str, object]:
    session = session_service.create_session(payload.model_dump())
    return {
        "status": "accepted",
        "session": session,
        "next_step": "call-ai-backend",
    }


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

    return {
        "status": "pending",
        "session_id": session_id,
        "matches": [],
        "errors": [],
    }
