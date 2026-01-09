import Link from 'next/link'
import { ProjectCard } from '@/components/project-card'
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

const ARTIFACTS = [
  {
    title: 'Echelon',
    description: 'Asymmetric multiplayer stealth game prototype in Unreal Engine',
    href: '/artifacts/echelon',
    date: '2024',
    thumbnail: '/images/artifacts/echelon/cover.png',
  },
  {
    title: 'Strella',
    description: 'IDE designed for design engineers - Visual Development Environment',
    href: '/artifacts/strella',
    date: '2024',
    thumbnail: '/images/artifacts/strella/cover.png',
  },
  {
    title: 'Tldraw RTS',
    description: 'Real-time strategy game prototype built with Tldraw SDK',
    href: '/artifacts/tldraw-rts',
    date: '2023',
  },
  {
    title: 'Game Dev Prototypes',
    description: 'Collection of game development experiments and prototypes',
    href: '/artifacts/game-dev-prototypes',
    date: '2023-2024',
    thumbnail: '/images/artifacts/game-dev-prototypes/cover.png',
  },
  {
    title: 'Delphi Falling Chips',
    description: 'Interactive visual experiment',
    href: '/artifacts/delphi-falling-chips',
    date: '2024',
  },
  {
    title: 'Portfolio v1',
    description: 'Previous portfolio iteration',
    href: '/artifacts/portfolio-v1',
    date: '2023',
  },
]

export default function ArtifactsPage() {
  return (
    <section>
      <h1 className="font-semibold text-xl mb-6 tracking-tighter font-mono">Artifacts</h1>

      <div className="flex flex-col gap-2">
        {ARTIFACTS.map((artifact) => (
          <ProjectCard key={artifact.href} project={artifact} />
        ))}
      </div>
    </section>
  )
}
