"use client";

import React, { useEffect, useRef, useMemo } from "react";

// Shader-style utilities
const hash = (n: number) => {
  const x = Math.sin(n * 9999) * 10000;
  return x - Math.floor(x);
};

const noise2d = (x: number, y: number, seed: number = 0) =>
  hash(x * 12.9898 + y * 78.233 + seed);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const smoothNoise = (x: number, y: number, seed: number = 0) => {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  return lerp(
    lerp(noise2d(ix, iy, seed), noise2d(ix + 1, iy, seed), fx),
    lerp(noise2d(ix, iy + 1, seed), noise2d(ix + 1, iy + 1, seed), fx),
    fy
  );
};

const smoothNoise3d = (x: number, y: number, z: number, seed: number = 0) => {
  const iz = Math.floor(z);
  const fz = z - iz;
  return lerp(
    smoothNoise(x + iz, y, seed),
    smoothNoise(x + iz + 1, y, seed),
    fz
  );
};

const fbm = (x: number, y: number, z: number = 0) => {
  let v = 0, a = 0.5;
  for (let i = 0; i < 3; i++) {
    v += smoothNoise3d(x * (2 << i), y * (2 << i), z, i * 100) * a;
    a *= 0.5;
  }
  return v;
};

interface Cell { edgeFade: number }

export function PixelPattern({ 
  size = 24,
  className,
  style
}: { 
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cells = useMemo(() => {
    const cells: Cell[] = new Array(size * size);
    for (let i = 0; i < size * size; i++) {
      const x = i % size, y = (i / size) | 0;
      const margin = size * 0.25;
      const fx = Math.min(x, size - 1 - x) / margin;
      const fy = Math.min(y, size - 1 - y) / margin;
      const noise = (hash(i + 500) - 0.5) * 0.4;
      const edgeFade = Math.max(0, Math.min(1, Math.min(fx, fy) + noise));
      cells[i] = { edgeFade };
    }
    return cells;
  }, [size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let frameId: number;
    const cellSize = canvas.width / size;
    const color = getComputedStyle(canvas).color || "black";

    const render = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const time = t * 0.001;
      
      for (let i = 0; i < size * size; i++) {
        const x = i % size, y = (i / size) | 0;
        const cell = cells[i];
        if (cell.edgeFade <= 0) continue;

        const nx = x / size * 2.0, ny = y / size * 2.0;

        // 1. Directional waves (flowing diagonal)
        const flow = time * 0.4;
        const wave1 = Math.sin(nx * 4 + ny * 3 + flow);
        const wave2 = Math.sin(nx * 2 - ny * 5 - flow * 1.5);
        const combinedWaves = (wave1 + wave2) * 0.5;

        // 2. Caustic patterns (ridged noise)
        const n1 = fbm(nx + flow * 0.2, ny + flow * 0.1, flow * 0.5);
        const caustic = Math.pow(1.0 - Math.abs(n1 - 0.5) * 2.0, 3.0);

        // 3. Specular glints (high frequency peaks)
        const glintNoise = hash(i + Math.floor(time * 10)) > 0.98 ? 1 : 0;
        const glint = glintNoise * Math.max(0, combinedWaves) * 0.4;

        // Final opacity mix
        // Base deep water + moving surface + sharp caustics + glints
        let opacity = 0.05; // Ambient
        opacity += Math.max(0, combinedWaves) * 0.15; // Surface movement
        opacity += caustic * 0.35; // Caustic networks
        opacity += glint; // Sun glints

        opacity *= cell.edgeFade;

        if (opacity > 0.01) {
          ctx.globalAlpha = Math.min(1, opacity);
          ctx.fillStyle = color;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize - 2, cellSize - 2);
        }
      }

      ctx.globalAlpha = 1.0;
      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [size, cells]);

  return (
    <canvas
      ref={canvasRef}
      width={size * 10}
      height={size * 10}
      className={className}
      style={{ 
        aspectRatio: "1/1", 
        imageRendering: "pixelated",
        width: "100%",
        height: "100%",
        ...style 
      }}
    />
  );
}
