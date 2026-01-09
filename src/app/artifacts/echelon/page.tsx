import type { Metadata } from 'next'
import Image from 'next/image'
import { baseUrl } from '@/app/sitemap'

export const metadata: Metadata = {
  title: 'Echelon',
  description:
    'A multiplayer stealth game concept designed and prototyped in Unreal Engine Blueprints',
  openGraph: {
    title: 'Echelon — Asymmetric Multiplayer Stealth Game',
    description: 'A multiplayer stealth game concept designed and prototyped in Unreal Engine Blueprints',
    url: `${baseUrl}/artifacts/echelon`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og?title=${encodeURIComponent('Echelon')}`,
        width: 1200,
        height: 630,
        alt: 'Echelon game prototype',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Echelon — Asymmetric Multiplayer Stealth Game',
    description: 'A multiplayer stealth game concept designed and prototyped in Unreal Engine Blueprints',
  },
  alternates: {
    canonical: `${baseUrl}/artifacts/echelon`,
  },
}

export default function EchelonPage() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-6 tracking-tighter">
        Echelon: An asymmetric multiplayer stealth game inspired by Splinter
        Cell.
      </h1>

      <p className="mb-4 text-sm text-muted-foreground">
        Unreal Engine · Blueprints · Game Design · UX Design
      </p>

      <div className="mb-6 flex flex-col gap-4 text-sm">
        <p>
          Echelon is a game concept I designed and prototyped in Unreal Engine
          Blueprints. The game pits agile spies (third-person) against
          well-armed mercenaries (first-person) in an asymmetrical multiplayer
          stealth game. Spies get tactical awareness and stealth gadgets;
          mercenaries get superior firepower and detection tools.
        </p>

        <p>
          The prototype exists as a playable vertical slice with core movement,
          gadgets, and multiple objective modes—Extraction, Sabotage, and
          Assassination. Built entirely with Blueprints, it serves as both a
          design exercise and technical exploration of asymmetric multiplayer
          systems.
        </p>
      </div>

      <div className="mb-6">
        <Image
          src="/images/artifacts/echelon/cover.png"
          alt="Echelon game prototype"
          width={1200}
          height={675}
          className="w-full h-auto"
        />
      </div>

      <div className="mb-6">
        <Image
          src="/images/artifacts/echelon/main-menu-concept.png"
          alt="Echelon main menu concept"
          width={1200}
          height={675}
          className="w-full h-auto"
        />
      </div>

      <div className="mb-6">
        <Image
          src="/images/artifacts/echelon/match-start-spies.png"
          alt="Echelon match start - spies"
          width={1200}
          height={675}
          className="w-full h-auto"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Image
          src="/images/artifacts/echelon/damage-merc.png"
          alt="Damage indicator - mercenary"
          width={600}
          height={338}
          className="w-full h-auto"
        />
        <Image
          src="/images/artifacts/echelon/eliminated.png"
          alt="Eliminated screen"
          width={600}
          height={338}
          className="w-full h-auto"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Image
          src="/images/artifacts/echelon/menu-wireframes.png"
          alt="Menu wireframes"
          width={600}
          height={338}
          className="w-full h-auto"
        />
        <Image
          src="/images/artifacts/echelon/prematch-concept.png"
          alt="Prematch concept"
          width={600}
          height={338}
          className="w-full h-auto"
        />
      </div>
    </section>
  )
}
