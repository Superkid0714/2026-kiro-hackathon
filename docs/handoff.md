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
  - Bedrock 실사용 모델 ID 주입
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
