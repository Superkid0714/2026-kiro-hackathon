# RoomPACT Campus

Kiro Spec 기반으로 개발하는 RoomPACT Campus 해커톤 저장소입니다.

현재 브랜치의 Python 파일은 기능 구현이 아닌 **검증 가능한 코드 골격**입니다.
실제 비즈니스 로직은 팀 리더가 승인한 `.kiro/specs/roompact-campus/tasks.md`의
Task 단위로만 구현합니다.

## 요구 환경

- Python 3.12

## 초기 설정

```bash
python scripts/bootstrap.py
```

가상환경을 활성화한 뒤 검증합니다.

```bash
python scripts/verify.py
python scripts/architecture_check.py
```

검증 도구가 설치되지 않았거나 검사에 실패하면 성공으로 처리하지 않습니다.

## 기준 문서

- 제품·기술 기준: `.kiro/steering/`
- 기능 Spec: `.kiro/specs/roompact-campus/`
- 공통 에이전트 규칙: `AGENTS.md`

Kiro가 Spec을 관리하고, 팀 리더가 승인하며, Codex와 Claude Code는 승인된
Task의 구현만 담당합니다.
