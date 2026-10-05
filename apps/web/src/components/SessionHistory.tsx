import { buildDossier, type HistoryEntry } from "../domain/dossier";

export function SessionHistory({ displayName, entries }: { displayName: string; entries: HistoryEntry[] }) {
  const dossier = buildDossier(
    displayName,
    entries.map((entry) => ({
      badge: entry.badge,
      strengths: entry.strengths,
      nicheTitle: entry.nicheTitle,
    })),
  );

  return (
    <>
      <section className="report" data-testid="dossier">
        <h3>Across sittings</h3>
        <p className="note">{dossier.disclaimer}</p>
        <p>{dossier.patternNote}</p>
        {dossier.badges.length > 0 ? (
          <ul>
            {dossier.badges.map((badge) => (
              <li key={badge.name}>
                <strong>{badge.name}.</strong> {badge.note}
              </li>
            ))}
          </ul>
        ) : null}
        {dossier.repeatedStrengths.length > 0 ? (
          <>
            <h3>Repeated lines</h3>
            <ul>
              {dossier.repeatedStrengths.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </>
        ) : null}
      </section>
      <section>
        <h3>Saved sittings</h3>
        {entries.length === 0 ? (
          <p className="note">Completed sittings for {displayName} will appear here.</p>
        ) : (
          <ol className="history" data-testid="history">
            {entries.map((entry) => (
              <li key={entry.localId}>
                <strong>{entry.badge}</strong>
                <span>{formatWhen(entry.completedAt)}</span>
                <span>{entry.endReason === "stress" ? "Slowed early" : "Planned stop"}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
