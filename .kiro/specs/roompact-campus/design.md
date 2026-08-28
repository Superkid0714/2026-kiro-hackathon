# RoomPACT Campus Design

## 개요

`RoomPACT Campus`는 기숙사 2인실 룸메이트 배정을 수행하는 `일반 백엔드 + AI 백엔드` 구조의 시스템이다.
핵심 배정 로직은 AI 백엔드 내부의 Python 코드와 `networkx` 매칭 알고리즘으로 처리하고, LLM은 보조 문장 생성 경계에서만 선택적으로 호출한다.
이 설계의 목적은 해커톤 심사에서 `문제 해결성`, `AI 활용의 적절성`, `프로토타입 시연 가능성`, `AWS 활용`을 명확히 보여주는 AI + 백엔드 기반을 만드는 것이다.

## 설계 목표

- 배정 결정은 전적으로 코드 기반으로 유지한다.
- LLM 사용을 보조 서술 생성 3개 지점으로 제한한다.
- Gemini API 의존성을 `llm_client.py`에만 격리한다.
- 장애 시 fallback으로 동일한 기능 경계를 유지한다.
- 일반 백엔드와 AI 백엔드의 책임을 분리해 복잡도를 제어한다.
- Gradio 프로토타입이 빠르게 시연할 수 있도록 단순하고 설명 가능한 응답 계약을 제공한다.
- AWS 활용 포인트가 발표에서 명확히 설명되도록 저장과 추론 경계를 분리한다.

## 범위 결정

- 지원 범위: 2인실 배정만 처리
- 비지원 범위: 3인 이상 그룹 배정, 독자 최적화 엔진, 마이크로서비스 분리

## 런타임 및 의존성

- 일반 백엔드 런타임: Python on EC2
- AI 백엔드 런타임: Python on EC2
- 핵심 라이브러리: `networkx`
- LLM 제공자: Gemini API
- 저장소: PostgreSQL (운영), 로컬 JSON (개발 fallback)

## 서비스 분리

### 일반 백엔드

- 프론트엔드 요청 수신
- 학생 프로필 저장 및 조회
- 학생 생활 인터뷰 저장 및 조회
- 학생 생활 인터뷰 기반 캐릭터 유형 산출
- 학생 추천 후보 자동 계산 및 조회
- 지도 탭용 국토부 오피스텔 전월세 실거래가 조회 프록시
- 추천 후보 간 상호 수락 요청 관리
- 상호 수락 완료 후 1:1 채팅방 생성 및 메시지 저장
- 카카오 로그인 코드 교환과 서비스 사용자 식별
- WebSocket 기반 실시간 채팅 연결 관리
- 학생 입력 저장
- 세션/결과 조회
- AI 백엔드 호출
- 프론트엔드용 응답 정리

### AI 백엔드

- 입력 검증 보조
- 점수 계산
- 2인실 매칭
- 갈등 시나리오 생성
- 협상안 생성
- 결과 저장

## AI 백엔드 모듈 구조

```text
app.py
handler.py
scoring.py
matching.py
scenario.py
negotiate.py
pact.py
llm_client.py
fallback.py
```

## 모듈 책임

### `handler.py`

- AI 백엔드 엔트리포인트
- 요청 파싱과 입력 검증 보조
- 점수 계산, 배정 계산, 선택적 LLM 보조 흐름 오케스트레이션
- PostgreSQL 저장/조회 호출 조정
- 최종 응답 직렬화
- 오류 응답 포맷 통일

### `app.py`

- AI 백엔드 서버 진입점
- 라우트 등록
- 설정 로딩
- `handler.py`와 HTTP 계층 연결

### `scoring.py`

- 학생 쌍별 호환 점수 계산
- 필수 조건 충돌 판정
- Hardcut 조건 충돌 판정
- 추천 이유 근거 데이터 생성
- 외부 네트워크 호출 금지
- `llm_client.py` import 금지

### `matching.py`

- 점수 결과를 그래프로 변환
- `networkx.min_weight_matching` 또는 부호 반전 기반 `max_weight_matching` 적용
- 학생 1인당 정확히 1개 페어가 되도록 결과 정규화
- 배정 실패 상황을 구조화해 반환
- 외부 네트워크 호출 금지
- `llm_client.py` import 금지

### `scenario.py`

- 갈등 시나리오 생성 여부 판단
- 필요 시 `llm_client.py` 호출
- 실패 시 `fallback.py`로 대체
- 반환 형식은 `narrative` 문자열 1개와 `source` 필드 (`llm` 또는 `fallback`)를 포함해야 한다

### `negotiate.py`

- 협상안 문장화 여부 판단
- 입력 갈등 요약을 문장화
- 채팅 단계에서 추가로 확인하면 좋은 질문 후보 생성
- 실패 시 `fallback.py`로 대체
- 반환 형식은 협상 제안 문자열 배열 `suggestions`와 `source` 필드 (`llm` 또는 `fallback`)를 포함해야 한다
- `suggestions`는 항상 하나의 최종 협상안을 구성하는 조항들의 배열이며, 여러 대안 중 하나를 선택하게 하는 용도가 아니다
- 질문 추천 반환 형식은 질문 문자열 배열 `questions`와 `source` 필드 (`llm` 또는 `fallback`)를 포함해야 한다

### `pact.py`

- 생활 규칙 Pact 문구 생성 여부 판단
- 쌍별 생활 규칙 요약을 문장으로 조합
- 실패 시 `fallback.py`로 대체
- 반환 형식은 Pact 규칙 문자열 배열 `rules`와 `source` 필드 (`llm` 또는 `fallback`)를 포함해야 한다

### `llm_client.py`

- Gemini API 요청 생성
- 모델 호출
- 응답 파싱
- 호출 오류를 도메인 친화적 예외로 변환
- 프로젝트 내 유일한 Gemini API 접근 지점
- 각 호출 타입은 `scenario`, `negotiate`, `pact` 중 하나로 명시되어 상위 모듈이 응답 형식을 해석할 수 있어야 한다

### `fallback.py`

- 갈등 시나리오 템플릿
- 협상안 템플릿
- Pact 템플릿
- 입력 데이터만으로 결정론적 문장 생성
- 갈등 시나리오는 `narrative` 문자열을 반환해야 한다
- 협상안은 `suggestions` 문자열 배열을 반환해야 한다
- Pact는 `rules` 문자열 배열을 반환해야 한다

## AWS 아키텍처

### 구성 요소

- Gradio 프론트엔드: 시연용 입력/결과 화면
- 일반 백엔드 서버: 프론트 요청 처리
- AI 백엔드 서버: 매칭 및 생성형 AI 처리
- 추론: Gemini API
- 공용 저장소: PostgreSQL

### 역할 분리

- Gradio는 입력 수집과 결과 시각화만 담당한다.
- 일반 백엔드는 입력/조회/응답 중계를 담당한다.
- AI 백엔드는 점수 계산, 매칭, 선택적 AI 생성, 저장 로직을 담당한다.
- Gemini API는 3개 생성 기능에만 관여한다.
- PostgreSQL은 두 백엔드가 공유하되, 데이터 소유 책임은 분리한다.

### 단일 EC2 배포 전략

- 해커톤 운영 환경에서는 일반 백엔드와 AI 백엔드를 하나의 Ubuntu EC2 인스턴스에 함께 배포한다.
- PostgreSQL도 같은 EC2 인스턴스 안에서 함께 운영한다.
- 두 백엔드는 각각 별도 `systemd` 서비스로 실행해 재시작과 로그 확인 경계를 분리한다.
- 외부 진입점은 `nginx`가 담당하고, 공개 API는 `http://<host>/api/...` 경로로 노출한다.
- Gemini API는 외부 LLM 호출 계층으로 두고, EC2는 애플리케이션과 PostgreSQL 실행 계층을 함께 담당한다.
- GitHub Actions는 SSH로 EC2에 접속해 최신 코드를 배포하고 서비스 재시작을 수행한다.
- 일반 백엔드는 기본적으로 `8000` 포트, AI 백엔드는 `8001` 포트를 사용하도록 가정한다.
- `nginx`는 `80 -> /api -> main backend:8000`으로 프록시하고, AI 백엔드 `8001`은 내부 호출만 허용한다.
- PostgreSQL은 `127.0.0.1:5432`에서만 수신하고 외부 공개하지 않는다.

### 지도 실거래가 조회

- 지도 화면의 실거래가 데이터는 메인 백엔드가 국토교통부 오피스텔 전월세 실거래가 OpenAPI를 호출해 가져온다.
- 프론트엔드는 공공데이터 API 키를 직접 사용하지 않고, 항상 메인 백엔드의 `/api/map/officetel-rents`만 호출한다.
- 메인 백엔드는 `lawd_code`, `deal_ymd`, `num_of_rows`, `include_coordinates` 입력을 받아 XML 응답을 정규화한 JSON으로 반환한다.
- `include_coordinates=true`인 경우 메인 백엔드는 네이버 Geocoding API를 서버에서 호출해 거래 주소의 좌표를 보강한다.
- 프론트엔드는 네이버 Dynamic Map Client ID만 사용하고, 네이버 Geocoding Client Secret과 공공데이터 인증키는 백엔드 환경변수로만 관리한다.
- 장소 검색은 프론트가 `/api/map/geocode`를 호출해 지도 중심을 이동하는 방식으로 처리한다.
- 네이버 지도는 선택 지역 중심점, 검색 위치, 실거래가 마커를 시각화하고, 상세 거래 비교는 목록 카드에서 제공한다.

### 심사 대응 포인트

- `Backend Separation`: 일반 백엔드와 AI 백엔드의 책임 분리
- `Gemini API`: 생성형 AI 사용의 명확한 적용 지점
- `PostgreSQL on EC2`: 단일 인스턴스 내 데이터 저장과 재조회 가능성
- `Gradio`: 심사자가 바로 이해할 수 있는 프로토타입 시연 채널

## 데이터 흐름

1. Gradio 또는 호출자가 일반 백엔드에 요청을 보낸다.
2. 일반 백엔드가 입력을 저장하고 AI 백엔드 호출용 payload를 만든다.
3. AI 백엔드의 `app.py`가 요청을 받고 `handler.py`로 전달한다.
4. `scoring.py`가 모든 유효 학생 쌍의 점수와 근거를 계산한다.
5. `matching.py`가 그래프를 구성하고 최적 매칭을 계산한다.
6. `handler.py`가 각 배정 쌍의 추천 이유를 코드 기반으로 조합한다.
7. 필요 조건이 충족된 경우에만 `scenario.py`, `negotiate.py`, `pact.py`를 호출한다.
8. 각 LLM 기능은 `llm_client.py`를 통해 Gemini API를 호출하고, 실패 시 `fallback.py`로 대체한다.
9. AI 백엔드가 필요한 결과를 PostgreSQL에 저장하고 응답을 반환한다.
10. 일반 백엔드가 결과를 정리해 프론트엔드에 반환한다.

## Pact 생성 설계

### 목적

- 룸메이트 확정 후 두 사람이 실제로 부딪힐 가능성이 높은 생활 항목만 골라 약속으로 제안한다.
- 단순한 공통점 나열이 아니라, 갈등 예방에 도움이 되는 조항만 추려 보여준다.
- 무엇을 약속으로 만들지는 코드가 결정하고, LLM은 문장을 부드럽게 다듬는 역할만 맡는다.

### 실행 시점

- 두 사용자가 채팅 이후 서로 룸메이트를 확정했을 때만 실행한다.
- 추천 후보 단계나 단순 채팅 단계에서는 Pact를 생성하지 않는다.

### 입력 데이터

- 확정된 두 프로필의 기본 정보
- 두 프로필의 생활 인터뷰 응답
- Hardcut 조건
- 캐릭터 분류 결과
- 확정 식별자 또는 채팅방 식별자

### 충돌 후보 추출

- 먼저 코드가 두 사람의 인터뷰 응답 차이를 비교한다.
- 아래와 같은 항목을 우선 비교 대상으로 본다.
  - 취침/기상 시간
  - 조용한 시간 시작
  - 청소 빈도
  - 설거지/정리 마감
  - 방문객 허용 빈도
  - 흡연 여부와 흡연 장소
  - 개인 공간 출입 기준
  - 보안 기준
  - 외출 공유 기준
  - 생활비 관리 방식

- 차이가 크거나 Hardcut과 가까운 항목일수록 높은 우선순위를 부여한다.
- 우선순위가 높은 항목 중 상위 3개에서 5개만 최종 약속 후보로 사용한다.

### 문장 생성 원칙

- 코드가 선정한 충돌 항목마다 기준 문장을 만든다.
- 필요할 때만 Gemini API로 문장을 다듬는다.
- LLM이 실패하면 `fallback.py`의 결정론적 템플릿으로 같은 의미의 약속을 만든다.

예:

- "밤 11시 이후에는 이어폰을 사용한다"
- "설거지는 당일 안에 끝낸다"
- "지인 초대는 하루 전에 서로 공유한다"
- "서로의 방에 들어갈 때는 먼저 노크한다"

### 실행 경계

- 메인 백엔드는 룸메이트 확정 후 내부 Pact 생성 로직을 호출한다.
- 약속 생성은 `pact.py`, `llm_client.py`, `fallback.py` 중심으로 처리한다.
- 생성 결과는 `rules`, `source`, `conflict_topics`, `generated_at` 구조를 반환한다.

### 실패 처리

- Pact 생성 실패가 추천, 채팅, 로그인 같은 기존 사용자 흐름을 막으면 안 된다.

## 추천 후보 설계

### 목적

- 인터뷰를 제출한 사용자가 즉시 확인할 수 있는 추천 후보를 제공한다.
- 최종 2인실 확정 매칭 전에도 잘 맞는 후보를 미리 탐색할 수 있게 한다.
- 추천은 확정 배정이 아니라 개인 기준의 후보 제안으로 유지한다.

### 동작 방식

- 인터뷰 저장이 완료되면 일반 백엔드가 추천 후보 재계산을 시작한다.
- 추천 계산은 현재 인터뷰가 저장된 모든 프로필을 대상으로 수행한다.
- 새 사용자가 들어오면 본인 추천뿐 아니라 기존 제출자들의 추천 후보도 함께 갱신한다.
- 추천 점수 계산은 AI 백엔드 `scoring.py`의 결정론적 쌍 점수 계산을 재사용한다.
- 추천 후보는 `score` 내림차순 상위 3건만 유지한다.
- 추천 후보는 `score >= 70`이고 `eligible = true`인 쌍만 저장한다.

### 저장 대상

- 추천 기준 프로필 ID
- 추천 후보 목록
- 후보별 점수
- 후보별 추천 이유
- 후보별 충돌 요약
- 추천 계산 시각

### API 경계

- 일반 백엔드는 `GET /profiles/{profile_id}/recommendations`를 제공한다.
- 인터뷰 저장 응답은 최신 추천 후보를 함께 포함할 수 있다.
- 추천 조회는 메인 백엔드에서 처리하며, 프론트는 AI 백엔드를 직접 호출하지 않는다.

## 서버 연결 설계

### 연결 방식

- 일반 백엔드는 환경변수 또는 설정 파일로 AI 백엔드 base URL을 가진다.
- 일반 백엔드는 HTTP 요청으로 AI 백엔드에 배정/생성 요청을 전달한다.
- AI 백엔드는 내부 처리 결과를 JSON으로 반환한다.
- 단일 EC2 배포 시 일반 백엔드는 `http://127.0.0.1:8001` 형태의 내부 주소로 AI 백엔드를 호출할 수 있다.
- 프론트엔드 또는 외부 호출자는 `http://<host>/api`를 메인 백엔드의 공개 base URL로 사용한다.

### 공용 계약

- 요청 식별자: `request_id`
- 세션 식별자: `session_id`
- 학생 입력 payload
- 매칭 결과 payload
- 생성 결과 payload

### 오류 처리

- AI 백엔드 연결 실패 시 일반 백엔드는 연결 오류를 구조화된 응답으로 반환한다.
- AI 백엔드 처리 실패 시 일반 백엔드는 원인 코드를 유지한 채 상위 호출자에 전달한다.

## 인증 설계

### 카카오 로그인 흐름

1. 프론트는 카카오 인가 페이지로 이동한다.
2. 카카오는 등록된 Redirect URI로 `code`를 포함해 다시 보낸다.
3. 프론트 콜백 페이지는 `code`를 메인 백엔드 `POST /auth/kakao/exchange`로 전달한다.
4. 메인 백엔드는 `https://kauth.kakao.com/oauth/token`으로 토큰 교환을 수행한다.
5. 메인 백엔드는 `https://kapi.kakao.com/v2/user/me`로 사용자 정보를 조회한다.
6. 메인 백엔드는 `users` 테이블에 카카오 사용자와 서비스 사용자를 매핑한다.
7. 메인 백엔드는 자체 서명 access token과 현재 사용자 정보를 프론트에 반환한다.

### 사용자 저장 규칙

- 서비스 사용자는 카카오 `provider_user_id` 기준으로 중복 없이 식별한다.
- 사용자가 이미 존재하면 `nickname`, `email`, `profile_image_url`, `last_login_at`을 갱신한다.
- 사용자가 아직 프로필을 만들지 않은 경우 `profile_id`는 비워둘 수 있다.
- 추후 `POST /profiles`가 인증된 사용자 기준으로 호출되면 해당 `profile_id`를 사용자 계정과 연결할 수 있다.

### API 경계

- 일반 백엔드는 `POST /auth/kakao/exchange`로 인가 코드를 받아 카카오 토큰 교환과 사용자 로그인을 처리한다.
- 일반 백엔드는 `GET /auth/me`로 현재 access token 기준 사용자 정보를 반환한다.
- 프론트는 카카오 토큰을 직접 저장하지 않고, 메인 백엔드가 발급한 서비스 access token만 사용한다.

## 점수 계산 설계

### 입력

- 학생별 생활 패턴 응답
- 필수 조건 목록
- 선호 조건과 가중치

### 처리

- 필수 조건 충돌이 있는 경우 해당 페어를 배제한다.
- Hardcut 조건이 있는 경우 현재 인터뷰 응답에서 판정 가능한 신호를 기준으로 충돌 여부를 결정론적으로 해석한다.
- 선호 항목 일치와 충돌을 가중치 기반으로 수치화한다.
- 추천 이유에 사용할 상위 기여 요인을 함께 기록한다.

### 출력

- 학생 쌍 식별자
- 호환 점수
- 필수 조건 통과 여부
- 추천 이유 근거 요약
- 잠재 갈등 요약

## 매칭 설계

### 그래프 모델

- 노드: 학생
- 엣지: 배정 가능한 학생 쌍
- 가중치: 호환 점수에서 유도한 비용 또는 점수

### 알고리즘

- 기본 원칙: 직접 최적화 로직을 구현하지 않는다.
- 선택지 1: `min_weight_matching`에 비용으로 변환한 값 사용
- 선택지 2: 점수 부호를 반전해 `max_weight_matching` 효과 달성

### 검증 규칙

- 모든 학생은 최대 한 번만 배정된다.
- 결과 학생 수가 입력 학생 수와 정확히 일치해야 한다.
- 짝수 인원이 아니거나 유효 엣지가 부족하면 배정 실패로 반환한다.

## LLM 경계 설계

LLM 사용은 아래 3개 기능에 한정한다.

1. 갈등 시나리오 생성
2. 협상안 문장화
3. Pact 규칙 문장 생성

제약:

- 점수 계산은 LLM이 관여하지 않는다.
- 배정 결과 결정은 LLM이 관여하지 않는다.
- 갈등 순위 판정은 LLM이 관여하지 않는다.
- Pact에서 어떤 갈등 항목을 약속으로 뽑을지도 LLM이 결정하지 않는다.
- 세 기능은 항상 호출하지 않고 필요할 때만 호출한다.

## Fallback 설계

각 LLM 기능은 동일한 입력 계약을 공유한다.

- `scenario.py` 실패 시: `fallback.py`의 갈등 시나리오 템플릿 반환
- `negotiate.py` 실패 시: `fallback.py`의 협상안 템플릿 반환
- `pact.py` 실패 시: `fallback.py`의 Pact 템플릿 반환

fallback은 다음 속성을 만족해야 한다.

- 결정론적이어야 한다.
- 외부 호출이 없어야 한다.
- 최소한의 사용자 가독성을 제공해야 한다.

## PostgreSQL 설계

### 저장 대상

- 학생 프로필 기본 정보
- 학생 프로필별 생활 인터뷰 응답
- 학생 프로필별 캐릭터 분류 결과
- 학생 프로필별 추천 후보 목록
- 서비스 사용자 계정과 카카오 연동 정보
- 채팅방 메타데이터
- 채팅방 메시지 이력
- 채팅 요청 상태
- 룸메이트 확정 상태
- 확정 조합별 Pact 결과
- 배정 요청 세션
- 학생 입력 요약 또는 샘플 입력 참조
- 매칭 결과
- 갈등 시나리오, 협상안, Pact 결과

### 소유권 분리

- 일반 백엔드 소유: 입력 세션, 조회 상태
- 일반 백엔드 소유: 학생 프로필, 생활 인터뷰
- AI 백엔드 소유: 매칭 결과, 설명 결과, Pact 결과

### 테이블 구조

- `profiles`
  - `profile_id`
  - `nickname`
  - `age`
  - `gender`
  - `region`
  - `move_in_period`
  - `stay_duration_months`
  - `created_at`
- `profile_interviews`
  - `profile_id`
  - `payload`
  - `updated_at`
  - `payload.character`
- `sessions`
  - `session_id`
  - `session_name`
  - `student_count`
  - `preset_id`
  - `status`
  - `payload`
  - `created_at`
- `profile_recommendations`
  - `profile_id`
  - `payload`
  - `updated_at`
- `users`
  - `user_id`
  - `provider`
  - `provider_user_id`
  - `nickname`
  - `email`
  - `profile_image_url`
  - `profile_id`
  - `payload`
  - `created_at`
  - `updated_at`
  - `last_login_at`
- `chat_rooms`
  - `room_id`
  - `participant_a_profile_id`
  - `participant_b_profile_id`
  - `created_at`
  - `updated_at`
- `match_requests`
  - `request_id`
  - `participant_a_profile_id`
  - `participant_b_profile_id`
  - `requester_profile_id`
  - `target_profile_id`
  - `status`
  - `payload`
  - `created_at`
  - `updated_at`
- `chat_messages`
  - `message_id`
  - `room_id`
  - `sender_profile_id`
  - `payload`
  - `created_at`
- `chat_room_reads`
  - `room_id`
  - `profile_id`
  - `last_read_message_id`
  - `last_read_at`
  - `updated_at`
- `match_results`
  - `session_id`
  - `status`
  - `payload`
  - `updated_at`
- `roommate_pacts`
  - `pact_id`
  - `room_id`
  - `participant_a_profile_id`
  - `participant_b_profile_id`
  - `payload`
  - `generated_at`
  - `updated_at`

해커톤 범위에서는 단순 테이블 구조와 JSON payload 병행 저장을 우선한다.

## 채팅 설계

### 목적

- 추천 후보 화면에서 두 사용자가 서로 수락한 경우에만 대화를 시작할 수 있게 한다.
- 프론트는 메시지 목록 재조회와 실시간 수신을 모두 사용할 수 있어야 한다.
- 실시간 연결이 잠시 끊겨도 메시지 저장 자체는 유지되어야 한다.

### 상호 수락 규칙

- 추천 후보 간 채팅은 `매칭 요청 -> 상대 수락 -> 채팅방 생성` 순서로 진행한다.
- 매칭 요청을 보낸 사용자는 해당 요청에 동의한 것으로 간주한다.
- 상대 사용자가 수락하기 전까지는 채팅방을 생성할 수 없다.
- 같은 두 프로필 조합에는 하나의 요청 상태만 유지한다.
- 한 번 상호 수락이 완료된 조합은 이후 채팅방을 재사용할 수 있다.
- 채팅 중 한 사용자가 룸메이트 확정을 누르면 해당 조합은 최종 확정 상태가 된다.

### 방 생성 규칙

- 채팅방은 항상 1:1 프로필 조합 기준으로 생성한다.
- 같은 두 프로필 조합에는 하나의 채팅방만 유지한다.
- 참가자 순서가 바뀌어도 같은 방으로 취급한다.
- 채팅방 생성 시점에는 해당 프로필 조합의 요청 상태가 `accepted`여야 한다.
- 룸메이트가 최종 확정된 뒤에는 추천 뽑기 기능을 다시 열지 않는다.

### API 경계

- 일반 백엔드는 `POST /profiles/{profile_id}/match-requests`로 상대 프로필에게 대화 요청을 생성한다.
- 일반 백엔드는 `POST /match-requests/{request_id}/accept`로 상대 프로필의 수락을 기록한다.
- 일반 백엔드는 `POST /profiles/{profile_id}/chat-rooms`로 상호 수락이 끝난 상대 프로필과의 채팅방을 생성하거나 기존 방을 반환한다.
- 일반 백엔드는 `GET /chat-rooms/{room_id}/messages`로 저장된 메시지 이력을 반환한다.
- 일반 백엔드는 `POST /chat-rooms/{room_id}/read`로 현재 참여자의 마지막 읽음 시점을 갱신한다.
- 일반 백엔드는 `GET /chat-rooms/{room_id}/question-suggestions`로 지금 대화에서 추가로 확인하면 좋은 질문 3개를 반환한다.
- 일반 백엔드는 `ws /ws/chat-rooms/{room_id}`로 실시간 메시지 송수신을 처리한다.
- 일반 백엔드는 `ws /ws/profiles/{profile_id}/inbox`로 채팅 목록의 unread count와 요청 상태를 실시간으로 갱신한다.
- 일반 백엔드는 `POST /chat-rooms/{room_id}/roommate-confirmation`으로 최종 룸메이트 확정을 기록하고 Pact 생성 로직을 실행할 수 있다.
- 프론트는 채팅에 대해 AI 백엔드를 호출하지 않는다.

### 메시지 계약

- 프론트는 WebSocket 연결 직후 본인 `profile_id`와 `nickname`을 함께 보낸다.
- 채팅 메시지는 `text` 단문 메시지와 `sent_at` 시각을 포함한다.
- 서버는 메시지를 저장한 뒤 같은 방의 연결된 참가자들에게 동일 payload를 브로드캐스트한다.
- 메시지 이력 조회와 실시간 수신의 메시지 형식은 동일하게 유지한다.
- 서버는 참여자별 `last_read_message_id` 또는 `last_read_at`을 저장하고, 채팅방을 보고 있지 않은 사용자의 unread count를 채팅 목록에서 계산할 수 있어야 한다.
- 사용자가 현재 채팅방을 보고 있는 상태에서 상대 메시지가 도착하면 서버는 그 참여자의 읽음 상태를 즉시 최신으로 갱신해 unread count를 올리지 않는다.

### 매칭 요청 목록 조회 및 프론트 연결

- 일반 백엔드는 `GET /profiles/{profile_id}/match-requests`로 해당 프로필이 `participant_a` 또는 `participant_b`인 매칭 요청 전체를 반환한다.
- 목록 각 항목에는 상대 프로필 요약(`peer_profile_id`, `peer_nickname`, `peer_region`)과 상태(`pending`/`accepted`)가 포함된다.
- 목록 각 항목에는 사용자 기준 읽지 않은 메시지 수 `unread_count`가 포함된다.
- 상태가 `accepted`인 항목에는 연결된 채팅방 `room_id`를 함께 포함한다(방이 아직 없으면 `null`).
- 프론트는 이 목록 API를 채팅 목록(수신함) 화면의 데이터 소스로 사용한다.
- 프론트는 후보 선택 시 `POST /profiles/{profile_id}/match-requests`를 직접 호출해 요청을 생성해야 하며, 로컬 저장소에 가짜 대화를 만들거나 스스로 자동 수락 처리하지 않는다.
- 요청을 받은 쪽(target) 사용자는 채팅 목록에서 수락 버튼을 통해 `POST /match-requests/{request_id}/accept`를 호출할 수 있어야 한다.
- 수락 직후 프론트는 `POST /profiles/{profile_id}/chat-rooms`를 호출해 실제 채팅방을 확보한 뒤에만 채팅 화면으로 이동한다.
- 채팅 화면은 `GET /chat-rooms/{room_id}/question-suggestions` 응답을 사용해, 지금 이 대화에서 먼저 확인해두면 좋은 질문 칩 또는 제안 문구를 보여줄 수 있다.
- 데모/연습 모드(로그인 없이 흐름을 미리 보여주는 용도)는 기존 로컬 시뮬레이션을 유지할 수 있으나, 실제 프로필이 있는 사용자 흐름과는 명확히 분리한다.

### 운영 제약

- 공개 진입점은 `nginx`의 `/api/ws/...` 경로를 사용한다.
- `nginx`는 WebSocket upgrade 헤더를 메인 백엔드로 전달해야 한다.
- 해커톤 범위에서는 첨부파일, 다자간 채팅은 지원하지 않는다.

## AI 백엔드 응답 구조

권장 응답 구조:

```json
{
  "status": "ok",
  "matches": [
    {
      "student_a": "A001",
      "student_b": "A014",
      "score": 87,
      "reasons": [
        "취침 시간이 유사합니다",
        "청결 기준이 잘 맞습니다"
      ],
      "conflict_scenario": "optional",
      "negotiation_suggestions": [
        "optional"
      ],
      "pact": [
        "optional"
      ]
    }
  ],
  "errors": []
}
```

세부 필드명은 구현 시점에 조정 가능하지만, 배정 결과와 코드 기반 근거, 선택적 보조 문장이 분리되어야 한다.

일반 백엔드와 AI 백엔드는 같은 응답 의미를 유지하되, 일반 백엔드가 프론트용 필드명을 정리할 수 있다.

응답 구조는 Gradio가 다음 단계를 순서대로 렌더링하기 쉽게 유지한다.

1. 입력 검증 결과
2. 매칭 결과와 추천 이유
3. 갈등 시나리오
4. 협상 조항
5. Pact 규칙

## 오류 처리

- 입력 오류: 누락 필드, 홀수 인원, 잘못된 값 범위
- 배정 오류: 유효한 완전 매칭 부재
- LLM 오류: Gemini API 호출 실패, 응답 파싱 실패

처리 원칙:

- 입력 또는 배정 실패는 구조화된 오류로 반환한다.
- LLM 실패는 전체 요청 실패로 확대하지 않고 fallback으로 흡수한다.
- 저장 실패는 심각도에 따라 경고 또는 오류로 분리해 다룬다.

## 데모 시나리오 설계

심사 시연은 아래 순서로 설명 가능해야 한다.

1. 일반 백엔드와 AI 백엔드를 각각 실행한다.
2. 샘플 학생 데이터를 입력한다.
3. 일반 백엔드가 AI 백엔드로 요청을 전달하는 흐름을 보여준다.
4. 코드 기반 매칭 결과와 추천 이유를 보여준다.
5. 갈등 가능성이 높은 조합에 대해 시나리오와 협상 조항을 보여준다.
6. 최종 Pact 규칙을 보여준다.
7. 이 과정에서 어떤 부분이 일반 백엔드이고 어떤 부분이 AI 백엔드인지, 어떤 부분이 Gemini API인지 분리해서 설명한다.

## 배포 및 운영 설계

### 서비스 프로세스

- 일반 백엔드 서비스는 `uvicorn main_backend.app:app`으로 실행한다.
- AI 백엔드 서비스는 구현 후 `uvicorn ai_backend.app:app`으로 실행한다.
- 두 서비스는 같은 코드베이스와 같은 Python 가상환경을 공유할 수 있지만, `systemd` 단위는 분리한다.

### 배포 자동화

- GitHub Actions 배포 워크플로는 `main` 브랜치 push 또는 수동 실행 시 동작한다.
- 워크플로는 SSH 키 기반으로 EC2에 접속한다.
- EC2 배포 스크립트는 저장소 갱신, 가상환경 준비, 의존성 설치, 검증 스크립트 실행, 서비스 재시작 순으로 처리한다.
- AI 백엔드 코드나 서비스 파일이 아직 없는 단계에서는 일반 백엔드만 재시작하고 AI 백엔드는 조건부로 건너뛴다.

## Hook 설계

총 2개의 Hook만 둔다.

1. 저장 시 `lint + test` 실행 Hook
2. `scoring.py`, `matching.py`에 Gemini API 또는 네트워크 호출 import가 없는지 검사하는 Hook

금지:

- 추가 Hook 생성
- `scoring.py`, `matching.py` 내부의 Gemini API 클라이언트 직접 생성

## 구현 가드레일

- `requirements.md`와 `design.md`는 구현의 기준 문서다.
- Claude Code와 Codex는 구현만 담당하고 Spec을 직접 수정하지 않는다.
- Spec과 구현 충돌이 발견되면 구현을 멈추고 Spec을 먼저 갱신한다.
- Acceptance 기준과 검증 결과를 충족하면 Task를 `DONE`으로 전환한다.
