"""Train a small linear model on completed session summaries and explain it with linear SHAP.

The strengths and focus lines stay on the rule score. This model only estimates whether a
sitting matches the prototype's "extra support" pattern. It never sees audio or video.
"""

import json
import math
import os
from pathlib import Path

FEATURE_NAMES = ("sequence_accuracy", "prompt_dependency", "stress_ended", "warmup_taps")
MIN_ROWS = 6
MIN_PER_CLASS = 2
FEATURE_LABELS = {
    "sequence_accuracy": "Sequence accuracy",
    "prompt_dependency": "Prompt dependency",
    "stress_ended": "Touch spike",
    "warmup_taps": "Warm-up taps",
}


def model_path() -> Path:
    override = os.environ.get("MODEL_PATH", "").strip()
    if override:
        return Path(override)
    return Path(__file__).resolve().parents[1] / "data" / "session_model.json"


def extra_support(features: dict[str, float]) -> int:
    return int(
        features["sequence_accuracy"] < 0.5
        or features["prompt_dependency"] >= 0.67
        or features["stress_ended"] >= 1
        or features["warmup_taps"] <= 0
    )


def features_from_score(score: dict) -> dict[str, float]:
    by_name = {item["name"]: float(item["value"]) for item in score["features"]}
    return {name: by_name[name] for name in FEATURE_NAMES}


def rule_explain(sample_count: int, reason: str) -> dict:
    if reason == "one_class":
        note = (
            "The rule score is still in use. Saved sittings do not yet include both "
            "quieter sessions and sessions that needed extra support."
        )
    else:
        note = (
            "The rule score is still in use. SHAP starts after 6 completed sittings "
            "include both quieter sessions and sessions that needed extra support."
        )
    return {
        "status": "insufficient_data",
        "method": "rule_scores",
        "sample_count": sample_count,
        "note": note,
        "attributions": [],
    }


def fit_model(feature_rows: list[dict[str, float]]) -> dict | None:
    labels = [extra_support(row) for row in feature_rows]
    positives = sum(labels)
    if len(feature_rows) < MIN_ROWS or positives < MIN_PER_CLASS or len(labels) - positives < MIN_PER_CLASS:
        return None
    rows = [[row[name] for name in FEATURE_NAMES] for row in feature_rows]
    width = len(FEATURE_NAMES)
    count = len(rows)
    means = [sum(row[index] for row in rows) / count for index in range(width)]
    scales = []
    for index in range(width):
        variance = sum((row[index] - means[index]) ** 2 for row in rows) / count
        scales.append(math.sqrt(variance) if variance > 1e-8 else 1.0)
    standardized = [
        [(row[index] - means[index]) / scales[index] for index in range(width)] for row in rows
    ]
    coefficients = [0.0] * width
    intercept = 0.0
    learning_rate = 0.35
    penalty = 0.05
    for _step in range(600):
        grad_bias = 0.0
        grad_coef = [0.0] * width
        for values, label in zip(standardized, labels, strict=True):
            logit = intercept + sum(weight * value for weight, value in zip(coefficients, values, strict=True))
            error = _sigmoid(logit) - label
            grad_bias += error
            for index in range(width):
                grad_coef[index] += error * values[index]
        intercept -= learning_rate * grad_bias / count
        for index in range(width):
            coefficients[index] -= learning_rate * (grad_coef[index] / count + penalty * coefficients[index])
    return {
        "feature_names": list(FEATURE_NAMES),
        "means": means,
        "scales": scales,
        "coefficients": coefficients,
        "intercept": intercept,
        "sample_count": count,
        "positive_count": positives,
    }


def shap_explain(model: dict, features: dict[str, float]) -> dict:
    standardized = [
        (features[name] - model["means"][index]) / model["scales"][index]
        for index, name in enumerate(FEATURE_NAMES)
    ]
    attributions = []
    total = 0.0
    for index, name in enumerate(FEATURE_NAMES):
        contribution = model["coefficients"][index] * standardized[index]
        total += contribution
        attributions.append(
            {
                "name": name,
                "label": FEATURE_LABELS[name],
                "value": round(features[name], 3),
                "shap": round(contribution, 3),
                "direction": _direction(contribution),
            }
        )
    base_value = model["intercept"]
    prediction = _sigmoid(base_value + total)
    attributions.sort(key=lambda item: abs(item["shap"]), reverse=True)
    return {
        "status": "ready",
        "method": "shap_linear",
        "sample_count": model["sample_count"],
        "base_value": round(base_value, 3),
        "prediction": round(prediction, 3),
        "note": (
            "SHAP values are log-odds contributions from a linear model fit only on completed "
            "session summaries. Positive values push toward extra support. Strengths and focus "
            "lines still come from the session rules. This is not a diagnosis."
        ),
        "attributions": attributions,
    }


def explain_score(score: dict, prior_scores: list[dict]) -> dict:
    rows = [features_from_score(item) for item in prior_scores]
    rows.append(features_from_score(score))
    model = fit_model(rows)
    if model is None:
        positives = sum(extra_support(row) for row in rows)
        reason = "one_class" if len(rows) >= MIN_ROWS else "too_few"
        if len(rows) >= MIN_ROWS and (positives < MIN_PER_CLASS or len(rows) - positives < MIN_PER_CLASS):
            reason = "one_class"
        _clear_model()
        return rule_explain(len(rows), reason)
    _save_model(model)
    return shap_explain(model, features_from_score(score))


def model_status() -> dict:
    path = model_path()
    if not path.exists():
        return {"status": "insufficient_data", "method": "rule_scores", "sample_count": 0}
    stored = json.loads(path.read_text(encoding="utf-8"))
    return {
        "status": "ready",
        "method": "shap_linear",
        "sample_count": stored["sample_count"],
    }


def _save_model(model: dict) -> None:
    path = model_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(model), encoding="utf-8")


def _clear_model() -> None:
    path = model_path()
    if path.exists():
        path.unlink()


def _direction(contribution: float) -> str:
    if abs(contribution) < 0.05:
        return "changed the estimate very little"
    if contribution > 0:
        return "pushed this sitting toward extra support"
    return "pushed this sitting away from extra support"


def _sigmoid(value: float) -> float:
    if value >= 0:
        return 1.0 / (1.0 + math.exp(-value))
    natural = math.exp(value)
    return natural / (1.0 + natural)
