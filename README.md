# Roomonic / RoomPACT Campus

Roomonic은 대학생과 청년 주거 환경에서 룸메이트를 더 안전하게 찾고, 대화하고, 약속까지 정리할 수 있도록 만든 룸메이트 매칭 웹앱이다.

이 저장소는 Kiro Spec과 Harness Engineering 방식으로 요구사항, 설계, 구현 범위를 통제하면서 만든 해커톤 프로젝트 코드베이스다.

## 핵심 기능

- 카카오 소셜 로그인
- 기본 프로필 생성 및 수정
- 생활 인터뷰 수집
- 생활 성향 기반 캐릭터 분류
- 추천 후보 조회 및 후보 상세 확인
- 상호 수락 기반 채팅방 생성
- WebSocket 실시간 채팅
- 읽지 않은 메시지 개수 관리
- 룸메이트 확정 양방향 승인
- AI 기반 룸메이트 약속 초안 생성
- 직접 서명 기반 약속 확정
- 네이버 지도 기반 주거 위치 탐색
- 국토교통부 오피스텔 전월세 실거래가 조회
- 미니게임 화면

## 아키텍처 요약

```text
User
  |
  v
Next.js Frontend (port 3000)
  |
  | HTTP / WebSocket
  v
Nginx /api proxy
  |
  v
Main Backend - FastAPI (port 8000)
  |
  | internal HTTP
  v
AI Backend - FastAPI (port 8001)
  |
  +--> Gemini API
  +--> PostgreSQL
  +--> Naver Map / Geocoding API
  +--> Public Data Portal APIs
```

운영 환경은 단일 EC2 인스턴스를 기준으로 구성한다.

- Frontend: Next.js
- Main Backend: FastAPI
- AI Backend: FastAPI
- Database: PostgreSQL
- Reverse Proxy: Nginx
- Process Manager: PM2, systemd
- Deploy: GitHub Actions over SSH

## 기술 스택

### Frontend

- Next.js `14.2.5`
- React `18.3.1`
- Tailwind CSS `3.4.4`
- App Router
- WebSocket client
- Static assets under `frontend/roomonic-nextjs/public`

### Backend

- Python `3.12`
- FastAPI `0.118.0`
- Uvicorn `0.37.0`
- httpx `0.28.1`
- psycopg `3.2.12`
- networkx `3.6.1`
- websockets `15.0.1`
- pytest `8.4.2`
- ruff `0.13.0`

### AI

- Gemini API
- AI 호출 진입점: `backend/src/ai_backend/llm_client.py`
- fallback 템플릿: `backend/src/ai_backend/fallback.py`
- 약속 생성 보조 RAG 로직: `backend/src/ai_backend/pact_rag.py`

AI는 매칭 점수를 직접 결정하지 않는다. 점수 계산과 추천 후보 결정은 백엔드 코드가 담당하고, Gemini는 대화 가이드와 약속 문장 생성처럼 자연어 품질이 중요한 부분에만 사용한다.

### Database

운영 DB는 PostgreSQL이다.

주요 테이블:

- `users`
- `profiles`
- `profile_interviews`
- `profile_recommendations`
- `match_requests`
- `chat_rooms`
- `chat_messages`
- `chat_room_reads`
- `roommate_pacts`
- `sessions`
- `match_results`

로컬 개발 fallback으로 JSON 저장소도 지원한다.

## 주요 흐름

### 회원가입 및 프로필

1. 사용자가 카카오 로그인을 한다.
2. 백엔드가 카카오 인가 코드를 교환해 서비스 사용자를 식별한다.
3. 신규 사용자는 기본 프로필을 생성한다.
4. 생활 인터뷰를 제출하면 성향 점수와 캐릭터 유형이 계산된다.
5. 홈 화면은 캐릭터, 유형, 생활 성향 요약을 보여준다.

### 추천 및 매칭

1. 사용자가 추천 후보를 조회한다.
2. 백엔드는 프로필, 지역, 입주 시기, 거주 기간, 생활 인터뷰, hardcut 조건을 기반으로 후보를 필터링한다.
3. 추천 점수 70점 이상 후보를 우선 노출한다.
4. 후보 상세 페이지에서 채팅 요청을 보낸다.
5. 상대가 요청을 수락하면 채팅방이 열린다.

### 채팅

1. 채팅방은 상호 수락 이후에만 열린다.
2. WebSocket으로 실시간 메시지를 주고받는다.
3. 채팅방 목록은 사용자별 `last_read_message_id` 또는 `last_read_at` 기준으로 읽지 않은 메시지 개수를 계산한다.
4. 사용자가 채팅방에 들어가면 해당 방의 메시지는 읽음 처리된다.

### 룸메이트 확정과 약속

1. 한쪽이 룸메이트 확정을 요청한다.
2. 상대방에게 확정 요청 알림이 전달된다.
3. 양쪽이 모두 확정해야 약속 생성 단계로 넘어간다.
4. AI 백엔드는 두 사람의 인터뷰 차이와 충돌 가능성이 높은 항목을 바탕으로 약속 초안을 만든다.
5. 사용자는 약속을 수정하거나 조항을 추가할 수 있다.
6. 두 사람이 서명하면 최종 약속판이 완성된다.

### 지도

1. 프론트는 네이버 Dynamic Map을 렌더링한다.
2. 위치 검색은 백엔드 `/api/map/geocode`를 통해 처리한다.
3. 실거래가는 백엔드 `/api/map/officetel-rents`를 통해 조회한다.
4. 공공데이터 인증키와 네이버 Geocoding Secret은 프론트에 노출하지 않는다.

## API 영역

주요 API 문서는 `docs/api/main-backend.md`에 정리한다.

대표 경로:

- `POST /api/auth/kakao/exchange`
- `GET /api/auth/me`
- `POST /api/profiles`
- `GET /api/profiles/{profile_id}`
- `PUT /api/profiles/{profile_id}`
- `PUT /api/profiles/{profile_id}/interview`
- `GET /api/profiles/{profile_id}/interview`
- `GET /api/profiles/{profile_id}/recommendations`
- `POST /api/profiles/{profile_id}/match-requests`
- `GET /api/profiles/{profile_id}/match-requests`
- `POST /api/match-requests/{request_id}/accept`
- `POST /api/profiles/{profile_id}/chat-rooms`
- `GET /api/chat-rooms/{room_id}/messages`
- `POST /api/chat-rooms/{room_id}/read`
- `POST /api/chat-rooms/{room_id}/roommate-confirmation`
- `GET /api/chat-rooms/{room_id}/pact`
- `PUT /api/chat-rooms/{room_id}/pact`
- `POST /api/chat-rooms/{room_id}/signatures`
- `GET /api/map/geocode`
- `GET /api/map/officetel-rents`

WebSocket:

- `ws://<host>/api/ws/chat-rooms/{room_id}?profile_id={profile_id}`
- `ws://<host>/api/ws/profiles/{profile_id}/inbox`

## 프로젝트 구조

```text
.
├── .kiro/
│   ├── specs/roompact-campus/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── tasks.md
│   └── steering/
├── backend/
│   ├── src/ai_backend/
│   ├── src/main_backend/
│   ├── scripts/
│   └── tests/
├── deploy/
│   ├── postgres/
│   └── systemd/
├── docs/
│   ├── api/
│   ├── harness/
│   └── handoff.md
├── frontend/
│   └── roomonic-nextjs/
├── scripts/
└── README.md
```

## Kiro + Harness Engineering 운영 방식

이 프로젝트는 단순히 코드를 먼저 만드는 방식이 아니라, Kiro Spec을 중심으로 요구사항과 설계를 먼저 고정하고 구현을 진행한다.

- `.kiro/specs/*/requirements.md`: 무엇을 만들지 정의
- `.kiro/specs/*/design.md`: 어떻게 만들지 정의
- `.kiro/specs/*/tasks.md`: 어떤 순서로 만들지 정의
- `AGENTS.md`: AI 에이전트가 따라야 하는 공통 작업 규칙
- `docs/handoff.md`: 작업 인계와 운영 변경 기록

Harness Engineering 관점에서는 AI가 임의로 기능을 넓히지 않도록 다음 장치를 둔다.

- Spec을 Single Source of Truth로 사용
- Main Backend와 AI Backend 책임 분리
- LLM 호출 위치를 `llm_client.py`로 제한
- 점수 계산과 매칭 결정은 결정론적 코드로 처리
- 외부 API 키와 런타임 환경값은 `.env`에만 보관
- 작업 완료 시 검증과 handoff 기록 유지

## 로컬 실행

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
uvicorn main_backend.app:app --reload --host 0.0.0.0 --port 8000
```

AI 백엔드:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn ai_backend.app:app --reload --host 0.0.0.0 --port 8001
```

### Frontend

```powershell
cd frontend/roomonic-nextjs
npm install
npm run dev
```

기본 로컬 주소:

- Frontend: `http://localhost:3000`
- Main Backend: `http://localhost:8000`
- AI Backend: `http://localhost:8001`

## 환경변수

실제 값은 커밋하지 않는다. 키 이름만 `.env.example`에 기록한다.

주요 환경변수:

- `DATABASE_URL`
- `MAIN_BACKEND_BASE_URL`
- `AI_BACKEND_BASE_URL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`
- `KAKAO_REDIRECT_URI`
- `NAVER_MAP_CLIENT_ID`
- `NAVER_MAP_CLIENT_SECRET`
- `PUBLIC_DATA_SERVICE_KEY`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`

## 검증

Backend:

```powershell
.\backend\scripts\verify.ps1
```

Frontend:

```powershell
cd frontend/roomonic-nextjs
npm run build
```

## 배포

GitHub Actions의 `Deploy EC2` workflow는 `main` 브랜치 push 또는 수동 실행으로 동작한다.

배포 흐름:

1. GitHub Actions가 EC2에 SSH 접속
2. 지정된 앱 디렉토리에서 저장소 동기화
3. `scripts/deploy-ec2.sh` 실행
4. 백엔드 서비스와 프론트 프로세스 재시작

운영 서버에서 직접 수정된 내용이 있을 수 있으므로, 배포 전에는 EC2에 있는 최신 소스를 로컬과 GitHub에 먼저 동기화한다.

## 외부 서비스

- Kakao Developers: 소셜 로그인
- Gemini API: 대화 가이드 및 약속 문장 생성
- Naver Cloud Platform Maps: 지도 렌더링과 Geocoding
- 공공데이터포털: 국토교통부 오피스텔 전월세 실거래가

## 보안 원칙

- `.env`, `.env.local`, `.pem`, API Key는 커밋하지 않는다.
- 프론트에는 공개 가능한 Client ID만 둔다.
- Secret Key, 공공데이터 인증키, Gemini Key는 백엔드 환경변수로만 관리한다.
- PostgreSQL은 EC2 내부에서만 접근하도록 유지한다.
- 운영 DB 초기화 같은 파괴적 작업은 handoff에 기록한다.

## 현재 운영 메모

- EC2에는 배포된 소스와 런타임 파일이 함께 존재할 수 있다.
- GitHub에는 소스 코드만 저장하고 `.next`, `node_modules`, `.env*`, 런타임 데이터는 제외한다.
- 현재 저장소는 배포 서버의 최신 소스 스냅샷을 기준으로 정리되어 있다.
