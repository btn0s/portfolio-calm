import { getAudioContext } from "@/lib/audio-context";
import { loadCompactBuffer } from "@/lib/synth-audio";
import { PAPER_PROFILES, STACK_GAIN, type Paper } from "@/lib/stack-sound";

/**
 * The sound of a sheet being dragged over the pile, live: it only sounds while the card moves,
 * and follows its speed every frame. Fast is loud and bright, slow is a soft hiss, still is silent.
 *
 * Granular: short overlapping grains read from random points in the steady stretches of the paper
 * recording, so the texture never repeats, over a band of filtered noise for the hiss. Grains are
 * scheduled ahead on the audio clock (a timer tops up a short lookahead), so the main thread only
 * sets targets. Each paper (PAPER_PROFILES) colours pitch, brightness, crinkle and hiss.
 */

/** Steady paper movement in the rustle recording (seconds): the friction texture. */
const FRICTION_REGIONS = [
  [0.4, 0.76],
  [3.5, 3.74],
  [4.9, 5.14],
] as const;
/** Sharp transients (seconds): occasional crinkles, more of them on crisp paper. */
const CRINKLES = [1.71, 3.476, 4.878, 6.04] as const;

const GRAIN_SECONDS = 0.07;
const GRAIN_SPACING_SECONDS = 0.035;
const LOOKAHEAD_SECONDS = 0.1;
const SCHEDULER_MS = 25;
/** Speed (px/s) under which the card is effectively still, and the speed of full intensity. */
const SILENT_BELOW = 40;
const FULL_SPEED = 1600;
const PAN_WIDTH_PX = 220;

export interface PaperFriction {
  /** The card's current speed (px/s) and horizontal offset (px); call every frame. */
  update(speed: number, x: number): void;
  /** Fade out and release everything. */
  stop(): void;
}

const NOOP: PaperFriction = { update() {}, stop() {} };
const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

function noiseBuffer(audioContext: BaseAudioContext) {
  let buffer = noiseBuffers.get(audioContext);
  if (!buffer) {
    buffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(audioContext, buffer);
  }
  return buffer;
}

export function startPaperFriction(paper: Paper): PaperFriction {
  const audioContext = getAudioContext();
  if (!audioContext) return NOOP;
  const profile = PAPER_PROFILES[paper];
  let intensity = 0;
  let nextGrainAt = 0;
  let recording: AudioBuffer | null = null;

  const output = audioContext.createGain();
  output.gain.value = STACK_GAIN;
  const panner = audioContext.createStereoPanner();
  output.connect(panner).connect(audioContext.destination);

  // Hiss: looping noise through a band that rises with speed.
  const noise = audioContext.createBufferSource();
  noise.buffer = noiseBuffer(audioContext);
  noise.loop = true;
  const band = audioContext.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 0.8;
  band.frequency.value = 700 * profile.brightness;
  const hiss = audioContext.createGain();
  hiss.gain.value = 0;
  noise.connect(band).connect(hiss).connect(output);
  noise.start();

  void loadCompactBuffer(audioContext, "paperRustle").then((buffer) => {
    recording = buffer;
  });

  const playGrain = (at: number, from: number, seconds: number, peak: number, rate: number, highpassHz: number) => {
    if (!recording) return;
    const source = audioContext.createBufferSource();
    source.buffer = recording;
    source.playbackRate.value = rate;
    const highpass = audioContext.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = highpassHz;
    const envelope = audioContext.createGain();
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(peak, at + seconds * 0.35);
    envelope.gain.linearRampToValueAtTime(0, at + seconds);
    source.connect(highpass).connect(envelope).connect(output);
    source.start(at, from, seconds * rate + 0.01);
    source.onended = () => {
      source.disconnect();
      highpass.disconnect();
      envelope.disconnect();
    };
  };

  const schedule = () => {
    const now = audioContext.currentTime;
    if (nextGrainAt < now) nextGrainAt = now;
    while (nextGrainAt < now + LOOKAHEAD_SECONDS) {
      if (intensity > 0.02) {
        const [start, end] = FRICTION_REGIONS[Math.floor(Math.random() * FRICTION_REGIONS.length)];
        const from = start + Math.random() * (end - start - GRAIN_SECONDS);
        const rate = profile.rate * (0.85 + 0.3 * intensity) * (0.94 + Math.random() * 0.12);
        playGrain(nextGrainAt, from, GRAIN_SECONDS, 1.3 * profile.slide * intensity, rate, (300 + 900 * intensity) * profile.brightness);
        // Crisp paper crinkles as it moves; heavy stock barely does.
        if (Math.random() < 0.06 * profile.crackle * intensity) {
          const crinkle = CRINKLES[Math.floor(Math.random() * CRINKLES.length)];
          playGrain(nextGrainAt, crinkle, 0.03, 0.5 * profile.crackle * intensity, profile.rate, 1200 * profile.brightness);
        }
      }
      nextGrainAt += GRAIN_SPACING_SECONDS * (0.8 + Math.random() * 0.4);
    }
  };
  const timer = window.setInterval(schedule, SCHEDULER_MS);

  let stopped = false;
  return {
    update(speed, x) {
      if (stopped) return;
      const target = Math.min(1.2, Math.max(0, (speed - SILENT_BELOW) / FULL_SPEED));
      // Quick to respond, but not frame-jittery.
      intensity += (target - intensity) * 0.35;
      const now = audioContext.currentTime;
      hiss.gain.setTargetAtTime(0.12 * profile.hiss * intensity ** 1.5, now, 0.03);
      band.frequency.setTargetAtTime((700 + 2600 * intensity) * profile.brightness, now, 0.04);
      panner.pan.setTargetAtTime(Math.min(1, Math.max(-1, x / PAN_WIDTH_PX)) * 0.6, now, 0.05);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      intensity = 0;
      window.clearInterval(timer);
      output.gain.setTargetAtTime(0, audioContext.currentTime, 0.02);
      window.setTimeout(() => {
        noise.stop();
        noise.disconnect();
        band.disconnect();
        hiss.disconnect();
        output.disconnect();
        panner.disconnect();
      }, 250);
    },
  };
}
