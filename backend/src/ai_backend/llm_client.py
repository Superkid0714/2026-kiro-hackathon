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
                "두 학생이 따를 단일 협상안 조항 3개를 한국어 문장으로 작성하세요.\n"
                f"학생쌍: {payload['pair_label']}\n"
                f"갈등요약: {', '.join(payload['conflict_summary'])}\n"
                "설명 없이 조항 문장만 작성하세요."
            )
        if kind == "pact":
            return (
                "두 학생의 공동 생활 규칙 2~3개를 한국어 문장으로 작성하세요.\n"
                f"학생쌍: {payload['pair_label']}\n"
                f"공통규칙: {', '.join(payload['shared_rules'])}\n"
                "설명 없이 규칙 문장만 작성하세요."
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
