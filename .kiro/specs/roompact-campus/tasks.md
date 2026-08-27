# RoomPACT Campus Tasks

> Solo Workflow: `requirements.md`, `design.md`, `tasks.md`를 기준으로 바로 구현한다.

## 작업 운영 규칙

- 상태는 `READY`, `IN_PROGRESS`, `DONE`, `BLOCKED`만 사용한다.
- `BLOCKED`는 Spec-구현 충돌 또는 의존 Task 미완료에만 사용한다.
- 구현 에이전트는 `requirements.md`, `design.md`를 수정하지 않는다.
- Spec과 맞지 않는 부분을 발견하면 코드를 진행하지 말고 Spec을 먼저 갱신한다.
- Acceptance 기준과 검증을 통과하면 직접 `DONE`으로 전환한다.
- 같은 파일 범위를 공유하는 Task는 동시에 진행하지 않는다.
- 커밋 메시지는 `Task #ID: 설명` 형식을 따른다.

## P0

- [x] TASK-P0-01 일반 백엔드 서버 골격과 기본 API를 구성한다
  - Status: DONE
  - Owner: Codex
  - Requirement: FR-08.1, FR-08.2, FR-08.3, FR-08.4, FR-11.1
  - File Scope: `backend/src/main_backend/app.py`, `backend/src/main_backend/routes/*`, `backend/src/main_backend/services/*`
  - Depends on: 없음
  - Acceptance:
    - 일반 백엔드 서버가 실행 가능해야 한다.
    - 학생 입력 수신, 세션 조회, 결과 조회용 기본 API 골격이 존재해야 한다.
    - Gradio 프로토타입이 바로 사용할 수 있는 기본 응답 구조를 반환해야 한다.
  - Verify:
    - 서버 기동 테스트
    - 기본 API 헬스체크 테스트
    - 기본 응답 구조 확인 테스트

- [x] TASK-P0-02 AI 백엔드 서버 골격과 요청 진입점을 구성한다
  - Status: DONE
  - Owner: Codex
  - Requirement: FR-09.1, FR-09.2, FR-09.3, FR-11.1
  - File Scope: `backend/src/ai_backend/app.py`, `backend/src/ai_backend/handler.py`
  - Depends on: 없음
  - Acceptance:
    - AI 백엔드 서버가 실행 가능해야 한다.
    - 배정 요청을 받는 엔드포인트와 처리 진입점이 존재해야 한다.
    - 일반 백엔드가 소비할 JSON 응답 골격을 반환해야 한다.
  - Verify:
    - 서버 기동 테스트
    - 배정 요청 엔드포인트 테스트
    - 응답 구조 확인 테스트

- [x] TASK-P0-03 일반 백엔드와 AI 백엔드의 연결 계약을 구현한다
  - Status: DONE
  - Owner: Codex
  - Requirement: FR-11.2, FR-11.3, FR-11.4, NFR-07
  - File Scope: `backend/src/main_backend/services/*`, `backend/src/ai_backend/app.py`, `docs/*`
  - Depends on: TASK-P0-01, TASK-P0-02
  - Acceptance:
    - 일반 백엔드가 설정값으로 AI 백엔드 엔드포인트를 받아 연결할 수 있어야 한다.
    - 요청/응답 JSON 계약이 고정되어 두 서버가 동일하게 해석해야 한다.
    - AI 백엔드 미연결 시 일반 백엔드가 구조화된 오류를 반환해야 한다.
  - Verify:
    - 연결 성공 테스트
    - 연결 실패 테스트
    - JSON 계약 일치 테스트

- [x] TASK-P0-04 결정론적 학생 쌍 점수 계산을 구현한다
  - Status: DONE
  - Owner: Codex
  - Requirement: FR-02.1, FR-02.2, FR-02.3, FR-02.4, FR-02.5, FR-04.1, FR-04.2, FR-04.3
  - File Scope: `backend/src/ai_backend/scoring.py`
  - Depends on: TASK-P0-02
  - Acceptance:
    - 학생 쌍별 호환 점수와 추천 이유 근거를 계산해야 한다.
    - 필수 조건 충돌 쌍은 배정 후보에서 제외 가능한 형태로 표시되어야 한다.
    - 동일 입력에 대해 동일 점수와 동일 근거가 반환되어야 한다.
    - `backend/src/ai_backend/llm_client.py` 또는 Bedrock 관련 import가 없어야 한다.
  - Verify:
    - 필수 조건 충돌 제외 테스트
    - 선호 가중치 반영 테스트
    - 동일 입력 재현성 테스트
    - 금지 import 검사 Hook 통과

- [x] TASK-P0-05 networkx 기반 2인실 매칭을 구현한다
  - Status: DONE
  - Owner: Codex
  - Requirement: FR-03.1, FR-03.2, FR-03.3, FR-03.4, FR-03.5
  - File Scope: `backend/src/ai_backend/matching.py`
  - Depends on: TASK-P0-04
  - Acceptance:
    - `networkx` 매칭 API를 사용해 전체 학생 집합의 2인실 배정을 계산해야 한다.
    - 한 학생이 정확히 하나의 페어에만 속해야 한다.
    - 완전 매칭이 불가능한 경우 구조화된 실패 결과를 반환해야 한다.
    - `backend/src/ai_backend/llm_client.py` 또는 Bedrock 관련 import가 없어야 한다.
  - Verify:
    - 짝수 인원 완전 매칭 테스트
    - 매칭 불가 입력 테스트
    - 중복 배정 방지 테스트
    - 금지 import 검사 Hook 통과

- [x] TASK-P0-06 Bedrock 클라이언트와 결정론적 fallback을 구현한다
  - Status: DONE
  - Owner: Codex
  - Requirement: FR-05.2, FR-05.3, FR-06.3, FR-07.3, NFR-02, NFR-03
  - File Scope: `backend/src/ai_backend/llm_client.py`, `backend/src/ai_backend/fallback.py`
  - Depends on: TASK-P0-02
  - Acceptance:
    - Bedrock 호출 코드는 `llm_client.py` 한 곳에만 있어야 한다.
    - 갈등 시나리오, 협상안, Pact 각각에 대한 결정론적 fallback 템플릿이 존재해야 한다.
    - LLM 호출 실패를 상위 모듈이 fallback으로 처리할 수 있는 형태로 노출해야 한다.
  - Verify:
    - Bedrock 호출 래퍼 단위 테스트
    - fallback 출력 형식 테스트
    - LLM 예외 발생 시 상위 처리를 위한 예외 테스트

- [x] TASK-P0-07 공용 DynamoDB 저장 구조와 데이터 소유권을 구현한다
  - Status: DONE
  - Owner: Codex
  - Requirement: FR-10.1, FR-10.2, FR-10.3, FR-10.4, NFR-09
  - File Scope: `backend/src/main_backend/services/*`, `backend/src/ai_backend/handler.py`, `docs/*`
  - Depends on: TASK-P0-01, TASK-P0-02
  - Acceptance:
    - 일반 백엔드와 AI 백엔드가 공용 키 구조를 사용해야 한다.
    - 입력 데이터와 결과 데이터의 소유 책임이 분리되어야 한다.
    - 두 백엔드가 같은 세션 ID 기준으로 데이터를 조회할 수 있어야 한다.
  - Verify:
    - 입력 저장 테스트
    - 결과 저장 테스트
    - 공용 키 조회 테스트

- [x] TASK-P0-08 갈등 시나리오 생성 모듈을 구현한다
  - Status: DONE
  - Owner: Codex
  - Requirement: FR-05.1, FR-05.2, FR-05.3, FR-05.4
  - File Scope: `backend/src/ai_backend/scenario.py`
  - Depends on: TASK-P0-06
  - Acceptance:
    - 입력에 갈등 요약과 `preset_id`가 포함되고 호출 조건이 참일 때 `narrative` 문자열과 `source` 필드가 반환되어야 한다.
    - 호출 조건이 거짓이면 Bedrock 호출 없이 빈 값 또는 skip 상태를 반환해야 한다.
    - 갈등 우선순위 판단은 상위 코드 입력을 사용하고 LLM이 결정하지 않아야 한다.
    - LLM 실패 시 `fallback.py`에서 생성한 `narrative` 문자열과 `source: fallback`이 반환되어야 한다.
  - Verify:
    - 호출 필요 여부 분기 테스트
    - `preset_id` 포함 입력에서 `narrative` 문자열 반환 테스트
    - LLM 성공 시 `source: llm` 반환 테스트
    - LLM 실패 시 `source: fallback` 반환 테스트

- [x] TASK-P0-09 협상안 문장화와 Pact 생성을 구현한다
  - Status: DONE
  - Owner: Codex
  - Requirement: FR-06.1, FR-06.2, FR-06.3, FR-07.1, FR-07.2, FR-07.3
  - File Scope: `backend/src/ai_backend/negotiate.py`, `backend/src/ai_backend/pact.py`
  - Depends on: TASK-P0-06
  - Acceptance:
    - `negotiate.py`는 입력 갈등 요약이 있을 때 `suggestions` 문자열 배열과 `source` 필드를 반환해야 한다.
    - `pact.py`는 배정된 두 학생의 규칙 입력이 있을 때 `rules` 문자열 배열과 `source` 필드를 반환해야 한다.
    - 두 모듈 모두 호출 조건이 거짓이면 Bedrock 호출 없이 빈 값 또는 skip 상태를 반환해야 한다.
    - 두 모듈 모두 LLM 실패 시 각각 결정론적 fallback 결과와 `source: fallback`을 반환해야 한다.
  - Verify:
    - 협상안 생성 시 `suggestions` 배열 반환 테스트
    - Pact 생성 시 `rules` 배열 반환 테스트
    - 호출 필요 여부 분기 테스트
    - LLM 성공 시 `source: llm` 반환 테스트
    - LLM 실패 시 `source: fallback` 반환 테스트

- [x] TASK-P0-10 전체 서버 연결과 핵심 통합 테스트를 완료한다
  - Status: DONE
  - Owner: Codex
  - Requirement: FR-08.3, FR-09.3, FR-10.4, FR-11.1, FR-11.2, FR-11.3, FR-11.4, NFR-01, NFR-02, NFR-06, NFR-07, NFR-08
  - File Scope: `backend/src/main_backend/*`, `backend/src/ai_backend/*`
  - Depends on: TASK-P0-03, TASK-P0-05, TASK-P0-07, TASK-P0-08, TASK-P0-09
  - Acceptance:
    - 일반 백엔드가 AI 백엔드와 연결된 상태에서 전체 요청 흐름을 완료해야 한다.
    - 공용 DB를 사용한 입력 저장, 매칭 결과, 보조 생성 결과가 정상적으로 이어져야 한다.
    - LLM 실패가 전체 요청 실패로 이어지지 않아야 한다.
    - Gradio가 결과를 단계별로 표시할 수 있는 응답 구조를 유지해야 한다.
  - Verify:
    - 서버 간 연결 통합 테스트
    - 공용 DB 통합 테스트
    - LLM fallback 통합 테스트
    - Gradio 소비용 응답 필드 확인 테스트

- [x] TASK-P0-11 메인 백엔드 프로필 API를 추가한다
  - Status: DONE
  - Owner: Codex
  - Requirement: FR-01.4, FR-08.5
  - File Scope: `backend/src/main_backend/routes/*`, `backend/src/main_backend/services/*`, `backend/tests/main_backend/*`, `docs/api/*`
  - Depends on: TASK-P0-01
  - Acceptance:
    - 메인 백엔드는 `nickname`, `age`, `gender`, `region`, `move_in_period`, `stay_duration_months` 필드를 저장하는 프로필 생성 API를 제공해야 한다.
    - 메인 백엔드는 프로필 목록 조회와 단건 조회 API를 제공해야 한다.
    - 각 프로필은 서버가 발급한 `profile_id`를 가져야 한다.
    - 프론트가 사용할 수 있는 요청/응답 문서가 갱신되어야 한다.
  - Verify:
    - 프로필 생성 테스트
    - 프로필 목록 조회 테스트
    - 프로필 단건 조회 테스트
    - API 문서 갱신 확인

- [x] TASK-P0-12 메인 백엔드 프로필 인터뷰 저장 API를 추가한다
  - Status: DONE
  - Owner: Codex
  - Requirement: FR-01.5, FR-08.6, FR-10.5
  - File Scope: `backend/src/main_backend/routes/*`, `backend/src/main_backend/services/*`, `backend/tests/main_backend/*`, `docs/api/*`
  - Depends on: TASK-P0-11
  - Acceptance:
    - 메인 백엔드는 프로필별 생활 인터뷰 응답 저장 API를 제공해야 한다.
    - 메인 백엔드는 프로필별 생활 인터뷰 응답 조회 API를 제공해야 한다.
    - 흡연/반려동물 관련 조건부 입력은 구조화된 필드로 저장되어야 한다.
    - 프론트가 사용할 수 있는 요청/응답 문서가 갱신되어야 한다.
  - Verify:
    - 인터뷰 저장 테스트
    - 인터뷰 조회 테스트
    - 미존재 프로필 404 테스트
    - API 문서 갱신 확인

## P1

- [ ] TASK-P1-01 저장 시 lint와 test를 실행하는 Hook을 추가한다
  - Status: READY
  - Owner: unassigned
  - Requirement: FR-12.1, FR-12.3
  - File Scope: `.kiro/hooks/*`, `backend/scripts/verify.ps1`
  - Depends on: 없음
  - Acceptance:
    - 저장 시 lint와 test를 실행하는 Hook이 1개만 존재해야 한다.
    - 초기 개발 단계에서 도구가 없더라도 실패 원인을 이해할 수 있는 메시지를 출력해야 한다.
  - Verify:
    - Hook 설정 파일 존재 확인
    - 저장 이벤트 명령 확인
    - 검증 스크립트 호출 테스트

- [ ] TASK-P1-02 scoring과 matching의 금지 import 검사 Hook을 추가한다
  - Status: READY
  - Owner: unassigned
  - Requirement: FR-12.2, FR-12.3, NFR-03
  - File Scope: `.kiro/hooks/*`
  - Depends on: TASK-P0-04, TASK-P0-05
  - Acceptance:
    - `scoring.py`와 `matching.py`에 Bedrock 또는 네트워크 호출 관련 import가 있을 때 Hook이 실패해야 한다.
    - 허용되지 않는 import가 없으면 Hook이 통과해야 한다.
    - 이 Hook 외 추가 Hook을 만들지 않아야 한다.
  - Verify:
    - 금지 import 샘플 감지 테스트
    - 정상 파일 통과 테스트

- [x] TASK-P1-03 단일 EC2 배포 자동화와 서비스 관리 구성을 추가한다
  - Status: DONE
  - Owner: Codex
  - Requirement: FR-11.5, FR-11.6, NFR-10
  - File Scope: `.github/workflows/*`, `scripts/*`, `deploy/systemd/*`
  - Depends on: TASK-P0-01
  - Acceptance:
    - GitHub Actions에서 EC2로 SSH 배포를 수행할 수 있는 워크플로가 존재해야 한다.
    - EC2에서 일반 백엔드와 AI 백엔드를 개별 `systemd` 서비스로 관리할 수 있는 파일이 존재해야 한다.
    - 배포 스크립트는 가상환경 준비, 의존성 설치, 검증 실행, 서비스 재시작 순서를 포함해야 한다.
    - AI 백엔드가 아직 구현되지 않은 상태에서는 배포가 일반 백엔드 기준으로 계속 가능해야 한다.
  - Verify:
    - 워크플로 파일 존재 확인
    - 배포 스크립트 문법 확인
    - `systemd` 서비스 파일 존재 확인

- [x] TASK-P1-04 공개 API를 nginx 80 포트 `/api` 경로로 노출한다
  - Status: DONE
  - Owner: Codex
  - Requirement: FR-11.7, NFR-07, NFR-10
  - File Scope: `deploy/nginx/*`, `scripts/*`, `docs/api/*`, `backend/src/main_backend/app.py`
  - Depends on: TASK-P1-03
  - Acceptance:
    - EC2에서 `nginx`가 80 포트의 공개 진입점을 제공해야 한다.
    - 공개 API는 `/api/...` 경로로 메인 백엔드에 프록시되어야 한다.
    - AI 백엔드 `8001`은 외부 공개 없이 내부 호출 전용으로 유지되어야 한다.
    - 프론트가 사용할 base URL 문서와 OpenAPI 정보가 갱신되어야 한다.
  - Verify:
    - nginx 설정 문법 확인
    - 공개 `GET /api/health` 호출 확인
    - 기존 내부 `GET http://127.0.0.1:8000/health` 유지 확인

## 작업 순서 가이드

- `TASK-P0-01`과 `TASK-P0-02`로 두 서버를 먼저 띄운다.
- `TASK-P0-03`으로 두 서버 간 연결 계약을 고정한다.
- `TASK-P0-04`, `TASK-P0-06`은 AI 백엔드 내부 기반 작업으로 병렬 사고가 가능하다.
- `TASK-P0-05`는 `TASK-P0-04` 이후에만 시작한다.
- `TASK-P0-07`은 공용 DB 구조를 두 서버 기준으로 맞춘다.
- `TASK-P0-10`은 모든 핵심 기능이 연결된 뒤 마지막에 진행한다.

## 검토 코멘트

- Self Review: TASK-P0-01 완료. 일반 백엔드 FastAPI 골격, 기본 세션 API, 헬스체크, 로컬 테스트 통과.
- Self Review: TASK-P0-02~10 완료. AI 백엔드 FastAPI 진입점, 결정론적 scoring/matching, Bedrock 경계, fallback, 공용 저장소, 메인-투-AI 연결, 통합 테스트를 모두 구현했다.
- Self Review: TASK-P0-11 완료. 메인 백엔드 프로필 생성/목록/조회 API와 프론트 공유 문서를 추가했다.
- Self Review: TASK-P0-12 완료. 프로필별 생활 인터뷰 저장/조회 API와 조건부 필드 검증, 프론트 공유 문서를 추가했다.
- Self Review: TASK-P1-03 완료. 단일 EC2 기준 GitHub Actions 배포 워크플로, 원격 배포 스크립트, systemd 서비스 템플릿 추가.
- Self Review: TASK-P1-04 완료. nginx 공개 진입점, `/api` 프록시 규칙, 프론트 기준 base URL 문서를 추가했다.
