"use client";

import { useEffect, useRef } from "react";
import Stats from "stats.js";

export function FpsMonitor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<Stats | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (!containerRef.current) return;

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
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    statsRef.current = stats;

    return () => {
      if (containerRef.current && stats.dom.parentNode) {
        containerRef.current.removeChild(stats.dom);
      }
    };
  }, []);

  if (process.env.NODE_ENV !== "development") return null;

  return <div ref={containerRef} />;
}
