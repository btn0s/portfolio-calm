import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

export const SAMPLE_RATE = 48_000;
export const TIME_BINS = 96;
export const FFT_SIZE = 2_048;
export const AMPLITUDE_FLOOR_DB = -60;
export const ROLLOFF_PERCENT = 0.85;

const MIN_ANALYSIS_HZ = 40;
const MAX_ANALYSIS_HZ = SAMPLE_RATE / 2;
const LOG_BAND_COUNT = 10;
const SPECTRAL_WINDOWS_PER_BIN = 2;
const ACTIVE_ENVELOPE_THRESHOLD = 0.04;

export const BAND_EDGES_HZ = Array.from(
  { length: LOG_BAND_COUNT + 1 },
  (_, index) => MIN_ANALYSIS_HZ
    * ((MAX_ANALYSIS_HZ / MIN_ANALYSIS_HZ) ** (index / LOG_BAND_COUNT)),
);

// Envelope, band distribution, and transient placement carry most of the weight
// because this scorer targets short UI effects. Centroid and rolloff summarize
// brightness, while ZCR and flatness distinguish tonal from noisy material.
// Absolute level and duration remain modest but explicit parts of exact matching.
export const COMPOSITE_WEIGHTS = Object.freeze({
  amplitudeEnvelope: 0.20,
  frequencyBands: 0.21,
  spectralCentroid: 0.08,
  spectralRolloff: 0.06,
  zeroCrossing: 0.07,
  spectralFlatness: 0.06,
  transientPositions: 0.14,
  rmsLevel: 0.08,
  peakLevel: 0.05,
  duration: 0.05,
});

const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));
const round = (value, digits = 6) => Number(value.toFixed(digits));
const sum = (values) => values.reduce((total, value) => total + value, 0);

export function decodeAudio(path) {
  const pcm = execFileSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      resolve(path),
      "-ac",
      "1",
      "-ar",
      String(SAMPLE_RATE),
      "-f",
      "f32le",
      "-",
    ],
    { maxBuffer: 128 * 1024 * 1024 },
  );

  // Copy the view so its lifetime and alignment are independent of the Buffer.
  return new Float32Array(
    pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength),
  );
}

export function signalStats(samples, sampleRate = SAMPLE_RATE) {
  let squareSum = 0;
  let peak = 0;
  for (const sample of samples) {
    squareSum += sample * sample;
    peak = Math.max(peak, Math.abs(sample));
  }

  const rms = Math.sqrt(squareSum / Math.max(1, samples.length));
  const toDb = (value) => 20 * Math.log10(Math.max(value, 1e-12));
  return {
    durationSeconds: round(samples.length / sampleRate, 4),
    rms: round(rms, 7),
    peak: round(peak, 7),
    rmsDb: round(toDb(rms), 1),
    peakDb: round(toDb(peak), 1),
    // A sparse impact can have a very low whole-file RMS while remaining
    // clearly audible. Require both energy and peak to be below threshold.
    effectivelySilent: toDb(rms) <= -60 && toDb(peak) <= -50,
  };
}

function rmsEnvelope(samples, binCount) {
  const values = new Array(binCount).fill(0);
  for (let bin = 0; bin < binCount; bin += 1) {
    const start = Math.floor((bin / binCount) * samples.length);
    const end = Math.max(start + 1, Math.floor(((bin + 1) / binCount) * samples.length));
    let energy = 0;
    for (let index = start; index < Math.min(end, samples.length); index += 1) {
      energy += samples[index] * samples[index];
    }
    values[bin] = Math.sqrt(energy / Math.max(1, Math.min(end, samples.length) - start));
  }
  return values;
}

function toRelativeDbEnvelope(rmsValues) {
  const maximum = Math.max(...rmsValues, Number.EPSILON);
  return rmsValues.map((value) => {
    const relativeDb = 20 * Math.log10(Math.max(value / maximum, 1e-12));
    return clamp((relativeDb - AMPLITUDE_FLOOR_DB) / -AMPLITUDE_FLOOR_DB);
  });
}

const hannWindow = Float64Array.from(
  { length: FFT_SIZE },
  (_, index) => 0.5 - (0.5 * Math.cos((2 * Math.PI * index) / (FFT_SIZE - 1))),
);

function powerSpectrum(samples, centerIndex) {
  const real = new Float64Array(FFT_SIZE);
  const imaginary = new Float64Array(FFT_SIZE);
  const sourceStart = Math.round(centerIndex - (FFT_SIZE / 2));

  let localMean = 0;
  let localCount = 0;
  for (let index = 0; index < FFT_SIZE; index += 1) {
    const sourceIndex = sourceStart + index;
    if (sourceIndex >= 0 && sourceIndex < samples.length) {
      localMean += samples[sourceIndex];
      localCount += 1;
    }
  }
  localMean /= Math.max(1, localCount);

  for (let index = 0; index < FFT_SIZE; index += 1) {
    const sourceIndex = sourceStart + index;
    const sample = sourceIndex >= 0 && sourceIndex < samples.length
      ? samples[sourceIndex] - localMean
      : 0;
    real[index] = sample * hannWindow[index];
  }

  for (let index = 1, reversed = 0; index < FFT_SIZE; index += 1) {
    let bit = FFT_SIZE >> 1;
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

  for (let length = 2; length <= FFT_SIZE; length *= 2) {
    const angle = (-2 * Math.PI) / length;
    const phaseStepReal = Math.cos(angle);
    const phaseStepImaginary = Math.sin(angle);
    for (let offset = 0; offset < FFT_SIZE; offset += length) {
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
    { length: (FFT_SIZE / 2) + 1 },
    (_, index) => (real[index] * real[index]) + (imaginary[index] * imaginary[index]),
  );
}

function averagedPowerSpectrum(samples, start, end) {
  const result = new Float64Array((FFT_SIZE / 2) + 1);
  const width = Math.max(1, end - start);
  for (let windowIndex = 0; windowIndex < SPECTRAL_WINDOWS_PER_BIN; windowIndex += 1) {
    const center = start + (width * ((windowIndex + 1) / (SPECTRAL_WINDOWS_PER_BIN + 1)));
    const spectrum = powerSpectrum(samples, center);
    for (let index = 0; index < result.length; index += 1) {
      result[index] += spectrum[index] / SPECTRAL_WINDOWS_PER_BIN;
    }
  }
  return result;
}

function normalizeLogFrequency(frequency) {
  if (frequency <= 0) return 0;
  return clamp(
    Math.log(frequency / MIN_ANALYSIS_HZ)
      / Math.log(MAX_ANALYSIS_HZ / MIN_ANALYSIS_HZ),
  );
}

function spectralFeatures(power) {
  const bandEnergy = new Array(LOG_BAND_COUNT).fill(0);
  let totalPower = 0;
  let weightedFrequency = 0;
  const includedPowers = [];

  for (let index = 1; index < power.length; index += 1) {
    const frequency = (index * SAMPLE_RATE) / FFT_SIZE;
    if (frequency < MIN_ANALYSIS_HZ || frequency > MAX_ANALYSIS_HZ) continue;
    const value = power[index];
    totalPower += value;
    weightedFrequency += frequency * value;
    includedPowers.push([frequency, value]);

    let band = BAND_EDGES_HZ.findIndex((edge, edgeIndex) => (
      edgeIndex < BAND_EDGES_HZ.length - 1
      && frequency >= edge
      && frequency < BAND_EDGES_HZ[edgeIndex + 1]
    ));
    if (frequency === MAX_ANALYSIS_HZ) band = LOG_BAND_COUNT - 1;
    if (band >= 0) bandEnergy[band] += value;
  }

  if (totalPower <= Number.EPSILON) {
    return {
      bandDistribution: bandEnergy,
      centroid: 0,
      rolloff: 0,
      flatness: 0,
    };
  }

  const targetPower = totalPower * ROLLOFF_PERCENT;
  let cumulativePower = 0;
  let rolloffFrequency = MIN_ANALYSIS_HZ;
  let logPowerSum = 0;
  for (const [frequency, value] of includedPowers) {
    cumulativePower += value;
    if (cumulativePower >= targetPower && rolloffFrequency === MIN_ANALYSIS_HZ) {
      rolloffFrequency = frequency;
    }
    logPowerSum += Math.log(Math.max(value, 1e-30));
  }

  const arithmeticMean = totalPower / includedPowers.length;
  const geometricMean = Math.exp(logPowerSum / includedPowers.length);
  return {
    bandDistribution: bandEnergy.map((value) => value / totalPower),
    centroid: normalizeLogFrequency(weightedFrequency / totalPower),
    rolloff: normalizeLogFrequency(rolloffFrequency),
    flatness: clamp(geometricMean / Math.max(arithmeticMean, 1e-30)),
  };
}

function zeroCrossingRate(samples, start, end) {
  const boundedEnd = Math.min(end, samples.length);
  if (boundedEnd - start <= 1) return 0;
  let crossings = 0;
  let previous = samples[start];
  for (let index = start + 1; index < boundedEnd; index += 1) {
    const current = samples[index];
    if ((previous < 0 && current >= 0) || (previous >= 0 && current < 0)) crossings += 1;
    previous = current;
  }
  return clamp((crossings / (boundedEnd - start - 1)) / 0.5);
}

function smooth(values) {
  return values.map((_, index) => {
    let total = 0;
    let weight = 0;
    for (let offset = -2; offset <= 2; offset += 1) {
      const sourceIndex = index + offset;
      if (sourceIndex < 0 || sourceIndex >= values.length) continue;
      const localWeight = 3 - Math.abs(offset);
      total += values[sourceIndex] * localWeight;
      weight += localWeight;
    }
    return total / weight;
  });
}

function transientFingerprint(envelope) {
  const smoothed = smooth(envelope);
  const onsetStrength = smoothed.map((value, index) => (
    index === 0 ? value : Math.max(0, value - smoothed[index - 1])
  ));
  const maximum = Math.max(...onsetStrength, 0);
  const threshold = Math.max(0.035, maximum * 0.2);
  const candidates = onsetStrength
    .map((strength, index) => ({ index, strength }))
    .filter(({ index, strength }) => (
      strength >= threshold
      && strength >= (onsetStrength[index - 1] ?? -Infinity)
      && strength >= (onsetStrength[index + 1] ?? -Infinity)
    ))
    .sort((left, right) => right.strength - left.strength);

  const selected = [];
  const minimumDistance = Math.max(2, Math.floor(envelope.length * 0.025));
  for (const candidate of candidates) {
    if (selected.every(({ index }) => Math.abs(index - candidate.index) >= minimumDistance)) {
      selected.push(candidate);
      if (selected.length === 20) break;
    }
  }
  selected.sort((left, right) => left.index - right.index);

  const onsetTotal = sum(onsetStrength);
  return {
    distribution: onsetTotal > Number.EPSILON
      ? onsetStrength.map((value) => value / onsetTotal)
      : onsetStrength,
    positions: selected.map(({ index }) => index / Math.max(1, envelope.length - 1)),
  };
}

export function extractFingerprint(samples, sampleRate = SAMPLE_RATE) {
  if (sampleRate !== SAMPLE_RATE) {
    throw new Error(`Fingerprints require ${SAMPLE_RATE} Hz PCM; received ${sampleRate} Hz`);
  }

  const rawEnvelope = rmsEnvelope(samples, TIME_BINS);
  const amplitudeEnvelope = toRelativeDbEnvelope(rawEnvelope);
  const frequencyBands = [];
  const spectralCentroid = [];
  const spectralRolloff = [];
  const zeroCrossing = [];
  const spectralFlatness = [];

  for (let bin = 0; bin < TIME_BINS; bin += 1) {
    const start = Math.floor((bin / TIME_BINS) * samples.length);
    const end = Math.max(start + 1, Math.floor(((bin + 1) / TIME_BINS) * samples.length));
    const spectral = spectralFeatures(averagedPowerSpectrum(samples, start, end));
    frequencyBands.push(spectral.bandDistribution);
    spectralCentroid.push(spectral.centroid);
    spectralRolloff.push(spectral.rolloff);
    zeroCrossing.push(zeroCrossingRate(samples, start, end));
    spectralFlatness.push(spectral.flatness);
  }

  return {
    amplitudeEnvelope,
    frequencyBands,
    spectralCentroid,
    spectralRolloff,
    zeroCrossing,
    spectralFlatness,
    transients: transientFingerprint(amplitudeEnvelope),
  };
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

function envelopeSimilarity(reference, candidate) {
  let weightedDifference = 0;
  let totalWeight = 0;
  for (let index = 0; index < reference.length; index += 1) {
    const weight = 0.02 + Math.max(reference[index], candidate[index]);
    weightedDifference += weight * Math.abs(reference[index] - candidate[index]);
    totalWeight += weight;
  }
  return clamp(1 - (weightedDifference / totalWeight));
}

function activityWeight(referenceEnvelope, candidateEnvelope, index) {
  const activity = Math.max(referenceEnvelope[index], candidateEnvelope[index]);
  return activity < ACTIVE_ENVELOPE_THRESHOLD ? 0 : activity * activity;
}

function trackSimilarity(reference, candidate, referenceEnvelope, candidateEnvelope) {
  let weightedDifference = 0;
  let totalWeight = 0;
  for (let index = 0; index < reference.length; index += 1) {
    const weight = activityWeight(referenceEnvelope, candidateEnvelope, index);
    if (weight === 0) continue;
    const referenceActive = referenceEnvelope[index] >= ACTIVE_ENVELOPE_THRESHOLD;
    const candidateActive = candidateEnvelope[index] >= ACTIVE_ENVELOPE_THRESHOLD;
    const difference = referenceActive !== candidateActive
      ? 1
      : Math.abs(reference[index] - candidate[index]);
    weightedDifference += weight * difference;
    totalWeight += weight;
  }
  return totalWeight <= Number.EPSILON ? 1 : clamp(1 - (weightedDifference / totalWeight));
}

function bandSimilarity(reference, candidate, referenceEnvelope, candidateEnvelope) {
  let weightedDistance = 0;
  let totalWeight = 0;
  for (let frame = 0; frame < reference.length; frame += 1) {
    const weight = activityWeight(referenceEnvelope, candidateEnvelope, frame);
    if (weight === 0) continue;
    const referenceActive = referenceEnvelope[frame] >= ACTIVE_ENVELOPE_THRESHOLD;
    const candidateActive = candidateEnvelope[frame] >= ACTIVE_ENVELOPE_THRESHOLD;
    let distance = 1;
    if (referenceActive && candidateActive) {
      let squaredRootDifference = 0;
      for (let band = 0; band < reference[frame].length; band += 1) {
        const difference = Math.sqrt(reference[frame][band]) - Math.sqrt(candidate[frame][band]);
        squaredRootDifference += difference * difference;
      }
      distance = clamp(Math.sqrt(squaredRootDifference) / Math.sqrt(2));
    }
    weightedDistance += weight * distance;
    totalWeight += weight;
  }
  return totalWeight <= Number.EPSILON ? 1 : clamp(1 - (weightedDistance / totalWeight));
}

function transientSimilarity(reference, candidate) {
  const referenceTotal = sum(reference.distribution);
  const candidateTotal = sum(candidate.distribution);
  if (referenceTotal <= Number.EPSILON && candidateTotal <= Number.EPSILON) {
    return { score: 1, earthMoverSimilarity: 1, countSimilarity: 1 };
  }
  if (referenceTotal <= Number.EPSILON || candidateTotal <= Number.EPSILON) {
    return { score: 0, earthMoverSimilarity: 0, countSimilarity: 0 };
  }

  let referenceCumulative = 0;
  let candidateCumulative = 0;
  let earthMoverDistance = 0;
  for (let index = 0; index < reference.distribution.length; index += 1) {
    referenceCumulative += reference.distribution[index];
    candidateCumulative += candidate.distribution[index];
    earthMoverDistance += Math.abs(referenceCumulative - candidateCumulative);
  }
  earthMoverDistance /= Math.max(1, reference.distribution.length - 1);
  const earthMoverSimilarity = clamp(1 - earthMoverDistance);
  const maximumCount = Math.max(reference.positions.length, candidate.positions.length);
  const countSimilarity = maximumCount === 0
    ? 1
    : Math.min(reference.positions.length, candidate.positions.length) / maximumCount;
  return {
    score: clamp((earthMoverSimilarity * 0.8) + (countSimilarity * 0.2)),
    earthMoverSimilarity,
    countSimilarity,
  };
}

function gapFraction(values) {
  return values.filter((value) => value <= 0.05).length / values.length;
}

function decibelLevelSimilarity(referenceDb, candidateDb) {
  // A logarithmic level delta matches how amplitude is perceived. Twelve dB is
  // deliberately a soft scale: it scores e^-1 rather than becoming a hard fail.
  return clamp(Math.exp(-Math.abs(referenceDb - candidateDb) / 12));
}

function durationSimilarity(referenceSeconds, candidateSeconds) {
  if (referenceSeconds <= 0 || candidateSeconds <= 0) return 0;
  // Symmetric in either direction: half-length and double-length both score e^-1.
  return clamp(Math.exp(-Math.abs(Math.log(candidateSeconds / referenceSeconds)) / Math.log(2)));
}

function nullScores() {
  return {
    amplitudeEnvelope: null,
    frequencyBands: null,
    spectralCentroid: null,
    spectralRolloff: null,
    zeroCrossing: null,
    spectralFlatness: null,
    noiseCharacter: null,
    transientPositions: null,
    rmsLevel: null,
    peakLevel: null,
    duration: null,
    composite: null,
  };
}

export function compareSamples(referenceSamples, candidateSamples) {
  const referenceSignal = signalStats(referenceSamples);
  const candidateSignal = signalStats(candidateSamples);
  const status = referenceSignal.effectivelySilent
    ? "silent-reference"
    : candidateSignal.effectivelySilent
      ? "silent-candidate"
      : "scored";

  const reference = extractFingerprint(referenceSamples);
  const candidate = extractFingerprint(candidateSamples);
  const envelopeCorrelation = status === "scored"
    ? round(correlation(reference.amplitudeEnvelope, candidate.amplitudeEnvelope))
    : null;
  const base = {
    scoreVersion: "perceptual-shape-v2",
    status,
    compositeScore: null,
    scores: nullScores(),
    weights: COMPOSITE_WEIGHTS,
    envelopeCorrelation,
    referenceGapFraction: status === "scored" ? round(gapFraction(reference.amplitudeEnvelope)) : null,
    candidateGapFraction: status === "scored" ? round(gapFraction(candidate.amplitudeEnvelope)) : null,
    referenceSignal,
    candidateSignal,
    diagnostics: {
      durationRatio: referenceSignal.durationSeconds > 0
        ? round(candidateSignal.durationSeconds / referenceSignal.durationSeconds)
        : null,
      referenceTransientCount: reference.transients.positions.length,
      candidateTransientCount: candidate.transients.positions.length,
      referenceTransientPositions: reference.transients.positions.map((value) => round(value, 4)),
      candidateTransientPositions: candidate.transients.positions.map((value) => round(value, 4)),
      transientEarthMoverSimilarity: null,
      transientCountSimilarity: null,
    },
    featureConfig: {
      sampleRate: SAMPLE_RATE,
      timeBins: TIME_BINS,
      fftSize: FFT_SIZE,
      spectralWindowsPerBin: SPECTRAL_WINDOWS_PER_BIN,
      bandEdgesHz: BAND_EDGES_HZ.map((value) => round(value, 1)),
      amplitudeFloorDb: AMPLITUDE_FLOOR_DB,
      rolloffPercent: ROLLOFF_PERCENT,
      frequencyScale: "logarithmic",
      frequencyBandDistance: "Hellinger",
      transientDistance: "1D Earth Mover (80%) + peak-count agreement (20%)",
      levelDistance: "exp(-absolute dB delta / 12 dB)",
      durationDistance: "exp(-absolute log duration ratio / log(2))",
    },
  };

  if (status !== "scored") return base;

  const transient = transientSimilarity(reference.transients, candidate.transients);
  const rawScores = {
    amplitudeEnvelope: envelopeSimilarity(reference.amplitudeEnvelope, candidate.amplitudeEnvelope),
    frequencyBands: bandSimilarity(
      reference.frequencyBands,
      candidate.frequencyBands,
      reference.amplitudeEnvelope,
      candidate.amplitudeEnvelope,
    ),
    spectralCentroid: trackSimilarity(
      reference.spectralCentroid,
      candidate.spectralCentroid,
      reference.amplitudeEnvelope,
      candidate.amplitudeEnvelope,
    ),
    spectralRolloff: trackSimilarity(
      reference.spectralRolloff,
      candidate.spectralRolloff,
      reference.amplitudeEnvelope,
      candidate.amplitudeEnvelope,
    ),
    zeroCrossing: trackSimilarity(
      reference.zeroCrossing,
      candidate.zeroCrossing,
      reference.amplitudeEnvelope,
      candidate.amplitudeEnvelope,
    ),
    spectralFlatness: trackSimilarity(
      reference.spectralFlatness,
      candidate.spectralFlatness,
      reference.amplitudeEnvelope,
      candidate.amplitudeEnvelope,
    ),
    transientPositions: transient.score,
    rmsLevel: decibelLevelSimilarity(referenceSignal.rmsDb, candidateSignal.rmsDb),
    peakLevel: decibelLevelSimilarity(referenceSignal.peakDb, candidateSignal.peakDb),
    duration: durationSimilarity(referenceSignal.durationSeconds, candidateSignal.durationSeconds),
  };
  const composite = Object.entries(COMPOSITE_WEIGHTS).reduce(
    (total, [feature, weight]) => total + (rawScores[feature] * weight),
    0,
  );
  const scores = Object.fromEntries(
    Object.entries(rawScores).map(([feature, score]) => [feature, round(score)]),
  );
  scores.noiseCharacter = round(
    ((rawScores.zeroCrossing * COMPOSITE_WEIGHTS.zeroCrossing)
      + (rawScores.spectralFlatness * COMPOSITE_WEIGHTS.spectralFlatness))
      / (COMPOSITE_WEIGHTS.zeroCrossing + COMPOSITE_WEIGHTS.spectralFlatness),
  );
  scores.composite = round(composite);

  return {
    ...base,
    compositeScore: scores.composite,
    scores,
    diagnostics: {
      ...base.diagnostics,
      transientEarthMoverSimilarity: round(transient.earthMoverSimilarity),
      transientCountSimilarity: round(transient.countSimilarity),
    },
  };
}

export function sparkline(values) {
  const blocks = "▁▂▃▄▅▆▇█";
  return values.map((value) => blocks[Math.min(7, Math.floor(clamp(value) * 8))]).join("");
}
