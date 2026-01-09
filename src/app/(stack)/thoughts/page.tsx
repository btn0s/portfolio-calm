import type { Metadata } from 'next'
import { baseUrl } from '@/app/sitemap'

export const metadata: Metadata = {
  title: 'Thoughts',
  description: 'Thoughts on design, engineering, game development, and building products',
  openGraph: {
    title: 'Thoughts — bt norris',
    description: 'Thoughts on design, engineering, game development, and building products',
    url: `${baseUrl}/thoughts`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og?title=${encodeURIComponent('Thoughts')}`,
        width: 1200,
        height: 630,
        alt: 'Thoughts blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Thoughts — bt norris',
    description: 'Thoughts on design, engineering, game development, and building products',
  },
  alternates: {
    canonical: `${baseUrl}/thoughts`,
  },
}

export default function Page() {
  return null;
}
