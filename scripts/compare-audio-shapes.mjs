import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const jsonOnly = args.includes("--json");
const paths = args.filter((arg) => arg !== "--json");
const [referencePath, candidatePath] = paths;
if (!referencePath || !candidatePath) {
  console.error("Usage: node scripts/compare-audio-shapes.mjs <reference> <candidate>");
  process.exit(1);
}

const BINS = 48;
const SAMPLE_RATE = 48_000;

function decode(path) {
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
    { maxBuffer: 64 * 1024 * 1024 },
  );
  return new Float32Array(pcm.buffer, pcm.byteOffset, pcm.byteLength / 4);
}

function envelope(samples) {
  const values = [];
  for (let bin = 0; bin < BINS; bin += 1) {
    const start = Math.floor((bin / BINS) * samples.length);
    const end = Math.floor(((bin + 1) / BINS) * samples.length);
    let energy = 0;
    for (let index = start; index < end; index += 1) {
      energy += samples[index] * samples[index];
    }
    values.push(Math.sqrt(energy / Math.max(1, end - start)));
  }
  const maximum = Math.max(...values, Number.EPSILON);
  return values.map((value) => value / maximum);
}

function signalStats(samples) {
  let squareSum = 0;
  let peak = 0;
  for (const sample of samples) {
    squareSum += sample * sample;
    peak = Math.max(peak, Math.abs(sample));
  }
  const rms = Math.sqrt(squareSum / Math.max(1, samples.length));
  const toDb = (value) => 20 * Math.log10(Math.max(value, 1e-12));
  return {
    rms: Number(rms.toFixed(7)),
    peak: Number(peak.toFixed(7)),
    rmsDb: Number(toDb(rms).toFixed(1)),
    peakDb: Number(toDb(peak).toFixed(1)),
    effectivelySilent: toDb(rms) <= -60 || toDb(peak) <= -50,
  };
}

function correlation(left, right) {
  const leftMean = left.reduce((sum, value) => sum + value, 0) / left.length;
  const rightMean = right.reduce((sum, value) => sum + value, 0) / right.length;
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
  return numerator / Math.sqrt(leftEnergy * rightEnergy);
}

function sparkline(values) {
  const blocks = "▁▂▃▄▅▆▇█";
  return values.map((value) => blocks[Math.min(7, Math.floor(value * 8))]).join("");
}

function gaps(values) {
  return values.filter((value) => value < 0.08).length / values.length;
}

const referenceSamples = decode(referencePath);
const candidateSamples = decode(candidatePath);
const reference = envelope(referenceSamples);
const candidate = envelope(candidateSamples);
const referenceSignal = signalStats(referenceSamples);
const candidateSignal = signalStats(candidateSamples);
const silentReference = referenceSignal.effectivelySilent;
const silentCandidate = candidateSignal.effectivelySilent;
const status = silentReference
  ? "silent-reference"
  : silentCandidate
    ? "silent-candidate"
    : "scored";
const metrics = {
  status,
  envelopeCorrelation: status !== "scored"
    ? null
    : Number(correlation(reference, candidate).toFixed(3)),
  referenceGapFraction: status !== "scored" ? null : Number(gaps(reference).toFixed(3)),
  candidateGapFraction: status !== "scored" ? null : Number(gaps(candidate).toFixed(3)),
  referenceSignal,
  candidateSignal,
};

if (!jsonOnly) {
  console.log(`reference ${sparkline(reference)}`);
  console.log(`candidate ${sparkline(candidate)}`);
}
console.log(JSON.stringify(metrics, null, jsonOnly ? 0 : 2));
