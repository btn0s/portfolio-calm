import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const sourceDirectory = resolve(
  projectRoot,
  process.argv[2] ?? "public/assets/audio",
);
const outputDirectory = resolve(
  projectRoot,
  process.argv[3] ?? ".audio-analysis",
);

const audioExtensions = new Set([".mp3", ".wav", ".m4a", ".ogg", ".flac"]);
const files = readdirSync(sourceDirectory)
  .filter((file) => audioExtensions.has(extname(file).toLowerCase()))
  .toSorted();

mkdirSync(outputDirectory, { recursive: true });

function run(command, args) {
  return execFileSync(command, args, { encoding: "utf8" }).trim();
}

function slug(file) {
  return basename(file, extname(file))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const report = files.map((file) => {
  const input = join(sourceDirectory, file);
  const name = slug(file);
  const output = join(outputDirectory, `${name}.png`);
  const probe = JSON.parse(
    run("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration,size,bit_rate:stream=sample_rate,channels",
      "-of",
      "json",
      input,
    ]),
  );

  run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    input,
    "-filter_complex",
    [
      "[0:a]aformat=channel_layouts=mono,asplit=2[wave][spectrum]",
      "[wave]showwavespic=s=1400x300:colors=0x111111:scale=sqrt[waveform]",
      "[spectrum]showspectrumpic=s=1400x560:legend=0:color=intensity:scale=log:fscale=log:gain=4[spectrogram]",
      "[waveform][spectrogram]vstack=inputs=2,format=rgb24[visual]",
    ].join(";"),
    "-map",
    "[visual]",
    "-frames:v",
    "1",
    output,
  ]);

  const stream = probe.streams[0] ?? {};
  const format = probe.format ?? {};
  return {
    file,
    visualization: `${name}.png`,
    durationSeconds: Number(Number(format.duration).toFixed(3)),
    sizeBytes: Number(format.size),
    bitRate: Number(format.bit_rate),
    sampleRate: Number(stream.sample_rate),
    channels: Number(stream.channels),
  };
});

writeFileSync(
  join(outputDirectory, "report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);

console.log(`Analyzed ${report.length} files in ${outputDirectory}`);
