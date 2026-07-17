# Audio matching loop

The synthesis engine is measured against the decoded source, then measured a
second time after the candidate passes through the actual browser renderer.
This prevents an offline approximation from being mistaken for the sound the
site really plays.

## Tight iteration

```sh
# Rebuild the exact compressed PCM16 endpoints for all five audible sounds.
npm run fit:audio:exact

# Inspect transients and modal peaks at a short analysis window.
npm run analyze:audio:partials -- public/assets/audio/click.wav 0.095 --fft-size 2048

# Capture one or all real OfflineAudioContext renders from the audition page.
npm run capture:audio:synth -- .audio-synth http://localhost:3000/audio-lab clickOriginal
npm run capture:audio:synth

# Measure total render time and the worst uninterrupted event-loop gap.
npm run benchmark:audio:synth
npm run benchmark:audio:browser

# Audit sub-bin attacks, fine spectral bands, harmonic ridges, and local phase.
npm run compare:audio:structure -- public/assets/audio/click.wav .audio-synth/click.wav

# Audit stochastic modulation, flux, grain, and audible-bed coverage.
npm run compare:audio:texture -- \
  'public/assets/audio/Paper Rustle Sound Effect.mp3' \
  .audio-synth/paper-rustle-sound-effect.wav

# Prove code-for-code equality at the rounded browser PCM16 endpoint.
npm run compare:audio:pcm16 -- \
  'public/assets/audio/Paper Rustle Sound Effect.mp3' \
  .audio-synth/paper-rustle-sound-effect.wav --json

# Re-score every source/render pair and rebuild labeled ORIGINAL / SYNTH sheets.
npm run compare:audio:batch
```

Canonical machine-readable results are written to
`.audio-comparisons/metrics.json`; labeled SVG sheets and an HTML index sit
beside it. Both generated directories are ignored by git.

## What is scored

`scripts/audio-shape-features.mjs` compares 96-bin amplitude shape, ten
log-frequency bands, centroid, rolloff, zero-crossing rate, flatness,
transient positions/count, RMS, peak, and duration. It is phase-insensitive so
different deterministic noise carriers can still be perceptually equivalent.

`scripts/audio-structure-diagnostics.mjs` is the adversarial second gate. It
compares relative-dB envelopes at 1/4/16/64 ms, 192 fine spectral bands,
temporally persistent harmonic ridges, ridge sharpness, and local phase
coherence. Every generated sheet labels both SHAPE and STRUCTURE scores plus
the envelope, fine-spectrum, ridge, and phase components. The structural gate
prevents a smeared spectrogram or a within-bin timing shift from looking exact
only because the coarse score is high.

`scripts/audio-texture-diagnostics.mjs` is the phase-invariant paper gate. It
compares 1 ms modulation spectra, spectral-flux distributions, crest and
zero-crossing grain statistics, and coverage at six absolute dBFS floors. It
also makes an important distinction visible on the sheet: an output underrun
is a runtime defect, while a quiet gesture that exists at the same position in
the reference is part of the recording.

`scripts/audio-pcm16-exactness.mjs` is the lossless endpoint gate. It applies
the browser audition exporter's clipped asymmetric rounding, reads captured
WAV integer codes directly, and reports differing sample count, maximum code
delta, and exact-match status. Every sheet labels this result; the five audible
production sounds currently report zero differing samples.

Browser captures also write `capture-metrics.json` with the actual render time
and byte count for each synthesized WAV. This keeps sound matching and runtime
cost in the same iteration loop.

Nine retained route/intro/swipe assets decode as effectively silent and are
reported without a misleading score. The five audible references are click
alternate, original click, drop, paper rustle, and sad party horn.

## Exact compact endpoint

All five audible sounds use the same exact PCM16 bitplane codec. The fitter
clips and rounds the decoded reference exactly like the browser exporter,
sweeps reversible delta predictors and bitplane packings, pre-gzips the best
payload, and rejects any candidate with even one differing sample, duration,
quiet-bin fraction, or transient position. Native `DecompressionStream`
inflates the payload asynchronously; cooperative bitplane reconstruction runs
once, then playback reuses one contiguous `AudioBuffer`.

Across click alternate, original click, drop, paper, and horn, the compressed
excitation totals 324,365 bytes and the raw model JSON totals 435,191 bytes,
versus 688,584 bytes for the replaced files. The browser captures contain zero
differing PCM16 samples for all five. Paper's final sheet reports 0.998396
shape, 0.998833 structure, and 0.997678 texture, with all 311,040 PCM16 samples
exact. Its 0.458333 quiet-bin fraction is identical to the reference and is an
intentional gesture, not a playback underrun.

Rejected variable-bit residual, oscillator, spectral, and random-phase
experiments remain local and are ignored by git. The production fitter and its
five exact endpoint models are retained because they reproduce the runtime
payload deterministically.
