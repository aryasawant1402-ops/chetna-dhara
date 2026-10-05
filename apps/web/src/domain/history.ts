import type { HistoryEntry } from "./dossier";

const KEY = "chetnadhara.history.v1";

export interface HistoryStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadHistory(store: HistoryStore): HistoryEntry[] {
  try {
    const raw = store.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => typeof entry?.localId === "string");
  } catch {
    return [];
  }
}

export function saveHistory(store: HistoryStore, entries: HistoryEntry[]): void {
  store.setItem(KEY, JSON.stringify(entries));
}

export function upsertHistory(store: HistoryStore, entry: HistoryEntry): HistoryEntry[] {
  const current = loadHistory(store).filter((item) => item.localId !== entry.localId);
  const next = [entry, ...current].sort((left, right) => right.completedAt.localeCompare(left.completedAt));
  saveHistory(store, next);
  return next;
}

export function attachRemoteId(store: HistoryStore, localId: string, remoteId: string): void {
  const next = loadHistory(store).map((entry) =>
    entry.localId === localId ? { ...entry, remoteId } : entry,
  );
  saveHistory(store, next);
}

export function historyFor(entries: HistoryEntry[], displayName: string): HistoryEntry[] {
  return entries.filter((entry) => entry.displayName === displayName);
}

export function mergeHistory(local: HistoryEntry[], remote: HistoryEntry[]): HistoryEntry[] {
  const remoteIds = new Set(local.map((entry) => entry.remoteId).filter((id): id is string => Boolean(id)));
  const localIds = new Set(local.map((entry) => entry.localId));
  const extra = remote.filter((entry) => {
    if (entry.remoteId && remoteIds.has(entry.remoteId)) return false;
    return !localIds.has(entry.localId);
  });
  return [...local, ...extra].sort((left, right) => right.completedAt.localeCompare(left.completedAt));
}

export function browserStore(): HistoryStore {
  if (typeof localStorage === "undefined") {
    return emptyMemoryStore();
  }
  return localStorage;
}

function emptyMemoryStore(): HistoryStore {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value);
    },
  };
}
