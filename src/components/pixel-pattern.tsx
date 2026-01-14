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

interface Cell { 
  edgeFade: number;
  nx: number;
  ny: number;
  x: number;
  y: number;
}

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
    const margin = size * 0.25;
    for (let i = 0; i < size * size; i++) {
      const x = i % size, y = (i / size) | 0;
      const fx = Math.min(x, size - 1 - x) / margin;
      const fy = Math.min(y, size - 1 - y) / margin;
      const noise = (hash(i + 500) - 0.5) * 0.4;
      const edgeFade = Math.max(0, Math.min(1, Math.min(fx, fy) + noise));
      cells[i] = { 
        edgeFade,
        nx: x / size * 2.0,
        ny: y / size * 2.0,
        x,
        y
      };
    }
    return cells;
  }, [size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { 
      alpha: true,
      willReadFrequently: false 
    });
    if (!ctx) return;

    let frameId: number;
    const cellSize = canvas.width / size;
    const cellSizeInt = Math.floor(cellSize);
    const cellSizeMinus2 = cellSizeInt - 2;
    
    // Parse color to RGBA for ImageData using canvas context
    ctx.fillStyle = getComputedStyle(canvas).color || "black";
    ctx.fillRect(0, 0, 1, 1);
    const pixelData = ctx.getImageData(0, 0, 1, 1).data;
    const r = pixelData[0];
    const g = pixelData[1];
    const b = pixelData[2];
    
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    const render = (t: number) => {
      // Clear image data
      for (let i = 3; i < data.length; i += 4) {
        data[i] = 0; // alpha channel
      }
      
      const time = t * 0.001;
      const flow = time * 0.4;
      const flow2 = flow * 1.5;
      const flow3 = flow * 0.2;
      const flow4 = flow * 0.1;
      const flow5 = flow * 0.5;
      const glintTime = Math.floor(time * 10);
      
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        if (cell.edgeFade <= 0) continue;

        const nx = cell.nx;
        const ny = cell.ny;

        // 1. Directional waves (flowing diagonal)
        const wave1 = Math.sin(nx * 4 + ny * 3 + flow);
        const wave2 = Math.sin(nx * 2 - ny * 5 - flow2);
        const combinedWaves = (wave1 + wave2) * 0.5;

        // 2. Caustic patterns (ridged noise)
        const n1 = fbm(nx + flow3, ny + flow4, flow5);
        const caustic = Math.pow(1.0 - Math.abs(n1 - 0.5) * 2.0, 3.0);

        // 3. Specular glints (high frequency peaks)
        const glintNoise = hash(i + glintTime) > 0.98 ? 1 : 0;
        const combinedWavesPositive = combinedWaves > 0 ? combinedWaves : 0;
        const glint = glintNoise * combinedWavesPositive * 0.4;

        // Final opacity mix
        let opacity = 0.05; // Ambient
        opacity += combinedWavesPositive * 0.15; // Surface movement
        opacity += caustic * 0.35; // Caustic networks
        opacity += glint; // Sun glints

        opacity *= cell.edgeFade;

        if (opacity > 0.01) {
          const alpha = Math.min(255, Math.floor(opacity * 255));
          const xStart = Math.floor(cell.x * cellSize);
          const yStart = Math.floor(cell.y * cellSize);
          
          // Fill cell rectangle in ImageData
          for (let py = 0; py < cellSizeMinus2; py++) {
            const y = yStart + py;
            if (y >= canvas.height) break;
            for (let px = 0; px < cellSizeMinus2; px++) {
              const x = xStart + px;
              if (x >= canvas.width) break;
              const idx = (y * canvas.width + x) * 4;
              data[idx] = r;
              data[idx + 1] = g;
              data[idx + 2] = b;
              data[idx + 3] = alpha;
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
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
      aria-hidden="true"
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
