"use client";

import { useEffect, useRef } from "react";
import type Stats from "stats.js";

export function FpsMonitor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<Stats | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (!containerRef.current) return;

    let cancelled = false;
    let frameId: number | null = null;

    import("stats.js").then(({ default: Stats }) => {
      if (cancelled || !containerRef.current) return;

      const stats = new Stats();
      stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
      stats.dom.style.position = "fixed";
      stats.dom.style.top = "0";
      stats.dom.style.left = "0";
      stats.dom.style.zIndex = "9999";
      containerRef.current.appendChild(stats.dom);

      const animate = () => {
        stats.begin();
        stats.end();
        frameId = requestAnimationFrame(animate);
      };

      frameId = requestAnimationFrame(animate);
      statsRef.current = stats;
    });

    return () => {
      cancelled = true;
      if (frameId !== null) cancelAnimationFrame(frameId);
      if (containerRef.current && statsRef.current?.dom.parentNode) {
        containerRef.current.removeChild(statsRef.current.dom);
      }
    };
  }, []);

  if (process.env.NODE_ENV !== "development") return null;

  return <div ref={containerRef} />;
}
