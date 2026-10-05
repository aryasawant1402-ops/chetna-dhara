import type { HistoryEntry } from "../domain/dossier";
import { attachRemoteId, browserStore, historyFor, loadHistory, mergeHistory, upsertHistory } from "../domain/history";
import { scoreSession } from "../domain/scoring";
import { useSession, type ServerExplain } from "../state/sessionStore";

interface CreatedSession {
  id: string;
}

interface CompletedSession {
  explain?: ServerExplain;
}

export async function syncCompletedSession(): Promise<void> {
  const current = useSession.getState();
  if (current.stage !== "hardstop") return;
  if (current.syncState === "saving" || current.syncState === "saved") return;
  if (inFlight.has(current.sessionId)) return;

  inFlight.add(current.sessionId);
  useSession.getState().markSync(current.remoteId, "saving");
  try {
    const created = await postJson<CreatedSession>("/v1/sessions", {
      display_name: current.displayName,
      age_years: current.ageYears,
      condition: current.condition,
      pace: current.pace,
    });
    const completed = await postJson<CompletedSession>(`/v1/sessions/${created.id}/complete`, {
      end_reason: current.endReason ?? "timer",
      warmup_taps: current.warmupTaps,
      warmup_completed: current.warmupCompleted,
      stress_stage: current.stressStage,
      trials: current.trials.map((trial) => ({
        correct: trial.correct,
        prompt_level: trial.promptLevel,
      })),
    });
    if (useSession.getState().sessionId === current.sessionId) {
      attachRemoteId(browserStore(), current.sessionId, created.id);
      useSession.getState().setServerExplain(completed.explain ?? null);
      useSession.getState().markSync(created.id, "saved");
    }
  } catch {
    if (useSession.getState().sessionId === current.sessionId) {
      useSession.getState().markSync(null, "offline");
    }
  } finally {
    inFlight.delete(current.sessionId);
  }
}

export async function downloadPdf(remoteId: string): Promise<void> {
  const response = await fetch(`/v1/sessions/${remoteId}/report.pdf`);
  if (!response.ok) throw new Error("The PDF could not be created.");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ChetnaDhara-session.pdf";
  link.click();
  URL.revokeObjectURL(url);
}

export function archiveCurrentSession(): void {
  const state = useSession.getState();
  if (state.stage !== "hardstop" || state.endReason === null || state.sessionId === "pending") return;
  const score = localScore();
  const completedAt = new Date(state.startedAt ?? Date.now()).toISOString();
  const entry: HistoryEntry = {
    localId: state.sessionId,
    remoteId: state.remoteId,
    completedAt,
    displayName: state.displayName,
    ageYears: state.ageYears,
    condition: state.condition,
    endReason: state.endReason,
    badge: score.badge,
    nicheTitle: score.nicheTitle,
    strengths: [...score.strengths],
    focusAreas: [...score.focusAreas],
  };
  upsertHistory(browserStore(), entry);
}

interface RemoteSession {
  id: string;
  completed_at: string;
  display_name: string;
  age_years: number;
  condition: HistoryEntry["condition"];
  end_reason: HistoryEntry["endReason"];
  badge: string;
  strengths: string[];
  focus_areas: string[];
  niche_title: string;
}

export async function loadMergedHistory(displayName: string): Promise<HistoryEntry[]> {
  const local = historyFor(loadHistory(browserStore()), displayName);
  try {
    const response = await fetch(`/v1/sessions?display_name=${encodeURIComponent(displayName)}`);
    if (!response.ok) return local;
    const body = (await response.json()) as { sessions: RemoteSession[] };
    const remote = body.sessions.map(toHistoryEntry);
    return historyFor(mergeHistory(local, remote), displayName);
  } catch {
    return local;
  }
}

function toHistoryEntry(session: RemoteSession): HistoryEntry {
  return {
    localId: session.id,
    remoteId: session.id,
    completedAt: session.completed_at,
    displayName: session.display_name,
    ageYears: session.age_years,
    condition: session.condition,
    endReason: session.end_reason,
    badge: session.badge,
    nicheTitle: session.niche_title,
    strengths: session.strengths,
    focusAreas: session.focus_areas,
  };
}

export function localScore() {
  const state = useSession.getState();
  return scoreSession({
    warmupTaps: state.warmupTaps,
    warmupCompleted: state.warmupCompleted,
    trials: state.trials,
    stressStage: state.stressStage,
  });
}

const inFlight = new Set<string>();

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return (await response.json()) as T;
}
