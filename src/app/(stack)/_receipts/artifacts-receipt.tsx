import { ReceiptShell } from "@/components/receipt/receipt-shell";
import { Barcode } from "@/components/barcode";
import { ListItem } from "@/components/list-item";
import { YearGroups } from "@/components/year-groups";
import { Signature } from "@/components/signature";

const ARTIFACTS = [
  { title: 'Card Stack', kind: 'PROTO', href: '/artifacts/card-stack', year: 2026 },
  { title: 'Echelon', kind: 'GAME', href: '/artifacts/echelon', year: 2024 },
  { title: 'Strella', kind: 'TOOL', href: '/artifacts/strella', year: 2024 },
  { title: 'Game Dev Prototypes', kind: 'GAMES', href: '/artifacts/game-dev-prototypes', year: 2024 },
  { title: 'Delphi Falling Chips', kind: 'EXP', href: '/artifacts/delphi-falling-chips', year: 2024 },
  { title: 'Tldraw RTS', kind: 'GAME', href: '/artifacts/tldraw-rts', year: 2023 },
  { title: 'Portfolio v1', kind: 'SITE', href: '/artifacts/portfolio-v1', year: 2023 },
];

export function ArtifactsReceipt() {
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
    <ReceiptShell variant="blueprint" className="flex flex-col">
      <div className="flex flex-col mb-10 border-2 border-white/40 p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-white text-[#0047ab] px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase">
          SPEC_ARCHIVE
        </div>
        
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-mono font-black uppercase tracking-tighter leading-none text-white">
            SYSTEM_ARCHIVE
          </h1>
          <div className="flex justify-between items-end gap-4">
            <p className="text-[10px] leading-none opacity-60 font-mono font-bold uppercase text-white">
              REGISTRY_INDEX // ARTIFACTS
            </p>
            <span className="text-[8px] opacity-40 font-mono text-white">VOL. 2026.01</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/20 grid grid-cols-3 gap-5 text-[10px] font-mono text-white">
          <div className="flex flex-col gap-0.5">
            <span className="opacity-40 text-[8px] uppercase font-bold">DATE</span>
            <span className="font-bold">{today.toUpperCase()}</span>
          </div>
          <div className="flex flex-col gap-0.5 text-center">
            <span className="opacity-40 text-[8px] uppercase font-bold">LOG_TIME</span>
            <span className="font-bold">{time}</span>
          </div>
          <div className="flex flex-col gap-0.5 text-right">
            <span className="opacity-40 text-[8px] uppercase font-bold">STATUS</span>
            <span className="font-bold text-white uppercase">VERIFIED</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <section className="relative">
          <div className="flex items-center gap-5 mb-5">
            <div className="w-2.5 h-2.5 bg-white" aria-hidden="true" />
            <h2 className="uppercase font-black tracking-widest text-xs flex-1 border-b-2 border-white pb-1 text-white">
              EXPERIMENTAL_REGISTRY
            </h2>
          </div>

          <YearGroups items={ARTIFACTS} year={(artifact) => artifact.year}>
            {(artifact) => (
              <div key={artifact.title} className="border-b border-dotted border-white/25">
                <ListItem
                  href={artifact.href}
                  title={artifact.title}
                  date={artifact.kind}
                  className="-mx-2 px-2 py-2.5 hover:bg-white/10 transition-colors cursor-pointer text-white"
                  titleClassName="font-mono max-w-[32ch] text-balance"
                />
              </div>
            )}
          </YearGroups>
        </section>

        <div className="mt-auto pt-8 border-t-2 border-white/40 border-double flex flex-col items-center gap-6">
          <div className="grid grid-cols-2 w-full gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black uppercase tracking-widest opacity-40 text-white">AUTHORIZATION</span>
              <div className="h-10 border border-white/20 flex items-center justify-center italic text-xs opacity-90 font-serif text-white relative">
                <Signature className="w-40 h-auto absolute -rotate-1" />
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span className="text-[8px] font-black uppercase tracking-widest opacity-40 text-white">checksum</span>
              <div className="text-[10px] font-mono opacity-60 text-white">
                AF_77_BB_01
              </div>
              <Barcode className="opacity-60 invert h-5 mt-1" />
            </div>
          </div>
          
          <div className="text-[8px] opacity-20 text-center uppercase tracking-[1em] font-mono mt-4 text-white">
            *** NO_FURTHER_DATA ***
          </div>
        </div>
      </div>
    </ReceiptShell>
  );
}
