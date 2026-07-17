import assert from "node:assert/strict";
import test from "node:test";

import {
  compareSamples,
  SAMPLE_RATE,
  signalStats,
} from "./audio-shape-features.mjs";

function deterministicNoise(length, seed = 0x12345678) {
  const values = new Float32Array(length);
  let state = seed >>> 0;
  for (let index = 0; index < length; index += 1) {
    state = ((state * 1_664_525) + 1_013_904_223) >>> 0;
    values[index] = ((state / 0xffff_ffff) * 2) - 1;
  }
  return values;
}

function referenceSignal() {
  const length = SAMPLE_RATE;
  const output = new Float32Array(length);
  const noise = deterministicNoise(length);
  const bursts = [0.08, 0.34, 0.71];
  for (const startSeconds of bursts) {
    const start = Math.floor(startSeconds * SAMPLE_RATE);
    const burstLength = Math.floor(0.09 * SAMPLE_RATE);
    for (let offset = 0; offset < burstLength && start + offset < length; offset += 1) {
      const envelope = Math.exp(-7 * offset / burstLength);
      output[start + offset] += noise[start + offset] * envelope * 0.65;
    }
  }
  return output;
}

function materiallyChangedSignal() {
  const length = SAMPLE_RATE;
  const output = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    const time = index / SAMPLE_RATE;
    const delayedEnvelope = time > 0.48 && time < 0.98
      ? Math.sin(Math.PI * (time - 0.48) / 0.5) ** 2
      : 0;
    output[index] = Math.sin(2 * Math.PI * 180 * time) * delayedEnvelope * 0.6;
  }
  return output;
}

test("identical PCM produces a unit score for every feature", () => {
  const reference = referenceSignal();
  const metrics = compareSamples(reference, reference.slice());
  assert.equal(metrics.status, "scored");
  assert.ok(metrics.compositeScore >= 0.999999, `composite=${metrics.compositeScore}`);
  for (const [feature, score] of Object.entries(metrics.scores)) {
    assert.ok(score >= 0.999999, `${feature}=${score}`);
  }
});

test("changed timing and spectrum score materially below identity", () => {
  const metrics = compareSamples(referenceSignal(), materiallyChangedSignal());
  assert.equal(metrics.status, "scored");
  assert.ok(metrics.compositeScore < 0.75, `composite=${metrics.compositeScore}`);
  assert.ok(metrics.scores.frequencyBands < 0.75, `bands=${metrics.scores.frequencyBands}`);
  assert.ok(metrics.scores.transientPositions < 0.9, `transients=${metrics.scores.transientPositions}`);
});

test("absolute level and duration differences cannot receive a perfect match", () => {
  const reference = referenceSignal();
  const quieter = Float32Array.from(reference, (sample) => sample * 0.25);
  const quieterMetrics = compareSamples(reference, quieter);
  assert.ok(quieterMetrics.scores.rmsLevel < 0.4, `rms=${quieterMetrics.scores.rmsLevel}`);
  assert.ok(quieterMetrics.scores.peakLevel < 0.4, `peak=${quieterMetrics.scores.peakLevel}`);
  assert.equal(quieterMetrics.scores.duration, 1);
  assert.ok(quieterMetrics.compositeScore < 0.93, `composite=${quieterMetrics.compositeScore}`);

  const padded = new Float32Array(reference.length * 2);
  padded.set(reference);
  const paddedMetrics = compareSamples(reference, padded);
  assert.ok(paddedMetrics.scores.duration < 0.4, `duration=${paddedMetrics.scores.duration}`);
});

test("silent references retain their explicit unscored status", () => {
  const silence = new Float32Array(SAMPLE_RATE / 2);
  const metrics = compareSamples(silence, referenceSignal());
  assert.equal(metrics.status, "silent-reference");
  assert.equal(metrics.compositeScore, null);
  assert.equal(metrics.scores.composite, null);
});

test("a sparse audible impulse is not misclassified as silence", () => {
  const impulse = new Float32Array(SAMPLE_RATE * 4);
  impulse[SAMPLE_RATE * 2] = 0.01;
  const stats = signalStats(impulse);
  assert.ok(stats.rmsDb < -60, `rms=${stats.rmsDb}`);
  assert.ok(stats.peakDb > -50, `peak=${stats.peakDb}`);
  assert.equal(stats.effectivelySilent, false);
});
