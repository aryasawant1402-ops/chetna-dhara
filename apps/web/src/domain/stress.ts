export interface PointerSample {
  t: number;
  x: number;
  y: number;
  phase: "down" | "move";
}

export type StressReason = "tap_rate" | "repeat_hits" | "drag_velocity";

export interface StressReading {
  stressed: boolean;
  reason: StressReason | null;
  tapRate: number;
  dragVelocity: number;
  repeatHits: number;
}

export const TAP_WINDOW_MS = 2000;
export const TAP_COUNT = 8;
export const REPEAT_WINDOW_MS = 1500;
export const REPEAT_COUNT = 5;
export const REPEAT_RADIUS_PX = 56;
export const DRAG_PX_PER_MS = 4;
export const DRAG_SAMPLES = 3;

export function assessStress(samples: PointerSample[], now: number): StressReading {
  const recent = samples.filter((sample) => {
    const age = now - sample.t;
    return age >= 0 && age <= TAP_WINDOW_MS;
  });
  const downs = recent.filter((sample) => sample.phase === "down");
  const tapRate = downs.length / (TAP_WINDOW_MS / 1000);
  const repeatSlice = downs.filter((sample) => now - sample.t <= REPEAT_WINDOW_MS);
  const anchor = repeatSlice[repeatSlice.length - 1];
  const repeatHits = anchor
    ? repeatSlice.filter(
        (sample) => Math.hypot(sample.x - anchor.x, sample.y - anchor.y) <= REPEAT_RADIUS_PX,
      ).length
    : 0;

  const moves = recent.filter((sample) => sample.phase === "move");
  let dragVelocity = 0;
  let fastSegments = 0;
  for (let index = 1; index < moves.length; index += 1) {
    const dt = moves[index].t - moves[index - 1].t;
    if (dt <= 0) continue;
    const speed =
      Math.hypot(moves[index].x - moves[index - 1].x, moves[index].y - moves[index - 1].y) / dt;
    dragVelocity = Math.max(dragVelocity, speed);
    if (speed >= DRAG_PX_PER_MS) fastSegments += 1;
  }

  let reason: StressReason | null = null;
  if (downs.length >= TAP_COUNT) reason = "tap_rate";
  else if (repeatHits >= REPEAT_COUNT) reason = "repeat_hits";
  else if (fastSegments >= DRAG_SAMPLES) reason = "drag_velocity";

  return {
    stressed: reason !== null,
    reason,
    tapRate,
    dragVelocity,
    repeatHits,
  };
}
