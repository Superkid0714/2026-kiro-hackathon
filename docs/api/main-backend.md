# Main Backend API

이 문서는 프론트엔드 팀과 공유하는 `RoomPACT Campus` 메인 백엔드 API 계약 문서다.
현재 프론트는 메인 백엔드(`backend/src/main_backend/`)만 호출하고, AI 백엔드는 메인 백엔드 내부에서만 호출한다.

## Base URL

- Local: `http://localhost:8000`
- EC2: `http://15.134.137.117:8000`

## API 역할

- 학생 설문 세션 생성
- 세션 조회
- 세션 매칭 실행 요청
- 매칭 결과 조회
- AI 백엔드 오류를 프론트가 처리 가능한 구조로 전달

## 현재 구현된 엔드포인트

### `GET /health`

- 용도: 메인 백엔드 헬스체크
- 응답:

```json
{
  "status": "ok",
  "service": "main-backend"
}
```

### `POST /profiles`

- 용도: 기본 학생 프로필 생성
- 요청:

```json
{
  "nickname": "민수",
  "age": 22,
  "gender": "male",
  "region": "Gwangju",
  "move_in_period": "2026-09",
  "stay_duration_months": 6
}
```

- 성공 응답:

```json
{
  "status": "created",
  "profile": {
    "profile_id": "profile-a1b2c3d4",
    "nickname": "민수",
    "age": 22,
    "gender": "male",
    "region": "Gwangju",
    "move_in_period": "2026-09",
    "stay_duration_months": 6,
    "created_at": "2026-08-27T13:30:00+00:00"
  }
}
```

### `GET /profiles`

- 용도: 프로필 목록 조회
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
      "region": "Gwangju",
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
- 성공 응답:

```json
{
  "status": "ok",
  "profile": {
    "profile_id": "profile-a1b2c3d4",
    "nickname": "민수",
    "age": 22,
    "gender": "male",
    "region": "Gwangju",
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

### `POST /sessions`

- 용도: 학생 설문 세션 생성
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
      "required_rules": [
        "sleep=early"
      ],
      "preferences": {
        "sleep": 4,
        "noise": 2,
        "cleanliness": 3
      }
    },
    {
      "student_id": "S2",
      "lifestyle": {
        "sleep": "early",
        "noise": "high",
        "cleanliness": "medium"
      },
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
3. 응답에서 `session.session_id` 확보
4. `POST /sessions/{session_id}/match` 호출
5. 결과 화면은 `matches[]`를 바로 렌더링
6. 재조회가 필요하면 `GET /sessions/{session_id}/result` 호출

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
