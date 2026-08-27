# CLAUDE.md — Claude Code 진입점

@AGENTS.md

## 프로젝트 지침

아래 steering 문서를 반드시 읽고 작업에 반영한다:

- `.kiro/steering/product.md` — 제품 비전과 핵심 원칙
- `.kiro/steering/tech.md` — 기술 스택과 개발 환경 규칙
- `.kiro/steering/structure.md` — 프로젝트 디렉토리 구조와 네이밍 규칙

## Claude Code 추가 지침

- Kiro가 생성한 Spec(`.kiro/specs/`)을 단일 기준 문서로 취급한다.
- Spec을 임의로 수정하지 않는다. 수정이 필요하면 제안만 한다.
- 작업 완료 시 `docs/handoff.md`에 핸드오프 기록을 남긴다.
- 작업 완료 전 `backend/scripts/verify.ps1`를 실행한다.
