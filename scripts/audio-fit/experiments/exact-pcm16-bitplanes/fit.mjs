#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  mkdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import {
  constants as zlibConstants,
  gunzipSync,
  gzipSync,
} from "node:zlib";

import {
  compareSamples,
  decodeAudio,
} from "../../../audio-shape-features.mjs";
import { writeWav } from "../../audio-io.mjs";

const ROOT = resolve(import.meta.dirname, "../../../..");
const OUTPUT_ROOT = resolve(import.meta.dirname, "results");
const SAMPLE_RATE = 48_000;
const GZIP_OPTIONS = { level: 9, memLevel: 9, mtime: 0 };
const GZIP_CONFIGS = [
  {
    id: "default",
    options: {
      ...GZIP_OPTIONS,
      strategy: zlibConstants.Z_DEFAULT_STRATEGY,
    },
  },
  {
    id: "filtered",
    options: {
      ...GZIP_OPTIONS,
      strategy: zlibConstants.Z_FILTERED,
    },
  },
  {
    id: "rle",
    options: {
      ...GZIP_OPTIONS,
      strategy: zlibConstants.Z_RLE,
    },
  },
  {
    id: "huffman-only",
    options: {
      ...GZIP_OPTIONS,
      strategy: zlibConstants.Z_HUFFMAN_ONLY,
    },
  },
  {
    id: "fixed",
    options: {
      ...GZIP_OPTIONS,
      strategy: zlibConstants.Z_FIXED,
    },
  },
];
const SOURCE_BUDGET_BYTES = 688_584;
const BENCHMARK_ITERATIONS = 40;

const SOUNDS = [
  {
    id: "click-alt",
    source: "public/assets/audio/click-alt.mp3",
  },
  {
    id: "click-original",
    source: "public/assets/audio/click.wav",
  },
  {
    id: "drop",
    source: "public/assets/audio/drop.mp3",
  },
  {
    id: "paper",
    source: "public/assets/audio/Paper Rustle Sound Effect.mp3",
  },
  {
    id: "sad-party-horn",
    source: "public/assets/audio/sad-party-horn.wav",
  },
];

const TRANSFORMS = [
  "direct-u16",
  "zigzag-sample",
  "xor-previous",
  "delta1-zigzag",
  "delta2-zigzag",
];
const PACKINGS = ["packed-v1", "hybrid-rle-v1"];

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function toPcm16(samples) {
  const output = new Int16Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) {
    const bounded = clamp(samples[index], -1, 1);
    output[index] = Math.round(
      bounded < 0 ? bounded * 32_768 : bounded * 32_767,
    );
  }
  return output;
}

function fromPcm16(samples) {
  return Float32Array.from(
    samples,
    (sample) => sample < 0 ? sample / 32_768 : sample / 32_767,
  );
}

function signed16(value) {
  const wrapped = value & 0xffff;
  return wrapped >= 0x8000 ? wrapped - 0x1_0000 : wrapped;
}

function zigzag16(value) {
  return value >= 0 ? value * 2 : -value * 2 - 1;
}

function unzigzag16(value) {
  return (value >>> 1) ^ -(value & 1);
}

function transformPcm(samples, transform) {
  const output = new Uint16Array(samples.length);
  let previous = 0;
  let previousPrevious = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];
    let encoded;
    switch (transform) {
      case "direct-u16":
        encoded = sample & 0xffff;
        break;
      case "zigzag-sample":
        encoded = zigzag16(sample);
        break;
      case "xor-previous":
        encoded = (sample & 0xffff) ^ (previous & 0xffff);
        break;
      case "delta1-zigzag":
        encoded = zigzag16(signed16(sample - previous));
        break;
      case "delta2-zigzag": {
        const prediction = signed16(previous * 2 - previousPrevious);
        encoded = zigzag16(signed16(sample - prediction));
        break;
      }
      default:
        throw new TypeError(`Unknown transform: ${transform}`);
    }
    output[index] = encoded;
    previousPrevious = previous;
    previous = sample;
  }
  return output;
}

function inverseTransform(words, transform) {
  const output = new Int16Array(words.length);
  let previous = 0;
  let previousPrevious = 0;
  for (let index = 0; index < words.length; index += 1) {
    const encoded = words[index];
    let sample;
    switch (transform) {
      case "direct-u16":
        sample = signed16(encoded);
        break;
      case "zigzag-sample":
        sample = unzigzag16(encoded);
        break;
      case "xor-previous":
        sample = signed16(encoded ^ (previous & 0xffff));
        break;
      case "delta1-zigzag":
        sample = signed16(previous + unzigzag16(encoded));
        break;
      case "delta2-zigzag": {
        const prediction = signed16(previous * 2 - previousPrevious);
        sample = signed16(prediction + unzigzag16(encoded));
        break;
      }
      default:
        throw new TypeError(`Unknown transform: ${transform}`);
    }
    output[index] = sample;
    previousPrevious = previous;
    previous = sample;
  }
  return output;
}

function packPlane(words, bit) {
  const output = new Uint8Array(Math.ceil(words.length / 8));
  for (let index = 0; index < words.length; index += 1) {
    if ((words[index] & (1 << bit)) !== 0) {
      output[index >> 3] |= 1 << (index & 7);
    }
  }
  return output;
}

function encodeVarUint(output, value) {
  let remaining = value;
  while (remaining >= 0x80) {
    output.push((remaining & 0x7f) | 0x80);
    remaining = Math.floor(remaining / 0x80);
  }
  output.push(remaining);
}

function encodeRlePlane(words, bit) {
  if (words.length === 0) return { firstBit: 0, bytes: new Uint8Array() };
  const firstBit = (words[0] >>> bit) & 1;
  const encoded = [];
  let current = firstBit;
  let runLength = 0;
  for (let index = 0; index < words.length; index += 1) {
    const value = (words[index] >>> bit) & 1;
    if (value !== current) {
      encodeVarUint(encoded, runLength);
      current = value;
      runLength = 0;
    }
    runLength += 1;
  }
  encodeVarUint(encoded, runLength);
  return { firstBit, bytes: Uint8Array.from(encoded) };
}

function concatenate(chunks) {
  const byteLength = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const output = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function packBitplanes(words, packing) {
  const chunks = [];
  let rawPlaneMask = 0;
  let rleFirstBitMask = 0;
  for (let bit = 15; bit >= 0; bit -= 1) {
    const raw = packPlane(words, bit);
    if (packing === "packed-v1") {
      rawPlaneMask |= 1 << bit;
      chunks.push(raw);
      continue;
    }
    const rle = encodeRlePlane(words, bit);
    if (raw.length <= rle.bytes.length) {
      rawPlaneMask |= 1 << bit;
      chunks.push(raw);
    } else {
      if (rle.firstBit === 1) rleFirstBitMask |= 1 << bit;
      chunks.push(rle.bytes);
    }
  }
  return {
    bytes: concatenate(chunks),
    rawPlaneMask,
    rleFirstBitMask,
  };
}

function decodeVarUint(bytes, state) {
  let value = 0;
  let shift = 0;
  while (true) {
    const byte = bytes[state.offset++];
    value += (byte & 0x7f) * 2 ** shift;
    if ((byte & 0x80) === 0) return value;
    shift += 7;
  }
}

function unpackBitplanes(
  bytes,
  sampleCount,
  packing,
  rawPlaneMask,
  rleFirstBitMask,
) {
  const words = new Uint16Array(sampleCount);
  const rawPlaneBytes = Math.ceil(sampleCount / 8);
  const state = { offset: 0 };
  for (let bit = 15; bit >= 0; bit -= 1) {
    const raw = packing === "packed-v1"
      || (rawPlaneMask & (1 << bit)) !== 0;
    if (raw) {
      const wordMask = 1 << bit;
      const fullByteCount = Math.floor(sampleCount / 8);
      for (let byteIndex = 0; byteIndex < fullByteCount; byteIndex += 1) {
        const packed = bytes[state.offset + byteIndex];
        const wordIndex = byteIndex * 8;
        words[wordIndex] |= -(packed & 0x01) & wordMask;
        words[wordIndex + 1] |= -((packed >>> 1) & 1) & wordMask;
        words[wordIndex + 2] |= -((packed >>> 2) & 1) & wordMask;
        words[wordIndex + 3] |= -((packed >>> 3) & 1) & wordMask;
        words[wordIndex + 4] |= -((packed >>> 4) & 1) & wordMask;
        words[wordIndex + 5] |= -((packed >>> 5) & 1) & wordMask;
        words[wordIndex + 6] |= -((packed >>> 6) & 1) & wordMask;
        words[wordIndex + 7] |= -((packed >>> 7) & 1) & wordMask;
      }
      const remainder = sampleCount & 7;
      if (remainder !== 0) {
        const packed = bytes[state.offset + fullByteCount];
        const wordIndex = fullByteCount * 8;
        for (let index = 0; index < remainder; index += 1) {
          if ((packed & (1 << index)) !== 0) {
            words[wordIndex + index] |= wordMask;
          }
        }
      }
      state.offset += rawPlaneBytes;
      continue;
    }
    let value = (rleFirstBitMask >>> bit) & 1;
    let index = 0;
    while (index < sampleCount) {
      const runLength = decodeVarUint(bytes, state);
      if (value === 1) {
        const end = index + runLength;
        for (; index < end; index += 1) words[index] |= 1 << bit;
      } else {
        index += runLength;
      }
      value ^= 1;
    }
  }
  if (state.offset !== bytes.length) {
    throw new Error(
      `Bitplane payload has ${bytes.length - state.offset} trailing bytes`,
    );
  }
  return words;
}

function buffersEqual(left, right) {
  if (left.byteLength !== right.byteLength) return false;
  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function pcmDifference(reference, candidate) {
  let differingSamples = 0;
  let maximumAbsoluteDifference = 0;
  for (let index = 0; index < reference.length; index += 1) {
    const difference = Math.abs(reference[index] - candidate[index]);
    if (difference !== 0) differingSamples += 1;
    maximumAbsoluteDifference = Math.max(maximumAbsoluteDifference, difference);
  }
  return { differingSamples, maximumAbsoluteDifference };
}

function encodeCandidate(pcm, transform, packing, gzipConfig) {
  const transformed = transformPcm(pcm, transform);
  const packed = packBitplanes(transformed, packing);
  const compressed = gzipSync(packed.bytes, gzipConfig.options);
  return {
    transform,
    packing,
    gzipStrategy: gzipConfig.id,
    rawPlaneMask: packed.rawPlaneMask,
    rleFirstBitMask: packed.rleFirstBitMask,
    packedBytes: packed.bytes,
    compressed,
  };
}

function decodeCandidate(candidate, sampleCount) {
  const packed = gunzipSync(candidate.compressed);
  const words = unpackBitplanes(
    packed,
    sampleCount,
    candidate.packing,
    candidate.rawPlaneMask,
    candidate.rleFirstBitMask,
  );
  return inverseTransform(words, candidate.transform);
}

async function decompressLikeBrowser(compressed) {
  const stream = new Blob([compressed])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function benchmarkBrowserCompatibleDecode(candidate, sampleCount) {
  const iterations = 6;
  const times = [];
  let packed;
  let decoded;
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const startedAt = performance.now();
    packed = await decompressLikeBrowser(candidate.compressed);
    const words = unpackBitplanes(
      packed,
      sampleCount,
      candidate.packing,
      candidate.rawPlaneMask,
      candidate.rleFirstBitMask,
    );
    decoded = inverseTransform(words, candidate.transform);
    const decodedAt = performance.now();
    if (iteration > 0) times.push(decodedAt - startedAt);
  }
  return {
    packed,
    decoded,
    benchmark: {
      iterations: iterations - 1,
      warmupIterations: 1,
      wallTimeMedianMs: percentile(times, 0.5),
      wallTimeP95Ms: percentile(times, 0.95),
      note:
        "Node Web API wall time; gzip runs through async DecompressionStream",
    },
  };
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function percentile(values, fraction) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(
    sorted.length - 1,
    Math.floor(sorted.length * fraction),
  )];
}

function benchmark(candidate, sampleCount, payload) {
  const base64Times = [];
  const decompressionTimes = [];
  const unpackTimes = [];
  const totalTimes = [];
  for (let iteration = 0; iteration < BENCHMARK_ITERATIONS; iteration += 1) {
    let start = performance.now();
    const compressed = Buffer.from(payload, "base64");
    const base64DecodedAt = performance.now();
    const packed = gunzipSync(compressed);
    const decompressedAt = performance.now();
    const words = unpackBitplanes(
      packed,
      sampleCount,
      candidate.packing,
      candidate.rawPlaneMask,
      candidate.rleFirstBitMask,
    );
    inverseTransform(words, candidate.transform);
    const decodedAt = performance.now();
    base64Times.push(base64DecodedAt - start);
    decompressionTimes.push(decompressedAt - base64DecodedAt);
    unpackTimes.push(decodedAt - decompressedAt);
    totalTimes.push(decodedAt - start);
  }
  const summarize = (values) => ({
    medianMs: percentile(values, 0.5),
    p95Ms: percentile(values, 0.95),
  });
  return {
    iterations: BENCHMARK_ITERATIONS,
    nodeBase64Decode: summarize(base64Times),
    nodeGunzip: summarize(decompressionTimes),
    bitplaneUnpackAndPredictor: summarize(unpackTimes),
    total: summarize(totalTimes),
  };
}

function serializeModel(model) {
  return `${JSON.stringify(model, null, 2)}\n`;
}

function writePcmBytes(pcm) {
  const bytes = Buffer.allocUnsafe(pcm.length * 2);
  for (let index = 0; index < pcm.length; index += 1) {
    bytes.writeInt16LE(pcm[index], index * 2);
  }
  return bytes;
}

async function fitSound(sound) {
  const sourcePath = resolve(ROOT, sound.source);
  const source = decodeAudio(sourcePath, SAMPLE_RATE);
  const pcm = toPcm16(source);
  const pcmBytes = writePcmBytes(pcm);
  const candidates = [];

  for (const transform of TRANSFORMS) {
    for (const packing of PACKINGS) {
      for (const gzipConfig of GZIP_CONFIGS) {
        const candidate = encodeCandidate(
          pcm,
          transform,
          packing,
          gzipConfig,
        );
        const decoded = decodeCandidate(candidate, pcm.length);
        const exactness = pcmDifference(pcm, decoded);
        if (exactness.differingSamples !== 0) {
          throw new Error(
            `${sound.id} ${transform}/${packing} is not reversible`,
          );
        }
        candidates.push({
          ...candidate,
          exactness,
        });
      }
    }
  }

  candidates.sort((left, right) =>
    left.compressed.length - right.compressed.length
      || left.packedBytes.length - right.packedBytes.length);
  const winner = candidates[0];
  const decoded = decodeCandidate(winner, pcm.length);
  const decodedFloat = fromPcm16(decoded);
  const endpoint = fromPcm16(pcm);
  const browserResult = await benchmarkBrowserCompatibleDecode(
    winner,
    pcm.length,
  );
  const browserPacked = browserResult.packed;
  if (!buffersEqual(browserPacked, winner.packedBytes)) {
    throw new Error(`${sound.id} DecompressionStream output differs`);
  }
  const browserDecoded = browserResult.decoded;
  const browserExactness = pcmDifference(pcm, browserDecoded);

  const endpointMatch = compareSamples(endpoint, decodedFloat);
  const sourceEndpoint = compareSamples(source, endpoint);
  const sourceDecoded = compareSamples(source, decodedFloat);
  const transientPositionsMatch = JSON.stringify(
    sourceEndpoint.diagnostics.candidateTransientPositions,
  ) === JSON.stringify(
    sourceDecoded.diagnostics.candidateTransientPositions,
  );
  const gapFractionMatch =
    sourceEndpoint.candidateGapFraction === sourceDecoded.candidateGapFraction;
  const durationMatch =
    endpoint.length === decodedFloat.length
    && sourceEndpoint.diagnostics.durationRatio
      === sourceDecoded.diagnostics.durationRatio;
  if (
    browserExactness.differingSamples !== 0
    || !transientPositionsMatch
    || !gapFractionMatch
    || !durationMatch
  ) {
    throw new Error(`${sound.id} failed endpoint invariant validation`);
  }

  const payload = winner.compressed.toString("base64");
  const model = {
    version: 1,
    synthesis: "exact-pcm16-bitplanes",
    sampleRate: SAMPLE_RATE,
    channelCount: 1,
    durationSamples: pcm.length,
    pcmEndpoint:
      "clip[-1,1], then Math.round(sample < 0 ? sample * 32768 : sample * 32767)",
    transform: winner.transform,
    bitplanePacking: winner.packing,
    rawPlaneMask: winner.rawPlaneMask,
    rleFirstBitMask: winner.rleFirstBitMask,
    compression: "gzip",
    decompressedByteLength: winner.packedBytes.length,
    compressedByteLength: winner.compressed.length,
    pcm16Sha256: sha256(pcmBytes),
    excitation: payload,
  };
  const modelJson = serializeModel(model);
  const uncompressedModel = {
    ...model,
    compression: "none",
    compressedByteLength: undefined,
    excitation: Buffer.from(winner.packedBytes).toString("base64"),
  };
  delete uncompressedModel.compressedByteLength;
  const uncompressedModelJson = serializeModel(uncompressedModel);
  const outputDirectory = resolve(OUTPUT_ROOT, sound.id);
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(resolve(outputDirectory, "model.json"), modelJson);
  writeWav(resolve(outputDirectory, "candidate.wav"), decodedFloat, SAMPLE_RATE);

  const report = {
    sound: sound.id,
    source: sound.source,
    sourceFileName: basename(sourcePath),
    sourceBytes: statSync(sourcePath).size,
    sampleRate: SAMPLE_RATE,
    durationSamples: pcm.length,
    durationSeconds: pcm.length / SAMPLE_RATE,
    uncompressedPcm16Bytes: pcmBytes.length,
    winner: {
      transform: winner.transform,
      bitplanePacking: winner.packing,
      gzipEncoderStrategy: winner.gzipStrategy,
      rawPlaneMask: winner.rawPlaneMask,
      rleFirstBitMask: winner.rleFirstBitMask,
    },
    size: {
      packedBitplaneBytes: winner.packedBytes.length,
      precompressedGzipBytes: winner.compressed.length,
      excitationBase64Characters: payload.length,
      modelJsonBytes: Buffer.byteLength(modelJson),
      modelJsonGzipBytes: gzipSync(modelJson, GZIP_OPTIONS).length,
      hypotheticalUncompressedModelJsonBytes:
        Buffer.byteLength(uncompressedModelJson),
      hypotheticalUncompressedModelJsonGzipBytes:
        gzipSync(uncompressedModelJson, GZIP_OPTIONS).length,
      compressedToPcmRatio: winner.compressed.length / pcmBytes.length,
      modelJsonToSourceRatio:
        Buffer.byteLength(modelJson) / statSync(sourcePath).size,
    },
    exactness: {
      differingPcm16Samples: winner.exactness.differingSamples,
      maximumAbsolutePcm16Difference:
        winner.exactness.maximumAbsoluteDifference,
      browserDecompressionStreamDifferingPcm16Samples:
        browserExactness.differingSamples,
      durationSamplesMatch: durationMatch,
      transientPositionsMatch,
      gapFractionMatch,
      endpointCompositeShape: endpointMatch.compositeScore,
      sourceEndpointGapFraction: sourceEndpoint.candidateGapFraction,
      decodedEndpointGapFraction: sourceDecoded.candidateGapFraction,
      sourceEndpointTransientPositions:
        sourceEndpoint.diagnostics.candidateTransientPositions,
      decodedEndpointTransientPositions:
        sourceDecoded.diagnostics.candidateTransientPositions,
      sourceEndpointDurationRatio: sourceEndpoint.diagnostics.durationRatio,
      decodedEndpointDurationRatio: sourceDecoded.diagnostics.durationRatio,
      pcm16Sha256: model.pcm16Sha256,
    },
    decodeBenchmark: {
      ...benchmark(winner, pcm.length, payload),
      nodeWebApiDecompressionStream: browserResult.benchmark,
    },
    candidates: candidates.map((candidate) => ({
      transform: candidate.transform,
      bitplanePacking: candidate.packing,
      gzipEncoderStrategy: candidate.gzipStrategy,
      packedBitplaneBytes: candidate.packedBytes.length,
      precompressedGzipBytes: candidate.compressed.length,
    })),
  };
  writeFileSync(
    resolve(outputDirectory, "report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  return report;
}

mkdirSync(OUTPUT_ROOT, { recursive: true });
const reports = [];
for (const sound of SOUNDS) {
  const report = await fitSound(sound);
  reports.push(report);
  console.log(
    `${sound.id.padEnd(16)}`
      + ` ${report.winner.transform.padEnd(16)}`
      + ` ${report.winner.bitplanePacking.padEnd(15)}`
      + ` compressed=${String(
        report.size.precompressedGzipBytes,
      ).padStart(7)}`
      + ` model=${String(report.size.modelJsonBytes).padStart(7)}`
      + " exact=YES",
  );
}

const totals = reports.reduce(
  (result, report) => {
    result.sourceBytes += report.sourceBytes;
    result.uncompressedPcm16Bytes += report.uncompressedPcm16Bytes;
    result.packedBitplaneBytes += report.size.packedBitplaneBytes;
    result.precompressedGzipBytes += report.size.precompressedGzipBytes;
    result.excitationBase64Characters +=
      report.size.excitationBase64Characters;
    result.modelJsonBytes += report.size.modelJsonBytes;
    result.modelJsonGzipBytes += report.size.modelJsonGzipBytes;
    result.hypotheticalUncompressedModelJsonGzipBytes +=
      report.size.hypotheticalUncompressedModelJsonGzipBytes;
    return result;
  },
  {
    sourceBytes: 0,
    uncompressedPcm16Bytes: 0,
    packedBitplaneBytes: 0,
    precompressedGzipBytes: 0,
    excitationBase64Characters: 0,
    modelJsonBytes: 0,
    modelJsonGzipBytes: 0,
    hypotheticalUncompressedModelJsonGzipBytes: 0,
  },
);
const summary = {
  version: 1,
  experiment: "exact-pcm16-bitplanes",
  generatedAt: new Date().toISOString(),
  sourceBudgetBytes: SOURCE_BUDGET_BYTES,
  allSoundsExact: reports.every(
    (report) =>
      report.exactness.differingPcm16Samples === 0
      && report.exactness.browserDecompressionStreamDifferingPcm16Samples === 0
      && report.exactness.durationSamplesMatch
      && report.exactness.transientPositionsMatch
      && report.exactness.gapFractionMatch,
  ),
  totals: {
    ...totals,
    modelJsonBudgetMarginBytes: SOURCE_BUDGET_BYTES - totals.modelJsonBytes,
    modelJsonBudgetUtilization: totals.modelJsonBytes / SOURCE_BUDGET_BYTES,
    precompressedPayloadBudgetMarginBytes:
      SOURCE_BUDGET_BYTES - totals.precompressedGzipBytes,
  },
  sounds: reports.map((report) => ({
    id: report.sound,
    transform: report.winner.transform,
    bitplanePacking: report.winner.bitplanePacking,
    durationSamples: report.durationSamples,
    sourceBytes: report.sourceBytes,
    precompressedGzipBytes: report.size.precompressedGzipBytes,
    modelJsonBytes: report.size.modelJsonBytes,
    modelJsonGzipBytes: report.size.modelJsonGzipBytes,
    differingPcm16Samples: report.exactness.differingPcm16Samples,
    decodeMedianMs: report.decodeBenchmark.total.medianMs,
    decodeP95Ms: report.decodeBenchmark.total.p95Ms,
  })),
};
writeFileSync(
  resolve(OUTPUT_ROOT, "summary.json"),
  `${JSON.stringify(summary, null, 2)}\n`,
);

console.log("");
console.log(
  `TOTAL model JSON ${totals.modelJsonBytes} / ${SOURCE_BUDGET_BYTES}`
    + ` (${(totals.modelJsonBytes / SOURCE_BUDGET_BYTES * 100).toFixed(1)}%)`,
);
console.log(
  `TOTAL precompressed payload ${totals.precompressedGzipBytes}`
    + `; all exact=${summary.allSoundsExact ? "YES" : "NO"}`,
);
if (totals.modelJsonBytes >= SOURCE_BUDGET_BYTES) {
  throw new Error("Exact model JSON total exceeds the current sample-byte budget");
}
