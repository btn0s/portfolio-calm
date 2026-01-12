"use client";

import { Volume2Icon, VolumeXIcon } from "lucide-react";
import { useSoundSettings } from "@/contexts/sound-context";
import { useEffect, useState } from "react";

export function SoundToggle() {
  const { isMuted, toggleMute } = useSoundSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  return (
    <button
      onClick={toggleMute}
      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
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
