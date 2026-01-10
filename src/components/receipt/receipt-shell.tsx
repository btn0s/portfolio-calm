"use client";

import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";

interface ReceiptShellProps {
  children: React.ReactNode;
  className?: string;
}

const RIP_HEIGHT = 8;

export function ReceiptShell({ children, className }: ReceiptShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Generate SVG path with fixed 8px rip at bottom
  const generatePath = () => {
    const { width, height } = size;
    if (width === 0 || height === 0) return '';

    const points: string[] = [
      `M 0,0`,
      `L ${width},0`,
      `L ${width},${height - RIP_HEIGHT}`,
    ];

    // Bottom zigzag (right to left)
    for (let i = 50; i >= 0; i--) {
      const x = (i * 2 / 100) * width;
      const y = i % 2 === 0 ? height - RIP_HEIGHT : height;
      points.push(`L ${x},${y}`);
    }

    points.push(`Z`);
    return points.join(' ');
  };

  return (
    <div ref={containerRef} className={cn("relative font-mono text-sm", className)}>
      {size.width > 0 && size.height > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={generatePath()}
            fill="var(--paper)"
            stroke="rgba(0,0,0,0.05)"
            strokeWidth="1"
          />
        </svg>
      )}
      <div className="absolute inset-0 paper-texture" style={{ clipPath: `inset(0 0 ${RIP_HEIGHT}px 0)` }} />
      <div className="relative z-10 p-6 sm:p-8 pt-12 pb-12 flex flex-col min-h-[100svh] text-(--paper-foreground)">
        {children}
      </div>
    </div>
  );
}
