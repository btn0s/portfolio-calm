import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(root, process.argv[2] ?? ".audio-synth");
const url = process.argv[3] ?? "http://localhost:3000/audio-lab";
const onlyNames = new Set(
  (process.argv[4] ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean),
);
const session = process.env.AUDIO_CAPTURE_SESSION ?? "audio-capture";

const sounds = [
  ["ambientArtifacts", "ambient-artifacts"],
  ["ambientGlobal", "ambient-global"],
  ["ambientHome", "ambient-home"],
  ["ambientThoughts", "ambient-thoughts"],
  ["click", "click-alt"],
  ["clickOriginal", "click"],
  ["drop", "drop"],
  ["introArtifacts", "intro-artifacts"],
  ["introHome", "intro-home"],
  ["introThoughts", "intro-thoughts"],
  ["paperRustle", "paper-rustle-sound-effect"],
  ["partyHorn", "sad-party-horn"],
  ["swipeBackward", "swipe-backward"],
  ["swipeForward", "swipe-forward"],
];

function browser(...args) {
  return execFileSync("agent-browser", ["--session", session, ...args], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}

function render(name) {
  const expression = `(async () => {
    const startedAt = performance.now();
    const dataUrl = await window.__renderSynthForAnalysis(${JSON.stringify(name)});
    return { dataUrl, renderMs: performance.now() - startedAt };
  })()`;
  const serialized = browser("eval", expression);
  const result = JSON.parse(serialized);
  const { dataUrl, renderMs } = result;
  const prefix = "data:audio/wav;base64,";
  if (typeof dataUrl !== "string" || !dataUrl.startsWith(prefix)) {
    throw new TypeError(`Browser returned an invalid WAV data URL for ${name}`);
  }
  const wav = Buffer.from(dataUrl.slice(prefix.length), "base64");
  if (wav.subarray(0, 4).toString("ascii") !== "RIFF") {
    throw new TypeError(`Browser returned invalid RIFF data for ${name}`);
  }
  return { wav, renderMs };
}

mkdirSync(outputDirectory, { recursive: true });
browser("open", url);
browser("wait", "--fn", "typeof window.__renderSynthForAnalysis === 'function'");

const selectedSounds = onlyNames.size === 0
  ? sounds
  : sounds.filter(([name]) => onlyNames.has(name));
if (selectedSounds.length !== (onlyNames.size || sounds.length)) {
  const found = new Set(selectedSounds.map(([name]) => name));
  const missing = [...onlyNames].filter((name) => !found.has(name));
  throw new TypeError(`Unknown synth names: ${missing.join(", ")}`);
}

const captureMetrics = [];
for (const [name, slug] of selectedSounds) {
  const { wav, renderMs } = render(name);
  const destination = resolve(outputDirectory, `${slug}.wav`);
  writeFileSync(destination, wav);
  captureMetrics.push({
    name,
    slug,
    bytes: wav.length,
    renderMs: Number(renderMs.toFixed(3)),
    destination,
  });
  console.log(
    `${name.padEnd(18)} ${String(wav.length).padStart(8)} bytes  ${renderMs.toFixed(1).padStart(7)} ms  ${destination}`,
  );
}

writeFileSync(
  resolve(outputDirectory, "capture-metrics.json"),
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    url,
    sounds: captureMetrics,
  }, null, 2)}\n`,
);

console.log(
  `Captured ${selectedSounds.length} browser-rendered synths in ${outputDirectory}`,
);
