import { useEffect, useState } from "react";
import { archiveCurrentSession, syncCompletedSession } from "./api/client";
import { Caregiver } from "./components/Caregiver";
import { Deescalate } from "./components/Deescalate";
import { HardStop } from "./components/HardStop";
import { OfflineCard } from "./components/OfflineCard";
import { ParentGate } from "./components/ParentGate";
import { Ready } from "./components/Ready";
import { SequenceActivity } from "./components/SequenceActivity";
import { SunTimer } from "./components/SunTimer";
import { Warmup } from "./components/Warmup";
import { resolveTheme, themeToStyle } from "./domain/themes";
import { useSession } from "./state/sessionStore";

export default function App() {
  const condition = useSession((state) => state.condition);
  const colorVision = useSession((state) => state.colorVision);
  const darkMode = useSession((state) => state.darkMode);
  const stage = useSession((state) => state.stage);
  const tick = useSession((state) => state.tick);
  const theme = resolveTheme(condition, colorVision, darkMode);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = Date.now();
      setNow(next);
      tick(next);
    }, 200);
    return () => window.clearInterval(id);
  }, [tick]);

  useEffect(() => {
    if (stage === "hardstop") {
      archiveCurrentSession();
      void syncCompletedSession();
    }
  }, [stage]);

  const playing = stage === "warmup" || stage === "activity" || stage === "deescalate";

  return (
    <div
      className={`app clutter-${theme.clutter}`}
      style={themeToStyle(theme)}
      data-motion={theme.motion}
      data-condition={condition}
    >
      <h1 className="sr-only">ChetnaDhara</h1>
      {playing ? (
        <div className="play">
          <SunTimer now={now} />
          {stage === "warmup" ? <Warmup /> : null}
          {stage === "activity" ? <SequenceActivity /> : null}
          {stage === "deescalate" ? <Deescalate /> : null}
        </div>
      ) : null}
      {stage === "ready" ? <Ready /> : null}
      {stage === "hardstop" ? <HardStop /> : null}
      {stage === "gate" ? <ParentGate /> : null}
      {stage === "offline" ? <OfflineCard /> : null}
      {stage === "caregiver" ? <Caregiver /> : null}
    </div>
  );
}
