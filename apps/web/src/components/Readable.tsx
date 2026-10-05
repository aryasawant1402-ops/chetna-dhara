import type { ReactNode } from "react";
import { useSession } from "../state/sessionStore";

export function Readable({ text }: { text: string }) {
  const dyslexia = useSession((state) => state.condition === "dyslexia");
  if (!dyslexia) return text;
  const parts = text.split(/(\s+)/);
  return (
    <span className="reading-line">
      {parts.map((part, index) => {
        if (!part.trim()) return <span key={index}>{part}</span>;
        const cut = Math.ceil(part.length / 2);
        return (
          <span key={index}>
            <strong>{part.slice(0, cut)}</strong>
            {part.slice(cut)}
          </span>
        );
      })}
    </span>
  );
}

export function ReadableBlock({ text }: { text: string }) {
  return (
    <p>
      <Readable text={text} />
    </p>
  );
}

export function IconBegin() {
  return (
    <svg className="pictogram-svg" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="18" />
      <path d="M28 22l16 10-16 10z" />
    </svg>
  );
}

export function StageAnnounce({ children }: { children: ReactNode }) {
  return (
    <p className="sr-only" aria-live="polite">
      {children}
    </p>
  );
}
