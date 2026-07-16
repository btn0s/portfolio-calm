import { playSynth, type SynthSoundName } from "@/lib/synth-audio";

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

const VOLUMES: Partial<Record<SoundName, number>> = {
  click: 0.15,
  drop: 0.15,
  swipeForward: 0.08,
  swipeBackward: 0.08,
};

class AudioManager {
  private pools: Map<SoundName, HTMLAudioElement[]> = new Map();
  private poolIndex: Map<SoundName, number> = new Map();
  private muted = false;
  private initialized = false;
  private engine: AudioEngine = "sample";

  init() {
    if (this.initialized || typeof window === "undefined") return;
    
    const stored = localStorage.getItem("sound-muted");
    this.muted = stored === "true";
    this.engine = localStorage.getItem("sound-engine") === "synth" ? "synth" : "sample";
    this.initialized = true;
  }

  play(name: SoundName, options?: { rate?: number; maxMs?: number }) {
    if (this.muted || !this.initialized) return;

    if (this.engine === "synth") {
      playSynth(name as SynthSoundName);
      return;
    }

    this.playSample(name, options);
  }

  playSample(name: SoundName, options?: { rate?: number; maxMs?: number }) {
    let pool = this.pools.get(name);
    if (!pool) {
      pool = Array.from({ length: 3 }, () => {
        const element = document.createElement("audio");
        element.src = SOUND_URLS[name];
        element.preload = "none";
        element.volume = VOLUMES[name] ?? 0.18;
        return element;
      });
      this.pools.set(name, pool);
      this.poolIndex.set(name, 0);
    }

    const idx = this.poolIndex.get(name) || 0;
    const el = pool[idx];
    this.poolIndex.set(name, (idx + 1) % pool.length);
    
    el.currentTime = 0;
    el.playbackRate = options?.rate || 1;
    el.play().catch(() => {});
    
    if (options?.maxMs) {
      setTimeout(() => {
        el.pause();
        el.currentTime = 0;
      }, options.maxMs);
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

export function playSwipeForward() {
  audio.play("swipeForward");
}

export function playSwipeBackward() {
  audio.play("swipeBackward");
}

export function initAudio() {
  audio.init();
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

export { playSynth, renderSynthOffline, audioBufferToWavDataUrl } from "@/lib/synth-audio";
