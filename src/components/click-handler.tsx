"use client";

import { useEffect } from "react";
import { useSoundSettings } from "@/contexts/sound-context";

export function ClickHandler() {
  const { playSound } = useSoundSettings();

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const isMetaKey = event.metaKey || event.ctrlKey;

      if (isMetaKey) {
        playSound("confetti");
      }
    };

    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [playSound]);

  return null;
}
