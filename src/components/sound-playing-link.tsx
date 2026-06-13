"use client";

import Link, { LinkProps } from "next/link";
import { ReactNode, useRef, useCallback } from "react";
import { useSoundSettings } from "@/contexts/sound-context";
import { useDragContextOptional } from "@/contexts/drag-context";
import { usePathname } from "next/navigation";

interface SoundPlayingLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
  alt?: boolean;
  sound?: "click" | "confetti" | "navigate";
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
  const dragContext = useDragContextOptional();
  const pathname = usePathname();
  const pointerIdRef = useRef<number | null>(null);

  const playSoundForLink = useCallback(() => {
    if (sound === "navigate") {
      const hrefString = hrefToString(href);
      const isCurrentPage = matchesCurrentRoute(hrefString, pathname);
      if (isCurrentPage) {
        playSound("click");
      } else {
        playSound("navigate");
      }
    } else if (sound) {
      if (alt && sound === "click") {
        playSound("click", true);
      } else {
        playSound(sound);
      }
    }
  }, [sound, href, pathname, playSound, alt]);

  const handlePointerDown = (e: React.PointerEvent<HTMLAnchorElement>) => {
    pointerIdRef.current = e.pointerId;
    
    // If inside a drag context, don't play sound immediately - wait for click
    if (dragContext) {
      return;
    }
    
    playSoundForLink();
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If drag was confirmed, the click should be prevented by receipt-stack
    // But if we get here, it was a real click - play sound now
    if (dragContext && pointerIdRef.current !== null) {
      if (!dragContext.wasDragConfirmed(pointerIdRef.current)) {
        playSoundForLink();
      }
    }
    
    pointerIdRef.current = null;
    onClick?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      playSoundForLink();
    }
  };

  return (
    <Link
      {...props}
      href={href}
      prefetch={props.prefetch ?? true}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      onDragStart={(e) => e.preventDefault()}
      draggable={false}
      className={className}
    >
      {children}
    </Link>
  );
}
