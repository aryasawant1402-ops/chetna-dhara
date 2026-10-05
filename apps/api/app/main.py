import json
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import database_url, get_db, get_engine
from app.dossier import build_dossier
from app.explain import explain_score, model_status
from app.media_pack import open_media_cache, read_pack_file
from app.models import Base, SessionRecord
from app.pacing import stage_budgets
from app.pdf_report import build_pdf
from app.schemas import SessionComplete, SessionCreate
from app.scoring import score_session
from app.stubs import system_status


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    Base.metadata.create_all(get_engine())
    cache, redis_status = open_media_cache()
    app.state.media_cache = cache
    app.state.redis_status = redis_status
    yield
    cache.close()


app = FastAPI(title="ChetnaDhara", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/v1/health")
def health(request: Request) -> dict:
    url = database_url()
    kind = "postgres" if url.startswith("postgres") else "sqlite"
    return {"ok": True, "model": model_status(), **system_status(kind, request.app.state.redis_status)}


@app.post("/v1/sessions", status_code=201)
def create_session(body: SessionCreate, db: Session = Depends(get_db)) -> dict:
    record = SessionRecord(
        id=str(uuid.uuid4()),
        created_at=datetime.now(UTC),
        display_name=body.display_name,
        age_years=body.age_years,
        condition=body.condition,
        pace=body.pace,
        status="active",
    )
    db.add(record)
    db.commit()
    return {"id": record.id, "budgets": stage_budgets(body.age_years, body.pace)}


@app.post("/v1/sessions/{session_id}/complete")
def complete_session(session_id: str, body: SessionComplete, db: Session = Depends(get_db)) -> dict:
    record = db.get(SessionRecord, session_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Session not found.")
    summary = score_session(body.model_dump())
    record.status = "complete"
    record.summary_json = json.dumps({"end_reason": body.end_reason, "score": summary})
    db.commit()
    prior = _completed_scores(db, exclude_id=record.id)
    summary["explain"] = explain_score(summary, prior)
    record.summary_json = json.dumps({"end_reason": body.end_reason, "score": summary})
    db.commit()
    return summary


@app.get("/v1/sessions")
def list_sessions(
    display_name: str = Query(default="", max_length=40),
    db: Session = Depends(get_db),
) -> dict:
    statement = select(SessionRecord).where(SessionRecord.status == "complete")
    cleaned = " ".join(display_name.split())
    if cleaned:
        statement = statement.where(SessionRecord.display_name == cleaned)
    rows = db.scalars(statement.order_by(SessionRecord.created_at.desc())).all()
    return {"sessions": [_session_summary(row) for row in rows]}


@app.get("/v1/dossier")
def dossier(display_name: str = Query(min_length=1, max_length=40), db: Session = Depends(get_db)) -> dict:
    cleaned = " ".join(display_name.split()) or "Friend"
    statement = (
        select(SessionRecord)
        .where(SessionRecord.status == "complete", SessionRecord.display_name == cleaned)
        .order_by(SessionRecord.created_at.desc())
    )
    sittings = [_session_summary(row) for row in db.scalars(statement).all()]
    return build_dossier(
        cleaned,
        [
            {"badge": item["badge"], "strengths": item["strengths"], "niche_title": item["niche_title"]}
            for item in sittings
        ],
    )


@app.get("/v1/media/calm/{name}")
def calm_file(name: str, request: Request) -> Response:
    try:
        payload, media_type = read_pack_file(request.app.state.media_cache, name)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Calm pack file not found.") from None
    return Response(content=payload, media_type=media_type)


@app.get("/v1/sessions/{session_id}/report.pdf")
def report_pdf(session_id: str, db: Session = Depends(get_db)) -> Response:
    record = db.get(SessionRecord, session_id)
    if record is None or not record.summary_json:
        raise HTTPException(status_code=404, detail="Completed session not found.")
    stored = json.loads(record.summary_json)
    pdf = build_pdf(
        {
            "display_name": record.display_name,
            "age_years": record.age_years,
            "condition": record.condition,
            "pace": record.pace,
            "end_reason": stored["end_reason"],
        },
        stored["score"],
    )
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=ChetnaDhara-session.pdf"},
    )


def _completed_scores(db: Session, exclude_id: str) -> list[dict]:
    rows = db.scalars(select(SessionRecord).where(SessionRecord.status == "complete")).all()
    scores = []
    for row in rows:
        if row.id == exclude_id or not row.summary_json:
            continue
        scores.append(json.loads(row.summary_json)["score"])
    return scores


def _session_summary(record: SessionRecord) -> dict:
    stored = json.loads(record.summary_json or "{}")
    score = stored.get("score", {})
    return {
        "id": record.id,
        "completed_at": record.created_at.isoformat(),
        "display_name": record.display_name,
        "age_years": record.age_years,
        "condition": record.condition,
        "pace": record.pace,
        "end_reason": stored.get("end_reason", "timer"),
        "badge": score.get("badge", "Steady Start"),
        "strengths": score.get("strengths", []),
        "focus_areas": score.get("focus_areas", []),
        "niche_title": score.get("niche_title", "Routine comfort"),
        "accuracy": score.get("accuracy", 0),
    }
