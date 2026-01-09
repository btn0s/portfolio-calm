import { cn } from "@/lib/utils";

interface ReceiptShellProps {
  children: React.ReactNode;
  className?: string;
}

export function ReceiptShell({ children, className }: ReceiptShellProps) {
  return (
    <div
      className={cn(
        "bg-(--paper) text-(--paper-foreground) p-6 sm:p-8 pt-12 pb-12 receipt-edge-top receipt-edge-bottom relative font-mono text-sm border border-black/5",
        className
      )}
    >
      <div className="absolute inset-0 paper-texture" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
