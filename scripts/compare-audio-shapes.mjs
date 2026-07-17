import {
  compareSamples,
  decodeAudio,
  extractFingerprint,
  sparkline,
} from "./audio-shape-features.mjs";

const args = process.argv.slice(2);
const jsonOnly = args.includes("--json");
const paths = args.filter((arg) => arg !== "--json");
const [referencePath, candidatePath] = paths;
if (!referencePath || !candidatePath) {
  console.error("Usage: node scripts/compare-audio-shapes.mjs <reference> <candidate> [--json]");
  process.exit(1);
}

const referenceSamples = decodeAudio(referencePath);
const candidateSamples = decodeAudio(candidatePath);
const metrics = compareSamples(referenceSamples, candidateSamples);

if (!jsonOnly) {
  const reference = extractFingerprint(referenceSamples);
  const candidate = extractFingerprint(candidateSamples);
  console.log(`reference ${sparkline(reference.amplitudeEnvelope)}`);
  console.log(`candidate ${sparkline(candidate.amplitudeEnvelope)}`);
}
console.log(JSON.stringify(metrics, null, jsonOnly ? 0 : 2));
