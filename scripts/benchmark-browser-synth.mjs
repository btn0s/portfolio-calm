import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(
  root,
  process.argv[2] ?? ".audio-synth/browser-benchmark.json",
);
const url = process.argv[3]
  ?? "http://localhost:3000/audio-lab?defer-prewarm=1";
const iterations = Number(process.argv[4] ?? 3);
const sessionPrefix = process.env.AUDIO_BENCHMARK_SESSION ?? "audio-benchmark";
if (!Number.isInteger(iterations) || iterations < 1 || iterations > 20) {
  throw new TypeError("benchmark iterations must be an integer from 1 to 20");
}

function browser(session, ...args) {
  return execFileSync("agent-browser", ["--session", session, ...args], {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}

const runs = [];
for (let iteration = 0; iteration < iterations; iteration += 1) {
  const session = `${sessionPrefix}-${iteration}`;
  let result;
  try {
    browser(session, "open", url);
    browser(
      session,
      "wait",
      "--fn",
      "typeof window.__benchmarkSynthPreparation === 'function'",
    );
    result = JSON.parse(browser(
      session,
      "eval",
      "window.__benchmarkSynthPreparation()",
    ));
  } finally {
    try {
      browser(session, "close");
    } catch {
      // Preserve the benchmark result/error if browser cleanup itself fails.
    }
  }
  runs.push({
    elapsedMs: Number(result.elapsedMs.toFixed(3)),
    maxEventLoopGapMs: Number(result.maxEventLoopGapMs.toFixed(3)),
    timerTicks: result.timerTicks,
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  url,
  allFiveSoundsPrepared: true,
  iterations,
  medianElapsedMs: [...runs]
    .sort((left, right) => left.elapsedMs - right.elapsedMs)[
      Math.floor(runs.length / 2)
    ].elapsedMs,
  worstEventLoopGapMs: Math.max(
    ...runs.map((run) => run.maxEventLoopGapMs),
  ),
  runs,
};
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
