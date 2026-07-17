#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { decodeAudio } from "./audio-shape-features.mjs";

const clamp = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(maximum, value));

/** Match the browser audition page's rounded, clipped PCM16 capture endpoint. */
export function quantizePcm16Endpoint(samples) {
  return Int16Array.from(samples, (sample) => {
    const bounded = clamp(sample, -1, 1);
    return Math.round(bounded < 0 ? bounded * 32_768 : bounded * 32_767);
  });
}

export function parsePcm16Wav(buffer) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF"
    || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new TypeError("candidate must be a RIFF/WAVE file");
  }
  let offset = 12;
  let format = null;
  let data = null;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const length = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === "fmt ") {
      format = {
        audioFormat: buffer.readUInt16LE(start),
        channels: buffer.readUInt16LE(start + 2),
        bitsPerSample: buffer.readUInt16LE(start + 14),
      };
    } else if (id === "data") {
      data = buffer.subarray(start, start + length);
    }
    offset = start + length + (length & 1);
  }
  if (!format || !data) throw new TypeError("WAV is missing fmt or data chunk");
  if (format.audioFormat !== 1 || format.channels !== 1
    || format.bitsPerSample !== 16) {
    throw new TypeError("candidate WAV must be mono 16-bit integer PCM");
  }
  const codes = new Int16Array(data.length / 2);
  for (let index = 0; index < codes.length; index += 1) {
    codes[index] = data.readInt16LE(index * 2);
  }
  return codes;
}

export function comparePcm16Codes(reference, candidate) {
  const comparedSamples = Math.min(reference.length, candidate.length);
  let differingSamples = Math.abs(reference.length - candidate.length);
  let maximumCodeDelta = 0;
  let absoluteCodeDelta = 0;
  let squaredCodeDelta = 0;
  let referencePower = 0;
  for (let index = 0; index < comparedSamples; index += 1) {
    const delta = candidate[index] - reference[index];
    if (delta !== 0) differingSamples += 1;
    const absolute = Math.abs(delta);
    maximumCodeDelta = Math.max(maximumCodeDelta, absolute);
    absoluteCodeDelta += absolute;
    squaredCodeDelta += delta * delta;
    referencePower += reference[index] * reference[index];
  }
  const totalSamples = Math.max(reference.length, candidate.length);
  return {
    version: "rounded-pcm16-endpoint-v1",
    exact: differingSamples === 0,
    referenceSamples: reference.length,
    candidateSamples: candidate.length,
    differingSamples,
    matchingFraction: totalSamples === 0
      ? 1
      : (totalSamples - differingSamples) / totalSamples,
    maximumCodeDelta,
    meanAbsoluteCodeDelta: comparedSamples === 0
      ? 0
      : absoluteCodeDelta / comparedSamples,
    signalToErrorDb: squaredCodeDelta === 0
      ? null
      : 10 * Math.log10(referencePower / squaredCodeDelta),
  };
}

export function analyzePcm16Exactness(referencePath, candidateWavPath) {
  const reference = quantizePcm16Endpoint(decodeAudio(resolve(referencePath)));
  const candidate = parsePcm16Wav(readFileSync(resolve(candidateWavPath)));
  return {
    reference: resolve(referencePath),
    candidate: resolve(candidateWavPath),
    ...comparePcm16Codes(reference, candidate),
  };
}

const isMain = process.argv[1]
  && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const [referencePath, candidatePath, jsonFlag] = process.argv.slice(2);
  if (!referencePath || !candidatePath) {
    console.error("Usage: audio-pcm16-exactness.mjs <reference> <candidate.wav> [--json]");
    process.exitCode = 1;
  } else {
    const result = analyzePcm16Exactness(referencePath, candidatePath);
    if (jsonFlag === "--json") {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(
        `pcm16Exact=${result.exact} matching=${(result.matchingFraction * 100).toFixed(6)}%`
          + ` differing=${result.differingSamples}/${result.referenceSamples}`
          + ` maxDelta=${result.maximumCodeDelta}`,
      );
    }
  }
}
