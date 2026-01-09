import Link from 'next/link'
import { ProjectCard } from '@/components/project-card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Artifacts',
  description: 'Experiments, prototypes, and explorations',
}

const ARTIFACTS = [
  {
    title: 'Echelon',
    description: 'Asymmetric multiplayer stealth game prototype in Unreal Engine',
    href: '/artifacts/echelon',
    date: '2024',
    tags: ['Game Dev', 'Unreal Engine'],
  },
  {
    title: 'Strella',
    description: 'IDE designed for design engineers - Visual Development Environment',
    href: '/artifacts/strella',
    date: '2024',
    tags: ['Tooling', 'IDE'],
  },
  {
    title: 'Tldraw RTS',
    description: 'Real-time strategy game prototype built with Tldraw SDK',
    href: '/artifacts/tldraw-rts',
    date: '2023',
    tags: ['Game Dev', 'React'],
  },
  {
    title: 'Game Dev Prototypes',
    description: 'Collection of game development experiments and prototypes',
    href: '/artifacts/game-dev-prototypes',
    date: '2023-2024',
    tags: ['Game Dev'],
  },
  {
    title: 'Delphi Falling Chips',
    description: 'Interactive visual experiment',
    href: '/artifacts/delphi-falling-chips',
    date: '2024',
    tags: ['Visual'],
  },
  {
    title: 'Portfolio v1',
    description: 'Previous portfolio iteration',
    href: '/artifacts/portfolio-v1',
    date: '2023',
    tags: ['Web'],
  },
]

export default function ArtifactsPage() {
  return (
    <section>
      <h1 className="font-semibold text-xl mb-6 tracking-tighter font-mono">Artifacts</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Experiments, prototypes, and explorations in game development, tooling,
        and visual design.
      </p>

      <div className="flex flex-col gap-3">
        {ARTIFACTS.map((artifact) => (
          <ProjectCard key={artifact.href} project={artifact} />
        ))}
      </div>
    </section>
  )
}
