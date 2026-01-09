import Link from 'next/link'
import { ReceiptShell } from "@/components/receipt/receipt-shell";
import { Barcode } from "@/components/barcode";

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
      <div className="flex flex-col items-center text-center mb-8 gap-1">
        <h1 className="text-2xl font-bold uppercase tracking-[0.2em] mb-1">
          ARTIFACTS
        </h1>
        <p className="text-[10px] leading-none opacity-60 font-mono">EXPERIMENTS // 2026</p>
        
        <div className="w-full flex justify-center my-6">
          <div className="text-[9px] opacity-40 font-mono border-y border-black/5 py-1 px-4">
            MANIFEST: PROTOTYPES // LEVEL: 04
          </div>
        </div>

        <div className="mt-2 border-y border-(--paper-foreground) border-dashed py-2 w-full flex justify-between px-2 text-[10px] font-mono">
          <span>{today.toUpperCase()}</span>
          <span>{time}</span>
        </div>
      </div>

      <div className="space-y-8 flex-1">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="border-b border-(--paper-foreground) border-dashed pb-1 uppercase font-bold tracking-tighter text-xs flex-1">
              collection
            </h2>
          </div>
          <div className="space-y-4">
            {ARTIFACTS.map((artifact) => (
              <Link
                key={artifact.title}
                href={artifact.href}
                className="group block border-l-2 border-transparent hover:border-black/5 hover:pl-2 transition-all"
              >
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold uppercase text-xs underline decoration-dotted underline-offset-2 group-hover:decoration-solid">
                    {artifact.title}
                  </h3>
                  {artifact.date && (
                    <span className="text-[9px] opacity-40 font-mono italic">
                      {artifact.date}
                    </span>
                  )}
                </div>
                <p className="text-[10px] leading-tight opacity-70 mb-1">
                  {artifact.description}
                </p>
                <span className="text-[9px] opacity-30 block truncate font-mono">
                  artifacts/{artifact.href.split('/').pop()?.toLowerCase()}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="border-t border-(--paper-foreground) border-dashed pt-12 flex flex-col items-center gap-6 mt-auto">
          <div className="relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] opacity-10 font-bold whitespace-nowrap tracking-[1.5em] pointer-events-none select-none italic text-center">
              ORIGINAL ASSETS
            </div>
            <Barcode className="opacity-40 mix-blend-multiply h-6" />
          </div>
          <div className="text-[10px] opacity-40 text-center uppercase tracking-widest font-mono">
            REF_ARTIFACTS_001
          </div>
        </div>
      </div>
    </ReceiptShell>
  );
}
