import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'test.db'}")
    monkeypatch.delenv("REDIS_URL", raising=False)
    monkeypatch.setenv("MODEL_PATH", str(tmp_path / "session_model.json"))
    from app import db, main

    db.reset_engine()
    with TestClient(main.app) as test_client:
        yield test_client
