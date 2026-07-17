import assert from "node:assert/strict";
import test from "node:test";

import { SAMPLE_RATE } from "./audio-shape-features.mjs";
import { analyzeTextureMatch } from "./audio-texture-diagnostics.mjs";

function noise(length, seed) {
  const output = new Float32Array(length);
  let state = seed >>> 0;
  let previous = 0;
  for (let index = 0; index < length; index += 1) {
    state = Math.imul(state ^ (state >>> 15), 0x2c1b3c6d) >>> 0;
    const white = (state / 0xffff_ffff) * 2 - 1;
    previous = previous * 0.45 + white * 0.55;
    output[index] = previous;
  }
  return output;
}

function gestureEnvelope(index, length) {
  const time = index / SAMPLE_RATE;
  const broad = 0.25 + 0.75 * Math.sin(Math.PI * index / (length - 1)) ** 2;
  const flutter = 0.62 + 0.38 * Math.sin(2 * Math.PI * 7.5 * time) ** 2;
  return broad * flutter;
}

function texturedNoise(seed, modulated = true) {
  const length = SAMPLE_RATE * 2;
  const carrier = noise(length, seed);
  return Float32Array.from(carrier, (value, index) =>
    value * (modulated ? gestureEnvelope(index, length) : 0.5),
  );
}

test("texture identity and polarity inversion both score one", () => {
  const reference = texturedNoise(17);
  const identity = analyzeTextureMatch(reference, reference.slice());
  const inverted = analyzeTextureMatch(
    reference,
    Float32Array.from(reference, (value) => -value),
  );
  assert.equal(identity.textureScore, 1);
  assert.equal(inverted.textureScore, 1);
  assert.equal(inverted.phaseInvariant, true);
});

test("different random phase remains a close stochastic-texture match", () => {
  const result = analyzeTextureMatch(texturedNoise(17), texturedNoise(93));
  assert.ok(result.textureScore > 0.9, `texture=${result.textureScore}`);
  assert.ok(result.grainStatistics.score > 0.9, `grain=${result.grainStatistics.score}`);
});

test("the modulation spectrum rejects a steady-envelope noise impostor", () => {
  const result = analyzeTextureMatch(
    texturedNoise(17),
    texturedNoise(17, false),
  );
  assert.ok(
    result.modulationSpectrum.score < 0.65,
    `modulation=${result.modulationSpectrum.score}`,
  );
  assert.ok(result.textureScore < 0.85, `texture=${result.textureScore}`);
});

test("grain statistics reject a phase-coherent tone with the same envelope", () => {
  const reference = texturedNoise(17);
  const tone = Float32Array.from({ length: reference.length }, (_, index) =>
    Math.sin(2 * Math.PI * 1_800 * index / SAMPLE_RATE)
      * gestureEnvelope(index, reference.length),
  );
  const result = analyzeTextureMatch(reference, tone);
  assert.ok(result.grainStatistics.score < 0.7, `grain=${result.grainStatistics.score}`);
  assert.ok(result.textureScore < 0.85, `texture=${result.textureScore}`);
});
