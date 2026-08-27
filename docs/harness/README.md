# Harness Overview

이 문서는 이 저장소의 기본 하네스 세팅을 한 곳에 정리한 운영 문서다.
Kiro, Codex, Claude Code가 같은 기준으로 Spec을 만들고, 구현하고, 검증하고, handoff할 수 있도록 공통 규칙을 요약한다.

## 목적

- Spec 기반 개발의 단일 기준을 명확히 유지한다.
- 에이전트별 책임과 수정 권한을 분리한다.
- Task를 실행 가능한 계약 단위로 고정한다.
- 완료 전 검증과 기록 절차를 강제한다.

## 핵심 구조

```text
.
├── AGENTS.md
├── CLAUDE.md
├── .claude/
│   ├── agents/kfc/
│   └── system-prompts/
├── .kiro/
│   ├── specs/
│   ├── steering/
│   └── hooks/
├── docs/
│   ├── handoff.md
│   └── harness/
│       ├── README.md
│       ├── change-request.md
│       ├── task-contract.md
│       └── traceability.md
└── scripts/
    ├── verify.ps1
    └── harness-check.ps1
```

## 파일 역할

- `AGENTS.md`: 모든 에이전트가 따라야 하는 공통 작업 규칙
- `CLAUDE.md`: Claude Code 전용 진입점과 추가 지침
- `.kiro/steering/`: 제품, 기술, 구조, 거버넌스 관련 프로젝트 지침
- `.kiro/specs/{feature}/`: 기능별 Spec 산출물 저장소
- `.claude/agents/kfc/`: spec workflow용 서브 에이전트 정의
- `.claude/system-prompts/spec-workflow-starter.md`: spec workflow 메인 시스템 프롬프트
- `docs/handoff.md`: 작업 완료 후 에이전트 간 handoff 기록
- `docs/harness/task-contract.md`: Task 문서 형식과 상태 전이 계약
- `docs/harness/change-request.md`: 구현 중 Spec 변경 요청 기록
- `docs/harness/traceability.md`: Requirement -> Task -> Commit -> Test 추적 기록
- `scripts/verify.ps1`: lint, typecheck, test 검증 스크립트
- `scripts/harness-check.ps1`: 하네스 계약 준수 여부 검사 스크립트

## 단일 기준 문서

기능 구현의 단일 기준은 `.kiro/specs/{feature}/` 아래 문서다.

- `requirements.md`: 기능 요구사항
- `design.md`: 설계와 아키텍처 결정
- `tasks.md`: 구현 계획과 Task 계약

추가 프로젝트 규칙은 `.kiro/steering/` 문서에서 관리한다.

## 문서 우선순위

충돌 시 아래 순서로 상위 문서가 우선한다.

1. 승인된 `requirements.md`
2. `design.md`
3. `tasks.md`의 Task 계약과 Acceptance
4. `AGENTS.md`
5. `.kiro/steering/` 문서

## 에이전트 역할 분리

- `Kiro`: Spec 생성, 수정, 승인 담당
- `Codex`, `Claude Code`: 승인된 Task 구현 담당
- `Guardrail 스크립트`: 계약 위반 자동 검사 담당

구현 에이전트는 `requirements.md`와 `design.md`를 임의로 수정하지 않는다.
Spec 변경이 필요하면 `docs/harness/change-request.md`에 요청을 남긴다.

## Spec Workflow

Spec 작업은 아래 순서로 진행한다.

1. 요구사항 작성 및 승인
2. 설계 작성 및 승인
3. Task 계획 작성 및 승인
4. 승인된 Task 구현
5. 검증, handoff, traceability 기록

Spec 관련 경로는 모두 `.kiro/specs/{feature}/`를 기준으로 사용한다.

## Task 계약

모든 Task는 `docs/harness/task-contract.md` 형식을 따른다.

필수 필드:

- `ID`
- `Status`
- `Owner`
- `Requirement`
- `Acceptance`
- `Verify`

선택 필드:

- `Depends on`
- `Input`

상태 전이:

```text
READY -> IN_PROGRESS -> VERIFYING -> DONE
                               -> BLOCKED
```

규칙:

- 한 번에 하나의 Task만 구현한다.
- Spec에 없는 기능을 임의로 추가하지 않는다.
- 검증 실패 시 `DONE`으로 전환할 수 없다.
- 완료된 Task는 체크박스를 `- [x]`로 갱신한다.
- `DONE` 전환 전 handoff와 traceability를 반드시 기록한다.

## 검증 흐름

구현 완료 전 아래 두 스크립트를 모두 실행한다.

```powershell
./scripts/verify.ps1
./scripts/harness-check.ps1
```

검증 기준:

- `verify.ps1`: lint, typecheck, test 실행
- `harness-check.ps1`: Spec 필수 파일, Task 계약, DONE Task handoff, 민감 파일 추적 여부 검사

두 스크립트가 모두 통과해야 Task를 `DONE`으로 전환할 수 있다.

## Handoff와 Traceability

Task가 완료되면 아래 문서를 함께 갱신한다.

- `docs/handoff.md`: 누가 무엇을 변경했고 테스트 결과가 어땠는지 기록
- `docs/harness/traceability.md`: 어떤 Requirement가 어떤 Task, Commit, Test로 연결되는지 기록

이 두 기록은 완료 보고의 일부이며 선택 사항이 아니다.

## Change Request

구현 중 아래 상황이 나오면 즉시 변경 요청을 기록한다.

- 승인된 Spec만으로 구현이 불가능한 경우
- 설계와 요구사항이 충돌하는 경우
- Task 범위를 넘는 변경이 필요한 경우

기록 위치:

- `docs/harness/change-request.md`

변경 요청은 Kiro가 검토하고, 승인된 뒤에만 Spec을 갱신한다.

## 기본 세팅의 의미

현재 세팅은 기능 구현 코드 자체가 아니라, 기능 개발을 안정적으로 진행하기 위한 운영 프레임이다.
즉 이 저장소는 다음 상태까지 준비된 것이다.

- Spec을 기능별로 생성할 수 있다.
- 여러 에이전트가 같은 규칙으로 작업할 수 있다.
- Task를 계약 단위로 실행할 수 있다.
- 완료 전 자동 검증과 기록 절차를 적용할 수 있다.

다음 단계는 실제 기능별 Spec을 `.kiro/specs/{feature}/` 아래에 만드는 것이다.
