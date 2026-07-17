#!/usr/bin/env node

import { performance } from "node:perf_hooks";

const imported = await import("../src/lib/compact-spectral-synth.ts");
const compactSynth = imported.default ?? imported;
const { COMPACT_SOUND_NAMES, prepareCompactPcm } = compactSynth;
const requestedNames = process.argv.slice(2);
const names = requestedNames.length > 0
  ? requestedNames
  : [...COMPACT_SOUND_NAMES];

for (const name of names) {
  if (!COMPACT_SOUND_NAMES.includes(name)) {
    throw new TypeError(`Unknown compact synth sound: ${name}`);
  }

  let previousTick = performance.now();
  let maxEventLoopGapMs = 0;
  let timerTicks = 0;
  const timer = setInterval(() => {
    const now = performance.now();
    maxEventLoopGapMs = Math.max(maxEventLoopGapMs, now - previousTick);
    previousTick = now;
    timerTicks += 1;
  }, 0);

  const startedAt = performance.now();
  const samples = await prepareCompactPcm(name);
  const elapsedMs = performance.now() - startedAt;
  await new Promise((resolve) => setTimeout(resolve, 12));
  clearInterval(timer);

  console.log(JSON.stringify({
    name,
    elapsedMs: Number(elapsedMs.toFixed(3)),
    maxEventLoopGapMs: Number(maxEventLoopGapMs.toFixed(3)),
    timerTicks,
    durationSamples: samples.length,
    pcmBytes: samples.byteLength,
  }));
}
