# RoomPACT Campus Tasks

> Spec Approval: PENDING — 팀장 [이름] — [날짜]
>
> 구현 시작 조건: 팀 리더가 `requirements.md`와 `design.md`를 승인한 뒤에만 아래 Task를 시작한다.

## 작업 운영 규칙

- 상태는 `READY`, `IN_PROGRESS`, `DONE`, `BLOCKED`만 사용한다.
- `BLOCKED`는 Spec-구현 충돌 또는 의존 Task 미완료에만 사용한다.
- 구현 에이전트는 `requirements.md`, `design.md`를 수정하지 않는다.
- Spec과 맞지 않는 부분을 발견하면 코드를 작성하지 말고 팀 리더에게 바로 보고한다.
- Kiro가 Acceptance 기준 대비 검토 코멘트를 남기고, 최종 `DONE` 전환은 팀 리더가 결정한다.
- 같은 파일 범위를 공유하는 Task는 동시에 진행하지 않는다.
- 커밋 메시지는 `Task #ID: 설명` 형식을 따른다.

## P0

- [ ] TASK-P0-01 Lambda 엔트리포인트와 공통 요청 흐름을 구현한다
  - Status: READY
  - Owner: unassigned
  - Requirement: FR-01.1, FR-01.2, FR-01.3, FR-08.1, FR-08.2, FR-08.3
  - File Scope: `handler.py`
  - Depends on: 없음
  - Acceptance:
    - Lambda 핸들러가 요청 본문을 파싱하고 필수 입력 누락을 검증할 수 있어야 한다.
    - 홀수 인원 또는 잘못된 입력 형식에 대해 구조화된 오류 응답을 반환해야 한다.
    - 이후 모듈 호출을 연결할 수 있는 오케스트레이션 골격이 존재해야 한다.
  - Verify:
    - 입력 누락 테스트
    - 홀수 인원 입력 테스트
    - 정상 입력에서 기본 응답 구조 확인 테스트

- [ ] TASK-P0-02 결정론적 학생 쌍 점수 계산을 구현한다
  - Status: READY
  - Owner: unassigned
  - Requirement: FR-02.1, FR-02.2, FR-02.3, FR-02.4, FR-02.5, FR-04.1, FR-04.2, FR-04.3
  - File Scope: `scoring.py`
  - Depends on: 없음
  - Acceptance:
    - 학생 쌍별 호환 점수와 추천 이유 근거를 계산해야 한다.
    - 필수 조건 충돌 쌍은 배정 후보에서 제외 가능한 형태로 표시되어야 한다.
    - 동일 입력에 대해 동일 점수와 동일 근거가 반환되어야 한다.
    - `llm_client.py` 또는 Bedrock 관련 import가 없어야 한다.
  - Verify:
    - 필수 조건 충돌 제외 테스트
    - 선호 가중치 반영 테스트
    - 동일 입력 재현성 테스트
    - 금지 import 검사 Hook 통과

- [ ] TASK-P0-03 networkx 기반 2인실 매칭을 구현한다
  - Status: READY
  - Owner: unassigned
  - Requirement: FR-03.1, FR-03.2, FR-03.3, FR-03.4, FR-03.5
  - File Scope: `matching.py`
  - Depends on: TASK-P0-02
  - Acceptance:
    - `networkx` 매칭 API를 사용해 전체 학생 집합의 2인실 배정을 계산해야 한다.
    - 한 학생이 정확히 하나의 페어에만 속해야 한다.
    - 완전 매칭이 불가능한 경우 구조화된 실패 결과를 반환해야 한다.
    - `llm_client.py` 또는 Bedrock 관련 import가 없어야 한다.
  - Verify:
    - 짝수 인원 완전 매칭 테스트
    - 매칭 불가 입력 테스트
    - 중복 배정 방지 테스트
    - 금지 import 검사 Hook 통과

- [ ] TASK-P0-04 Bedrock 클라이언트와 결정론적 fallback을 구현한다
  - Status: READY
  - Owner: unassigned
  - Requirement: FR-05.2, FR-05.3, FR-06.3, FR-07.3, NFR-02, NFR-03
  - File Scope: `llm_client.py`, `fallback.py`
  - Depends on: 없음
  - Acceptance:
    - Bedrock 호출 코드는 `llm_client.py` 한 곳에만 있어야 한다.
    - 갈등 시나리오, 협상안, Pact 각각에 대한 결정론적 fallback 템플릿이 존재해야 한다.
    - LLM 호출 실패를 상위 모듈이 fallback으로 처리할 수 있는 형태로 노출해야 한다.
  - Verify:
    - Bedrock 호출 래퍼 단위 테스트
    - fallback 출력 형식 테스트
    - LLM 예외 발생 시 상위 처리를 위한 예외 테스트

- [ ] TASK-P0-05 갈등 시나리오 생성 모듈을 구현한다
  - Status: READY
  - Owner: unassigned
  - Requirement: FR-05.1, FR-05.2, FR-05.3, FR-05.4
  - File Scope: `scenario.py`
  - Depends on: TASK-P0-04
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

- [ ] TASK-P0-06 협상안 문장화와 Pact 생성을 구현한다
  - Status: READY
  - Owner: unassigned
  - Requirement: FR-06.1, FR-06.2, FR-06.3, FR-07.1, FR-07.2, FR-07.3
  - File Scope: `negotiate.py`, `pact.py`
  - Depends on: TASK-P0-04
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

- [ ] TASK-P0-07 전체 Lambda 응답 조립과 핵심 통합 테스트를 완료한다
  - Status: READY
  - Owner: unassigned
  - Requirement: FR-04.1, FR-04.2, FR-08.1, FR-08.2, FR-08.3, NFR-01, NFR-02
  - File Scope: `handler.py`
  - Depends on: TASK-P0-02, TASK-P0-03, TASK-P0-05, TASK-P0-06
  - Acceptance:
    - 배정 결과, 코드 기반 추천 이유, 선택적 보조 문장을 하나의 응답 구조로 조립해야 한다.
    - LLM 실패가 전체 요청 실패로 이어지지 않아야 한다.
    - 동일 입력에 대해 핵심 배정 결과가 재현 가능해야 한다.
  - Verify:
    - 성공 응답 통합 테스트
    - LLM fallback 통합 테스트
    - 동일 입력 재현성 통합 테스트

## P1

- [ ] TASK-P1-01 저장 시 lint와 test를 실행하는 Hook을 추가한다
  - Status: READY
  - Owner: unassigned
  - Requirement: FR-09.1, FR-09.3
  - File Scope: `.kiro/hooks/*`, `scripts/verify.ps1`
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
  - Requirement: FR-09.2, FR-09.3, NFR-03
  - File Scope: `.kiro/hooks/*`
  - Depends on: TASK-P0-02, TASK-P0-03
  - Acceptance:
    - `scoring.py`와 `matching.py`에 Bedrock 또는 네트워크 호출 관련 import가 있을 때 Hook이 실패해야 한다.
    - 허용되지 않는 import가 없으면 Hook이 통과해야 한다.
    - 이 Hook 외 추가 Hook을 만들지 않아야 한다.
  - Verify:
    - 금지 import 샘플 감지 테스트
    - 정상 파일 통과 테스트

## 작업 순서 가이드

- `TASK-P0-02`와 `TASK-P0-04`는 병렬 가능하다.
- `TASK-P0-03`은 `TASK-P0-02` 이후에만 시작한다.
- `TASK-P0-05`와 `TASK-P0-06`은 `TASK-P0-04` 이후에만 시작한다.
- `TASK-P0-07`은 `handler.py`를 다시 수정하므로 마지막에 진행한다.
- `TASK-P1-02`는 `scoring.py`, `matching.py` 파일이 잡힌 뒤 진행한다.

## 검토 코멘트

- Kiro Review: 대기 중
- Team Lead Decision: 대기 중
