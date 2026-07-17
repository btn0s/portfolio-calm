# Exact PCM16 bitplane experiment

This experiment tests a lossless endpoint for all five audible UI sounds. It
uses the same clipped, asymmetric `Math.round` PCM16 conversion as
`audioBufferToWavDataUrl` in `src/lib/synth-audio.ts`, then:

1. sweeps reversible sample predictors;
2. transposes the resulting 16-bit words into bitplanes;
3. chooses raw or run-length storage independently for each plane;
4. precompresses the bitplane excitation with gzip; and
5. verifies Node `gunzip` and browser-compatible `DecompressionStream("gzip")`
   both reconstruct every PCM16 sample exactly.

Run:

```sh
npm run fit:audio:exact
```

The reproducible outputs are in `results/<sound>/model.json` and
`results/<sound>/report.json`. Candidate WAVs are generated for manual
auditioning but ignored by Git. `results/summary.json` records the aggregate
payload budget.

The model payload is already gzipped before base64 encoding. This makes the
raw JSON/JavaScript parse size much smaller than embedding unpacked PCM or
uncompressed bitplanes, while remaining directly decodable in browsers via
the standard `DecompressionStream` API.

The selected five models contain 324,365 bytes of pre-gzipped excitation and
435,191 bytes of JSON/base64, versus 688,584 bytes for the replaced assets.
Every generated report records zero differing PCM16 samples plus exact
duration, quiet-bin fraction, and transient positions.
