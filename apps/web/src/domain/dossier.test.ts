import { expect, test } from "vitest";
import { buildDossier, type SittingRecord } from "./dossier";

const calm: SittingRecord = {
  badge: "Calm Return",
  nicheTitle: "Routine comfort",
  strengths: [
    "The pace slowed before the session became frantic.",
    "Stayed with one task from start to finish.",
    "Finished on a predictable ending.",
  ],
};

test("a single sitting does not become a cross-day pattern", () => {
  const dossier = buildDossier("Aarav", [calm]);
  expect(dossier.sessionCount).toBe(1);
  expect(dossier.badges).toEqual([
    { name: "Calm Return", count: 1, note: "Seen in one sitting." },
  ]);
  expect(dossier.repeatedStrengths).toEqual([]);
  expect(dossier.patternNote).toMatch(/at least two/);
  expect(dossier.disclaimer).toMatch(/not a diagnosis/);
});

test("repeated sittings keep badge notes descriptive", () => {
  const dossier = buildDossier("Aarav", [calm, calm]);
  expect(dossier.badges[0]).toEqual({
    name: "Calm Return",
    count: 2,
    note: "Showed up in 2 sittings.",
  });
  expect(dossier.repeatedStrengths.join(" ")).toMatch(/pace slowed/);
  expect(dossier.patternNote).toMatch(/routine comfort/);
  expect(dossier.patternNote).toMatch(/not an aptitude label/);
});
