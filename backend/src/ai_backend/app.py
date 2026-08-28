from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

from ai_backend.handler import InputValidationError, process_match_request
from runtime_env import load_runtime_env

load_runtime_env()


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


class MatchRequest(BaseModel):
    request_id: str | None = None
    session_id: str = Field(min_length=1)
    session_name: str = Field(default="", min_length=0)
    students: list[StudentProfile] = Field(min_length=2)
    preset_id: str = Field(default="default", min_length=1)


def create_app() -> FastAPI:
    app = FastAPI(
        title="RoomPACT AI Backend",
        version="0.1.0",
        description="AI backend for deterministic roommate matching and optional generation",
    )

    @app.get("/health")
    def healthcheck() -> dict[str, str]:
        return {"status": "ok", "service": "ai-backend"}

    @app.post("/match")
    def match(payload: MatchRequest) -> dict[str, Any]:
        try:
            return process_match_request(payload.model_dump())
        except InputValidationError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": exc.code, "message": exc.message},
            ) from exc

    return app


app = create_app()
