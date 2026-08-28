from typing import Literal

from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, Field, model_validator

from main_backend.services.auth_service import AuthServiceError, auth_service
from main_backend.services.profile_service import profile_service

router = APIRouter(prefix="/profiles", tags=["profiles"])

FrequencyValue = Literal["1", "2", "3", "4", "5", "6", "매일"]
DeadlineValue = Literal["바로", "그날 이내에", "다음날 아침"]
SmokingPlaceValue = Literal["밖", "베란다", "집 안"]
MealPreferenceValue = Literal["배달", "직접"]
SuppliesSharingValue = Literal["공동구매", "각자", "일부 공유"]
PetPreferenceValue = Literal["고양이", "강아지", "둘 다"]
ConflictResolutionValue = Literal["즉시 대면", "모아서 대면"]
SharedCostRuleValue = Literal["반반", "거주 시간 비율"]
PersonalSpaceAccessValue = Literal["자유롭게", "노크 혹은 허락", "불가능"]
PersonalSpaceRatioValue = Literal["반반", "필요한 만큼"]
SecurityPreferenceValue = Literal["항시 잠금", "외출시", "상관없음"]
AbsenceNoticeValue = Literal["항상", "하루 이상", "필요 없음"]


class ProfileCreateRequest(BaseModel):
    nickname: str = Field(min_length=1, max_length=30)
    age: int = Field(ge=17, le=100)
    gender: str = Field(min_length=1, max_length=20)
    region: str = Field(min_length=1, max_length=50)
    move_in_period: str = Field(min_length=1, max_length=50)
    stay_duration_months: int = Field(ge=1, le=120)


class ProfileInterviewRequest(BaseModel):
    wake_up_time: str = Field(pattern=r"^(?:[01]\d|2[0-3]):(?:00|10|20|30|40|50)$")
    sleep_time: str = Field(pattern=r"^(?:[01]\d|2[0-3]):(?:00|10|20|30|40|50)$")
    noise_sensitive: bool
    quiet_hours_start: str = Field(pattern=r"^(?:[01]\d|2[0-3]):(?:00|10|20|30|40|50)$")
    cleaning_frequency: FrequencyValue
    dishes_deadline: DeadlineValue
    guest_frequency: FrequencyValue
    smokes: bool
    smoking_type: str | None = Field(default=None, min_length=1, max_length=30)
    smoking_place: SmokingPlaceValue | None = None
    drinking_frequency: FrequencyValue
    home_stay_frequency: FrequencyValue
    meal_preference: MealPreferenceValue
    home_activity_frequency: FrequencyValue
    supplies_sharing: SuppliesSharingValue
    summer_temperature: int = Field(ge=16, le=35)
    winter_temperature: int = Field(ge=10, le=30)
    pet_ok: bool
    pet_preference: PetPreferenceValue | None = None
    conflict_resolution: ConflictResolutionValue
    shared_cost_rule: SharedCostRuleValue
    personal_space_access: PersonalSpaceAccessValue
    personal_space_ratio: PersonalSpaceRatioValue
    security_preference: SecurityPreferenceValue
    absence_notice: AbsenceNoticeValue
    hardcut_conditions: list[str] = Field(default_factory=list, max_length=3)

    @model_validator(mode="after")
    def validate_conditional_fields(self) -> "ProfileInterviewRequest":
        if self.smokes:
            if self.smoking_type is None or self.smoking_place is None:
                raise ValueError("smoking_type_and_place_required")
        else:
            self.smoking_type = None
            self.smoking_place = None

        if self.pet_ok:
            if self.pet_preference is None:
                raise ValueError("pet_preference_required")
        else:
            self.pet_preference = None

        normalized_hardcuts: list[str] = []
        for item in self.hardcut_conditions:
            value = item.strip()
            if not value:
                raise ValueError("hardcut_condition_empty")
            normalized_hardcuts.append(value)

        if len(normalized_hardcuts) > 3:
            raise ValueError("hardcut_max_3")

        self.hardcut_conditions = normalized_hardcuts

        return self


@router.post("", status_code=status.HTTP_201_CREATED)
def create_profile(
    payload: ProfileCreateRequest,
    authorization: str | None = Header(default=None),
) -> dict[str, object]:
    try:
        auth_service.ensure_profile_not_linked(authorization)
    except AuthServiceError as exc:
        if exc.code == "profile_already_linked":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=exc.code,
            ) from exc
        if exc.code in {"authorization_required", "invalid_access_token", "access_token_expired"}:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=exc.code,
            ) from exc
        if exc.code == "user_not_found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=exc.code,
            ) from exc
        raise
    profile = profile_service.create_profile(payload.model_dump())
    auth_service.link_profile(authorization, profile["profile_id"])
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


@router.put("/{profile_id}")
def update_profile(profile_id: str, payload: ProfileCreateRequest) -> dict[str, object]:
    profile = profile_service.update_profile(profile_id, payload.model_dump())
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="profile_not_found")
    return {"status": "updated", "profile": profile}


@router.put("/{profile_id}/interview")
def save_profile_interview(profile_id: str, payload: ProfileInterviewRequest) -> dict[str, object]:
    interview = profile_service.save_interview(profile_id, payload.model_dump())
    if interview is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="profile_not_found")
    return {"status": "saved", **interview}


@router.get("/{profile_id}/interview")
def get_profile_interview(profile_id: str) -> dict[str, object]:
    interview = profile_service.get_interview(profile_id)
    if interview is None:
        if profile_service.get_profile(profile_id) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="profile_not_found")
        return {
            "status": "ok",
            "profile_id": profile_id,
            "has_interview": False,
            "interview": None,
            "character": None,
            "updated_at": None,
        }
    return {"status": "ok", "has_interview": True, **interview}


@router.get("/{profile_id}/recommendations")
def get_profile_recommendations(profile_id: str) -> dict[str, object]:
    recommendations = profile_service.get_recommendations(profile_id)
    if recommendations is None:
        if profile_service.get_profile(profile_id) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="profile_not_found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="profile_recommendations_not_found",
        )
    return {"status": "ok", **recommendations}
