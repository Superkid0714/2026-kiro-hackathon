# Main Backend API

이 문서는 프론트엔드 팀과 공유하는 `RoomPACT Campus` 메인 백엔드 API 계약 문서다.
현재 프론트는 메인 백엔드(`backend/src/main_backend/`)만 호출하고, AI 백엔드는 메인 백엔드 내부에서만 호출한다.

## Base URL

- Local: `http://localhost:8000`
- EC2 Public: `http://15.134.137.117/api`
- EC2 Direct Backend: `http://15.134.137.117:8000` (운영용 공개 주소로 쓰지 않고 점검용으로만 유지)

## API 역할

- 학생 설문 세션 생성
- 세션 조회
- 세션 매칭 실행 요청
- 매칭 결과 조회
- 프로필별 생활 인터뷰 저장 및 조회
- 프로필별 캐릭터 유형 산출
- AI 백엔드 오류를 프론트가 처리 가능한 구조로 전달

## 프론트 연동 흐름

- 기본 정보 화면에서 `POST /api/profiles`를 먼저 호출한다.
- 응답으로 받은 `profile_id`를 프론트 상태에 보관한다.
- 인터뷰 질문은 여러 UI 화면으로 나눠 받아도 된다.
- 프론트는 각 화면의 답변을 최종적으로 하나의 JSON으로 합친다.
- 마지막 제출 시 `PUT /api/profiles/{profile_id}/interview`를 한 번 호출해 전체 인터뷰를 저장한다.
- 인터뷰 저장 응답에는 `규칙성 점수`, `공유성 점수`, `4가지 캐릭터 유형`이 함께 포함된다.
- 인터뷰 저장이 끝나면 추천 후보가 내부적으로 자동 계산된다.
- 추천 후보 확인은 `GET /api/profiles/{profile_id}/recommendations`로 한다.
- 저장된 인터뷰를 다시 불러와야 할 때는 `GET /api/profiles/{profile_id}/interview`를 사용한다.

## 현재 구현된 엔드포인트

### `GET /health`

- 용도: 메인 백엔드 헬스체크
- 공개 호출 예시: `GET /api/health`
- 응답:

```json
{
  "status": "ok",
  "service": "main-backend"
}
```

### `POST /profiles`

- 용도: 기본 학생 프로필 생성
- 공개 호출 예시: `POST /api/profiles`
- 기능명세:
  - 학생의 기본 프로필을 생성한다.
  - 닉네임, 나이, 성별, 지역, 입주 예정 시기, 거주 예정 기간을 저장한다.
  - `region`은 현재 단계에서는 `시/도 단위 선택값`으로 받는다.
  - 자유 문장 주소 전체를 받는 구조가 아니라, 프론트가 선택 UI에서 고른 지역명을 그대로 전달하는 구조를 기준으로 한다.
  - 생성 후 서버가 발급한 `profile_id`를 반환한다.
- Path Variable:

```text
없음
```

- Query String:

```text
없음
```

- Request Header:

| Key | Value | 비고 |
| --- | --- | --- |
| Content-Type | application/json | JSON 요청 |
- 요청:

```json
{
  "nickname": "민수",
  "age": 22,
  "gender": "male",
  "region": "광주광역시",
  "move_in_period": "2026-09",
  "stay_duration_months": 6
}
```

- Request Body 필드:

| Key | Type | 비고 |
| --- | --- | --- |
| nickname | String | 사용자 닉네임 |
| age | Number | 나이 |
| gender | String | 성별 |
| region | String | 현재 단계에서는 시/도 단위 선택값 사용. 예: `서울특별시`, `광주광역시`, `전라남도`, `제주특별자치도` |
| move_in_period | String | 입주 예정 시기, 예: `2026-09` |
| stay_duration_months | Number | 거주 예정 개월 수 |

- 성공 응답:

```json
{
  "status": "created",
  "profile": {
    "profile_id": "profile-a1b2c3d4",
    "nickname": "민수",
    "age": 22,
    "gender": "male",
    "region": "광주광역시",
    "move_in_period": "2026-09",
    "stay_duration_months": 6,
    "created_at": "2026-08-27T13:30:00+00:00"
  }
}
```

### `GET /profiles`

- 용도: 프로필 목록 조회
- 공개 호출 예시: `GET /api/profiles`
- 성공 응답:

```json
{
  "status": "ok",
  "profiles": [
    {
      "profile_id": "profile-a1b2c3d4",
      "nickname": "민수",
      "age": 22,
      "gender": "male",
      "region": "광주광역시",
      "move_in_period": "2026-09",
      "stay_duration_months": 6,
      "created_at": "2026-08-27T13:30:00+00:00"
    }
  ],
  "count": 1
}
```

### `GET /profiles/{profile_id}`

- 용도: 프로필 단건 조회
- 공개 호출 예시: `GET /api/profiles/{profile_id}`
- 성공 응답:

```json
{
  "status": "ok",
  "profile": {
    "profile_id": "profile-a1b2c3d4",
    "nickname": "민수",
    "age": 22,
    "gender": "male",
    "region": "광주광역시",
    "move_in_period": "2026-09",
    "stay_duration_months": 6,
    "created_at": "2026-08-27T13:30:00+00:00"
  }
}
```

- 실패 응답:

```json
{
  "detail": "profile_not_found"
}
```

### `PUT /profiles/{profile_id}/interview`

- 용도: 프로필별 생활 인터뷰 응답 저장
- 공개 호출 예시: `PUT /api/profiles/{profile_id}/interview`
- 프론트 저장 방식: 여러 화면에서 받은 답변을 프론트에서 합친 뒤 `한 번에 저장`
- 기능명세:
  - 프로필 1건에 대한 생활 인터뷰 전체 응답을 저장한다.
  - 인터뷰는 부분 저장이 아니라 최종 제출 기준으로 전체 payload를 받는다.
  - 흡연/반려동물 관련 조건부 필드는 응답 값에 따라 필수 여부가 달라진다.
  - 저장 시 규칙성 점수와 공유성 점수를 계산하고 `ROO`, `DUDI`, `PEE`, `MOMO` 중 하나의 캐릭터 유형을 산출한다.
  - 저장 완료 후 현재 인터뷰 제출자 전체를 기준으로 추천 후보를 자동 갱신한다.
- Path Variable:

| Key | Type | 비고 |
| --- | --- | --- |
| profile_id | String | `POST /api/profiles` 응답으로 받은 프로필 ID |

- Request Body 필드:

| Key | Type | 비고 |
| --- | --- | --- |
| wake_up_time | String | 기상 시간, `HH:MM`, 10분 단위 |
| sleep_time | String | 취침 시간, `HH:MM`, 10분 단위 |
| noise_sensitive | Boolean | 생활 소음 민감 여부 |
| quiet_hours_start | String | 조용했으면 하는 시작 시간, `HH:MM`, 10분 단위 |
| cleaning_frequency | String | `1`, `2`, `3`, `4`, `5`, `6`, `매일` |
| dishes_deadline | String | `바로`, `그날 이내에`, `다음날 아침` |
| guest_frequency | String | 지인 초대 허용 빈도, `1`, `2`, `3`, `4`, `5`, `6`, `매일` |
| smokes | Boolean | 흡연 여부 |
| smoking_type | String or null | 흡연 시 담배 종류, `smokes=true`일 때 필수 |
| smoking_place | String or null | `밖`, `베란다`, `집 안`, `smokes=true`일 때 필수 |
| drinking_frequency | String | 음주 빈도, `1`, `2`, `3`, `4`, `5`, `6`, `매일` |
| home_stay_frequency | String | 집에 머무는 빈도, `1`, `2`, `3`, `4`, `5`, `6`, `매일` |
| meal_preference | String | `배달`, `직접` |
| home_activity_frequency | String | 게임/공부/재택 빈도, `1`, `2`, `3`, `4`, `5`, `6`, `매일` |
| supplies_sharing | String | `공동구매`, `각자`, `일부 공유` |
| summer_temperature | Number | 여름 선호 실내 온도 |
| winter_temperature | Number | 겨울 선호 실내 온도 |
| pet_ok | Boolean | 반려동물 동거 가능 여부 |
| pet_preference | String or null | `고양이`, `강아지`, `둘 다`, `pet_ok=true`일 때 필수 |
| conflict_resolution | String | `즉시 대면`, `모아서 대면` |
| shared_cost_rule | String | `반반`, `거주 시간 비율` |
| personal_space_access | String | `자유롭게`, `노크 혹은 허락`, `불가능` |
| personal_space_ratio | String | `반반`, `필요한 만큼` |
| security_preference | String | `항시 잠금`, `외출시`, `상관없음` |
| absence_notice | String | `항상`, `하루 이상`, `필요 없음` |

- UI 질문 매핑:

| 질문 번호 | 프론트 질문 | 저장 필드 |
| --- | --- | --- |
| 1 | 몇 시에 일어나나요? | `wake_up_time` |
| 2 | 몇 시에 잠드나요? | `sleep_time` |
| 3 | 생활 소음에 많이 민감한가요? | `noise_sensitive` |
| 4 | 몇 시 이후부터는 조용하게 지냈으면 하나요? | `quiet_hours_start` |
| 5 | 주에 몇 번 청소했으면 하나요? | `cleaning_frequency` |
| 6 | 공용 물건 정리와 설거지는 언제 끝내야 하나요? | `dishes_deadline` |
| 7 | 지인을 집에 초대하는 건 주에 몇 번까지 괜찮은가요? | `guest_frequency` |
| 8 | 담배를 피우나요? | `smokes` |
| 8-1 | 담배 종류? | `smoking_type` |
| 8-2 | 어디서 피우는 게 좋은가요? | `smoking_place` |
| 9 | 술을 자주 마시나요? | `drinking_frequency` |
| 10 | 주에 집에 얼마나 머무나요? | `home_stay_frequency` |
| 11 | 배달음식 혹은 직접 요리 중 어떤 걸 선호하나요? | `meal_preference` |
| 12 | 집에서 게임/공부/재택근무를 얼마나 자주 하나요? | `home_activity_frequency` |
| 13 | 생필품과 식재료는 어떻게 사용하는 게 편한가요? | `supplies_sharing` |
| 14 | 여름에는 어떤 실내 온도를 선호하나요? | `summer_temperature` |
| 15 | 겨울에는 어떤 실내 온도를 선호하나요? | `winter_temperature` |
| 16 | 반려동물과 함께 거주해도 괜찮은가요? | `pet_ok` |
| 16-1 | 괜찮을 경우, 어떤 종류가 괜찮은가요? | `pet_preference` |
| 17 | 문제가 생겼을 경우, 어떻게 해결하는 게 편한가요? | `conflict_resolution` |
| 18 | 공동 생활 비용은 어떻게 관리하는 게 좋은가요? | `shared_cost_rule` |
| 19 | 서로의 방이나 개인 공간에 들어가는 것에 대해 어떻게 생각하나요? | `personal_space_access` |
| 20 | 개인 공간 비율은 어떻게 나누는 게 낫나요? | `personal_space_ratio` |
| 21 | 방문과 창문은 얼마나 철저하게 관리했으면 하나요? | `security_preference` |
| 22 | 집을 장시간 비울 경우, 사전에 알려주는 게 필요한가요? | `absence_notice` |

- 요청:

```json
{
  "wake_up_time": "07:00",
  "sleep_time": "23:30",
  "noise_sensitive": true,
  "quiet_hours_start": "22:00",
  "cleaning_frequency": "3",
  "dishes_deadline": "그날 이내에",
  "guest_frequency": "1",
  "smokes": false,
  "drinking_frequency": "2",
  "home_stay_frequency": "5",
  "meal_preference": "직접",
  "home_activity_frequency": "매일",
  "supplies_sharing": "일부 공유",
  "summer_temperature": 24,
  "winter_temperature": 21,
  "pet_ok": true,
  "pet_preference": "고양이",
  "conflict_resolution": "즉시 대면",
  "shared_cost_rule": "반반",
  "personal_space_access": "노크 혹은 허락",
  "personal_space_ratio": "반반",
  "security_preference": "외출시",
  "absence_notice": "하루 이상"
}
```

- 성공 응답:

```json
{
  "status": "saved",
  "profile_id": "profile-a1b2c3d4",
  "interview": {
    "wake_up_time": "07:00",
    "sleep_time": "23:30",
    "noise_sensitive": true,
    "quiet_hours_start": "22:00",
    "cleaning_frequency": "3",
    "dishes_deadline": "그날 이내에",
    "guest_frequency": "1",
    "smokes": false,
    "smoking_type": null,
    "smoking_place": null,
    "drinking_frequency": "2",
    "home_stay_frequency": "5",
    "meal_preference": "직접",
    "home_activity_frequency": "매일",
    "supplies_sharing": "일부 공유",
    "summer_temperature": 24,
    "winter_temperature": 21,
    "pet_ok": true,
    "pet_preference": "고양이",
    "conflict_resolution": "즉시 대면",
    "shared_cost_rule": "반반",
    "personal_space_access": "노크 혹은 허락",
    "personal_space_ratio": "반반",
    "security_preference": "외출시",
    "absence_notice": "하루 이상"
  },
  "character": {
    "rule_score": 71.0,
    "sharing_score": 39.8,
    "type_code": "PEE",
    "type_name": "규칙중시형",
    "top_factors": [
      "조용하고 안정적인 생활 환경을 중요하게 생각해요",
      "늦은 시간에는 차분한 분위기를 선호해요",
      "문과 창문 잠금처럼 기본적인 안전 기준을 중요하게 여겨요"
    ]
  },
  "recommendations": [],
  "recommended_at": "2026-08-28T01:10:00+00:00",
  "updated_at": "2026-08-27T15:20:00+00:00"
}
```

- 비고:
  - 시간 입력은 `HH:MM` 24시간 형식이며 `10분` 단위만 허용한다.
  - `smokes: true`이면 `smoking_type`, `smoking_place`가 필요하다.
  - `pet_ok: true`이면 `pet_preference`가 필요하다.
  - 프론트는 여러 화면에서 받은 응답을 합쳐서 최종적으로 이 요청 본문 전체를 보낸다.
  - 캐릭터 유형 매핑:
    - `ROO`: 함께둥글형
    - `DUDI`: 함께정돈형
    - `PEE`: 규칙중시형
    - `MOMO`: 자유독립형

### `GET /profiles/{profile_id}/interview`

- 용도: 프로필별 생활 인터뷰 응답 조회
- 공개 호출 예시: `GET /api/profiles/{profile_id}/interview`
- 기능명세:
  - 저장된 인터뷰 전체 응답을 반환한다.
  - 수정 화면 진입, 제출 확인 화면, 이어서 작성 기능에 사용할 수 있다.
- 성공 응답:

```json
{
  "status": "ok",
  "profile_id": "profile-a1b2c3d4",
  "interview": {
    "wake_up_time": "07:00",
    "sleep_time": "23:30",
    "noise_sensitive": true,
    "quiet_hours_start": "22:00",
    "cleaning_frequency": "3",
    "dishes_deadline": "그날 이내에",
    "guest_frequency": "1",
    "smokes": false,
    "smoking_type": null,
    "smoking_place": null,
    "drinking_frequency": "2",
    "home_stay_frequency": "5",
    "meal_preference": "직접",
    "home_activity_frequency": "매일",
    "supplies_sharing": "일부 공유",
    "summer_temperature": 24,
    "winter_temperature": 21,
    "pet_ok": true,
    "pet_preference": "고양이",
    "conflict_resolution": "즉시 대면",
    "shared_cost_rule": "반반",
    "personal_space_access": "노크 혹은 허락",
    "personal_space_ratio": "반반",
    "security_preference": "외출시",
    "absence_notice": "하루 이상"
  },
  "character": {
    "rule_score": 71.0,
    "sharing_score": 39.8,
    "type_code": "PEE",
    "type_name": "규칙중시형",
    "top_factors": [
      "조용하고 안정적인 생활 환경을 중요하게 생각해요",
      "늦은 시간에는 차분한 분위기를 선호해요",
      "문과 창문 잠금처럼 기본적인 안전 기준을 중요하게 여겨요"
    ]
  },
  "updated_at": "2026-08-27T15:20:00+00:00"
}
```

- 실패 응답:

```json
{
  "detail": "profile_interview_not_found"
}
```

### `GET /profiles/{profile_id}/recommendations`

- 용도: 프로필별 자동 추천 후보 조회
- 공개 호출 예시: `GET /api/profiles/{profile_id}/recommendations`
- 기능명세:
  - 인터뷰 제출이 완료된 프로필의 추천 후보를 조회한다.
  - 새 사용자가 들어오거나 기존 사용자가 인터뷰를 수정하면 추천 목록이 자동 갱신된다.
  - 추천은 확정 배정이 아니라 현재 시점의 후보 제안이다.
- 성공 응답:

```json
{
  "status": "ok",
  "profile_id": "profile-a1b2c3d4",
  "recommendations": [
    {
      "profile_id": "profile-b2c3d4e5",
      "student_id": "profile-b2c3d4e5",
      "nickname": "서연",
      "gender": "female",
      "region": "광주광역시",
      "move_in_period": "2026-09",
      "stay_duration_months": 7,
      "score": 91,
      "type_code": "PEE",
      "type_name": "규칙중시형",
      "reasons": [
        "취침 시간대가 비슷합니다",
        "조용히 지내고 싶은 시간대가 잘 맞습니다",
        "개인 공간 출입 기준이 비슷합니다"
      ],
      "conflict_summary": []
    }
  ],
  "recommended_at": "2026-08-28T01:10:00+00:00"
}
```

- 실패 응답:

```json
{
  "detail": "profile_recommendations_not_found"
}
```

### `POST /sessions`

- 용도: 학생 설문 세션 생성
- 공개 호출 예시: `POST /api/sessions`
- 기능명세:
  - 매칭 대상 학생 목록을 세션으로 저장한다.
  - 기존 `lifestyle`, `required_rules`, `preferences` 기반 요청을 계속 지원한다.
  - `interview`, `character`, `region`, `move_in_period`, `stay_duration_months`를 함께 보내면 AI 백엔드가 더 정밀한 인터뷰 기반 매칭 점수를 계산한다.
- 요청:

```json
{
  "session_name": "orientation-demo",
  "preset_id": "orientation",
  "students": [
    {
      "student_id": "S1",
      "lifestyle": {
        "sleep": "early",
        "noise": "low",
        "cleanliness": "high"
      },
      "region": "광주광역시",
      "move_in_period": "2026-09",
      "stay_duration_months": 6,
      "required_rules": [
        "sleep=early"
      ],
      "preferences": {
        "sleep": 4,
        "noise": 2,
        "cleanliness": 3
      },
      "interview": {
        "wake_up_time": "07:00",
        "sleep_time": "23:30",
        "noise_sensitive": true,
        "quiet_hours_start": "22:00",
        "cleaning_frequency": "3",
        "dishes_deadline": "그날 이내에",
        "guest_frequency": "1",
        "smokes": false,
        "drinking_frequency": "2",
        "home_stay_frequency": "5",
        "meal_preference": "직접",
        "home_activity_frequency": "매일",
        "supplies_sharing": "일부 공유",
        "summer_temperature": 24,
        "winter_temperature": 21,
        "pet_ok": true,
        "pet_preference": "고양이",
        "conflict_resolution": "즉시 대면",
        "shared_cost_rule": "반반",
        "personal_space_access": "노크 혹은 허락",
        "personal_space_ratio": "반반",
        "security_preference": "외출시",
        "absence_notice": "하루 이상"
      },
      "character": {
        "rule_score": 71.0,
        "sharing_score": 39.8,
        "type_code": "PEE",
        "type_name": "규칙중시형"
      }
    },
    {
      "student_id": "S2",
      "lifestyle": {
        "sleep": "early",
        "noise": "high",
        "cleanliness": "medium"
      },
      "region": "광주광역시",
      "move_in_period": "2026-09",
      "stay_duration_months": 7,
      "required_rules": [],
      "preferences": {
        "sleep": 4,
        "noise": 4,
        "cleanliness": 2
      }
    }
  ]
}
```

- 학생 payload 필드:

| Key | Type | 비고 |
| --- | --- | --- |
| student_id | String | 세션 내부 학생 식별자 |
| profile_id | String | 선택 필드. 프로필 API와 연결할 때 사용 |
| nickname | String | 선택 필드 |
| gender | String | 선택 필드 |
| region | String | 선택 필드. 시/도 단위 희망 지역 |
| move_in_period | String | 선택 필드. 예: `2026-09` |
| stay_duration_months | Number | 선택 필드. 거주 예정 개월 수 |
| lifestyle | Object | 기존 데모용 생활 패턴 요약 |
| required_rules | Array[String] | 필수 조건 |
| preferences | Object | 기존 가중치 기반 선호값 |
| interview | Object | 선택 필드. 22문항 생활 인터뷰 전체 응답 |
| character | Object | 선택 필드. 인터뷰 기반 캐릭터 분류 결과 |

- 성공 응답:

```json
{
  "status": "accepted",
  "session": {
    "session_id": "session-7dbcdb28",
    "session_name": "orientation-demo",
    "student_count": 2,
    "students": [],
    "preset_id": "orientation",
    "status": "created"
  },
  "next_step": "run-session-match"
}
```

- 실패 응답:

```json
{
  "detail": "student_count_must_be_even"
}
```

### `GET /sessions/{session_id}`

- 용도: 생성된 세션 조회
- 공개 호출 예시: `GET /api/sessions/{session_id}`
- 성공 응답:

```json
{
  "status": "ok",
  "session": {
    "session_id": "session-7dbcdb28",
    "session_name": "orientation-demo",
    "student_count": 2,
    "students": [],
    "preset_id": "orientation",
    "status": "created"
  }
}
```

- 실패 응답:

```json
{
  "detail": "session_not_found"
}
```

### `POST /sessions/{session_id}/match`

- 용도: 세션 기준 룸메이트 매칭 실행
- 공개 호출 예시: `POST /api/sessions/{session_id}/match`
- 성공 응답:

```json
{
  "status": "ok",
  "request_id": "req-demo",
  "session_id": "session-7dbcdb28",
  "matches": [
    {
      "student_a": "S1",
      "student_b": "S2",
      "score": 63,
      "reasons": [
        "수면 중요도가 함께 높습니다",
        "수면 패턴이 유사합니다"
      ],
      "conflict_summary": [
        "소음 기준을 먼저 조율해야 합니다"
      ],
      "conflict_scenario": "S1 & S2 조합은 orientation 시나리오 기준에서 소음 기준을 먼저 조율해야 합니다.",
      "conflict_scenario_source": "fallback",
      "negotiation_suggestions": [
        "S1 & S2는 소음 기준을 먼저 조율해야 합니다"
      ],
      "negotiation_source": "fallback",
      "pact": [
        "취침 기준은 early로 함께 유지한다."
      ],
      "pact_source": "fallback"
    }
  ],
  "errors": []
}
```

- AI 백엔드 연결 실패 응답:

```json
{
  "status": "error",
  "session_id": "session-7dbcdb28",
  "matches": [],
  "errors": [
    {
      "code": "ai_backend_unreachable",
      "message": "..."
    }
  ]
}
```

### `GET /sessions/{session_id}/result`

- 용도: 가장 최근 매칭 결과 조회
- 결과가 아직 없을 때:

```json
{
  "status": "pending",
  "session_id": "session-7dbcdb28",
  "matches": [],
  "errors": []
}
```

- 결과가 있을 때:
  - `POST /sessions/{session_id}/match`와 동일한 응답 구조 반환

## 프론트 연동 순서

1. 필요하면 `POST /profiles`로 학생 기본 프로필 저장
2. 프로필 기반 입력을 조합해 `POST /sessions`로 전송
3. 가능하면 `region`, `move_in_period`, `stay_duration_months`, `interview`, `character`를 함께 넣어 인터뷰 기반 매칭을 사용
4. 응답에서 `session.session_id` 확보
5. `POST /sessions/{session_id}/match` 호출
6. 결과 화면은 `matches[]`를 바로 렌더링
7. 재조회가 필요하면 `GET /sessions/{session_id}/result` 호출

## 프론트가 우선 렌더링하면 되는 필드

- `matches[].student_a`
- `matches[].student_b`
- `matches[].score`
- `matches[].reasons`
- `matches[].conflict_summary`
- `matches[].conflict_scenario`
- `matches[].negotiation_suggestions`
- `matches[].pact`
- `errors`

## 다음에 추가하기 좋은 메인 백엔드 API

우선순위 기준이다.

1. `GET /presets`
   - 프론트가 선택 가능한 `preset_id` 목록 조회
2. `POST /sessions/validate`
   - 저장 전 입력 검증만 수행
3. `GET /sessions`
   - 최근 세션 목록 조회
4. `DELETE /sessions/{session_id}`
   - 데모용 세션 정리
5. `POST /auth/kakao/exchange`
   - 카카오 로그인 연동 시 코드 교환

## 운영 메모

- 메인 백엔드 포트: `8000`
- AI 백엔드 포트: `8001`
- EC2에서는 메인 백엔드만 외부 공개하고 AI 백엔드는 내부 호출용으로 두는 구성을 권장한다.
- OpenAPI JSON은 `backend/scripts/export_openapi.py`로 갱신할 수 있다.
- `region`은 현재 `시/도 단위 문자열`로 저장한다. 구/군 단위 세분화와 지도 API 연동은 추후 확장 범위다.
