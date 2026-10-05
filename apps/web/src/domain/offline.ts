import type { ConditionId } from "./types";

export interface OfflineQuest {
  title: string;
  steps: string[];
}

export const offlineQuests: Record<ConditionId, OfflineQuest> = {
  asd: {
    title: "Sensory bin",
    steps: [
      "Fill a tray with dry rice or beans.",
      "Hide three familiar objects.",
      "Find them by feel and sort them into a bowl.",
    ],
  },
  idd: {
    title: "Animal walks",
    steps: [
      "Bear-walk to the door.",
      "Crab-walk back.",
      "Stop and name one animal.",
    ],
  },
  dyslexia: {
    title: "Syllable clap",
    steps: [
      "Say a short word out loud.",
      "Clap once for each syllable.",
      "Air-write the first sound.",
    ],
  },
  adhd: {
    title: "Three-step quest",
    steps: [
      "Touch the window.",
      "Bring one blue object.",
      "Balance on one foot for a slow count of five.",
    ],
  },
  dyspraxia: {
    title: "Wall stretch and balance",
    steps: [
      "Press both palms flat on the wall.",
      "Step one foot back and hold.",
      "Walk a straight line, heel then toe.",
    ],
  },
};

export const conditionLabels: Record<ConditionId, string> = {
  asd: "ASD",
  adhd: "ADHD",
  dyslexia: "Dyslexia",
  dyspraxia: "Dyspraxia",
  idd: "IDD",
};
