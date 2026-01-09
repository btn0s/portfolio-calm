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
        <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">
          THOUGHTS
        </h1>
        <p className="text-xs leading-none opacity-70">BLOG POSTS // 2026</p>
        <div className="mt-4 border-y border-(--paper-foreground) border-dashed py-2 w-full flex justify-between px-2 text-xs">
          <span>{today.toUpperCase()}</span>
          <span>{time}</span>
        </div>
      </div>

      <div className="space-y-8 flex-1">
        <section>
          <h2 className="border-b border-(--paper-foreground) border-dashed pb-1 mb-4 uppercase font-bold tracking-tighter text-sm">
            all_posts
          </h2>
          <div className="receipt-thoughts space-y-2">
            <BlogPosts />
          </div>
        </section>

        <div className="border-t border-(--paper-foreground) border-dashed pt-8 flex flex-col items-center gap-4 mt-auto">
          <Barcode className="opacity-80 mix-blend-multiply" />
          <div className="text-[10px] opacity-40 text-center uppercase tracking-widest">
            REF_THOUGHTS_001
          </div>
        </div>
      </div>
    </ReceiptShell>
  );
}
