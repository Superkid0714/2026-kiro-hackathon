# AGENTS.md — 공통 작업 규칙

이 문서는 Kiro, Codex, Claude Code 등 모든 AI 에이전트가 이 저장소에서 작업할 때 따라야 하는 규칙을 정의한다.

## 단일 기준 문서 (Single Source of Truth)

- **요구사항**: `.kiro/specs/*/requirements.md`
- **설계**: `.kiro/specs/*/design.md`
- **작업 목록**: `.kiro/specs/*/tasks.md`
- **프로젝트 지침**: `.kiro/steering/` 디렉토리

문서 우선순위는 다음과 같다.
1. 승인된 `.kiro/specs/*/requirements.md`
2. `.kiro/specs/*/design.md`
3. `.kiro/specs/*/tasks.md`의 Task 계약과 Acceptance
4. `AGENTS.md`
5. `.kiro/steering/` 문서

Spec과 작업 계약이 모든 구현 의사결정의 기준이다.

## 작업 시작 전 필수 확인

1. 관련 `requirements.md`를 읽고 요구사항을 파악한다.
2. `design.md`를 읽고 아키텍처와 설계 결정을 이해한다.
3. `tasks.md`를 읽고 현재 진행할 Task를 확인한다.

## Task 계약 (Contract)

모든 Task는 `docs/harness/task-contract.md`에 정의된 계약 형식을 따른다.
필수 필드: ID, Status, Owner, Requirement, Acceptance, Verify.
상태 전이: `READY -> IN_PROGRESS -> VERIFYING -> DONE`, 실패 시 `BLOCKED`.

## 구현 규칙

- **한 번에 하나의 Task만 구현한다.** 여러 Task를 동시에 처리하지 않는다.
- **Spec에 없는 기능을 임의로 추가하지 않는다.** 필요하다고 판단되면 `docs/harness/change-request.md`에 변경 요청을 기록한다.
- **아키텍처 변경이 필요하면 `design.md`를 먼저 수정한다.** 코드보다 설계 문서가 선행한다.
- **구현 완료 전 검증을 실행한다.** `scripts/verify.ps1` + `scripts/harness-check.ps1`을 사용한다.
- **검증 실패 시 DONE으로 전환할 수 없다.** BLOCKED 상태로 전환하고 사유를 기록한다.
- **완료된 Task는 `tasks.md`에서 체크 표시한다.** 미완료 사항이나 블로커가 있으면 함께 기록한다.
- **DONE 전환 전 handoff와 traceability를 기록한다.** `docs/handoff.md`, `docs/harness/traceability.md`

## 자동 Guardrail

Kiro Hook이 Task 완료 시 자동으로 다음을 검사한다:
- Spec 필수 파일 존재 여부
- Task 계약 필드 완전성
- 완료 Task의 handoff 기록 존재
- 환경변수·시크릿의 Git 포함 여부

위반 시 Task 완료가 차단된다.

## 핸드오프 및 추적 (Traceability)

작업을 마칠 때:
1. `docs/handoff.md`에 핸드오프 기록을 남긴다.
2. `docs/harness/traceability.md`에 Requirement→Task→Commit→Test 연결을 기록한다.

## 커밋 규칙

- 커밋 메시지에 Task ID를 포함한다 (예: `[TASK-3] Add user auth middleware`)
- 하나의 커밋에 하나의 논리적 변경만 포함한다.
- Spec 변경과 코드 변경은 별도 커밋으로 분리한다.
