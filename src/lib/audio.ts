const SOUND_URLS = {
  click: "/assets/audio/click-alt.mp3",
  drop: "/assets/audio/drop.mp3",
  swipeForward: "/assets/audio/swipe-forward.mp3",
  swipeBackward: "/assets/audio/swipe-backward.mp3",
} as const;

type SoundName = keyof typeof SOUND_URLS;

const VOLUMES: Record<SoundName, number> = {
  click: 0.15,
  drop: 0.15,
  swipeForward: 0.08,
  swipeBackward: 0.08,
};

class Audio {
  private pools: Map<SoundName, HTMLAudioElement[]> = new Map();
  private poolIndex: Map<SoundName, number> = new Map();
  private muted = false;
  private initialized = false;

  init() {
    if (this.initialized || typeof window === "undefined") return;
    
    const stored = localStorage.getItem("sound-muted");
    this.muted = stored === "true";
    
    (Object.keys(SOUND_URLS) as SoundName[]).forEach(name => {
      const pool = Array.from({ length: 3 }, () => {
        const el = document.createElement("audio");
        el.src = SOUND_URLS[name];
        el.preload = "auto";
        el.volume = VOLUMES[name];
        return el;
      });
      this.pools.set(name, pool);
      this.poolIndex.set(name, 0);
    });
    
    this.initialized = true;
  }

  play(name: SoundName, options?: { rate?: number; maxMs?: number }) {
    if (this.muted || !this.initialized) return;
    
    const pool = this.pools.get(name);
    if (!pool) return;
    
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

  toggle() {
    this.setMuted(!this.muted);
    return this.muted;
  }
}

export const audio = new Audio();

export function playClick() {
  audio.play("click");
}

export function playRustle() {
  // Disabled - testing if rustle file is causing perf issues
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
