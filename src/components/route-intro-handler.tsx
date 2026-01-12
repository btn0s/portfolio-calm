"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSoundSettings, type RouteId } from "@/contexts/sound-context";

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

export function RouteIntroHandler() {
  const pathname = usePathname();
  const { playIntro } = useSoundSettings();
  const previousPathnameRef = useRef<string | null>(null);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    // Skip on initial mount (don't play intro on first page load)
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousPathnameRef.current = pathname;
      return;
    }

    // Skip if pathname hasn't actually changed
    if (previousPathnameRef.current === pathname) {
      return;
    }

    // Get the route from pathname
    const route = getRouteFromPathname(pathname);
    const previousRoute = previousPathnameRef.current
      ? getRouteFromPathname(previousPathnameRef.current)
      : null;

    // Only play intro if route actually changed (not just subpage navigation)
    if (previousRoute !== route) {
      playIntro(route);
    }

    previousPathnameRef.current = pathname;
  }, [pathname, playIntro]);

  return null;
}
