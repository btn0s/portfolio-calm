import type { Metadata } from 'next'
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

      <div className="mb-8 flex flex-col gap-4 text-sm">
        <p>An interactive visual experiment exploring particle systems and physics.</p>
      </div>
    </section>
  )
}
