import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

_engine: Engine | None = None
_factory: sessionmaker[Session] | None = None


def database_url() -> str:
    return os.environ.get("DATABASE_URL", "sqlite:///./chetnadhara.db")


def reset_engine() -> None:
    global _engine, _factory
    if _engine is not None:
        _engine.dispose()
    _engine = None
    _factory = None


def get_engine() -> Engine:
    global _engine, _factory
    if _engine is None:
        url = database_url()
        kwargs: dict = {}
        if url.startswith("sqlite"):
            kwargs["connect_args"] = {"check_same_thread": False}
            if url.endswith(":memory:") or url == "sqlite://":
                kwargs["poolclass"] = StaticPool
        _engine = create_engine(url, **kwargs)
        _factory = sessionmaker(bind=_engine, autoflush=False, autocommit=False)
    return _engine


def get_db() -> Generator[Session, None, None]:
    if _factory is None:
        get_engine()
    assert _factory is not None
    db = _factory()
    try:
        yield db
    finally:
        db.close()
