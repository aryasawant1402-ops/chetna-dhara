"""Keep these rules aligned with apps/web/src/domain/scoring.py's sibling scoring.ts."""

DISCLAIMER = (
    "This note describes one play session. It is not a diagnosis, not a test score, "
    "and not an educational placement."
)

STRENGTHS = {
    "calm_warmup": "Settled in with a calm warm-up.",
    "patterns": "Recalled ordered patterns.",
    "steady_pace": "Kept a steady touch pace.",
    "fewer_hints": "Went on with fewer hints.",
    "paced_down": "The pace slowed before the session became frantic.",
    "one_task": "Stayed with one task from start to finish.",
    "ending": "Finished on a predictable ending.",
    "routine": "Followed a short, repeated routine.",
}

FOCUS = {
    "short_patterns": "Keep patterns at three steps and praise a partial match.",
    "hints": "Hints are still carrying the task. Fade them after two easy successes.",
    "taps": "Fast repeated taps showed up. Offer the body break at the first spike.",
    "no_taps": "The warm-up had no taps. Start the first ripple together.",
    "short_practice": "The practice was very short. Repeat this same game before adding another.",
    "cap": "Keep the age time cap so the stop stays predictable.",
    "quest": "Use the same offline quest after each session.",
}


def score_session(payload: dict) -> dict:
    trials = payload["trials"]
    total = len(trials)
    correct = sum(1 for trial in trials if trial["correct"])
    accuracy = 0 if total == 0 else correct / total
    mean_prompt = 0 if total == 0 else sum(trial["prompt_level"] for trial in trials) / total
    prompt_dependency = mean_prompt / 2
    stress_stage = payload["stress_stage"]
    warmup_taps = payload["warmup_taps"]
    warmup_completed = payload["warmup_completed"]

    strength_pool = [
        item
        for item in (
            STRENGTHS["calm_warmup"] if warmup_completed and warmup_taps >= 1 and stress_stage != "warmup" else None,
            STRENGTHS["patterns"] if total >= 2 and accuracy >= 0.67 else None,
            STRENGTHS["steady_pace"] if stress_stage is None else None,
            STRENGTHS["fewer_hints"] if total >= 2 and prompt_dependency <= 0.34 else None,
            STRENGTHS["paced_down"] if stress_stage is not None else None,
            STRENGTHS["one_task"],
            STRENGTHS["ending"],
            STRENGTHS["routine"],
        )
        if item is not None
    ]
    focus_pool = [
        item
        for item in (
            FOCUS["short_patterns"] if total >= 1 and accuracy < 0.5 else None,
            FOCUS["hints"] if total >= 1 and prompt_dependency >= 0.67 else None,
            FOCUS["taps"] if stress_stage is not None else None,
            FOCUS["no_taps"] if warmup_taps == 0 else None,
            FOCUS["short_practice"] if total < 2 else None,
            FOCUS["cap"],
            FOCUS["quest"],
        )
        if item is not None
    ]
    if accuracy >= 0.67 and stress_stage is None:
        badge = "Pattern Keeper"
    elif stress_stage is not None and warmup_taps >= 1:
        badge = "Calm Return"
    else:
        badge = "Steady Start"
    niche_title = "Ordered patterns" if accuracy >= 0.67 else "Routine comfort"

    return {
        "accuracy": round(accuracy, 3),
        "prompt_dependency": round(prompt_dependency, 3),
        "strengths": strength_pool[:3],
        "focus_areas": focus_pool[:2],
        "badge": badge,
        "niche_title": niche_title,
        "niche_note": "This is a session observation, not an aptitude label.",
        "disclaimer": DISCLAIMER,
        "features": [
            {
                "name": "sequence_accuracy",
                "value": round(accuracy, 3),
                "reading": "Share of sequences recalled correctly.",
            },
            {
                "name": "prompt_dependency",
                "value": round(prompt_dependency, 3),
                "reading": "How much the hints were still in use. Lower means more independent.",
            },
            {
                "name": "stress_ended",
                "value": 0 if stress_stage is None else 1,
                "reading": "1 when a touch spike moved the session to the calm close.",
            },
            {
                "name": "warmup_taps",
                "value": warmup_taps,
                "reading": "Taps during the opening ripple.",
            },
        ],
        "explain": {
            "status": "not_configured",
            "method": "rule_scores",
            "note": (
                "SHAP attributions attach here after a trained model exists. "
                "These readings are deterministic session rules."
            ),
        },
    }
