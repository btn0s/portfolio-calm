"use client";

import Link, { LinkProps } from "next/link";
import { useSoundSettings } from "@/contexts/sound-context";
import { ReactNode } from "react";

interface SoundPlayingLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
  alt?: boolean;
}

export function SoundPlayingLink({
  children,
  onClick,
  alt = false,
  ...props
}: SoundPlayingLinkProps) {
  const { playSound } = useSoundSettings();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    playSound("click", alt);
    onClick?.(e);
  };

  return (
    <Link {...props} onClick={handleClick}>
      {children}
    </Link>
  );
}
