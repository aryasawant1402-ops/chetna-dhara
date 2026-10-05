import { useMemo, useState } from "react";
import { useSession } from "../state/sessionStore";
import { StageAnnounce } from "./Readable";

export function ParentGate() {
  const passGate = useSession((state) => state.passGate);
  const [attempt, setAttempt] = useState(0);
  const [entry, setEntry] = useState("");
  const [note, setNote] = useState("");
  const challenge = useMemo(() => {
    const left = 2 + Math.floor(Math.random() * 8);
    const right = 2 + Math.floor(Math.random() * 8);
    return { left, right, sum: left + right };
  }, [attempt]);

  function pushDigit(digit: number) {
    setEntry((current) => (current.length >= 2 ? current : `${current}${digit}`));
    setNote("");
  }

  function submit() {
    if (Number(entry) === challenge.sum) {
      passGate();
      return;
    }
    setNote("Not quite. Here is a new one.");
    setEntry("");
    setAttempt((value) => value + 1);
  }

  return (
    <main className="screen">
      <StageAnnounce>Grown-up check.</StageAnnounce>
      <p className="wordmark">Grown-up check</p>
      <h2>
        What is {challenge.left} + {challenge.right}?
      </h2>
      <p className="entry" data-testid="gate-entry" aria-live="polite">
        {entry || "·"}
      </p>
      {note ? <p className="note">{note}</p> : null}
      <div className="digit-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => (
          <button key={digit} type="button" className="digit" data-testid={`digit-${digit}`} onClick={() => pushDigit(digit)}>
            {digit}
          </button>
        ))}
      </div>
      <div className="row">
        <button type="button" className="quiet" onClick={() => setEntry("")}>
          Clear
        </button>
        <button type="button" className="primary" data-testid="gate-done" onClick={submit}>
          Done
        </button>
      </div>
    </main>
  );
}
