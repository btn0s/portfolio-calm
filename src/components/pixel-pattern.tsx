"use client";

import React, { useMemo } from "react";

export function PixelPattern({ size = 24 }: { size?: number }) {
  const pixels = useMemo(() => {
    const grid = [];
    // Creating a pseudo-random but stable pattern
    // In a real app, you might want this to be deterministic based on some seed
    for (let i = 0; i < size * size; i++) {
      // Denser in some areas to mimic the image
      const x = i % size;
      const y = Math.floor(i / size);
      
      // Some simple logic to make it look less like noise and more like a graphic
      // Denser in the top-left, sparse in bottom-right (or vice-versa)
      const noise = Math.random();
      // Increase density based on position to create clusters
      const cluster = Math.sin(x * 0.4) * Math.cos(y * 0.4);
      const density = (y / size) * 0.5 + (x / size) * 0.3 + cluster * 0.3;
      grid.push(noise > 0.25 + density);
    }
    return grid;
  }, [size]);

  return (
    <div 
      className="grid gap-px bg-transparent" 
      style={{ 
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        width: '100%',
        aspectRatio: '1/1'
      }}
    >
      {pixels.map((filled, i) => (
        <div 
          key={i} 
          className={`${filled ? 'bg-black/80' : 'bg-transparent'} w-full h-full`}
        />
      ))}
    </div>
  );
}
