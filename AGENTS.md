# AGENTS.md — 공통 작업 규칙

이 문서는 Kiro, Codex, Claude Code 등 모든 AI 에이전트가 이 저장소에서 작업할 때 따라야 하는 규칙을 정의한다.

## 단일 기준 문서 (Single Source of Truth)

- **요구사항**: `.kiro/specs/*/requirements.md`
- **설계**: `.kiro/specs/*/design.md`
- **작업 목록**: `.kiro/specs/*/tasks.md`
- **프로젝트 지침**: `.kiro/steering/` 디렉토리

문서 우선순위는 다음과 같다.
1. `.kiro/specs/*/requirements.md`
2. `.kiro/specs/*/design.md`
3. `.kiro/specs/*/tasks.md`의 Task 정의와 Acceptance
4. `AGENTS.md`
5. `.kiro/steering/` 문서

Spec이 모든 구현 의사결정의 기준이다.

## 작업 시작 전 필수 확인

1. 관련 `requirements.md`를 읽고 요구사항을 파악한다.
2. `design.md`를 읽고 아키텍처와 설계 결정을 이해한다.
3. `tasks.md`를 읽고 현재 진행할 Task를 확인한다.

## Task 형식

모든 Task는 `tasks.md` 안에서 직접 관리한다.
권장 필드: `ID`, `Status`, `Owner`, `Requirement`, `Acceptance`, `Verify`, `File Scope`, `Depends on`.
상태는 `READY`, `IN_PROGRESS`, `DONE`, `BLOCKED`만 사용한다.

## 구현 규칙

- **한 번에 하나의 Task만 구현한다.** 여러 Task를 동시에 처리하지 않는다.
- **Spec에 없는 기능을 임의로 추가하지 않는다.** 충돌이나 빈칸이 보이면 먼저 Spec을 수정한 뒤 구현한다.
- **아키텍처 변경이 필요하면 `design.md`를 먼저 수정한다.** 코드보다 설계 문서가 선행한다.
- **구현 완료 전 검증을 실행한다.** `backend/scripts/verify.ps1`를 사용한다.
- **검증 실패 시 DONE으로 전환할 수 없다.** BLOCKED 상태로 전환하고 사유를 기록한다.
- **완료된 Task는 `tasks.md`에서 체크 표시한다.** 미완료 사항이나 블로커가 있으면 함께 기록한다.
- **DONE 전환 전 handoff를 기록한다.** `docs/handoff.md`

## Hook 원칙

Hook은 최소한으로 유지한다.
- 저장 시 `lint + test`를 실행하는 Hook 1개
- `scoring.py`, `matching.py`에 Bedrock 또는 네트워크 호출 관련 import가 없는지 검사하는 Hook 1개

총 2개만 유지한다.

## 핸드오프

작업을 마칠 때:
1. `docs/handoff.md`에 핸드오프 기록을 남긴다.

## 커밋 규칙

- 커밋 메시지는 `Task #ID: 설명` 형식을 따른다.
- 하나의 커밋에 하나의 논리적 변경만 포함한다.
