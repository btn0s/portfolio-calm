import { describe, expect, it, vi } from "vitest";

import {
  getPaperRustlePlaybackOptions,
  getSoundVolume,
  resolveStoredAudioEngine,
  supportsSynthPlayback,
} from "@/lib/audio";

describe("audio engine defaults", () => {
  it("uses synth unless the user explicitly persisted sample", () => {
    expect(resolveStoredAudioEngine(null)).toBe("synth");
    expect(resolveStoredAudioEngine("synth")).toBe("synth");
    expect(resolveStoredAudioEngine("unexpected")).toBe("synth");
    expect(resolveStoredAudioEngine("sample")).toBe("sample");
  });

  it("uses the same playback gain policy for samples and synths", () => {
    expect(getSoundVolume("click")).toBe(0.15);
    expect(getSoundVolume("drop")).toBe(0.15);
    expect(getSoundVolume("swipeForward")).toBe(0.08);
    expect(getSoundVolume("paperRustle")).toBe(0.15);
  });

  it("keeps the exact paper waveform at source rate and caps it to one second", () => {
    expect(getPaperRustlePlaybackOptions()).toEqual({
      rate: 1,
      maxMs: 1_000,
    });
  });

  it("only selects the compact runtime when browser gzip decoding exists", () => {
    vi.stubGlobal("window", {});
    expect(supportsSynthPlayback()).toBe(false);
    vi.stubGlobal("window", {
      DecompressionStream: class FakeDecompressionStream {},
    });
    expect(supportsSynthPlayback()).toBe(true);
    vi.unstubAllGlobals();
  });
});

function fakeAudioElement() {
  return {
    src: "",
    preload: "",
    volume: 0,
    muted: false,
    currentTime: 0,
    playbackRate: 1,
    addEventListener: vi.fn(),
    pause: vi.fn(),
    play: vi.fn(() => Promise.resolve()),
  } as unknown as HTMLAudioElement;
}

describe("audio playback hardening", () => {
  it("does not let an old stop timer truncate a reused sample", async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const elements = Array.from({ length: 3 }, fakeAudioElement);
    let createdElements = 0;
    const createElement = vi.fn(() => elements[createdElements++]);
    vi.stubGlobal("document", { createElement });

    try {
      const { audio: isolatedAudio } = await import("@/lib/audio");
      const options = { maxMs: 1_000 };

      isolatedAudio.playSample("paperRustle", options);
      vi.advanceTimersByTime(100);
      isolatedAudio.playSample("paperRustle", options);
      vi.advanceTimersByTime(100);
      isolatedAudio.playSample("paperRustle", options);
      vi.advanceTimersByTime(100);
      isolatedAudio.playSample("paperRustle", options);

      expect(elements[0].play).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(700);
      expect(elements[0].pause).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);
      expect(elements[0].pause).toHaveBeenCalledOnce();
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
      vi.unstubAllGlobals();
      vi.resetModules();
    }
  });

  it("falls back to the matching sample when synth playback is unavailable", async () => {
    vi.resetModules();
    const elements = Array.from({ length: 3 }, fakeAudioElement);
    let createdElements = 0;
    const createElement = vi.fn(() => elements[createdElements++]);
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", { createElement });
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) =>
        key === "sound-engine" ? "synth" : null,
      ),
      setItem: vi.fn(),
    });

    try {
      const { audio: isolatedAudio } = await import("@/lib/audio");
      isolatedAudio.play("click");

      await vi.waitFor(() => {
        expect(elements[0].play).toHaveBeenCalledOnce();
      });
      expect(elements[0].src).toBe("/assets/audio/click-alt.mp3");
      expect(elements[0].volume).toBe(0.15);
    } finally {
      vi.unstubAllGlobals();
      vi.resetModules();
    }
  });
});
