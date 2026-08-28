### 2026-08-29 — Production API base URL fix

- **Agent**: Codex
- **Task**: 배포 프론트가 `localhost:8000`을 호출하던 문제 수정
- **변경 파일**:
  - EC2 `/home/ubuntu/frontend/roomonic-nextjs/.env.local`
  - `temp-frontend-deploy.tgz`
- **테스트 결과**: PASS — 프로덕션 API 주소로 재빌드, EC2 `/map`, `/home`, map chunk, `/api/map/officetel-rents` 응답 확인
- **남은 작업**:
  - 사용자 브라우저에서 강력 새로고침 후 이전 chunk 캐시 제거 확인
- **비고**: 로컬 `.env.local`의 `localhost:8000`이 프로덕션 빌드에 박혀 지도/추천/채팅 API가 사용자 기기 localhost로 향하던 문제를 해결했다.

### 2026-08-29 — Final pact page navigation polish

- **Agent**: Codex
- **Task**: 약속 완료 화면 하단 네비 표시와 공유 액션 재배치
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/final/page.js`
  - `frontend/roomonic-nextjs/components/BottomNav.jsx`
- **테스트 결과**: PASS — `frontend/roomonic-nextjs npm run build`, `backend/scripts/verify.ps1` (`71 passed`), EC2 `/final` 및 final chunk 200 확인
- **남은 작업**:
  - 실제 모바일에서 약속판 스크롤 하단과 하단 네비 간격 확인
- **비고**: 하단 홈/공유 버튼을 제거하고 공유는 상단 원형 아이콘으로 이동했다. 배경은 연보라/화이트 톤으로 맞추고 `/final`에서도 약속 nav가 활성 상태로 보이도록 조정했다.

### 2026-08-29 — Map search and pin placement fix

- **Agent**: Codex
- **Task**: 지도 검색 중 이전 실거래 데이터 노출 방지와 실거래 핀 좌표 보정
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/map/page.js`
  - `backend/src/main_backend/services/map_service.py`
  - `backend/tests/main_backend/test_map.py`
- **테스트 결과**: PASS — `frontend/roomonic-nextjs npm run build`, `backend/scripts/verify.ps1` (`71 passed`), EC2 `/map`, `/api/map/geocode`, `/api/map/officetel-rents` 응답 확인
- **남은 작업**:
  - 실제 모바일 브라우저에서 검색 모달 상단 위치와 가격 핀 시각 확인
- **비고**: 검색/지역 선택 중 이전 목록과 가격 핀을 숨기고, 실거래 주소 지오코딩 시 지역명 중복을 제거해 실제 건물 좌표가 붙도록 수정했다.
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

### 2026-08-29 — Home pre-interview CTA cleanup

- **Agent**: Codex
- **Task**: 홈 화면 생활 인터뷰 전 상태에서 예고 문구/카드 제거 및 보라색 CTA만 유지
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/home/page.js`
  - `docs/handoff.md`
- **테스트 결과**: PASS — 프론트 `npm run build`, EC2 프론트 빌드/PM2 재시작, `/home` 200, `/api/health` 200 확인
- **남은 작업**:
  - 실제 로그인 후 인터뷰 미완료 계정에서 CTA 노출 확인
- **비고**: `다음으로 열릴 화면`, `내 생활 분석 + 오늘의 후보 확인` 문구와 준비 상태 카드들을 제거하고 `생활 인터뷰 시작하기` 버튼만 보라색 CTA로 남겼다.

### 2026-08-29 — Map search modal and marker refinement

- **Agent**: Codex
- **Task**: 지도 검색 시 기존 실거래 목록 숨김, 지역 선택 모달 상단 배치, 가격/검색 위치 핀 표현 개선
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/map/page.js`
  - `docs/handoff.md`
- **테스트 결과**: PASS — 프론트 `npm run build`, EC2 프론트 빌드/PM2 재시작, `/map` 200, `/api/map/geocode` 200, `/api/map/officetel-rents` 200 확인
- **남은 작업**:
  - 실제 기기에서 네이버 지도 핀 위치감과 모달 위치 체감 확인
- **비고**: 검색 중 또는 지역 선택 모달이 열린 동안 이전 실거래 목록과 선택 거래 하단 카드를 숨긴다. 지역 선택 모달은 화면 상단에 띄우고, 가격 핀/검색 위치 핀에 하단 고정점과 z-index를 추가했다.

### 2026-08-29 — Minigame card thumbnails

- **Agent**: Codex
- **Task**: 미니게임 선택 카드에 게임별 썸네일 이미지 표시
- **변경 파일**:
  - `frontend/roomonic-nextjs/components/minigame/games.js`
  - `frontend/roomonic-nextjs/components/minigame/GameCard.jsx`
  - `docs/handoff.md`
- **테스트 결과**: PASS — 프론트 `npm run build`, EC2 프론트 빌드/PM2 재시작, `/minigame` 200, `/game/sadari.png` 200, `/game/malarng.png` 200, `/game/wordrush.png` 200 확인
- **남은 작업**:
  - 실제 모바일 화면에서 썸네일 크기와 카드 여백 체감 확인
- **비고**: 사다리 타기는 `sadari.png`, 말랑말랑은 `malarng.png`, Word Rush는 `wordrush.png`를 카드 제목 위 썸네일로 표시한다.

### 2026-08-29 — Map region picker and price pins

- **Agent**: Codex
- **Task**: 지도 검색 시 지역 선택 안내 모달 추가, 가격 핀 표현 개선
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/map/page.js`
  - `docs/handoff.md`
- **테스트 결과**: PASS — 프론트 `npm run build`, EC2 프론트 빌드/PM2 재시작, `/map` 200, `/api/map/geocode` 200, `/api/map/officetel-rents` 200 확인
- **남은 작업**:
  - 실제 모바일 지도에서 검색어별 지역 선택 모달과 핀 배치 체감 확인
- **비고**: 검색 결과를 바로 적용하지 않고 연결 가능한 지역을 선택하는 모달을 띄운다. 실거래 좌표가 부족한 경우에도 검색 중심 주변에 가격 핀이 보이도록 보정하고, 핀 디자인을 월세 중심 가격 마커로 정리했다.

### 2026-08-29 — Disable notification sound

- **Agent**: Codex
- **Task**: 룸메이트 확정 요청 알림에서 뽑기 오디오가 재생되는 문제 수정
- **변경 파일**:
  - `frontend/roomonic-nextjs/components/BottomNav.jsx`
  - `docs/handoff.md`
- **테스트 결과**: PASS — 프론트 `npm run build`, EC2 프론트 빌드/PM2 재시작, `/chat` 200, `/home` 200, `/api/health` 200 확인
- **남은 작업**:
  - 실제 모바일 브라우저에서 알림 모달 노출 시 무음 동작 확인
- **비고**: 전역 알림에서 뽑기용 mp3와 WebAudio 알림음을 제거했다. 알림은 모달과 진동만 사용한다.

### 2026-08-29 — Chat roommate confirmation CTA

- **Agent**: Codex
- **Task**: 상대가 먼저 룸메이트 확정을 누른 뒤 내 확정 버튼이 보이지 않는 문제 수정
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/chat/page.js`
  - `docs/handoff.md`
- **테스트 결과**: PASS — 프론트 `npm run build`, EC2 프론트 빌드/PM2 재시작, `/chat` 200, `/home` 200, `/api/health` 200 확인
- **남은 작업**:
  - 두 계정으로 실제 상호 확정 흐름 클릭 테스트
- **비고**: `roommate_confirmation.status=pending`이고 `pending_for_profile_id`가 현재 사용자일 때 하단 안내 박스 안에 `나도 룸메이트로 확정하기` 버튼을 표시한다. 채팅방 내부 모달에서도 바로 `나도 확정하기`를 실행할 수 있게 연결했다.

### 2026-08-29 — Map search-centered rent markers

- **Agent**: Codex
- **Task**: 지도 UI에서 대학 빠른 선택 칩 제거, 검색 위치 중심으로 최신 실거래 마커가 안정적으로 보이도록 조정
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/map/page.js`
  - `docs/handoff.md`
- **테스트 결과**: PASS — 프론트 `npm run build`, EC2 프론트 빌드/PM2 재시작, `/map` 200, `/api/map/officetel-rents` 200, `/api/map/geocode` 200 확인
- **남은 작업**:
  - 실제 지도 화면에서 검색어별 마커 분포 UX 확인
- **비고**: 대학 이름 칩은 화면에서 제거하고, 실거래 좌표가 없을 때도 검색 위치 또는 지역 중심 주변에 마커를 배치해 빈 지도처럼 보이지 않도록 했다. 거래 데이터는 기존처럼 최신 거래 우선으로 조회한다.

### 2026-08-29 — Candidate and empty-state UI cleanup

- **Agent**: Codex
- **Task**: 프로필 미설정 시 후보 뽑기 전 안내 우선순위 조정, 후보 없음 문구 정리, 생활 타입 전 CTA 버튼 가독성 수정, 빈 채팅 목록 보조 카드 제거
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/candidates/page.js`
  - `frontend/roomonic-nextjs/app/home/page.js`
  - `frontend/roomonic-nextjs/app/profile/page.js`
  - `frontend/roomonic-nextjs/app/chat/page.js`
  - `docs/handoff.md`
- **테스트 결과**: PASS — 프론트 `npm run build`, EC2 프론트 빌드/PM2 재시작, `/candidates`/`/home`/`/profile`/`/chat` 200 확인
- **남은 작업**:
  - 실제 모바일 브라우저에서 모달 노출 순서와 버튼 색상 체감 확인
- **비고**: 후보 뽑기는 프로필 ID가 없으면 먼저 프로필 설정 안내 모달을 띄운다. 후보 없음 모달에서는 테스트 데이터 관련 문구를 제거했고, 빈 채팅 화면에서는 `받은요청`/`대화가능` 박스를 제거했다.

### 2026-08-29 — Roommate confirmation notification

- **Agent**: Codex
- **Task**: 채팅방 룸메이트 확정 요청을 상대에게 전역 모달로 알리고, 양쪽 확정 후에만 약속 생성/진입되도록 보강
- **변경 파일**:
  - `backend/src/main_backend/services/chat_service.py`
  - `backend/tests/main_backend/test_chat.py`
  - `frontend/roomonic-nextjs/lib/mockApi.js`
  - `frontend/roomonic-nextjs/components/BottomNav.jsx`
  - `frontend/roomonic-nextjs/app/chat/page.js`
  - `docs/handoff.md`
- **테스트 결과**: PASS — 프론트 `npm run build`, `backend/scripts/verify.ps1` 70개 테스트 통과, EC2 배포 후 `/api/health`/`/chat`/`/rules/draft` 200
- **남은 작업**:
  - 실제 두 브라우저 계정으로 모달/소리 체감 확인
- **비고**: `match-requests` 목록과 inbox WebSocket snapshot에 `roommate_confirmation`을 포함하고, 상대가 확정해야 하는 상태를 알림 카운트와 모달로 반영한다. Pact는 두 참가자 모두 확정한 뒤에만 생성된다.

### 2026-08-29 — Profile 404 cleanup

- **Agent**: Codex
- **Task**: 삭제된 프로필 ID가 브라우저에 남아 `match-requests` 404를 반복 호출하는 문제 방어
- **변경 파일**:
  - `frontend/roomonic-nextjs/lib/mockApi.js`
  - `backend/src/main_backend/routes/map.py`
  - `backend/src/main_backend/services/map_service.py`
  - `docs/handoff.md`
- **테스트 결과**: PASS — 프론트 `npm run build`, EC2 프론트 빌드/PM2 재시작, `/home`/`/map`/`/game/word-rush` 200, `backend/scripts/verify.ps1`
- **남은 작업**:
  - 사용 중인 브라우저에서 새로고침 후 stale localStorage 정리 여부 확인
- **비고**: `profile_not_found` 응답을 받으면 `roomonic-profile`뿐 아니라 `roomonic-auth`, 채팅/추천/약속 로컬 상태까지 같이 정리한다. 지도 백엔드는 동작 변경 없이 lint 줄 길이만 정리했다.

### 2026-08-29 — Map latest transactions

- **Agent**: Codex
- **Task**: 지도 실거래가를 월 고정이 아닌 지역별 최신 거래 기준으로 조회
- **변경 파일**:
  - `backend/src/main_backend/services/map_service.py`
  - `backend/tests/main_backend/test_map.py`
  - `frontend/roomonic-nextjs/app/map/page.js`
  - `docs/handoff.md`
- **테스트 결과**: PASS — 지도 테스트 9개 통과, 프론트 `npm run build`, `backend/scripts/verify.ps1`, EC2 배포 후 `/api/map/officetel-rents`가 `search_mode=latest`와 최신순 거래를 반환하는 것 확인
- **남은 작업**:
  - UI에서 필요하면 조회 월 범위를 별도 필터로 노출
- **비고**: `deal_ymd`를 지정하지 않으면 최근 월부터 과거 월로 최대 24개월까지 조회해 요청 개수만큼 최신 거래를 채운다. 특정 월 조회가 필요하면 기존처럼 `deal_ymd=YYYYMM`을 넘기면 된다.

### 2026-08-29 — Account DB cleanup

- **Agent**: Codex
- **Task**: 운영 PostgreSQL 계정/프로필 관련 데이터 전체 삭제
- **변경 파일**:
  - `docs/handoff.md`
- **테스트 결과**: PASS — 삭제 전 DB 백업 생성, `users`, `profiles`, `profile_interviews`, `profile_recommendations`, `match_requests`, `chat_rooms`, `chat_messages`, `chat_room_reads`, `roommate_pacts` 모두 0건 확인, `/api/health` 200 확인, 기존 프로필 조회 404 확인
- **남은 작업**:
  - 새 로그인/프로필 생성 플로우로 계정 재생성 테스트
- **비고**: 백업은 EC2 `/home/ubuntu/deploy-backups/roomonic-db-before-account-clean-20260828-200702.sql`에 남겼다. `sessions`, `match_results`는 계정 직접 데이터가 아니라 삭제하지 않았다.

### 2026-08-29 — Map search coverage

- **Agent**: Codex
- **Task**: 지도 위치 검색 범위 확장 및 검색 위치/실거래가 지역 자동 연결
- **변경 파일**:
  - `backend/src/main_backend/services/map_service.py`
  - `backend/tests/main_backend/test_map.py`
  - `frontend/roomonic-nextjs/app/map/page.js`
  - `docs/handoff.md`
- **테스트 결과**: PASS — `backend/.venv/Scripts/pytest.exe backend/tests/main_backend/test_map.py -q` 8개 통과, 프론트 `npm run build`, `backend/scripts/verify.ps1`, EC2 배포 후 `/api/map/geocode` 주요 장소 검색과 `/map` 200 확인
- **남은 작업**:
  - 더 많은 학교/역/동네 요청이 나오면 별칭 사전에 추가
- **비고**: 네이버 Geocoding이 장소명 검색에 약해 주요 대학/역/지역 별칭을 서버에서 보강하고, 검색 결과의 `region` 또는 `nearest_region`으로 프론트 실거래가 필터가 자동 전환되도록 수정했다.

### 2026-08-29 — Minigame nav restore

- **Agent**: Codex
- **Task**: 게임 메인 화면 하단 네비게이션 복구
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/minigame/page.js`
  - `docs/handoff.md`
- **테스트 결과**: PASS — 로컬 `npm run build`, EC2 `npm run build`, `backend/scripts/verify.ps1`, 공개 URL `/minigame`, `/game/word-rush`, `/game/ghost`, `/game/ladder`에서 네비 라벨 확인
- **남은 작업**:
  - 모바일 브라우저에서 실제 하단 고정 위치 확인
- **비고**: 게임 상세 화면에는 네비가 있었지만 게임 메인 `/minigame` 원본 복원 과정에서 빠져 있어 다시 추가했다.

### 2026-08-29 — Game nav restore

- **Agent**: Codex
- **Task**: 게임 상세 화면 하단 네비게이션 복구
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/game/word-rush/page.js`
  - `frontend/roomonic-nextjs/app/game/ghost/page.js`
  - `frontend/roomonic-nextjs/app/game/ladder/page.js`
  - `docs/handoff.md`
- **테스트 결과**: PASS — 로컬 `npm run build`, EC2 `npm run build`, `backend/scripts/verify.ps1`, 공개 URL `/game/word-rush`, `/game/ghost`, `/game/ladder`에서 하단 네비 라벨 확인
- **남은 작업**:
  - 실기기에서 게임 조작 중 하단 네비가 터치 영역을 과하게 가리지 않는지 확인
- **비고**: 원래 게임 구현은 유지하고 세 게임 페이지에 공통 `BottomNav`만 추가했다.

### 2026-08-29 — Game restore

- **Agent**: Codex
- **Task**: 임시 `/game/[slug]` 게임 페이지 제거 및 원래 게임 구현 복원
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/game/word-rush/page.js`
  - `frontend/roomonic-nextjs/app/game/ghost/page.js`
  - `frontend/roomonic-nextjs/app/game/ladder/page.js`
  - `frontend/roomonic-nextjs/app/minigame/page.js`
  - `frontend/roomonic-nextjs/components/word-rush/`
  - `frontend/roomonic-nextjs/components/ghost-game/`
  - `frontend/roomonic-nextjs/components/ladder/`
  - `frontend/roomonic-nextjs/components/minigame/`
  - `frontend/roomonic-nextjs/lib/useSpeechRecognition.js`
  - `frontend/roomonic-nextjs/data/words.js`
  - `frontend/roomonic-nextjs/public/game/`
- **테스트 결과**: PASS — 로컬 `npm run build`, EC2 `npm run build`, `backend/scripts/verify.ps1`, 공개 URL `/minigame`, `/game/word-rush`, `/game/ghost`, `/game/ladder` 200 확인
- **남은 작업**:
  - 실기기에서 각 게임의 터치/음성 인식/효과음 동작 확인
- **비고**: 스냅샷 `ec2_snapshot/frontend-src`의 원본 게임 라우트와 컴포넌트를 복원했고, EC2의 임시 `/game/[slug]` 라우트는 배포 백업 폴더로 이동했다.

### 2026-08-29 — Mock DB cleanup

- **Agent**: Codex
- **Task**: EC2 PostgreSQL에 남아 있던 목업/테스트 프로필 데이터 삭제
- **변경 파일**:
  - `docs/handoff.md`
- **테스트 결과**: PASS — 삭제 전 DB 백업 생성, 사용자 연결 없는 프로필 41개 삭제, 남은 프로필 5개 모두 사용자 연결 확인, 추천 API 빈 배열 응답 확인, `/api/health` 200 확인
- **남은 작업**:
  - 필요 시 실제 사용자끼리 추천 후보가 생기도록 생활 인터뷰 데이터를 다시 제출하거나 추천 재계산 트리거 실행
- **비고**: 백업은 EC2 `/home/ubuntu/deploy-backups/roomonic-db-before-mock-clean-20260829.sql`에 남겼다. 추천 캐시는 삭제된 목업 후보 참조를 제거하기 위해 비운 뒤 실제 사용자 5명에 대해 빈 추천 배열로 재생성했다.

### 2026-08-29 — Map guide and game route fix

- **Agent**: Codex
- **Task**: 지도 가이드 대학 5개 고정, 지도 설명 문구 제거, 게임 상세 라우트 404 복구
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/map/page.js`
  - `frontend/roomonic-nextjs/app/game/[slug]/page.js`
  - `frontend/roomonic-nextjs/app/favicon.ico/route.js`
  - `backend/src/main_backend/services/map_service.py`
  - `backend/tests/main_backend/test_map.py`
- **테스트 결과**: PASS — `pytest backend/tests/main_backend/test_map.py -q`, `npm run build`, `backend/scripts/verify.ps1`, EC2 배포 후 `/game/word-rush`, `/game/ladder`, `/game/ghost`, `/map`, `/api/map/geocode` 응답 확인
- **남은 작업**:
  - 실제 모바일 브라우저에서 대학 가이드 칩 클릭 후 지도 이동감 확인
- **비고**: 네이버 Geocoding이 일반 장소명 검색에 약한 점을 보완하기 위해 조선대/전남대/군산대/순천대/전북대 별칭 좌표를 백엔드에서 우선 처리한다.

### 2026-08-29 — TASK-P1-18

- **Agent**: Codex
- **Task**: 지도 탭에 국토부 오피스텔 전월세 실거래가 API 연동 추가
- **변경 파일**:
  - `.kiro/specs/roompact-campus/requirements.md`
  - `.kiro/specs/roompact-campus/design.md`
  - `.kiro/specs/roompact-campus/tasks.md`
  - `backend/pyproject.toml`
  - `backend/.env`
  - `backend/src/main_backend/routes/api.py`
  - `backend/src/main_backend/routes/map.py`
  - `backend/src/main_backend/services/map_service.py`
  - `backend/tests/main_backend/test_map.py`
  - `frontend/roomonic-nextjs/app/map/page.js`
- **테스트 결과**: PASS — `pytest backend/tests/main_backend/test_map.py -q`, `npm run build`, `backend/scripts/verify.ps1`, EC2 배포 후 공개 `/map`, `/api/map/officetel-rents`, `/api/map/geocode` 응답 확인
- **남은 작업**:
  - 실제 모바일 브라우저에서 지도 조작감과 마커 클릭 UX 확인
  - 필요 시 지역 목록을 더 넓히고 KOSIS 지표 카드 추가
- **비고**: 프론트는 `/api/map/officetel-rents`만 호출하고, 공공데이터 인증키는 백엔드에서만 사용하도록 정리했다.

### 2026-08-29 — Map exploration UI scaffold

- **Agent**: Codex
- **Task**: 네이버 지도 탭을 지역 필터 + 후보 매물 비교 화면으로 확장
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/map/page.js`
- **테스트 결과**: PASS — `npm run build`, `./backend/scripts/verify.ps1`
- **남은 작업**:
  - 실거래가 공공데이터 API 연결
  - KOSIS 지표 카드 연결
  - 주소/학교/역 기준 검색 추가
- **비고**: 광주 샘플 매물을 지도 핀, 지역 필터, 평균 비용 카드, 후보 리스트로 먼저 구성해 다음 단계 데이터 연동 자리를 마련했다.

### 2026-08-29 — EC2 deploy verification

- **Agent**: Codex
- **Task**: 채팅 캐릭터 반영분을 EC2에 배포하고 공개 주소 기준으로 동작 확인
- **변경 파일**:
  - `docs/handoff.md`
- **테스트 결과**: PASS — EC2 프론트 `npm run build`, EC2 백엔드 `pytest tests/main_backend/test_chat.py`, 공개 URL `/login`, `/icons/chat.svg`, `/images/characters/Dudi.png` 200 응답, 라이브 `/api/chat-rooms/{room_id}/messages`에서 participant character 메타데이터 확인
- **남은 작업**:
  - 브라우저에서 실제 채팅방 UI 한 번만 확인
- **비고**: 프론트는 `pm2 roomonic`, 백엔드는 `roompact-main-backend.service` / `roompact-ai-backend.service` 재시작까지 완료했다.

### 2026-08-29 — Chat character avatar sync in room

- **Agent**: Codex
- **Task**: 채팅방 상세 상단의 상대 캐릭터 이미지가 유형과 맞지 않던 문제 수정
- **변경 파일**:
  - `backend/src/main_backend/services/chat_service.py`
  - `backend/tests/main_backend/test_chat.py`
  - `frontend/roomonic-nextjs/lib/mockApi.js`
- **테스트 결과**: PASS — `.\\backend\\.venv\\Scripts\\python.exe -m pytest backend\\tests\\main_backend\\test_chat.py`, `npm run build`
- **남은 작업**:
  - EC2 반영이 필요하면 백엔드/프론트 재배포
- **비고**: 채팅방 `participants`에 캐릭터 메타데이터를 포함하고, 기존 방도 조회 시 보강되도록 처리했다.

### 2026-08-29 — Logout redirect fix

- **Agent**: Codex
- **Task**: 로그아웃 후 로그인 랜딩으로 안정적으로 복귀하도록 경로 정리
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/login/page.js`
  - `frontend/roomonic-nextjs/app/home/page.js`
  - `frontend/roomonic-nextjs/app/auth/kakao/callback/KakaoCallbackClient.jsx`
- **테스트 결과**: PASS — `npm run build`, `./backend/scripts/verify.ps1`
- **남은 작업**:
  - EC2에 프론트 배포가 필요하면 최신 빌드 반영
- **비고**: `/login`을 실제 로그인 랜딩과 동일하게 맞추고, 로그아웃은 `window.location.replace('/login')`로 강제 이동하도록 변경했다.

### 2026-08-29 — Map base scaffold

- **Agent**: Codex
- **Task**: 네이버 지도 베이스 화면 연결 준비와 지도 페이지 실 렌더 구조 추가
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/map/page.js`
  - `frontend/roomonic-nextjs/.env.local`
- **테스트 결과**: PASS — `npm run build`, `./backend/scripts/verify.ps1`
- **남은 작업**:
  - `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 설정
  - 지도 위 실거래가/KOSIS 레이어 API 연결
- **비고**: 키가 없을 때도 페이지가 깨지지 않도록 안내 오버레이를 넣고, 키가 있으면 광주 기준 기본 네이버 지도를 바로 띄우도록 구성했다.

### 2026-08-29 — Chat avatar sync

- **Agent**: Codex
- **Task**: 채팅 목록과 채팅방 상단에 상대 유형별 캐릭터 아이콘 표시
- **변경 파일**:
  - `backend/src/main_backend/services/chat_service.py`
  - `backend/tests/main_backend/test_chat.py`
  - `frontend/roomonic-nextjs/app/chat/page.js`
- **테스트 결과**: PASS — `.\\backend\\.venv\\Scripts\\python.exe -m pytest backend\\tests\\main_backend\\test_chat.py`, `npm run build`, `./backend/scripts/verify.ps1`
- **남은 작업**:
  - EC2 반영 확인
- **비고**: inbox 응답에 `peer_type_code`, `peer_type_name`를 포함시키고 프론트에서 해당 유형 캐릭터 이미지를 우선 매핑하도록 정리했다.

### 2026-08-29 — 로그인 BGM 연결 및 EC2 반영

- **Agent**: Codex
- **Task**: 로그인 첫 화면(`/`)에 `login-bgm.m4a`를 연결하고 운영 EC2에 반영
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/page.js`
  - `frontend/roomonic-nextjs/public/images/audio/login-bgm.m4a`
  - `/home/ubuntu/frontend/roomonic-nextjs/app/page.js` (EC2 반영)
  - `/home/ubuntu/frontend/roomonic-nextjs/public/images/audio/login-bgm.m4a` (EC2 반영)
- **테스트 결과**: PASS — 로컬 `npm run build`, 원격 `curl -I http://127.0.0.1:3000/`, 원격 `curl -I http://127.0.0.1:3000/images/audio/login-bgm.m4a`
- **남은 작업**:
  - 모바일 브라우저에서 첫 진입 시 자동재생 제한 때문에 최초 터치 후 BGM이 시작되는지 수동 확인
- **비고**: 브라우저 자동재생 제한을 고려해 첫 렌더에서 재생을 시도하고, 첫 클릭/터치/키입력 시 한 번 더 재생을 시도하도록 처리했다.

### 2026-08-29 — 로그인 배경 GIF 교체 및 EC2 반영

- **Agent**: Codex
- **Task**: 로그인 첫 화면 배경을 PNG 방식에서 `home-bg.gif`로 교체하고 운영 EC2에 반영
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/page.js`
  - `frontend/roomonic-nextjs/public/images/login/home-bg.gif`
  - `/home/ubuntu/frontend/roomonic-nextjs/app/page.js` (EC2 반영)
  - `/home/ubuntu/frontend/roomonic-nextjs/public/images/login/home-bg.gif` (EC2 반영)
- **테스트 결과**: PASS — 로컬 `npm run build`, 원격 `curl -I http://127.0.0.1:3000/`, 원격 `curl -I http://127.0.0.1:3000/images/login/home-bg.gif`
- **남은 작업**:
  - 브라우저 캐시가 남아 있으면 강력 새로고침 후 실제 GIF 애니메이션 노출 수동 확인
- **비고**: 기존 `/images/candidates/image (3).png` 배경 코드는 제거하고 로그인 전용 자산 경로 `/images/login/home-bg.gif`로 통일했다.

### 2026-08-29 — 채팅 헤더 상단 고정 및 EC2 반영

- **Agent**: Codex
- **Task**: 채팅방 상단 뒤로가기 헤더를 고정하고 메시지 영역 여백을 조정한 뒤 EC2에 반영
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/chat/page.js`
  - `/home/ubuntu/frontend/roomonic-nextjs/app/chat/page.js` (EC2 반영)
- **테스트 결과**: PASS — 로컬 `npm run build`, 원격 `curl -I http://127.0.0.1:3000/chat`, 외부 `http://15.134.137.117:3000/chat`
- **남은 작업**:
  - 실제 모바일 화면에서 상단 고정 헤더와 하단 고정 입력바 사이 메시지 스크롤 감각 수동 확인
- **비고**: 채팅방은 상단 헤더 고정, 본문 스크롤, 하단 입력 스택 고정 구조로 맞췄다.

### 2026-08-29 — 채팅 가이드 문맥 강화 및 EC2 반영

- **Agent**: Codex
- **Task**: 채팅 AI 추천 질문을 최근 대화 문맥 기반으로 강화하고, 가이드 카드를 입력창 위 고정 영역으로 이동한 뒤 EC2에 반영
- **변경 파일**:
  - `backend/src/ai_backend/fallback.py`
  - `backend/src/ai_backend/llm_client.py`
  - `backend/src/ai_backend/negotiate.py`
  - `backend/src/main_backend/services/chat_service.py`
  - `frontend/roomonic-nextjs/app/chat/page.js`
  - `/opt/roompact-campus/backend/src/ai_backend/*` (EC2 반영)
  - `/opt/roompact-campus/backend/src/main_backend/services/chat_service.py` (EC2 반영)
  - `/home/ubuntu/frontend/roomonic-nextjs/app/chat/page.js` (EC2 반영)
- **테스트 결과**: PASS — 로컬 `pytest backend/tests/ai_backend/test_ai_backend.py -q`, 로컬 `pytest backend/tests/main_backend/test_chat.py -q`, 로컬 `npm run build`, 원격 `pytest tests/ai_backend/test_ai_backend.py -q`, 원격 `pytest tests/main_backend/test_chat.py -q`, 외부 `http://15.134.137.117:3000/chat`, 외부 `http://15.134.137.117/api/health`
- **남은 작업**:
  - 실제 두 계정으로 채팅을 이어가며 Gemini 질문이 대화 흐름에 맞게 갱신되는지 수동 확인
- **비고**: 최근 메시지는 발화자 이름까지 포함해 Gemini에 전달하고, 채팅 화면에서는 가이드 카드와 입력창을 하단 고정 스택으로 묶어 잘림 없이 보이도록 조정했다.

### 2026-08-29 — 채팅 가이드 톤/입력바 고정/확정 배너 정리

- **Agent**: Codex
- **Task**: 채팅 시작 질문 톤을 자연스럽게 다듬고, 대화 가이드 닫기 버튼 및 입력바 하단 고정 UI를 반영
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/chat/page.js`
  - `frontend/roomonic-nextjs/lib/mockApi.js`
  - `backend/src/ai_backend/fallback.py`
  - `backend/src/ai_backend/llm_client.py`
- **테스트 결과**: PASS — `backend\.venv\Scripts\python.exe -m pytest backend/tests/ai_backend/test_ai_backend.py -q`, `npm run build`
- **남은 작업**:
  - 운영 브라우저에서 하단 고정 입력바와 NAV 간 간격이 기기별로 자연스러운지 수동 확인
- **비고**: 확정 완료 안내 배너는 제거했고, 대화 가이드는 사용자가 닫을 수 있으며, 최근 대화가 없을 때는 초반에 많이 묻는 생활 질문을 먼저 추천하도록 조정했다.

### 2026-08-29 — TASK-P1-17

- **Agent**: Codex
- **Task**: 채팅별 읽음 상태를 DB에 저장하고 채팅 목록/하단 배지에 안 읽은 메시지 수를 실시간 반영
- **변경 파일**:
  - `.kiro/specs/roompact-campus/requirements.md`
  - `.kiro/specs/roompact-campus/design.md`
  - `.kiro/specs/roompact-campus/tasks.md`
  - `backend/src/main_backend/routes/chat.py`
  - `backend/src/main_backend/services/chat_service.py`
  - `backend/src/main_backend/services/storage.py`
  - `backend/tests/main_backend/test_chat.py`
  - `deploy/postgres/schema.sql`
  - `frontend/roomonic-nextjs/lib/mockApi.js`
  - `frontend/roomonic-nextjs/app/chat/page.js`
  - `frontend/roomonic-nextjs/components/BottomNav.jsx`
- **테스트 결과**: PASS — `backend\.venv\Scripts\python.exe -m pytest backend/tests/main_backend/test_chat.py -q`, `npm run build`, `powershell -ExecutionPolicy Bypass -File backend/scripts/verify.ps1`
- **남은 작업**:
  - 운영 EC2에서 실제 두 계정으로 채팅방 목록 unread 증가/입장 후 초기화 동작 수동 확인
- **비고**: 채팅방 밖에서는 상대 메시지가 inbox websocket으로 즉시 반영되고, 채팅방 안에서는 마지막 읽음 상태를 바로 갱신해 unread가 늘지 않도록 처리했다.

### 2026-08-29 — 채팅 안 읽음 개수/하단 NAV 여백 보강

- **Agent**: Codex
- **Task**: 채팅 목록에 안 읽은 메시지 개수를 표시하고, 하단 고정 NAV가 본문 요소를 가리지 않도록 안전 여백을 추가
- **변경 파일**:
  - `frontend/roomonic-nextjs/lib/mockApi.js`
  - `frontend/roomonic-nextjs/app/chat/page.js`
  - `frontend/roomonic-nextjs/components/BottomNav.jsx`
  - `/home/ubuntu/frontend/roomonic-nextjs/lib/mockApi.js` (EC2 반영)
  - `/home/ubuntu/frontend/roomonic-nextjs/app/chat/page.js` (EC2 반영)
  - `/home/ubuntu/frontend/roomonic-nextjs/components/BottomNav.jsx` (EC2 반영)
- **테스트 결과**: PASS — 로컬 `npm run build`, `backend/scripts/verify.ps1`, 원격 `npm run build`, 외부 `http://15.134.137.117:3000/chat`, 외부 `http://15.134.137.117:3000/home`
- **남은 작업**:
  - 실제 두 계정에서 한쪽이 메시지를 보냈을 때 다른 쪽 채팅 목록의 안 읽음 숫자가 기대대로 줄어드는지 수동 확인
- **비고**: 읽음 처리는 현재 프론트 저장소 기준으로 채팅방 진입 시점에 기록되며, NAV 배지에는 받은 요청 수와 안 읽은 메시지 수가 함께 반영됨.

### 2026-08-29 — 채팅 전역 알림 모달 보강 및 EC2 반영

- **Agent**: Codex
- **Task**: 채팅 페이지 안에서만 뜨던 요청 알림을 전역 하단 네비게이션으로 옮겨, 다른 화면에서도 새 채팅 요청 모달과 알림음을 받을 수 있게 수정
- **변경 파일**:
  - `frontend/roomonic-nextjs/components/BottomNav.jsx`
  - `frontend/roomonic-nextjs/app/chat/page.js`
  - `/home/ubuntu/frontend/roomonic-nextjs/components/BottomNav.jsx` (EC2 반영)
  - `/home/ubuntu/frontend/roomonic-nextjs/app/chat/page.js` (EC2 반영)
- **테스트 결과**: PASS — 로컬 `npm run build`, 원격 `npm run build`, 원격 `curl http://127.0.0.1:3000`, 외부 `http://15.134.137.117:3000/`, 외부 `http://15.134.137.117:3000/chat`
- **남은 작업**:
  - 실제 두 계정 브라우저에서 새 채팅 요청 발생 시 모달 노출과 소리 재생 여부 최종 확인
- **비고**: 소리는 MP3 재생을 우선 사용하고, 브라우저 자동재생 제한 시 진동 또는 Web Audio fallback으로 보완함.

### 2026-08-29 — 게임 문구/약속 공유/하단 네비게이션 고정

- **Agent**: Codex
- **Task**: 게임 메인 문구 수정, 약속 완료 화면 공유 버튼 문구 변경, 네비게이션 바를 사용자 화면 하단 고정으로 정리
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/minigame/page.js`
  - `frontend/roomonic-nextjs/app/final/page.js`
  - `frontend/roomonic-nextjs/components/BottomNav.jsx`
- **테스트 결과**: PASS — `npm run build`
- **남은 작업**:
  - 운영 화면에서 하단 고정 네비게이션이 각 페이지 콘텐츠를 가리지 않는지 수동 확인
- **비고**: 약속 완료 화면의 `공유하기`는 Web Share API 우선, 미지원 환경에서는 클립보드 복사 fallback으로 동작함.

### 2026-08-29 — 홈 문구/채팅 요청 알림 보강 및 EC2 반영

- **Agent**: Codex
- **Task**: 약속 완료 상태에 맞는 홈 문구 변경, 새 채팅 요청 모달 알림음 추가, 프론트 EC2 재배포
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/home/page.js`
  - `frontend/roomonic-nextjs/app/chat/page.js`
  - `/home/ubuntu/frontend/roomonic-nextjs/*` (EC2 반영)
- **테스트 결과**: PASS — `npm run build`, 원격 `curl http://127.0.0.1:3000`, 외부 `http://15.134.137.117:3000/`
- **남은 작업**:
  - 실제 브라우저에서 새 채팅 요청 모달 알림음 재생 허용 여부 확인
- **비고**: 브라우저 자동재생 제한이 있는 환경에서는 알림음이 차단될 수 있으므로, 그 경우 모달 알림은 유지되고 소리만 제한될 수 있음.

### 2026-08-29 — 약속 결과판/홈 문구 정리

- **Agent**: Codex
- **Task**: 서명 완료 후 약속 NAV가 결과판으로 가도록 수정하고, 결과판에 서명 이미지와 홈 문구 정리 반영
- **변경 파일**:
  - `frontend/roomonic-nextjs/lib/mockApi.js`
  - `frontend/roomonic-nextjs/components/BottomNav.jsx`
  - `frontend/roomonic-nextjs/app/rules/draft/page.js`
  - `frontend/roomonic-nextjs/app/rules/review/page.js`
  - `frontend/roomonic-nextjs/app/signature/page.js`
  - `frontend/roomonic-nextjs/app/final/page.js`
  - `frontend/roomonic-nextjs/app/home/page.js`
- **테스트 결과**: PASS — `npm run build`
- **남은 작업**:
  - 운영 서버 반영 후 실제 두 계정 서명 이미지 표시 확인
- **비고**: 서명 완료된 Pact는 `draft/review/signature`에서 더 이상 머물지 않고 `final` 결과판으로 보내며, 결과판 참가자 카드에 실제 서명 이미지를 작게 표시함.

### 2026-08-29 — EC2 수동 배포 반영

- **Agent**: Codex
- **Task**: 로컬 최신 백엔드/프론트 변경을 EC2에 수동 반영하고 서비스 재시작
- **변경 파일**:
  - `/opt/roompact-campus/backend/*` (EC2 반영)
  - `/home/ubuntu/frontend/roomonic-nextjs/*` (EC2 반영)
- **테스트 결과**: PASS — 원격 `pytest tests/main_backend/test_chat.py tests/main_backend/test_profiles.py tests/ai_backend/test_ai_backend.py`, 원격 `curl http://127.0.0.1:8000/health`, 원격 `curl http://127.0.0.1:8001/health`, 외부 `http://15.134.137.117:3000/`, 외부 `http://15.134.137.117/api/health`
- **남은 작업**:
  - 두 계정으로 채팅 확정 모달과 약속 페이지 게이트 수동 점검
- **비고**: 프론트는 `fuser -k 3000/tcp` 후 `npm run start`로 재시작했고, 백엔드/AI 백엔드는 `systemctl restart`로 반영함.

### 2026-08-28 — 채팅 확정 게이트 및 약속 진입 보강

- **Agent**: Codex
- **Task**: 한 사람만 확정해도 약속 화면이 열리던 흐름을 막고, 상대 확정 도착 모달과 채팅 메시지 구분 흐름을 정리
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/chat/page.js`
  - `frontend/roomonic-nextjs/app/rules/draft/page.js`
  - `frontend/roomonic-nextjs/app/rules/review/page.js`
  - `frontend/roomonic-nextjs/app/signature/page.js`
  - `frontend/roomonic-nextjs/app/final/page.js`
- **테스트 결과**: PASS — `npm run build`, `backend/scripts/verify.ps1`
- **남은 작업**:
  - EC2 반영 후 실제 두 계정으로 상호 확정 모달 수동 검증
- **비고**: 약속 관련 화면은 `confirmed_at`이 있는 경우에만 진입 가능하도록 막았고, 채팅 목록에서 잘못된 `profileId`를 넘기던 흐름을 수정해 내 메시지/상대 메시지 정렬 기준이 깨지지 않도록 보정함.

### 2026-08-28 — 추천 후보 상세 진입 흐름 수정

- **Agent**: Codex
- **Task**: 추천 후보 선택 시 상세 프로필을 먼저 보고, 상세 페이지 하단 버튼에서 채팅 요청을 보내도록 흐름 수정
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/candidates/result/page.js`
  - `frontend/roomonic-nextjs/app/candidates/[id]/page.js`
- **테스트 결과**: PASS — `npm run build`
- **남은 작업**:
  - EC2 배포 시 최신 프론트 변경분과 병합 확인
- **비고**: 결과 페이지의 후보 카드는 `상세 보기` 역할만 수행하고, 일일 선택 잠금과 채팅 요청 생성은 상세 페이지 하단 CTA에서 처리하도록 변경함.

### 2026-08-28 — 채팅 확정/알림 보강

- **Agent**: Codex
- **Task**: 채팅 알림 배지 추가, 룸메이트 확정 대기 상태 노출, 확정 후 재매칭 차단
- **변경 파일**:
  - `backend/src/main_backend/services/storage.py`
  - `backend/src/main_backend/services/chat_service.py`
  - `backend/src/main_backend/routes/chat.py`
  - `backend/tests/main_backend/test_chat.py`
  - `frontend/roomonic-nextjs/lib/mockApi.js`
  - `frontend/roomonic-nextjs/components/BottomNav.jsx`
  - `frontend/roomonic-nextjs/app/chat/page.js`
- **테스트 결과**: PASS — `backend\.venv\Scripts\python.exe -m pytest backend/tests/main_backend/test_chat.py`, `npm run build`
- **남은 작업**:
  - 운영 EC2에 배포 후 실제 두 계정으로 새 요청 배지와 확정 대기 문구 확인
  - 읽지 않은 메시지 기준 배지가 필요하면 별도 unread 상태 저장 추가 검토
- **비고**: 이제 이미 다른 룸메이트와 확정된 프로필은 새 요청 생성, 수락, 새 채팅방 생성, 다른 방 확정이 모두 서버에서 차단된다.

### 2026-08-28 — TASK-P1-15

- **Agent**: Codex
- **Task**: TASK-P1-15 채팅방용 추가 질문 추천 API와 프론트 UI 추가
- **변경 파일**:
  - `.kiro/specs/roompact-campus/requirements.md`
  - `.kiro/specs/roompact-campus/design.md`
  - `.kiro/specs/roompact-campus/tasks.md`
  - `backend/src/ai_backend/negotiate.py`
  - `backend/src/ai_backend/llm_client.py`
  - `backend/src/ai_backend/fallback.py`
  - `backend/src/main_backend/routes/chat.py`
  - `backend/src/main_backend/services/chat_service.py`
  - `backend/tests/ai_backend/test_ai_backend.py`
  - `backend/tests/main_backend/test_chat.py`
  - `docs/api/main-backend.md`
  - `docs/api/main-backend-openapi.json`
  - `frontend/roomonic-nextjs/app/chat/page.js`
  - `frontend/roomonic-nextjs/lib/mockApi.js`
- **테스트 결과**: PASS — `backend\.venv\Scripts\python.exe -m pytest backend/tests/main_backend/test_chat.py`, `backend\.venv\Scripts\python.exe -m pytest backend/tests/ai_backend/test_ai_backend.py`, `backend\.venv\Scripts\python.exe backend/scripts/export_openapi.py`, `npm run build`
- **남은 작업**:
  - 운영 EC2에 재배포해서 실제 Gemini 키가 들어간 환경에서 질문 톤 확인
  - 필요 시 추천 질문을 누르면 바로 전송할지, 입력창에만 채울지 UX 확정
- **비고**: 질문 추천은 새 파일을 늘리지 않고 기존 `negotiate.py` 경계 안에서 구현했다. 인터뷰 응답, 캐릭터, 최근 채팅 문맥을 사용하고, Gemini 실패 시에도 같은 형식의 fallback 질문 배열을 반환한다.

### 2026-08-28 — Gemini 대화 톤 개선

- **Agent**: Codex
- **Task**: Pact/협상안 생성에서 Gemini와 fallback 문장이 더 자연스럽게 질문하고 합의 제안처럼 보이도록 톤 조정
- **변경 파일**:
  - `backend/src/ai_backend/llm_client.py`
  - `backend/src/ai_backend/fallback.py`
  - `backend/tests/ai_backend/test_ai_backend.py`
- **테스트 결과**: PASS — `backend\.venv\Scripts\python.exe -m pytest backend/tests/ai_backend/test_ai_backend.py`, `powershell -ExecutionPolicy Bypass -File backend/scripts/verify.ps1`
- **남은 작업**:
  - 실제 운영 데이터에서 Gemini 응답 톤이 프론트 약속 화면에 충분히 자연스럽게 보이는지 확인
  - 필요 시 채팅용 별도 AI 질문 생성 API를 Spec에 정의한 뒤 분리 구현
- **비고**: API 계약은 바꾸지 않고, 기존 `negotiate`/`pact` 흐름 안에서 프롬프트와 fallback 문장만 조정했다.

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
### 2026-08-28 — TASK-P1-16

- **Agent**: Codex
- **Task**: TASK-P1-16 약속 결과 화면을 실제 Pact 데이터 기반으로 정리
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/final/page.js`
  - `.kiro/specs/roompact-campus/tasks.md`
- **테스트 결과**: PASS — `npm run build`, `backend/scripts/verify.ps1`
- **남은 작업**:
  - 실제 서명 완료/대기 상태별 화면 수동 확인
- **비고**: 정적 예시 약속 카드 대신 실제 `pact.ai_rules`, `custom_rules`, `signatures`를 사용하도록 결과 화면을 교체함.

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

### 2026-08-29 — 하단 네비 흰색 고정 통일

- **Agent**: Codex
- **Task**: 홈/추천 포함 모든 화면에서 하단 네비를 흰색 고정 바 형태로 통일
- **변경 파일**:
  - `frontend/roomonic-nextjs/components/BottomNav.jsx`
- **테스트 결과**: PASS — `npm run build`
- **남은 작업**:
  - 실기기에서 밝은 배경 대비감 최종 확인
- **비고**: 페이지 배경과 분리된 독립 바 형태로 보이도록 border/shadow를 함께 조정했다.

### 2026-08-29 — 네비 아이콘 인라인 SVG 전환

- **Agent**: Codex
- **Task**: 배포 환경의 정적 SVG 경로 문제를 피하기 위해 하단 네비 아이콘을 인라인 SVG 컴포넌트로 전환
- **변경 파일**:
  - `frontend/roomonic-nextjs/components/BottomNav.jsx`
- **테스트 결과**: PASS — `npm run build`, `backend/scripts/verify.ps1`
- **남은 작업**:
  - 실제 디자이너 SVG와 완전히 동일한 선 굵기/비율로 미세 조정
- **비고**: `/icons/*.svg` 404 이슈를 제거하기 위해 외부 파일 참조 대신 `currentColor` 기반 인라인 SVG를 사용한다.

### 2026-08-28 — SVG 네비 아이콘 및 활성 애니메이션 반영

- **Agent**: Codex
- **Task**: 하단 네비를 SVG 아이콘으로 교체하고 활성 탭에 어울리는 미세 애니메이션 적용
- **변경 파일**:
  - `frontend/roomonic-nextjs/components/BottomNav.jsx`
- **테스트 결과**: PASS — `npm run build`, `backend/scripts/verify.ps1`
- **남은 작업**:
  - 실제 SVG 디자인 톤에 맞춘 색상 미세 조정
- **비고**: 활성 탭은 배경/텍스트 색상 변화와 함께 가벼운 float 애니메이션을 사용한다.

### 2026-08-29 — 네비 5탭 구조 및 지도 탭 추가

- **Agent**: Codex
- **Task**: 하단 네비를 홈/추천(확정 후 약속)/채팅/게임/지도로 재구성하고 활성 탭 스타일 정리
- **변경 파일**:
  - `frontend/roomonic-nextjs/components/BottomNav.jsx`
  - `frontend/roomonic-nextjs/app/map/page.js`
- **테스트 결과**: PASS — `npm run build`, `backend/scripts/verify.ps1`
- **남은 작업**:
  - SVG 아이콘 파일 수급 후 이모지 아이콘 교체
  - 지도 화면 실제 기능 연결
- **비고**: 추천 슬롯은 룸메이트 확정 전에는 `추천`, 확정 후에는 `약속`으로 표시된다.

### 2026-08-28 — 프론트 상태 복구 및 로그인 BGM 보강

- **Agent**: Codex
- **Task**: 로그아웃 후 룸메이트 확정/약속 상태 서버 복구, 로그인 BGM 자동 재생 시도 + 터치 fallback 보강
- **변경 파일**:
  - `frontend/roomonic-nextjs/lib/mockApi.js`
  - `frontend/roomonic-nextjs/components/BottomNav.jsx`
  - `frontend/roomonic-nextjs/app/page.js`
  - `frontend/roomonic-nextjs/app/candidates/page.js`
  - `frontend/roomonic-nextjs/app/candidates/result/page.js`
  - `frontend/roomonic-nextjs/app/candidates/[id]/page.js`
  - `frontend/roomonic-nextjs/app/rules/draft/page.js`
  - `frontend/roomonic-nextjs/app/final/page.js`
- **테스트 결과**: PASS — `npm run build`, `backend/scripts/verify.ps1`
- **남은 작업**:
  - EC2 반영 후 실제 로그인 재진입 플로우에서 약속/매칭 상태 복구 확인
  - 모바일 브라우저별 자동 재생 정책 차이 점검
- **비고**: 백엔드 DB에는 확정/약속 상태가 유지되고 있으며, 이번 수정은 프론트가 재로그인 시 서버 상태를 다시 동기화하도록 보강한 작업이다.

### 2026-08-29 — Home cleanup and profile fix

- **Agent**: Codex
- **Task**: 홈 후보 카드 제거와 프로필 수정 진입 에러 수정
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/home/page.js`
  - `frontend/roomonic-nextjs/app/profile/page.js`
- **테스트 결과**: PASS — `frontend/roomonic-nextjs npm run build`, `backend/scripts/verify.ps1`
- **남은 작업**:
  - EC2 프론트 재배포
  - 홈 설정에서 프로필 수정 진입 흐름 실기기 확인
- **비고**: 홈의 후보 안내 섹션을 제거했고, 프로필 화면에서 누락된 `formatGender` 함수를 복구해 런타임 에러를 해결했다.

### 2026-08-29 — Home/Profile redesign

- **Agent**: Codex
- **Task**: 홈 대시보드와 기본 프로필 화면의 정보 위계 재설계
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/home/page.js`
  - `frontend/roomonic-nextjs/app/profile/page.js`
- **테스트 결과**: PASS — `frontend/roomonic-nextjs npm run build`, `backend/scripts/verify.ps1`
- **남은 작업**:
  - EC2 프론트 재배포
  - 실기기에서 홈/프로필 스크롤 밀도와 가독성 확인
- **비고**: 기존 API, 상태 관리, 라우팅은 유지하고 홈을 프로필 대시보드 성격으로 재구성했다. 차트는 추가 라이브러리 없이 SVG/CSS로 구현했다.

### 2026-08-29 — Candidate tone polish

- **Agent**: Codex
- **Task**: 추천 후보 계열 상태바 제거와 배경/버튼 톤 정리
- **변경 파일**:
  - `frontend/roomonic-nextjs/components/Shell.jsx`
  - `frontend/roomonic-nextjs/components/UI.jsx`
  - `frontend/roomonic-nextjs/app/candidates/page.js`
  - `frontend/roomonic-nextjs/app/candidates/result/page.js`
  - `frontend/roomonic-nextjs/app/candidates/[id]/page.js`
- **테스트 결과**: PASS — `frontend/roomonic-nextjs npm run build`, `backend/scripts/verify.ps1`
- **남은 작업**:
  - 실기기에서 추천 상세/결과 페이지 색감 확인
- **비고**: 가짜 상태바 렌더링을 제거하고, 추천 계열 페이지에 더 눈에 띄는 연보라 배경과 보라 버튼 톤을 적용했다.

### 2026-08-29 — UI tone

- **Agent**: Codex
- **Task**: 공통 밝은 배경에 연보라 톤 추가
- **변경 파일**:
  - `frontend/roomonic-nextjs/components/Shell.jsx`
- **테스트 결과**: PASS — `frontend/roomonic-nextjs npm run build`, `backend/scripts/verify.ps1`
- **남은 작업**:
  - 실제 기기에서 페이지별 배경 농도 확인
- **비고**: 카드와 네비는 유지하고 공통 레이아웃 배경에만 옅은 색을 더해 흰 화면의 비어 보이는 느낌을 줄였다.

### 2026-08-29 — UI polish

- **Agent**: Codex
- **Task**: 추천 페이지 배경 정리와 채팅 목록 초기 깜빡임 보정
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/candidates/page.js`
  - `frontend/roomonic-nextjs/app/chat/page.js`
- **테스트 결과**: PASS — `frontend/roomonic-nextjs npm run build`, `backend/scripts/verify.ps1`
- **남은 작업**:
  - EC2 프론트 재배포
  - 실제 모바일 브라우저에서 채팅 목록 로딩 전환감 확인
- **비고**: 채팅 목록은 `inboxLoading` 상태를 분리해 빈 상태 카드가 먼저 보이지 않도록 수정했고, 추천 화면은 전체를 밝은 배경 기준으로 맞췄다.

### 2026-08-29 — Home visual polish

- **Agent**: Codex
- **Task**: 홈 대시보드 스타일 복원과 캐릭터 유형별 그래프/설정 UI 톤 조정
- **변경 파일**:
  - `frontend/roomonic-nextjs/app/home/page.js`
- **테스트 결과**: PASS — `npm run build`, `./backend/scripts/verify.ps1`
- **남은 작업**:
  - EC2 프론트 배포 반영 확인
- **비고**: `생활 성향 한눈에 보기` 카드를 기존 단순 점수 레이아웃에 가깝게 되돌리고, 유형별 그래프 색상과 설정 모달 포인트 컬러를 분기했다.

### 2026-08-29 — 프로젝트 README 정리

- **Agent**: Codex
- **Task**: Roomonic 전체 아키텍처, 기술 스택, 주요 흐름, 배포 구조를 루트 README로 정리
- **변경 파일**:
  - `README.md`
  - `docs/handoff.md`
- **검증 결과**: PASS — README 내 실제 API 키/시크릿 값 미포함 확인
- **비고**: 현재 구현 기준인 Next.js, FastAPI, PostgreSQL on EC2, Gemini API, Naver Map, 공공데이터포털 구조를 중심으로 작성했다.

### 2026-08-29 — EC2 배포 소스 로컬 동기화 및 GitHub 저장

- **Agent**: Codex
- **Task**: 현재 EC2에 배포된 백엔드/프론트엔드 소스를 로컬로 수집하고 GitHub 커밋 대상으로 정리
- **변경 파일**:
  - EC2에서 수집한 `backend/` 소스
  - EC2에서 수집한 `frontend/roomonic-nextjs/` 소스
  - `.gitignore`
  - `docs/handoff.md`
- **검증 결과**: PASS — 소스 수집 완료, 시크릿 값 미포함 확인, `backend/scripts/verify.ps1` 통과, `npm run build` 통과
- **비고**: EC2 서비스 재시작/배포 명령은 실행하지 않았고, `.env*`, `.next`, `node_modules`, 런타임 데이터는 제외했다.

### 2026-08-29 — 운영 DB 계정 데이터 초기화

- **Agent**: Codex
- **Task**: EC2 `roompact_campus` DB의 사용자 계정 및 연결 데이터 전체 삭제
- **변경 파일**:
  - 없음
- **삭제 범위**:
  - `users`
  - `sessions`
  - `profiles`
  - `profile_interviews`
  - `profile_recommendations`
  - `match_requests`
  - `match_results`
  - `chat_rooms`
  - `chat_room_reads`
  - `chat_messages`
  - `roommate_pacts`
- **검증 결과**: PASS — 전체 대상 테이블 `0`건 확인, `GET /api/health` 200 OK 확인
- **비고**: 기존 브라우저 localStorage에 남은 `profile_id`는 서버 DB에 존재하지 않으므로, 클라이언트에서 로그아웃하거나 저장값을 초기화해야 한다.

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

