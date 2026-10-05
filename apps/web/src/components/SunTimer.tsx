import type { CSSProperties } from "react";
import { resolveTheme } from "../domain/themes";
import { useSession } from "../state/sessionStore";

export function SunTimer({ now }: { now: number }) {
  const startedAt = useSession((state) => state.startedAt);
  const budgets = useSession((state) => state.budgets);
  const condition = useSession((state) => state.condition);
  const colorVision = useSession((state) => state.colorVision);
  const darkMode = useSession((state) => state.darkMode);
  const motion = resolveTheme(condition, colorVision, darkMode).motion;

  const ratio =
    startedAt === null ? 1 : Math.max(0, Math.min(1, (budgets.capMs - (now - startedAt)) / budgets.capMs));
  const seconds = Math.ceil(ratio * (budgets.capMs / 1000));

  if (motion === "none") {
    const filled = ratio === 0 ? 0 : Math.ceil(ratio * 4);
    return (
      <div className="pips" aria-label={`${seconds} seconds remaining`}>
        {[0, 1, 2, 3].map((index) => (
          <span key={index} className={index < filled ? "pip on" : "pip"} />
        ))}
      </div>
    );
  }

  const scale = 0.38 + ratio * 0.62;
  return (
    <div className="sun" style={{ "--sun-scale": String(scale) } as CSSProperties} aria-label={`${seconds} seconds remaining`} />
  );
}
