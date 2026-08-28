# Handoff Log — 에이전트 간 핸드오프 기록

> 작업을 마칠 때 아래 양식을 복사하여 기록을 추가한다.

---

## 양식

```markdown
### [날짜] — Task ID

- **Agent**: (Kiro / Codex / Claude Code)
- **Task**: (Task ID 및 요약)
- **변경 파일**:
  - `path/to/file1`
  - `path/to/file2`
- **테스트 결과**: (PASS / FAIL — 실패 시 사유)
- **남은 작업**:
  - (후속 조치 또는 블로커)
- **비고**: (기타 참고 사항)
```

---

## 기록

### 2026-08-28 — TASK-P1-14

- **Agent**: Claude Code
- **Task**: TASK-P1-14 매칭 요청 목록 조회 API 추가 및 프론트 후보→채팅→룸메이트 확정 흐름을 로컬 시뮬레이션에서 실제 API 연결로 전환
- **배경**: 사용자가 "만든 API 통신들과 연결되게 작업을 했어?"라고 물어 전수 점검한 결과, `candidates` 화면에서 후보를 선택하면 `requestChatMatch()`가 `POST /profiles/{id}/match-requests`를 전혀 호출하지 않고 `localStorage`에 가짜 대화를 만들어 2.5초 뒤 스스로 "수락됨"으로 바꾸는 구조였음을 확인했다. 이 가짜 `room_id`(`local-room-...`)가 이후 메시지 조회·룸메이트 확정까지 전부 로컬 분기를 타게 만들어, 실제 인터뷰 차이를 반영한 백엔드 Pact 대신 하드코딩된 가짜 Pact가 노출되고 있었다. 원인은 백엔드에 "내 매칭 요청 목록 조회" API가 없어 상대방이 요청을 확인/수락할 방법 자체가 없었기 때문이었다. 아키텍처 변경이 필요한 사안이라 `requirements.md`(FR-01.13, FR-08.14)와 `design.md`(채팅 설계 하위에 "매칭 요청 목록 조회 및 프론트 연결" 절 추가)를 먼저 갱신하고 `TASK-P1-14`를 정식으로 추가한 뒤 구현했다.
- **변경 파일**:
  - `.kiro/specs/roompact-campus/requirements.md`
  - `.kiro/specs/roompact-campus/design.md`
  - `.kiro/specs/roompact-campus/tasks.md`
  - `backend/src/main_backend/services/storage.py` (`list_match_requests_for_profile` — Local/DynamoDB/Postgres 3개 백엔드 모두 구현)
  - `backend/src/main_backend/services/chat_service.py` (`list_match_requests` — peer 요약 및 `room_id` 포함)
  - `backend/src/main_backend/routes/chat.py` (`GET /profiles/{profile_id}/match-requests`)
  - `backend/tests/main_backend/test_chat.py`
  - `docs/api/main-backend.md`, `docs/api/main-backend-openapi.json`
  - `frontend/roomonic-nextjs/lib/mockApi.js` (`getChatInbox`, `requestChatMatch`를 실제 API 기준으로 재작성, `acceptMatchRequest` 추가, `mapMatchRequestToInboxItem` 매핑 헬퍼 추가)
  - `frontend/roomonic-nextjs/app/chat/page.js` (받은 요청 수락 버튼 추가, 목록/네비게이션을 현재 프로필 기준으로 수정)
  - `frontend/roomonic-nextjs/app/candidates/[id]/page.js` (미연결 상태였던 `createChatRoom` 직접 호출을 실제 매칭 요청 흐름으로 교체 — 이 페이지는 어디서도 링크되지 않은 상태였음)
- **테스트 결과**: PASS — `pytest backend/tests` 38건, `ruff check src tests`, 로컬 백엔드(임시 포트, 로컬 JSON 저장소, 운영 DB 미접근)에서 curl로 프로필 A/B 생성 → 매칭 요청 → B 시점 목록 조회(`pending`, `room_id: null`) → 수락 → A 시점 목록 조회(`accepted`, 실제 `room_id` 포함) → `does-not-exist` 프로필 404 확인. `npm run build` 통과.
- **남은 작업**:
  - 실제 두 사용자(두 브라우저/기기)로 후보 선택→요청→수락→채팅→룸메이트 확정까지의 클릭 흐름은 미검증 — `.env.local`이 운영 EC2를 가리키고 있어 운영 데이터를 건드리지 않기 위해 API 레벨 검증으로 대체함.
  - 운영 EC2 PostgreSQL에는 아직 이번 변경이 반영되지 않음 — 재배포 필요 (스키마 변경은 없음, 코드만 배포하면 됨).
  - "연습 모드"(`seedPracticeData`)는 의도적으로 그대로 두었다 — 로그인 없이 데모를 보여주는 용도이므로 실제 사용자 흐름과는 분리 유지.
- **비고**: 이번 건은 "API를 만들었다"와 "프론트가 그 API를 실제로 호출한다"가 다르다는 걸 보여주는 사례였다. 앞으로 새 백엔드 엔드포인트를 추가할 때는 프론트의 어느 화면이 그 엔드포인트를 실제로 호출하는지까지 함께 확인하는 게 좋겠다.

### 2026-08-28 — TASK-P1-13 후속 (프론트 약속 화면 정리)

- **Agent**: Claude Code
- **Task**: TASK-P1-13 남은 작업 중 "약속 화면에서 conflict_topics와 rules 노출 방식 정리" 처리
- **변경 파일**:
  - `docs/api/main-backend-openapi.json` (`backend/scripts/export_openapi.py`로 재생성해 실제 스키마와 동기화, `ValidationError.input`/`ctx` 필드 누락분 반영)
  - `frontend/roomonic-nextjs/lib/mockApi.js` (`getRulesReview`가 `getRulesDraft`와 동일하게 실제 `/chat-rooms/{room_id}/pact` 결과를 사용하도록 연결. 기존에는 `RULES_REVIEW` 목업 고정값만 반환해 확정 화면(초안)과 검토 화면의 약속 내용이 서로 달랐음)
- **테스트 결과**: PASS — 로컬 백엔드(임시 포트 8123, `ROOMPACT_STORAGE_BACKEND` 미설정으로 로컬 JSON 저장소 사용, 운영 DB 미접근)에서 프로필 생성→인터뷰 저장→매칭 요청/수락→채팅방 생성→룸메이트 상호 확정→`GET /pact` 전 과정을 curl로 재현해 `rules`/`conflict_topics` 응답 구조 확인. `npm run build` 통과. `pytest backend/tests/main_backend/test_chat.py` 6건 통과.
- **남은 작업**:
  - 실제 브라우저(Chat → 확정 → `/rules/draft` → `/rules/review`) 클릭 흐름은 미검증 — 로컬 `.env.local`의 `NEXT_PUBLIC_API_BASE_URL`이 운영 EC2를 가리키고 있어, 운영 데이터를 건드리지 않기 위해 API 레벨 검증으로 대체함. 로컬 백엔드로 브라우저 E2E를 하려면 `NEXT_PUBLIC_API_BASE_URL`을 임시로 로컬 주소로 바꿔서 확인 필요.
  - `rules/review` 화면의 개별 규칙 동의/수정요청 상태(`agreed`/`revise`/`pending`)는 백엔드에 저장되는 상태가 아니라 프론트 표시용 기본값(`pending`)만 채움 — 실제 개별 동의 상태를 서버에 남기려면 별도 API/Task 필요 (Spec에 없는 범위라 이번에는 추가하지 않음).
- **비고**: `next lint`는 이 프로젝트에 ESLint 설정이 아직 없어(대화형 초기 설정 프롬프트만 뜸) 실행하지 못함 — 별도 Task로 처리 필요.

### 2026-08-28 — TASK-P1-13

- **Agent**: Codex
- **Task**: TASK-P1-13 룸메이트 확정 후 Pact 생성 추가
- **변경 파일**:
  - `.kiro/specs/roompact-campus/tasks.md`
  - `backend/.env.example`
  - `backend/scripts/export_openapi.py`
  - `backend/src/ai_backend/pact.py`
  - `backend/src/main_backend/routes/chat.py`
  - `backend/src/main_backend/services/chat_service.py`
  - `backend/src/main_backend/services/storage.py`
  - `backend/tests/main_backend/test_chat.py`
  - `backend/tests/main_backend/test_profiles.py`
  - `deploy/postgres/schema.sql`
  - `docs/api/main-backend.md`
  - `docs/api/main-backend-openapi.json`
  - `frontend/roomonic-nextjs/lib/mockApi.js`
- **테스트 결과**: PASS — `.\.venv\Scripts\python.exe -m pytest backend/tests/main_backend/test_chat.py`, `.\.venv\Scripts\python.exe -m ruff check backend/src backend/tests`, `powershell -ExecutionPolicy Bypass -File .\backend\scripts\verify.ps1`, `.\.venv\Scripts\python.exe backend/scripts/export_openapi.py`
- **남은 작업**:
  - EC2 운영 환경에서 룸메이트 확정 후 약속 생성 응답 확인
  - 약속 화면에서 `conflict_topics`와 `rules` 노출 방식 정리
- **비고**: 메인 백엔드는 룸메이트 확정 시 내부 Pact 생성 로직을 실행하고, Gemini API 호출 실패 시 fallback 생성으로 약속 응답을 유지한다.

### 2026-08-28 — Pact 생성 설계 반영

- **Agent**: Codex
- **Task**: 룸메이트 확정 후 충돌 가능 항목 기반 약속 생성 아키텍처와 후속 Task 정의
- **변경 파일**:
  - `.kiro/specs/roompact-campus/requirements.md`
  - `.kiro/specs/roompact-campus/design.md`
  - `.kiro/specs/roompact-campus/tasks.md`
- **테스트 결과**: N/A — Spec 문서 정리 작업
- **남은 작업**:
  - `TASK-P1-13` 구현
  - Pact 생성/조회 API 구체화
- **비고**: 약속 생성은 공통 규칙 나열이 아니라, 두 사람 인터뷰 차이와 Hardcut 조건을 비교해 실제 충돌 가능성이 높은 항목만 3~5개 추리는 구조로 정리함.

### 2026-08-28 — Hardcut 매칭 제외 반영

- **Agent**: Codex
- **Task**: 인터뷰의 `hardcut_conditions`를 추천/매칭 제외 규칙으로 반영
- **변경 파일**:
  - `.kiro/specs/roompact-campus/requirements.md`
  - `.kiro/specs/roompact-campus/design.md`
  - `.kiro/specs/roompact-campus/tasks.md`
  - `backend/src/ai_backend/scoring.py`
  - `backend/tests/ai_backend/test_ai_backend.py`
  - `backend/tests/main_backend/test_profiles.py`
  - `docs/api/main-backend.md`
- **테스트 결과**: PASS — `.venv\Scripts\python.exe -m pytest tests/ai_backend/test_ai_backend.py`, `.venv\Scripts\python.exe -m pytest tests/main_backend/test_profiles.py`
- **남은 작업**:
  - `반려동물 필수`, `주야간 근무 불일치` 같은 일부 Hardcut은 현재 인터뷰 필드 기반의 근사 규칙이라 전용 질문 추가 여부를 추후 검토
- **비고**: Hardcut 충돌이 감지되면 점수와 무관하게 `eligible = false`로 처리되어 추천 목록에서 제외된다.

### 2026-08-28 — 인터뷰 API hardcut 반영

- **Agent**: Codex
- **Task**: 프로필 인터뷰 저장/조회 API에 `hardcut_conditions` 필드 추가 및 최대 3개 검증 반영
- **변경 파일**:
  - `backend/src/main_backend/routes/profiles.py`
  - `backend/tests/main_backend/test_profiles.py`
  - `docs/api/main-backend.md`
  - `docs/api/main-backend-openapi.json`
- **테스트 결과**: PASS — `.venv\Scripts\python.exe -m pytest tests/main_backend/test_profiles.py`, `.venv\Scripts\python.exe scripts/export_openapi.py`
- **남은 작업**:
  - 추천 제외 로직에 `hardcut_conditions`를 어떻게 연결할지 별도 규칙 정의
- **비고**: 프론트는 인터뷰 최종 제출 payload에 `hardcut_conditions: string[]`를 포함해 최대 3개까지 보낼 수 있다.

### 2026-08-28 — TASK-P1-11

- **Agent**: Codex
- **Task**: TASK-P1-11 카카오 소셜 로그인 연동 추가
- **변경 파일**:
  - `.kiro/specs/roompact-campus/requirements.md`
  - `.kiro/specs/roompact-campus/design.md`
  - `.kiro/specs/roompact-campus/tasks.md`
  - `backend/.env.example`
  - `backend/src/main_backend/routes/api.py`
  - `backend/src/main_backend/routes/auth.py`
  - `backend/src/main_backend/routes/profiles.py`
  - `backend/src/main_backend/services/auth_service.py`
  - `backend/src/main_backend/services/storage.py`
  - `backend/tests/main_backend/test_auth.py`
  - `deploy/postgres/schema.sql`
  - `docs/api/main-backend.md`
  - `docs/api/main-backend-openapi.json`
  - `frontend/roomonic-nextjs/app/auth/kakao/callback/page.js`
  - `frontend/roomonic-nextjs/app/login/page.js`
  - `frontend/roomonic-nextjs/app/page.js`
  - `frontend/roomonic-nextjs/app/profile/page.js`
  - `frontend/roomonic-nextjs/app/signup/page.js`
  - `frontend/roomonic-nextjs/lib/mockApi.js`
  - `scripts/install-postgres.sh`
- **테스트 결과**: PASS — `pytest backend/tests/main_backend`, `npm run build`
- **남은 작업**:
  - 운영 프론트와 백엔드 env의 `KAKAO_REDIRECT_URI`를 실제 공개 주소 기준으로 유지
  - 프론트가 서비스 access token을 활용해 보호 API를 붙일지 결정
- **비고**: 카카오 로그인은 프론트 콜백에서 인가 코드를 받고, 메인 백엔드가 토큰 교환과 사용자 저장을 처리하도록 구성함.

### 2026-08-28 — TASK-P1-10

- **Agent**: Codex
- **Task**: TASK-P1-10 상호 수락 완료 후에만 채팅이 열리도록 채팅 게이트 추가
- **변경 파일**:
  - `.kiro/specs/roompact-campus/requirements.md`
  - `.kiro/specs/roompact-campus/design.md`
  - `.kiro/specs/roompact-campus/tasks.md`
  - `backend/src/main_backend/routes/chat.py`
  - `backend/src/main_backend/services/chat_service.py`
  - `backend/src/main_backend/services/storage.py`
  - `backend/tests/main_backend/test_chat.py`
  - `deploy/postgres/schema.sql`
  - `docs/api/main-backend.md`
  - `docs/api/main-backend-openapi.json`
- **테스트 결과**: PASS — `.\.venv\Scripts\python.exe -m pytest backend/tests/main_backend/test_chat.py`, `powershell -ExecutionPolicy Bypass -File .\backend\scripts\verify.ps1`
- **남은 작업**:
  - 운영 EC2 PostgreSQL에 `match_requests` 테이블 반영 후 재배포
  - 프론트 팀이 요청 생성/수락 UI 흐름에 새 엔드포인트를 연결
- **비고**: 채팅방은 이제 상호 수락 상태일 때만 생성되며, WebSocket과 메시지 이력은 기존처럼 승인된 방 기준으로 동작함.

### 2026-08-28 — TASK-P1-09

- **Agent**: Codex
- **Task**: TASK-P1-09 추천 후보 간 실시간 채팅 기능 추가
- **변경 파일**:
  - `.kiro/specs/roompact-campus/requirements.md`
  - `.kiro/specs/roompact-campus/design.md`
  - `.kiro/specs/roompact-campus/tasks.md`
  - `backend/src/main_backend/app.py`
  - `backend/src/main_backend/routes/api.py`
  - `backend/src/main_backend/routes/chat.py`
  - `backend/src/main_backend/services/chat_service.py`
  - `backend/src/main_backend/services/storage.py`
  - `backend/tests/main_backend/test_chat.py`
  - `deploy/nginx/roompact.conf`
  - `deploy/postgres/schema.sql`
  - `docs/api/main-backend.md`
  - `docs/api/main-backend-openapi.json`
  - `frontend/roomonic-nextjs/app/candidates/[id]/page.js`
  - `frontend/roomonic-nextjs/app/chat/page.js`
  - `frontend/roomonic-nextjs/lib/mockApi.js`
- **테스트 결과**: PASS — `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`, `.\.venv\Scripts\python.exe -m pytest tests/main_backend/test_chat.py`, `npm run build`
- **남은 작업**:
  - EC2 `nginx`와 PostgreSQL 스키마에 이번 채팅 변경을 실제 배포 반영
  - 프론트 전체 화면이 실제 프로필 생성 흐름과 완전히 연결되도록 나머지 목업 화면 정리
- **비고**: 메인 백엔드가 1:1 채팅방 생성, 메시지 이력 조회, WebSocket 브로드캐스트를 담당하고 프론트 채팅 화면은 실제 API/WebSocket 연결을 사용하도록 전환함.

### 2026-08-28 — TASK-P1-08

- **Agent**: Codex
- **Task**: TASK-P1-08 지역 불일치 감점 강화
- **변경 파일**:
  - `.kiro/specs/roompact-campus/tasks.md`
  - `backend/src/ai_backend/scoring.py`
  - `backend/tests/ai_backend/test_ai_backend.py`
  - `docs/api/main-backend.md`
- **테스트 결과**: PASS — `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`
- **남은 작업**:
  - 운영 EC2 재배포 시 추천 점수 변화 체감 확인
- **비고**: 지역이 다를 때 감점을 `-30`으로 높여 실제 생활권 차이가 추천 점수에 강하게 반영되도록 조정함.

### 2026-08-28 — TASK-P1-07

- **Agent**: Codex
- **Task**: TASK-P1-07 인터뷰 제출 기반 자동 추천 후보 시스템 추가
- **변경 파일**:
  - `.kiro/specs/roompact-campus/requirements.md`
  - `.kiro/specs/roompact-campus/design.md`
  - `.kiro/specs/roompact-campus/tasks.md`
  - `backend/src/main_backend/routes/profiles.py`
  - `backend/src/main_backend/services/profile_service.py`
  - `backend/src/main_backend/services/storage.py`
  - `backend/tests/main_backend/test_profiles.py`
  - `deploy/postgres/schema.sql`
  - `docs/api/main-backend.md`
  - `docs/api/main-backend-openapi.json`
- **테스트 결과**: PASS — `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`, `.\.venv\Scripts\python.exe scripts/export_openapi.py`
- **남은 작업**:
  - 프론트가 추천 카드 UI에서 `reasons`와 `conflict_summary`를 어떻게 노출할지 확정
  - 운영 EC2 배포 시 PostgreSQL에 `profile_recommendations` 테이블 생성 반영
- **비고**: 인터뷰 저장 시 추천 후보를 자동 계산하며, 신규 제출자 저장 시 기존 제출자 추천 목록도 함께 갱신되도록 구현함. 추천 후보는 `score >= 70` 상위 3건만 유지함.

### 2026-08-27 — TASK-P1-06

- **Agent**: Codex
- **Task**: TASK-P1-06 인터뷰 및 캐릭터 기반 매칭 점수 계산 고도화
- **변경 파일**:
  - `.kiro/specs/roompact-campus/tasks.md`
  - `backend/src/ai_backend/app.py`
  - `backend/src/ai_backend/handler.py`
  - `backend/src/ai_backend/scoring.py`
  - `backend/src/main_backend/routes/sessions.py`
  - `backend/tests/ai_backend/test_ai_backend.py`
  - `backend/tests/main_backend/test_app.py`
  - `docs/api/main-backend.md`
  - `docs/api/main-backend-openapi.json`
- **테스트 결과**: PASS — `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`, `.\.venv\Scripts\python.exe scripts/export_openapi.py`
- **남은 작업**:
  - 저장된 프로필과 인터뷰를 기준으로 세션 payload를 자동 조립하는 API 추가 여부 검토
  - 매칭 결과 설명 문구를 프론트 UX에 맞게 다듬기
- **비고**: 기존 `lifestyle/preferences` 입력은 유지하고, `interview`, `character`, `region`, `move_in_period`, `stay_duration_months`가 포함되면 인터뷰 기반 정밀 매칭을 우선 사용하도록 확장함.

### 2026-08-27 — TASK-P0-13

- **Agent**: Codex
- **Task**: TASK-P0-13 인터뷰 응답 기반 캐릭터 분류 산출 추가
- **변경 파일**:
  - `.kiro/specs/roompact-campus/requirements.md`
  - `.kiro/specs/roompact-campus/design.md`
  - `.kiro/specs/roompact-campus/tasks.md`
  - `backend/src/main_backend/services/character_classifier.py`
  - `backend/src/main_backend/services/profile_service.py`
  - `backend/tests/main_backend/test_profiles.py`
  - `docs/api/main-backend.md`
- **테스트 결과**: PASS — `backend/scripts/verify.ps1`, `backend/scripts/export_openapi.py`
- **남은 작업**:
  - 캐릭터 분류 결과를 향후 매칭 설명 로직과 연결
- **비고**: 인터뷰 저장/조회 응답에 `rule_score`, `sharing_score`, `type_code`, `type_name`, `top_factors`를 함께 반환함.

### 2026-08-27 — TASK-P1-05

- **Agent**: Codex
- **Task**: TASK-P1-05 단일 EC2 내부 PostgreSQL 저장소 구성
- **변경 파일**:
  - `.kiro/specs/roompact-campus/requirements.md`
  - `.kiro/specs/roompact-campus/design.md`
  - `.kiro/specs/roompact-campus/tasks.md`
  - `backend/pyproject.toml`
  - `backend/.env.example`
  - `backend/src/main_backend/services/storage.py`
  - `deploy/postgres/schema.sql`
  - `scripts/install-postgres.sh`
  - `scripts/deploy-ec2.sh`
- **테스트 결과**: PASS — `backend/scripts/verify.ps1`, `bash -n scripts/deploy-ec2.sh`, `bash -n scripts/install-postgres.sh`, EC2 재배포 후 공개 API 저장 확인
- **남은 작업**:
  - Gemini 실사용 API 키와 모델 설정 확인
- **비고**: 운영 저장소를 EC2 내부 PostgreSQL로 전환하고, 로컬 JSON은 개발 fallback으로 유지함.

### 2026-08-27 — EC2-CONFIG

- **Agent**: Codex
- **Task**: EC2 서비스가 `backend/.env`를 읽도록 배포 설정 보강
- **변경 파일**:
  - `deploy/systemd/roompact-main-backend.service`
  - `deploy/systemd/roompact-ai-backend.service`
  - `scripts/deploy-ec2.sh`
- **테스트 결과**: PASS — `bash -n scripts/deploy-ec2.sh`, EC2 재배포 후 서비스 재기동 확인
- **남은 작업**:
  - DynamoDB를 실제 운영 저장소로 쓸 경우 `.env` 값과 IAM 권한 설정
- **비고**: 기존 EC2는 환경변수 미설정으로 기본 로컬 JSON 저장을 사용하고 있었음. 이후부터는 `backend/.env`가 운영 설정의 기준이 됨.

### 2026-08-27 — TASK-P0-12

- **Agent**: Codex
- **Task**: TASK-P0-12 메인 백엔드 프로필 인터뷰 저장/조회 API 추가
- **변경 파일**:
  - `.kiro/specs/roompact-campus/requirements.md`
  - `.kiro/specs/roompact-campus/design.md`
  - `.kiro/specs/roompact-campus/tasks.md`
  - `backend/src/main_backend/routes/profiles.py`
  - `backend/src/main_backend/services/profile_service.py`
  - `backend/src/main_backend/services/storage.py`
  - `backend/tests/main_backend/test_profiles.py`
  - `docs/api/main-backend.md`
- **테스트 결과**: PASS — `backend/scripts/verify.ps1`, `backend/scripts/export_openapi.py`
- **남은 작업**:
  - 프론트 입력 폼과 실제 필드명 매핑 확정
- **비고**: 인터뷰는 프로필 하위 리소스로 저장하며, 시간 입력은 `10분` 단위 형식 검증을 적용함.

### 2026-08-27 — TASK-P1-04

- **Agent**: Codex
- **Task**: TASK-P1-04 공개 API를 nginx 80 포트 `/api` 경로로 노출
- **변경 파일**:
  - `.kiro/specs/roompact-campus/requirements.md`
  - `.kiro/specs/roompact-campus/design.md`
  - `.kiro/specs/roompact-campus/tasks.md`
  - `backend/src/main_backend/app.py`
  - `deploy/nginx/roompact.conf`
  - `scripts/install-nginx-site.sh`
  - `scripts/deploy-ec2.sh`
  - `docs/api/main-backend.md`
  - `docs/api/backend-workflow.md`
- **테스트 결과**: PASS — `backend/scripts/verify.ps1`, `bash -n scripts/deploy-ec2.sh`, `bash -n scripts/install-nginx-site.sh`, `GET /api/health`
- **남은 작업**:
  - EC2 보안 그룹에서 `80/tcp` 공개 여부 확인
  - 프론트가 `/api` 기준으로 base URL을 사용하도록 반영
- **비고**: 내부 애플리케이션 포트는 `8000/8001`로 유지하고, 외부 공개는 nginx 단일 진입점으로 정리함.

### 2026-08-27 — API-DOCS

- **Agent**: Codex
- **Task**: 메인 백엔드 API 계약 문서와 OpenAPI 산출물, 향후 API 추가 워크플로 정리
- **변경 파일**:
  - `backend/src/main_backend/app.py`
  - `backend/src/main_backend/routes/api.py`
  - `backend/scripts/export_openapi.py`
  - `docs/api/main-backend.md`
  - `docs/api/main-backend-openapi.json`
  - `docs/api/backend-workflow.md`
  - `.kiro/steering/structure.md`
- **테스트 결과**: PASS — `backend/scripts/verify.ps1`, `backend/scripts/export_openapi.py`
- **남은 작업**:
  - 프론트 요구사항에 맞춰 신규 메인 백엔드 API를 문서 우선으로 추가
- **비고**: 프론트는 사람용 문서 `docs/api/main-backend.md`와 기계용 스펙 `docs/api/main-backend-openapi.json`을 함께 사용할 수 있다.

### 2026-08-27 — REPO-STRUCTURE

- **Agent**: Codex
- **Task**: 백엔드 코드를 `backend/` 디렉토리로 분리해 프론트 작업과 공존 가능한 저장소 구조로 정리
- **변경 파일**:
  - `backend/pyproject.toml`
  - `backend/.env.example`
  - `backend/src/*`
  - `backend/tests/*`
  - `backend/scripts/verify.ps1`
  - `scripts/deploy-ec2.sh`
  - `deploy/systemd/roompact-main-backend.service`
  - `deploy/systemd/roompact-ai-backend.service`
  - `.kiro/steering/structure.md`
  - `.gitignore`
- **테스트 결과**: PASS — `backend/scripts/verify.ps1`, `bash -n scripts/deploy-ec2.sh`
- **남은 작업**:
  - 프론트엔드 팀이 사용할 루트 디렉토리 구조 확정
- **비고**: EC2 배포 경로는 유지하되 실제 Python 앱 작업 디렉토리는 `/opt/roompact-campus/backend`로 변경함.

### 2026-08-27 — TASK-P0-10

- **Agent**: Codex
- **Task**: TASK-P0-02 ~ TASK-P0-10 AI 백엔드, 연결 계약, 결정론적 매칭, 저장, 통합 흐름 구현
- **변경 파일**:
  - `.env.example`
  - `pyproject.toml`
  - `src/main_backend/routes/sessions.py`
  - `src/main_backend/services/ai_backend_client.py`
  - `src/main_backend/services/session_service.py`
  - `src/main_backend/services/storage.py`
  - `src/ai_backend/app.py`
  - `src/ai_backend/handler.py`
  - `src/ai_backend/scoring.py`
  - `src/ai_backend/matching.py`
  - `src/ai_backend/scenario.py`
  - `src/ai_backend/negotiate.py`
  - `src/ai_backend/pact.py`
  - `src/ai_backend/llm_client.py`
  - `src/ai_backend/fallback.py`
  - `tests/conftest.py`
  - `tests/ai_backend/test_ai_backend.py`
  - `tests/main_backend/test_app.py`
  - `.kiro/specs/roompact-campus/tasks.md`
- **테스트 결과**: PASS — `ruff check .`, `pytest`, `scripts/verify.ps1`
- **남은 작업**:
  - `TASK-P1-01` 저장 시 lint+test Hook 추가
  - `TASK-P1-02` 금지 import 검사 Hook 추가
- **비고**: 기본 저장소는 로컬 JSON 파일이며, `ROOMPACT_STORAGE_BACKEND=dynamodb` 설정 시 DynamoDB 테이블을 사용할 수 있도록 구현함.

### 2026-08-27 — TASK-P1-03

- **Agent**: Codex
- **Task**: TASK-P1-03 단일 EC2 배포 자동화와 서비스 관리 구성
- **변경 파일**:
  - `.github/workflows/deploy-ec2.yml`
  - `scripts/deploy-ec2.sh`
  - `scripts/install-systemd-services.sh`
  - `deploy/systemd/roompact-main-backend.service`
  - `deploy/systemd/roompact-ai-backend.service`
  - `.kiro/specs/roompact-campus/requirements.md`
  - `.kiro/specs/roompact-campus/design.md`
  - `.kiro/specs/roompact-campus/tasks.md`
- **테스트 결과**: PASS — `scripts/verify.ps1`, `bash -n scripts/deploy-ec2.sh`, `bash -n scripts/install-systemd-services.sh`
- **남은 작업**:
  - EC2에 GitHub Actions secret 등록
  - EC2에 `pwsh` 설치 및 앱 디렉토리 초기화
- **비고**: AI 백엔드 미구현 상태를 고려해 배포 스크립트는 AI 서비스 재시작을 조건부 처리한다.

### 2026-08-27 — TASK-P0-01

- **Agent**: Codex
- **Task**: TASK-P0-01 일반 백엔드 서버 골격과 기본 API 구성
- **변경 파일**:
  - `pyproject.toml`
  - `src/main_backend/app.py`
  - `src/main_backend/routes/health.py`
  - `src/main_backend/routes/sessions.py`
  - `src/main_backend/services/session_service.py`
  - `tests/main_backend/test_app.py`
  - `scripts/verify.ps1`
  - `.kiro/specs/roompact-campus/tasks.md`
- **테스트 결과**: PASS — `scripts/verify.ps1`, `pytest`, `ruff` 통과
- **남은 작업**:
  - `TASK-P0-02` AI 백엔드 서버 골격 구성
  - `TASK-P0-03` 일반 백엔드와 AI 백엔드 연결 계약 구현
- **비고**: 로컬 검증은 `.venv` Python 3.12 환경 기준으로 설정함.

(아래에 최신 기록을 위에, 오래된 기록을 아래에 추가한다)
