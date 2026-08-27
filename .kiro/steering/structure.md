---
inclusion: auto
---

# Structure — 프로젝트 디렉토리 구조와 네이밍 규칙

> 이 문서는 프로젝트의 디렉토리 레이아웃과 파일 네이밍 컨벤션을 정의한다.

## 디렉토리 구조

```
.
├── .kiro/
│   ├── specs/          # Spec 문서 (requirements, design, tasks)
│   └── steering/       # 프로젝트 지침 (product, tech, structure)
├── docs/               # 핸드오프, 의사결정 기록
├── backend/            # 백엔드 전용 작업 디렉토리
│   ├── pyproject.toml
│   ├── .env.example
│   ├── src/
│   │   ├── main_backend/
│   │   │   ├── app.py
│   │   │   ├── routes/
│   │   │   └── services/
│   │   └── ai_backend/
│   │       ├── app.py
│   │       ├── handler.py
│   │       ├── scoring.py
│   │       ├── matching.py
│   │       ├── scenario.py
│   │       ├── negotiate.py
│   │       ├── pact.py
│   │       ├── llm_client.py
│   │       └── fallback.py
│   ├── scripts/        # 백엔드 검증 스크립트
│   └── tests/          # pytest 기반 테스트 코드
│       ├── main_backend/
│       └── ai_backend/
├── scripts/            # 배포·운영 스크립트
├── AGENTS.md           # 공통 에이전트 규칙
├── CLAUDE.md           # Claude Code 진입점
└── .gitignore
```

## 네이밍 규칙

- 디렉토리: `kebab-case`
- 소스 파일: Python `snake_case.py`
- Spec 디렉토리: `.kiro/specs/<feature-name>/`
- 테스트 파일: `test_*.py`
- 메인 백엔드 코드는 `backend/src/main_backend/` 아래에 둔다
- AI 백엔드 코드는 `backend/src/ai_backend/` 아래에 둔다
- 백엔드 테스트 코드는 `backend/tests/` 아래에 둔다
- 백엔드 검증 스크립트는 `backend/scripts/` 아래에 둔다
- 프론트엔드와 공유하는 예제 payload, 샘플 JSON은 필요 시 `docs/` 또는 `tests/fixtures/` 아래에 둔다

## 새 파일 생성 시

1. 이 구조에 맞는 위치에 생성한다.
2. 구조 변경이 필요하면 이 문서를 먼저 수정한다.
3. 변경 사항은 커밋 메시지에 명시한다.

## 작업 경계

- 이 저장소는 AI + 백엔드 중심 구조를 유지한다.
- 추후 프론트엔드가 합류하더라도 백엔드 관련 구현은 `backend/` 디렉토리 안에 유지한다.
- Gradio UI 자체 구현 파일은 이 저장소의 핵심 구조로 가정하지 않는다.
- 프론트 팀과 연동하는 산출물은 API 명세, 샘플 요청/응답, 데모 시나리오 중심으로 정리한다.
- 메인 백엔드와 AI 백엔드는 서로 다른 서버로 실행될 수 있으므로 공용 DB 스키마와 API 계약을 우선 맞춘다.
