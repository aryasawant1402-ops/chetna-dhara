import io
from xml.sax.saxutils import escape

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import ListFlowable, ListItem, Paragraph, SimpleDocTemplate, Spacer

from app.pacing import clinical_cap_ms


def build_pdf(profile: dict, score: dict) -> bytes:
    buffer = io.BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=14 * mm,
        bottomMargin=14 * mm,
        title="ChetnaDhara session note",
    )
    document.pageCompression = 0
    styles = getSampleStyleSheet()
    title = ParagraphStyle("TitleSmall", parent=styles["Title"], fontName="Times-Bold", fontSize=18, leading=22, spaceAfter=4)
    body = ParagraphStyle("BodySmall", parent=styles["Normal"], fontName="Times-Roman", fontSize=11, leading=14, spaceAfter=4)
    small = ParagraphStyle("Fine", parent=styles["Normal"], fontName="Times-Roman", fontSize=9, leading=12, textColor="#333333")
    heading = ParagraphStyle("HeadingSmall", parent=styles["Heading3"], fontName="Times-Bold", fontSize=12, leading=15, spaceBefore=6, spaceAfter=2)

    clinical_minutes = clinical_cap_ms(profile["age_years"]) // 60_000
    end_reason = profile["end_reason"]
    ending = (
        "Ended on the planned stop."
        if end_reason == "timer"
        else "Touch pace spiked, then the session moved to a calm close."
    )
    pace_line = (
        f"Pace used: {profile['pace']}. Clinical cap for age {profile['age_years']} is {clinical_minutes} minutes."
    )
    story = [
        Paragraph("ChetnaDhara", title),
        Paragraph("Session note for a caregiver conversation", body),
        Paragraph(escape(score["disclaimer"]), small),
        Spacer(1, 4 * mm),
        Paragraph(
            f"{escape(profile['display_name'])} · age {profile['age_years']} · "
            f"profile {escape(profile['condition'])}",
            body,
        ),
        Paragraph(escape(ending), body),
        Paragraph(escape(pace_line), small),
        Paragraph(f"Badge: {escape(score['badge'])}", heading),
        Paragraph("Three strengths", heading),
        _bullets(score["strengths"], body),
        Paragraph("Two focus areas", heading),
        _bullets(score["focus_areas"], body),
        Paragraph(f"{escape(score['niche_title'])}. {escape(score['niche_note'])}", body),
        Paragraph(escape(score["explain"]["note"]), small),
        *_shap_lines(score, small),
    ]
    document.build(story)
    return buffer.getvalue()


def _shap_lines(score: dict, style: ParagraphStyle) -> list[Paragraph]:
    explain = score.get("explain") or {}
    if explain.get("method") != "shap_linear":
        return []
    lines = [Paragraph("Feature contributions", style)]
    for item in explain.get("attributions", [])[:4]:
        lines.append(
            Paragraph(
                f"{escape(item['label'])}: {escape(item['direction'])} ({item['shap']:+.3f}).",
                style,
            )
        )
    return lines


def _bullets(items: list[str], style: ParagraphStyle) -> ListFlowable:
    return ListFlowable(
        [ListItem(Paragraph(escape(item), style), leftIndent=8) for item in items],
        bulletType="1",
        start="1",
        leftIndent=12,
    )
