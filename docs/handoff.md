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
