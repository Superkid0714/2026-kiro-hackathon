---
inclusion: auto
---

# Tech — 기술 스택과 개발 환경 규칙

> 이 문서는 프로젝트의 기술 스택과 개발 컨벤션을 정의한다.

## 기술 스택

- **언어**: (예: TypeScript 5.x)
- **런타임**: (예: Node.js 20 LTS)
- **프레임워크**: (예: Next.js 14)
- **패키지 매니저**: (예: pnpm)
- **테스트**: (예: Vitest)
- **린터**: (예: ESLint + Prettier)

## 개발 규칙

- 의존성 추가 시 정확한 버전을 고정한다 (^ 또는 ~ 사용 금지).
- 새 의존성은 반드시 Spec에서 승인된 것만 사용한다.
- 환경변수는 `.env.example`에 키 이름만 기록하고, 값은 커밋하지 않는다.

## 검증 명령

```bash
scripts/verify
```

이 스크립트는 lint → typecheck → test 순서로 실행한다.
