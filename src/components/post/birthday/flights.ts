// The finale flight's speed curve as it was at each step of the back-and-forth, ported from
// those commits (ab35eda, 302e8cd, 7edb145, 2ecebf2, d7b63c0), and today's from the real module.
import { speed as final, START as FINAL_START, STOP as FINAL_STOP } from './curve';

const ease = (k: number) => k * k * (3 - 2 * k);
const clamp01 = (k: number) => Math.min(1, Math.max(0, k));

export type Flight = {
  sha: string;
  name: string;
  /** What the feedback was on this version (the user's words). */
  heard: string;
  /** What we changed in response. */
  did: string;
  start: number;
  stop: number;
  speed: (t: number) => number;
};

const linear = (knots: [number, number][], shape = (k: number) => k) => (t: number) => {
  if (t <= knots[0][0]) return knots[0][1];
  for (let i = 0; i < knots.length - 1; i++) {
    const [t0, v0] = knots[i];
    const [t1, v1] = knots[i + 1];
    if (t <= t1) return v0 + (v1 - v0) * shape((t - t0) / (t1 - t0));
  }
  return 0;
};

const BEATS = [17.34, 17.85, 18.34, 18.85, 19.36, 19.85, 20.33, 20.82, 21.31, 21.68, 21.82, 22.05, 22.19, 22.42, 22.54, 22.77];
const LEVELS: [number, number][] = [
  [17, 1.5],
  [17.34, 7],
  [18.34, 10],
  [19.36, 13],
  [19.85, 17],
  [20.82, 19],
  [21.31, 17],
  [22.05, 15],
];
function pulse(t: number) {
  let last = -1;
  for (const b of BEATS) if (b <= t) last = b;
  if (last < 0) return 0;
  const p = t - last;
  return p < 0.04 ? p / 0.04 : Math.exp(-(p - 0.04) / 0.13);
}

export const FLIGHTS: Flight[] = [
  {
    sha: 'ab35eda',
    name: 'Robotic',
    heard: 'still feel the linear easing',
    did: 'Speed set at a few moments with straight lines between them. Every corner in the curve is a jolt you can feel, which reads as robotic.',
    start: 17,
    stop: 22.4,
    speed: linear([
      [17, 4],
      [17.7, 13],
      [19.3, 15],
      [21.2, 7],
      [22.4, 0],
    ]),
  },
  {
    sha: '2ecebf2',
    name: 'Stuttery',
    heard: 'no no now it just feels like stuttery and weird … add enough props and space to travel instead of slowing it',
    did: 'Speed steps up on the beats with a surge on each kick. On a phone, each surge read as a dropped frame.',
    start: 17,
    stop: 23,
    speed: (t) => {
      if (t >= 23) return 0;
      let level = LEVELS[0][1];
      for (const [at, v] of LEVELS) if (at <= t) level = v;
      if (t < BEATS[0]) level = 1 + (level - 1) * ease(clamp01((t - 17) / (BEATS[0] - 17)));
      const settle = t < 22.6 ? 1 : (1 - (t - 22.6) / 0.4) ** 2;
      return level * (0.55 + 0.9 * pulse(t)) * settle;
    },
  },
  {
    sha: 'today',
    name: 'More space',
    heard: 'you lengthen the fly by adding more SPACE not faking it with time delays',
    did: 'Takes off the instant the finale starts (0:18.40), quick launch, never lets up, brakes only for the landing. A long flight comes from more distance, not more time.',
    start: FINAL_START,
    stop: FINAL_STOP,
    speed: final,
  },
];

/** Distance covered by second `t`, by trapezoids every 5ms. */
export function distance(f: Flight, t: number) {
  let d = 0;
  const end = Math.min(t, f.stop);
  for (let s = f.start; s < end; s += 0.005) d += ((f.speed(s) + f.speed(Math.min(end, s + 0.005))) / 2) * Math.min(0.005, end - s);
  return d;
}
