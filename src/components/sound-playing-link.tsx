"use client";

import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";
import { useSoundSettings } from "@/contexts/sound-context";
import { usePathname } from "next/navigation";

interface SoundPlayingLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
  alt?: boolean;
  sound?: "click" | "clickAlt" | "confetti" | "drop" | "rustle" | "navigate";
}

function hrefToString(href: LinkProps["href"]): string | undefined {
  if (typeof href === "string") return href;
  if (typeof href === "object" && href !== null && "pathname" in href) {
    return href.pathname ?? undefined;
  }
  return undefined;
}

function normalizeHref(href: string | undefined): string {
  if (!href) return "";
  // Remove trailing slash for comparison
  return href === "/" ? "/" : href.replace(/\/$/, "");
}

function matchesCurrentRoute(href: string | undefined, pathname: string): boolean {
  if (!href) return false;
  const normalizedHref = normalizeHref(href);
  const normalizedPathname = normalizeHref(pathname);
  
  // Exact match
  if (normalizedHref === normalizedPathname) return true;
  
  // Check if pathname is a subpage of this route (e.g., /thoughts/post matches /thoughts)
  if (normalizedHref !== "/" && normalizedPathname.startsWith(normalizedHref + "/")) {
    return true;
  }
  
  return false;
}

export function SoundPlayingLink({
  children,
  onClick,
  alt = false,
  sound,
  className,
  href,
  ...props
}: SoundPlayingLinkProps) {
  const { playSound } = useSoundSettings();
  const pathname = usePathname();

  const handlePointerDown = (e: React.PointerEvent<HTMLAnchorElement>) => {
    // For navigate sound, check if we're actually navigating to a different page
    if (sound === "navigate") {
      const hrefString = hrefToString(href);
      const isCurrentPage = matchesCurrentRoute(hrefString, pathname);
      if (isCurrentPage) {
        // Same page - just play click feedback (main click, not alt)
        playSound("click");
      } else {
        // Different page - play navigate (click + rustle)
        playSound("navigate");
      }
    } else if (sound) {
      // Other sounds - play as normal
      if (alt && sound === "click") {
        playSound("click", true);
      } else {
        playSound(sound as any);
      }
    }
  };

  return (
    <Link
      {...props}
      href={href}
      onPointerDown={handlePointerDown}
      onClick={onClick}
      className={className}
    >
      {children}
    </Link>
  );
}
