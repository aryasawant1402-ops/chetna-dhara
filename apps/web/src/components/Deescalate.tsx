import { useEffect, useState } from "react";
import { resolveTheme } from "../domain/themes";
import { useSession } from "../state/sessionStore";
import { Readable, StageAnnounce } from "./Readable";

interface CalmFrame {
  id: string;
  src: string;
  caption: string;
}

interface CalmPack {
  frames: CalmFrame[];
  audio?: { src: string; caption: string };
}

const FALLBACK: CalmPack = {
  frames: [
    { id: "hill", src: "", caption: "The sun sat down behind the hill." },
    { id: "boat", src: "", caption: "A boat moved slowly across the still water." },
    { id: "water", src: "", caption: "Everything waited, and that was enough." },
  ],
};

export function Deescalate() {
  const condition = useSession((state) => state.condition);
  const colorVision = useSession((state) => state.colorVision);
  const darkMode = useSession((state) => state.darkMode);
  const motion = resolveTheme(condition, colorVision, darkMode).motion;
  const still =
    motion === "none" ||
    (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [pack, setPack] = useState<CalmPack>(FALLBACK);
  const [visible, setVisible] = useState(still ? FALLBACK.frames.length : 1);

  useEffect(() => {
    let cancelled = false;
    void fetch("/v1/media/calm/manifest.json")
      .then((response) => {
        if (!response.ok) throw new Error("calm pack unavailable");
        return response.json() as Promise<CalmPack>;
      })
      .then((next) => {
        if (!cancelled && next.frames?.length) setPack(next);
      })
      .catch(() => {
        if (!cancelled) setPack(FALLBACK);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (still) return;
    const timers = pack.frames.slice(1).map((_, index) =>
      window.setTimeout(() => setVisible(index + 2), (index + 1) * 5000),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [still, pack]);

  useEffect(() => {
    if (still || !pack.audio?.src) return;
    const audio = new Audio(`/v1/media/calm/${pack.audio.src}`);
    audio.volume = 0.2;
    void audio.play().catch(() => undefined);
    return () => {
      audio.pause();
    };
  }, [still, pack.audio?.src]);

  const shown = still ? pack.frames : pack.frames.slice(0, visible);

  return (
    <div className="stage calm-stage">
      <StageAnnounce>Resting. The game is slowing down.</StageAnnounce>
      <div className="breath" aria-hidden="true" />
      <div className="story">
        {shown.map((frame) => (
          <figure key={frame.id} className="calm-frame-wrap">
            {frame.src ? (
              <img className="calm-frame" src={`/v1/media/calm/${frame.src}`} alt={frame.caption} />
            ) : null}
            <figcaption>
              <Readable text={frame.caption} />
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
