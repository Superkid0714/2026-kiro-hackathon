# Task Contract — Task 계약 형식

## 목적

모든 Task는 아래 계약 형식을 따라야 한다. 이 형식은 Task의 입력·완료 조건을 고정하여 구현 Agent가 범위를 벗어나지 않도록 보장한다.

## 필수 필드

| 필드 | 설명 | 예시 |
|------|------|------|
| ID | 고유 식별자 | `TASK-MATCH-02` |
| Status | 현재 상태 | `READY` |
| Owner | 담당 Agent | `Codex` / `Claude` / `unassigned` |
| Requirement | 연결된 요구사항 ID | `REQ-MATCH-03` |
| Depends on | 선행 Task (없으면 생략) | `TASK-MATCH-01` |
| Input | 구현에 필요한 입력 조건 | 데이터, 인터페이스 등 |
| Acceptance | 완료 판정 기준 (모두 충족 필수) | 검증 가능한 조건 목록 |
| Verify | 검증 방법 (테스트·스크립트) | 테스트 케이스 목록 |

## 상태 전이

```
READY → IN_PROGRESS → VERIFYING → DONE
                        └→ BLOCKED
```

| 상태 | 의미 | 전환 조건 |
|------|------|-----------|
| `READY` | 구현 가능. Owner 배정 대기 또는 배정 완료 | 선행 Task가 DONE |
| `IN_PROGRESS` | 구현 중 | Owner가 작업 시작 |
| `VERIFYING` | 구현 완료, 검증 진행 중 | Owner가 verify 실행 |
| `DONE` | 모든 Acceptance 충족, 검증 통과 | verify PASS + handoff 기록 |
| `BLOCKED` | 진행 불가 (의존성·결함·변경 필요) | 검증 실패 또는 블로커 발생 |

## tasks.md 작성 예시

```markdown
- [ ] TASK-MATCH-02 매칭 점수 계산 구현
  - Status: READY
  - Owner: unassigned
  - Requirement: REQ-MATCH-03
  - Depends on: TASK-MATCH-01

  - Input:
    - 학생별 생활패턴 응답 데이터
    - 필수 조건 목록
    - 선호 조건과 가중치 설정

  - Acceptance:
    - 필수 조건 위반 학생이 결과에 포함되지 않아야 한다
    - 모든 학생은 정확히 하나의 그룹에만 포함되어야 한다
    - 매칭 결과에 추천 이유가 포함되어야 한다

  - Verify:
    - 필수 조건 위반 시 제외 테스트
    - 전체 학생 배정 완전성 테스트
    - 동일 입력 결과 재현성 테스트
```

## 규칙

- Acceptance 조건은 검증 가능한 문장으로 작성한다 (모호한 표현 금지).
- Verify는 자동화된 테스트로 확인 가능해야 한다.
- DONE 전환 시 `docs/handoff.md`에 기록이 있어야 한다.
- 검증 실패 시 BLOCKED로 전환하고 사유를 기록한다.
