import type { TrialRecord } from "./types";

/** Keep these rules aligned with apps/api/app/scoring.py. */

export interface ScoreInput {
  warmupTaps: number;
  warmupCompleted: boolean;
  trials: TrialRecord[];
  stressStage: "warmup" | "activity" | null;
}

export interface FeatureReading {
  name: string;
  value: number;
  reading: string;
}

export interface SessionScore {
  accuracy: number;
  promptDependency: number;
  strengths: [string, string, string];
  focusAreas: [string, string];
  badge: string;
  nicheTitle: string;
  nicheNote: string;
  disclaimer: string;
  features: FeatureReading[];
  explain: {
    status: "not_configured";
    method: "rule_scores";
    note: string;
  };
}

export const DISCLAIMER =
  "This note describes one play session. It is not a diagnosis, not a test score, and not an educational placement.";

const STRENGTHS = {
  calmWarmup: "Settled in with a calm warm-up.",
  patterns: "Recalled ordered patterns.",
  steadyPace: "Kept a steady touch pace.",
  fewerHints: "Went on with fewer hints.",
  pacedDown: "The pace slowed before the session became frantic.",
  oneTask: "Stayed with one task from start to finish.",
  ending: "Finished on a predictable ending.",
  routine: "Followed a short, repeated routine.",
} as const;

const FOCUS = {
  shortPatterns: "Keep patterns at three steps and praise a partial match.",
  hints: "Hints are still carrying the task. Fade them after two easy successes.",
  taps: "Fast repeated taps showed up. Offer the body break at the first spike.",
  noTaps: "The warm-up had no taps. Start the first ripple together.",
  shortPractice: "The practice was very short. Repeat this same game before adding another.",
  cap: "Keep the age time cap so the stop stays predictable.",
  quest: "Use the same offline quest after each session.",
} as const;

export function scoreSession(input: ScoreInput): SessionScore {
  const total = input.trials.length;
  const correct = input.trials.filter((trial) => trial.correct).length;
  const accuracy = total === 0 ? 0 : correct / total;
  const meanPrompt =
    total === 0 ? 0 : input.trials.reduce((sum, trial) => sum + trial.promptLevel, 0) / total;
  const promptDependency = meanPrompt / 2;

  const strengthPool = [
    input.warmupCompleted && input.warmupTaps >= 1 && input.stressStage !== "warmup"
      ? STRENGTHS.calmWarmup
      : null,
    total >= 2 && accuracy >= 0.67 ? STRENGTHS.patterns : null,
    input.stressStage === null ? STRENGTHS.steadyPace : null,
    total >= 2 && promptDependency <= 0.34 ? STRENGTHS.fewerHints : null,
    input.stressStage !== null ? STRENGTHS.pacedDown : null,
    STRENGTHS.oneTask,
    STRENGTHS.ending,
    STRENGTHS.routine,
  ];
  const focusPool = [
    total >= 1 && accuracy < 0.5 ? FOCUS.shortPatterns : null,
    total >= 1 && promptDependency >= 0.67 ? FOCUS.hints : null,
    input.stressStage !== null ? FOCUS.taps : null,
    input.warmupTaps === 0 ? FOCUS.noTaps : null,
    total < 2 ? FOCUS.shortPractice : null,
    FOCUS.cap,
    FOCUS.quest,
  ];

  const strengths = take3(present(strengthPool));
  const focusAreas = take2(present(focusPool));
  const badge =
    accuracy >= 0.67 && input.stressStage === null
      ? "Pattern Keeper"
      : input.stressStage !== null && input.warmupTaps >= 1
        ? "Calm Return"
        : "Steady Start";

  const nicheTitle = accuracy >= 0.67 ? "Ordered patterns" : "Routine comfort";

  return {
    accuracy,
    promptDependency,
    strengths,
    focusAreas,
    badge,
    nicheTitle,
    nicheNote: "This is a session observation, not an aptitude label.",
    disclaimer: DISCLAIMER,
    features: [
      {
        name: "sequence_accuracy",
        value: round3(accuracy),
        reading: "Share of sequences recalled correctly.",
      },
      {
        name: "prompt_dependency",
        value: round3(promptDependency),
        reading: "How much the hints were still in use. Lower means more independent.",
      },
      {
        name: "stress_ended",
        value: input.stressStage ? 1 : 0,
        reading: "1 when a touch spike moved the session to the calm close.",
      },
      {
        name: "warmup_taps",
        value: input.warmupTaps,
        reading: "Taps during the opening ripple.",
      },
    ],
    explain: {
      status: "not_configured",
      method: "rule_scores",
      note: "SHAP attributions attach here after a trained model exists. These readings are deterministic session rules.",
    },
  };
}

function present(items: Array<string | null>): string[] {
  const kept: string[] = [];
  for (const item of items) {
    if (item !== null) kept.push(item);
  }
  return kept;
}

function take3(items: string[]): [string, string, string] {
  if (items.length < 3) throw new Error("Score pool underrun");
  return [items[0], items[1], items[2]];
}

function take2(items: string[]): [string, string] {
  if (items.length < 2) throw new Error("Score pool underrun");
  return [items[0], items[1]];
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
