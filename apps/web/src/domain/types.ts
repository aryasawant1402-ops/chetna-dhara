export type ConditionId = "asd" | "adhd" | "dyslexia" | "dyspraxia" | "idd";

export type ColorVision = "typical" | "protanopia" | "deuteranopia" | "tritanopia";

export type StageId =
  | "ready"
  | "warmup"
  | "activity"
  | "deescalate"
  | "hardstop"
  | "gate"
  | "offline"
  | "caregiver";

export type EndReason = "timer" | "stress";

export type StressStage = "warmup" | "activity";

export interface TrialRecord {
  correct: boolean;
  promptLevel: number;
}
