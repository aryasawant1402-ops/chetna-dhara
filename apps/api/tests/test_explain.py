from fastapi.testclient import TestClient


def _complete(client: TestClient, *, accurate: bool, name: str = "Aarav") -> dict:
    created = client.post(
        "/v1/sessions",
        json={"display_name": name, "age_years": 7, "condition": "adhd", "pace": "judging"},
    )
    session_id = created.json()["id"]
    trials = (
        [
            {"correct": True, "prompt_level": 0},
            {"correct": True, "prompt_level": 0},
            {"correct": True, "prompt_level": 0},
        ]
        if accurate
        else []
    )
    response = client.post(
        f"/v1/sessions/{session_id}/complete",
        json={
            "end_reason": "timer" if accurate else "stress",
            "warmup_taps": 4 if accurate else 2,
            "warmup_completed": accurate,
            "stress_stage": None if accurate else "warmup",
            "trials": trials,
        },
    )
    assert response.status_code == 200
    return response.json()


def test_rules_remain_until_both_kinds_of_sitting_exist(client: TestClient):
    summary = _complete(client, accurate=True)
    assert summary["badge"] == "Pattern Keeper"
    assert summary["explain"]["method"] == "rule_scores"
    assert summary["explain"]["status"] == "insufficient_data"
    assert client.get("/v1/health").json()["model"]["status"] == "insufficient_data"


def test_shap_explains_the_four_features_without_replacing_the_rules(client: TestClient):
    for _index in range(3):
        _complete(client, accurate=True)
    for _index in range(2):
        _complete(client, accurate=False)
    summary = _complete(client, accurate=False)

    assert summary["badge"] == "Calm Return"
    assert len(summary["strengths"]) == 3
    explain = summary["explain"]
    assert explain["method"] == "shap_linear"
    assert explain["status"] == "ready"
    assert [item["name"] for item in explain["attributions"]]
    names = {item["name"] for item in explain["attributions"]}
    assert names == {"sequence_accuracy", "prompt_dependency", "stress_ended", "warmup_taps"}
    assert "not a diagnosis" in explain["note"]
    assert explain["prediction"] >= 0.5
    assert any(abs(item["shap"]) >= 0.05 for item in explain["attributions"])

    pdf = client.get(f"/v1/sessions/{_latest_id(client)}/report.pdf")
    assert pdf.content.startswith(b"%PDF")
    assert b"not a diagnosis" in pdf.content
    assert b"Feature contributions" in pdf.content


def _latest_id(client: TestClient) -> str:
    sessions = client.get("/v1/sessions", params={"display_name": "Aarav"}).json()["sessions"]
    return sessions[0]["id"]
