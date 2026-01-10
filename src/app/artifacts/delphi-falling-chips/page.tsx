import { ArrowUpRight } from 'lucide-react'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'delphi falling chips',
  description: 'Interactive visual experiment exploring particle systems and physics',
  path: '/artifacts/delphi-falling-chips',
  keywords: ['animation', 'framer motion', 'react', 'visual experiment'],
})

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
