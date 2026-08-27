# Traceability Matrix — 요구사항 추적표

> 요구사항부터 코드·검증까지의 연결을 기록한다.
> Task가 DONE으로 전환될 때 이 표에 행을 추가한다.

## 추적표

| Requirement | Task | Owner | Branch | Commit | Test Result | Date |
|-------------|------|-------|--------|--------|-------------|------|
| — | — | — | — | — | — | — |

## 작성 규칙

- Task가 DONE 상태로 전환될 때 행을 추가한다.
- Commit은 해당 Task의 최종 커밋 해시 (short, 7자)를 기록한다.
- Test Result는 `PASS` 또는 `FAIL` (FAIL이면 DONE이 될 수 없음).
- Branch는 작업한 브랜치 이름을 기록한다.
- 하나의 Task가 여러 Requirement를 충족하면 행을 분리한다.

## 예시

| Requirement | Task | Owner | Branch | Commit | Test Result | Date |
|-------------|------|-------|--------|--------|-------------|------|
| REQ-MATCH-03 | TASK-MATCH-02 | Codex | feat/matching-score | a31d2f1 | PASS | 2026-08-27 |
| REQ-CAL-02 | TASK-CAL-03 | Claude | feat/calendar-sync | b41f9a2 | PASS | 2026-08-28 |
| REQ-RULE-01 | TASK-RULE-01 | Kiro | feat/house-rules | c39e103 | PASS | 2026-08-29 |
