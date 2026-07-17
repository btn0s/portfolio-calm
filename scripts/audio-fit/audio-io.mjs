import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function decodeAudio(path, sampleRate = 48_000) {
  const bytes = execFileSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      resolve(path),
      "-ac",
      "1",
      "-ar",
      String(sampleRate),
      "-f",
      "f32le",
      "-",
    ],
    { maxBuffer: 128 * 1024 * 1024 },
  );
  const view = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
  return Float32Array.from(view);
}

export function writeWav(path, samples, sampleRate = 48_000) {
  const dataBytes = samples.length * 2;
  const buffer = Buffer.allocUnsafe(44 + dataBytes);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataBytes, 40);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    buffer.writeInt16LE(
      Math.round(sample < 0 ? sample * 32768 : sample * 32767),
      44 + index * 2,
    );
  }
  mkdirSync(dirname(resolve(path)), { recursive: true });
  writeFileSync(resolve(path), buffer);
}

export function readJson(path) {
  return JSON.parse(readFileSync(resolve(path), "utf8"));
}

export function writeJson(path, value) {
  mkdirSync(dirname(resolve(path)), { recursive: true });
  writeFileSync(resolve(path), `${JSON.stringify(value, null, 2)}\n`);
}
