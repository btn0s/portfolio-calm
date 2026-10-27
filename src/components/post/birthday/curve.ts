// The finale flight's speed over the song, and the distance it covers: its own module so the
// behind-the-scenes page can chart the real curve.
import { FINALE_IN, FINALE_OPEN } from './music';

// One long run that never lets up: we take off the moment the finale cuts in, build speed down
// the tunnel and on through a long field, and only at the very end land on the column, right
// on the hit. The field is long in distance, not time: we cover it at full speed.
export const START = FINALE_IN;
export const STOP = 23;
/** Finale second the tunnel unzips into the field. */
export const TUNNEL_END = FINALE_OPEN;
/** Finale second we touch down: a short, hard landing onto the column. */
export const LAND = 22.45;
/** How long the take-off takes to get up to speed. */
export const LAUNCH = 0.6;
export const LAUNCH_TOP = 14;
export const TUNNEL_TOP = 24;
export const FIELD_TOP = 32;

export const ease = (k: number) => k * k * (3 - 2 * k);
export const clamp01 = (k: number) => Math.min(1, Math.max(0, k));

export function speed(t: number) {
  if (t <= START) return 1;
  if (t <= START + LAUNCH) return 1 + (LAUNCH_TOP - 1) * ease((t - START) / LAUNCH);
  if (t <= TUNNEL_END) return LAUNCH_TOP + (TUNNEL_TOP - LAUNCH_TOP) * ease((t - START - LAUNCH) / (TUNNEL_END - START - LAUNCH));
  if (t <= LAND) return TUNNEL_TOP + (FIELD_TOP - TUNNEL_TOP) * ease((t - TUNNEL_END) / (LAND - TUNNEL_END));
  if (t >= STOP) return 0;
  return FIELD_TOP * (1 - (t - LAND) / (STOP - LAND)) ** 3;
}

// Distance travelled, tabulated every 5ms from the speeds.
export const TUNNEL_Y = 0.6;
export const STEP = 0.005;
export function table(speed: (t: number) => number) {
  const out = [0];
  for (let t = START; t < STOP; t += STEP) out.push(out[out.length - 1] + ((speed(t) + speed(t + STEP)) / 2) * STEP);
  return (t: number) => {
    const i = (Math.min(Math.max(t, START), STOP) - START) / STEP;
    const a = Math.floor(i);
    const b = Math.min(a + 1, out.length - 1);
    return out[a] + (out[b] - out[a]) * (i - a);
  };
}
export const travelled = table(speed);
export const TOTAL = travelled(STOP);
/** How far we fly once out of the tunnel. */
export const FIELD = TOTAL - travelled(TUNNEL_END);
/** Distance into the field at finale second `t` (negative while still in the tunnel). */
export const into = (t: number) => travelled(t) - travelled(TUNNEL_END);
