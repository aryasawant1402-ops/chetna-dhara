import { useState } from "react";
import { useSession } from "../state/sessionStore";
import { IconBegin, Readable, StageAnnounce } from "./Readable";

export function Ready() {
  const condition = useSession((state) => state.condition);
  const begin = useSession((state) => state.begin);
  const openGate = useSession((state) => state.openGate);
  const [pressed, setPressed] = useState(false);

  return (
    <main className="screen">
      <StageAnnounce>Ready to begin.</StageAnnounce>
      <p className="wordmark">ChetnaDhara</p>
      <h2>
        <Readable text="Hello." />
      </h2>
      <p className="lede">
        <Readable text="One quiet game." />
      </p>
      <button
        type="button"
        className={condition === "asd" ? "primary pictogram" : "primary"}
        data-testid="begin"
        onClick={() => {
          setPressed(true);
          begin();
        }}
        disabled={pressed}
      >
        {condition === "asd" ? <IconBegin /> : null}
        <span>Begin</span>
      </button>
      <button type="button" className="quiet" data-testid="grown-up" onClick={() => openGate("caregiver")}>
        Grown-up
      </button>
    </main>
  );
}
