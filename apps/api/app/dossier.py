"""Keep these rules aligned with apps/web/src/domain/dossier.ts."""

DISCLAIMER = (
    "This record describes completed sittings. It is not a diagnosis, not a test score, "
    "and not an educational placement."
)


def build_dossier(display_name: str, sittings: list[dict]) -> dict:
    badge_counts: dict[str, int] = {}
    strength_counts: dict[str, int] = {}
    niches: list[str] = []
    for sitting in sittings:
        badge = sitting["badge"]
        badge_counts[badge] = badge_counts.get(badge, 0) + 1
        niches.append(sitting["niche_title"])
        for line in sitting["strengths"]:
            strength_counts[line] = strength_counts.get(line, 0) + 1

    badges = [
        {
            "name": name,
            "count": count,
            "note": "Seen in one sitting." if count == 1 else f"Showed up in {count} sittings.",
        }
        for name, count in sorted(badge_counts.items(), key=lambda item: (-item[1], item[0]))
    ]
    repeated = [
        line
        for line, _count in sorted(strength_counts.items(), key=lambda item: (-item[1], item[0]))
        if strength_counts[line] >= 2
    ][:3]
    return {
        "display_name": display_name,
        "session_count": len(sittings),
        "badges": badges,
        "repeated_strengths": repeated,
        "pattern_note": _pattern_note(len(sittings), niches),
        "disclaimer": DISCLAIMER,
    }


def _pattern_note(count: int, niches: list[str]) -> str:
    if count == 0:
        return "No completed sittings yet."
    if count == 1:
        return "One sitting is on record. A pattern across days needs at least two completed sessions."
    if len(set(niches)) == 1:
        return (
            f"Across these sittings, {niches[0].lower()} showed up each time. "
            "This is a session observation, not an aptitude label."
        )
    return (
        "These sittings do not repeat the same observation. "
        "This is a session record, not an aptitude label."
    )
