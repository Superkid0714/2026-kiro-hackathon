# RoomPACT Campus Design

## 개요

`RoomPACT Campus`는 기숙사 2인실 룸메이트 배정을 수행하는 단일 AWS Lambda 애플리케이션이다.
핵심 배정 로직은 Python 코드와 `networkx` 매칭 알고리즘으로 처리하고, LLM은 보조 문장 생성 경계에서만 선택적으로 호출한다.

## 설계 목표

- 배정 결정은 전적으로 코드 기반으로 유지한다.
- LLM 사용을 보조 서술 생성 3개 지점으로 제한한다.
- Bedrock 의존성을 `llm_client.py`에만 격리한다.
- 장애 시 fallback으로 동일한 기능 경계를 유지한다.
- 단일 Lambda 내부에서 모듈 분리로 복잡도를 제어한다.

## 범위 결정

- 지원 범위: 2인실 배정만 처리
- 비지원 범위: 3인 이상 그룹 배정, 독자 최적화 엔진, 마이크로서비스 분리

## 런타임 및 의존성

- 런타임: AWS Lambda Python
- 핵심 라이브러리: `networkx`
- LLM 제공자: AWS Bedrock

## 모듈 구조

```text
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

- Lambda 엔트리포인트
- 요청 파싱과 입력 검증
- 점수 계산, 배정 계산, 선택적 LLM 보조 흐름 오케스트레이션
- 최종 응답 직렬화
- 오류 응답 포맷 통일

### `scoring.py`

- 학생 쌍별 호환 점수 계산
- 필수 조건 충돌 판정
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
- 실패 시 `fallback.py`로 대체
- 반환 형식은 협상 제안 문자열 배열 `suggestions`와 `source` 필드 (`llm` 또는 `fallback`)를 포함해야 한다
- `suggestions`는 항상 하나의 최종 협상안을 구성하는 조항들의 배열이며, 여러 대안 중 하나를 선택하게 하는 용도가 아니다

### `pact.py`

- 생활 규칙 Pact 문구 생성 여부 판단
- 쌍별 생활 규칙 요약을 문장으로 조합
- 실패 시 `fallback.py`로 대체
- 반환 형식은 Pact 규칙 문자열 배열 `rules`와 `source` 필드 (`llm` 또는 `fallback`)를 포함해야 한다

### `llm_client.py`

- Bedrock 요청 생성
- 모델 호출
- 응답 파싱
- 호출 오류를 도메인 친화적 예외로 변환
- 프로젝트 내 유일한 Bedrock 접근 지점
- 각 호출 타입은 `scenario`, `negotiate`, `pact` 중 하나로 명시되어 상위 모듈이 응답 형식을 해석할 수 있어야 한다

### `fallback.py`

- 갈등 시나리오 템플릿
- 협상안 템플릿
- Pact 템플릿
- 입력 데이터만으로 결정론적 문장 생성
- 갈등 시나리오는 `narrative` 문자열을 반환해야 한다
- 협상안은 `suggestions` 문자열 배열을 반환해야 한다
- Pact는 `rules` 문자열 배열을 반환해야 한다

## 데이터 흐름

1. `handler.py`가 요청을 수신한다.
2. 입력 데이터 형식과 학생 수를 검증한다.
3. `scoring.py`가 모든 유효 학생 쌍의 점수와 근거를 계산한다.
4. `matching.py`가 그래프를 구성하고 최적 매칭을 계산한다.
5. `handler.py`가 각 배정 쌍의 추천 이유를 코드 기반으로 조합한다.
6. 필요 조건이 충족된 경우에만 `scenario.py`, `negotiate.py`, `pact.py`를 호출한다.
7. 각 LLM 기능은 `llm_client.py`를 통해 Bedrock을 호출하고, 실패 시 `fallback.py`로 대체한다.
8. `handler.py`가 최종 응답을 반환한다.

## 점수 계산 설계

### 입력

- 학생별 생활 패턴 응답
- 필수 조건 목록
- 선호 조건과 가중치

### 처리

- 필수 조건 충돌이 있는 경우 해당 페어를 배제한다.
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

## Lambda 응답 구조

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

## 오류 처리

- 입력 오류: 누락 필드, 홀수 인원, 잘못된 값 범위
- 배정 오류: 유효한 완전 매칭 부재
- LLM 오류: Bedrock 호출 실패, 응답 파싱 실패

처리 원칙:

- 입력 또는 배정 실패는 구조화된 오류로 반환한다.
- LLM 실패는 전체 요청 실패로 확대하지 않고 fallback으로 흡수한다.

## Hook 설계

총 2개의 Hook만 둔다.

1. 저장 시 `lint + test` 실행 Hook
2. `scoring.py`, `matching.py`에 Bedrock 또는 네트워크 호출 import가 없는지 검사하는 Hook

금지:

- 추가 Hook 생성
- `scoring.py`, `matching.py` 내부의 Bedrock 클라이언트 직접 생성

## 구현 가드레일

- `requirements.md`와 `design.md`는 팀 리더 승인 이후 구현의 기준 문서다.
- Claude Code와 Codex는 구현만 담당하고 Spec을 직접 수정하지 않는다.
- Spec과 구현 충돌이 발견되면 구현을 멈추고 팀 리더에게 보고한다.
- 최종 `DONE` 전환은 팀 리더가 결정한다.
