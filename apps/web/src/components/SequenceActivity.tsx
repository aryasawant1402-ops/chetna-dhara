import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useSession } from "../state/sessionStore";
import { Readable, StageAnnounce } from "./Readable";

const PADS = [0, 1, 2, 3] as const;

function nextSequence(): number[] {
  const sequence: number[] = [];
  while (sequence.length < 3) {
    const pad = Math.floor(Math.random() * PADS.length);
    if (sequence[sequence.length - 1] !== pad) sequence.push(pad);
  }
  return sequence;
}

export function SequenceActivity() {
  const condition = useSession((state) => state.condition);
  const promptLevel = useSession((state) => state.promptLevel);
  const recordPointer = useSession((state) => state.recordPointer);
  const recordTrial = useSession((state) => state.recordTrial);
  const [sequence, setSequence] = useState<number[]>(() => nextSequence());
  const [phase, setPhase] = useState<"show" | "input">("show");
  const [cursor, setCursor] = useState(0);
  const [lit, setLit] = useState<number | null>(null);
  const [missed, setMissed] = useState(false);
  const [roundKey, setRoundKey] = useState(0);

  const errorless = condition === "idd";
  const holdMs = condition === "idd" ? 450 : condition === "dyspraxia" ? 350 : 0;

  useEffect(() => {
    if (phase !== "show") return;
    let cancelled = false;
    const timers: number[] = [];
    sequence.forEach((pad, index) => {
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) setLit(pad);
        }, index * 900),
      );
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) setLit(null);
        }, index * 900 + 560),
      );
    });
    timers.push(
      window.setTimeout(() => {
        if (cancelled) return;
        setPhase("input");
        setCursor(0);
        setLit(null);
        setMissed(false);
      }, sequence.length * 900 + 240),
    );
    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [phase, sequence, roundKey]);

  function finish(correct: boolean) {
    recordTrial(correct);
    setSequence(nextSequence());
    setPhase("show");
    setRoundKey((value) => value + 1);
    setLit(null);
    setCursor(0);
    setMissed(false);
  }

  function commit(pad: number) {
    if (phase !== "input") return;
    const expected = sequence[cursor];
    if (pad !== expected) {
      setMissed(true);
      if (errorless) {
        setLit(expected);
        return;
      }
      finish(false);
      return;
    }
    setLit(null);
    const next = cursor + 1;
    if (next >= sequence.length) {
      finish(!missed);
      return;
    }
    setCursor(next);
  }

  function track(event: PointerEvent<HTMLDivElement>, pointerPhase: "down" | "move") {
    recordPointer({
      t: Date.now(),
      x: event.clientX,
      y: event.clientY,
      phase: pointerPhase,
    });
  }

  return (
    <div className="stage">
      <StageAnnounce>{phase === "show" ? "Watch the glow." : "Tap the glow back."}</StageAnnounce>
      <p className="instruction">
        <Readable text={phase === "show" ? "Watch the glow." : "Tap it back."} />
      </p>
      <div
        className="pads"
        data-testid="play-surface"
        onPointerDown={(event) => track(event, "down")}
        onPointerMove={(event) => {
          if (event.buttons !== 1) return;
          track(event, "move");
        }}
      >
        {PADS.map((pad) => {
          const hinted =
            phase === "input" &&
            ((promptLevel >= 2 && pad === sequence[cursor]) ||
              (promptLevel === 1 && cursor === 0 && pad === sequence[0]));
          return (
            <HoldPad
              key={pad}
              label={`Pad ${pad + 1}`}
              lit={lit === pad}
              hinted={hinted}
              disabled={phase !== "input"}
              holdMs={holdMs}
              onCommit={() => commit(pad)}
            />
          );
        })}
      </div>
    </div>
  );
}

function HoldPad({
  label,
  lit,
  hinted,
  disabled,
  holdMs,
  onCommit,
}: {
  label: string;
  lit: boolean;
  hinted: boolean;
  disabled: boolean;
  holdMs: number;
  onCommit: () => void;
}) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  function cancel() {
    if (timer.current === null) return;
    window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }

  function start(event: PointerEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (holdMs <= 0) {
      onCommit();
      return;
    }
    cancel();
    event.currentTarget.setPointerCapture(event.pointerId);
    setHolding(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setHolding(false);
      onCommit();
    }, holdMs);
  }

  return (
    <button
      type="button"
      className={["pad", lit ? "lit" : "", hinted ? "hinted" : "", holding ? "holding" : ""].filter(Boolean).join(" ")}
      aria-label={label}
      aria-disabled={disabled}
      onPointerDown={start}
      onPointerUp={cancel}
      onLostPointerCapture={cancel}
    >
      <span className="pad-dot" />
    </button>
  );
}
