import json
import os
import re
from pathlib import Path

PACK_DIR = Path(__file__).resolve().parents[3] / "media" / "calm"
_NAME = re.compile(r"^[a-z0-9.-]+$")
_TTL_SECONDS = 60 * 60


class MemoryMediaCache:
    def __init__(self) -> None:
        self.store: dict[str, bytes] = {}

    def get(self, key: str) -> bytes | None:
        return self.store.get(key)

    def set(self, key: str, value: bytes) -> None:
        self.store[key] = value

    def close(self) -> None:
        self.store.clear()


class RedisMediaCache:
    def __init__(self, client: object, ttl: int = _TTL_SECONDS) -> None:
        self._client = client
        self._ttl = ttl

    def get(self, key: str) -> bytes | None:
        value = self._client.get(key)  # type: ignore[attr-defined]
        return value

    def set(self, key: str, value: bytes) -> None:
        self._client.setex(key, self._ttl, value)  # type: ignore[attr-defined]

    def close(self) -> None:
        close = getattr(self._client, "close", None)
        if close:
            close()


def open_media_cache() -> tuple[MemoryMediaCache | RedisMediaCache, str]:
    url = os.environ.get("REDIS_URL", "").strip()
    if not url:
        return MemoryMediaCache(), "not_configured"
    try:
        import redis

        client = redis.Redis.from_url(url, socket_connect_timeout=0.4)
        client.ping()
        return RedisMediaCache(client), "connected"
    except Exception:
        return MemoryMediaCache(), "unavailable"


def allowed_names() -> set[str]:
    manifest = json.loads((PACK_DIR / "manifest.json").read_text(encoding="utf-8"))
    names = {"manifest.json"}
    names.update(frame["src"] for frame in manifest["frames"])
    audio = manifest.get("audio")
    if audio:
        names.add(audio["src"])
    return names


def content_type(name: str) -> str:
    if name.endswith(".svg"):
        return "image/svg+xml"
    if name.endswith(".wav"):
        return "audio/wav"
    return "application/json"


def read_pack_file(cache: MemoryMediaCache | RedisMediaCache, name: str) -> tuple[bytes, str]:
    if not _NAME.fullmatch(name) or name not in allowed_names():
        raise FileNotFoundError(name)
    key = f"calm:{name}"
    cached = cache.get(key)
    if cached is not None:
        return cached, content_type(name)
    data = (PACK_DIR / name).read_bytes()
    cache.set(key, data)
    return data, content_type(name)
