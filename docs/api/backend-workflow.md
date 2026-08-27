# Backend Workflow

이 문서는 앞으로 메인 백엔드 API를 추가할 때 따르는 작업 흐름을 정리한다.

## 메인 원칙

- 프론트가 호출하는 공개 API는 메인 백엔드에 둔다.
- AI 처리, 점수 계산, 매칭 로직은 AI 백엔드에 둔다.
- 프론트와 공유할 계약은 먼저 `docs/api/main-backend.md`에 반영한다.
- 구현 후 `backend/scripts/verify.ps1`를 실행한다.

## 새 API를 추가할 때 순서

1. 프론트 요구 필드 확인
2. 공개 엔드포인트를 메인 백엔드에 추가할지 결정
3. 메인 백엔드만으로 끝나는지, AI 백엔드 호출이 필요한지 결정
4. 요청/응답 예시를 `docs/api/main-backend.md`에 먼저 추가
5. `backend/src/main_backend/routes/`에 라우트 추가
6. 필요하면 `backend/src/main_backend/services/`에 서비스 추가
7. 테스트 추가
8. `backend/scripts/verify.ps1` 실행
9. `backend/scripts/export_openapi.py` 실행

## 파일 기준

- 라우트: `backend/src/main_backend/routes/`
- 서비스: `backend/src/main_backend/services/`
- 테스트: `backend/tests/main_backend/`
- 프론트 공유 문서: `docs/api/`

## 메인 백엔드가 책임지는 대표 API 유형

- 세션 생성/조회
- 프로필 생성/조회
- 입력 검증
- 데모 데이터 조회
- 인증 연동
- AI 백엔드 실행 트리거
- 결과 정리 및 프론트 응답 변환
