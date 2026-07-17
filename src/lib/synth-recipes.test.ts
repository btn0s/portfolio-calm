import { describe, expect, it } from "vitest";

import clickOriginalFallback from "../../scripts/audio-fit/experiments/transient-exact/results/click-residual-refine/browser-recipe.json";
import partyHornFallback from "../../scripts/audio-fit/results/sad-party-horn-exact/recipe.json";

import {
  createSeededRandom,
  renderSynthRecipe,
  resolveSynthValue,
} from "./synth-audio";
import {
  SYNTH_RECIPES,
  SYNTH_SOUND_NAMES,
  validateSynthRecipe,
  validateSynthRecipeCollection,
} from "./synth-recipes";

class FakeAudioParam {
  value = 0;

  constructor(
    private readonly label: string,
    private readonly events: string[],
  ) {}

  setValueAtTime(value: number, time: number) {
    this.events.push(`${this.label}:set:${value}:${time}`);
    return this as unknown as AudioParam;
  }

  linearRampToValueAtTime(value: number, time: number) {
    this.events.push(`${this.label}:linear:${value}:${time}`);
    return this as unknown as AudioParam;
  }

  exponentialRampToValueAtTime(value: number, time: number) {
    this.events.push(`${this.label}:exponential:${value}:${time}`);
    return this as unknown as AudioParam;
  }
}

class FakeNode {
  constructor(
    readonly id: string,
    protected readonly events: string[],
  ) {}

  connect(destination: FakeNode) {
    this.events.push(`${this.id}:connect:${destination.id}`);
    return destination;
  }

  disconnect() {}
}

class FakeScheduledNode extends FakeNode {
  start(time: number) {
    this.events.push(`${this.id}:start:${time}`);
  }

  stop(time: number) {
    this.events.push(`${this.id}:stop:${time}`);
  }
}

class FakeAudioContext {
  readonly currentTime = 0;
  readonly sampleRate = 100;
  readonly events: string[] = [];
  readonly noise: Float32Array[] = [];
  readonly destination = new FakeNode("destination", this.events);
  private nextId = 0;

  createGain() {
    const id = `gain-${this.nextId++}`;
    return Object.assign(new FakeNode(id, this.events), {
      gain: new FakeAudioParam(`${id}.gain`, this.events),
    });
  }

  createOscillator() {
    const id = `oscillator-${this.nextId++}`;
    return Object.assign(new FakeScheduledNode(id, this.events), {
      frequency: new FakeAudioParam(`${id}.frequency`, this.events),
      type: "sine" as OscillatorType,
    });
  }

  createBiquadFilter() {
    const id = `filter-${this.nextId++}`;
    return Object.assign(new FakeNode(id, this.events), {
      frequency: new FakeAudioParam(`${id}.frequency`, this.events),
      Q: new FakeAudioParam(`${id}.Q`, this.events),
      type: "lowpass" as BiquadFilterType,
    });
  }

  createBufferSource() {
    const id = `source-${this.nextId++}`;
    return Object.assign(new FakeScheduledNode(id, this.events), {
      buffer: null as AudioBuffer | null,
      playbackRate: new FakeAudioParam(`${id}.playbackRate`, this.events),
    });
  }

  createBuffer(_channels: number, length: number, sampleRate: number) {
    const channel = new Float32Array(length);
    this.noise.push(channel);
    return {
      length,
      sampleRate,
      getChannelData: () => channel,
    } as unknown as AudioBuffer;
  }

  snapshot() {
    return {
      events: this.events,
      noise: this.noise.map((channel) => Array.from(channel)),
    };
  }
}

function renderSnapshot(seed: number) {
  const context = new FakeAudioContext();
  renderSynthRecipe(
    context as unknown as BaseAudioContext,
    context.destination as unknown as AudioNode,
    SYNTH_RECIPES.click,
    createSeededRandom(seed),
  );
  return context.snapshot();
}

describe("synth recipes", () => {
  it("contains one valid recipe for every public synth sound", () => {
    expect(Object.keys(SYNTH_RECIPES).sort()).toEqual(
      [...SYNTH_SOUND_NAMES].sort(),
    );
    expect(validateSynthRecipeCollection(SYNTH_RECIPES)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("round-trips through JSON as a valid optimizer candidate", () => {
    const candidate: unknown = JSON.parse(JSON.stringify(SYNTH_RECIPES));
    expect(validateSynthRecipeCollection(candidate)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("keeps the fitted fallback artifacts valid and intact", () => {
    expect(validateSynthRecipe(partyHornFallback)).toMatchObject({ valid: true });
    expect(validateSynthRecipe(clickOriginalFallback)).toMatchObject({ valid: true });
    expect(partyHornFallback.layers).toHaveLength(40);
    expect(
      partyHornFallback.layers.every((layer) => layer.kind === "tone"),
    ).toBe(true);
    expect(clickOriginalFallback.layers).toHaveLength(9);
    expect(clickOriginalFallback.noiseSources).toHaveLength(6);
    expect(clickOriginalFallback.layers.at(-1)).toMatchObject({
      kind: "tone",
      offset: 0.292,
      envelope: { attack: 0.008, release: 0.115, peak: 0.001 },
      frequency: { initial: 300, glideTo: 100 },
    });
  });

  it("rejects missing noise-source references", () => {
    const candidate = structuredClone(SYNTH_RECIPES.click);
    const firstLayer = candidate.layers[0];
    if (firstLayer.kind !== "noise") throw new Error("expected noise layer");
    firstLayer.source = "missing";

    expect(validateSynthRecipe(candidate)).toMatchObject({
      valid: false,
      errors: [expect.stringContaining("declared noise source")],
    });
  });

  it("resolves ranges reproducibly", () => {
    const first = createSeededRandom(23);
    const second = createSeededRandom(23);
    const values = { min: 10, max: 20 } as const;

    expect(Array.from({ length: 8 }, () => resolveSynthValue(values, first))).toEqual(
      Array.from({ length: 8 }, () => resolveSynthValue(values, second)),
    );
  });

  it("builds identical noise and automation schedules for the same seed", () => {
    expect(renderSnapshot(1729)).toEqual(renderSnapshot(1729));
    expect(renderSnapshot(1729)).not.toEqual(renderSnapshot(1730));
  });
});
