import { useState, type PointerEvent } from "react";
import { useSession } from "../state/sessionStore";
import { Readable, StageAnnounce } from "./Readable";

interface Mark {
  id: number;
  x: number;
  y: number;
}

export function Warmup() {
  const recordPointer = useSession((state) => state.recordPointer);
  const motion = useSession((state) => state.condition === "asd");
  const [marks, setMarks] = useState<Mark[]>([]);

  function point(event: PointerEvent<HTMLDivElement>, phase: "down" | "move") {
    const rect = event.currentTarget.getBoundingClientRect();
    recordPointer({
      t: Date.now(),
      x: event.clientX,
      y: event.clientY,
      phase,
    });
    if (phase !== "down") return;
    const mark = { id: Date.now() + Math.random(), x: event.clientX - rect.left, y: event.clientY - rect.top };
    setMarks((current) => (motion ? [mark] : [...current, mark].slice(-6)));
  }

  return (
    <div className="stage">
      <StageAnnounce>Warm up. Tap the water.</StageAnnounce>
      <p className="instruction">
        <Readable text="Tap the water." />
      </p>
      <div
        className="surface"
        data-testid="play-surface"
        onPointerDown={(event) => point(event, "down")}
        onPointerMove={(event) => {
          if (event.buttons !== 1) return;
          point(event, "move");
        }}
      >
        {marks.map((mark) => (
          <span key={mark.id} className="ripple" style={{ left: mark.x, top: mark.y }} />
        ))}
      </div>
    </div>
  );
}
