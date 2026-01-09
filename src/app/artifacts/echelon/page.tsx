import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Echelon',
  description:
    'A multiplayer stealth game concept designed and prototyped in Unreal Engine Blueprints',
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

      <div className="mb-8 flex flex-col gap-4 text-sm">
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
    </section>
  )
}
