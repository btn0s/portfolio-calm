import clickAltExactModel from "../../scripts/audio-fit/experiments/exact-pcm16-bitplanes/results/click-alt/model.json";
import clickOriginalExactModel from "../../scripts/audio-fit/experiments/exact-pcm16-bitplanes/results/click-original/model.json";
import dropExactModel from "../../scripts/audio-fit/experiments/exact-pcm16-bitplanes/results/drop/model.json";
import paperRustleExactModel from "../../scripts/audio-fit/experiments/exact-pcm16-bitplanes/results/paper/model.json";
import partyHornExactModel from "../../scripts/audio-fit/experiments/exact-pcm16-bitplanes/results/sad-party-horn/model.json";

const MAIN_THREAD_SLICE_MS = 1;
const SAMPLE_CHECK_INTERVAL = 1_024;

export interface BlockAdaptiveResidualModel {
  version: 1;
  synthesis: "deterministic-block-adaptive-residual";
  sampleRate: number;
  durationSamples: number;
  activeStart: number;
  activeSampleCount: number;
  bits: number;
  blockSize: number;
  scalesF32: string;
  excitation: string;
}

export interface VariableBitBlockResidualModel {
  version: 2;
  synthesis: "deterministic-variable-bit-block-residual";
  sampleRate: number;
  durationSamples: number;
  activeStart: number;
  activeSampleCount: number;
  baseBits: number;
  highBits: number;
  blockSize: number;
  scalesF32: string;
  highPrecisionBlocks: string;
  excitation: string;
}

export type CompactResidualModel =
  | BlockAdaptiveResidualModel
  | VariableBitBlockResidualModel;

export type ExactPcm16Transform =
  | "direct-u16"
  | "zigzag-sample"
  | "xor-previous"
  | "delta1-zigzag"
  | "delta2-zigzag";

export interface ExactPcm16BitplaneModel {
  version: 1;
  synthesis: "exact-pcm16-bitplanes";
  sampleRate: number;
  channelCount: 1;
  durationSamples: number;
  pcmEndpoint: string;
  transform: ExactPcm16Transform;
  bitplanePacking: "packed-v1" | "hybrid-rle-v1";
  rawPlaneMask: number;
  rleFirstBitMask: number;
  compression: "gzip";
  decompressedByteLength: number;
  compressedByteLength: number;
  pcm16Sha256: string;
  excitation: string;
}

export const COMPACT_SOUND_NAMES = [
  "click",
  "clickOriginal",
  "drop",
  "paperRustle",
  "partyHorn",
] as const;
export type CompactSoundName = (typeof COMPACT_SOUND_NAMES)[number];

const exactModels: Record<
  CompactSoundName,
  ExactPcm16BitplaneModel
> = {
  click: clickAltExactModel as ExactPcm16BitplaneModel,
  clickOriginal: clickOriginalExactModel as ExactPcm16BitplaneModel,
  drop: dropExactModel as ExactPcm16BitplaneModel,
  paperRustle: paperRustleExactModel as ExactPcm16BitplaneModel,
  partyHorn: partyHornExactModel as ExactPcm16BitplaneModel,
};
const preparedPcm = new Map<
  CompactSoundName,
  Promise<Float32Array>
>();


function decodeBase64(value: string) {
  const decoded = atob(value);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }
  return bytes;
}

export interface CompactModelValidation {
  valid: boolean;
  errors: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown) {
  return typeof value === "number"
    && Number.isInteger(value)
    && value > 0;
}

const exactPcm16Transforms = new Set<ExactPcm16Transform>([
  "direct-u16",
  "zigzag-sample",
  "xor-previous",
  "delta1-zigzag",
  "delta2-zigzag",
]);

function decodedBase64ByteLength(value: string) {
  if (value.length === 0 || value.length % 4 !== 0
    || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    return null;
  }
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  return value.length / 4 * 3 - padding;
}

export function validateExactPcm16BitplaneModel(
  value: unknown,
): CompactModelValidation {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { valid: false, errors: ["model must be an object"] };
  }
  if (value.version !== 1) errors.push("version must be 1");
  if (value.synthesis !== "exact-pcm16-bitplanes") {
    errors.push("synthesis must identify the exact PCM16 bitplane codec");
  }
  for (const field of [
    "sampleRate",
    "durationSamples",
    "decompressedByteLength",
    "compressedByteLength",
  ] as const) {
    if (!isPositiveInteger(value[field])) {
      errors.push(`${field} must be a positive integer`);
    }
  }
  if (value.channelCount !== 1) errors.push("channelCount must be 1");
  if (typeof value.pcmEndpoint !== "string" || value.pcmEndpoint.length === 0) {
    errors.push("pcmEndpoint must be a non-empty string");
  }
  if (typeof value.transform !== "string"
    || !exactPcm16Transforms.has(value.transform as ExactPcm16Transform)) {
    errors.push("transform must be a supported reversible predictor");
  }
  if (value.bitplanePacking !== "packed-v1"
    && value.bitplanePacking !== "hybrid-rle-v1") {
    errors.push("bitplanePacking must be packed-v1 or hybrid-rle-v1");
  }
  for (const field of ["rawPlaneMask", "rleFirstBitMask"] as const) {
    if (typeof value[field] !== "number" || !Number.isInteger(value[field])
      || value[field] < 0 || value[field] > 0xffff) {
      errors.push(`${field} must be an unsigned 16-bit integer`);
    }
  }
  if (value.bitplanePacking === "packed-v1" && value.rawPlaneMask !== 0xffff) {
    errors.push("packed-v1 requires all raw plane bits");
  }
  if (value.compression !== "gzip") errors.push("compression must be gzip");
  if (typeof value.pcm16Sha256 !== "string"
    || !/^[a-f0-9]{64}$/.test(value.pcm16Sha256)) {
    errors.push("pcm16Sha256 must be a lowercase SHA-256 digest");
  }
  if (typeof value.excitation !== "string") {
    errors.push("excitation must be base64 text");
  } else {
    const payloadBytes = decodedBase64ByteLength(value.excitation);
    if (payloadBytes === null) {
      errors.push("excitation must be valid padded base64");
    } else if (payloadBytes !== value.compressedByteLength) {
      errors.push(
        `excitation must contain exactly ${value.compressedByteLength} bytes`,
      );
    }
  }
  if (value.bitplanePacking === "packed-v1"
    && typeof value.durationSamples === "number") {
    const expectedBytes = Math.ceil(value.durationSamples / 8) * 16;
    if (value.decompressedByteLength !== expectedBytes) {
      errors.push(
        `packed-v1 must decompress to exactly ${expectedBytes} bytes`,
      );
    }
  }
  return { valid: errors.length === 0, errors };
}

export function assertExactPcm16BitplaneModel(
  value: unknown,
): asserts value is ExactPcm16BitplaneModel {
  const result = validateExactPcm16BitplaneModel(value);
  if (!result.valid) {
    throw new TypeError(
      `Invalid exact PCM16 bitplane model:\n${result.errors.join("\n")}`,
    );
  }
}

export function validateBlockAdaptiveResidualModel(
  value: unknown,
): CompactModelValidation {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { valid: false, errors: ["model must be an object"] };
  }
  if (value.version !== 1) errors.push("version must be 1");
  if (value.synthesis !== "deterministic-block-adaptive-residual") {
    errors.push("synthesis must identify the block-adaptive residual codec");
  }
  for (const field of [
    "sampleRate",
    "durationSamples",
    "activeSampleCount",
    "bits",
    "blockSize",
  ] as const) {
    if (!isPositiveInteger(value[field])) {
      errors.push(`${field} must be a positive integer`);
    }
  }
  if (
    typeof value.activeStart !== "number"
    || !Number.isInteger(value.activeStart)
    || value.activeStart < 0
  ) {
    errors.push("activeStart must be a non-negative integer");
  }
  if (typeof value.bits === "number" && (value.bits < 2 || value.bits > 8)) {
    errors.push("bits must be between 2 and 8");
  }
  if (
    typeof value.activeStart === "number"
    && typeof value.activeSampleCount === "number"
    && typeof value.durationSamples === "number"
    && value.activeStart + value.activeSampleCount > value.durationSamples
  ) {
    errors.push("active payload must fit inside durationSamples");
  }
  if (typeof value.scalesF32 !== "string" || value.scalesF32.length === 0) {
    errors.push("scalesF32 must be non-empty base64");
  }
  if (typeof value.excitation !== "string" || value.excitation.length === 0) {
    errors.push("excitation must be non-empty base64");
  }

  if (
    errors.length === 0
    && typeof value.scalesF32 === "string"
    && typeof value.excitation === "string"
  ) {
    try {
      const scales = decodeBase64(value.scalesF32);
      const excitation = decodeBase64(value.excitation);
      const expectedScaleBytes =
        Math.ceil(value.activeSampleCount as number / (value.blockSize as number))
        * 4;
      const expectedExcitationBytes = Math.ceil(
        ((value.activeSampleCount as number) * (value.bits as number)) / 8,
      );
      if (scales.length !== expectedScaleBytes) {
        errors.push(`scalesF32 must contain exactly ${expectedScaleBytes} bytes`);
      } else {
        const view = new DataView(
          scales.buffer,
          scales.byteOffset,
          scales.byteLength,
        );
        for (let offset = 0; offset < scales.length; offset += 4) {
          const scale = view.getFloat32(offset, true);
          if (!Number.isFinite(scale) || scale < 0) {
            errors.push(`scalesF32 contains an invalid scale at byte ${offset}`);
            break;
          }
        }
      }
      if (excitation.length !== expectedExcitationBytes) {
        errors.push(
          `excitation must contain exactly ${expectedExcitationBytes} bytes`,
        );
      }
    } catch {
      errors.push("payload fields must be valid base64");
    }
  }
  return { valid: errors.length === 0, errors };
}

export function assertBlockAdaptiveResidualModel(
  value: unknown,
): asserts value is BlockAdaptiveResidualModel {
  const result = validateBlockAdaptiveResidualModel(value);
  if (!result.valid) {
    throw new TypeError(`Invalid compact residual model:\n${result.errors.join("\n")}`);
  }
}

function bitIsSet(bytes: Uint8Array, index: number) {
  return (bytes[index >> 3] & (1 << (index & 7))) !== 0;
}

export function validateVariableBitBlockResidualModel(
  value: unknown,
): CompactModelValidation {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { valid: false, errors: ["model must be an object"] };
  }
  if (value.version !== 2) errors.push("version must be 2");
  if (value.synthesis !== "deterministic-variable-bit-block-residual") {
    errors.push("synthesis must identify the variable-bit block codec");
  }
  for (const field of [
    "sampleRate",
    "durationSamples",
    "activeSampleCount",
    "baseBits",
    "highBits",
    "blockSize",
  ] as const) {
    if (!isPositiveInteger(value[field])) {
      errors.push(`${field} must be a positive integer`);
    }
  }
  if (
    typeof value.activeStart !== "number"
    || !Number.isInteger(value.activeStart)
    || value.activeStart < 0
  ) {
    errors.push("activeStart must be a non-negative integer");
  }
  if (
    typeof value.baseBits === "number"
    && (value.baseBits < 2 || value.baseBits > 7)
  ) {
    errors.push("baseBits must be between 2 and 7");
  }
  if (
    typeof value.baseBits === "number"
    && typeof value.highBits === "number"
    && value.highBits !== value.baseBits + 1
  ) {
    errors.push("highBits must be exactly one bit above baseBits");
  }
  if (
    typeof value.activeStart === "number"
    && typeof value.activeSampleCount === "number"
    && typeof value.durationSamples === "number"
    && value.activeStart + value.activeSampleCount > value.durationSamples
  ) {
    errors.push("active payload must fit inside durationSamples");
  }
  for (const field of [
    "scalesF32",
    "highPrecisionBlocks",
    "excitation",
  ] as const) {
    if (typeof value[field] !== "string" || value[field].length === 0) {
      errors.push(`${field} must be non-empty base64`);
    }
  }

  if (errors.length === 0) {
    try {
      const scales = decodeBase64(value.scalesF32 as string);
      const precisionMask = decodeBase64(value.highPrecisionBlocks as string);
      const excitation = decodeBase64(value.excitation as string);
      const activeSampleCount = value.activeSampleCount as number;
      const blockSize = value.blockSize as number;
      const baseBits = value.baseBits as number;
      const highBits = value.highBits as number;
      const blockCount = Math.ceil(activeSampleCount / blockSize);
      const expectedScaleBytes = blockCount * 4;
      const expectedMaskBytes = Math.ceil(blockCount / 8);
      if (scales.length !== expectedScaleBytes) {
        errors.push(`scalesF32 must contain exactly ${expectedScaleBytes} bytes`);
      }
      if (precisionMask.length !== expectedMaskBytes) {
        errors.push(
          `highPrecisionBlocks must contain exactly ${expectedMaskBytes} bytes`,
        );
      }
      let expectedExcitationBits = 0;
      for (let block = 0; block < blockCount; block += 1) {
        const samplesInBlock = Math.min(
          blockSize,
          activeSampleCount - block * blockSize,
        );
        expectedExcitationBits += samplesInBlock
          * (bitIsSet(precisionMask, block) ? highBits : baseBits);
      }
      const expectedExcitationBytes = Math.ceil(expectedExcitationBits / 8);
      if (excitation.length !== expectedExcitationBytes) {
        errors.push(
          `excitation must contain exactly ${expectedExcitationBytes} bytes`,
        );
      }
      if (scales.length === expectedScaleBytes) {
        const view = new DataView(
          scales.buffer,
          scales.byteOffset,
          scales.byteLength,
        );
        for (let offset = 0; offset < scales.length; offset += 4) {
          const scale = view.getFloat32(offset, true);
          if (!Number.isFinite(scale) || scale < 0) {
            errors.push(`scalesF32 contains an invalid scale at byte ${offset}`);
            break;
          }
        }
      }
    } catch {
      errors.push("payload fields must be valid base64");
    }
  }
  return { valid: errors.length === 0, errors };
}

export function assertVariableBitBlockResidualModel(
  value: unknown,
): asserts value is VariableBitBlockResidualModel {
  const result = validateVariableBitBlockResidualModel(value);
  if (!result.valid) {
    throw new TypeError(
      `Invalid variable-bit residual model:\n${result.errors.join("\n")}`,
    );
  }
}

async function decompressGzip(bytes: Uint8Array) {
  if (typeof DecompressionStream !== "function") {
    throw new TypeError("This browser does not support gzip DecompressionStream");
  }
  const input = new Uint8Array(bytes).buffer as ArrayBuffer;
  const stream = new Blob([input])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function decodeVarUint(bytes: Uint8Array, state: { offset: number }) {
  let value = 0;
  let shift = 0;
  while (state.offset < bytes.length && shift <= 28) {
    const byte = bytes[state.offset++];
    value += (byte & 0x7f) * 2 ** shift;
    if ((byte & 0x80) === 0) return value;
    shift += 7;
  }
  throw new TypeError("Invalid bitplane run length");
}

async function unpackExactBitplanes(
  bytes: Uint8Array,
  model: ExactPcm16BitplaneModel,
) {
  const words = new Uint16Array(model.durationSamples);
  const rawPlaneBytes = Math.ceil(model.durationSamples / 8);
  const state = { offset: 0 };
  let workSinceCheck = 0;
  let sliceStartedAt = performance.now();
  const shouldYield = () => {
    if (workSinceCheck < SAMPLE_CHECK_INTERVAL) return false;
    workSinceCheck = 0;
    return mainThreadSliceExpired(sliceStartedAt);
  };

  for (let bit = 15; bit >= 0; bit -= 1) {
    const raw = model.bitplanePacking === "packed-v1"
      || (model.rawPlaneMask & (1 << bit)) !== 0;
    if (raw) {
      if (state.offset + rawPlaneBytes > bytes.length) {
        throw new TypeError("Truncated raw bitplane payload");
      }
      const bitValue = 1 << bit;
      for (let byteIndex = 0; byteIndex < rawPlaneBytes; byteIndex += 1) {
        const packed = bytes[state.offset + byteIndex];
        const index = byteIndex << 3;
        const remaining = model.durationSamples - index;
        if (remaining >= 8) {
          if (packed & 0x01) words[index] |= bitValue;
          if (packed & 0x02) words[index + 1] |= bitValue;
          if (packed & 0x04) words[index + 2] |= bitValue;
          if (packed & 0x08) words[index + 3] |= bitValue;
          if (packed & 0x10) words[index + 4] |= bitValue;
          if (packed & 0x20) words[index + 5] |= bitValue;
          if (packed & 0x40) words[index + 6] |= bitValue;
          if (packed & 0x80) words[index + 7] |= bitValue;
          workSinceCheck += 8;
        } else {
          for (let offset = 0; offset < remaining; offset += 1) {
            if (packed & (1 << offset)) words[index + offset] |= bitValue;
            workSinceCheck += 1;
          }
        }
        if (shouldYield()) {
          await yieldToMainThread();
          sliceStartedAt = performance.now();
        }
      }
      state.offset += rawPlaneBytes;
      continue;
    }

    let value = (model.rleFirstBitMask >>> bit) & 1;
    let index = 0;
    while (index < model.durationSamples) {
      const runLength = decodeVarUint(bytes, state);
      if (runLength <= 0 || index + runLength > model.durationSamples) {
        throw new TypeError("Invalid bitplane run boundary");
      }
      const end = index + runLength;
      if (value === 1) {
        for (; index < end; index += 1) {
          words[index] |= 1 << bit;
          workSinceCheck += 1;
          if (shouldYield()) {
            await yieldToMainThread();
            sliceStartedAt = performance.now();
          }
        }
      } else {
        index = end;
        workSinceCheck += runLength;
        if (shouldYield()) {
          await yieldToMainThread();
          sliceStartedAt = performance.now();
        }
      }
      value ^= 1;
    }
  }
  if (state.offset !== bytes.length) {
    throw new TypeError("Bitplane payload has trailing bytes");
  }
  return words;
}

function signed16(value: number) {
  const wrapped = value & 0xffff;
  return wrapped >= 0x8000 ? wrapped - 0x1_0000 : wrapped;
}

function unzigzag16(value: number) {
  return (value >>> 1) ^ -(value & 1);
}

async function inverseExactTransform(
  words: Uint16Array,
  transform: ExactPcm16Transform,
) {
  const output = new Float32Array(words.length);
  let previous = 0;
  let previousPrevious = 0;
  let sliceStartedAt = performance.now();
  for (let index = 0; index < words.length; index += 1) {
    const encoded = words[index];
    let sample: number;
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
    }
    output[index] = sample < 0 ? sample / 32_768 : sample / 32_767;
    previousPrevious = previous;
    previous = sample;
    if (index % SAMPLE_CHECK_INTERVAL === SAMPLE_CHECK_INTERVAL - 1
      && mainThreadSliceExpired(sliceStartedAt)) {
      await yieldToMainThread();
      sliceStartedAt = performance.now();
    }
  }
  return output;
}

async function renderExactPcm16Bitplanes(model: ExactPcm16BitplaneModel) {
  assertExactPcm16BitplaneModel(model);
  const compressed = decodeBase64(model.excitation);
  const packed = await decompressGzip(compressed);
  if (packed.length !== model.decompressedByteLength) {
    throw new TypeError(
      `Bitplane payload must decompress to ${model.decompressedByteLength} bytes`,
    );
  }
  const words = await unpackExactBitplanes(packed, model);
  return inverseExactTransform(words, model.transform);
}

assertExactPcm16BitplaneModel(clickAltExactModel);
assertExactPcm16BitplaneModel(clickOriginalExactModel);
assertExactPcm16BitplaneModel(dropExactModel);
assertExactPcm16BitplaneModel(paperRustleExactModel);
assertExactPcm16BitplaneModel(partyHornExactModel);

async function yieldToMainThread() {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

const mainThreadSliceExpired = (startedAt: number) =>
  performance.now() - startedAt >= MAIN_THREAD_SLICE_MS;

/** Decode or precompute a compact model once, then cache its exact PCM. */
export function prepareCompactPcm(name: CompactSoundName) {
  const existing = preparedPcm.get(name);
  if (existing) return existing;
  const prepared = Promise.resolve()
    .then(() => renderExactPcm16Bitplanes(exactModels[name]))
    .catch((error: unknown) => {
      preparedPcm.delete(name);
      throw error;
    });
  preparedPcm.set(name, prepared);
  return prepared;
}

export function isCompactSound(name: string): name is CompactSoundName {
  return (COMPACT_SOUND_NAMES as readonly string[]).includes(name);
}

export function compactMetadata(name: CompactSoundName) {
  const selectedModel = exactModels[name];
  return {
    sampleRate: selectedModel.sampleRate,
    durationSamples: selectedModel.durationSamples,
  };
}

export function preparePaperRustlePcm() {
  return prepareCompactPcm("paperRustle");
}

export const PAPER_RUSTLE_SAMPLE_RATE = exactModels.paperRustle.sampleRate;
export const PAPER_RUSTLE_DURATION_SAMPLES =
  exactModels.paperRustle.durationSamples;
