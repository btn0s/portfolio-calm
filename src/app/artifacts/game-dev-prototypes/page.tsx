import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Game Dev Prototypes',
  description: 'Collection of game development experiments and prototypes',
}

export default function GameDevPrototypesPage() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-6 tracking-tighter">
        Game Dev Prototypes
      </h1>

      <h1 className="font-semibold text-2xl mb-6 tracking-tighter">
        A collection of gameplay prototypes built in Unreal Engine Blueprints.
      </h1>

      <p className="mb-4 text-sm text-muted-foreground">
        Unreal Engine · Blueprints · Level Design · Animation
      </p>

      <div className="mb-8 flex flex-col gap-4 text-sm">
        <p>
          This is a collection of game design prototypes I build in Unreal
          Engine Blueprints. Each one combines concepts and ideas I&apos;ve
          explored over the years—level design, modeling, animation, and
          gameplay mechanics all mixed together.
        </p>

        <p>
          I usually start with a reference—a mechanic from a game I admire, or
          an idea I want to explore. Then I break it down into components and
          build each piece in isolation before wiring them together.
        </p>
      </div>
    </section>
  )
}
