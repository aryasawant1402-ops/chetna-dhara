import type { ColorVision, ConditionId } from "./types";

export interface ThemeTokens {
  bg: string;
  ink: string;
  muted: string;
  accent: string;
  accentInk: string;
  surface: string;
  target: number;
  font: string;
  motion: "calm" | "none";
  leading: number;
  tracking: string;
  clutter: "minimal" | "static" | "reading" | "single";
}

const lexend = '"Lexend", sans-serif';
const dyslexic = '"OpenDyslexic", "Lexend", sans-serif';

const conditions: Record<ConditionId, ThemeTokens> = {
  adhd: {
    bg: "#F3F0E8",
    ink: "#243036",
    muted: "#5C6B73",
    accent: "#E09A2B",
    accentInk: "#2A2112",
    surface: "#FFFDF8",
    target: 76,
    font: lexend,
    motion: "calm",
    leading: 1.45,
    tracking: "0",
    clutter: "minimal",
  },
  asd: {
    bg: "#E4EEE8",
    ink: "#24343A",
    muted: "#4E636B",
    accent: "#6E8CA8",
    accentInk: "#F4F7F8",
    surface: "#F3F7F5",
    target: 84,
    font: lexend,
    motion: "none",
    leading: 1.5,
    tracking: "0",
    clutter: "static",
  },
  dyslexia: {
    bg: "#FDF6E3",
    ink: "#3B2F1E",
    muted: "#6A5640",
    accent: "#C46B3A",
    accentInk: "#FFF8EE",
    surface: "#FFF9EE",
    target: 76,
    font: dyslexic,
    motion: "calm",
    leading: 1.85,
    tracking: "0.04em",
    clutter: "reading",
  },
  dyspraxia: {
    bg: "#F7F1E8",
    ink: "#2C241C",
    muted: "#6B5A48",
    accent: "#3F6F62",
    accentInk: "#F4FBF8",
    surface: "#FFFCF7",
    target: 104,
    font: lexend,
    motion: "calm",
    leading: 1.5,
    tracking: "0",
    clutter: "single",
  },
  idd: {
    bg: "#F6F3EE",
    ink: "#2A2724",
    muted: "#5E5852",
    accent: "#C47B4A",
    accentInk: "#FFF8F2",
    surface: "#FFFCF8",
    target: 112,
    font: lexend,
    motion: "calm",
    leading: 1.5,
    tracking: "0",
    clutter: "single",
  },
};

const darkAccents: Record<ConditionId, string> = {
  adhd: "#E0B15A",
  asd: "#8AA4B8",
  dyslexia: "#E0A07A",
  dyspraxia: "#8FB8AA",
  idd: "#E0B08A",
};

const visionAccents: Record<Exclude<ColorVision, "typical">, { accent: string; accentInk: string }> = {
  protanopia: { accent: "#0072B2", accentInk: "#F5FBFF" },
  deuteranopia: { accent: "#0072B2", accentInk: "#F5FBFF" },
  tritanopia: { accent: "#D55E00", accentInk: "#FFF7F2" },
};

export function resolveTheme(
  condition: ConditionId,
  vision: ColorVision,
  darkMode: boolean,
): ThemeTokens {
  const base = { ...conditions[condition] };
  if (vision !== "typical") {
    base.accent = visionAccents[vision].accent;
    base.accentInk = visionAccents[vision].accentInk;
  }
  if (darkMode) {
    base.bg = "#16191C";
    base.ink = "#E6E0D6";
    base.muted = "#C5BDB2";
    base.surface = "#22272B";
    if (vision === "typical") {
      base.accent = darkAccents[condition];
      base.accentInk = "#1A140C";
    }
  }
  return base;
}

export function themeToStyle(theme: ThemeTokens): Record<string, string> {
  return {
    "--bg": theme.bg,
    "--ink": theme.ink,
    "--muted": theme.muted,
    "--accent": theme.accent,
    "--accent-ink": theme.accentInk,
    "--surface": theme.surface,
    "--target": `${theme.target}px`,
    "--font": theme.font,
    "--leading": String(theme.leading),
    "--tracking": theme.tracking,
  };
}
