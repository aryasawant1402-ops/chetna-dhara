import os

from fastapi.testclient import TestClient


def test_health_reports_stubs(client: TestClient):
    response = client.get("/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["database"] == "sqlite"
    assert body["flower"]["status"] == "not_configured"
    assert body["opacus"]["status"] == "not_configured"
    assert body["indicwav2vec"]["status"] == "not_configured"
    assert body["media_cdn"]["status"] == "disabled"
    assert body["camera"]["status"] == "disabled"


def test_session_note_is_a_one_page_pdf(client: TestClient):
    created = client.post(
        "/v1/sessions",
        json={"display_name": "Aarav", "age_years": 7, "condition": "adhd", "pace": "judging"},
    )
    assert created.status_code == 201
    session_id = created.json()["id"]
    assert created.json()["budgets"]["cap_ms"] == 110_000

    completed = client.post(
        f"/v1/sessions/{session_id}/complete",
        json={
            "end_reason": "timer",
            "warmup_taps": 4,
            "warmup_completed": True,
            "stress_stage": None,
            "trials": [
                {"correct": True, "prompt_level": 2},
                {"correct": True, "prompt_level": 1},
                {"correct": True, "prompt_level": 0},
            ],
        },
    )
    assert completed.status_code == 200
    summary = completed.json()
    assert summary["badge"] == "Pattern Keeper"
    assert len(summary["strengths"]) == 3
    assert len(summary["focus_areas"]) == 2
    assert "not a diagnosis" in summary["disclaimer"]

    pdf = client.get(f"/v1/sessions/{session_id}/report.pdf")
    assert pdf.status_code == 200
    assert pdf.headers["content-type"] == "application/pdf"
    assert pdf.content.startswith(b"%PDF")
    assert b"not a diagnosis" in pdf.content


def test_rejects_ages_outside_the_prototype(client: TestClient):
    response = client.post(
        "/v1/sessions",
        json={"display_name": "Aarav", "age_years": 4, "condition": "adhd", "pace": "judging"},
    )
    assert response.status_code == 422
    assert os.environ["DATABASE_URL"].startswith("sqlite")
