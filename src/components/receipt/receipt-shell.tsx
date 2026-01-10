import { cn } from "@/lib/utils";

interface ReceiptShellProps {
  children: React.ReactNode;
  className?: string;
}

const RIP_HEIGHT = 8;

// Generate the clip-path polygon (straight top, ripped bottom)
const generateClipPath = () => {
  const points: string[] = [];

  // Top edge (straight)
  points.push('0% 0%', '100% 0%');

  // Right edge down
  points.push(`100% calc(100% - ${RIP_HEIGHT}px)`);

  // Bottom edge (right to left): zigzag between 100%-RIP_HEIGHT and 100%
  for (let i = 50; i >= 0; i--) {
    const x = i * 2;
    const y = i % 2 === 0 ? `calc(100% - ${RIP_HEIGHT}px)` : '100%';
    points.push(`${x}% ${y}`);
  }

  // Left edge up (close path)
  points.push('0% 0%');

  return `polygon(${points.join(', ')})`;
};

// SVG border for bottom ripped edge
function RippedEdgeBorder() {
  const generateBottomPath = () => {
    const points: string[] = [];
    for (let i = 0; i <= 50; i++) {
      const x = i * 2;
      const y = i % 2 === 0 ? 0 : RIP_HEIGHT;
      points.push(`${x}%,${y}`);
    }
    return `M${points.join(' L')}`;
  };

  return (
    <>
      {/* Straight borders for top, left, right */}
      <div className="absolute inset-0 border border-black/5 border-b-0 pointer-events-none z-20" />
      {/* Ripped border for bottom */}
      <svg
        className="absolute bottom-0 left-0 w-full pointer-events-none z-20"
        style={{ height: RIP_HEIGHT }}
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d={generateBottomPath()}
          stroke="rgba(0,0,0,0.05)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </>
  );
}

export function ReceiptShell({ children, className }: ReceiptShellProps) {
  return (
    <div
      className={cn(
        "bg-(--paper) text-(--paper-foreground) p-6 sm:p-8 pt-12 pb-12 relative font-mono text-sm",
        className
      )}
      style={{ clipPath: generateClipPath() }}
    >
      <RippedEdgeBorder />
      <div className="absolute inset-0 paper-texture" />
      <div className="relative z-10 flex flex-col min-h-[100svh]">{children}</div>
    </div>
  );
}
