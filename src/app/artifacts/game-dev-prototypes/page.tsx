import Image from 'next/image'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'game dev prototypes',
  description: 'Collection of game development experiments and prototypes built in Unreal Engine Blueprints',
  path: '/artifacts/game-dev-prototypes',
  keywords: ['game development', 'unreal engine', 'blueprints', 'prototypes', 'experiments'],
})

export default function GameDevPrototypesPage() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-6 tracking-tighter">
        A collection of gameplay prototypes built in Unreal Engine Blueprints.
      </h1>

      <p className="mb-4 text-sm text-muted-foreground">
        Unreal Engine · Blueprints · Level Design · Animation
      </p>

      <div className="mb-6 flex flex-col gap-4 text-sm">
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

      <div className="mb-6">
        <Image
          src="/images/artifacts/game-dev-prototypes/cover.png"
          alt="Game development prototypes"
          width={1200}
          height={675}
          className="w-full h-auto"
        />
      </div>
    </section>
  )
}
