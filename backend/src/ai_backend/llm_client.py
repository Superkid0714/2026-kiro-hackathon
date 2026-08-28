from __future__ import annotations

import json
import os
from typing import Any
from urllib import error, parse, request


class LLMClientError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


class GeminiLLMClient:
    def __init__(self, *, model_id: str | None = None, api_key: str | None = None) -> None:
        self._model_id = model_id or os.getenv("GEMINI_MODEL")
        self._api_key = api_key or os.getenv("GEMINI_API_KEY")
        self._endpoint = self._build_endpoint()

    def _build_endpoint(self) -> str:
        if not self._model_id:
            raise LLMClientError("gemini_not_configured", "GEMINI_MODEL is not configured.")
        if not self._api_key:
            raise LLMClientError("gemini_key_not_configured", "GEMINI_API_KEY is not configured.")

        model_name = self._model_id
        if model_name.startswith("models/"):
            model_name = model_name[len("models/") :]
        encoded_key = parse.quote(self._api_key, safe="")
        return (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model_name}:generateContent?key={encoded_key}"
        )

    def generate(self, kind: str, payload: dict[str, Any]) -> str:
        prompt = self._build_prompt(kind, payload)
        request_body = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt,
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 300,
            },
        }
        http_request = request.Request(
            self._endpoint,
            data=json.dumps(request_body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with request.urlopen(http_request, timeout=20) as response:
                raw_response = response.read().decode("utf-8")
        except error.HTTPError as exc:  # pragma: no cover
            detail = exc.read().decode("utf-8", errors="replace")
            raise LLMClientError("gemini_request_failed", detail or str(exc)) from exc
        except error.URLError as exc:  # pragma: no cover
            raise LLMClientError("gemini_request_failed", str(exc)) from exc

        try:
            response_body = json.loads(raw_response)
            candidates = response_body["candidates"]
            parts = candidates[0]["content"]["parts"]
            text = "".join(part.get("text", "") for part in parts).strip()
        except Exception as exc:  # pragma: no cover
            raise LLMClientError("gemini_response_invalid", str(exc)) from exc

        if not text:
            raise LLMClientError("gemini_response_empty", "Gemini returned an empty response.")
        return text

    @staticmethod
    def _build_prompt(kind: str, payload: dict[str, Any]) -> str:
        if kind == "scenario":
            return (
                "두 기숙사 룸메이트 후보의 갈등 상황을 한 단락으로 설명하세요.\n"
                f"학생쌍: {payload['pair_label']}\n"
                f"갈등요약: {', '.join(payload['conflict_summary'])}\n"
                "출력은 한국어 서술문만 반환하세요."
            )
        if kind == "negotiate":
            return (
                "두 학생이 바로 대화에 꺼내 쓸 수 있는 단일 협상안 조항 3개를 "
                "한국어로 작성하세요.\n"
                f"학생쌍: {payload['pair_label']}\n"
                f"갈등요약: {', '.join(payload['conflict_summary'])}\n"
                "출력 규칙:\n"
                "1. 각 줄은 하나의 조항 문장만 작성합니다.\n"
                "2. 명령조보다 함께 맞춰보자는 합의형 말투를 사용합니다.\n"
                "3. 상대에게 확인하거나 제안하듯 자연스럽게 말합니다.\n"
                "4. 여러 대안을 나열하지 말고 하나의 합의안만 씁니다.\n"
                "5. 설명 없이 조항 문장만 작성합니다."
            )
        if kind == "pact":
            rag_lines = []
            for item in payload.get("rag_guidance", []):
                rag_lines.append(
                    f"- 주제: {item['title']} / "
                    f"상황: {item['scenario']} / "
                    f"가이드: {', '.join(item['guidance'])}"
                )
            return (
                "두 학생의 공동 생활 규칙 3~5개를 한국어 문장으로 작성하세요.\n"
                f"학생쌍: {payload['pair_label']}\n"
                f"공통규칙: {', '.join(payload['shared_rules'])}\n"
                f"참고 가이드:\n{chr(10).join(rag_lines) if rag_lines else '- 없음'}\n"
                "출력 규칙:\n"
                "1. 각 줄은 하나의 생활 약속 문장만 작성합니다.\n"
                "2. 갈등 가능성이 높은 상황을 먼저 다룹니다.\n"
                "3. 명령하듯 단정하지 말고 함께 조율하는 합의형 말투로 작성합니다.\n"
                "4. 상대에게 먼저 물어보고 맞춰볼 수 있는 자연스러운 표현을 사용합니다.\n"
                "5. 설명 없이 약속 문장만 작성합니다."
            )
        if kind == "chat_questions":
            recent_messages = payload.get("recent_messages", [])
            recent_lines = "\n".join(f"- {item}" for item in recent_messages[-3:]) or "- 없음"
            current_speaker_name = payload.get("current_speaker_name") or "질문 작성자"
            other_speaker_name = payload.get("other_speaker_name") or "상대방"
            return (
                "두 학생이 룸메이트 대화 초반에 서로 더 잘 이해하기 위해 "
                "물어보면 좋은 질문 3개를 한국어로 작성하세요.\n"
                f"학생쌍: {payload['pair_label']}\n"
                f"질문 작성자: {current_speaker_name}\n"
                f"질문을 받을 사람: {other_speaker_name}\n"
                f"갈등 또는 조율 포인트: {', '.join(payload['conflict_summary'])}\n"
                f"최근 대화:\n{recent_lines}\n"
                "출력 규칙:\n"
                "1. 각 줄은 하나의 질문 문장만 작성합니다.\n"
                "2. 공격적이거나 따지는 말투를 쓰지 않습니다.\n"
                "3. 서로 기준을 확인하고 대화를 이어가기 쉬운 표현을 사용합니다.\n"
                "4. 최근 대화가 있으면 그 흐름을 이어서 자연스럽게 질문합니다.\n"
                "5. 최근 대화가 거의 없으면 처음 많이 묻는 생활 패턴 질문부터 제안합니다.\n"
                "6. 질문 작성자가 바로 채팅창에 복사해서 보낼 수 있는 "
                "자연스럽게 작성합니다.\n"
                "7. 이미 나온 답을 다시 묻지 말고, 다음으로 이어질 만한 질문을 제안합니다.\n"
                "8. 설명 없이 질문 문장만 작성합니다."
            )
        raise LLMClientError("unsupported_llm_kind", f"Unsupported kind: {kind}")


_client: GeminiLLMClient | None = None


def get_llm_client() -> GeminiLLMClient:
    global _client
    if _client is None:
        _client = GeminiLLMClient()
    return _client


def reset_llm_client() -> None:
    global _client
    _client = None
