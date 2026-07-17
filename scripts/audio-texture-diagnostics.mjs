#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { decodeAudio, SAMPLE_RATE, signalStats } from "./audio-shape-features.mjs";

export const TEXTURE_DIAGNOSTIC_VERSION = "stochastic-texture-v1";
export const TEXTURE_TARGETS = Object.freeze({
  perceptualPass: {
    score: 0.9,
    modulationSpectrum: 0.9,
    spectralFlux: 0.85,
    grainStatistics: 0.9,
    perceptualBedCoverage: 0.999,
  },
  exactnessTarget: {
    score: 0.97,
    modulationSpectrum: 0.98,
    spectralFlux: 0.95,
    grainStatistics: 0.98,
    perceptualBedCoverage: 1,
  },
});

const TAU = Math.PI * 2;
const EPSILON = 1e-20;
const MODULATION_FRAME_SAMPLES = 48; // 1 ms at 48 kHz
const MODULATION_RATE = SAMPLE_RATE / MODULATION_FRAME_SAMPLES;
const MODULATION_EDGES_HZ = Object.freeze([
  0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 125, 250, 500,
]);
const SPECTRAL_FFT_SIZE = 512;
const SPECTRAL_HOP_SAMPLES = 192; // 4 ms
const SPECTRAL_BAND_COUNT = 24;
const MIN_SPECTRAL_HZ = 80;
const MAX_SPECTRAL_HZ = 16_000;
const DISTRIBUTION_BIN_COUNT = 24;
const CONTINUITY_THRESHOLDS_DBFS = Object.freeze([-90, -84, -80, -72, -66, -60]);

const clamp = (value, minimum = 0, maximum = 1) =>
  Math.max(minimum, Math.min(maximum, value));
const round = (value, digits = 6) => Number(value.toFixed(digits));

function fft(real, imaginary) {
  const size = real.length;
  for (let index = 1, reversed = 0; index < size; index += 1) {
    let bit = size >> 1;
    while (reversed & bit) {
      reversed ^= bit;
      bit >>= 1;
    }
    reversed ^= bit;
    if (index < reversed) {
      [real[index], real[reversed]] = [real[reversed], real[index]];
      [imaginary[index], imaginary[reversed]] = [imaginary[reversed], imaginary[index]];
    }
  }
  for (let length = 2; length <= size; length <<= 1) {
    const angle = -TAU / length;
    const stepReal = Math.cos(angle);
    const stepImaginary = Math.sin(angle);
    for (let offset = 0; offset < size; offset += length) {
      let rotationReal = 1;
      let rotationImaginary = 0;
      for (let index = 0; index < length / 2; index += 1) {
        const even = offset + index;
        const odd = even + length / 2;
        const oddReal = real[odd] * rotationReal - imaginary[odd] * rotationImaginary;
        const oddImaginary = real[odd] * rotationImaginary + imaginary[odd] * rotationReal;
        real[odd] = real[even] - oddReal;
        imaginary[odd] = imaginary[even] - oddImaginary;
        real[even] += oddReal;
        imaginary[even] += oddImaginary;
        const nextReal = rotationReal * stepReal - rotationImaginary * stepImaginary;
        rotationImaginary = rotationReal * stepImaginary + rotationImaginary * stepReal;
        rotationReal = nextReal;
      }
    }
  }
}

function nextPowerOfTwo(value) {
  let result = 1;
  while (result < value) result <<= 1;
  return result;
}

function bhattacharyya(left, right) {
  let coefficient = 0;
  for (let index = 0; index < left.length; index += 1) {
    coefficient += Math.sqrt(left[index] * right[index]);
  }
  return clamp(coefficient);
}

function quantileSimilarity(reference, candidate, floor = 0.005) {
  let logError = 0;
  for (let index = 0; index < reference.length; index += 1) {
    logError += Math.abs(Math.log(
      (candidate[index] + floor) / (reference[index] + floor),
    ));
  }
  return Math.exp(-(logError / reference.length) / 0.6);
}

function normalizedHistogram(values, weights, binCount, maximum) {
  const histogram = new Float64Array(binCount);
  let total = 0;
  for (let index = 0; index < values.length; index += 1) {
    const position = clamp(values[index] / maximum) * (binCount - 1);
    const lower = Math.floor(position);
    const upper = Math.min(binCount - 1, lower + 1);
    const fraction = position - lower;
    const weight = weights[index];
    histogram[lower] += weight * (1 - fraction);
    histogram[upper] += weight * fraction;
    total += weight;
  }
  if (total > EPSILON) {
    for (let index = 0; index < histogram.length; index += 1) {
      histogram[index] /= total;
    }
  }
  return histogram;
}

function weightedQuantiles(values, weights) {
  const entries = values.map((value, index) => ({ value, weight: weights[index] }))
    .sort((left, right) => left.value - right.value);
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  return [0.1, 0.5, 0.9].map((quantile) => {
    const target = total * quantile;
    let cumulative = 0;
    for (const entry of entries) {
      cumulative += entry.weight;
      if (cumulative >= target) return round(entry.value);
    }
    return round(entries.at(-1)?.value ?? 0);
  });
}

function rmsFrames(samples, frameSamples) {
  const count = Math.ceil(samples.length / frameSamples);
  const result = new Float64Array(count);
  for (let frame = 0; frame < count; frame += 1) {
    const start = frame * frameSamples;
    const end = Math.min(samples.length, start + frameSamples);
    let power = 0;
    for (let index = start; index < end; index += 1) {
      power += samples[index] ** 2;
    }
    result[frame] = Math.sqrt(power / Math.max(1, end - start));
  }
  return result;
}

function modulationFeatures(samples) {
  const rms = rmsFrames(samples, MODULATION_FRAME_SAMPLES);
  const maximum = Math.max(...rms, EPSILON);
  const db = Float64Array.from(rms, (value) => Math.max(
    -72,
    20 * Math.log10(Math.max(value / maximum, 1e-12)),
  ));
  const mean = db.reduce((sum, value) => sum + value, 0) / db.length;
  const variance = db.reduce((sum, value) => sum + (value - mean) ** 2, 0)
    / db.length;
  const fftSize = nextPowerOfTwo(db.length);
  const real = new Float64Array(fftSize);
  const imaginary = new Float64Array(fftSize);
  for (let index = 0; index < db.length; index += 1) {
    const window = 0.5 - 0.5 * Math.cos(TAU * index / Math.max(1, db.length - 1));
    real[index] = (db[index] - mean) * window;
  }
  fft(real, imaginary);
  const bands = new Float64Array(MODULATION_EDGES_HZ.length - 1);
  for (let bin = 1; bin <= fftSize / 2; bin += 1) {
    const frequency = bin * MODULATION_RATE / fftSize;
    const band = MODULATION_EDGES_HZ.findIndex((edge, index) => (
      index < MODULATION_EDGES_HZ.length - 1
      && frequency >= edge
      && frequency < MODULATION_EDGES_HZ[index + 1]
    ));
    if (band >= 0) bands[band] += real[bin] ** 2 + imaginary[bin] ** 2;
  }
  const total = bands.reduce((sum, value) => sum + value, 0);
  if (total > EPSILON) {
    for (let index = 0; index < bands.length; index += 1) bands[index] /= total;
  }
  const lowEnergyCoverage = rms.filter((value) => value > maximum * 0.05).length
    / rms.length;
  const coverageByDbfs = Object.fromEntries(
    CONTINUITY_THRESHOLDS_DBFS.map((db) => [
      db,
      rms.filter((value) => value >= 10 ** (db / 20)).length / rms.length,
    ]),
  );
  return {
    bands,
    depthDb: Math.sqrt(variance),
    lowEnergyCoverage,
    coverageByDbfs,
  };
}

function spectralBands(samples, center) {
  const real = new Float64Array(SPECTRAL_FFT_SIZE);
  const imaginary = new Float64Array(SPECTRAL_FFT_SIZE);
  const start = center - SPECTRAL_FFT_SIZE / 2;
  let mean = 0;
  let count = 0;
  for (let index = 0; index < SPECTRAL_FFT_SIZE; index += 1) {
    const sourceIndex = start + index;
    if (sourceIndex >= 0 && sourceIndex < samples.length) {
      mean += samples[sourceIndex];
      count += 1;
    }
  }
  mean /= Math.max(1, count);
  for (let index = 0; index < SPECTRAL_FFT_SIZE; index += 1) {
    const sourceIndex = start + index;
    const sample = sourceIndex >= 0 && sourceIndex < samples.length
      ? samples[sourceIndex] - mean
      : 0;
    const window = 0.5 - 0.5 * Math.cos(TAU * index / (SPECTRAL_FFT_SIZE - 1));
    real[index] = sample * window;
  }
  fft(real, imaginary);
  const bands = new Float64Array(SPECTRAL_BAND_COUNT);
  const logRange = Math.log(MAX_SPECTRAL_HZ / MIN_SPECTRAL_HZ);
  for (let bin = 1; bin <= SPECTRAL_FFT_SIZE / 2; bin += 1) {
    const frequency = bin * SAMPLE_RATE / SPECTRAL_FFT_SIZE;
    if (frequency < MIN_SPECTRAL_HZ || frequency > MAX_SPECTRAL_HZ) continue;
    const position = Math.log(frequency / MIN_SPECTRAL_HZ) / logRange
      * (SPECTRAL_BAND_COUNT - 1);
    const lower = Math.floor(position);
    const upper = Math.min(SPECTRAL_BAND_COUNT - 1, lower + 1);
    const fraction = position - lower;
    const power = real[bin] ** 2 + imaginary[bin] ** 2;
    bands[lower] += power * (1 - fraction);
    bands[upper] += power * fraction;
  }
  const total = bands.reduce((sum, value) => sum + value, 0);
  if (total > EPSILON) {
    for (let index = 0; index < bands.length; index += 1) bands[index] /= total;
  }
  return bands;
}

function grainFeatures(samples) {
  const rmsValues = [];
  const crestValues = [];
  const crossingValues = [];
  for (let start = 0; start < samples.length; start += SPECTRAL_HOP_SAMPLES) {
    const end = Math.min(samples.length, start + SPECTRAL_HOP_SAMPLES);
    let power = 0;
    let peak = 0;
    let crossings = 0;
    let previous = samples[start] ?? 0;
    for (let index = start; index < end; index += 1) {
      const sample = samples[index];
      power += sample ** 2;
      peak = Math.max(peak, Math.abs(sample));
      if (index > start && ((previous < 0) !== (sample < 0))) crossings += 1;
      previous = sample;
    }
    const localRms = Math.sqrt(power / Math.max(1, end - start));
    rmsValues.push(localRms);
    crestValues.push(clamp(peak / Math.max(localRms, EPSILON), 1, 8) - 1);
    crossingValues.push(clamp((crossings / Math.max(1, end - start - 1)) / 0.5));
  }
  const maximumRms = Math.max(...rmsValues, EPSILON);
  const weights = rmsValues.map((value) => 0.02 + Math.sqrt(value / maximumRms));

  const fluxValues = [];
  const fluxWeights = [];
  let previousBands = null;
  for (
    let center = SPECTRAL_FFT_SIZE / 2;
    center < samples.length + SPECTRAL_FFT_SIZE / 2;
    center += SPECTRAL_HOP_SAMPLES
  ) {
    const bands = spectralBands(samples, center);
    if (previousBands) {
      let distance = 0;
      for (let index = 0; index < bands.length; index += 1) {
        distance += Math.sqrt(previousBands[index] * bands[index]);
      }
      const frameIndex = Math.min(rmsValues.length - 1, Math.floor(center / SPECTRAL_HOP_SAMPLES));
      fluxValues.push(clamp(1 - distance));
      fluxWeights.push(weights[frameIndex]);
    }
    previousBands = bands;
  }

  return {
    crestHistogram: normalizedHistogram(
      crestValues,
      weights,
      DISTRIBUTION_BIN_COUNT,
      7,
    ),
    crossingHistogram: normalizedHistogram(
      crossingValues,
      weights,
      DISTRIBUTION_BIN_COUNT,
      1,
    ),
    fluxHistogram: normalizedHistogram(
      fluxValues,
      fluxWeights,
      DISTRIBUTION_BIN_COUNT,
      1,
    ),
    crestQuantiles: weightedQuantiles(crestValues, weights).map((value) => round(value + 1)),
    crossingQuantiles: weightedQuantiles(crossingValues, weights),
    fluxQuantiles: weightedQuantiles(fluxValues, fluxWeights),
  };
}

export function analyzeTextureMatch(referenceSamples, candidateSamples) {
  const referenceSignal = signalStats(referenceSamples);
  const candidateSignal = signalStats(candidateSamples);
  if (referenceSignal.effectivelySilent || candidateSignal.effectivelySilent) {
    return {
      version: TEXTURE_DIAGNOSTIC_VERSION,
      status: referenceSignal.effectivelySilent ? "silent-reference" : "silent-candidate",
      textureScore: null,
      referenceSignal,
      candidateSignal,
    };
  }

  const referenceModulation = modulationFeatures(referenceSamples);
  const candidateModulation = modulationFeatures(candidateSamples);
  const modulationDistribution = bhattacharyya(
    referenceModulation.bands,
    candidateModulation.bands,
  );
  const modulationDepth = Math.exp(-Math.abs(
    referenceModulation.depthDb - candidateModulation.depthDb,
  ) / 8);
  const modulationScore = modulationDistribution * 0.8 + modulationDepth * 0.2;

  const referenceGrain = grainFeatures(referenceSamples);
  const candidateGrain = grainFeatures(candidateSamples);
  const crestSimilarity = bhattacharyya(
    referenceGrain.crestHistogram,
    candidateGrain.crestHistogram,
  );
  const crossingSimilarity = bhattacharyya(
    referenceGrain.crossingHistogram,
    candidateGrain.crossingHistogram,
  );
  const fluxDistributionSimilarity = bhattacharyya(
    referenceGrain.fluxHistogram,
    candidateGrain.fluxHistogram,
  );
  const fluxQuantileSimilarity = quantileSimilarity(
    referenceGrain.fluxQuantiles,
    candidateGrain.fluxQuantiles,
  );
  const fluxSimilarity = fluxDistributionSimilarity * 0.6
    + fluxQuantileSimilarity * 0.4;
  const grainScore = Math.sqrt(crestSimilarity * crossingSimilarity);
  const textureScore = Math.exp(
    Math.log(Math.max(modulationScore, 1e-9)) * 0.4
      + Math.log(Math.max(fluxSimilarity, 1e-9)) * 0.35
      + Math.log(Math.max(grainScore, 1e-9)) * 0.25,
  );

  return {
    version: TEXTURE_DIAGNOSTIC_VERSION,
    status: "scored",
    textureScore: round(textureScore),
    modulationSpectrum: {
      score: round(modulationScore),
      distributionSimilarity: round(modulationDistribution),
      depthSimilarity: round(modulationDepth),
      referenceDepthDb: round(referenceModulation.depthDb, 3),
      candidateDepthDb: round(candidateModulation.depthDb, 3),
      bandEdgesHz: MODULATION_EDGES_HZ,
      referenceBands: Array.from(referenceModulation.bands, (value) => round(value)),
      candidateBands: Array.from(candidateModulation.bands, (value) => round(value)),
    },
    spectralFlux: {
      score: round(fluxSimilarity),
      distributionSimilarity: round(fluxDistributionSimilarity),
      quantileSimilarity: round(fluxQuantileSimilarity),
      referenceQuantiles: referenceGrain.fluxQuantiles,
      candidateQuantiles: candidateGrain.fluxQuantiles,
    },
    grainStatistics: {
      score: round(grainScore),
      crestSimilarity: round(crestSimilarity),
      zeroCrossingSimilarity: round(crossingSimilarity),
      referenceCrestQuantiles: referenceGrain.crestQuantiles,
      candidateCrestQuantiles: candidateGrain.crestQuantiles,
      referenceZeroCrossingQuantiles: referenceGrain.crossingQuantiles,
      candidateZeroCrossingQuantiles: candidateGrain.crossingQuantiles,
    },
    continuity: {
      gestureThresholdRelativeToPeak: 0.05,
      referenceGestureCoverage: round(referenceModulation.lowEnergyCoverage),
      candidateGestureCoverage: round(candidateModulation.lowEnergyCoverage),
      numericalFloorDbfs: -84,
      referenceNumericalFloorCoverage: round(referenceModulation.coverageByDbfs[-84]),
      candidateNumericalFloorCoverage: round(candidateModulation.coverageByDbfs[-84]),
      perceptualBedFloorDbfs: -66,
      referencePerceptualBedCoverage: round(referenceModulation.coverageByDbfs[-66]),
      candidatePerceptualBedCoverage: round(candidateModulation.coverageByDbfs[-66]),
      referenceCoverageByDbfs: Object.fromEntries(
        Object.entries(referenceModulation.coverageByDbfs)
          .map(([db, coverage]) => [db, round(coverage)]),
      ),
      candidateCoverageByDbfs: Object.fromEntries(
        Object.entries(candidateModulation.coverageByDbfs)
          .map(([db, coverage]) => [db, round(coverage)]),
      ),
      note: "The numerical floor detects literal holes. The -66 dBFS one-way target is an audible-bed proxy and does not penalize exceeding source coverage.",
    },
    phaseInvariant: true,
    targets: TEXTURE_TARGETS,
    referenceSignal,
    candidateSignal,
    config: {
      sampleRate: SAMPLE_RATE,
      modulationFrameMs: 1,
      spectralFftSize: SPECTRAL_FFT_SIZE,
      spectralHopMs: SPECTRAL_HOP_SAMPLES / SAMPLE_RATE * 1_000,
      spectralBandCount: SPECTRAL_BAND_COUNT,
    },
  };
}

function runCli() {
  const arguments_ = process.argv.slice(2);
  const json = arguments_.includes("--json");
  const paths = arguments_.filter((argument) => !argument.startsWith("--"));
  const [referencePath, candidatePath] = paths;
  if (!referencePath || !candidatePath) {
    console.error(
      "Usage: node scripts/audio-texture-diagnostics.mjs <reference> <candidate> [--json]",
    );
    process.exitCode = 1;
    return;
  }
  const result = analyzeTextureMatch(
    decodeAudio(referencePath),
    decodeAudio(candidatePath),
  );
  if (json) console.log(JSON.stringify(result, null, 2));
  else if (result.textureScore === null) console.log(result.status);
  else console.log(
    `texture=${result.textureScore.toFixed(3)}`
      + ` modulation=${result.modulationSpectrum.score.toFixed(3)}`
      + ` flux=${result.spectralFlux.score.toFixed(3)}`
      + ` grain=${result.grainStatistics.score.toFixed(3)}`,
  );
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) runCli();
