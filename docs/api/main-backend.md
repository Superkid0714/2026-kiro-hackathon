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
- 추천 후보 간 대화 요청 생성, 조회 및 수락
- 상호 수락 완료 후 1:1 채팅방 생성
- 채팅방 메시지 이력 조회
- 채팅방 기준 추가 질문 추천 조회
- WebSocket 실시간 채팅
- 룸메이트 확정과 약속 조회
- 카카오 로그인 코드 교환
- 현재 로그인 사용자 조회
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
- 추천 후보와 대화를 시작할 때는 먼저 `POST /api/profiles/{profile_id}/match-requests`로 대화 요청을 만든다.
- 채팅 목록(수신함) 화면은 `GET /api/profiles/{profile_id}/match-requests`로 내가 보냈거나 받은 요청 전체를 조회한다.
- 요청을 받은 쪽은 `POST /api/match-requests/{request_id}/accept`로 수락하고, 이때 응답이 `accepted`가 된다.
- 그 다음 `POST /api/profiles/{profile_id}/chat-rooms`로 채팅방을 확보한다.
- 기존 메시지 이력은 `GET /api/chat-rooms/{room_id}/messages`로 조회한다.
- 채팅을 더 자연스럽게 이어가기 위한 질문 추천은 `GET /api/chat-rooms/{room_id}/question-suggestions?profile_id={profile_id}`로 조회한다.
- 실시간 메시지는 `ws://15.134.137.117/api/ws/chat-rooms/{room_id}`로 연결한다.
- 채팅 중 최종 룸메이트를 확정할 때는 `POST /api/chat-rooms/{room_id}/roommate-confirmation`을 호출한다.
- 생성된 약속은 `GET /api/chat-rooms/{room_id}/pact?profile_id={profile_id}`로 조회한다.
- 카카오 로그인은 프론트 콜백 경로 `/auth/kakao/callback`에서 `code`를 받은 뒤 `POST /api/auth/kakao/exchange`를 호출해 완료한다.

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

### `POST /auth/kakao/exchange`

- 용도: 카카오 인가 코드를 서비스 로그인으로 교환
- 공개 호출 예시: `POST /api/auth/kakao/exchange`
- 기능명세:
  - 프론트 콜백 페이지가 카카오에서 받은 `code`를 메인 백엔드에 전달한다.
  - 메인 백엔드는 카카오 토큰 API와 사용자 정보 API를 호출한다.
  - 카카오 사용자 식별자를 기준으로 기존 서비스 사용자를 찾거나 새로 만든다.
  - 메인 백엔드는 자체 서비스 access token과 현재 사용자 정보를 반환한다.
  - 사용자가 아직 기본 프로필을 만들지 않았다면 `next_step`은 `complete-profile`이다.

- Request Body 필드:

| Key | Type | 비고 |
| --- | --- | --- |
| code | String | 카카오 Redirect URI에 포함된 인가 코드 |

- 요청:

```json
{
  "code": "SplxlOBeZQQYbYS6WxSbIA"
}
```

- 성공 응답:

```json
{
  "status": "ok",
  "access_token": "service-token",
  "token_type": "Bearer",
  "expires_in": 604800,
  "user": {
    "user_id": "user-a1b2c3d4e5",
    "provider": "kakao",
    "provider_user_id": "123456789",
    "nickname": "민수",
    "email": "roomonic@example.com",
    "profile_image_url": "https://example.com/kakao-profile.png",
    "profile_id": null,
    "created_at": "2026-08-28T02:30:00+00:00",
    "updated_at": "2026-08-28T02:30:00+00:00",
    "last_login_at": "2026-08-28T02:30:00+00:00"
  },
  "next_step": "complete-profile"
}
```

### `GET /auth/me`

- 용도: 현재 로그인 사용자 조회
- 공개 호출 예시: `GET /api/auth/me`
- 기능명세:
  - 서비스 access token 기준 현재 사용자 정보를 조회한다.
  - 프론트는 앱 재진입 시 로그인 상태 복원에 사용할 수 있다.

- Request Header:

| Key | Value | 비고 |
| --- | --- | --- |
| Authorization | `Bearer {access_token}` | 로그인 완료 후 받은 서비스 토큰 |

- 성공 응답:

```json
{
  "status": "ok",
  "user": {
    "user_id": "user-a1b2c3d4e5",
    "provider": "kakao",
    "provider_user_id": "123456789",
    "nickname": "민수",
    "email": "roomonic@example.com",
    "profile_image_url": "https://example.com/kakao-profile.png",
    "profile_id": "profile-a1b2c3d4",
    "created_at": "2026-08-28T02:30:00+00:00",
    "updated_at": "2026-08-28T02:45:00+00:00",
    "last_login_at": "2026-08-28T02:45:00+00:00"
  }
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

- 기능명세

- 프로필 1건에 대한 생활 인터뷰 전체 응답을 저장한다.
- 프론트에서 여러 UI 화면으로 나눠 받은 답변을 마지막에 하나로 합쳐 한 번에 저장한다.
- 부분 저장이 아니라 `최종 인터뷰 전체 payload` 저장 기준이다.
- 흡연/반려동물 관련 문항은 조건부 입력값을 검증한다.
- `hardcut_conditions`는 "양보할 수 없는 조건"을 최대 3개까지 저장한다.
- 저장 시 규칙성 점수와 공유성 점수를 계산하고 캐릭터 유형을 함께 산출한다.
- 저장 완료 후 현재 인터뷰 제출자 전체를 기준으로 추천 후보를 자동 갱신한다.

## Variable

### Path Variable

| Key | Type | 비고(예시, 값 설명 등) |
| --- | --- | --- |
| profile_id | String | `POST /api/profiles`로 생성한 프로필 ID |

### Query String

```text
없음
```

## Request Header

| Key | Value | 비고 |
| --- | --- | --- |
| Content-Type | application/json | JSON 요청 |

## Request Body

| Key | Type | 비고(예시, 값 설명 등) |
| --- | --- | --- |
| wake_up_time | String | 기상 시간, `HH:MM`, 10분 간격 |
| sleep_time | String | 취침 시간, `HH:MM`, 10분 간격 |
| noise_sensitive | Boolean | 생활 소음 민감 여부 |
| quiet_hours_start | String | 조용했으면 하는 시작 시간, `HH:MM`, 10분 간격 |
| cleaning_frequency | String | `1`, `2`, `3`, `4`, `5`, `6`, `매일` |
| dishes_deadline | String | `바로`, `그날 이내에`, `다음날 아침` |
| guest_frequency | String | `1`, `2`, `3`, `4`, `5`, `6`, `매일` |
| smokes | Boolean | 흡연 여부 |
| smoking_type | String or null | 담배 종류, `smokes=true`일 때 필수 |
| smoking_place | String or null | `밖`, `베란다`, `집 안`, `smokes=true`일 때 필수 |
| drinking_frequency | String | `1`, `2`, `3`, `4`, `5`, `6`, `매일` |
| home_stay_frequency | String | `1`, `2`, `3`, `4`, `5`, `6`, `매일` |
| meal_preference | String | `배달`, `직접` |
| home_activity_frequency | String | `1`, `2`, `3`, `4`, `5`, `6`, `매일` |
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
| hardcut_conditions | Array[String] | 양보할 수 없는 조건 최대 3개 |

### UI 질문 매핑

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
| 8-1 | 담배 종류 | `smoking_type` |
| 8-2 | 담배를 피울 경우, 어디서 피우는 게 좋은가요? | `smoking_place` |
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
| Hardcut | 양보할 수 없는 질문/조건 최대 3개 선택 | `hardcut_conditions` |

### 예시

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
  "absence_notice": "하루 이상",
  "hardcut_conditions": ["실내 흡연", "반려동물 필수", "잦은 손님 방문"]
}
```

---

## Response Body

| Key | Type | 비고(예시, 값 설명 등) |
| --- | --- | --- |
| status | String | `saved` |
| profile_id | String | 프로필 ID |
| interview | Object | 저장된 인터뷰 전체 응답 |
| character | Object | 인터뷰 기반 캐릭터 분류 결과 |
| character.rule_score | Number | 규칙성 점수 |
| character.sharing_score | Number | 공유성 점수 |
| character.type_code | String | `ROO`, `DUDI`, `PEE`, `MOMO` |
| character.type_name | String | `함께둥글형`, `함께정돈형`, `규칙중시형`, `자유독립형` |
| character.top_factors | Array[String] | 유형 분류의 주요 근거 문장 |
| recommendations | Array[Object] | 저장 직후 기준 추천 후보 목록 |
| recommended_at | String | 추천 후보 갱신 시각 |
| updated_at | String | 저장 시각 |

### 예시

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
    "absence_notice": "하루 이상",
    "hardcut_conditions": ["실내 흡연", "반려동물 필수", "잦은 손님 방문"]
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

### 실제 주소

```text
PUT http://15.134.137.117/api/profiles/{profile_id}/interview
```

- 비고
  - 시간 입력은 `HH:MM` 24시간 형식이며 `10분` 단위만 허용한다.
  - `smokes: true`이면 `smoking_type`, `smoking_place`가 필수다.
  - `pet_ok: true`이면 `pet_preference`가 필수다.
  - `hardcut_conditions`는 비워둘 수 있지만, 보내는 경우 최대 3개까지만 허용한다.
  - 프론트는 여러 화면에서 받은 응답을 합쳐 최종적으로 이 요청 본문 전체를 한 번에 보낸다.

### `GET /profiles/{profile_id}/interview`

- 기능명세

- 저장된 인터뷰 전체 응답을 조회한다.
- 수정 화면 재진입, 제출 확인, 이어쓰기 화면에서 사용할 수 있다.
- `hardcut_conditions`도 함께 반환한다.

## Variable

### Path Variable

| Key | Type | 비고(예시, 값 설명 등) |
| --- | --- | --- |
| profile_id | String | 프로필 ID |

### Query String

```text
없음
```

## Request Header

| Key | Value | 비고 |
| --- | --- | --- |
| 없음 |  |  |

## Request Body

| Key | Value | 비고(예시, 값 설명 등) |
| --- | --- | --- |
| 없음 |  |  |

### 예시

```json
{}
```

---

## Response Body

| Key | Type | 비고(예시, 값 설명 등) |
| --- | --- | --- |
| status | String | `ok` |
| has_interview | Boolean | 인터뷰 저장 여부 |
| profile_id | String | 프로필 ID |
| interview | Object | 저장된 인터뷰 전체 응답. 아직 없으면 `null` |
| character | Object | 인터뷰 기반 캐릭터 분류 결과. 아직 없으면 `null` |
| updated_at | String | 마지막 저장 시각. 아직 없으면 `null` |

### 예시

```json
{
  "status": "ok",
  "has_interview": true,
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
    "absence_notice": "하루 이상",
    "hardcut_conditions": ["실내 흡연", "반려동물 필수", "잦은 손님 방문"]
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

### 실제 주소

```text
GET http://15.134.137.117/api/profiles/{profile_id}/interview
```

- 인터뷰를 아직 시작하지 않은 경우 예시

```json
{
  "status": "ok",
  "has_interview": false,
  "profile_id": "profile-a1b2c3d4",
  "interview": null,
  "character": null,
  "updated_at": null
}
```

### `GET /profiles/{profile_id}/recommendations`

- 용도: 프로필별 자동 추천 후보 조회
- 공개 호출 예시: `GET /api/profiles/{profile_id}/recommendations`
- 기능명세:
  - 인터뷰 제출이 완료된 프로필의 추천 후보를 조회한다.
  - 새 사용자가 들어오거나 기존 사용자가 인터뷰를 수정하면 추천 목록이 자동 갱신된다.
  - 추천 후보는 `70점 이상`인 경우만 유지하며, 지역이 다르면 큰 감점이 반영된다.
  - Hardcut 조건과 충돌하는 후보는 점수가 높아도 추천 목록에서 제외된다.
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

### `POST /profiles/{profile_id}/match-requests`

- 용도: 추천 후보에게 대화 요청 생성
- 공개 호출 예시: `POST /api/profiles/{profile_id}/match-requests`
- 기능명세:
  - 현재 사용자가 상대 프로필에게 대화 시작 요청을 보낸다.
  - 요청을 보낸 사용자는 이미 동의한 상태로 저장된다.
  - 상대가 아직 수락하지 않았으면 상태는 `pending`이다.
  - 같은 두 프로필 조합으로 다시 요청하면 기존 요청을 그대로 반환한다.
- Path Variable:

| Key | Type | 비고 |
| --- | --- | --- |
| profile_id | String | 요청을 보내는 사용자 프로필 ID |

- Request Body 필드:

| Key | Type | 비고 |
| --- | --- | --- |
| other_profile_id | String | 요청 대상 프로필 ID |

- 요청:

```json
{
  "other_profile_id": "profile-b2c3d4e5"
}
```

- 성공 응답:

```json
{
  "status": "pending",
  "match_request": {
    "request_id": "match-9b21f4cd10",
    "participant_a_profile_id": "profile-a1b2c3d4",
    "participant_b_profile_id": "profile-b2c3d4e5",
    "requester_profile_id": "profile-a1b2c3d4",
    "target_profile_id": "profile-b2c3d4e5",
    "status": "pending",
    "requester_accepted": true,
    "target_accepted": false,
    "created_at": "2026-08-28T09:15:00+00:00",
    "updated_at": "2026-08-28T09:15:00+00:00"
  }
}
```

### `GET /profiles/{profile_id}/match-requests`

- 용도: 내가 보냈거나 받은 대화 요청 전체 조회
- 공개 호출 예시: `GET /api/profiles/{profile_id}/match-requests`
- 기능명세:
  - 해당 프로필이 요청자 또는 대상인 매칭 요청을 모두 반환한다.
  - 각 항목에 상대 프로필 요약(`peer_profile_id`, `peer_nickname`, `peer_region`)이 포함된다.
  - `status`가 `accepted`인 항목에는 연결된 채팅방 `room_id`가 함께 포함된다. 아직 채팅방이 만들어지지 않았다면 `null`이다.
  - 채팅 목록(수신함) 화면은 이 API를 데이터 소스로 사용한다. 프론트는 후보 선택 단계에서 로컬 저장소로 대화 요청/수락을 흉내내지 않는다.
- Path Variable:

| Key | Type | 비고 |
| --- | --- | --- |
| profile_id | String | 조회 기준 프로필 ID |

- 성공 응답:

```json
{
  "status": "ok",
  "match_requests": [
    {
      "request_id": "match-9b21f4cd10",
      "participant_a_profile_id": "profile-a1b2c3d4",
      "participant_b_profile_id": "profile-b2c3d4e5",
      "requester_profile_id": "profile-a1b2c3d4",
      "target_profile_id": "profile-b2c3d4e5",
      "status": "accepted",
      "requester_accepted": true,
      "target_accepted": true,
      "accepted_by_profile_id": "profile-b2c3d4e5",
      "accepted_at": "2026-08-28T09:18:00+00:00",
      "created_at": "2026-08-28T09:15:00+00:00",
      "updated_at": "2026-08-28T09:18:00+00:00",
      "peer_profile_id": "profile-b2c3d4e5",
      "peer_nickname": "서연",
      "peer_region": "광주광역시",
      "room_id": "room-9b21f4cd10"
    }
  ]
}
```

- 실패 응답: 존재하지 않는 `profile_id`면 `404`

```json
{
  "detail": "profile_not_found"
}
```

### `POST /match-requests/{request_id}/accept`

- 용도: 받은 대화 요청 수락
- 공개 호출 예시: `POST /api/match-requests/{request_id}/accept`
- 기능명세:
  - 상대 사용자가 자신에게 온 대화 요청을 수락한다.
  - 수락이 완료되면 해당 조합은 채팅방 생성 가능 상태가 된다.
  - 이미 수락된 요청을 다시 수락하면 현재 상태를 그대로 반환한다.
- Path Variable:

| Key | Type | 비고 |
| --- | --- | --- |
| request_id | String | 대화 요청 ID |

- Request Body 필드:

| Key | Type | 비고 |
| --- | --- | --- |
| profile_id | String | 요청을 수락하는 사용자 프로필 ID |

- 요청:

```json
{
  "profile_id": "profile-b2c3d4e5"
}
```

- 성공 응답:

```json
{
  "status": "accepted",
  "match_request": {
    "request_id": "match-9b21f4cd10",
    "participant_a_profile_id": "profile-a1b2c3d4",
    "participant_b_profile_id": "profile-b2c3d4e5",
    "requester_profile_id": "profile-a1b2c3d4",
    "target_profile_id": "profile-b2c3d4e5",
    "status": "accepted",
    "requester_accepted": true,
    "target_accepted": true,
    "accepted_by_profile_id": "profile-b2c3d4e5",
    "accepted_at": "2026-08-28T09:18:00+00:00",
    "created_at": "2026-08-28T09:15:00+00:00",
    "updated_at": "2026-08-28T09:18:00+00:00"
  }
}
```

### `POST /profiles/{profile_id}/chat-rooms`

- 용도: 상호 수락이 끝난 상대와의 1:1 채팅방 생성 또는 재사용
- 공개 호출 예시: `POST /api/profiles/{profile_id}/chat-rooms`
- 기능명세:
  - 현재 사용자와 상대 프로필 조합 기준으로 채팅방을 생성한다.
  - 두 사용자의 대화 요청이 상호 수락 상태가 아니면 채팅방을 만들 수 없다.
  - 같은 두 프로필 조합의 채팅방이 이미 있으면 새로 만들지 않고 기존 방을 반환한다.
  - 참가자 순서가 바뀌어도 같은 채팅방으로 취급한다.
- Path Variable:

| Key | Type | 비고 |
| --- | --- | --- |
| profile_id | String | 현재 사용자 프로필 ID |

- Request Body 필드:

| Key | Type | 비고 |
| --- | --- | --- |
| other_profile_id | String | 상대 프로필 ID |

- 요청:

```json
{
  "other_profile_id": "profile-b2c3d4e5"
}
```

- 성공 응답:

```json
{
  "status": "ready",
  "room": {
    "room_id": "room-9b21f4cd10",
    "participant_a_profile_id": "profile-a1b2c3d4",
    "participant_b_profile_id": "profile-b2c3d4e5",
    "participants": [
      {
        "profile_id": "profile-a1b2c3d4",
        "nickname": "민수",
        "gender": "male",
        "region": "광주광역시"
      },
      {
        "profile_id": "profile-b2c3d4e5",
        "nickname": "서연",
        "gender": "female",
        "region": "광주광역시"
      }
    ],
    "created_at": "2026-08-28T09:15:00+00:00",
    "updated_at": "2026-08-28T09:15:00+00:00"
  }
}
```

- 실패 응답:

```json
{
  "detail": "chat_requires_mutual_acceptance"
}
```

### `GET /chat-rooms/{room_id}/messages`

- 용도: 채팅방 메시지 이력 조회
- 공개 호출 예시: `GET /api/chat-rooms/{room_id}/messages`
- 기능명세:
  - 특정 채팅방의 저장된 메시지 목록을 오래된 순서부터 반환한다.
  - 채팅 화면 재진입 시 초기 이력 로딩에 사용한다.
  - 실시간 연결이 끊겨도 이력 조회는 계속 사용할 수 있다.
- Path Variable:

| Key | Type | 비고 |
| --- | --- | --- |
| room_id | String | 채팅방 ID |

- 성공 응답:

```json
{
  "status": "ok",
  "room": {
    "room_id": "room-9b21f4cd10",
    "participant_a_profile_id": "profile-a1b2c3d4",
    "participant_b_profile_id": "profile-b2c3d4e5",
    "participants": [
      {
        "profile_id": "profile-a1b2c3d4",
        "nickname": "민수",
        "gender": "male",
        "region": "광주광역시"
      },
      {
        "profile_id": "profile-b2c3d4e5",
        "nickname": "서연",
        "gender": "female",
        "region": "광주광역시"
      }
    ],
    "created_at": "2026-08-28T09:15:00+00:00",
    "updated_at": "2026-08-28T09:20:00+00:00"
  },
  "messages": [
    {
      "message_id": "msg-a13f92bbce44",
      "room_id": "room-9b21f4cd10",
      "sender_profile_id": "profile-a1b2c3d4",
      "sender_nickname": "민수",
      "text": "안녕하세요! 반가워요.",
      "sent_at": "2026-08-28T09:20:00+00:00"
    }
  ]
}
```

- 실패 응답:

```json
{
  "detail": "chat_room_not_found"
}
```

### `GET /chat-rooms/{room_id}/question-suggestions`

- 용도: 현재 채팅방에서 추가로 물어보면 좋은 질문 추천 조회
- 공개 호출 예시: `GET /api/chat-rooms/{room_id}/question-suggestions?profile_id={profile_id}`
- 기능명세:
  - 두 프로필의 인터뷰 응답, 캐릭터 결과, 최근 채팅 메시지를 바탕으로 대화를 이어가기 좋은 질문 3개를 반환한다.
  - 질문은 채팅 입력창에 바로 넣어도 어색하지 않은 자연스러운 문장 톤을 사용한다.
  - Gemini API 호출이 실패하면 fallback 질문을 같은 형식으로 반환한다.

- 성공 응답:

```json
{
  "status": "ok",
  "room_id": "room-9b21f4cd10",
  "questions": [
    "조용한 시간은 보통 몇 시부터 생각하고 있는지 한 번 더 물어봐도 될까요?",
    "손님이 오는 날에는 어느 정도 전부터 알려주면 편할지 같이 맞춰볼까요?",
    "입주 첫 주에 먼저 정해두고 싶은 생활 규칙이 있는지 이야기해볼까요?"
  ],
  "source": "llm",
  "generated_at": "2026-08-28T11:10:00+00:00"
}
```

- 실패 응답:

```json
{
  "detail": "chat_question_requires_profile_interview"
}
```

### `WS /ws/chat-rooms/{room_id}`

- 용도: 채팅방 실시간 메시지 송수신
- 공개 연결 예시:

```text
ws://15.134.137.117/api/ws/chat-rooms/{room_id}?profile_id={profile_id}&nickname={nickname}
```

- 기능명세:
  - 같은 방에 연결된 참가자에게 새 메시지를 실시간으로 전달한다.
  - 메시지 저장 후 브로드캐스트하므로, 재접속해도 이력이 유지된다.
  - 프론트는 연결 후 JSON 메시지를 주고받는다.

- 프론트 송신 payload:

```json
{
  "type": "send_message",
  "text": "생활수칙 같이 정해볼까요?"
}
```

- 서버 최초 연결 응답:

```json
{
  "type": "connected",
  "room_id": "room-9b21f4cd10"
}
```

- 서버 메시지 브로드캐스트:

```json
{
  "type": "message",
  "message": {
    "message_id": "msg-4b2cf1ed9a22",
    "room_id": "room-9b21f4cd10",
    "sender_profile_id": "profile-a1b2c3d4",
    "sender_nickname": "민수",
    "text": "생활수칙 같이 정해볼까요?",
    "sent_at": "2026-08-28T09:22:00+00:00"
  }
}
```

### `POST /chat-rooms/{room_id}/roommate-confirmation`

- 용도: 채팅 중 최종 룸메이트 확정과 약속 생성
- 공개 호출 예시: `POST /api/chat-rooms/{room_id}/roommate-confirmation`
- 기능명세:
  - 채팅 참가자 각자가 현재 대화 상대를 룸메이트로 확정할 수 있다.
  - 첫 번째 확정 요청 시에는 `pending` 상태만 저장하고 상대방의 확정을 기다린다.
  - 두 번째 참가자까지 확정하면 메인 백엔드는 두 사람의 인터뷰 응답과 캐릭터 결과를 모아 내부 Pact 생성 로직을 실행한다.
  - 내부 로직은 충돌 가능성이 높은 항목만 추려 약속을 생성한다.
  - Gemini API 호출이 실패해도 fallback 생성으로 응답을 유지한다.

- Request Body:

```json
{
  "profile_id": "profile-a1b2c3d4"
}
```

- 성공 응답 1: 첫 번째 사용자가 먼저 확정한 경우

```json
{
  "status": "pending",
  "room": {
    "room_id": "room-9b21f4cd10",
    "roommate_confirmation": {
      "status": "pending",
      "requested_by_profile_id": "profile-a1b2c3d4",
      "pending_for_profile_id": "profile-b2c3d4e5",
      "participant_a_confirmed_at": "2026-08-28T10:18:00+00:00",
      "participant_b_confirmed_at": null,
      "confirmed_profile_ids": [
        "profile-a1b2c3d4"
      ],
      "confirmed_at": null
    }
  }
}
```

- 성공 응답 2: 두 번째 사용자까지 확정되어 약속이 생성된 경우

```json
{
  "status": "confirmed",
  "room": {
    "room_id": "room-9b21f4cd10",
    "roommate_confirmation": {
      "status": "confirmed",
      "requested_by_profile_id": "profile-b2c3d4e5",
      "pending_for_profile_id": null,
      "participant_a_confirmed_at": "2026-08-28T10:18:00+00:00",
      "participant_b_confirmed_at": "2026-08-28T10:20:00+00:00",
      "confirmed_profile_ids": [
        "profile-a1b2c3d4",
        "profile-b2c3d4e5"
      ],
      "confirmed_at": "2026-08-28T10:20:00+00:00"
    }
  },
  "pact": {
    "room_id": "room-9b21f4cd10",
    "participant_a_profile_id": "profile-a1b2c3d4",
    "participant_b_profile_id": "profile-b2c3d4e5",
    "rules": [
      "민수 & 서연는 지인 초대가 필요하면 최소 하루 전에 서로에게 먼저 공유한다.",
      "민수 & 서연는 서로의 방이나 개인 공간에 들어갈 때 먼저 노크하거나 허락을 구한다.",
      "민수 & 서연는 공용 물건 정리와 설거지를 늦어도 당일 안에 끝낸다."
    ],
    "source": "fallback",
    "conflict_topics": [
      {
        "code": "guest_frequency",
        "label": "방문객 허용 빈도",
        "severity": 93,
        "reason": "손님 방문 허용 범위 차이가 커서 사전 합의가 없으면 바로 갈등으로 이어질 수 있어요.",
        "draft_rule": "민수 & 서연는 지인 초대가 필요하면 최소 하루 전에 서로에게 먼저 공유한다."
      }
    ],
    "generated_at": "2026-08-28T10:20:00+00:00",
    "updated_at": "2026-08-28T10:20:00+00:00"
  }
}
```

### `GET /chat-rooms/{room_id}/pact`

- 용도: 확정된 룸메이트 조합의 약속 재조회
- 공개 호출 예시: `GET /api/chat-rooms/{room_id}/pact?profile_id={profile_id}`
- 기능명세:
  - 이미 생성된 약속을 다시 불러온다.
  - 채팅 재진입, 약속 화면 진입, 확정 이후 재조회에 사용할 수 있다.

- 성공 응답:

```json
{
  "status": "ok",
  "pact": {
    "room_id": "room-9b21f4cd10",
    "participant_a_profile_id": "profile-a1b2c3d4",
    "participant_b_profile_id": "profile-b2c3d4e5",
    "rules": [
      "민수 & 서연는 지인 초대가 필요하면 최소 하루 전에 서로에게 먼저 공유한다."
    ],
    "source": "fallback",
    "conflict_topics": [
      {
        "code": "guest_frequency",
        "label": "방문객 허용 빈도",
        "severity": 93,
        "reason": "손님 방문 허용 범위 차이가 커서 사전 합의가 없으면 바로 갈등으로 이어질 수 있어요.",
        "draft_rule": "민수 & 서연는 지인 초대가 필요하면 최소 하루 전에 서로에게 먼저 공유한다."
      }
    ],
    "generated_at": "2026-08-28T10:20:00+00:00",
    "updated_at": "2026-08-28T10:20:00+00:00"
  }
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
