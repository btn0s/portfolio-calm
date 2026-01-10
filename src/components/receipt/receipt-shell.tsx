"use client";

import { cn } from "@/lib/utils";

interface ReceiptShellProps {
  children: React.ReactNode;
  className?: string;
}

const RIP_HEIGHT = 8;

// Generate zigzag points for the bottom rip
const ZIGZAG_POINTS = (() => {
  const points = ["0% 0%", "100% 0%", "100% calc(100% - 8px)"];
  // Generate 50 teeth (100 points) for a consistent rip across any width
  for (let i = 50; i >= 0; i--) {
    const x = i * 2;
    const y = i % 2 === 0 ? `calc(100% - ${RIP_HEIGHT}px)` : "100%";
    points.push(`${x}% ${y}`);
  }
  return `polygon(${points.join(", ")})`;
})();

export function ReceiptShell({ children, className }: ReceiptShellProps) {
  return (
    <div
      className={cn(
        "relative font-mono text-sm bg-(--paper) selection:bg-black/10 shadow-sm",
        className
      )}
      style={{ clipPath: ZIGZAG_POINTS }}
    >
      {/* Texture layer */}
      <div className="absolute inset-0 paper-texture pointer-events-none" />

      {/* Subtle edge highlight to replace SVG stroke */}
      <div
        className="absolute inset-0 pointer-events-none border-x border-t border-black/2"
        style={{ clipPath: ZIGZAG_POINTS }}
      />

      <div className="relative z-10 p-6 sm:p-8 pt-12 pb-12 flex flex-col min-h-svh text-(--paper-foreground)">
        {children}
      </div>
    </div>
  );
}
