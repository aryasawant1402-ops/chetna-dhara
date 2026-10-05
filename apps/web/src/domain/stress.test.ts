import { expect, test } from "vitest";
import { assessStress, type PointerSample } from "./stress";

function downs(count: number, x = 20, y = 20): PointerSample[] {
  return Array.from({ length: count }, (_, index) => ({
    t: index * 20,
    x,
    y,
    phase: "down" as const,
  }));
}

test("eight quick taps count as a stress spike", () => {
  const reading = assessStress(downs(8), 160);
  expect(reading.stressed).toBe(true);
  expect(reading.reason).toBe("tap_rate");
});

test("five taps in one spot count as banging", () => {
  const reading = assessStress(downs(5), 100);
  expect(reading.reason).toBe("repeat_hits");
});

test("a fast drag counts when it repeats", () => {
  const moves: PointerSample[] = [0, 1, 2, 3].map((index) => ({
    t: index * 10,
    x: index * 50,
    y: 0,
    phase: "move",
  }));
  const reading = assessStress(moves, 40);
  expect(reading.reason).toBe("drag_velocity");
});

test("a few calm taps stay under the line", () => {
  expect(assessStress(downs(3), 80).stressed).toBe(false);
});
