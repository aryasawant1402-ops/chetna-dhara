import { expect, test } from "vitest";
import type { HistoryEntry } from "./dossier";
import { historyFor, loadHistory, mergeHistory, upsertHistory, type HistoryStore } from "./history";

function memoryStore(): HistoryStore {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value);
    },
  };
}

function entry(localId: string, completedAt: string, remoteId: string | null = null): HistoryEntry {
  return {
    localId,
    remoteId,
    completedAt,
    displayName: "Aarav",
    ageYears: 7,
    condition: "adhd",
    endReason: "stress",
    badge: "Calm Return",
    nicheTitle: "Routine comfort",
    strengths: ["The pace slowed before the session became frantic."],
    focusAreas: ["Fast repeated taps showed up. Offer the body break at the first spike."],
  };
}

test("history replaces a sitting with the same local id", () => {
  const store = memoryStore();
  upsertHistory(store, entry("one", "2026-10-05T10:00:00.000Z"));
  upsertHistory(store, { ...entry("one", "2026-10-05T10:00:00.000Z"), remoteId: "remote-1" });
  expect(loadHistory(store)).toHaveLength(1);
  expect(loadHistory(store)[0]?.remoteId).toBe("remote-1");
});

test("merge keeps a server sitting that this device has not stored", () => {
  const local = [entry("local", "2026-10-05T12:00:00.000Z", "remote-1")];
  const remote = [
    entry("remote-1", "2026-10-05T12:00:00.000Z", "remote-1"),
    entry("remote-2", "2026-10-04T12:00:00.000Z", "remote-2"),
  ];
  const merged = mergeHistory(local, remote);
  expect(merged.map((item) => item.localId)).toEqual(["local", "remote-2"]);
  expect(historyFor(merged, "Aarav")).toHaveLength(2);
  expect(historyFor(merged, "Other")).toHaveLength(0);
});
