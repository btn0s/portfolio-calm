import type { SynthSoundName } from "@/lib/synth-recipes";
import { primeAudioContext } from "@/lib/audio-context";

export const SOUND_URLS = {
  ambientArtifacts: "/assets/audio/ambient-artifacts.mp3",
  ambientGlobal: "/assets/audio/ambient-global.mp3",
  ambientHome: "/assets/audio/ambient-home.mp3",
  ambientThoughts: "/assets/audio/ambient-thoughts.mp3",
  click: "/assets/audio/click-alt.mp3",
  clickOriginal: "/assets/audio/click.wav",
  drop: "/assets/audio/drop.mp3",
  introArtifacts: "/assets/audio/intro-artifacts.mp3",
  introHome: "/assets/audio/intro-home.mp3",
  introThoughts: "/assets/audio/intro-thoughts.mp3",
  paperRustle: "/assets/audio/Paper Rustle Sound Effect.mp3",
  partyHorn: "/assets/audio/sad-party-horn.wav",
  swipeForward: "/assets/audio/swipe-forward.mp3",
  swipeBackward: "/assets/audio/swipe-backward.mp3",
} as const;

export type SoundName = keyof typeof SOUND_URLS;
export type AudioEngine = "sample" | "synth";
export type SoundPlaybackOptions = { rate?: number; maxMs?: number };
export const DEFAULT_AUDIO_ENGINE: AudioEngine = "synth";

export function supportsSynthPlayback() {
  if (typeof window === "undefined") return false;
  const browserWindow = window as typeof window & {
    DecompressionStream?: typeof DecompressionStream;
  };
  return typeof browserWindow.DecompressionStream === "function";
}

const VOLUMES: Partial<Record<SoundName, number>> = {
  click: 0.15,
  drop: 0.15,
  paperRustle: 0.15,
  swipeForward: 0.08,
  swipeBackward: 0.08,
};
const DEFAULT_VOLUME = 0.18;

export function getSoundVolume(name: SoundName) {
  return VOLUMES[name] ?? DEFAULT_VOLUME;
}

export function resolveStoredAudioEngine(
  stored: string | null,
): AudioEngine {
  return stored === "sample" || stored === "synth"
    ? stored
    : DEFAULT_AUDIO_ENGINE;
}

export function getPaperRustlePlaybackOptions() {
  return {
    rate: 1,
    maxMs: 1_000,
  } satisfies SoundPlaybackOptions;
}

type SynthModule = typeof import("@/lib/synth-audio");
let synthModule: Promise<SynthModule> | null = null;

function loadSynthModule() {
  synthModule ??= import("@/lib/synth-audio");
  return synthModule;
}

function prepareSelectedSynthEngine() {
  return loadSynthModule()
    .then(({ prepareSynthAudio }) => prepareSynthAudio())
    .catch(() => undefined);
}

class AudioManager {
  private pools: Map<SoundName, HTMLAudioElement[]> = new Map();
  private poolIndex: Map<SoundName, number> = new Map();
  private samplePrimers: Map<SoundName, HTMLAudioElement> = new Map();
  private stopTimers = new WeakMap<
    HTMLAudioElement,
    ReturnType<typeof setTimeout>
  >();
  private muted = false;
  private initialized = false;
  private engine: AudioEngine = DEFAULT_AUDIO_ENGINE;

  init() {
    if (this.initialized || typeof window === "undefined") return;
    
    const stored = localStorage.getItem("sound-muted");
    this.muted = stored === "true";
    this.engine = resolveStoredAudioEngine(
      localStorage.getItem("sound-engine"),
    );
    this.initialized = true;
    if (this.engine === "synth" && supportsSynthPlayback()) {
      void prepareSelectedSynthEngine();
    }
  }

  play(name: SoundName, options?: SoundPlaybackOptions) {
    if (!this.initialized) this.init();
    if (this.muted || !this.initialized) return;

    if (this.engine === "synth" && supportsSynthPlayback()) {
      void primeAudioContext();
      void loadSynthModule()
        .then(({ playSynth }) =>
          playSynth(name as SynthSoundName, {
            ...options,
            gain: getSoundVolume(name),
          }),
        )
        .then((played) => {
          if (!played && !this.muted && this.engine === "synth") {
            this.playSample(name, options);
          }
        })
        .catch(() => {
          if (!this.muted && this.engine === "synth") {
            this.playSample(name, options);
          }
        });
      return;
    }

    this.playSample(name, options);
  }

  private clearStopTimer(element: HTMLAudioElement) {
    const pendingStop = this.stopTimers.get(element);
    if (!pendingStop) return;
    clearTimeout(pendingStop);
    this.stopTimers.delete(element);
  }

  private getSamplePool(name: SoundName) {
    let pool = this.pools.get(name);
    if (!pool) {
      pool = Array.from({ length: 3 }, () => {
        const element = document.createElement("audio");
        element.src = SOUND_URLS[name];
        element.preload = "none";
        element.volume = getSoundVolume(name);
        element.addEventListener(
          "ended",
          () => this.clearStopTimer(element),
        );
        return element;
      });
      this.pools.set(name, pool);
      this.poolIndex.set(name, 0);
    }
    return pool;
  }

  playSample(name: SoundName, options?: SoundPlaybackOptions) {
    const pool = this.getSamplePool(name);

    const idx = this.poolIndex.get(name) || 0;
    const el = pool[idx];
    this.poolIndex.set(name, (idx + 1) % pool.length);
    
    el.currentTime = 0;
    el.playbackRate =
      typeof options?.rate === "number"
      && Number.isFinite(options.rate)
      && options.rate > 0
        ? options.rate
        : 1;
    this.clearStopTimer(el);
    el.play().catch(() => {});
    
    const maxMs =
      typeof options?.maxMs === "number"
      && Number.isFinite(options.maxMs)
      && options.maxMs > 0
        ? options.maxMs
        : null;
    if (maxMs !== null) {
      const stopTimer = setTimeout(() => {
        el.pause();
        el.currentTime = 0;
        this.stopTimers.delete(el);
      }, maxMs);
      this.stopTimers.set(el, stopTimer);
    }
  }

  primeSample(name: SoundName) {
    if (typeof document === "undefined") return false;

    let primer = this.samplePrimers.get(name);
    if (!primer) {
      primer = document.createElement("audio");
      primer.src = SOUND_URLS[name];
      primer.preload = "auto";
      primer.muted = true;
      this.samplePrimers.set(name, primer);
    }

    try {
      const playback = primer.play();
      void playback
        .then(() => {
          primer.pause();
          primer.currentTime = 0;
        })
        .catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    localStorage.setItem("sound-muted", String(muted));
  }

  getMuted() {
    return this.muted;
  }

  setEngine(engine: AudioEngine) {
    this.engine = engine;
    localStorage.setItem("sound-engine", engine);
    if (engine === "synth" && supportsSynthPlayback()) {
      void prepareSelectedSynthEngine();
    }
  }

  getEngine() {
    return this.engine;
  }

  toggle() {
    this.setMuted(!this.muted);
    return this.muted;
  }
}

export const audio = new AudioManager();

export function playClick() {
  audio.play("click");
}

export function playDrop() {
  audio.play("drop");
}

export function playPaperRustle() {
  audio.play("paperRustle", getPaperRustlePlaybackOptions());
}

export function playSwipeForward() {
  audio.play("swipeForward");
}

export function playSwipeBackward() {
  audio.play("swipeBackward");
}

export function initAudio() {
  audio.init();
}

export function primeAudio() {
  audio.init();
  if (audio.getMuted()) {
    return Promise.resolve(false);
  }
  if (
    audio.getEngine() === "sample"
    || !supportsSynthPlayback()
  ) {
    return Promise.resolve(audio.primeSample("paperRustle"));
  }
  return primeAudioContext();
}

export function toggleMute() {
  return audio.toggle();
}

export function isMuted() {
  return audio.getMuted();
}

export function setAudioEngine(engine: AudioEngine) {
  audio.setEngine(engine);
}

export function getAudioEngine() {
  return audio.getEngine();
}

export function playSample(name: SoundName) {
  audio.playSample(name);
}
