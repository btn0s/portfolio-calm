import type { Metadata } from 'next'
import { baseUrl } from '@/app/sitemap'

export const metadata: Metadata = {
  title: 'Tldraw RTS',
  description: 'A real-time strategy game prototype built with Tldraw SDK',
  openGraph: {
    title: 'Tldraw RTS — Game Prototype',
    description: 'A real-time strategy game prototype built with Tldraw SDK',
    url: `${baseUrl}/artifacts/tldraw-rts`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og?title=${encodeURIComponent('Tldraw RTS')}`,
        width: 1200,
        height: 630,
        alt: 'Tldraw RTS game prototype',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tldraw RTS — Game Prototype',
    description: 'A real-time strategy game prototype built with Tldraw SDK',
  },
  alternates: {
    canonical: `${baseUrl}/artifacts/tldraw-rts`,
  },
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

      <div className="mb-6 flex flex-col gap-4 text-sm">
        <p>
          I was building a canvas tool using the Tldraw SDK when I noticed they
          had a tick function. I decided to prototype a real-time strategy game
          using this tick function, and built out animations and an AI-driven
          RTS system prototype.
        </p>
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
