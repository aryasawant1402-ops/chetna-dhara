import { useSession } from "../state/sessionStore";
import { Readable, StageAnnounce } from "./Readable";

export function HardStop() {
  const openGate = useSession((state) => state.openGate);

  return (
    <main className="screen">
      <StageAnnounce>All done for now. The game is resting.</StageAnnounce>
      <div className="sun resting" aria-hidden="true" />
      <h2>
        <Readable text="All done for now." />
      </h2>
      <p className="lede">
        <Readable text="The game is resting." />
      </p>
      <button type="button" className="primary" data-testid="open-next" onClick={() => openGate("offline")}>
        Grown-up opens the next part
      </button>
    </main>
  );
}
