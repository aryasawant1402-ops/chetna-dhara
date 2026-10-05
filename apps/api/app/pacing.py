WARMUP_MS = 30_000
CLINICAL_DEESCALATE_MS = 90_000
JUDGING_ACTIVITY_MS = 60_000
JUDGING_DEESCALATE_MS = 20_000


def clinical_cap_ms(age_years: int) -> int:
    age = min(8, max(6, round(age_years)))
    return (age + 1) * 60_000


def stage_budgets(age_years: int, pace: str) -> dict[str, int]:
    if pace == "judging":
        cap_ms = WARMUP_MS + JUDGING_ACTIVITY_MS + JUDGING_DEESCALATE_MS
        return {
            "warmup_ms": WARMUP_MS,
            "activity_ms": JUDGING_ACTIVITY_MS,
            "deescalate_ms": JUDGING_DEESCALATE_MS,
            "cap_ms": cap_ms,
        }
    cap_ms = clinical_cap_ms(age_years)
    return {
        "warmup_ms": WARMUP_MS,
        "activity_ms": cap_ms - WARMUP_MS - CLINICAL_DEESCALATE_MS,
        "deescalate_ms": CLINICAL_DEESCALATE_MS,
        "cap_ms": cap_ms,
    }
