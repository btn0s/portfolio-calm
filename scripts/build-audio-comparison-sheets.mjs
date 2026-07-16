import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const originalDirectory = resolve(root, process.argv[2] ?? "public/assets/audio");
const synthDirectory = resolve(root, process.argv[3] ?? ".audio-synth");
const outputDirectory = resolve(root, process.argv[4] ?? ".audio-comparisons");
const originalPlots = join(outputDirectory, "plots", "original");
const synthPlots = join(outputDirectory, "plots", "synth");
mkdirSync(outputDirectory, { recursive: true });

const pairs = [
  ["ambient-artifacts", "Ambient · artifacts"], ["ambient-global", "Ambient · global"],
  ["ambient-home", "Ambient · home"], ["ambient-thoughts", "Ambient · thoughts"],
  ["click-alt", "Click · alternate"], ["click", "Click · original"], ["drop", "Drop"],
  ["intro-artifacts", "Intro · artifacts"], ["intro-home", "Intro · home"],
  ["intro-thoughts", "Intro · thoughts"], ["paper-rustle-sound-effect", "Paper rustle"],
  ["sad-party-horn", "Sad party horn"], ["swipe-backward", "Swipe backward"],
  ["swipe-forward", "Swipe forward"],
];
const audioExtensions = new Set([".mp3", ".wav", ".m4a", ".ogg", ".flac"]);
const slug = (file) => basename(file, extname(file)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const indexAudio = (directory) => new Map(readdirSync(directory).filter((file) => audioExtensions.has(extname(file).toLowerCase())).map((file) => [slug(file), join(directory, file)]));
const originals = indexAudio(originalDirectory);
const synths = indexAudio(synthDirectory);
const missing = pairs.flatMap(([name]) => [["original", originals], ["synth", synths]].filter(([, index]) => !index.has(name)).map(([kind]) => `${kind}:${name}`));
if (missing.length) throw new Error(`Missing audio pairs: ${missing.join(", ")}`);

execFileSync("node", [join(root, "scripts/analyze-audio.mjs"), originalDirectory, originalPlots], { stdio: "inherit" });
execFileSync("node", [join(root, "scripts/analyze-audio.mjs"), synthDirectory, synthPlots], { stdio: "inherit" });

const escapeXml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const imageData = (path) => readFileSync(path).toString("base64");
const results = [];

for (const [name, label] of pairs) {
  const metrics = JSON.parse(execFileSync("node", [join(root, "scripts/compare-audio-shapes.mjs"), originals.get(name), synths.get(name), "--json"], { encoding: "utf8" }));
  const originalData = imageData(join(originalPlots, `${name}.png`));
  const synthData = imageData(join(synthPlots, `${name}.png`));
  const warning = metrics.status === "silent-reference" ? "REFERENCE IS EFFECTIVELY SILENT — MATCH SCORE OMITTED" : metrics.status === "silent-candidate" ? "SYNTH IS EFFECTIVELY SILENT — MATCH FAILED" : `ENVELOPE CORRELATION ${metrics.envelopeCorrelation.toFixed(3)}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="675" viewBox="0 0 1800 675">
<rect width="1800" height="675" fill="#050505"/><style>text{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;fill:#fff}.title{font-size:26px;font-weight:700}.side{font-size:18px;letter-spacing:3px}.meta{font-size:15px;fill:${metrics.status === "scored" ? "#999" : "#ffbd66"}}</style>
<text class="title" x="24" y="34">${escapeXml(label)} · ${name}</text><text class="meta" x="1776" y="34" text-anchor="end">${warning}</text>
<text class="side" x="24" y="70">ORIGINAL</text><text class="side" x="924" y="70">SYNTH</text>
<image href="data:image/png;base64,${originalData}" x="0" y="88" width="900" height="553" preserveAspectRatio="xMidYMid meet"/><image href="data:image/png;base64,${synthData}" x="900" y="88" width="900" height="553" preserveAspectRatio="xMidYMid meet"/>
<text class="meta" x="24" y="662">RMS ${metrics.referenceSignal.rmsDb} dBFS · PEAK ${metrics.referenceSignal.peakDb} dBFS</text><text class="meta" x="924" y="662">RMS ${metrics.candidateSignal.rmsDb} dBFS · PEAK ${metrics.candidateSignal.peakDb} dBFS</text></svg>\n`;
  const svgPath = join(outputDirectory, `${name}.svg`);
  const pngPath = join(outputDirectory, `${name}.png`);
  writeFileSync(svgPath, svg);
  execFileSync("sips", ["-s", "format", "png", svgPath, "--out", pngPath], { stdio: "ignore" });
  results.push({ slug: name, label, original: originals.get(name), synth: synths.get(name), sheetSvg: basename(svgPath), sheetPng: basename(pngPath), ...metrics });
}

writeFileSync(join(outputDirectory, "metrics.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), pairCount: results.length, silentReferenceCount: results.filter((item) => item.status === "silent-reference").length, results }, null, 2)}\n`);

const sections = results.map((item) => `<section><h2>${escapeXml(item.label)} <code>${item.slug}</code></h2><p class="${item.status}">${item.status === "silent-reference" ? "⚠ Original is effectively silent; score omitted." : item.status === "silent-candidate" ? "⚠ Synth is effectively silent; match failed." : `Envelope correlation: ${item.envelopeCorrelation.toFixed(3)}`}</p><a href="${item.sheetSvg}"><img src="${item.sheetPng}" alt="${escapeXml(item.label)}: ORIGINAL and SYNTH comparison"></a></section>`).join("\n");
writeFileSync(join(outputDirectory, "index.html"), `<!doctype html><html><head><meta charset="utf-8"><title>Audio comparison sheets</title><style>:root{color-scheme:dark;font-family:ui-monospace,monospace;background:#050505;color:#eee}body{margin:0;padding:32px}main{max-width:1500px;margin:auto}h1{margin:0 0 8px}header{margin-bottom:36px}section{margin:0 0 42px}h2{margin:0 0 6px;font-size:19px}p{color:#aaa;margin:0 0 10px}.silent-reference{color:#ffbd66}img{display:block;width:100%;height:auto;border:1px solid #333}</style></head><body><main><header><h1>Audio shape comparison sheets</h1><p>Every sheet is labeled ORIGINAL / SYNTH. Machine-readable results: <a href="metrics.json">metrics.json</a>.</p></header>${sections}</main></body></html>\n`);

const tileWidth = 900, tileHeight = 338;
const overviewImages = results.map((item, index) => `<image href="data:image/png;base64,${imageData(join(outputDirectory, item.sheetPng))}" x="${(index % 2) * tileWidth}" y="${80 + Math.floor(index / 2) * tileHeight}" width="${tileWidth}" height="${tileHeight}" preserveAspectRatio="xMidYMid meet"/>`).join("\n");
const overviewSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="${80 + 7 * tileHeight}" viewBox="0 0 1800 ${80 + 7 * tileHeight}"><rect width="100%" height="100%" fill="#050505"/><style>text{font-family:ui-monospace,monospace;fill:#fff}</style><text x="24" y="38" font-size="28" font-weight="700">ALL 14 AUDIO COMPARISONS</text><text x="24" y="66" font-size="16" fill="#aaa">Each tile: ORIGINAL on left · SYNTH on right</text>${overviewImages}</svg>\n`;
writeFileSync(join(outputDirectory, "all-sounds.svg"), overviewSvg);
execFileSync("sips", ["-s", "format", "png", join(outputDirectory, "all-sounds.svg"), "--out", join(outputDirectory, "all-sounds.png")], { stdio: "ignore" });
console.log(`Built ${results.length} labeled comparison sheets and metrics in ${outputDirectory}`);
