import Image from 'next/image'
import { generatePageMetadata } from '@/lib/metadata'
import { Barcode } from '@/components/barcode'
import { PixelPattern } from '@/components/pixel-pattern'

export const metadata = generatePageMetadata({
  title: 'strella',
  description: 'The first IDE for design engineers - a Visual Development Environment where layout, logic, and state come together',
  path: '/artifacts/strella',
  keywords: ['IDE', 'design engineering', 'visual development', 'node graph', 'tooling'],
})

export default function StrellaPage() {
  return (
    <section className="pb-32 max-w-4xl mx-auto">
      {/* Technical Data Header */}
      <header className="pt-12 pb-16">
        <div className="flex justify-between items-start mb-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-foreground text-background px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">
                DATA_SHEET // ARTIFACT_04
              </span>
              <div className="h-0.5 w-12 bg-foreground" />
            </div>
            <h1 className="font-black text-5xl tracking-tighter uppercase leading-[0.8] mt-2">
              STRELLA
            </h1>
            <p className="text-sm font-bold opacity-60 tracking-tight max-w-[40ch] mt-2 italic">
              "The first IDE for design engineers - a Visual Development Environment where layout, logic, and state come together"
            </p>
          </div>
          <div className="hidden sm:block">
            <PixelPattern size={48} className="w-24 h-24 opacity-20" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 border-2 border-foreground p-px bg-foreground/10 mb-8">
          <div className="bg-background p-4 flex flex-col gap-1 border-r border-foreground/10">
            <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">ASSET_CLASS</span>
            <span className="text-[10px] font-bold uppercase">PROTOTYPE_01</span>
          </div>
          <div className="bg-background p-4 flex flex-col gap-1 border-r sm:border-r border-foreground/10">
            <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">STABILITY</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span className="text-[10px] font-bold uppercase">EXPERIMENTAL</span>
            </div>
          </div>
          <div className="bg-background p-4 flex flex-col gap-1 border-r border-foreground/10">
            <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">TECH_STACK</span>
            <span className="text-[10px] font-bold uppercase">REACT / TS</span>
          </div>
          <div className="bg-background p-4 flex flex-col gap-1">
            <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">LAST_LOG</span>
            <span className="text-[10px] font-bold uppercase">JAN_2026</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-12 mb-24">
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-foreground" />
              <h2 className="text-xs font-black uppercase tracking-widest">SPECIFICATION</h2>
            </div>
            <div className="text-sm leading-relaxed space-y-4 opacity-80 pl-4 border-l border-foreground/10">
              <p>
                Strella is a Visual Development Environment where layout, logic, and
                state come together in a single canvas. Inspired by Unreal
                Engine&apos;s Blueprints, it&apos;s built for design engineers—people
                who think visually but build interactively.
              </p>
              <p>
                A node-based graph editor for building product logic, a visual editor
                for component structure, and a runtime that stays in sync. It replaces the
                Figma-to-code pipeline with a unified authoring system.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-foreground" />
              <h2 className="text-xs font-black uppercase tracking-widest">RESOURCES</h2>
            </div>
            <div className="pl-4">
              <a
                href="https://strella.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border-2 border-foreground px-4 py-2 text-[10px] font-black uppercase hover:bg-foreground hover:text-background transition-all"
              >
                <span>DEPLOY_SITE_ALPHA</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="relative group">
            <div className="absolute -inset-2 border border-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <Image
              src="/images/artifacts/strella/cover.png"
              alt="Strella IDE"
              width={1200}
              height={675}
              className="w-full h-auto border border-foreground/10"
            />
            <div className="mt-2 flex justify-between items-center text-[8px] font-mono opacity-30 uppercase tracking-widest">
              <span>FIG_01 // MAIN_INTERFACE</span>
              <span>REF_S_001</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-24">
        <div className="flex flex-col gap-3">
          <Image
            src="/images/artifacts/strella/page-view-graph-w-preview.png"
            alt="Strella graph view with live preview"
            width={1200}
            height={675}
            className="w-full h-auto border border-foreground/10"
          />
          <div className="flex justify-between items-center text-[8px] font-mono opacity-30 uppercase tracking-widest">
            <span>FIG_02 // LOGIC_GRAPH_PREVIEW</span>
            <span>REF_S_002</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Image
            src="/images/artifacts/strella/page-view-graph.png"
            alt="Strella graph view"
            width={1200}
            height={675}
            className="w-full h-auto border border-foreground/10"
          />
          <div className="flex justify-between items-center text-[8px] font-mono opacity-30 uppercase tracking-widest">
            <span>FIG_03 // NODE_TOPOLOGY</span>
            <span>REF_S_003</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Image
            src="/images/artifacts/strella/page-view-design.png"
            alt="Strella design view"
            width={1200}
            height={675}
            className="w-full h-auto border border-foreground/10"
          />
          <div className="flex justify-between items-center text-[8px] font-mono opacity-30 uppercase tracking-widest">
            <span>FIG_04 // CANVAS_EDITOR</span>
            <span>REF_S_004</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Image
            src="/images/artifacts/strella/project-view-design.png"
            alt="Strella project view"
            width={1200}
            height={675}
            className="w-full h-auto border border-foreground/10"
          />
          <div className="flex justify-between items-center text-[8px] font-mono opacity-30 uppercase tracking-widest">
            <span>FIG_05 // PROJECT_STRUCTURE</span>
            <span>REF_S_005</span>
          </div>
        </div>
      </div>

      <footer className="mt-32 pt-16 border-t-4 border-foreground flex flex-col gap-12">
        <div className="flex flex-col sm:flex-row justify-between gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">TECHNICAL_NOTES</span>
            <p className="text-[10px] max-w-[40ch] leading-relaxed opacity-60 font-mono italic">
              Artifact represents a deep vertical exploration of Visual Development Environment (VDE) mechanics. 
              Built to stress-test the limits of real-time state synchronization between graph and canvas.
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">OBJECT_IDENTIFIER</span>
            <div className="flex flex-col sm:items-end font-mono">
              <span className="text-xs font-bold opacity-80">STRELLA_REV_2026_01</span>
              <Barcode className="h-6 mt-1 opacity-40 mix-blend-multiply" />
            </div>
          </div>
        </div>
        <div className="flex justify-center border-t border-foreground/10 pt-8">
          <span className="text-[8px] font-black opacity-20 uppercase tracking-[2em] pl-[2em]">
            END_OF_DATASHEET
          </span>
        </div>
      </footer>
    </section>
  )
}
