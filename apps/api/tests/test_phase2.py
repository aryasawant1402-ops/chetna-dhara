from fastapi.testclient import TestClient


def _complete(client: TestClient, name: str, accurate: bool) -> str:
    created = client.post(
        "/v1/sessions",
        json={"display_name": name, "age_years": 7, "condition": "adhd", "pace": "judging"},
    )
    session_id = created.json()["id"]
    trials = (
        [
            {"correct": True, "prompt_level": 2},
            {"correct": True, "prompt_level": 1},
            {"correct": True, "prompt_level": 0},
        ]
        if accurate
        else []
    )
    client.post(
        f"/v1/sessions/{session_id}/complete",
        json={
            "end_reason": "timer" if accurate else "stress",
            "warmup_taps": 4,
            "warmup_completed": accurate,
            "stress_stage": None if accurate else "warmup",
            "trials": trials,
        },
    )
    return session_id


def test_history_and_dossier_accumulate(client: TestClient):
    _complete(client, "Aarav", accurate=False)
    _complete(client, "Aarav", accurate=False)
    _complete(client, "Mira", accurate=True)

    listed = client.get("/v1/sessions", params={"display_name": "Aarav"})
    assert listed.status_code == 200
    sessions = listed.json()["sessions"]
    assert len(sessions) == 2
    assert {item["badge"] for item in sessions} == {"Calm Return"}

    dossier = client.get("/v1/dossier", params={"display_name": "Aarav"})
    assert dossier.status_code == 200
    body = dossier.json()
    assert body["session_count"] == 2
    assert body["badges"][0]["count"] == 2
    assert body["badges"][0]["note"] == "Showed up in 2 sittings."
    assert "not a diagnosis" in body["disclaimer"]
    assert "not an aptitude label" in body["pattern_note"]


def test_one_sitting_does_not_claim_a_pattern(client: TestClient):
    _complete(client, "Aarav", accurate=True)
    body = client.get("/v1/dossier", params={"display_name": "Aarav"}).json()
    assert body["session_count"] == 1
    assert "at least two" in body["pattern_note"]
    assert body["repeated_strengths"] == []


def test_calm_pack_is_original_and_cached(client: TestClient):
    first = client.get("/v1/media/calm/manifest.json")
    second = client.get("/v1/media/calm/manifest.json")
    assert first.status_code == 200
    assert second.content == first.content
    manifest = first.json()
    assert manifest["license"] == "CC0-1.0"
    assert client.get("/v1/media/calm/hill.svg").headers["content-type"].startswith("image/svg+xml")
    assert client.get("/v1/media/calm/tone.wav").headers["content-type"] == "audio/wav"
    assert client.get("/v1/media/calm/not-a-pack.txt").status_code == 404
    assert client.get("/v1/media/calm/secret.svg").status_code == 404
    assert len(client.app.state.media_cache.store["calm:manifest.json"]) > 0


def test_redis_cache_round_trip():
    from app.media_pack import RedisMediaCache

    class FakeRedis:
        def __init__(self) -> None:
            self.values: dict[str, bytes] = {}
            self.ttl = None

        def get(self, key: str) -> bytes | None:
            return self.values.get(key)

        def setex(self, key: str, ttl: int, value: bytes) -> None:
            self.ttl = ttl
            self.values[key] = value

        def close(self) -> None:
            return None

    fake = FakeRedis()
    cache = RedisMediaCache(fake, ttl=15)
    assert cache.get("calm:hill.svg") is None
    cache.set("calm:hill.svg", b"<svg/>")
    assert cache.get("calm:hill.svg") == b"<svg/>"
    assert fake.ttl == 15
    cache.close()
