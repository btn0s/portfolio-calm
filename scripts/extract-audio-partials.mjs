import { decodeAudio, extractFingerprint, SAMPLE_RATE } from "./audio-shape-features.mjs";

const args = process.argv.slice(2);
const inputPath = args.shift();
if (!inputPath) {
  console.error(
    "Usage: node scripts/extract-audio-partials.mjs <audio> [time-seconds] [--fft-size 2048] [--offset-ms 4] [--max-partials 16]",
  );
  process.exit(1);
}

let requestedTime;
let FFT_SIZE = 8192;
let MAX_PARTIALS = 16;
let MIN_HZ = 60;
let MAX_HZ = 12_000;
let OFFSET_SECONDS = 0.004;

while (args.length > 0) {
  const argument = args.shift();
  if (!argument.startsWith("--") && requestedTime === undefined) {
    requestedTime = argument;
    continue;
  }
  const value = args.shift();
  if (value === undefined) throw new TypeError(`${argument} requires a value`);
  if (argument === "--fft-size") FFT_SIZE = Number(value);
  else if (argument === "--max-partials") MAX_PARTIALS = Number(value);
  else if (argument === "--min-hz") MIN_HZ = Number(value);
  else if (argument === "--max-hz") MAX_HZ = Number(value);
  else if (argument === "--offset-ms") OFFSET_SECONDS = Number(value) / 1000;
  else throw new TypeError(`Unknown option: ${argument}`);
}

if (!Number.isInteger(FFT_SIZE) || FFT_SIZE < 256 || (FFT_SIZE & (FFT_SIZE - 1)) !== 0) {
  throw new TypeError("--fft-size must be a power of two >= 256");
}
if (!(MAX_PARTIALS > 0) || !(MIN_HZ > 0) || !(MAX_HZ > MIN_HZ)) {
  throw new TypeError("Partial-count and frequency bounds are invalid");
}

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
    const angle = (-2 * Math.PI) / length;
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

function partialsAt(samples, timeSeconds) {
  const real = new Float64Array(FFT_SIZE);
  const imaginary = new Float64Array(FFT_SIZE);
  // Start just after the impact so broadband attack energy does not hide modes.
  const start = Math.max(0, Math.round((timeSeconds + OFFSET_SECONDS) * SAMPLE_RATE));
  for (let index = 0; index < FFT_SIZE; index += 1) {
    const source = start + index;
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (FFT_SIZE - 1));
    real[index] = (samples[source] ?? 0) * window;
  }
  fft(real, imaginary);

  const candidates = [];
  for (let bin = 2; bin < FFT_SIZE / 2 - 1; bin += 1) {
    const frequency = (bin * SAMPLE_RATE) / FFT_SIZE;
    if (frequency < MIN_HZ || frequency > MAX_HZ) continue;
    const magnitude = Math.hypot(real[bin], imaginary[bin]);
    const before = Math.hypot(real[bin - 1], imaginary[bin - 1]);
    const after = Math.hypot(real[bin + 1], imaginary[bin + 1]);
    if (magnitude >= before && magnitude >= after) {
      candidates.push({ frequency, magnitude });
    }
  }

  candidates.sort((left, right) => right.magnitude - left.magnitude);
  const selected = [];
  for (const candidate of candidates) {
    if (selected.every((partial) => Math.abs(partial.frequency - candidate.frequency) > 24)) {
      selected.push(candidate);
      if (selected.length === MAX_PARTIALS) break;
    }
  }
  const maximum = selected[0]?.magnitude ?? 1;
  return selected
    .map(({ frequency, magnitude }) => ({
      frequencyHz: Number(frequency.toFixed(2)),
      relativeDb: Number((20 * Math.log10(magnitude / maximum)).toFixed(1)),
      relativeGain: Number((magnitude / maximum).toFixed(5)),
    }))
    .sort((left, right) => left.frequencyHz - right.frequencyHz);
}

const samples = decodeAudio(inputPath);
const durationSeconds = samples.length / SAMPLE_RATE;
const fingerprint = extractFingerprint(samples);
const times = requestedTime === undefined
  ? fingerprint.transients.positions.map((position) => position * durationSeconds)
  : [Number(requestedTime)];

console.log(JSON.stringify({
  input: inputPath,
  durationSeconds,
  fftSize: FFT_SIZE,
  windowDurationSeconds: Number((FFT_SIZE / SAMPLE_RATE).toFixed(6)),
  offsetSeconds: OFFSET_SECONDS,
  analysis: times.map((timeSeconds) => ({
    timeSeconds: Number(timeSeconds.toFixed(6)),
    partials: partialsAt(samples, timeSeconds),
  })),
}, null, 2));
