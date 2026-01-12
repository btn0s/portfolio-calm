"use client";

import { cn } from "@/lib/utils";

interface ReceiptShellProps {
  children: React.ReactNode;
  className?: string;
  variant?: "receipt" | "dossier" | "blueprint" | "stationery";
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

const DOSSIER_POINTS = "polygon(20px 0%, calc(100% - 20px) 0%, 100% 20px, 100% 100%, 0% 100%, 0% 20px)";
const BLUEPRINT_POINTS = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
const STATIONERY_POINTS = (() => {
  const points = [];
  // Top edge
  for (let i = 0; i <= 20; i++) {
    const x = i * 5;
    const offset = (Math.sin(i * 1.5) * 0.4).toFixed(2);
    points.push(`${x}% ${offset}px`);
  }
  // Right edge
  for (let i = 1; i <= 20; i++) {
    const y = i * 5;
    const offset = (100 - Math.cos(i * 1.5) * 0.4).toFixed(2);
    points.push(`${offset}% ${y}%`);
  }
  // Bottom edge
  for (let i = 19; i >= 0; i--) {
    const x = i * 5;
    const offset = (100 - Math.sin(i * 1.5) * 0.4).toFixed(2);
    points.push(`${x}% ${offset}%`);
  }
  // Left edge
  for (let i = 19; i >= 1; i--) {
    const y = i * 5;
    const offset = (Math.cos(i * 1.5) * 0.4).toFixed(2);
    points.push(`${offset}px ${y}%`);
  }
  return `polygon(${points.join(", ")})`;
})();

export function ReceiptShell({
  children,
  className,
  variant = "receipt",
}: ReceiptShellProps) {
  const getClipPath = () => {
    switch (variant) {
      case "dossier":
        return DOSSIER_POINTS;
      case "blueprint":
        return BLUEPRINT_POINTS;
      case "stationery":
        return STATIONERY_POINTS;
      default:
        return ZIGZAG_POINTS;
    }
  };

  const variantStyles = {
    receipt: "bg-(--paper) text-(--paper-foreground) shadow-sm",
    dossier: "bg-[#2c3e2d] text-[#fdf6e3] border-2 border-[#fdf6e3]/10 shadow-xl",
    blueprint: "bg-[#0047ab] text-white border border-white/20 blueprint-grid-pattern shadow-lg",
    stationery: "bg-[#faf9f6] text-[#1a1a1a] shadow-2xl border-x border-t border-black/[0.03]",
  };

  const variantPaddings = {
    receipt: "p-6 sm:p-8",
    dossier: "p-6 sm:p-8",
    blueprint: "p-5 sm:p-10",
    stationery: "pl-12 pr-6 sm:pl-16 sm:pr-8",
  };

  return (
    <div
      className={cn(
        "relative font-mono text-sm selection:bg-black/10 transition-all duration-700 ease-in-out",
        variantStyles[variant],
        className
      )}
      style={{ clipPath: getClipPath() }}
    >
      {/* Texture layer */}
      <div
        className={cn(
          "absolute inset-0 paper-texture pointer-events-none opacity-[0.05]",
          variant === "stationery" && "opacity-[0.12] mix-blend-multiply",
          variant === "blueprint" && "opacity-0"
        )}
      />

      {/* Stationery specific detail: Subtle edge darkening to feel like thick paper */}
      {variant === "stationery" && (
        <div className="absolute inset-0 pointer-events-none border-b-2 border-black/[0.02]" />
      )}

      {/* Subtle edge highlight */}
      {variant === "receipt" && (
        <div
          className="absolute inset-0 pointer-events-none border-x border-t border-black/2"
          style={{ clipPath: ZIGZAG_POINTS }}
        />
      )}

      <div
        className={cn(
          "relative z-10 pt-12 pb-12 flex flex-col min-h-[70vh] lg:min-h-svh",
          variantPaddings[variant],
          variant === "stationery" && "font-sans"
        )}
      >
        {children}
      </div>
    </div>
  );
}
