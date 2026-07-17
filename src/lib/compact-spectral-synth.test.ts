import { describe, expect, it, vi } from "vitest";

import clickAltExactModel from "../../scripts/audio-fit/experiments/exact-pcm16-bitplanes/results/click-alt/model.json";
import clickOriginalExactModel from "../../scripts/audio-fit/experiments/exact-pcm16-bitplanes/results/click-original/model.json";
import dropExactModel from "../../scripts/audio-fit/experiments/exact-pcm16-bitplanes/results/drop/model.json";
import paperRustleExactModel from "../../scripts/audio-fit/experiments/exact-pcm16-bitplanes/results/paper/model.json";
import partyHornExactModel from "../../scripts/audio-fit/experiments/exact-pcm16-bitplanes/results/sad-party-horn/model.json";

import {
  COMPACT_SOUND_NAMES,
  PAPER_RUSTLE_DURATION_SAMPLES,
  PAPER_RUSTLE_SAMPLE_RATE,
  compactMetadata,
  prepareCompactPcm,
  preparePaperRustlePcm,
  validateExactPcm16BitplaneModel,
} from "./compact-spectral-synth";

function clickGestureSignature(samples: Float32Array) {
  const binCount = 96;
  const rms = Array.from({ length: binCount }, (_, bin) => {
    const start = Math.floor((bin / binCount) * samples.length);
    const end = Math.max(
      start + 1,
      Math.floor(((bin + 1) / binCount) * samples.length),
    );
    let power = 0;
    for (let index = start; index < end; index += 1) {
      power += samples[index] * samples[index];
    }
    return Math.sqrt(power / (end - start));
  });
  const maximum = Math.max(...rms, Number.EPSILON);
  const envelope = rms.map((value) => Math.max(
    0,
    Math.min(
      1,
      (20 * Math.log10(Math.max(value / maximum, 1e-12)) + 60) / 60,
    ),
  ));
  const smoothed = envelope.map((_, index) => {
    let total = 0;
    let weight = 0;
    for (let offset = -2; offset <= 2; offset += 1) {
      const sourceIndex = index + offset;
      if (sourceIndex < 0 || sourceIndex >= envelope.length) continue;
      const localWeight = 3 - Math.abs(offset);
      total += envelope[sourceIndex] * localWeight;
      weight += localWeight;
    }
    return total / weight;
  });
  const onsets = smoothed.map((value, index) =>
    index === 0 ? value : Math.max(0, value - smoothed[index - 1]),
  );
  const threshold = Math.max(0.035, Math.max(...onsets) * 0.2);
  const candidates = onsets
    .map((strength, index) => ({ index, strength }))
    .filter(({ index, strength }) =>
      strength >= threshold
      && strength >= (onsets[index - 1] ?? -Infinity)
      && strength >= (onsets[index + 1] ?? -Infinity),
    )
    .sort((left, right) => right.strength - left.strength);
  const selected: Array<{ index: number; strength: number }> = [];
  for (const candidate of candidates) {
    if (selected.every(({ index }) => Math.abs(index - candidate.index) >= 2)) {
      selected.push(candidate);
      if (selected.length === 20) break;
    }
  }
  selected.sort((left, right) => left.index - right.index);
  return {
    gap: envelope.filter((value) => value <= 0.05).length / binCount,
    transients: selected.map(({ index }) =>
      Number((index / (binCount - 1)).toFixed(4)),
    ),
  };
}

function pcmHash(samples: Float32Array) {
  const bytes = new Uint8Array(
    samples.buffer,
    samples.byteOffset,
    samples.byteLength,
  );
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

describe("compact audio reconstruction", () => {
  it("evicts a rejected preparation so a transient decoder failure can retry", async () => {
    vi.resetModules();
    const isolatedCompactSynth = await import("./compact-spectral-synth");
    try {
      vi.stubGlobal("DecompressionStream", undefined);
      const rejected = isolatedCompactSynth.prepareCompactPcm("click");
      await expect(rejected).rejects.toThrow(
        "This browser does not support gzip DecompressionStream",
      );
      vi.unstubAllGlobals();
      const retried = isolatedCompactSynth.prepareCompactPcm("click");

      expect(retried).not.toBe(rejected);
      await expect(retried).resolves.toHaveLength(
        isolatedCompactSynth.compactMetadata("click").durationSamples,
      );
    } finally {
      vi.unstubAllGlobals();
      vi.resetModules();
    }
  });

  it("decodes the deterministic source-locked 6.48-second model once", async () => {
    expect(validateExactPcm16BitplaneModel(paperRustleExactModel)).toEqual({
      valid: true,
      errors: [],
    });
    const invalid = {
      ...paperRustleExactModel,
      compressedByteLength: paperRustleExactModel.compressedByteLength + 1,
    };
    expect(validateExactPcm16BitplaneModel(invalid)).toMatchObject({
      valid: false,
    });
    expect(atob(paperRustleExactModel.excitation).length).toBe(197_074);

    const first = await preparePaperRustlePcm();
    const second = await preparePaperRustlePcm();

    expect(second).toBe(first);
    expect(PAPER_RUSTLE_SAMPLE_RATE).toBe(48_000);
    expect(first.length).toBe(PAPER_RUSTLE_DURATION_SAMPLES);
    expect(first.length / PAPER_RUSTLE_SAMPLE_RATE).toBeCloseTo(6.48, 6);

    let totalPower = 0;
    let peak = 0;
    let allFinite = true;
    let minimumBinRms = Number.POSITIVE_INFINITY;
    for (let index = 0; index < first.length; index += 1) {
      const sample = first[index];
      allFinite &&= Number.isFinite(sample);
      totalPower += sample * sample;
      peak = Math.max(peak, Math.abs(sample));
    }
    for (let bin = 0; bin < 96; bin += 1) {
      const start = Math.floor((bin / 96) * first.length);
      const end = Math.floor(((bin + 1) / 96) * first.length);
      let power = 0;
      for (let index = start; index < end; index += 1) {
        power += first[index] * first[index];
      }
      minimumBinRms = Math.min(
        minimumBinRms,
        Math.sqrt(power / (end - start)),
      );
    }

    expect(allFinite).toBe(true);
    expect(Math.sqrt(totalPower / first.length)).toBeCloseTo(0.01269, 4);
    expect(peak).toBe(1);
    // Preserve the reference's intentional quiet gestures exactly. Playback
    // continuity is guarded separately by the main-thread benchmark.
    expect(20 * Math.log10(minimumBinRms)).toBeLessThan(-90);
    expect(clickGestureSignature(first)).toEqual({
      gap: 44 / 96,
      transients: [0.0211, 0.2421, 0.5053, 0.7579, 0.9053],
    });
  }, 15_000);

  it("decodes the source-locked alternate click with exact gesture topology", async () => {
    expect(validateExactPcm16BitplaneModel(clickAltExactModel)).toEqual({
      valid: true,
      errors: [],
    });
    expect(atob(clickAltExactModel.excitation).length).toBe(10_349);

    const samples = await prepareCompactPcm("click");
    const metadata = compactMetadata("click");
    expect(samples.length).toBe(metadata.durationSamples);
    expect(samples.length / metadata.sampleRate).toBeCloseTo(0.365729, 5);
    expect(clickGestureSignature(samples)).toEqual({
      gap: 49 / 96,
      transients: [0.1263, 0.1895, 0.3579],
    });
  });

  it("validates and decodes the exact compact original click", async () => {
    expect(validateExactPcm16BitplaneModel(clickOriginalExactModel)).toEqual({
      valid: true,
      errors: [],
    });
    const invalid = {
      ...clickOriginalExactModel,
      excitation: clickOriginalExactModel.excitation.slice(0, -4),
    };
    expect(validateExactPcm16BitplaneModel(invalid)).toMatchObject({
      valid: false,
    });
    expect(atob(clickOriginalExactModel.excitation).length).toBe(12_251);

    const first = await prepareCompactPcm("clickOriginal");
    const second = await prepareCompactPcm("clickOriginal");
    expect(second).toBe(first);
    expect(first.length).toBe(22_320);
    expect(clickGestureSignature(first)).toEqual({
      gap: 59 / 96,
      transients: [0.2316, 0.4421],
    });
  });

  it("validates and deterministically decodes the exact compact drop", async () => {
    expect(validateExactPcm16BitplaneModel(dropExactModel)).toEqual({
      valid: true,
      errors: [],
    });
    expect(new Set(COMPACT_SOUND_NAMES).size).toBe(COMPACT_SOUND_NAMES.length);
    expect(atob(dropExactModel.excitation).length).toBe(22_219);

    const first = await prepareCompactPcm("drop");
    const second = await prepareCompactPcm("drop");
    const metadata = compactMetadata("drop");
    expect(second).toBe(first);
    expect(first.length).toBe(metadata.durationSamples);
    expect(first.length / metadata.sampleRate).toBeCloseTo(1.32, 6);
    expect(clickGestureSignature(first)).toEqual({
      gap: 61 / 96,
      transients: [0.0316, 0.0842],
    });
    expect(pcmHash(first)).toBe(1_523_501_000);
  });

  it("decodes the compact party horn with exact gesture topology", async () => {
    expect(validateExactPcm16BitplaneModel(partyHornExactModel)).toEqual({
      valid: true,
      errors: [],
    });
    expect(new Set(COMPACT_SOUND_NAMES).size).toBe(COMPACT_SOUND_NAMES.length);
    expect(atob(partyHornExactModel.excitation).length).toBe(82_472);

    const first = await prepareCompactPcm("partyHorn");
    const second = await prepareCompactPcm("partyHorn");
    const metadata = compactMetadata("partyHorn");
    expect(second).toBe(first);
    expect(first.length).toBe(metadata.durationSamples);
    expect(first.length).toBe(72_143);
    expect(clickGestureSignature(first)).toEqual({
      gap: 11 / 96,
      transients: [0.0632, 0.0842, 0.1053],
    });
  });

});
