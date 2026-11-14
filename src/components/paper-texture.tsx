"use client";

import { useEffect } from "react";

// The paper grain is SVG fractal noise. Used directly as a CSS background, WebKit re-runs the
// feTurbulence filter at full card size on every repaint, which tanks the stack flip. Render it once
// into a bitmap and hand that to `.paper-texture` (see globals.css) instead.
const TILE_PX = 1024;
const NOISE_SVG = `<svg viewBox='0 0 200 200' width='${TILE_PX}' height='${TILE_PX}' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;

export function PaperTexture() {
  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    const img = new Image();
    img.src = `data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}`;
    img
      .decode()
      .then(() => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = TILE_PX;
        canvas.getContext("2d")?.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob || cancelled) return;
          url = URL.createObjectURL(blob);
          document.documentElement.style.setProperty("--paper-noise", `url(${url})`);
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      document.documentElement.style.removeProperty("--paper-noise");
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  return null;
}
