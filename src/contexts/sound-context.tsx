"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { 
  initAudio, 
  toggleMute as toggleAudioMute, 
  isMuted as getAudioMuted,
  playClick,
  playRustle,
  playDrop,
  playSwipeForward,
  playSwipeBackward,
} from "@/lib/audio";

export type SoundCategory = "interaction" | "intro" | "ambient" | "transition";
export type RouteId = "home" | "thoughts" | "artifacts";

type InteractionSound = "click" | "clickAlt" | "confetti" | "drop" | "rustle" | "navigate";

type SoundContextType = {
  isMuted: boolean;
  toggleMute: () => void;
  playSound: (sound: InteractionSound, alt?: boolean) => void;
  playIntro: (route: RouteId) => void;
  playTransition: (direction: "forward" | "backward") => void;
  getSoundUrl: (category: SoundCategory, key: string) => string;
  primeAudio: () => void;
};

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    initAudio();
    setIsMuted(getAudioMuted());
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = toggleAudioMute();
    setIsMuted(newMuted);
  }, []);

  const playSound = useCallback((sound: InteractionSound) => {
    if (sound === "navigate") {
      playClick();
      playRustle();
    } else if (sound === "click" || sound === "clickAlt") {
      playClick();
    } else if (sound === "rustle") {
      playRustle();
    } else if (sound === "drop") {
      playDrop();
    }
  }, []);

  const playIntro = useCallback(() => {
    // Intros removed for now
  }, []);

  const playTransition = useCallback((direction: "forward" | "backward") => {
    if (direction === "forward") {
      playSwipeForward();
    } else {
      playSwipeBackward();
    }
  }, []);

  const getSoundUrl = useCallback(() => "", []);
  const primeAudio = useCallback(() => {}, []);

  return (
    <SoundContext.Provider
      value={{
        isMuted,
        toggleMute,
        playSound,
        playIntro,
        playTransition,
        getSoundUrl,
        primeAudio,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSoundSettings = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error("useSoundSettings must be used within a SoundProvider");
  }
  return context;
};

// Re-export for backward compatibility
export const SOUND_VOLUME = 0.15;
export const AMBIENT_VOLUME = 0.1;
export const SOUNDS = {
  click: "/assets/audio/click-alt.mp3",
  clickAlt: "/assets/audio/click-alt.mp3",
  confetti: "/assets/audio/sad-party-horn.wav",
  drop: "/assets/audio/drop.mp3",
  rustle: "/assets/audio/Paper Rustle Sound Effect.mp3",
};
export const SOUND_CONFIG = {
  interaction: SOUNDS,
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
};
