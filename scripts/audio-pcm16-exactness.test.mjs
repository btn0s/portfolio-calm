import assert from "node:assert/strict";
import test from "node:test";

import {
  comparePcm16Codes,
  parsePcm16Wav,
  quantizePcm16Endpoint,
} from "./audio-pcm16-exactness.mjs";

test("quantizePcm16Endpoint matches rounded asymmetric browser capture", () => {
  assert.deepEqual(
    [...quantizePcm16Endpoint([-2, -0.75 / 32_768, 0, 0.75 / 32_767, 2])],
    [-32_768, -1, 0, 1, 32_767],
  );
});

test("comparePcm16Codes reports sample-exact and differing endpoints", () => {
  const reference = Int16Array.from([-32_768, -1, 0, 1, 32_767]);
  assert.equal(comparePcm16Codes(reference, reference).exact, true);
  assert.deepEqual(
    comparePcm16Codes(reference, Int16Array.from([-32_768, -1, 0, 2, 32_767])),
    {
      version: "rounded-pcm16-endpoint-v1",
      exact: false,
      referenceSamples: 5,
      candidateSamples: 5,
      differingSamples: 1,
      matchingFraction: 0.8,
      maximumCodeDelta: 1,
      meanAbsoluteCodeDelta: 0.2,
      signalToErrorDb: 93.31916612372119,
    },
  );
});

test("parsePcm16Wav reads the audition page's mono PCM16 layout", () => {
  const buffer = Buffer.alloc(48);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(40, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(48_000, 24);
  buffer.writeUInt32LE(96_000, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(4, 40);
  buffer.writeInt16LE(-1, 44);
  buffer.writeInt16LE(1, 46);
  assert.deepEqual([...parsePcm16Wav(buffer)], [-1, 1]);
});
