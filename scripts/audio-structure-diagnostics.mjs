import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  compareSamples,
  decodeAudio,
  SAMPLE_RATE,
  signalStats,
} from "./audio-shape-features.mjs";

// This module deliberately stays separate from the optimizer's objective. It is
// an adversarial diagnostic for matches that look convincing to the coarse
// perceptual-shape-v2 features while still having visibly wrong attacks or
// harmonic ridges.
export const STRUCTURE_DIAGNOSTIC_VERSION = "structure-audit-v1";
export const ENVELOPE_SCALES_MS = Object.freeze([1, 4, 16, 64]);
export const SPECTRAL_FFT_SIZE = 4_096;
export const SPECTRAL_HOP_MS = 8;
export const FINE_BAND_COUNT = 192;

const MIN_FREQUENCY = 45;
const MAX_FREQUENCY = 20_000;
const ENVELOPE_FLOOR_DB = -72;
const SPECTRAL_ACTIVITY_FLOOR_DB = -54;
const RIDGE_TOLERANCE_BANDS = 1;

const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));
const round = (value, digits = 6) => Number(value.toFixed(digits));
const sum = (values) => values.reduce((total, value) => total + value, 0);

function prefixSquares(samples, totalLength = samples.length) {
  const prefix = new Float64Array(totalLength + 1);
  for (let index = 0; index < totalLength; index += 1) {
    const sample = index < samples.length ? samples[index] : 0;
    prefix[index + 1] = prefix[index] + (sample * sample);
  }
  return prefix;
}

function rmsFromPrefix(prefix, start, end) {
  const boundedStart = Math.max(0, Math.min(prefix.length - 1, start));
  const boundedEnd = Math.max(boundedStart + 1, Math.min(prefix.length - 1, end));
  return Math.sqrt(
    Math.max(0, prefix[boundedEnd] - prefix[boundedStart])
      / Math.max(1, boundedEnd - boundedStart),
  );
}

function rmsTrack(prefix, totalLength, windowSamples, hopSamples) {
  const frameCount = Math.max(1, Math.ceil(totalLength / hopSamples));
  const track = new Float64Array(frameCount);
  for (let frame = 0; frame < frameCount; frame += 1) {
    const start = frame * hopSamples;
    track[frame] = rmsFromPrefix(prefix, start, start + windowSamples);
  }
  return track;
}

function relativeDbTrack(values) {
  const maximum = Math.max(...values, Number.EPSILON);
  return Float64Array.from(values, (value) => Math.max(
    ENVELOPE_FLOOR_DB,
    20 * Math.log10(Math.max(value / maximum, 1e-12)),
  ));
}

function correlation(left, right) {
  const leftMean = sum(left) / left.length;
  const rightMean = sum(right) / right.length;
  let numerator = 0;
  let leftEnergy = 0;
  let rightEnergy = 0;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index] - leftMean;
    const b = right[index] - rightMean;
    numerator += a * b;
    leftEnergy += a * a;
    rightEnergy += b * b;
  }
  const denominator = Math.sqrt(leftEnergy * rightEnergy);
  if (denominator <= Number.EPSILON) {
    return left.every((value, index) => Math.abs(value - right[index]) <= 1e-12) ? 1 : 0;
  }
  return clamp(numerator / denominator, -1, 1);
}

function compareEnvelopeScale(referencePrefix, candidatePrefix, totalLength, scaleMs) {
  const windowSamples = Math.max(1, Math.round((scaleMs / 1_000) * SAMPLE_RATE));
  const hopSamples = Math.max(1, Math.round(windowSamples / 2));
  const referenceLinear = rmsTrack(referencePrefix, totalLength, windowSamples, hopSamples);
  const candidateLinear = rmsTrack(candidatePrefix, totalLength, windowSamples, hopSamples);
  const referenceDb = relativeDbTrack(referenceLinear);
  const candidateDb = relativeDbTrack(candidateLinear);

  let weightedError = 0;
  let totalWeight = 0;
  let largestError = 0;
  for (let index = 0; index < referenceDb.length; index += 1) {
    const activityDb = Math.max(referenceDb[index], candidateDb[index]);
    // A small floor makes missing low-level tails and gaps visible without
    // letting long stretches of mutual silence dominate the score.
    const weight = 0.025 + Math.sqrt(10 ** (activityDb / 20));
    const error = Math.abs(referenceDb[index] - candidateDb[index]);
    weightedError += weight * error;
    totalWeight += weight;
    largestError = Math.max(largestError, error);
  }

  const meanAbsoluteErrorDb = weightedError / Math.max(totalWeight, Number.EPSILON);
  return {
    scaleMs,
    frameCount: referenceDb.length,
    similarity: round(Math.exp(-meanAbsoluteErrorDb / 10)),
    correlation: round(correlation(referenceDb, candidateDb)),
    meanAbsoluteErrorDb: round(meanAbsoluteErrorDb, 3),
    largestErrorDb: round(largestError, 3),
  };
}

function multiResolutionEnvelope(referenceSamples, candidateSamples) {
  const totalLength = Math.max(referenceSamples.length, candidateSamples.length);
  const referencePrefix = prefixSquares(referenceSamples, totalLength);
  const candidatePrefix = prefixSquares(candidateSamples, totalLength);
  const scales = ENVELOPE_SCALES_MS.map((scaleMs) => compareEnvelopeScale(
    referencePrefix,
    candidatePrefix,
    totalLength,
    scaleMs,
  ));
  // Geometric averaging prevents one coarse, easy scale from hiding a bad
  // millisecond-scale attack match.
  const score = Math.exp(sum(scales.map(({ similarity }) => Math.log(
    Math.max(similarity, 1e-9),
  ))) / scales.length);
  return { score: round(score), scales };
}

const hannWindow = Float64Array.from(
  { length: SPECTRAL_FFT_SIZE },
  (_, index) => 0.5 - (0.5 * Math.cos((2 * Math.PI * index) / (SPECTRAL_FFT_SIZE - 1))),
);

function powerSpectrum(samples, centerIndex) {
  const real = new Float64Array(SPECTRAL_FFT_SIZE);
  const imaginary = new Float64Array(SPECTRAL_FFT_SIZE);
  const start = Math.round(centerIndex - (SPECTRAL_FFT_SIZE / 2));
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
    real[index] = sample * hannWindow[index];
  }

  for (let index = 1, reversed = 0; index < SPECTRAL_FFT_SIZE; index += 1) {
    let bit = SPECTRAL_FFT_SIZE >> 1;
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

  for (let length = 2; length <= SPECTRAL_FFT_SIZE; length *= 2) {
    const angle = (-2 * Math.PI) / length;
    const phaseStepReal = Math.cos(angle);
    const phaseStepImaginary = Math.sin(angle);
    for (let offset = 0; offset < SPECTRAL_FFT_SIZE; offset += length) {
      let phaseReal = 1;
      let phaseImaginary = 0;
      for (let index = 0; index < length / 2; index += 1) {
        const evenIndex = offset + index;
        const oddIndex = evenIndex + (length / 2);
        const oddReal = (real[oddIndex] * phaseReal) - (imaginary[oddIndex] * phaseImaginary);
        const oddImaginary = (real[oddIndex] * phaseImaginary) + (imaginary[oddIndex] * phaseReal);
        real[oddIndex] = real[evenIndex] - oddReal;
        imaginary[oddIndex] = imaginary[evenIndex] - oddImaginary;
        real[evenIndex] += oddReal;
        imaginary[evenIndex] += oddImaginary;
        const nextPhaseReal = (phaseReal * phaseStepReal) - (phaseImaginary * phaseStepImaginary);
        phaseImaginary = (phaseReal * phaseStepImaginary) + (phaseImaginary * phaseStepReal);
        phaseReal = nextPhaseReal;
      }
    }
  }

  return Float64Array.from(
    { length: (SPECTRAL_FFT_SIZE / 2) + 1 },
    (_, index) => (real[index] * real[index]) + (imaginary[index] * imaginary[index]),
  );
}

function fineLogBands(power) {
  const bands = new Float64Array(FINE_BAND_COUNT);
  const logRange = Math.log(MAX_FREQUENCY / MIN_FREQUENCY);
  for (let index = 1; index < power.length; index += 1) {
    const frequency = (index * SAMPLE_RATE) / SPECTRAL_FFT_SIZE;
    if (frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) continue;
    const position = (Math.log(frequency / MIN_FREQUENCY) / logRange) * (FINE_BAND_COUNT - 1);
    const lower = Math.floor(position);
    const upper = Math.min(FINE_BAND_COUNT - 1, lower + 1);
    const fraction = position - lower;
    bands[lower] += power[index] * (1 - fraction);
    bands[upper] += power[index] * fraction;
  }

  // Half-semitone-ish tolerance: suppress one-bin FFT jitter while retaining
  // the narrow horizontal ridges that the 10-band production score loses.
  const smoothed = new Float64Array(FINE_BAND_COUNT);
  for (let index = 0; index < bands.length; index += 1) {
    smoothed[index] = (bands[index] * 0.5)
      + ((bands[index - 1] ?? 0) * 0.25)
      + ((bands[index + 1] ?? 0) * 0.25);
  }
  const total = sum(smoothed);
  return total > Number.EPSILON
    ? Float64Array.from(smoothed, (value) => value / total)
    : smoothed;
}

function bhattacharyya(reference, candidate) {
  let coefficient = 0;
  for (let index = 0; index < reference.length; index += 1) {
    coefficient += Math.sqrt(reference[index] * candidate[index]);
  }
  return clamp(coefficient);
}

function ridgePeaks(distribution) {
  const candidates = [];
  const maximum = Math.max(...distribution, Number.EPSILON);
  for (let index = 1; index < distribution.length - 1; index += 1) {
    const value = distribution[index];
    if (
      value >= maximum * 0.01
      && value > distribution[index - 1]
      && value >= distribution[index + 1]
    ) {
      candidates.push({ index, value });
    }
  }
  candidates.sort((left, right) => right.value - left.value);
  const peaks = [];
  for (const candidate of candidates) {
    if (peaks.every(({ index }) => Math.abs(index - candidate.index) >= 3)) {
      peaks.push(candidate);
      if (peaks.length === 12) break;
    }
  }
  return peaks;
}

function ridgeTonality(distribution) {
  const crest = Math.max(...distribution) * distribution.length;
  let entropy = 0;
  for (const value of distribution) {
    if (value > Number.EPSILON) entropy -= value * Math.log(value);
  }
  const concentration = 1 - (entropy / Math.log(distribution.length));
  return {
    crest,
    concentration,
    gate: clamp((concentration - 0.12) / 0.42),
  };
}

function directedPeakMatch(sourcePeaks, targetPeaks) {
  const sourceTotal = sum(sourcePeaks.map(({ value }) => value));
  if (sourceTotal <= Number.EPSILON) return 0;
  let matched = 0;
  for (const source of sourcePeaks) {
    const distance = Math.min(
      ...targetPeaks.map((target) => Math.abs(source.index - target.index)),
      Infinity,
    );
    if (distance <= RIDGE_TOLERANCE_BANDS) {
      matched += source.value * Math.exp(-((distance / RIDGE_TOLERANCE_BANDS) ** 2));
    }
  }
  return matched / sourceTotal;
}

function ridgeMatch(referenceBands, candidateBands, previousReferencePeaks) {
  const referencePeaks = ridgePeaks(referenceBands);
  const candidatePeaks = ridgePeaks(candidateBands);
  const recall = directedPeakMatch(referencePeaks, candidatePeaks);
  const precision = directedPeakMatch(candidatePeaks, referencePeaks);
  const frequencyMatch = recall + precision <= Number.EPSILON
    ? 0
    : (2 * recall * precision) / (recall + precision);
  const referenceTonality = ridgeTonality(referenceBands);
  const candidateTonality = ridgeTonality(candidateBands);
  const persistence = previousReferencePeaks === null
    ? 0
    : directedPeakMatch(referencePeaks, previousReferencePeaks);
  const persistenceGate = clamp((persistence - 0.2) / 0.55);
  const sharpnessSimilarity = Math.exp(-Math.abs(
    Math.log((candidateTonality.crest + 1e-9) / (referenceTonality.crest + 1e-9)),
  ));
  return {
    score: (frequencyMatch * 0.75) + (sharpnessSimilarity * 0.25),
    frequencyMatch,
    sharpnessSimilarity,
    referenceGate: referenceTonality.gate * persistenceGate,
    referencePeaks,
  };
}

function highResolutionSpectrum(referenceSamples, candidateSamples) {
  const totalLength = Math.max(referenceSamples.length, candidateSamples.length);
  const referencePrefix = prefixSquares(referenceSamples, totalLength);
  const candidatePrefix = prefixSquares(candidateSamples, totalLength);
  const hopSamples = Math.round((SPECTRAL_HOP_MS / 1_000) * SAMPLE_RATE);
  const frameCount = Math.max(1, Math.ceil(totalLength / hopSamples));
  const referenceRms = rmsTrack(referencePrefix, totalLength, SPECTRAL_FFT_SIZE, hopSamples);
  const candidateRms = rmsTrack(candidatePrefix, totalLength, SPECTRAL_FFT_SIZE, hopSamples);
  const referenceMaximum = Math.max(...referenceRms, Number.EPSILON);
  const candidateMaximum = Math.max(...candidateRms, Number.EPSILON);
  const activityFloor = 10 ** (SPECTRAL_ACTIVITY_FLOOR_DB / 20);

  let spectralTotal = 0;
  let spectralWeight = 0;
  let ridgeTotal = 0;
  let ridgeFrequencyTotal = 0;
  let ridgeSharpnessTotal = 0;
  let ridgeWeight = 0;
  let activeWeight = 0;
  let previousReferencePeaks = null;

  for (let frame = 0; frame < frameCount; frame += 1) {
    const referenceActivity = referenceRms[frame] / referenceMaximum;
    const candidateActivity = candidateRms[frame] / candidateMaximum;
    const activity = Math.max(referenceActivity, candidateActivity);
    if (activity < activityFloor) continue;
    const weight = Math.sqrt(activity);
    activeWeight += weight;
    const center = (frame * hopSamples) + (SPECTRAL_FFT_SIZE / 2);
    const referenceBands = fineLogBands(powerSpectrum(referenceSamples, center));
    const candidateBands = fineLogBands(powerSpectrum(candidateSamples, center));
    const referenceActive = referenceActivity >= activityFloor;
    const candidateActive = candidateActivity >= activityFloor;
    const spectralSimilarity = referenceActive && candidateActive
      ? bhattacharyya(referenceBands, candidateBands)
      : 0;
    spectralTotal += weight * spectralSimilarity;
    spectralWeight += weight;

    if (referenceActive) {
      const ridge = ridgeMatch(referenceBands, candidateBands, previousReferencePeaks);
      previousReferencePeaks = ridge.referencePeaks;
      const localRidgeWeight = weight * ridge.referenceGate;
      ridgeTotal += localRidgeWeight * ridge.score;
      ridgeFrequencyTotal += localRidgeWeight * ridge.frequencyMatch;
      ridgeSharpnessTotal += localRidgeWeight * ridge.sharpnessSimilarity;
      ridgeWeight += localRidgeWeight;
    } else {
      previousReferencePeaks = null;
    }
  }

  return {
    fineSpectrumSimilarity: round(spectralTotal / Math.max(spectralWeight, Number.EPSILON)),
    harmonicRidges: {
      score: ridgeWeight <= Number.EPSILON ? null : round(ridgeTotal / ridgeWeight),
      frequencyMatch: ridgeWeight <= Number.EPSILON
        ? null
        : round(ridgeFrequencyTotal / ridgeWeight),
      sharpnessSimilarity: ridgeWeight <= Number.EPSILON
        ? null
        : round(ridgeSharpnessTotal / ridgeWeight),
      tonalCoverage: round(ridgeWeight / Math.max(activeWeight, Number.EPSILON)),
    },
    frameCount,
    bandCount: FINE_BAND_COUNT,
  };
}

function downsampleAverage(samples, factor, totalLength) {
  const outputLength = Math.ceil(totalLength / factor);
  const output = new Float64Array(outputLength);
  for (let outputIndex = 0; outputIndex < outputLength; outputIndex += 1) {
    let value = 0;
    for (let offset = 0; offset < factor; offset += 1) {
      const sourceIndex = (outputIndex * factor) + offset;
      value += sourceIndex < samples.length ? samples[sourceIndex] : 0;
    }
    output[outputIndex] = value / factor;
  }
  return output;
}

function localCosine(reference, candidate, start, windowLength, lag) {
  let dot = 0;
  let referenceEnergy = 0;
  let candidateEnergy = 0;
  for (let offset = 0; offset < windowLength; offset += 1) {
    const referenceValue = reference[start + offset] ?? 0;
    const candidateValue = candidate[start + offset + lag] ?? 0;
    dot += referenceValue * candidateValue;
    referenceEnergy += referenceValue * referenceValue;
    candidateEnergy += candidateValue * candidateValue;
  }
  const denominator = Math.sqrt(referenceEnergy * candidateEnergy);
  return denominator <= Number.EPSILON ? 0 : dot / denominator;
}

function phaseCoherence(referenceSamples, candidateSamples) {
  const factor = 4;
  const totalLength = Math.max(referenceSamples.length, candidateSamples.length);
  const reference = downsampleAverage(referenceSamples, factor, totalLength);
  const candidate = downsampleAverage(candidateSamples, factor, totalLength);
  const reducedRate = SAMPLE_RATE / factor;
  const windowLength = Math.round(reducedRate * 0.02);
  const hopLength = Math.round(reducedRate * 0.01);
  const maximumLag = Math.round(reducedRate * 0.002);
  const referencePrefix = prefixSquares(reference);
  const maximumRms = Math.sqrt(
    referencePrefix[referencePrefix.length - 1] / Math.max(1, reference.length),
  );

  let signedTotal = 0;
  let absoluteTotal = 0;
  let totalWeight = 0;
  let frameCount = 0;
  for (let start = 0; start < reference.length; start += hopLength) {
    const frameRms = rmsFromPrefix(referencePrefix, start, start + windowLength);
    if (frameRms < maximumRms * 0.05) continue;
    let bestSigned = 0;
    let bestAbsolute = 0;
    for (let lag = -maximumLag; lag <= maximumLag; lag += 1) {
      const local = localCosine(reference, candidate, start, windowLength, lag);
      if (Math.abs(local) > bestAbsolute) {
        bestAbsolute = Math.abs(local);
        bestSigned = local;
      }
    }
    const weight = frameRms / Math.max(maximumRms, Number.EPSILON);
    signedTotal += weight * bestSigned;
    absoluteTotal += weight * bestAbsolute;
    totalWeight += weight;
    frameCount += 1;
  }
  return {
    absolute: round(absoluteTotal / Math.max(totalWeight, Number.EPSILON)),
    signed: round(signedTotal / Math.max(totalWeight, Number.EPSILON)),
    frameCount,
    localLagRangeMs: 2,
    note: "Exact-sample diagnostic only; random-phase noise can sound close while scoring low.",
  };
}

export function analyzeStructuralMatch(referenceSamples, candidateSamples) {
  const referenceSignal = signalStats(referenceSamples);
  const candidateSignal = signalStats(candidateSamples);
  const status = referenceSignal.effectivelySilent
    ? "silent-reference"
    : candidateSignal.effectivelySilent
      ? "silent-candidate"
      : "scored";
  if (status !== "scored") {
    return {
      version: STRUCTURE_DIAGNOSTIC_VERSION,
      status,
      structuralScore: null,
      referenceSignal,
      candidateSignal,
    };
  }

  const envelope = multiResolutionEnvelope(referenceSamples, candidateSamples);
  const spectrum = highResolutionSpectrum(referenceSamples, candidateSamples);
  const phase = phaseCoherence(referenceSamples, candidateSamples);
  const ridgeScore = spectrum.harmonicRidges.score;
  // Only let the ridge score influence the aggregate when horizontal/curved
  // tonal structure occupies a meaningful part of the reference. Random noise
  // has incidental local peaks, but should be judged by the fine spectrum.
  const ridgeWeight = ridgeScore === null || spectrum.harmonicRidges.tonalCoverage < 0.4 ? 0 : 0.15;
  const remainingWeight = 1 - ridgeWeight;
  const structuralScore = (envelope.score * remainingWeight * 0.5)
    + (spectrum.fineSpectrumSimilarity * remainingWeight * 0.5)
    + ((ridgeScore ?? 0) * ridgeWeight);

  return {
    version: STRUCTURE_DIAGNOSTIC_VERSION,
    status,
    structuralScore: round(structuralScore),
    multiResolutionEnvelope: envelope,
    fineSpectrumSimilarity: spectrum.fineSpectrumSimilarity,
    harmonicRidges: spectrum.harmonicRidges,
    phaseCoherence: phase,
    referenceSignal,
    candidateSignal,
    config: {
      sampleRate: SAMPLE_RATE,
      envelopeScalesMs: ENVELOPE_SCALES_MS,
      envelopeFloorDb: ENVELOPE_FLOOR_DB,
      spectralFftSize: SPECTRAL_FFT_SIZE,
      spectralHopMs: SPECTRAL_HOP_MS,
      fineBandCount: FINE_BAND_COUNT,
      ridgeToleranceBands: RIDGE_TOLERANCE_BANDS,
    },
  };
}

export function auditPair(referencePath, candidatePath) {
  const referenceSamples = decodeAudio(referencePath);
  const candidateSamples = decodeAudio(candidatePath);
  const current = compareSamples(referenceSamples, candidateSamples);
  const structural = analyzeStructuralMatch(referenceSamples, candidateSamples);
  const scoreInflation = current.compositeScore === null || structural.structuralScore === null
    ? null
    : round(current.compositeScore - structural.structuralScore);
  return {
    reference: resolve(referencePath),
    candidate: resolve(candidatePath),
    currentComposite: current.compositeScore,
    structuralScore: structural.structuralScore,
    scoreInflation,
    warning: scoreInflation !== null && scoreInflation >= 0.12
      ? "coarse-score-overclaim"
      : null,
    diagnostics: structural,
  };
}

function printResult(label, result) {
  if (result.structuralScore === null) {
    console.log(`${label.padEnd(28)} ${result.diagnostics.status}`);
    return;
  }
  const envelope = result.diagnostics.multiResolutionEnvelope.score.toFixed(3);
  const fine = result.diagnostics.fineSpectrumSimilarity.toFixed(3);
  const ridges = result.diagnostics.harmonicRidges.score?.toFixed(3) ?? "n/a";
  const phase = result.diagnostics.phaseCoherence.absolute.toFixed(3);
  const warning = result.warning ? "  ! OVERCLAIM" : "";
  console.log(
    `${label.padEnd(28)} coarse=${result.currentComposite.toFixed(3)}`
      + ` structure=${result.structuralScore.toFixed(3)}`
      + ` env=${envelope} fine=${fine} ridge=${ridges} phase=${phase}${warning}`,
  );
}

function parseArguments(arguments_) {
  const json = arguments_.includes("--json");
  const batch = arguments_.includes("--batch");
  const paths = arguments_.filter((argument) => !argument.startsWith("--"));
  return { json, batch, paths };
}

function runCli() {
  const { json, batch, paths } = parseArguments(process.argv.slice(2));
  if (batch) {
    const manifest = JSON.parse(readFileSync(resolve(".audio-comparisons/metrics.json"), "utf8"));
    const results = manifest.results
      .filter(({ status }) => status === "scored")
      .map((entry) => ({
        slug: entry.slug,
        ...auditPair(entry.original, entry.synth),
      }));
    if (json) console.log(JSON.stringify({ version: STRUCTURE_DIAGNOSTIC_VERSION, results }, null, 2));
    else for (const result of results) printResult(result.slug, result);
    return;
  }

  const [referencePath, candidatePath] = paths;
  if (!referencePath || !candidatePath) {
    console.error(
      "Usage: node scripts/audio-structure-diagnostics.mjs <reference> <candidate> [--json]\n"
        + "   or: node scripts/audio-structure-diagnostics.mjs --batch [--json]",
    );
    process.exitCode = 1;
    return;
  }
  const result = auditPair(referencePath, candidatePath);
  if (json) console.log(JSON.stringify(result, null, 2));
  else printResult(referencePath, result);
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) runCli();
