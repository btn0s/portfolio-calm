import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("shared AudioContext priming", () => {
  it("starts one silent sample synchronously and unlocks the singleton only once", async () => {
    const instances: FakeAudioContext[] = [];
    let finishResume: (() => void) | undefined;

    const silentBuffer = {
      getChannelData: vi.fn(() => new Float32Array(1)),
    } as unknown as AudioBuffer;
    const silentSource = {
      buffer: null as AudioBuffer | null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
    };

    class FakeAudioContext {
      state: AudioContextState = "suspended";
      readonly sampleRate = 48_000;
      readonly destination = {} as AudioDestinationNode;
      readonly createBuffer = vi.fn(() => silentBuffer);
      readonly createBufferSource = vi.fn(() => silentSource);
      readonly resume = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            finishResume = () => {
              this.state = "running";
              resolve();
            };
          }),
      );

      constructor() {
        instances.push(this);
      }
    }

    vi.stubGlobal("window", { AudioContext: FakeAudioContext });

    const { getAudioContext, primeAudioContext } = await import(
      "@/lib/audio-context"
    );

    const firstContext = getAudioContext();
    const secondContext = getAudioContext();

    expect(firstContext).toBe(secondContext);
    expect(instances).toHaveLength(1);

    const firstPrime = primeAudioContext();

    expect(instances[0].createBuffer).toHaveBeenCalledWith(1, 1, 48_000);
    expect(instances[0].createBufferSource).toHaveBeenCalledOnce();
    expect(silentSource.buffer).toBe(silentBuffer);
    expect(silentSource.connect).toHaveBeenCalledWith(
      instances[0].destination,
    );
    expect(silentSource.start).toHaveBeenCalledOnce();
    expect(instances[0].resume).toHaveBeenCalledOnce();

    finishResume?.();
    await expect(firstPrime).resolves.toBe(true);
    await expect(primeAudioContext()).resolves.toBe(true);

    expect(instances).toHaveLength(1);
    expect(instances[0].createBuffer).toHaveBeenCalledOnce();
    expect(instances[0].createBufferSource).toHaveBeenCalledOnce();
    expect(silentSource.start).toHaveBeenCalledOnce();
    expect(instances[0].resume).toHaveBeenCalledOnce();
  });
});
