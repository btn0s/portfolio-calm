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
    <ReceiptShell className="flex flex-col">
      <div className="flex flex-col mb-10 border-2 border-(--paper-foreground) p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-(--paper-foreground) text-(--paper) px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase">
          UNCLASSIFIED
        </div>
        
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">
            SYSTEM_ARCHIVE
          </h1>
          <div className="flex justify-between items-end">
            <p className="text-[10px] leading-none opacity-60 font-mono font-bold uppercase">
              REGISTRY_INDEX // ARTIFACTS
            </p>
            <span className="text-[8px] opacity-40 font-mono">VOL. 2026.01</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-(--paper-foreground)/20 grid grid-cols-3 gap-4 text-[10px] font-mono">
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
            <span className="font-bold text-green-600/60 uppercase">VERIFIED</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <section className="relative">
          <div className="absolute -left-6 top-0 bottom-0 w-4 border-y border-r border-(--paper-foreground)/10 pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 bg-(--paper-foreground)" />
            <h2 className="uppercase font-black tracking-widest text-xs flex-1 border-b-2 border-(--paper-foreground) pb-1">
              EXPERIMENTAL_REGISTRY
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-px bg-(--paper-foreground)/10 border border-(--paper-foreground)/10">
            {ARTIFACTS.map((artifact, i) => (
              <div 
                key={artifact.title} 
                className="bg-(--paper) p-4 hover:bg-(--paper-foreground)/5 transition-colors group relative"
              >
                <div className="absolute left-0 top-0 text-[8px] opacity-20 font-mono p-1">
                  [{String(i + 1).padStart(2, '0')}]
                </div>
                <ListItem
                  title={artifact.title}
                  description={artifact.description}
                  href={artifact.href}
                  date={artifact.date}
                  subtext={`artifacts/${artifact.href.split('/').pop()?.toLowerCase()}`}
                />
              </div>
            ))}
          </div>
        </section>

        <div className="mt-auto pt-8 border-t-2 border-(--paper-foreground) border-double flex flex-col items-center gap-6">
          <div className="grid grid-cols-2 w-full gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black uppercase tracking-widest opacity-40">AUTHORIZATION</span>
              <div className="h-10 border border-(--paper-foreground)/20 flex items-center justify-center italic text-xs opacity-30 font-serif">
                BT Norris
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span className="text-[8px] font-black uppercase tracking-widest opacity-40">checksum</span>
              <div className="text-[10px] font-mono opacity-60">
                AF_77_BB_01
              </div>
              <Barcode className="opacity-40 mix-blend-multiply h-5 mt-1" />
            </div>
          </div>
          
          <div className="text-[8px] opacity-20 text-center uppercase tracking-[1em] font-mono mt-4">
            *** NO_FURTHER_DATA ***
          </div>
        </div>
      </div>
    </ReceiptShell>
  );
}
