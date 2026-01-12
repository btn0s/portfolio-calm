"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import useSound from "use-sound";

// Sound settings
export const SOUND_VOLUME = 0.15;

// Sound files
export const SOUNDS = {
  click: "/assets/audio/click.wav",
  clickAlt: "/assets/audio/click-alt.mp3",
  confetti: "/assets/audio/sad-party-horn.wav",
  drop: "/assets/audio/drop.mp3",
};

// Types
type SoundContextType = {
  isMuted: boolean;
  toggleMute: () => void;
  playSound: (sound: keyof typeof SOUNDS, alt?: boolean) => void;
};

// Create context
const SoundContext = createContext<SoundContextType | undefined>(undefined);

// Storage key for persisting mute preference
const MUTE_STORAGE_KEY = "sound-muted";

// Unlock audio context for mobile browsers
const unlockAudioContext = () => {
  if (typeof window === "undefined") return;

  // Create a dummy audio context and play a silent sound to unlock audio
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
  // State for mute toggle
  const [isMuted, setIsMuted] = useState(false);
  const audioUnlockedRef = useRef(false);

  // Load sounds with useSound hook - preload for mobile support
  const [playClick] = useSound(SOUNDS.click, {
    volume: isMuted ? 0 : SOUND_VOLUME,
    preload: true,
    html5: true, // Better mobile support
  });
  const [playClickAlt] = useSound(SOUNDS.clickAlt, {
    volume: isMuted ? 0 : SOUND_VOLUME,
    preload: true,
    html5: true,
  });
  const [playConfetti] = useSound(SOUNDS.confetti, {
    volume: isMuted ? 0 : SOUND_VOLUME,
    preload: true,
    html5: true,
  });
  const [playDrop] = useSound(SOUNDS.drop, {
    volume: isMuted ? 0 : SOUND_VOLUME,
    preload: true,
    html5: true,
  });

  // Sound player utility
  const playSound = (sound: keyof typeof SOUNDS, alt?: boolean) => {
    if (isMuted) return;

    // Unlock audio context on first interaction (mobile requirement)
    if (!audioUnlockedRef.current) {
      unlockAudioContext();
      audioUnlockedRef.current = true;
    }

    switch (sound) {
      case "click":
        alt ? playClickAlt() : playClick();
        break;
      case "confetti":
        playConfetti();
        break;
      case "drop":
        playDrop();
        break;
    }
  };

  // Initialize audio on first user interaction (mobile requirement)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const unlockOnInteraction = () => {
      if (!audioUnlockedRef.current) {
        unlockAudioContext();
        audioUnlockedRef.current = true;
        // Remove listeners after first unlock
        document.removeEventListener("touchstart", unlockOnInteraction);
        document.removeEventListener("touchend", unlockOnInteraction);
        document.removeEventListener("click", unlockOnInteraction);
      }
    };

    // Listen for first user interaction
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
    <SoundContext.Provider value={{ isMuted, toggleMute, playSound }}>
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
