import type { Metadata } from 'next'
import { baseUrl } from '@/app/sitemap'

export const metadata: Metadata = {
  title: 'Portfolio v1',
  description: 'Previous portfolio iteration showcasing an earlier approach to presenting work and projects',
  openGraph: {
    title: 'Portfolio v1',
    description: 'Previous portfolio iteration showcasing an earlier approach to presenting work and projects',
    url: `${baseUrl}/artifacts/portfolio-v1`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og?title=${encodeURIComponent('Portfolio v1')}`,
        width: 1200,
        height: 630,
        alt: 'Portfolio v1',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portfolio v1',
    description: 'Previous portfolio iteration',
  },
  alternates: {
    canonical: `${baseUrl}/artifacts/portfolio-v1`,
  },
}

export default function PortfolioV1Page() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-6 tracking-tighter">
        Portfolio v1
      </h1>

      <div className="mb-6 flex flex-col gap-4 text-sm">
        <p>
          The previous iteration of my portfolio, showcasing an earlier approach
          to presenting work and projects.
        </p>
      </div>

      <div className="mb-6">
        <video
          src="/assets/videos/portfolio.mp4"
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
