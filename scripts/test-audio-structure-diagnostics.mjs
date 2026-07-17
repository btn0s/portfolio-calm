import assert from "node:assert/strict";
import test from "node:test";

import { compareSamples, SAMPLE_RATE } from "./audio-shape-features.mjs";
import { analyzeStructuralMatch } from "./audio-structure-diagnostics.mjs";

function harmonicSignal(frequencies, durationSeconds = 0.32) {
  const length = Math.round(SAMPLE_RATE * durationSeconds);
  const output = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    const time = index / SAMPLE_RATE;
    const envelope = Math.sin(Math.PI * index / (length - 1)) ** 2;
    output[index] = frequencies.reduce(
      (value, frequency, harmonic) => value
        + (Math.sin(2 * Math.PI * frequency * time) / (harmonic + 1)),
      0,
    ) * envelope * 0.25;
  }
  return output;
}

function deterministicNoise(length, seed) {
  const output = new Float32Array(length);
  let state = seed >>> 0;
  for (let index = 0; index < length; index += 1) {
    state = ((state * 1_664_525) + 1_013_904_223) >>> 0;
    output[index] = ((state / 0xffff_ffff) * 2) - 1;
  }
  return output;
}

test("identity scores one at every enhanced diagnostic", () => {
  const reference = harmonicSignal([220, 440, 660]);
  const result = analyzeStructuralMatch(reference, reference.slice());
  assert.equal(result.structuralScore, 1);
  assert.equal(result.multiResolutionEnvelope.score, 1);
  assert.equal(result.fineSpectrumSimilarity, 1);
  assert.equal(result.harmonicRidges.score, 1);
  assert.equal(result.phaseCoherence.absolute, 1);
});

test("fine bands reject shifted ridges that broad bands largely accept", () => {
  const reference = harmonicSignal([220, 440, 660, 880]);
  const shifted = harmonicSignal([246, 492, 738, 984]);
  const coarse = compareSamples(reference, shifted);
  const enhanced = analyzeStructuralMatch(reference, shifted);
  assert.ok(coarse.compositeScore > 0.94, `coarse composite=${coarse.compositeScore}`);
  assert.ok(coarse.scores.frequencyBands > 0.85, `coarse bands=${coarse.scores.frequencyBands}`);
  assert.ok(enhanced.fineSpectrumSimilarity < 0.6, `fine=${enhanced.fineSpectrumSimilarity}`);
  assert.ok(enhanced.harmonicRidges.frequencyMatch < 0.45, `ridges=${enhanced.harmonicRidges.frequencyMatch}`);
  assert.ok(enhanced.structuralScore < 0.8, `structure=${enhanced.structuralScore}`);
});

test("multi-resolution envelopes expose within-bin transient timing errors", () => {
  const reference = new Float32Array(SAMPLE_RATE);
  const shifted = new Float32Array(SAMPLE_RATE);
  const burst = deterministicNoise(48, 7);
  for (let coarseBin = 4; coarseBin < 88; coarseBin += 8) {
    const binStart = Math.floor((coarseBin / 96) * SAMPLE_RATE);
    for (let offset = 0; offset < burst.length; offset += 1) {
      reference[binStart + 48 + offset] = burst[offset] * 0.7;
      shifted[binStart + 384 + offset] = burst[offset] * 0.7;
    }
  }
  const coarse = compareSamples(reference, shifted);
  const enhanced = analyzeStructuralMatch(reference, shifted);
  assert.ok(coarse.compositeScore > 0.99, `coarse=${coarse.compositeScore}`);
  assert.ok(
    enhanced.multiResolutionEnvelope.score < 0.1,
    `multi-resolution=${enhanced.multiResolutionEnvelope.score}`,
  );
  assert.ok(enhanced.structuralScore < 0.55, `structure=${enhanced.structuralScore}`);
});

test("phase coherence exposes random-phase/sample mismatch separately from shape", () => {
  const length = Math.round(SAMPLE_RATE * 0.4);
  const referenceNoise = deterministicNoise(length, 123);
  const candidateNoise = deterministicNoise(length, 456);
  const envelope = Float64Array.from({ length }, (_, index) => (
    Math.sin(Math.PI * index / (length - 1)) ** 2
  ));
  const reference = Float32Array.from(referenceNoise, (value, index) => value * envelope[index]);
  const candidate = Float32Array.from(candidateNoise, (value, index) => value * envelope[index]);
  const result = analyzeStructuralMatch(reference, candidate);
  assert.ok(result.multiResolutionEnvelope.score > 0.8, `envelope=${result.multiResolutionEnvelope.score}`);
  assert.ok(result.phaseCoherence.absolute < 0.35, `phase=${result.phaseCoherence.absolute}`);
});
