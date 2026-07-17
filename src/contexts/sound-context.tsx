"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  initAudio,
  toggleMute as toggleAudioMute,
  isMuted as getAudioMuted,
  playClick,
  getAudioEngine,
  setAudioEngine,
  playPaperRustle,
  primeAudio,
  DEFAULT_AUDIO_ENGINE,
  type AudioEngine,
} from "@/lib/audio";

export type SoundCategory = "interaction" | "intro" | "ambient" | "transition";
export type RouteId = "home" | "thoughts" | "artifacts";

type InteractionSound = "click" | "confetti" | "navigate" | "rustle";

type SoundContextType = {
  isMuted: boolean;
  toggleMute: () => void;
  playSound: (sound: InteractionSound, alt?: boolean) => void;
  playIntro: (route: RouteId) => void;
  playTransition: (direction: "forward" | "backward") => void;
  engine: AudioEngine;
  setEngine: (engine: AudioEngine) => void;
};

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [engine, setEngineState] = useState<AudioEngine>(
    DEFAULT_AUDIO_ENGINE,
  );

  useEffect(() => {
    initAudio();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage sync on mount to read persisted mute state
    setIsMuted(getAudioMuted());
    setEngineState(getAudioEngine());

    const primeOnInteraction = () => {
      void primeAudio();
    };
    window.addEventListener("pointerdown", primeOnInteraction, {
      capture: true,
    });
    window.addEventListener("keydown", primeOnInteraction, {
      capture: true,
    });
    return () => {
      window.removeEventListener("pointerdown", primeOnInteraction, {
        capture: true,
      });
      window.removeEventListener("keydown", primeOnInteraction, {
        capture: true,
      });
    };
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = toggleAudioMute();
    setIsMuted(newMuted);
  }, []);

  const playSound = useCallback((sound: InteractionSound) => {
    if (sound === "navigate") {
      playClick();
      playPaperRustle();
    } else if (sound === "click") {
      playClick();
    } else if (sound === "rustle") {
      playPaperRustle();
    }
    // "confetti" is a no-op for now
  }, []);

  const playIntro = useCallback(() => {
    // Intros removed for now
  }, []);

  const playTransition = useCallback(() => {
    playPaperRustle();
  }, []);

  const setEngine = useCallback((nextEngine: AudioEngine) => {
    setAudioEngine(nextEngine);
    setEngineState(nextEngine);
  }, []);

  return (
    <SoundContext.Provider
      value={{
        isMuted,
        toggleMute,
        playSound,
        playIntro,
        playTransition,
        engine,
        setEngine,
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
