import Image from 'next/image'
import { generatePageMetadata } from '@/lib/metadata'
import { Barcode } from '@/components/barcode'
import { PixelPattern } from '@/components/pixel-pattern'

export const metadata = generatePageMetadata({
  title: 'echelon',
  description: 'A multiplayer stealth game concept designed and prototyped in Unreal Engine Blueprints',
  path: '/artifacts/echelon',
  keywords: ['game development', 'unreal engine', 'blueprints', 'multiplayer', 'stealth game'],
})

export default function EchelonPage() {
  return (
    <section className="pb-32 max-w-5xl mx-auto">
      {/* Tactical Report Header */}
      <header className="pt-12 pb-16">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center border-b-8 border-foreground pb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">TACTICAL_REPORT // ARCHIVE_03</span>
              <h1 className="font-black text-6xl tracking-tighter uppercase leading-none">
                ECHELON
              </h1>
            </div>
            <div className="flex flex-col items-end">
              <span className="bg-foreground text-background px-2 py-0.5 text-[10px] font-black uppercase tracking-widest mb-2">
                TOP_SECRET
              </span>
              <div className="text-[10px] font-mono font-bold opacity-60 uppercase">OBJ_ID: E_2024_03</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-b border-foreground/10">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">OPERATION_TYPE</span>
              <span className="text-[10px] font-bold uppercase">STEALTH_ASYMMETRIC</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">ENGINE_CORE</span>
              <span className="text-[10px] font-bold uppercase">UNREAL_ENGINE_5</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">STATUS_CODE</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold uppercase">VERTICAL_SLICE</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-12 mb-20">
        <div className="col-span-12 lg:col-span-7">
          <div className="relative group">
            <Image
              src="/images/artifacts/echelon/cover.png"
              alt="Echelon game prototype"
              width={1200}
              height={675}
              className="w-full h-auto grayscale hover:grayscale-0 transition-all duration-700 border border-foreground/10"
            />
            <div className="absolute top-4 right-4 bg-foreground text-background px-2 py-0.5 text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              LIVE_RENDER
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5 flex flex-col justify-center gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-px bg-foreground" />
              <h2 className="text-xs font-black uppercase tracking-widest">MISSION_BRIEF</h2>
            </div>
            <div className="text-sm leading-relaxed space-y-4 opacity-80 italic pl-6 relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-foreground/5" />
              <p>
                Echelon is an asymmetric multiplayer stealth game inspired by the 
                tactical tension of early stealth classics. Spies vs Mercenaries. 
                Third-person agility vs first-person firepower.
              </p>
              <p>
                Built entirely with Blueprints in Unreal Engine 5, it serves as a 
                technical stress-test for complex gameplay systems and network 
                replicated player states.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-foreground/10 border border-foreground/10 mb-20">
        <div className="bg-background p-6 flex flex-col gap-4">
          <Image
            src="/images/artifacts/echelon/main-menu-concept.png"
            alt="Echelon main menu concept"
            width={1200}
            height={675}
            className="w-full h-auto border border-foreground/5"
          />
          <div className="flex justify-between items-center text-[8px] font-mono opacity-30 uppercase tracking-widest">
            <span>VISUAL_REF_01 // UI_ARCHITECTURE</span>
            <span>ID: E_UI_01</span>
          </div>
        </div>
        <div className="bg-background p-6 flex flex-col gap-4">
          <Image
            src="/images/artifacts/echelon/match-start-spies.png"
            alt="Echelon match start - spies"
            width={1200}
            height={675}
            className="w-full h-auto border border-foreground/5"
          />
          <div className="flex justify-between items-center text-[8px] font-mono opacity-30 uppercase tracking-widest">
            <span>VISUAL_REF_02 // DEPLOYMENT_VIEW</span>
            <span>ID: E_WP_01</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/images/artifacts/echelon/damage-merc.png"
              alt="Damage indicator - mercenary"
              width={600}
              height={338}
              className="w-full h-auto border border-foreground/10"
            />
            <Image
              src="/images/artifacts/echelon/eliminated.png"
              alt="Eliminated screen"
              width={600}
              height={338}
              className="w-full h-auto border border-foreground/10"
            />
          </div>
          <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest text-center">
            DIAGNOSTICS // COMBAT_FEEDBACK_SYSTEMS
          </p>
        </div>
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/images/artifacts/echelon/menu-wireframes.png"
              alt="Menu wireframes"
              width={600}
              height={338}
              className="w-full h-auto border border-foreground/10"
            />
            <Image
              src="/images/artifacts/echelon/prematch-concept.png"
              alt="Prematch concept"
              width={600}
              height={338}
              className="w-full h-auto border border-foreground/10"
            />
          </div>
          <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest text-center">
            PLANNING // WIREFRAMES_TO_CONCEPT
          </p>
        </div>
      </div>

      <footer className="mt-32 pt-16 border-t border-foreground/20 flex flex-col gap-12">
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <PixelPattern size={16} className="w-8 h-8 opacity-20" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">SYSTEM_VALIDATION</span>
            </div>
            <div className="text-[10px] font-mono opacity-40 uppercase tracking-widest">
              PROTO_E_2024 // VERIFIED_STABLE
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Barcode className="h-8 opacity-60 mix-blend-multiply" />
            <span className="text-[8px] font-mono opacity-30">REF_7734_ECH_03</span>
          </div>
        </div>
        <div className="h-px w-full bg-foreground/10 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4">
            <span className="text-[8px] font-black opacity-20 uppercase tracking-[1.5em] pl-[1.5em]">
              MISSION_COMPLETE
            </span>
          </div>
        </div>
      </footer>
    </section>
  )
}
