export const SYNTH_SOUND_NAMES = [
  "ambientArtifacts",
  "ambientGlobal",
  "ambientHome",
  "ambientThoughts",
  "click",
  "clickOriginal",
  "drop",
  "introArtifacts",
  "introHome",
  "introThoughts",
  "paperRustle",
  "partyHorn",
  "swipeBackward",
  "swipeForward",
] as const;

export type SynthSoundName = (typeof SYNTH_SOUND_NAMES)[number];

/** A fixed value or a uniformly sampled range. Both forms survive JSON unchanged. */
export type SynthValue = number | { min: number; max: number };

export type SynthAutomationCurve = "set" | "linear" | "exponential";

export interface SynthAutomationPoint {
  offset: SynthValue;
  value: SynthValue;
  curve: SynthAutomationCurve;
}

/**
 * Starts at `initial`, then either glides to one value at the end of the gain
 * envelope or follows explicit points. This shape maps directly to optimizer JSON.
 */
export interface SynthAutomation {
  initial: SynthValue;
  glideTo?: SynthValue;
  points?: SynthAutomationPoint[];
}

export interface SynthAttackReleaseEnvelope {
  kind: "attackRelease";
  attack: SynthValue;
  release: SynthValue;
  peak: SynthValue;
  floor?: number;
}

export interface SynthPointEnvelope {
  kind: "points";
  points: SynthAutomationPoint[];
}

export type SynthEnvelope =
  | SynthAttackReleaseEnvelope
  | SynthPointEnvelope;

export interface SynthToneLayer {
  kind: "tone";
  offset: SynthValue;
  envelope: SynthEnvelope;
  frequency: SynthAutomation;
  oscillator?: OscillatorType;
  stopTail?: number;
}

export interface SynthFilterRecipe {
  type: BiquadFilterType;
  frequency: SynthAutomation;
  q: SynthValue;
}

export interface SynthNoiseLayer {
  kind: "noise";
  source: string;
  offset: SynthValue;
  envelope: SynthEnvelope;
  filter: SynthFilterRecipe;
  playbackRate?: SynthValue;
  stopTail?: number;
}

export type SynthLayer = SynthToneLayer | SynthNoiseLayer;

export interface SynthNoiseSource {
  id: string;
  duration: number;
  /** Previous-sample contribution; 0 is white noise and values near 1 are smoother. */
  smoothing: number;
  /** Build before any layers, even if unused, to preserve the candidate's random stream. */
  eager?: boolean;
}

export interface SynthRecipe {
  /** Offline render length and live graph cleanup horizon, in seconds. */
  duration: number;
  /** Deterministic carrier seed shared with the inverse fitter. */
  seed?: number;
  /** Small scheduling offset used to avoid clipping the first sample. */
  startDelay: number;
  /** Gain applied after every layer. */
  masterGain: SynthValue;
  noiseSources: SynthNoiseSource[];
  layers: SynthLayer[];
}

function attackRelease(
  attack: SynthValue,
  release: SynthValue,
  peak: SynthValue,
): SynthAttackReleaseEnvelope {
  return { kind: "attackRelease", attack, release, peak };
}

function automation(initial: SynthValue, glideTo?: SynthValue): SynthAutomation {
  return glideTo === undefined ? { initial } : { initial, glideTo };
}

function noiseLayer(options: {
  source?: string;
  offset: SynthValue;
  attack: SynthValue;
  release: SynthValue;
  peak: SynthValue;
  frequency: SynthValue;
  endFrequency?: SynthValue;
  q?: SynthValue;
  type?: BiquadFilterType;
  playbackRate?: SynthValue;
}): SynthNoiseLayer {
  return {
    kind: "noise",
    source: options.source ?? "short",
    offset: options.offset,
    envelope: attackRelease(options.attack, options.release, options.peak),
    filter: {
      type: options.type ?? "bandpass",
      frequency: automation(options.frequency, options.endFrequency),
      q: options.q ?? 0.8,
    },
    ...(options.playbackRate === undefined
      ? {}
      : { playbackRate: options.playbackRate }),
  };
}

function toneLayer(options: {
  offset: SynthValue;
  attack: SynthValue;
  release: SynthValue;
  peak: SynthValue;
  frequency: SynthValue;
  endFrequency?: SynthValue;
  oscillator?: OscillatorType;
}): SynthToneLayer {
  return {
    kind: "tone",
    offset: options.offset,
    envelope: attackRelease(options.attack, options.release, options.peak),
    frequency: automation(options.frequency, options.endFrequency),
    ...(options.oscillator === undefined
      ? {}
      : { oscillator: options.oscillator }),
  };
}

interface FittedNoiseLayer {
  start: number;
  attack: number;
  release: number;
  peak: number;
  frequency: number;
  endFrequency: number;
  q: number;
  type: BiquadFilterType;
}

function fittedNoiseRecipe(
  duration: number,
  masterGain: number,
  seed: number,
  layers: FittedNoiseLayer[],
): SynthRecipe {
  return {
    duration,
    seed,
    startDelay: 0,
    masterGain,
    noiseSources: layers.map((layer, index) => ({
      id: `fit-${seed}-${index + 1}`,
      duration: layer.attack + layer.release,
      smoothing: 0,
      eager: true,
    })),
    layers: layers.map((layer, index) => ({
      ...noiseLayer({
        source: `fit-${seed}-${index + 1}`,
        offset: layer.start,
        attack: layer.attack,
        release: layer.release,
        peak: layer.peak,
        frequency: layer.frequency,
        endFrequency: layer.endFrequency,
        q: layer.q,
        type: layer.type,
      }),
      stopTail: 0,
    })),
  };
}

function silentRecipe(duration = 0.5): SynthRecipe {
  return {
    duration,
    startDelay: 0,
    masterGain: 0,
    noiseSources: [],
    layers: [],
  };
}

/**
 * The complete optimizer input. `JSON.stringify(SYNTH_RECIPES)` produces a
 * standalone candidate with no functions, browser objects, or implicit defaults.
 */
export const SYNTH_RECIPES: Record<SynthSoundName, SynthRecipe> = {
  ambientArtifacts: silentRecipe(),
  ambientGlobal: silentRecipe(),
  ambientHome: silentRecipe(),
  ambientThoughts: silentRecipe(),
  click: fittedNoiseRecipe(0.3657291667, 0.5516695657457408, 1733, [
    {
      start: 0.052,
      attack: 0.0031752604273954424,
      release: 0.19719497213432866,
      peak: 1.1360520480692364,
      frequency: 800,
      endFrequency: 900,
      q: 0.7,
      type: "bandpass",
    },
    {
      start: 0.038,
      attack: 0.008,
      release: 0.1021929852412562,
      peak: 2,
      frequency: 2750,
      endFrequency: 2450,
      q: 0.65,
      type: "bandpass",
    },
    {
      start: 0.038,
      attack: 0.008,
      release: 0.12549122737018906,
      peak: 0.015,
      frequency: 4800,
      endFrequency: 6200,
      q: 0.7,
      type: "highpass",
    },
    {
      start: 0.06929990463546236,
      attack: 0.0035673502831959063,
      release: 0.1462192646287158,
      peak: 0.17014860383535418,
      frequency: 800,
      endFrequency: 900,
      q: 0.7,
      type: "bandpass",
    },
    {
      start: 0.061,
      attack: 0.007,
      release: 0.16468211259644996,
      peak: 0.03,
      frequency: 2750,
      endFrequency: 2450,
      q: 0.65,
      type: "bandpass",
    },
    {
      start: 0.061,
      attack: 0.007,
      release: 0.09370343896891184,
      peak: 0.01884821710640255,
      frequency: 4800,
      endFrequency: 6200,
      q: 0.7,
      type: "highpass",
    },
    {
      start: 0.12942193351747258,
      attack: 0.004224018573681868,
      release: 0.1219764555664014,
      peak: 1.6669744472879604,
      frequency: 800,
      endFrequency: 900,
      q: 0.7,
      type: "bandpass",
    },
    {
      start: 0.123,
      attack: 0.008,
      release: 0.0939498910076339,
      peak: 0.10073620580372175,
      frequency: 2750,
      endFrequency: 2450,
      q: 0.65,
      type: "bandpass",
    },
    {
      start: 0.123,
      attack: 0.008,
      release: 0.07621034549461145,
      peak: 0.024106840648587015,
      frequency: 4800,
      endFrequency: 6200,
      q: 0.7,
      type: "highpass",
    },
  ]),
  // Compact sounds dispatch before this registry. Empty validated recipes keep
  // the public name contract without bundling their much larger fallbacks.
  clickOriginal: silentRecipe(0.465),
  drop: {
    duration: 1.32,
    seed: 1729,
    startDelay: 0,
    masterGain: 0.8885510768905307,
    noiseSources: [
      {
        id: "drop-noise",
        duration: 1.1568379946534078,
        smoothing: 0.35,
        eager: true,
      },
    ],
    layers: [
      toneLayer({
        offset: 0.0633665409728,
        frequency: 644.206508909136,
        endFrequency: 865.2300459174597,
        attack: 0.06282476410767045,
        release: 0.20199813282197973,
        peak: 1.1781033768488716,
      }),
      noiseLayer({
        source: "drop-noise",
        offset: 0.038702889706683535,
        attack: 0.011746761230649756,
        release: 1.145091233422758,
        peak: 0.1739113951494873,
        frequency: 1389.4252294014066,
        endFrequency: 100,
        q: 5,
      }),
    ],
  },
  introArtifacts: silentRecipe(),
  introHome: silentRecipe(),
  introThoughts: silentRecipe(),
  paperRustle: silentRecipe(6.48),
  partyHorn: silentRecipe(1.5029791667),
  swipeBackward: silentRecipe(),
  swipeForward: silentRecipe(),
};

export interface SynthRecipeValidation {
  valid: boolean;
  errors: string[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateFiniteNumber(
  value: unknown,
  path: string,
  errors: string[],
  minimum = 0,
) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum) {
    errors.push(`${path} must be a finite number >= ${minimum}`);
  }
}

function validateValue(value: unknown, path: string, errors: string[]) {
  if (typeof value === "number") {
    validateFiniteNumber(value, path, errors);
    return;
  }
  if (!isObject(value)) {
    errors.push(`${path} must be a number or { min, max } range`);
    return;
  }
  validateFiniteNumber(value.min, `${path}.min`, errors);
  validateFiniteNumber(value.max, `${path}.max`, errors);
  if (
    typeof value.min === "number" &&
    typeof value.max === "number" &&
    value.max < value.min
  ) {
    errors.push(`${path}.max must be >= ${path}.min`);
  }
}

function validatePoints(value: unknown, path: string, errors: string[]) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }
  value.forEach((point, index) => {
    const pointPath = `${path}[${index}]`;
    if (!isObject(point)) {
      errors.push(`${pointPath} must be an object`);
      return;
    }
    validateValue(point.offset, `${pointPath}.offset`, errors);
    validateValue(point.value, `${pointPath}.value`, errors);
    if (!(["set", "linear", "exponential"] as unknown[]).includes(point.curve)) {
      errors.push(`${pointPath}.curve is invalid`);
    }
  });
}

function validateAutomation(value: unknown, path: string, errors: string[]) {
  if (!isObject(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  validateValue(value.initial, `${path}.initial`, errors);
  if (value.glideTo !== undefined) {
    validateValue(value.glideTo, `${path}.glideTo`, errors);
  }
  if (value.points !== undefined) {
    validatePoints(value.points, `${path}.points`, errors);
  }
  if (value.glideTo !== undefined && value.points !== undefined) {
    errors.push(`${path} cannot contain both glideTo and points`);
  }
}

function validateEnvelope(value: unknown, path: string, errors: string[]) {
  if (!isObject(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (value.kind === "attackRelease") {
    validateValue(value.attack, `${path}.attack`, errors);
    validateValue(value.release, `${path}.release`, errors);
    validateValue(value.peak, `${path}.peak`, errors);
    if (value.floor !== undefined) {
      validateFiniteNumber(value.floor, `${path}.floor`, errors, Number.MIN_VALUE);
    }
    return;
  }
  if (value.kind === "points") {
    validatePoints(value.points, `${path}.points`, errors);
    return;
  }
  errors.push(`${path}.kind is invalid`);
}

export function validateSynthRecipe(value: unknown): SynthRecipeValidation {
  const errors: string[] = [];
  if (!isObject(value)) {
    return { valid: false, errors: ["recipe must be an object"] };
  }

  validateFiniteNumber(value.duration, "duration", errors, Number.MIN_VALUE);
  if (value.seed !== undefined) {
    validateFiniteNumber(value.seed, "seed", errors);
  }
  validateFiniteNumber(value.startDelay, "startDelay", errors);
  validateValue(value.masterGain, "masterGain", errors);

  const sourceIds = new Set<string>();
  if (!Array.isArray(value.noiseSources)) {
    errors.push("noiseSources must be an array");
  } else {
    value.noiseSources.forEach((source, index) => {
      const path = `noiseSources[${index}]`;
      if (!isObject(source)) {
        errors.push(`${path} must be an object`);
        return;
      }
      if (typeof source.id !== "string" || source.id.length === 0) {
        errors.push(`${path}.id must be a non-empty string`);
      } else if (sourceIds.has(source.id)) {
        errors.push(`${path}.id must be unique`);
      } else {
        sourceIds.add(source.id);
      }
      validateFiniteNumber(source.duration, `${path}.duration`, errors, Number.MIN_VALUE);
      validateFiniteNumber(source.smoothing, `${path}.smoothing`, errors);
      if (typeof source.smoothing === "number" && source.smoothing >= 1) {
        errors.push(`${path}.smoothing must be < 1`);
      }
      if (source.eager !== undefined && typeof source.eager !== "boolean") {
        errors.push(`${path}.eager must be a boolean`);
      }
    });
  }

  if (!Array.isArray(value.layers)) {
    errors.push("layers must be an array");
  } else {
    value.layers.forEach((layer, index) => {
      const path = `layers[${index}]`;
      if (!isObject(layer)) {
        errors.push(`${path} must be an object`);
        return;
      }
      validateValue(layer.offset, `${path}.offset`, errors);
      validateEnvelope(layer.envelope, `${path}.envelope`, errors);
      if (layer.stopTail !== undefined) {
        validateFiniteNumber(layer.stopTail, `${path}.stopTail`, errors);
      }

      if (layer.kind === "tone") {
        validateAutomation(layer.frequency, `${path}.frequency`, errors);
        return;
      }
      if (layer.kind === "noise") {
        if (typeof layer.source !== "string" || !sourceIds.has(layer.source)) {
          errors.push(`${path}.source must reference a declared noise source`);
        }
        if (!isObject(layer.filter)) {
          errors.push(`${path}.filter must be an object`);
        } else {
          validateAutomation(
            layer.filter.frequency,
            `${path}.filter.frequency`,
            errors,
          );
          validateValue(layer.filter.q, `${path}.filter.q`, errors);
        }
        if (layer.playbackRate !== undefined) {
          validateValue(layer.playbackRate, `${path}.playbackRate`, errors);
        }
        return;
      }
      errors.push(`${path}.kind is invalid`);
    });
  }

  return { valid: errors.length === 0, errors };
}

export function assertSynthRecipe(
  value: unknown,
  label = "synth recipe",
): asserts value is SynthRecipe {
  const result = validateSynthRecipe(value);
  if (!result.valid) {
    throw new TypeError(`${label} is invalid:\n${result.errors.join("\n")}`);
  }
}

export function validateSynthRecipeCollection(
  value: unknown,
): SynthRecipeValidation {
  const errors: string[] = [];
  if (!isObject(value)) {
    return { valid: false, errors: ["recipe collection must be an object"] };
  }

  for (const name of SYNTH_SOUND_NAMES) {
    if (!(name in value)) {
      errors.push(`${name} is missing`);
      continue;
    }
    const result = validateSynthRecipe(value[name]);
    errors.push(...result.errors.map((error) => `${name}.${error}`));
  }

  for (const name of Object.keys(value)) {
    if (!(SYNTH_SOUND_NAMES as readonly string[]).includes(name)) {
      errors.push(`${name} is not a recognized synth sound`);
    }
  }

  return { valid: errors.length === 0, errors };
}

const registryValidation = validateSynthRecipeCollection(SYNTH_RECIPES);
if (!registryValidation.valid) {
  throw new TypeError(
    `Built-in synth recipes are invalid:\n${registryValidation.errors.join("\n")}`,
  );
}
