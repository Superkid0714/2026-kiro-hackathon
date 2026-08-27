from __future__ import annotations

from pathlib import Path

import pytest

from ai_backend.llm_client import reset_llm_client
from main_backend.services.storage import reset_storage_backend


@pytest.fixture(autouse=True)
def isolated_local_storage(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setenv("ROOMPACT_STORAGE_BACKEND", "local")
    monkeypatch.setenv("ROOMPACT_LOCAL_STORE_PATH", str(tmp_path / "roompact_store.json"))
    monkeypatch.setenv("AI_BACKEND_BASE_URL", "http://127.0.0.1:8001")
    monkeypatch.delenv("BEDROCK_MODEL_ID", raising=False)
    reset_storage_backend()
    reset_llm_client()
    yield
    reset_storage_backend()
    reset_llm_client()
