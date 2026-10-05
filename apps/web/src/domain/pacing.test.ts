import { describe, expect, test } from "vitest";
import { clinicalCapMs, stageBudgets } from "./pacing";

describe("stage budgets", () => {
  test("clinical cap is age plus one minute", () => {
    expect(clinicalCapMs(6)).toBe(7 * 60_000);
    expect(clinicalCapMs(7)).toBe(8 * 60_000);
    expect(clinicalCapMs(8)).toBe(9 * 60_000);
  });

  test("judging pace stays short enough to demonstrate the ending", () => {
    expect(stageBudgets(7, "judging")).toEqual({
      warmupMs: 30_000,
      activityMs: 60_000,
      deescalateMs: 20_000,
      capMs: 110_000,
    });
  });

  test("clinical activity fills the time between warm-up and the calm close", () => {
    const budgets = stageBudgets(7, "clinical");
    expect(budgets.capMs).toBe(480_000);
    expect(budgets.activityMs).toBe(360_000);
    expect(budgets.warmupMs + budgets.activityMs + budgets.deescalateMs).toBe(budgets.capMs);
  });
});
