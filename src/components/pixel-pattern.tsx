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

const fbm = (x: number, y: number) => {
  let v = 0, a = 0.5;
  for (let i = 0; i < 4; i++) {
    v += smoothNoise(x * (3 << i), y * (3 << i), i * 100) * a;
    a *= 0.5;
  }
  return v - Math.abs(smoothNoise(x * 2, y * 2, 400)) * 0.15;
};

interface Cell { type: number; baseOpacity: number; shoreDist: number }

export function PixelPattern({ size = 24 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pre-compute static terrain data
  const cells = useMemo(() => {
    const cells: Cell[] = new Array(size * size);

    // First pass: compute terrain types
    for (let i = 0; i < size * size; i++) {
      const x = i % size, y = (i / size) | 0;
      const nx = x / size * 1.2 - 0.1, ny = y / size * 1.2 - 0.1;
      const dist = Math.hypot(nx - 0.5, ny - 0.5);
      const h = fbm(nx, ny) + (1 - dist * 1.5) * 0.2;

      // type: 0=water, 1=shallow, 2=coast, 3=land, 4=mountain
      const type = h < 0.38 ? 0 : h < 0.45 ? 1 : h < 0.52 ? 2 : h < 0.68 ? 3 : 4;
      let baseOpacity = [0, 0.08, 0.35, 0.6, 0.85][type];

      // Add darker patches on land using secondary noise
      if (type >= 2) {
        const darkNoise = smoothNoise(nx * 8, ny * 8, 500);
        if (darkNoise > 0.65) {
          baseOpacity = Math.min(1, baseOpacity + 0.25);
        }
      }

      cells[i] = { type, baseOpacity, shoreDist: type <= 1 ? 99 : 0 };
    }

    // Second pass: compute distance to shore for water cells (BFS)
    const queue: number[] = [];
    for (let i = 0; i < size * size; i++) {
      if (cells[i].type <= 1) {
        const x = i % size, y = (i / size) | 0;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
              if (cells[ny * size + nx].type >= 2) {
                cells[i].shoreDist = 1;
                queue.push(i);
                break;
              }
            }
          }
          if (cells[i].shoreDist === 1) break;
        }
      }
    }

    // Propagate distances
    while (queue.length > 0) {
      const i = queue.shift()!;
      const x = i % size, y = (i / size) | 0;
      const d = cells[i].shoreDist;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            const ni = ny * size + nx;
            if (cells[ni].type <= 1 && cells[ni].shoreDist > d + 1) {
              cells[ni].shoreDist = d + 1;
              queue.push(ni);
            }
          }
        }
      }
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

    const render = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const time = t * 0.001;

      for (let i = 0; i < size * size; i++) {
        const x = i % size, y = (i / size) | 0;
        const cell = cells[i];
        let opacity: number;

        if (cell.type <= 1) {
          const d = cell.shoreDist;

          if (d <= 3) {
            // Shore waves - ripple inward toward land
            const phase = x * 0.3 + y * 0.3;
            const wave = Math.sin(time * 0.8 + d * 1.2 + phase);
            const intensity = Math.max(0, wave) * (1 - d * 0.25);
            opacity = 0.03 + intensity * 0.25;
          } else {
            // Deep water - subtle shimmer
            const shimmer = Math.sin(time * 1.5 + x * 0.2 + y * 0.15) * 0.5 + 0.5;
            opacity = 0.02 + shimmer * 0.04;
          }
        } else {
          opacity = cell.baseOpacity;
        }

        if (opacity > 0.01) {
          ctx.fillStyle = `rgba(0,0,0,${opacity})`;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize - 2, cellSize - 2);
        }
      }

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
      className="w-full h-full"
      style={{ aspectRatio: "1/1", imageRendering: "pixelated" }}
    />
  );
}
