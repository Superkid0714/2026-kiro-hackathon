---
inclusion: auto
---

# Tech — 기술 스택과 개발 환경 규칙

> 이 문서는 프로젝트의 기술 스택과 개발 컨벤션을 정의한다.

## 기술 스택

- **언어**: Python 3.12
- **메인 백엔드 런타임**: Python 서버 애플리케이션
- **AI 백엔드 런타임**: Python 서버 애플리케이션
- **AI 모델 호출**: Gemini API
- **데이터 저장**: DynamoDB
- **프로토타입 연동 대상**: Gradio 프론트엔드
- **핵심 라이브러리**: `networkx`
- **테스트**: `pytest`
- **린터**: `ruff`

## 개발 규칙

- 의존성 추가 시 정확한 버전을 고정한다 (^ 또는 ~ 사용 금지).
- 새 의존성은 반드시 Spec에 반영된 것만 사용한다.
- 환경변수는 `.env.example`에 키 이름만 기록하고, 값은 커밋하지 않는다.
- Gemini API 호출 코드는 `llm_client.py` 한 곳에만 둔다.
- `scoring.py`, `matching.py`는 외부 네트워크 호출과 Gemini API 관련 import를 포함하면 안 된다.
- 점수 계산, 배정 결과, 갈등 우선순위는 코드가 결정한다. LLM은 이를 덮어쓰면 안 된다.
- 메인 백엔드와 AI 백엔드의 경계는 HTTP API 계약으로 명확히 유지한다.
- 프론트엔드와 메인 백엔드의 경계도 HTTP API 계약으로 명확히 유지한다.
- 이 저장소는 AI + 백엔드 기준의 SSOT이며, UI 구현 세부는 별도 프론트 작업과 조정한다.

## AWS 설계 원칙

- 기본 구조는 `Main Backend + AI Backend + Gemini API + Shared Storage`를 사용한다.
- 백엔드는 2개로 분리하되, 책임을 명확히 나누고 공용 DynamoDB를 함께 사용한다.
- 메인 백엔드는 사용자 입력, 세션 상태, 기본 조회를 담당한다.
- AI 백엔드는 점수 계산, 매칭, 시나리오 생성, 협상안 생성, Pact 생성을 담당한다.
- DynamoDB에는 설문 입력, 매칭 결과, 생성된 Pact/협상 결과 중 데모에 필요한 최소 데이터만 저장한다.
- 정적 프론트 배포가 필요한 경우 CloudFront 또는 S3/CloudFront 조합은 프론트 팀 범위로 두고, 이 저장소는 백엔드 API 기준을 제공한다.

## 검증 명령

```powershell
./backend/scripts/verify.ps1
```

이 스크립트는 lint → typecheck → test 순서로 실행한다.
