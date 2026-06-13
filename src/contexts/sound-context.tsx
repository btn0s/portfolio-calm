"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  initAudio,
  toggleMute as toggleAudioMute,
  isMuted as getAudioMuted,
  playClick,
  playSwipeForward,
  playSwipeBackward,
} from "@/lib/audio";

export type SoundCategory = "interaction" | "intro" | "ambient" | "transition";
export type RouteId = "home" | "thoughts" | "artifacts";

type InteractionSound = "click" | "confetti" | "navigate";

type SoundContextType = {
  isMuted: boolean;
  toggleMute: () => void;
  playSound: (sound: InteractionSound, alt?: boolean) => void;
  playIntro: (route: RouteId) => void;
  playTransition: (direction: "forward" | "backward") => void;
};

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    initAudio();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage sync on mount to read persisted mute state
    setIsMuted(getAudioMuted());
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = toggleAudioMute();
    setIsMuted(newMuted);
  }, []);

  const playSound = useCallback((sound: InteractionSound) => {
    if (sound === "navigate" || sound === "click") {
      playClick();
    }
    // "confetti" is a no-op for now
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

  return (
    <SoundContext.Provider
      value={{
        isMuted,
        toggleMute,
        playSound,
        playIntro,
        playTransition,
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
