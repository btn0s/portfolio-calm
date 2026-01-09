import type { Metadata } from 'next'
import { baseUrl } from '@/app/sitemap'

export const metadata: Metadata = {
  title: 'Strella',
  description:
    'The first IDE for design engineers - a Visual Development Environment where layout, logic, and state come together',
  openGraph: {
    title: 'Strella — IDE for Design Engineers',
    description: 'The first IDE for design engineers - a Visual Development Environment where layout, logic, and state come together',
    url: `${baseUrl}/artifacts/strella`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og?title=${encodeURIComponent('Strella')}`,
        width: 1200,
        height: 630,
        alt: 'Strella IDE',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Strella — IDE for Design Engineers',
    description: 'The first IDE for design engineers - a Visual Development Environment',
  },
  alternates: {
    canonical: `${baseUrl}/artifacts/strella`,
  },
}

export default function StrellaPage() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-6 tracking-tighter">
        Strella: The first IDE designed for design engineers.
      </h1>

      <p className="mb-4 text-sm text-muted-foreground">
        React · TypeScript · Node Graph · Visual Scripting
      </p>

      <div className="mb-8 flex flex-col gap-4 text-sm">
        <p>
          Strella is a Visual Development Environment where layout, logic, and
          state come together in a single canvas. Inspired by Unreal
          Engine&apos;s Blueprints, it&apos;s built for design engineers—people
          who think visually but build interactively. It replaces the
          Figma-to-code pipeline with a unified authoring system.
        </p>

        <p>
          A node-based graph editor for building product logic, a visual editor
          for component structure, and a runtime that stays in sync. Strella
          currently exists in wireframes and technical documentation—the most
          ambitious thing I&apos;ve ever built, a bet on better tools that
          close the gap between design and implementation.
        </p>

        <a
          href="https://strella.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View site →
        </a>
      </div>
    </section>
  )
}
