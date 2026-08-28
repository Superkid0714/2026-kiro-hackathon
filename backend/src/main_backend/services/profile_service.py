from __future__ import annotations

from copy import deepcopy
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from ai_backend.scoring import calculate_pair_scores
from main_backend.services.character_classifier import classify_character
from main_backend.services.storage import get_storage_backend


class ProfileService:
    recommendation_limit = 3
    recommendation_threshold = 70

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

    def update_profile(self, profile_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        storage = get_storage_backend()
        profile = storage.get_profile(profile_id)
        if profile is None:
            return None

        profile.update(
            {
                "nickname": payload["nickname"],
                "age": payload["age"],
                "gender": payload["gender"],
                "region": payload["region"],
                "move_in_period": payload["move_in_period"],
                "stay_duration_months": payload["stay_duration_months"],
                "updated_at": datetime.now(UTC).isoformat(),
            }
        )
        storage.save_profile(profile)
        return deepcopy(profile)

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
        storage = get_storage_backend()
        storage.save_profile_interview(profile_id, interview)
        self._refresh_recommendations(storage)
        saved_recommendations = storage.get_profile_recommendations(profile_id)
        response = deepcopy(interview)
        response["recommendations"] = (
            deepcopy(saved_recommendations["recommendations"])
            if saved_recommendations is not None
            else []
        )
        response["recommended_at"] = (
            saved_recommendations["recommended_at"] if saved_recommendations is not None else None
        )
        return response

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

    def get_recommendations(self, profile_id: str) -> dict[str, Any] | None:
        storage = get_storage_backend()
        profile = storage.get_profile(profile_id)
        if profile is None:
            return None
        return storage.get_profile_recommendations(profile_id)

    def _refresh_recommendations(self, storage: Any) -> None:
        profiles = {profile["profile_id"]: profile for profile in storage.list_profiles()}
        interviews = storage.list_profile_interviews()
        if not interviews:
            return

        candidates = {
            profile_id: self._build_match_student(profiles[profile_id], interview)
            for profile_id, interview in interviews.items()
            if profile_id in profiles
        }

        for profile_id, student in candidates.items():
            recommendation_items: list[dict[str, Any]] = []
            for other_profile_id, other_student in candidates.items():
                if profile_id == other_profile_id:
                    continue
                pair = calculate_pair_scores([student, other_student])[0]
                if not pair["eligible"] or pair["score"] < self.recommendation_threshold:
                    continue

                other_profile = profiles[other_profile_id]
                other_character = other_student.get("character", {})
                recommendation_items.append(
                    {
                        "profile_id": other_profile_id,
                        "student_id": other_student["student_id"],
                        "nickname": other_profile["nickname"],
                        "gender": other_profile["gender"],
                        "region": other_profile["region"],
                        "move_in_period": other_profile["move_in_period"],
                        "stay_duration_months": other_profile["stay_duration_months"],
                        "score": pair["score"],
                        "type_code": other_character.get("type_code"),
                        "type_name": other_character.get("type_name"),
                        "reasons": pair["reasons"],
                        "conflict_summary": pair["conflict_summary"],
                    }
                )

            recommendation_items.sort(
                key=lambda item: (-item["score"], item["profile_id"])
            )
            recommended_at = datetime.now(UTC).isoformat()
            storage.save_profile_recommendations(
                profile_id,
                {
                    "profile_id": profile_id,
                    "recommendations": recommendation_items[: self.recommendation_limit],
                    "recommended_at": recommended_at,
                },
            )

    @staticmethod
    def _build_match_student(
        profile: dict[str, Any],
        interview_record: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "student_id": profile["profile_id"],
            "profile_id": profile["profile_id"],
            "nickname": profile["nickname"],
            "gender": profile["gender"],
            "region": profile["region"],
            "move_in_period": profile["move_in_period"],
            "stay_duration_months": profile["stay_duration_months"],
            "interview": deepcopy(interview_record["interview"]),
            "character": deepcopy(interview_record.get("character", {})),
            "lifestyle": {},
            "required_rules": [],
            "preferences": {},
        }


profile_service = ProfileService()
