"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import useSound from "use-sound";

// Sound settings
export const SOUND_VOLUME = 0.15;
export const AMBIENT_VOLUME = 0.1;
export const INTRO_VOLUME = 0.2;
export const TRANSITION_VOLUME = 0.15;

// Sound categories
export type SoundCategory = "interaction" | "intro" | "ambient" | "transition";

// Route IDs for intro/ambient sounds
export type RouteId = "home" | "thoughts" | "artifacts";

// Sound configuration
export const SOUND_CONFIG = {
  interaction: {
    click: "/assets/audio/click.wav",
    clickAlt: "/assets/audio/click-alt.mp3",
    confetti: "/assets/audio/sad-party-horn.wav",
    drop: "/assets/audio/drop.mp3",
    rustle: "/assets/audio/Paper Rustle Sound Effect.mp3",
  },
  intro: {
    home: "/assets/audio/intro-home.mp3",
    thoughts: "/assets/audio/intro-thoughts.mp3",
    artifacts: "/assets/audio/intro-artifacts.mp3",
  },
  ambient: {
    global: "/assets/audio/ambient-global.mp3",
    home: "/assets/audio/ambient-home.mp3",
    thoughts: "/assets/audio/ambient-thoughts.mp3",
    artifacts: "/assets/audio/ambient-artifacts.mp3",
  },
  transition: {
    swipeForward: "/assets/audio/swipe-forward.mp3",
    swipeBackward: "/assets/audio/swipe-backward.mp3",
  },
} as const;

// Legacy SOUNDS export for backward compatibility
export const SOUNDS = SOUND_CONFIG.interaction;

// Types
type SoundContextType = {
  isMuted: boolean;
  toggleMute: () => void;
  playSound: (sound: keyof typeof SOUND_CONFIG.interaction, alt?: boolean) => void;
  playIntro: (route: RouteId) => void;
  playTransition: (direction: "forward" | "backward") => void;
  getSoundUrl: (category: SoundCategory, key: string) => string;
};

// Create context
const SoundContext = createContext<SoundContextType | undefined>(undefined);

// Storage keys
const MUTE_STORAGE_KEY = "sound-muted";
const OVERRIDE_PREFIX = "sound-override-";

// Get override key for a sound
const getOverrideKey = (category: SoundCategory, key: string): string => {
  return `${OVERRIDE_PREFIX}${category}-${key}`;
};

// Get sound URL with override support
const getSoundUrl = (category: SoundCategory, key: string): string => {
  if (typeof window === "undefined") {
    // Server-side: return default
    const config = SOUND_CONFIG[category] as Record<string, string>;
    return config[key] || "";
  }

  // Check for localStorage override
  const overrideKey = getOverrideKey(category, key);
  const override = localStorage.getItem(overrideKey);
  
  if (override) {
    return override;
  }

  // Return default
  const config = SOUND_CONFIG[category] as Record<string, string>;
  return config[key] || "";
};

// Unlock audio context for mobile browsers
const unlockAudioContext = () => {
  if (typeof window === "undefined") return;

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  if (audioContext.state === "suspended") {
    const buffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
    
    audioContext.resume().catch(() => {
      // Ignore errors - audio will unlock on next user interaction
    });
  }
};

// Provider component
export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMuted, setIsMuted] = useState(false);
  const audioUnlockedRef = useRef(false);
  const [soundOverrides, setSoundOverrides] = useState<Record<string, string>>({});
  const rustleAudioPoolRef = useRef<HTMLAudioElement[]>([]);

  // Load sound overrides from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadOverrides = () => {
      const overrides: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(OVERRIDE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            overrides[key] = value;
          }
        }
      }
      setSoundOverrides(overrides);
    };

    loadOverrides();

    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith(OVERRIDE_PREFIX)) {
        loadOverrides();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Get sound URL with override support
  const getSoundUrlWithOverride = useCallback((category: SoundCategory, key: string): string => {
    const overrideKey = getOverrideKey(category, key);
    const override = soundOverrides[overrideKey];
    
    if (override) {
      return override;
    }

    const config = SOUND_CONFIG[category] as Record<string, string>;
    return config[key] || "";
  }, [soundOverrides]);

  // Helper to play sound with override support
  const playSoundWithOverride = useCallback((
    category: SoundCategory,
    key: string,
    volume: number,
    useSoundHook: () => void
  ) => {
    if (isMuted) return;

    if (!audioUnlockedRef.current) {
      unlockAudioContext();
      audioUnlockedRef.current = true;
    }

    const overrideKey = getOverrideKey(category, key);
    const override = soundOverrides[overrideKey];

    if (override) {
      // Use HTML5 Audio for overrides
      const audio = new Audio(override);
      audio.volume = volume;
      audio.play().catch(() => {
        // Ignore play errors
      });
    } else {
      // Use useSound hook for defaults
      useSoundHook();
    }
  }, [isMuted, soundOverrides]);

  // Load interaction sounds with useSound hook (for defaults)
  const [playClick] = useSound(SOUND_CONFIG.interaction.click, {
    volume: isMuted ? 0 : SOUND_VOLUME,
    preload: true,
    html5: true,
  });
  const [playClickAlt] = useSound(SOUND_CONFIG.interaction.clickAlt, {
    volume: isMuted ? 0 : SOUND_VOLUME,
    preload: true,
    html5: true,
  });
  const [playConfetti] = useSound(SOUND_CONFIG.interaction.confetti, {
    volume: isMuted ? 0 : SOUND_VOLUME,
    preload: true,
    html5: true,
  });
  const [playDrop] = useSound(SOUND_CONFIG.interaction.drop, {
    volume: isMuted ? 0 : SOUND_VOLUME,
    preload: true,
    html5: true,
  });

  // Initialize rustle audio pool with multiple instances for variation
  useEffect(() => {
    if (typeof window === "undefined") return;

    rustleAudioPoolRef.current = Array.from({ length: 3 }, () => {
      const audio = new Audio(SOUND_CONFIG.interaction.rustle);
      audio.volume = isMuted ? 0 : SOUND_VOLUME;
      audio.preload = "auto";
      // Preload the audio to ensure immediate playback
      audio.load();
      return audio;
    });

    return () => {
      rustleAudioPoolRef.current.forEach((audio) => {
        audio.pause();
      });
      rustleAudioPoolRef.current = [];
    };
  }, [isMuted]);

  // Update rustle audio pool volume when mute state changes
  useEffect(() => {
    rustleAudioPoolRef.current.forEach((audio) => {
      audio.volume = isMuted ? 0 : SOUND_VOLUME;
    });
  }, [isMuted]);

  // Load intro sounds
  const [playIntroHome] = useSound(SOUND_CONFIG.intro.home, {
    volume: isMuted ? 0 : INTRO_VOLUME,
    preload: true,
    html5: true,
  });
  const [playIntroThoughts] = useSound(SOUND_CONFIG.intro.thoughts, {
    volume: isMuted ? 0 : INTRO_VOLUME,
    preload: true,
    html5: true,
  });
  const [playIntroArtifacts] = useSound(SOUND_CONFIG.intro.artifacts, {
    volume: isMuted ? 0 : INTRO_VOLUME,
    preload: true,
    html5: true,
  });

  // Load transition sounds
  const [playSwipeForward] = useSound(SOUND_CONFIG.transition.swipeForward, {
    volume: isMuted ? 0 : TRANSITION_VOLUME,
    preload: true,
    html5: true,
  });
  const [playSwipeBackward] = useSound(SOUND_CONFIG.transition.swipeBackward, {
    volume: isMuted ? 0 : TRANSITION_VOLUME,
    preload: true,
    html5: true,
  });

  // Play rustle sound with randomization and 1-second limit
  const playRustleSound = useCallback(() => {
    if (isMuted || rustleAudioPoolRef.current.length === 0) return;

    // Unlock audio context immediately - this is a user interaction so it should work
    if (!audioUnlockedRef.current) {
      unlockAudioContext();
      audioUnlockedRef.current = true;
    }

    // Find an available audio instance (not currently playing)
    let audio = rustleAudioPoolRef.current.find((a) => a.paused);

    // If all are playing, use a random one and stop it first
    if (!audio) {
      audio =
        rustleAudioPoolRef.current[
          Math.floor(Math.random() * rustleAudioPoolRef.current.length)
        ];
      audio.pause();
      audio.currentTime = 0;
    }

    // Vary playback rate between 0.85x and 1.15x for natural variation
    const playbackRate = 0.85 + Math.random() * 0.3;
    
    // Set playback properties before playing for immediate start
    audio.playbackRate = playbackRate;
    audio.currentTime = 0;
    audio.volume = isMuted ? 0 : SOUND_VOLUME;

    // Play immediately - this is a user interaction so audio should be unlocked
    try {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Ignore play errors
        });
      }
    } catch (error) {
      // Ignore errors
    }

    // Stop after 1 second
    setTimeout(() => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }, 1000);
  }, [isMuted]);

  // Sound player utility
  const playSound = useCallback((sound: keyof typeof SOUND_CONFIG.interaction, alt?: boolean) => {
    if (alt && sound === "click") {
      playSoundWithOverride("interaction", "clickAlt", SOUND_VOLUME, playClickAlt);
    } else if (sound === "rustle") {
      playRustleSound();
    } else {
      playSoundWithOverride("interaction", sound, SOUND_VOLUME, () => {
        switch (sound) {
          case "click":
            playClick();
            break;
          case "confetti":
            playConfetti();
            break;
          case "drop":
            playDrop();
            break;
        }
      });
    }
  }, [playSoundWithOverride, playClick, playClickAlt, playConfetti, playDrop, playRustleSound]);

  // Play intro sound for a route
  const playIntro = useCallback((route: RouteId) => {
    switch (route) {
      case "home":
        playSoundWithOverride("intro", "home", INTRO_VOLUME, playIntroHome);
        break;
      case "thoughts":
        playSoundWithOverride("intro", "thoughts", INTRO_VOLUME, playIntroThoughts);
        break;
      case "artifacts":
        playSoundWithOverride("intro", "artifacts", INTRO_VOLUME, playIntroArtifacts);
        break;
    }
  }, [playSoundWithOverride, playIntroHome, playIntroThoughts, playIntroArtifacts]);

  // Play transition sound
  const playTransition = useCallback((direction: "forward" | "backward") => {
    if (direction === "forward") {
      playSoundWithOverride("transition", "swipeForward", TRANSITION_VOLUME, playSwipeForward);
    } else {
      playSoundWithOverride("transition", "swipeBackward", TRANSITION_VOLUME, playSwipeBackward);
    }
  }, [playSoundWithOverride, playSwipeForward, playSwipeBackward]);

  // Initialize audio on first user interaction (mobile requirement)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const unlockOnInteraction = () => {
      if (!audioUnlockedRef.current) {
        unlockAudioContext();
        audioUnlockedRef.current = true;
        document.removeEventListener("touchstart", unlockOnInteraction);
        document.removeEventListener("touchend", unlockOnInteraction);
        document.removeEventListener("click", unlockOnInteraction);
      }
    };

    document.addEventListener("touchstart", unlockOnInteraction, { once: true });
    document.addEventListener("touchend", unlockOnInteraction, { once: true });
    document.addEventListener("click", unlockOnInteraction, { once: true });

    return () => {
      document.removeEventListener("touchstart", unlockOnInteraction);
      document.removeEventListener("touchend", unlockOnInteraction);
      document.removeEventListener("click", unlockOnInteraction);
    };
  }, []);

  // Try to load preference from localStorage on initial load
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedMuteState = localStorage.getItem(MUTE_STORAGE_KEY);
    if (savedMuteState) {
      setIsMuted(savedMuteState === "true");
    }
  }, []);

  // Save preference when it changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    localStorage.setItem(MUTE_STORAGE_KEY, isMuted.toString());
  }, [isMuted]);

  // Toggle mute function
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <SoundContext.Provider
      value={{
        isMuted,
        toggleMute,
        playSound,
        playIntro,
        playTransition,
        getSoundUrl: getSoundUrlWithOverride,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

// Hook for component access to sound context
export const useSoundSettings = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error("useSoundSettings must be used within a SoundProvider");
  }
  return context;
};
