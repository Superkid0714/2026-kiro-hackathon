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
├── scripts/            # 빌드·검증 스크립트
├── src/                # 소스 코드 (프로젝트에 맞게 구성)
├── tests/              # 테스트 코드
├── AGENTS.md           # 공통 에이전트 규칙
├── CLAUDE.md           # Claude Code 진입점
└── .gitignore
```

## 네이밍 규칙

- 디렉토리: `kebab-case`
- 소스 파일: 언어 컨벤션을 따른다 (예: TypeScript → `camelCase.ts`, Python → `snake_case.py`)
- Spec 디렉토리: `.kiro/specs/<feature-name>/`
- 테스트 파일: `*.test.*` 또는 `*.spec.*`

## 새 파일 생성 시

1. 이 구조에 맞는 위치에 생성한다.
2. 구조 변경이 필요하면 이 문서를 먼저 수정한다.
3. 변경 사항은 커밋 메시지에 명시한다.
