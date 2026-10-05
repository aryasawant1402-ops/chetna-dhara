import { create } from "zustand";
import { stageBudgets, type PaceMode, type StageBudgets } from "../domain/pacing";
import { assessStress, type PointerSample, type StressReading } from "../domain/stress";
import type { ColorVision, ConditionId, EndReason, StageId, StressStage, TrialRecord } from "../domain/types";

export type SyncState = "idle" | "saving" | "saved" | "offline";

interface SessionState {
  displayName: string;
  ageYears: 6 | 7 | 8;
  condition: ConditionId;
  colorVision: ColorVision;
  darkMode: boolean;
  pace: PaceMode;
  locale: "en" | "hi";
  stage: StageId;
  gateReturn: "offline" | "caregiver";
  sessionId: string;
  remoteId: string | null;
  startedAt: number | null;
  stageStartedAt: number | null;
  budgets: StageBudgets;
  endReason: EndReason | null;
  stressStage: StressStage | null;
  warmupTaps: number;
  warmupCompleted: boolean;
  trials: TrialRecord[];
  promptLevel: number;
  samples: PointerSample[];
  stress: StressReading;
  syncState: SyncState;
  serverExplain: ServerExplain | null;
  setProfile: (
    patch: Partial<
      Pick<
        SessionState,
        "displayName" | "ageYears" | "condition" | "colorVision" | "darkMode" | "pace" | "locale"
      >
    >,
  ) => void;
  begin: () => void;
  recordPointer: (sample: PointerSample) => void;
  recordTrial: (correct: boolean) => void;
  tick: (now: number) => void;
  openGate: (dest: "offline" | "caregiver") => void;
  passGate: () => void;
  leaveCaregiver: () => void;
  prepareNewSession: () => void;
  markSync: (remoteId: string | null, syncState: SyncState) => void;
  setServerExplain: (explain: ServerExplain | null) => void;
}

export interface ServerExplain {
  status: string;
  method: string;
  note: string;
  prediction?: number;
  attributions?: { name: string; label: string; value: number; shap: number; direction: string }[];
}

const emptyStress: StressReading = {
  stressed: false,
  reason: null,
  tapRate: 0,
  dragVelocity: 0,
  repeatHits: 0,
};

function clearedPlay(): Pick<
  SessionState,
  | "remoteId"
  | "startedAt"
  | "stageStartedAt"
  | "endReason"
  | "stressStage"
  | "warmupTaps"
  | "warmupCompleted"
  | "trials"
  | "promptLevel"
  | "samples"
  | "stress"
  | "syncState"
  | "serverExplain"
> {
  return {
    remoteId: null,
    startedAt: null,
    stageStartedAt: null,
    endReason: null,
    stressStage: null,
    warmupTaps: 0,
    warmupCompleted: false,
    trials: [],
    promptLevel: 2,
    samples: [],
    stress: emptyStress,
    syncState: "idle",
    serverExplain: null,
  };
}

export const useSession = create<SessionState>((set) => ({
  displayName: "Friend",
  ageYears: 7,
  condition: "adhd",
  colorVision: "typical",
  darkMode: false,
  pace: "judging",
  locale: "en",
  stage: "ready",
  gateReturn: "caregiver",
  sessionId: "pending",
  budgets: stageBudgets(7, "judging"),
  ...clearedPlay(),

  setProfile: (patch) =>
    set((state) => {
      if (state.stage === "warmup" || state.stage === "activity" || state.stage === "deescalate") {
        return state;
      }
      const next = { ...state, ...patch };
      return {
        ...next,
        budgets: stageBudgets(next.ageYears, next.pace),
      };
    }),

  begin: () =>
    set((state) => {
      const now = Date.now();
      return {
        ...state,
        ...clearedPlay(),
        stage: "warmup",
        sessionId: crypto.randomUUID(),
        startedAt: now,
        stageStartedAt: now,
        budgets: stageBudgets(state.ageYears, state.pace),
      };
    }),

  recordPointer: (sample) =>
    set((state) => {
      if (state.stage !== "warmup" && state.stage !== "activity") return state;
      const samples = [...state.samples, sample].slice(-100);
      const stress = assessStress(samples, sample.t);
      const warmupTaps =
        state.stage === "warmup" && sample.phase === "down" ? state.warmupTaps + 1 : state.warmupTaps;
      if (stress.stressed) {
        return {
          ...state,
          samples,
          stress,
          warmupTaps,
          stage: "deescalate",
          stageStartedAt: sample.t,
          endReason: "stress",
          stressStage: state.stage,
        };
      }
      return { ...state, samples, stress, warmupTaps };
    }),

  recordTrial: (correct) =>
    set((state) => ({
      trials: [...state.trials, { correct, promptLevel: state.promptLevel }],
      promptLevel: correct ? Math.max(0, state.promptLevel - 1) : Math.min(2, state.promptLevel + 1),
    })),

  tick: (now) =>
    set((state) => {
      if (state.stageStartedAt === null) return state;
      const elapsed = now - state.stageStartedAt;
      if (state.stage === "warmup" && elapsed >= state.budgets.warmupMs) {
        return { ...state, stage: "activity", stageStartedAt: now, samples: [], warmupCompleted: true };
      }
      if (state.stage === "activity" && elapsed >= state.budgets.activityMs) {
        return {
          ...state,
          stage: "deescalate",
          stageStartedAt: now,
          samples: [],
          endReason: state.endReason ?? "timer",
        };
      }
      if (state.stage === "deescalate" && elapsed >= state.budgets.deescalateMs) {
        return {
          ...state,
          stage: "hardstop",
          stageStartedAt: now,
          samples: [],
          endReason: state.endReason ?? "timer",
        };
      }
      return state;
    }),

  openGate: (dest) => set({ stage: "gate", gateReturn: dest }),

  passGate: () => set((state) => ({ stage: state.gateReturn })),

  leaveCaregiver: () => set((state) => ({ stage: state.endReason ? "offline" : "ready" })),

  prepareNewSession: () =>
    set((state) => ({
      ...state,
      ...clearedPlay(),
      stage: "ready",
      sessionId: "pending",
      budgets: stageBudgets(state.ageYears, state.pace),
    })),

  markSync: (remoteId, syncState) => set({ remoteId, syncState }),

  setServerExplain: (serverExplain) => set({ serverExplain }),
}));
