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
    <ReceiptShell variant="stationery" className="flex flex-col relative">
      {/* Decorative red margin line for stationery feel */}
      <div className="absolute left-10 top-0 bottom-0 w-px bg-red-500/10 z-0 pointer-events-none sm:left-14" />
      
      <div className="flex flex-col mb-12 gap-8 relative z-10">
        <div className="flex justify-between items-end border-b border-black/10 pb-6">
          <div className="flex flex-col">
            <h1 className="text-4xl font-serif italic tracking-tight leading-none text-[#1a1a1a]">
              Field Log
            </h1>
            <p className="text-[10px] mt-2 font-medium opacity-40 font-mono uppercase tracking-[0.3em]">
              Issue 01 // 2026
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-bold text-[#1a1a1a]/60 font-mono tracking-tighter">
              {today.toUpperCase()}
            </span>
            <span className="text-[8px] opacity-30 font-mono uppercase tracking-widest">Available now</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 font-serif text-sm text-[#1a1a1a]/70 leading-relaxed max-w-md italic">
          Observations on the intersection of design engineering, 
          human-computer interaction, and the building of tools.
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="uppercase font-bold tracking-[0.2em] text-[10px] text-[#1a1a1a]/40">
              Selected Entries
            </h2>
            <div className="h-px bg-black/5 flex-1" />
          </div>
          <div className="receipt-thoughts space-y-8">
            <BlogPosts />
          </div>
        </section>

        <div className="mt-auto pt-20 flex flex-col items-center gap-8">
          <div className="flex items-center gap-6 w-full opacity-20">
            <div className="h-px bg-black flex-1" />
            <div className="text-[10px] font-serif italic">Fin.</div>
            <div className="h-px bg-black flex-1" />
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <div className="text-[9px] opacity-40 font-mono tracking-[0.5em] uppercase">
              BT Norris // 2026
            </div>
            <Barcode className="opacity-20 h-6" />
          </div>
        </div>
      </div>
    </ReceiptShell>
  );
}
