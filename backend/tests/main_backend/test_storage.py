from main_backend.services.storage import (
    PostgresStorage,
    get_storage_backend,
    reset_storage_backend,
)


def test_postgres_storage_backend_is_selected_when_configured(
    monkeypatch,
) -> None:
    monkeypatch.setenv("ROOMPACT_STORAGE_BACKEND", "postgres")
    monkeypatch.setenv("ROOMPACT_POSTGRES_HOST", "127.0.0.1")
    monkeypatch.setenv("ROOMPACT_POSTGRES_PORT", "5432")
    monkeypatch.setenv("ROOMPACT_POSTGRES_DB", "roompact_campus")
    monkeypatch.setenv("ROOMPACT_POSTGRES_USER", "roompact")
    monkeypatch.setenv("ROOMPACT_POSTGRES_PASSWORD", "roompact2026")
    reset_storage_backend()

    backend = get_storage_backend()

    assert isinstance(backend, PostgresStorage)
