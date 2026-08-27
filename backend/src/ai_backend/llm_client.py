from __future__ import annotations

import os
from typing import Any


class LLMClientError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


class BedrockLLMClient:
    def __init__(self, *, model_id: str | None = None, region_name: str | None = None) -> None:
        self._model_id = model_id or os.getenv("BEDROCK_MODEL_ID")
        self._region_name = region_name or os.getenv("AWS_REGION")
        self._client = self._build_client()

    def _build_client(self) -> Any:
        if not self._model_id:
            raise LLMClientError("bedrock_not_configured", "BEDROCK_MODEL_ID is not configured.")

        try:
            import boto3
        except ImportError as exc:
            raise LLMClientError("boto3_not_installed", "boto3 is not installed.") from exc

        return boto3.client("bedrock-runtime", region_name=self._region_name)

    def generate(self, kind: str, payload: dict[str, Any]) -> str:
        prompt = self._build_prompt(kind, payload)
        try:
            response = self._client.converse(
                modelId=self._model_id,
                messages=[{"role": "user", "content": [{"text": prompt}]}],
                inferenceConfig={"temperature": 0.2, "maxTokens": 300},
            )
        except Exception as exc:  # pragma: no cover
            raise LLMClientError("bedrock_request_failed", str(exc)) from exc

        try:
            blocks = response["output"]["message"]["content"]
            text = "".join(block.get("text", "") for block in blocks).strip()
        except Exception as exc:  # pragma: no cover
            raise LLMClientError("bedrock_response_invalid", str(exc)) from exc

        if not text:
            raise LLMClientError("bedrock_response_empty", "Bedrock returned an empty response.")
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


_client: BedrockLLMClient | None = None


def get_llm_client() -> BedrockLLMClient:
    global _client
    if _client is None:
        _client = BedrockLLMClient()
    return _client


def reset_llm_client() -> None:
    global _client
    _client = None
