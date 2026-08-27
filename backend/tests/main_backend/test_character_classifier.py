from main_backend.services.character_classifier import classify_character


def test_classify_character_returns_pee_for_rule_high_sharing_low() -> None:
    character = classify_character(
        {
            "wake_up_time": "07:00",
            "sleep_time": "23:00",
            "noise_sensitive": True,
            "quiet_hours_start": "22:00",
            "cleaning_frequency": "매일",
            "dishes_deadline": "바로",
            "guest_frequency": "1",
            "smokes": False,
            "drinking_frequency": "1",
            "home_stay_frequency": "1",
            "meal_preference": "직접",
            "home_activity_frequency": "1",
            "supplies_sharing": "각자",
            "summer_temperature": 24,
            "winter_temperature": 20,
            "pet_ok": False,
            "conflict_resolution": "모아서 대면",
            "shared_cost_rule": "거주 시간 비율",
            "personal_space_access": "불가능",
            "personal_space_ratio": "반반",
            "security_preference": "항시 잠금",
            "absence_notice": "필요 없음",
        }
    )

    assert character["type_code"] == "PEE"
    assert character["type_name"] == "규칙중시형"
    assert character["rule_score"] >= 50
    assert character["sharing_score"] < 50


def test_classify_character_returns_dudi_for_rule_high_sharing_high() -> None:
    character = classify_character(
        {
            "wake_up_time": "07:00",
            "sleep_time": "23:00",
            "noise_sensitive": True,
            "quiet_hours_start": "22:00",
            "cleaning_frequency": "매일",
            "dishes_deadline": "바로",
            "guest_frequency": "매일",
            "smokes": False,
            "drinking_frequency": "1",
            "home_stay_frequency": "매일",
            "meal_preference": "직접",
            "home_activity_frequency": "1",
            "supplies_sharing": "공동구매",
            "summer_temperature": 24,
            "winter_temperature": 20,
            "pet_ok": False,
            "conflict_resolution": "즉시 대면",
            "shared_cost_rule": "반반",
            "personal_space_access": "노크 혹은 허락",
            "personal_space_ratio": "필요한 만큼",
            "security_preference": "항시 잠금",
            "absence_notice": "항상",
        }
    )

    assert character["type_code"] == "DUDI"
    assert character["type_name"] == "함께정돈형"
    assert character["rule_score"] >= 50
    assert character["sharing_score"] >= 50
