import { ReceiptShell } from "@/components/receipt/receipt-shell";
import { Barcode } from "@/components/barcode";
import { ListItem } from "@/components/list-item";

const ARTIFACTS = [
  {
    title: 'Card Stack',
    description: 'Shufflable receipt stack interaction (drag or click)',
    href: '/artifacts/card-stack',
    date: '2026',
  },
  {
    title: 'Card Stack (Click)',
    description: 'Click a card behind to bring it forward (3 cards)',
    href: '/artifacts/card-stack-click',
    date: '2026',
  },
  {
    title: 'Echelon',
    description: 'Asymmetric multiplayer stealth game prototype in Unreal Engine',
    href: '/artifacts/echelon',
    date: '2024',
  },
  {
    title: 'Strella',
    description: 'IDE designed for design engineers - Visual Development Environment',
    href: '/artifacts/strella',
    date: '2024',
  },
  {
    title: 'Tldraw RTS',
    description: 'Real-time strategy game prototype built with Tldraw SDK',
    href: '/artifacts/tldraw-rts',
    date: '2023',
  },
  {
    title: 'Game Dev Prototypes',
    description: 'Collection of game development experiments and prototypes',
    href: '/artifacts/game-dev-prototypes',
    date: '2023-2024',
  },
  {
    title: 'Delphi Falling Chips',
    description: 'Interactive visual experiment',
    href: '/artifacts/delphi-falling-chips',
    date: '2024',
  },
  {
    title: 'Portfolio v1',
    description: 'Previous portfolio iteration',
    href: '/artifacts/portfolio-v1',
    date: '2023',
  },
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
          <h1 className="text-3xl font-black uppercase tracking-tighter leading-none text-white">
            SYSTEM_ARCHIVE
          </h1>
          <div className="flex justify-between items-end">
            <p className="text-[10px] leading-none opacity-60 font-mono font-bold uppercase text-white">
              REGISTRY_INDEX // ARTIFACTS
            </p>
            <span className="text-[8px] opacity-40 font-mono text-white">VOL. 2026.01</span>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-white/20 grid grid-cols-3 gap-5 text-[10px] font-mono text-white">
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
          <div className="absolute -left-5 top-0 bottom-0 w-5 border-y border-r border-white/10 pointer-events-none sm:-left-10 sm:w-10" />
          
          <div className="flex items-center gap-5 mb-5">
            <div className="w-2.5 h-2.5 bg-white" />
            <h2 className="uppercase font-black tracking-widest text-xs flex-1 border-b-2 border-white pb-1 text-white">
              EXPERIMENTAL_REGISTRY
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-px bg-white/10 border border-white/10">
            {ARTIFACTS.map((artifact, i) => (
              <div 
                key={artifact.title} 
                className="bg-[#0047ab] p-5 hover:bg-white/5 transition-colors group relative border-b border-white/5 last:border-0"
              >
                <div className="absolute left-0 top-0 text-[8px] opacity-20 font-mono p-1 text-white">
                  [{String(i + 1).padStart(2, '0')}]
                </div>
                <ListItem
                  title={artifact.title}
                  description={artifact.description}
                  href={artifact.href}
                  date={artifact.date}
                  subtext={`artifacts/${artifact.href.split('/').pop()?.toLowerCase()}`}
                  className="text-white"
                />
              </div>
            ))}
          </div>
        </section>

        <div className="mt-auto pt-8 border-t-2 border-white/40 border-double flex flex-col items-center gap-6">
          <div className="grid grid-cols-2 w-full gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black uppercase tracking-widest opacity-40 text-white">AUTHORIZATION</span>
              <div className="h-10 border border-white/20 flex items-center justify-center italic text-xs opacity-60 font-serif text-white">
                BT Norris
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
