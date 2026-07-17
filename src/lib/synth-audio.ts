import {
  SYNTH_RECIPES,
  assertSynthRecipe,
  type SynthAutomation,
  type SynthAutomationCurve,
  type SynthEnvelope,
  type SynthNoiseSource,
  type SynthRecipe,
  type SynthSoundName,
  type SynthValue,
} from "@/lib/synth-recipes";
import {
  COMPACT_SOUND_NAMES,
  compactMetadata,
  isCompactSound,
  prepareCompactPcm,
  type CompactSoundName,
} from "@/lib/compact-spectral-synth";
import { getAudioContext } from "@/lib/audio-context";

export type { SynthSoundName } from "@/lib/synth-recipes";

const DEFAULT_SEED = 1729;
const DEFAULT_SAMPLE_RATE = 48_000;
const MIN_EXPONENTIAL_VALUE = 0.0001;

const compactBuffers = new WeakMap<
  BaseAudioContext,
  Map<CompactSoundName, AudioBuffer>
>();
const activeCompactSources = new WeakMap<
  BaseAudioContext,
  Map<CompactSoundName, AudioBufferSourceNode[]>
>();
const MAX_COMPACT_POLYPHONY = 3;

export function registerCompactSource(
  audioContext: BaseAudioContext,
  name: CompactSoundName,
  source: AudioBufferSourceNode,
) {
  let sourcesByName = activeCompactSources.get(audioContext);
  if (!sourcesByName) {
    sourcesByName = new Map();
    activeCompactSources.set(audioContext, sourcesByName);
  }
  let sources = sourcesByName.get(name);
  if (!sources) {
    sources = [];
    sourcesByName.set(name, sources);
  }

  while (sources.length >= MAX_COMPACT_POLYPHONY) {
    const oldest = sources.shift();
    try {
      oldest?.stop();
    } catch {
      oldest?.disconnect();
    }
  }
  sources.push(source);

  return () => {
    const index = sources.indexOf(source);
    if (index >= 0) sources.splice(index, 1);
    if (sources.length === 0) sourcesByName.delete(name);
  };
}

export function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    // Keep this byte-for-byte equivalent to scripts/audio-fit/renderer.mjs so
    // an optimized noise recipe uses the same carrier in the browser.
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function resolveSynthValue(value: SynthValue, random: () => number) {
  if (typeof value === "number") return value;
  return value.min + (value.max - value.min) * random();
}

function schedulePoint(
  parameter: AudioParam,
  time: number,
  value: number,
  curve: SynthAutomationCurve,
) {
  if (curve === "set") {
    parameter.setValueAtTime(value, time);
  } else if (curve === "linear") {
    parameter.linearRampToValueAtTime(value, time);
  } else {
    parameter.exponentialRampToValueAtTime(
      Math.max(MIN_EXPONENTIAL_VALUE, value),
      time,
    );
  }
}

function scheduleEnvelope(
  parameter: AudioParam,
  start: number,
  envelope: SynthEnvelope,
  random: () => number,
) {
  if (envelope.kind === "attackRelease") {
    const attack = resolveSynthValue(envelope.attack, random);
    const release = resolveSynthValue(envelope.release, random);
    const peak = resolveSynthValue(envelope.peak, random);
    const floor = envelope.floor ?? MIN_EXPONENTIAL_VALUE;

    parameter.setValueAtTime(floor, start);
    parameter.exponentialRampToValueAtTime(
      Math.max(MIN_EXPONENTIAL_VALUE, peak),
      start + attack,
    );
    parameter.exponentialRampToValueAtTime(floor, start + attack + release);
    return attack + release;
  }

  let duration = 0;
  for (const point of envelope.points) {
    const offset = resolveSynthValue(point.offset, random);
    const value = resolveSynthValue(point.value, random);
    schedulePoint(parameter, start + offset, value, point.curve);
    duration = Math.max(duration, offset);
  }
  return duration;
}

function scheduleAutomation(
  parameter: AudioParam,
  start: number,
  automation: SynthAutomation,
  envelopeDuration: number,
  random: () => number,
) {
  parameter.setValueAtTime(resolveSynthValue(automation.initial, random), start);

  if (automation.glideTo !== undefined) {
    parameter.exponentialRampToValueAtTime(
      Math.max(
        MIN_EXPONENTIAL_VALUE,
        resolveSynthValue(automation.glideTo, random),
      ),
      start + envelopeDuration,
    );
    return;
  }

  for (const point of automation.points ?? []) {
    const offset = resolveSynthValue(point.offset, random);
    const value = resolveSynthValue(point.value, random);
    schedulePoint(parameter, start + offset, value, point.curve);
  }
}

function createNoiseBuffer(
  audioContext: BaseAudioContext,
  source: SynthNoiseSource,
  random: () => number,
) {
  const length = Math.ceil(audioContext.sampleRate * source.duration);
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const channel = buffer.getChannelData(0);
  let previous = 0;

  for (let index = 0; index < length; index += 1) {
    const white = random() * 2 - 1;
    previous = previous * source.smoothing + white * (1 - source.smoothing);
    channel[index] = previous;
  }

  return buffer;
}

function renderRecipe(
  audioContext: BaseAudioContext,
  destination: AudioNode,
  recipe: SynthRecipe,
  random: () => number,
) {
  const start = audioContext.currentTime + recipe.startDelay;
  const master = audioContext.createGain();
  master.gain.value = resolveSynthValue(recipe.masterGain, random);
  master.connect(destination);

  const sourceRecipes = new Map(
    recipe.noiseSources.map((source) => [source.id, source]),
  );
  const buffers = new Map<string, AudioBuffer>();
  const getBuffer = (id: string) => {
    const existing = buffers.get(id);
    if (existing) return existing;

    const source = sourceRecipes.get(id);
    if (!source) {
      throw new TypeError(`Unknown noise source: ${id}`);
    }
    const buffer = createNoiseBuffer(audioContext, source, random);
    buffers.set(id, buffer);
    return buffer;
  };

  for (const source of recipe.noiseSources) {
    if (source.eager) getBuffer(source.id);
  }

  for (const layer of recipe.layers) {
    const layerStart = start + resolveSynthValue(layer.offset, random);
    const stopTail = layer.stopTail ?? 0.03;

    if (layer.kind === "tone") {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const envelopeDuration = scheduleEnvelope(
        gain.gain,
        layerStart,
        layer.envelope,
        random,
      );

      oscillator.type = layer.oscillator ?? "sine";
      scheduleAutomation(
        oscillator.frequency,
        layerStart,
        layer.frequency,
        envelopeDuration,
        random,
      );
      oscillator.connect(gain).connect(master);
      oscillator.start(layerStart);
      oscillator.stop(layerStart + envelopeDuration + stopTail);
      continue;
    }

    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    source.buffer = getBuffer(layer.source);
    const envelopeDuration = scheduleEnvelope(
      gain.gain,
      layerStart,
      layer.envelope,
      random,
    );

    filter.type = layer.filter.type;
    scheduleAutomation(
      filter.frequency,
      layerStart,
      layer.filter.frequency,
      envelopeDuration,
      random,
    );
    filter.Q.value = resolveSynthValue(layer.filter.q, random);
    source.playbackRate.value = resolveSynthValue(
      layer.playbackRate ?? 1,
      random,
    );
    source.connect(filter).connect(gain).connect(master);
    source.start(layerStart);
    source.stop(layerStart + envelopeDuration + stopTail);
  }

  return master;
}

/** Render a validated JSON-shaped candidate into any Web Audio context. */
export function renderSynthRecipe(
  audioContext: BaseAudioContext,
  destination: AudioNode,
  recipe: SynthRecipe,
  random: () => number = Math.random,
) {
  assertSynthRecipe(recipe);
  return renderRecipe(audioContext, destination, recipe, random);
}

export interface SynthPlaybackOptions {
  rate?: number;
  maxMs?: number;
  gain?: number;
}

export interface ResolvedSynthPlaybackOptions {
  playbackRate: number;
  maximumDurationSeconds: number | null;
  gain: number;
}

export function resolveSynthPlaybackOptions(
  options: SynthPlaybackOptions = {},
): ResolvedSynthPlaybackOptions {
  return {
    playbackRate:
      typeof options.rate === "number"
      && Number.isFinite(options.rate)
      && options.rate > 0
        ? options.rate
        : 1,
    maximumDurationSeconds:
      typeof options.maxMs === "number"
      && Number.isFinite(options.maxMs)
      && options.maxMs > 0
        ? options.maxMs / 1_000
        : null,
    gain:
      typeof options.gain === "number"
      && Number.isFinite(options.gain)
      && options.gain >= 0
        ? options.gain
        : 1,
  };
}

export function scheduleCompactPlayback(
  source: AudioBufferSourceNode,
  gain: GainNode,
  options: ResolvedSynthPlaybackOptions,
  currentTime: number,
) {
  source.playbackRate.value = options.playbackRate;
  gain.gain.value = options.gain;
  source.start();
  if (options.maximumDurationSeconds !== null) {
    source.stop(currentTime + options.maximumDurationSeconds);
  }
}

export function playSynth(
  name: SynthSoundName,
  options: SynthPlaybackOptions = {},
) {
  const audioContext = getAudioContext();
  if (!audioContext) return Promise.resolve(false);

  const recipe = SYNTH_RECIPES[name];
  const play = () => {
    if (isCompactSound(name)) {
      return playPreparedCompact(audioContext, name, options);
    }
    const resolved = resolveSynthPlaybackOptions(options);
    const output = audioContext.createGain();
    output.gain.value = resolved.gain;
    output.connect(audioContext.destination);
    try {
      const master = renderRecipe(
        audioContext,
        output,
        recipe,
        createSeededRandom(recipe.seed ?? DEFAULT_SEED),
      );
      window.setTimeout(
        () => {
          master.disconnect();
          output.disconnect();
        },
        Math.max(1800, (recipe.duration + 0.1) * 1000),
      );
      return Promise.resolve(true);
    } catch {
      output.disconnect();
      // Audio feedback is progressive enhancement.
      return Promise.resolve(false);
    }
  };

  if (audioContext.state === "running") {
    return play();
  }

  return audioContext.resume().then(play, () => false);
}

function createCompactBuffer(
  audioContext: BaseAudioContext,
  name: CompactSoundName,
  samples: Float32Array,
) {
  let buffers = compactBuffers.get(audioContext);
  if (!buffers) {
    buffers = new Map();
    compactBuffers.set(audioContext, buffers);
  }
  const existing = buffers.get(name);
  if (existing) return existing;
  const { sampleRate } = compactMetadata(name);
  const buffer = audioContext.createBuffer(
    1,
    samples.length,
    sampleRate,
  );
  buffer.getChannelData(0).set(samples);
  buffers.set(name, buffer);
  return buffer;
}

async function playPreparedCompact(
  audioContext: AudioContext,
  name: CompactSoundName,
  options: SynthPlaybackOptions,
) {
  try {
    const resolved = resolveSynthPlaybackOptions(options);
    const samples = await prepareCompactPcm(name);
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    source.buffer = createCompactBuffer(audioContext, name, samples);
    source.connect(gain).connect(audioContext.destination);
    const releaseSource = registerCompactSource(
      audioContext,
      name,
      source,
    );
    source.addEventListener(
      "ended",
      () => {
        releaseSource();
        source.disconnect();
        gain.disconnect();
      },
      { once: true },
    );
    try {
      scheduleCompactPlayback(source, gain, resolved, audioContext.currentTime);
    } catch (error) {
      releaseSource();
      source.disconnect();
      gain.disconnect();
      throw error;
    }
    return true;
  } catch {
    // Audio feedback is progressive enhancement.
    return false;
  }
}

export async function prepareSynthAudio() {
  for (const name of COMPACT_SOUND_NAMES) {
    await prepareCompactPcm(name);
  }
}

export interface OfflineSynthOptions {
  sampleRate?: number;
  seed?: number;
}

export async function renderSynthRecipeOffline(
  recipe: SynthRecipe,
  options: OfflineSynthOptions = {},
) {
  assertSynthRecipe(recipe);
  const sampleRate = options.sampleRate ?? DEFAULT_SAMPLE_RATE;
  const offline = new OfflineAudioContext(
    1,
    Math.ceil(sampleRate * recipe.duration),
    sampleRate,
  );
  renderRecipe(
    offline,
    offline.destination,
    recipe,
    createSeededRandom(options.seed ?? recipe.seed ?? DEFAULT_SEED),
  );
  return offline.startRendering();
}

export async function renderSynthOffline(
  name: SynthSoundName,
  options: OfflineSynthOptions = {},
) {
  if (isCompactSound(name)) {
    const metadata = compactMetadata(name);
    const sampleRate = options.sampleRate ?? metadata.sampleRate;
    if (sampleRate !== metadata.sampleRate) {
      throw new TypeError(
        `${name} model requires ${metadata.sampleRate} Hz output`,
      );
    }
    const samples = await prepareCompactPcm(name);
    const offline = new OfflineAudioContext(1, samples.length, sampleRate);
    return createCompactBuffer(offline, name, samples);
  }
  return renderSynthRecipeOffline(SYNTH_RECIPES[name], options);
}

export function audioBufferToWavDataUrl(buffer: AudioBuffer) {
  const samples = buffer.getChannelData(0);
  const bytes = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(bytes);
  const write = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  write(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples.length * 2, true);

  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    const integer = Math.round(sample < 0 ? sample * 32768 : sample * 32767);
    view.setInt16(
      44 + index * 2,
      integer,
      true,
    );
  }

  const binary = new Uint8Array(bytes);
  let encoded = "";
  for (let index = 0; index < binary.length; index += 1) {
    encoded += String.fromCharCode(binary[index]);
  }
  return `data:audio/wav;base64,${btoa(encoded)}`;
}
