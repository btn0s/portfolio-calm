"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSoundSettings, SOUND_CONFIG, AMBIENT_VOLUME, type RouteId } from "@/contexts/sound-context";

const CROSSFADE_DURATION = 500; // milliseconds

// Map pathname to route ID
function getRouteFromPathname(pathname: string): RouteId {
  if (pathname === "/" || pathname === "") {
    return "home";
  }
  if (pathname.startsWith("/thoughts")) {
    return "thoughts";
  }
  if (pathname.startsWith("/artifacts")) {
    return "artifacts";
  }
  return "home";
}

export function AmbientSoundManager() {
  const pathname = usePathname();
  const { isMuted, getSoundUrl } = useSoundSettings();
  const globalAudioRef = useRef<HTMLAudioElement | null>(null);
  const routeAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentRouteRef = useRef<RouteId | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio elements
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Create global ambient audio
    const globalAudio = new Audio();
    globalAudio.loop = true;
    globalAudio.volume = 0;
    globalAudio.preload = "auto";
    globalAudioRef.current = globalAudio;

    // Create route-specific ambient audio
    const routeAudio = new Audio();
    routeAudio.loop = true;
    routeAudio.volume = 0;
    routeAudio.preload = "auto";
    routeAudioRef.current = routeAudio;

    return () => {
      globalAudio.pause();
      globalAudio.src = "";
      routeAudio.pause();
      routeAudio.src = "";
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  // Initialize global ambient (only once)
  useEffect(() => {
    const globalAudio = globalAudioRef.current;
    if (!globalAudio) return;

    const globalUrl = getSoundUrl("ambient", "global");
    if (globalUrl && !globalAudio.src) {
      globalAudio.src = globalUrl;
      globalAudio.volume = isMuted ? 0 : AMBIENT_VOLUME * 0.5;
      globalAudio.load();
      if (!isMuted) {
        globalAudio.play().catch(() => {
          // Ignore play errors
        });
      }
    }
  }, [getSoundUrl, isMuted]);

  // Update ambient sounds when route changes
  useEffect(() => {
    const routeAudio = routeAudioRef.current;
    if (!routeAudio) return;

    const newRoute = getRouteFromPathname(pathname);
    const currentRoute = currentRouteRef.current;

    // Skip if same route
    if (newRoute === currentRoute) return;

    // Get sound URL for new route
    const routeUrl = getSoundUrl("ambient", newRoute);

    if (!routeUrl) {
      // No sound for this route - fade out current
      if (routeAudio.src) {
        const steps = 20;
        const stepDuration = CROSSFADE_DURATION / steps;
        let step = 0;
        const fadeInterval = setInterval(() => {
          step++;
          routeAudio.volume = Math.max(0, (1 - step / steps) * AMBIENT_VOLUME);
          if (step >= steps) {
            clearInterval(fadeInterval);
            routeAudio.pause();
            routeAudio.currentTime = 0;
            routeAudio.src = "";
          }
        }, stepDuration);
      }
      currentRouteRef.current = newRoute;
      return;
    }

    // Crossfade to new route sound
    if (!routeAudio.src || !currentRoute) {
      // First load - no crossfade needed
      routeAudio.src = routeUrl;
      routeAudio.volume = isMuted ? 0 : AMBIENT_VOLUME;
      routeAudio.load();
      if (!isMuted) {
        routeAudio.play().catch(() => {
          // Ignore play errors
        });
      }
    } else {
      // Crossfade: fade out old, fade in new
      const oldVolume = routeAudio.volume;
      routeAudio.src = routeUrl;
      routeAudio.load();
      routeAudio.volume = 0;
      
      if (!isMuted) {
        routeAudio.play().catch(() => {
          // Ignore play errors
        });
      }

      const steps = 20;
      const stepDuration = CROSSFADE_DURATION / steps;
      let step = 0;
      
      // Clear any existing fade timeout
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }

      const fadeInterval = setInterval(() => {
        step++;
        const progress = step / steps;
        
        if (routeUrl && !isMuted) {
          routeAudio.volume = Math.min(AMBIENT_VOLUME, progress * AMBIENT_VOLUME);
        } else {
          routeAudio.volume = 0;
        }

        if (step >= steps) {
          clearInterval(fadeInterval);
        }
      }, stepDuration);
    }

    currentRouteRef.current = newRoute;
  }, [pathname, isMuted, getSoundUrl]);

  // Update volumes when mute state changes
  useEffect(() => {
    const globalAudio = globalAudioRef.current;
    const routeAudio = routeAudioRef.current;
    if (!globalAudio || !routeAudio) return;

    if (isMuted) {
      globalAudio.volume = 0;
      routeAudio.volume = 0;
    } else {
      globalAudio.volume = AMBIENT_VOLUME * 0.5;
      routeAudio.volume = AMBIENT_VOLUME;
    }
  }, [isMuted]);

  return null;
}
