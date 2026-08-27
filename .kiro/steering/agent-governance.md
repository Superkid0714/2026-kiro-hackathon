---
inclusion: auto
---

# Agent Governance — 에이전트 권한·책임·경계

## 문서 우선순위

충돌 발생 시 아래 순서로 상위 문서가 우선한다.

1. 승인된 `requirements.md`
2. `design.md`
3. `AGENTS.md`
4. 담당 Task의 Acceptance 조건
5. 에이전트의 자체 판단

## 역할 분리

| 역할 | 담당 Agent | 권한 |
|------|-----------|------|
| Spec 관리 (요구사항·설계·Task 생성/변경) | **Kiro** | 생성, 수정, 승인 |
| Task 구현 | **Codex, Claude Code** | 승인된 Task의 코드 작성 |
| 검증 (자동) | **Guardrail 스크립트** | 계약 위반 차단 |

## 구현 Agent 경계 규칙

- 구현 Agent는 `requirements.md`, `design.md`를 임의로 수정할 수 **없다**.
- 설계 변경이 필요하면 `docs/harness/change-request.md`에 요청을 기록한다.
- 테스트 실패(`scripts/verify.ps1`) 상태에서 Task를 DONE으로 전환할 수 **없다**.
- 동일 Task를 여러 Agent가 동시에 작업하지 **않는다** (Owner 필드로 배타적 할당).
- Spec에 없는 기능을 임의로 추가하지 **않는다**.

## Change Request 절차

1. 구현 Agent가 `docs/harness/change-request.md`에 양식을 작성한다.
2. Kiro가 검토 후 승인/반려한다.
3. 승인되면 Kiro가 Spec을 수정하고, 관련 Task를 갱신한다.
4. 구현 Agent는 갱신된 Task를 기반으로 작업을 재개한다.

## Guardrail 자동 검증

`scripts/harness-check.ps1`이 아래를 자동 검사한다:

- Spec 필수 파일 존재 여부
- Task 계약 필드 완전성
- 완료 Task의 검증 기록 및 handoff 기록 존재
- 환경변수·시크릿의 Git 포함 여부

위반 시 exit code ≠ 0 을 반환하며, Hook이 Task 완료를 차단한다.
