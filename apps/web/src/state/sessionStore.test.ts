import { beforeEach, expect, test } from "vitest";
import { useSession } from "./sessionStore";

beforeEach(() => {
  useSession.getState().prepareNewSession();
  useSession.getState().setProfile({ ageYears: 7, pace: "judging", condition: "adhd" });
});

test("mashing during warm-up skips to the calm close", () => {
  useSession.getState().begin();
  const start = Date.now();
  for (let index = 0; index < 8; index += 1) {
    useSession.getState().recordPointer({ t: start + index * 15, x: 30, y: 30, phase: "down" });
  }
  const state = useSession.getState();
  expect(state.stage).toBe("deescalate");
  expect(state.endReason).toBe("stress");
  expect(state.stressStage).toBe("warmup");
});

test("the judging clock ends on a hard stop and cannot step backward", () => {
  useSession.getState().begin();
  const warmupStart = useSession.getState().stageStartedAt ?? 0;
  useSession.getState().tick(warmupStart + 30_000);
  expect(useSession.getState().stage).toBe("activity");
  expect(useSession.getState().warmupCompleted).toBe(true);

  const activityStart = useSession.getState().stageStartedAt ?? 0;
  useSession.getState().tick(activityStart + 60_000);
  expect(useSession.getState().stage).toBe("deescalate");

  const restStart = useSession.getState().stageStartedAt ?? 0;
  useSession.getState().tick(restStart + 20_000);
  expect(useSession.getState().stage).toBe("hardstop");
  expect(useSession.getState().endReason).toBe("timer");

  useSession.getState().tick(restStart + 80_000);
  expect(useSession.getState().stage).toBe("hardstop");
});

test("the grown-up gate is the only way back to a new session", () => {
  useSession.getState().begin();
  const start = useSession.getState().stageStartedAt ?? 0;
  useSession.getState().tick(start + 30_000);
  useSession.getState().tick((useSession.getState().stageStartedAt ?? 0) + 60_000);
  useSession.getState().tick((useSession.getState().stageStartedAt ?? 0) + 20_000);
  useSession.getState().openGate("offline");
  expect(useSession.getState().stage).toBe("gate");
  useSession.getState().passGate();
  expect(useSession.getState().stage).toBe("offline");
  useSession.getState().prepareNewSession();
  expect(useSession.getState().stage).toBe("ready");
  expect(useSession.getState().trials).toEqual([]);
});
