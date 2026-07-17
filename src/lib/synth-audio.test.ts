import { describe, expect, it, vi } from "vitest";

import {
  audioBufferToWavDataUrl,
  registerCompactSource,
  resolveSynthPlaybackOptions,
  scheduleCompactPlayback,
} from "@/lib/synth-audio";

describe("browser synth capture", () => {
  it("resolves gain, rate, and a wall-clock playback cap", () => {
    expect(resolveSynthPlaybackOptions({
      gain: 0.18,
      rate: 1.15,
      maxMs: 1_000,
    })).toEqual({
      gain: 0.18,
      playbackRate: 1.15,
      maximumDurationSeconds: 1,
    });
  });

  it("rejects invalid playback controls without poisoning Web Audio", () => {
    expect(resolveSynthPlaybackOptions({
      gain: Number.NaN,
      rate: 0,
      maxMs: -1,
    })).toEqual({
      gain: 1,
      playbackRate: 1,
      maximumDurationSeconds: null,
    });
  });

  it("applies exact-paper playback controls before scheduling the source", () => {
    const source = {
      playbackRate: { value: 0 },
      start: vi.fn(),
      stop: vi.fn(),
    } as unknown as AudioBufferSourceNode;
    const gain = {
      gain: { value: 0 },
    } as unknown as GainNode;

    scheduleCompactPlayback(
      source,
      gain,
      {
        gain: 0.15,
        playbackRate: 1,
        maximumDurationSeconds: 1,
      },
      4.25,
    );

    expect(source.playbackRate.value).toBe(1);
    expect(gain.gain.value).toBe(0.15);
    expect(source.start).toHaveBeenCalledOnce();
    expect(source.stop).toHaveBeenCalledWith(5.25);
  });

  it("stops the oldest compact source before a fourth can overlap", () => {
    const audioContext = {} as BaseAudioContext;
    const sources = Array.from({ length: 4 }, () => ({
      stop: vi.fn(),
      disconnect: vi.fn(),
    })) as unknown as AudioBufferSourceNode[];

    for (const source of sources) {
      registerCompactSource(audioContext, "paperRustle", source);
    }

    expect(sources[0].stop).toHaveBeenCalledOnce();
    expect(sources[1].stop).not.toHaveBeenCalled();
    expect(sources[2].stop).not.toHaveBeenCalled();
    expect(sources[3].stop).not.toHaveBeenCalled();
  });

  it("rounds PCM16 samples instead of truncating low-level texture", () => {
    const samples = Float32Array.from([
      0.75 / 32_767,
      -0.75 / 32_768,
    ]);
    const buffer = {
      sampleRate: 48_000,
      getChannelData: () => samples,
    } as unknown as AudioBuffer;

    const dataUrl = audioBufferToWavDataUrl(buffer);
    const bytes = Buffer.from(dataUrl.split(",")[1], "base64");

    expect(bytes.readInt16LE(44)).toBe(1);
    expect(bytes.readInt16LE(46)).toBe(-1);
  });
});
