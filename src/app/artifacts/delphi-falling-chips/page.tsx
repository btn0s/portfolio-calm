import type { Metadata } from 'next'
import { ArrowUpRight } from 'lucide-react'
import { baseUrl } from '@/app/sitemap'

export const metadata: Metadata = {
  title: 'Delphi Falling Chips',
  description: 'Interactive visual experiment exploring particle systems and physics',
  openGraph: {
    title: 'Delphi Falling Chips — Visual Experiment',
    description: 'Interactive visual experiment exploring particle systems and physics',
    url: `${baseUrl}/artifacts/delphi-falling-chips`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og?title=${encodeURIComponent('Delphi Falling Chips')}`,
        width: 1200,
        height: 630,
        alt: 'Delphi Falling Chips visual experiment',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Delphi Falling Chips — Visual Experiment',
    description: 'Interactive visual experiment exploring particle systems and physics',
  },
  alternates: {
    canonical: `${baseUrl}/artifacts/delphi-falling-chips`,
  },
}

export default function DelphiFallingChipsPage() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-6 tracking-tighter">
        Delphi Falling Chips
      </h1>

      <p className="mb-4 text-sm text-muted-foreground">
        React · Framer Motion · Animation
      </p>

      <div className="mb-6 flex flex-col gap-4 text-sm">
        <p>
          I was going through the Delphi onboarding and loved the chip falling
          animation, so I decided to try and rebuild it!
        </p>
        <a
          href="https://delphi-chips-falling.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 w-fit"
        >
          View live <ArrowUpRight className="size-3" />
        </a>
      </div>

      <div className="mb-6">
        <video
          src="/assets/videos/delphi-falling-chips.mp4"
          controls
          className="w-full h-auto"
          playsInline
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </section>
  )
}
