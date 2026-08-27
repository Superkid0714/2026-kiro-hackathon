from __future__ import annotations

from copy import deepcopy
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from main_backend.services.character_classifier import classify_character
from main_backend.services.storage import get_storage_backend


class ProfileService:
    def create_profile(self, payload: dict[str, Any]) -> dict[str, Any]:
        profile = {
            "profile_id": f"profile-{uuid4().hex[:8]}",
            "nickname": payload["nickname"],
            "age": payload["age"],
            "gender": payload["gender"],
            "region": payload["region"],
            "move_in_period": payload["move_in_period"],
            "stay_duration_months": payload["stay_duration_months"],
            "created_at": datetime.now(UTC).isoformat(),
        }
        get_storage_backend().save_profile(profile)
        return deepcopy(profile)

    def list_profiles(self) -> list[dict[str, Any]]:
        return deepcopy(get_storage_backend().list_profiles())

    def get_profile(self, profile_id: str) -> dict[str, Any] | None:
        profile = get_storage_backend().get_profile(profile_id)
        return deepcopy(profile) if profile is not None else None

    def save_interview(self, profile_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        profile = get_storage_backend().get_profile(profile_id)
        if profile is None:
            return None

        character = classify_character(payload)
        interview = {
            "profile_id": profile_id,
            "interview": deepcopy(payload),
            "character": character,
            "updated_at": datetime.now(UTC).isoformat(),
        }
        get_storage_backend().save_profile_interview(profile_id, interview)
        return deepcopy(interview)

    def get_interview(self, profile_id: str) -> dict[str, Any] | None:
        profile = get_storage_backend().get_profile(profile_id)
        if profile is None:
            return None

        interview = get_storage_backend().get_profile_interview(profile_id)
        if interview is None:
            return None

        normalized = deepcopy(interview)
        if "character" not in normalized:
            normalized["character"] = classify_character(normalized["interview"])
        return normalized


profile_service = ProfileService()
