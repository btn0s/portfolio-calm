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
        <h1 className="text-2xl font-bold uppercase tracking-widest mb-2">
          ARTIFACTS
        </h1>
        <p className="text-[10px] leading-none opacity-70">EXPERIMENTS // 2026</p>
        <div className="mt-4 border-y border-(--paper-foreground) border-dashed py-2 w-full flex justify-between px-2 text-[10px]">
          <span>{today.toUpperCase()}</span>
          <span>{time}</span>
        </div>
      </div>

      <div className="space-y-8 flex-1">
        <section>
          <h2 className="border-b border-(--paper-foreground) border-dashed pb-1 mb-4 uppercase font-bold tracking-tighter">
            collection
          </h2>
          <div className="space-y-4">
            {ARTIFACTS.map((artifact) => (
              <Link
                key={artifact.title}
                href={artifact.href}
                className="group block"
              >
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold uppercase text-xs underline decoration-dotted underline-offset-2 group-hover:decoration-solid">
                    {artifact.title}
                  </h3>
                  {artifact.date && (
                    <span className="text-[9px] opacity-50 font-mono">
                      {artifact.date}
                    </span>
                  )}
                </div>
                <p className="text-[10px] leading-tight opacity-70 mb-1">
                  {artifact.description}
                </p>
                <span className="text-[9px] opacity-50 block truncate">
                  {artifact.href.replace(/^\//, '')}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="border-t border-(--paper-foreground) border-dashed pt-8 flex flex-col items-center gap-4 mt-auto">
          <Barcode className="opacity-80 mix-blend-multiply" />
          <div className="text-[8px] opacity-40 text-center uppercase tracking-widest">
            REF_ARTIFACTS_001
          </div>
        </div>
      </div>
    </ReceiptShell>
  );
}
