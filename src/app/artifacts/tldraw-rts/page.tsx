import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tldraw RTS',
  description: 'A real-time strategy game prototype built with Tldraw SDK',
}

export default function TldrawRTSPage() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-6 tracking-tighter">
        Building a game with the Tldraw SDK
      </h1>

      <p className="mb-4 text-sm text-muted-foreground">
        React · TypeScript · Tldraw SDK · Game Design
      </p>

      <div className="mb-8 flex flex-col gap-4 text-sm">
        <p>
          I was building a canvas tool using the Tldraw SDK when I noticed they
          had a tick function. I decided to prototype a real-time strategy game
          using this tick function, and built out animations and an AI-driven
          RTS system prototype.
        </p>

        <p>
          Tldraw themselves responded and reposted my tweet, recognizing the
          creative use of their SDK for game development.
        </p>
      </div>
    </section>
  )
}
