import { offlineQuests } from "../domain/offline";
import { useSession } from "../state/sessionStore";
import { Readable, StageAnnounce } from "./Readable";

export function OfflineCard() {
  const condition = useSession((state) => state.condition);
  const openGate = useSession((state) => state.openGate);
  const quest = offlineQuests[condition];

  return (
    <main className="screen">
      <StageAnnounce>Away from the screen.</StageAnnounce>
      <p className="wordmark">Away from the screen</p>
      <h2>
        <Readable text={quest.title} />
      </h2>
      <ol className="steps" data-testid="offline-card">
        {quest.steps.map((step) => (
          <li key={step}>
            <Readable text={step} />
          </li>
        ))}
      </ol>
      <button type="button" className="quiet" onClick={() => openGate("caregiver")}>
        Grown-up
      </button>
    </main>
  );
}
