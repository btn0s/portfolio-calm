import Image from 'next/image'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'strella',
  description: 'The first IDE for design engineers - a Visual Development Environment where layout, logic, and state come together',
  path: '/artifacts/strella',
  keywords: ['IDE', 'design engineering', 'visual development', 'node graph', 'tooling'],
})

export default function StrellaPage() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-6 tracking-tighter">
        Strella: The first IDE designed for design engineers.
      </h1>

      <p className="mb-4 text-sm text-muted-foreground">
        React · TypeScript · Node Graph · Visual Scripting
      </p>

      <div className="mb-6 flex flex-col gap-4 text-sm">
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

      <div className="mb-6">
        <Image
          src="/images/artifacts/strella/cover.png"
          alt="Strella IDE"
          width={1200}
          height={675}
          className="w-full h-auto"
        />
      </div>

      <div className="mb-6">
        <Image
          src="/images/artifacts/strella/page-view-graph-w-preview.png"
          alt="Strella graph view with live preview"
          width={1200}
          height={675}
          className="w-full h-auto"
        />
      </div>

      <div className="mb-6">
        <Image
          src="/images/artifacts/strella/page-view-graph.png"
          alt="Strella graph view"
          width={1200}
          height={675}
          className="w-full h-auto"
        />
      </div>

      <div className="mb-6">
        <Image
          src="/images/artifacts/strella/page-view-design.png"
          alt="Strella design view"
          width={1200}
          height={675}
          className="w-full h-auto"
        />
      </div>

      <div className="mb-6">
        <Image
          src="/images/artifacts/strella/project-view-design.png"
          alt="Strella project view"
          width={1200}
          height={675}
          className="w-full h-auto"
        />
      </div>
    </section>
  )
}
