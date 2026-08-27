from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

from ai_backend.handler import InputValidationError, process_match_request


class StudentProfile(BaseModel):
    student_id: str = Field(min_length=1)
    lifestyle: dict[str, str] = Field(default_factory=dict)
    required_rules: list[str] = Field(default_factory=list)
    preferences: dict[str, int] = Field(default_factory=dict)


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
