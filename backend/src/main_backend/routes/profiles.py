from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from main_backend.services.profile_service import profile_service

router = APIRouter(prefix="/profiles", tags=["profiles"])


class ProfileCreateRequest(BaseModel):
    nickname: str = Field(min_length=1, max_length=30)
    age: int = Field(ge=17, le=100)
    gender: str = Field(min_length=1, max_length=20)
    region: str = Field(min_length=1, max_length=50)
    move_in_period: str = Field(min_length=1, max_length=50)
    stay_duration_months: int = Field(ge=1, le=120)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_profile(payload: ProfileCreateRequest) -> dict[str, object]:
    profile = profile_service.create_profile(payload.model_dump())
    return {"status": "created", "profile": profile}


@router.get("")
def list_profiles() -> dict[str, object]:
    profiles = profile_service.list_profiles()
    return {"status": "ok", "profiles": profiles, "count": len(profiles)}


@router.get("/{profile_id}")
def get_profile(profile_id: str) -> dict[str, object]:
    profile = profile_service.get_profile(profile_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="profile_not_found")
    return {"status": "ok", "profile": profile}
