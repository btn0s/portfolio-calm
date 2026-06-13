"use client";

import { Volume2Icon, VolumeXIcon } from "lucide-react";
import { useSoundSettings } from "@/contexts/sound-context";
import { useSyncExternalStore } from "react";

export function SoundToggle() {
  const { isMuted, toggleMute, playSound } = useSoundSettings();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  if (!mounted) {
    return (
      <button
        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Toggle sound"
      >
        <Volume2Icon className="size-4" />
      </button>
    );
  }

  const handlePointerDown = () => {
    // Only play sound if not currently muted
    if (!isMuted) {
      playSound("click", true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    // Play sound feedback on keyboard activation (Enter or Space)
    if (e.key === "Enter" || e.key === " ") {
      if (!isMuted) {
        playSound("click", true);
      }
    }
  };

  return (
    <button
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onClick={toggleMute}
      className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-sm"
      aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
    >
      {isMuted ? (
        <VolumeXIcon className="size-4" />
      ) : (
        <Volume2Icon className="size-4" />
      )}
    </button>
  );
}
