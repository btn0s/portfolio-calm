import { generatePageMetadata } from '@/lib/metadata'
import { Barcode } from '@/components/barcode'
import { PixelPattern } from '@/components/pixel-pattern'

export const metadata = generatePageMetadata({
  title: 'tldraw rts',
  description: 'A real-time strategy game prototype built with Tldraw SDK',
  path: '/artifacts/tldraw-rts',
  keywords: ['tldraw', 'game prototype', 'RTS', 'canvas', 'typescript'],
})

export default function TldrawRTSPage() {
  return (
    <section className="pb-32 max-w-3xl mx-auto">
      {/* Research Note Header */}
      <header className="pt-12 pb-16">
        <div className="flex flex-col gap-8">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-1 bg-foreground" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">RESEARCH_NOTE // ARCHIVE_05</span>
              </div>
              <h1 className="font-black text-5xl tracking-tighter uppercase leading-[0.9]">
                TLDRAW_RTS
              </h1>
            </div>
            <div className="w-12 h-12 border-2 border-foreground/10 flex items-center justify-center p-1">
              <div className="w-full h-full bg-foreground/5 flex items-center justify-center text-[10px] font-bold">R5</div>
            </div>
          </div>

          <div className="flex flex-col gap-2 p-6 border-l-4 border-foreground bg-foreground/5">
            <div className="grid grid-cols-2 gap-x-12 gap-y-4">
              <div className="flex justify-between border-b border-foreground/10 pb-1">
                <span className="text-[8px] font-black opacity-30 uppercase">Subject</span>
                <span className="text-[10px] font-bold">SDK_EXPLOITATION</span>
              </div>
              <div className="flex justify-between border-b border-foreground/10 pb-1">
                <span className="text-[8px] font-black opacity-30 uppercase">Status</span>
                <span className="text-[10px] font-bold text-blue-500/60 uppercase">VERIFIED_STABLE</span>
              </div>
              <div className="flex justify-between border-b border-foreground/10 pb-1">
                <span className="text-[8px] font-black opacity-30 uppercase">Target</span>
                <span className="text-[10px] font-bold uppercase">TLDRAW_SDK</span>
              </div>
              <div className="flex justify-between border-b border-foreground/10 pb-1">
                <span className="text-[8px] font-black opacity-30 uppercase">Log_Date</span>
                <span className="text-[10px] font-bold uppercase">AUG_2023</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-12 mb-20">
        <div className="relative border-2 border-foreground p-1">
          <video
            src="/assets/videos/rts01.mp4"
            controls
            autoPlay
            muted
            loop
            className="w-full h-auto"
            playsInline
          >
            Your browser does not support the video tag.
          </video>
          <div className="absolute top-2 left-2 bg-foreground text-background px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
            <div className="w-1 h-1 bg-red-500 animate-pulse rounded-full" />
            LIVE_FEED_01
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-foreground rotate-45" />
              <h2 className="text-xs font-black uppercase tracking-widest">OBSERVATION</h2>
            </div>
            <p className="text-sm leading-relaxed opacity-80 pl-4 border-l border-foreground/10">
              I was building a canvas tool using the Tldraw SDK when I noticed they
              had a tick function. I decided to prototype a real-time strategy game
              using this tick function.
            </p>
          </div>
          <div className="col-span-12 lg:col-span-7">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-foreground rotate-45" />
              <h2 className="text-xs font-black uppercase tracking-widest">FINDINGS</h2>
            </div>
            <p className="text-sm leading-relaxed opacity-80 pl-4 border-l border-foreground/10">
              Built out animations and an AI-driven RTS system prototype. 
              Tldraw themselves responded and reposted my tweet, recognizing the
              creative use of their SDK for game development.
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-32 pt-16 border-t-2 border-foreground border-dashed flex flex-col gap-12">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <PixelPattern size={16} className="w-6 h-6 opacity-30" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">TECHNICAL_CLEARANCE</span>
            </div>
            <div className="pl-8 text-[10px] font-mono opacity-50 uppercase tracking-widest">
              APPROVED_FOR_PUBLIC_ARCHIVE
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[8px] font-mono opacity-40">SYSTEM_ID: TL_RTS_99</span>
            <Barcode className="h-6 opacity-40 mix-blend-multiply" />
          </div>
        </div>
        <div className="flex justify-center">
          <span className="text-[8px] font-black opacity-20 uppercase tracking-[1.5em] pl-[1.5em]">
            END_OF_OBSERVATION
          </span>
        </div>
      </footer>
    </section>
  )
}
