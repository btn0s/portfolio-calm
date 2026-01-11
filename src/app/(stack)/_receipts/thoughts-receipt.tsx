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
      <div className="flex flex-col mb-10 gap-6">
        <div className="flex justify-between items-center border-b-4 border-(--paper-foreground) pb-4">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black uppercase tracking-widest leading-none">
              FIELD_LOG
            </h1>
            <p className="text-[10px] mt-1 font-bold opacity-60 font-mono uppercase tracking-[0.2em]">
              COMM_CHANNEL: THOUGHTS
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-0.5">
              <div className="w-1 h-3 bg-(--paper-foreground)" />
              <div className="w-1 h-3 bg-(--paper-foreground)" />
              <div className="w-1 h-3 bg-(--paper-foreground)" />
              <div className="w-1 h-3 bg-(--paper-foreground)/20" />
            </div>
            <span className="text-[8px] font-bold opacity-40">SIGNAL: STABLE</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 font-mono text-[10px] bg-(--paper-foreground)/5 p-3 border-l-4 border-(--paper-foreground)">
          <div className="flex justify-between">
            <span className="opacity-40 uppercase">Origin</span>
            <span className="font-bold">2026_BT_NORRIS</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-40 uppercase">Timestamp</span>
            <span className="font-bold">{today.toUpperCase()} // {time}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-40 uppercase">Encoding</span>
            <span className="font-bold">UTF-8 // MDX</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <section>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="uppercase font-black tracking-tighter text-sm flex-1">
              LOG_ENTRIES
            </h2>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-(--paper-foreground)/10" />)}
            </div>
          </div>
          <div className="receipt-thoughts pl-2 space-y-4">
            <BlogPosts />
          </div>
        </section>

        <div className="mt-auto pt-16 flex flex-col items-center gap-6">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-(--paper-foreground)/10" />
            </div>
            <div className="relative flex justify-center text-[8px] uppercase font-bold text-(--paper-foreground)/40 bg-(--paper) px-4 tracking-[0.5em]">
              END_OF_TRANSMISSION
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <Barcode className="opacity-60 mix-blend-multiply h-8" />
            <div className="text-[10px] opacity-40 font-mono tracking-widest">
              TH_LOG_01001
            </div>
          </div>
        </div>
      </div>
    </ReceiptShell>
  );
}
