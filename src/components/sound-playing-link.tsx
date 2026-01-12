"use client";

import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";
import { useSoundSettings } from "@/contexts/sound-context";

interface SoundPlayingLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
  alt?: boolean;
  sound?: "click" | "clickAlt" | "confetti" | "drop" | "rustle";
}

export function SoundPlayingLink({
  children,
  onClick,
  alt = false,
  sound,
  className,
  ...props
}: SoundPlayingLinkProps) {
  const { playSound } = useSoundSettings();

  const handlePointerDown = (e: React.PointerEvent<HTMLAnchorElement>) => {
    // Play sound on pointerdown for immediate feedback
    if (sound) {
      if (alt && sound === "click") {
        playSound("click", true);
      } else {
        playSound(sound);
      }
    }
  };

  return (
    <Link
      {...props}
      onPointerDown={handlePointerDown}
      onClick={onClick}
      className={className}
    >
      {children}
    </Link>
  );
}
