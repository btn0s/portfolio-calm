import Link from 'next/link'
import { BlogPosts } from '@/components/blog-posts'
import { ReceiptShell } from "@/components/receipt/receipt-shell";
import { Barcode } from "@/components/barcode";

export function ThoughtsReceipt() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const time = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <ReceiptShell className="flex flex-col">
      <div className="flex flex-col items-center text-center mb-8 gap-1">
        <h1 className="text-2xl font-bold uppercase tracking-[0.2em] mb-1">
          THOUGHTS
        </h1>
        <p className="text-[10px] leading-none opacity-60 font-mono">BLOG POSTS // 2026</p>

        <div className="mt-6 border-y border-(--paper-foreground) border-dashed py-2 w-full flex justify-between px-2 text-[10px] font-mono">
          <span>{today.toUpperCase()}</span>
          <span>{time}</span>
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="border-b border-(--paper-foreground) border-dashed pb-1 uppercase font-bold tracking-tighter text-xs flex-1">
              all_posts
            </h2>
          </div>
          <div className="receipt-thoughts space-y-2">
            <BlogPosts />
          </div>
        </section>

        <div className="border-t border-(--paper-foreground) border-dashed pt-12 flex flex-col items-center gap-6 mt-auto">
          <div className="relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] opacity-10 font-bold whitespace-nowrap tracking-[1.5em] pointer-events-none select-none italic text-center">
              PUBLIC RECORD
            </div>
            <Barcode className="opacity-40 mix-blend-multiply h-6" />
          </div>
          <div className="text-[10px] opacity-40 text-center uppercase tracking-widest font-mono">
            REF_THOUGHTS_001
          </div>
        </div>
      </div>
    </ReceiptShell>
  );
}
