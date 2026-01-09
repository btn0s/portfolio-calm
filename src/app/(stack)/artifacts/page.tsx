import type { Metadata } from 'next'
import { baseUrl } from '@/app/sitemap'

export const metadata: Metadata = {
  title: 'Artifacts',
  description: 'Experiments, prototypes, and explorations in game development, tooling, and visual design',
  openGraph: {
    title: 'Artifacts — Experiments & Prototypes',
    description: 'Experiments, prototypes, and explorations in game development, tooling, and visual design',
    url: `${baseUrl}/artifacts`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og?title=${encodeURIComponent('Artifacts')}`,
        width: 1200,
        height: 630,
        alt: 'Artifacts portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Artifacts — Experiments & Prototypes',
    description: 'Experiments, prototypes, and explorations in game development, tooling, and visual design',
  },
  alternates: {
    canonical: `${baseUrl}/artifacts`,
  },
}

export default function Page() {
  return null;
}
