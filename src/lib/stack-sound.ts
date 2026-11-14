import { getStackOffset, getStackSpringTimeline } from "@/lib/motion/stack";
import type { SynthLayer, SynthRecipe } from "@/lib/synth-recipes";

/**
 * Sound for the receipt stack, built from the motion it accompanies.
 *
 * A flip is layered like foley, each layer timed off the STACK_SPRING timeline:
 *  - crack: a real paper transient the instant the card leaves,
 *  - slide: sustained real paper that holds while the card travels and thins out as it slows,
 *  - air:   filtered noise whose swell follows the card's speed (peaks at the spring's top speed),
 *  - land:  a soft paper pat plus a little body as the card arrives on the pile.
 * Paper material comes from the rustle recording (exact-PCM compact sound).
 * Direction comes from the slot the incoming card travels from (pan + pitch), and a drag
 * flick's release speed scales intensity. Grab and settle reuse the same layers for drags.
 */

export type StackSoundEvent =
  | {
      kind: "flip";
      direction: "forward" | "backward";
      intensity?: number;
      /**
       * A drag flick: the card is thrown toward `pan` (-1 left, 1 right) and arrives behind the
       * stack at `landsAt` seconds, so the slide holds through its flight and the pat lands then.
       */
      throw?: { landsAt: number; pan: number };
    }
  /** Drag confirmed: the card is picked up. */
  | { kind: "grab" }
  /** Drag released without a flip: the card drops back onto the pile. */
  | { kind: "settle" };

const SOURCE = "paperRustle";

/**
 * Sharp transients in the rustle recording (seconds), with gains that level them to ~-28dB.
 * Each starts exactly on its transient, so the sound begins with the gesture.
 */
const CRACK_SLICES = [
  { from: 1.71, gain: 0.42 },
  { from: 3.476, gain: 1.35 },
  { from: 4.878, gain: 2.0 },
  { from: 6.04, gain: 0.46 },
] as const;
/** Steady stretches of paper movement (~240ms at ~-36dB): the sheet sliding across the pile. */
const SLIDE_SLICES = [
  { from: 0.4, gain: 1.25 },
  { from: 0.52, gain: 1.25 },
  { from: 3.5, gain: 1.4 },
  { from: 4.9, gain: 1.4 },
] as const;
/** A short double crinkle that dies within ~100ms: paper landing on paper. */
const LAND_SLICE = { from: 6.252, gain: 0.55 };
/** The soft start of the first gesture: fingers taking hold of the sheet. */
const GRAB_SLICE = { from: 0.376, gain: 1.2 };

/** Overall level, in line with the other UI sounds (click/rustle sit at 0.15). */
const STACK_GAIN = 0.16;
/** Back-slot x offset (px) that maps to a full ±1 pan; keeps the image subtle. */
const PAN_WIDTH_PX = 220;

/** Picks from a pool, never the same entry twice in a row: repeated flips shouldn't machine-gun. */
function roundRobin<T>(pool: readonly T[]) {
  let last = -1;
  return (random: () => number) => {
    let index = Math.floor(random() * pool.length) % pool.length;
    if (index === last) index = (index + 1) % pool.length;
    last = index;
    return pool[index];
  };
}
const pickCrack = roundRobin(CRACK_SLICES);
const pickSlide = roundRobin(SLIDE_SLICES);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function landLayers(at: number, level: number, pan: number): SynthLayer[] {
  return [
    {
      kind: "sample",
      sample: SOURCE,
      from: LAND_SLICE.from,
      offset: at,
      envelope: { kind: "attackRelease", attack: 0.003, release: 0.11, peak: LAND_SLICE.gain * level },
      // Muffled: the sheet lands flat, there's no crisp edge to it.
      filter: { type: "lowpass", frequency: { initial: 2600, glideTo: 1400 }, q: 0.5 },
      playbackRate: { min: 0.86, max: 0.94 },
      pan: { initial: pan },
    },
    {
      kind: "tone",
      offset: at,
      envelope: { kind: "attackRelease", attack: 0.004, release: 0.07, peak: 0.12 * level },
      frequency: { initial: 150, glideTo: 85 },
      pan: { initial: pan },
    },
  ];
}

export function stackSoundRecipe(
  event: StackSoundEvent,
  random: () => number = Math.random,
): SynthRecipe {
  const timeline = getStackSpringTimeline();

  if (event.kind === "grab") {
    return {
      duration: 0.2,
      startDelay: 0,
      masterGain: STACK_GAIN,
      noiseSources: [],
      layers: [
        {
          kind: "sample",
          sample: SOURCE,
          from: GRAB_SLICE.from,
          offset: 0,
          envelope: { kind: "attackRelease", attack: 0.004, release: 0.09, peak: GRAB_SLICE.gain * 0.6 },
          filter: { type: "highpass", frequency: { initial: 1200 }, q: 0.6 },
          playbackRate: { min: 1.02, max: 1.1 },
        },
      ],
    };
  }

  if (event.kind === "settle") {
    // Snapping back is the same spring, so it lands at the same moment.
    return {
      duration: timeline.landedAt + 0.25,
      startDelay: 0,
      masterGain: STACK_GAIN,
      noiseSources: [],
      layers: landLayers(timeline.landedAt * 0.8, 0.7, 0),
    };
  }

  const intensity = clamp(event.intensity ?? 1, 0.6, 1.5);
  const forward = event.direction === "forward";
  // The incoming card travels from its back slot (position 1 forward, 2 backward) to center.
  const fromPan = clamp(getStackOffset(forward ? 1 : 2).x / PAN_WIDTH_PX, -1, 1);
  const crack = pickCrack(random);
  const slide = pickSlide(random);
  // A thrown card's flight is longer than a flip: the slide and air follow it out and back, it
  // lands when it arrives behind the pile, and the release is heard on the side it was thrown.
  const releasePan = event.throw ? clamp(event.throw.pan, -1, 1) * 0.6 : fromPan;
  const landedAt = event.throw ? Math.max(event.throw.landsAt, timeline.landedAt) : timeline.landedAt;
  const peakSpeedAt = event.throw ? Math.min(timeline.peakSpeedAt, landedAt / 3) : timeline.peakSpeedAt;
  const rate = forward ? { min: 1.0, max: 1.06 } : { min: 0.92, max: 0.98 };
  const slidePeak = slide.gain * intensity;

  return {
    duration: landedAt + 0.3,
    startDelay: 0,
    masterGain: STACK_GAIN,
    noiseSources: [{ id: "air", duration: landedAt + 0.05, smoothing: 0.55 }],
    layers: [
      {
        kind: "sample",
        sample: SOURCE,
        from: crack.from,
        offset: 0,
        envelope: { kind: "attackRelease", attack: 0.002, release: 0.05, peak: crack.gain * intensity },
        filter: { type: "highpass", frequency: { initial: 900 }, q: 0.5 },
        playbackRate: rate,
        pan: { initial: releasePan },
      },
      {
        kind: "sample",
        sample: SOURCE,
        from: slide.from,
        offset: 0,
        // Fades in under the crack, holds through the card's fastest travel, thins as it slows,
        // and hands off to the landing pat.
        envelope: {
          kind: "points",
          points: [
            { offset: 0, value: 0.0001, curve: "set" },
            { offset: 0.012, value: slidePeak, curve: "linear" },
            { offset: peakSpeedAt, value: slidePeak, curve: "linear" },
            { offset: landedAt, value: slidePeak * 0.35, curve: "exponential" },
            { offset: landedAt + 0.06, value: 0.0001, curve: "exponential" },
          ],
        },
        // Thinner as it slows down.
        filter: { type: "highpass", frequency: { initial: 400, glideTo: 1100 }, q: 0.5 },
        playbackRate: rate,
        pan: { initial: releasePan, glideTo: fromPan * 0.2 },
      },
      {
        kind: "noise",
        source: "air",
        offset: 0,
        // Swells with the card's speed: peak at the spring's top speed, gone by landing.
        envelope: {
          kind: "attackRelease",
          attack: peakSpeedAt,
          release: landedAt - peakSpeedAt,
          peak: 0.16 * intensity * intensity,
        },
        filter: {
          type: "bandpass",
          frequency: forward
            ? { initial: 2200 * intensity, glideTo: 750 }
            : { initial: 1500 * intensity, glideTo: 600 },
          q: 0.9,
        },
        pan: { initial: releasePan, glideTo: 0 },
      },
      ...landLayers(landedAt, 0.75 + 0.25 * intensity, fromPan * 0.15),
    ],
  };
}

/** Map a drag release speed (px/s) to flip intensity: a lazy flick is soft, a hard one snappy. */
export function flickIntensity(speedPxPerSecond: number) {
  return clamp(0.7 + speedPxPerSecond / 2500, 0.7, 1.4);
}
