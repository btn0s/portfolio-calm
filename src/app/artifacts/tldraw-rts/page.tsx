import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'tldraw rts',
  description: 'A real-time strategy game prototype built with Tldraw SDK',
  path: '/artifacts/tldraw-rts',
  keywords: ['tldraw', 'game prototype', 'RTS', 'canvas', 'typescript'],
})

export default function TldrawRTSPage() {
  return (
    <section>
      <div className="pt-8 pb-6">
        <h1 className="font-semibold text-2xl mb-6 tracking-tighter">
          Building a game with the Tldraw SDK
        </h1>

        <p className="mb-4 text-sm text-muted-foreground">
          React · TypeScript · Tldraw SDK · Game Design
        </p>

        <div className="flex flex-col gap-4 text-sm">
          <p>
            I was building a canvas tool using the Tldraw SDK when I noticed they
            had a tick function. I decided to prototype a real-time strategy game
            using this tick function, and built out animations and an AI-driven
            RTS system prototype.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <video
          src="/assets/videos/rts01.mp4"
          controls
          className="w-full h-auto"
          playsInline
        >
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="mb-6 flex flex-col gap-4 text-sm">
        <p>
          Tldraw themselves responded and reposted my tweet, recognizing the
          creative use of their SDK for game development.
        </p>
      </div>
    </section>
  )
}
