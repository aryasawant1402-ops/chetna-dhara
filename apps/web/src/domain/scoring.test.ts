import { expect, test } from "vitest";
import { scoreSession } from "./scoring";

test("a calm accurate session names pattern memory and stays non-diagnostic", () => {
  const score = scoreSession({
    warmupTaps: 4,
    warmupCompleted: true,
    stressStage: null,
    trials: [
      { correct: true, promptLevel: 2 },
      { correct: true, promptLevel: 1 },
      { correct: true, promptLevel: 0 },
    ],
  });
  expect(score.badge).toBe("Pattern Keeper");
  expect(score.nicheTitle).toBe("Ordered patterns");
  expect(score.strengths).toContain("Recalled ordered patterns.");
  expect(score.strengths).toHaveLength(3);
  expect(score.focusAreas).toHaveLength(2);
  expect(score.disclaimer).toMatch(/not a diagnosis/);
  expect(score.explain.status).toBe("not_configured");
});

test("a stress ending asks for an earlier body break", () => {
  const score = scoreSession({
    warmupTaps: 2,
    warmupCompleted: false,
    stressStage: "warmup",
    trials: [],
  });
  expect(score.badge).toBe("Calm Return");
  expect(score.focusAreas[0]).toMatch(/body break/);
});
