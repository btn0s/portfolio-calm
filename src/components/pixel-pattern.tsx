"use client";

import React, { useEffect, useState } from "react";

// Seeded random for consistent patterns
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Simple noise function for terrain
const noise = (x: number, y: number, seed: number = 0) => {
  return seededRandom(x * 12.9898 + y * 78.233 + seed);
};

// Smooth interpolation
const smoothNoise = (x: number, y: number, seed: number = 0) => {
  const fx = Math.floor(x);
  const fy = Math.floor(y);
  const cx = fx + 1;
  const cy = fy + 1;

  const a = noise(fx, fy, seed);
  const b = noise(cx, fy, seed);
  const c = noise(fx, cy, seed);
  const d = noise(cx, cy, seed);

  const fracX = x - fx;
  const fracY = y - fy;

  const i1 = a * (1 - fracX) + b * fracX;
  const i2 = c * (1 - fracX) + d * fracX;

  return i1 * (1 - fracY) + i2 * fracY;
};

// Fractal noise with multiple octaves
const fractalNoise = (x: number, y: number, time: number = 0) => {
  const n1 = smoothNoise(x * 3 + time * 0.1, y * 3 + time * 0.08, 0) * 0.5;
  const n2 = smoothNoise(x * 6 + time * 0.15, y * 6 + time * 0.12, 100) * 0.25;
  const n3 = smoothNoise(x * 12 + time * 0.2, y * 12 + time * 0.18, 200) * 0.125;
  const n4 = smoothNoise(x * 24 + time * 0.25, y * 24 + time * 0.22, 300) * 0.0625;
  
  // Add ridges for more interesting terrain
  const ridge = Math.abs(smoothNoise(x * 2 + time * 0.05, y * 2 + time * 0.04, 400)) * 0.15;
  
  return n1 + n2 + n3 + n4 - ridge;
};

export function PixelPattern({ size = 24 }: { size?: number }) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((t) => t + 0.015);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const pixels = Array.from({ length: size * size }, (_, i) => {
    const x = i % size;
    const y = Math.floor(i / size);
    
    // Normalize coordinates with slight offset for more interesting patterns
    const nx = (x / size) * 1.2 - 0.1;
    const ny = (y / size) * 1.2 - 0.1;
    
    // Get terrain height with fractal noise
    const height = fractalNoise(nx, ny, time);
    
    // Add distance from center for island-like effect
    const centerX = 0.5;
    const centerY = 0.5;
    const dist = Math.sqrt((nx - centerX) ** 2 + (ny - centerY) ** 2);
    const islandFactor = (1 - dist * 1.5) * 0.2;
    
    const finalHeight = height + islandFactor;
    
    // Determine terrain type based on height
    if (finalHeight < 0.35) {
      // Deep water - transparent
      return { type: 'water', opacity: 0 };
    } else if (finalHeight < 0.45) {
      // Shallow water - very light
      return { type: 'shallow', opacity: 0.15 };
    } else if (finalHeight < 0.55) {
      // Coast/beach - medium
      return { type: 'coast', opacity: 0.5 };
    } else if (finalHeight < 0.7) {
      // Land - high
      return { type: 'land', opacity: 0.75 };
    } else {
      // Mountains - highest
      return { type: 'mountain', opacity: 0.9 };
    }
  });

  return (
    <div 
      className="grid gap-px bg-transparent" 
      style={{ 
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        width: '100%',
        aspectRatio: '1/1'
      }}
    >
      {pixels.map((pixel, i) => (
        <div 
          key={i}
          className="w-full h-full transition-opacity duration-500"
          style={{ 
            backgroundColor: `rgba(0, 0, 0, ${pixel.opacity})`
          }}
        />
      ))}
    </div>
  );
}
