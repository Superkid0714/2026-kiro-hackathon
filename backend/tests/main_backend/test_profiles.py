from fastapi.testclient import TestClient

from main_backend.app import app

client = TestClient(app)


def test_create_profile_returns_expected_shape() -> None:
    response = client.post(
        "/profiles",
        json={
            "nickname": "민수",
            "age": 22,
            "gender": "male",
            "region": "Gwangju",
            "move_in_period": "2026-09",
            "stay_duration_months": 6,
        },
    )

    body = response.json()

    assert response.status_code == 201
    assert body["status"] == "created"
    assert body["profile"]["nickname"] == "민수"
    assert body["profile"]["profile_id"].startswith("profile-")


def test_list_profiles_returns_created_profile() -> None:
    create_response = client.post(
        "/profiles",
        json={
            "nickname": "서연",
            "age": 21,
            "gender": "female",
            "region": "Jeonju",
            "move_in_period": "2026-08",
            "stay_duration_months": 12,
        },
    )
    created_profile = create_response.json()["profile"]

    response = client.get("/profiles")
    body = response.json()

    assert response.status_code == 200
    assert body["status"] == "ok"
    assert body["count"] >= 1
    assert any(
        profile["profile_id"] == created_profile["profile_id"]
        for profile in body["profiles"]
    )


def test_get_unknown_profile_returns_not_found() -> None:
    response = client.get("/profiles/profile-missing")

    assert response.status_code == 404
    assert response.json() == {"detail": "profile_not_found"}


def test_save_profile_interview_returns_expected_shape() -> None:
    create_response = client.post(
        "/profiles",
        json={
            "nickname": "하늘",
            "age": 24,
            "gender": "female",
            "region": "광주 북구",
            "move_in_period": "2026-09",
            "stay_duration_months": 12,
        },
    )
    profile_id = create_response.json()["profile"]["profile_id"]

    response = client.put(
        f"/profiles/{profile_id}/interview",
        json={
            "wake_up_time": "07:00",
            "sleep_time": "23:30",
            "noise_sensitive": True,
            "quiet_hours_start": "22:00",
            "cleaning_frequency": "3",
            "dishes_deadline": "그날 이내에",
            "guest_frequency": "1",
            "smokes": False,
            "drinking_frequency": "2",
            "home_stay_frequency": "5",
            "meal_preference": "직접",
            "home_activity_frequency": "매일",
            "supplies_sharing": "일부 공유",
            "summer_temperature": 24,
            "winter_temperature": 21,
            "pet_ok": True,
            "pet_preference": "고양이",
            "conflict_resolution": "즉시 대면",
            "shared_cost_rule": "반반",
            "personal_space_access": "노크 혹은 허락",
            "personal_space_ratio": "반반",
            "security_preference": "외출시",
            "absence_notice": "하루 이상",
        },
    )

    body = response.json()

    assert response.status_code == 200
    assert body["status"] == "saved"
    assert body["profile_id"] == profile_id
    assert body["interview"]["wake_up_time"] == "07:00"
    assert body["interview"]["smoking_type"] is None
    assert body["interview"]["pet_preference"] == "고양이"


def test_get_profile_interview_returns_saved_interview() -> None:
    create_response = client.post(
        "/profiles",
        json={
            "nickname": "준호",
            "age": 23,
            "gender": "male",
            "region": "전주",
            "move_in_period": "2026-10",
            "stay_duration_months": 6,
        },
    )
    profile_id = create_response.json()["profile"]["profile_id"]

    client.put(
        f"/profiles/{profile_id}/interview",
        json={
            "wake_up_time": "08:00",
            "sleep_time": "00:00",
            "noise_sensitive": False,
            "quiet_hours_start": "23:00",
            "cleaning_frequency": "매일",
            "dishes_deadline": "바로",
            "guest_frequency": "2",
            "smokes": True,
            "smoking_type": "전자담배",
            "smoking_place": "밖",
            "drinking_frequency": "1",
            "home_stay_frequency": "매일",
            "meal_preference": "배달",
            "home_activity_frequency": "3",
            "supplies_sharing": "공동구매",
            "summer_temperature": 23,
            "winter_temperature": 20,
            "pet_ok": False,
            "conflict_resolution": "모아서 대면",
            "shared_cost_rule": "거주 시간 비율",
            "personal_space_access": "불가능",
            "personal_space_ratio": "필요한 만큼",
            "security_preference": "항시 잠금",
            "absence_notice": "항상",
        },
    )

    response = client.get(f"/profiles/{profile_id}/interview")
    body = response.json()

    assert response.status_code == 200
    assert body["status"] == "ok"
    assert body["profile_id"] == profile_id
    assert body["interview"]["smoking_type"] == "전자담배"
    assert body["interview"]["smoking_place"] == "밖"
    assert body["interview"]["pet_preference"] is None


def test_save_profile_interview_unknown_profile_returns_not_found() -> None:
    response = client.put(
        "/profiles/profile-missing/interview",
        json={
            "wake_up_time": "07:00",
            "sleep_time": "23:00",
            "noise_sensitive": True,
            "quiet_hours_start": "22:00",
            "cleaning_frequency": "1",
            "dishes_deadline": "바로",
            "guest_frequency": "1",
            "smokes": False,
            "drinking_frequency": "1",
            "home_stay_frequency": "1",
            "meal_preference": "배달",
            "home_activity_frequency": "1",
            "supplies_sharing": "각자",
            "summer_temperature": 24,
            "winter_temperature": 20,
            "pet_ok": False,
            "conflict_resolution": "즉시 대면",
            "shared_cost_rule": "반반",
            "personal_space_access": "노크 혹은 허락",
            "personal_space_ratio": "반반",
            "security_preference": "외출시",
            "absence_notice": "필요 없음",
        },
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "profile_not_found"}
