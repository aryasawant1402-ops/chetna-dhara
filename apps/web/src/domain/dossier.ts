import type { ConditionId, EndReason } from "./types";

/** Keep these rules aligned with apps/api/app/dossier.py. */

export interface SittingRecord {
  badge: string;
  strengths: string[];
  nicheTitle: string;
}

export interface HeroBadge {
  name: string;
  count: number;
  note: string;
}

export interface TalentDossier {
  displayName: string;
  sessionCount: number;
  badges: HeroBadge[];
  repeatedStrengths: string[];
  patternNote: string;
  disclaimer: string;
}

export const DOSSIER_DISCLAIMER =
  "This record describes completed sittings. It is not a diagnosis, not a test score, and not an educational placement.";

export function buildDossier(displayName: string, sittings: SittingRecord[]): TalentDossier {
  const badgeCounts = new Map<string, number>();
  const strengthCounts = new Map<string, number>();
  const niches: string[] = [];
  for (const sitting of sittings) {
    badgeCounts.set(sitting.badge, (badgeCounts.get(sitting.badge) ?? 0) + 1);
    niches.push(sitting.nicheTitle);
    for (const line of sitting.strengths) {
      strengthCounts.set(line, (strengthCounts.get(line) ?? 0) + 1);
    }
  }
  const badges = [...badgeCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([name, count]) => ({
      name,
      count,
      note: count === 1 ? "Seen in one sitting." : `Showed up in ${count} sittings.`,
    }));
  const repeatedStrengths = [...strengthCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([line]) => line);

  return {
    displayName,
    sessionCount: sittings.length,
    badges,
    repeatedStrengths,
    patternNote: patternNote(sittings.length, niches),
    disclaimer: DOSSIER_DISCLAIMER,
  };
}

function patternNote(count: number, niches: string[]): string {
  if (count === 0) return "No completed sittings yet.";
  if (count === 1) {
    return "One sitting is on record. A pattern across days needs at least two completed sessions.";
  }
  const unique = new Set(niches);
  if (unique.size === 1) {
    return `Across these sittings, ${niches[0].toLowerCase()} showed up each time. This is a session observation, not an aptitude label.`;
  }
  return "These sittings do not repeat the same observation. This is a session record, not an aptitude label.";
}

export interface HistoryEntry extends SittingRecord {
  localId: string;
  remoteId: string | null;
  completedAt: string;
  displayName: string;
  ageYears: number;
  condition: ConditionId;
  endReason: EndReason;
  focusAreas: string[];
}
