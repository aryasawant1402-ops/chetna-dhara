export type PaceMode = "judging" | "clinical";

export const WARMUP_MS = 30_000;
export const CLINICAL_DEESCALATE_MS = 90_000;
export const JUDGING_ACTIVITY_MS = 60_000;
export const JUDGING_DEESCALATE_MS = 20_000;

export interface StageBudgets {
  warmupMs: number;
  activityMs: number;
  deescalateMs: number;
  capMs: number;
}

/** Clinical cap is (age + 1) minutes for ages 6, 7, and 8. */
export function clinicalCapMs(ageYears: number): number {
  const age = Math.min(8, Math.max(6, Math.round(ageYears)));
  return (age + 1) * 60_000;
}

export function stageBudgets(ageYears: number, pace: PaceMode): StageBudgets {
  if (pace === "judging") {
    const capMs = WARMUP_MS + JUDGING_ACTIVITY_MS + JUDGING_DEESCALATE_MS;
    return {
      warmupMs: WARMUP_MS,
      activityMs: JUDGING_ACTIVITY_MS,
      deescalateMs: JUDGING_DEESCALATE_MS,
      capMs,
    };
  }
  const capMs = clinicalCapMs(ageYears);
  return {
    warmupMs: WARMUP_MS,
    activityMs: capMs - WARMUP_MS - CLINICAL_DEESCALATE_MS,
    deescalateMs: CLINICAL_DEESCALATE_MS,
    capMs,
  };
}
