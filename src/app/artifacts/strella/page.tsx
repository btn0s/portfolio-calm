import { ArtifactDesk } from '@/components/artifact-desk'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'strella',
  description: 'The first IDE for design engineers - a Visual Development Environment where layout, logic, and state come together',
  path: '/artifacts/strella',
  keywords: ['IDE', 'design engineering', 'visual development', 'node graph', 'tooling'],
})

export default function StrellaPage() {
  return (
    <ArtifactDesk
      title="Strella"
      year="2026"
      description="A visual development environment where design, logic, and state come together on one canvas."
      metadata={[
        { label: 'Role', value: 'Design eng.' },
        { label: 'Type', value: 'Prototype' },
        { label: 'Status', value: 'In motion' },
      ]}
      brief={{
        title: 'Design and logic, in the same place.',
        paragraphs: [
          'Strella is a visual development environment for people who think spatially but build interactively. Layout, logic, and state live on one shared canvas.',
          'A node-based graph editor, a visual editor for component structure, and a runtime that stays in sync replace the traditional handoff pipeline.',
        ],
        facts: [
          { label: 'Stack', value: 'React / TS' },
          { label: 'State', value: 'Experimental' },
        ],
      }}
      externalLink={{ label: 'Visit Strella', href: 'https://strella.dev' }}
      media={[
        { id: 'hero', kind: 'image', src: '/images/artifacts/strella/cover.png', alt: 'Strella visual development environment', caption: '01 — Main workspace' },
        { id: 'graph-preview', kind: 'image', src: '/images/artifacts/strella/page-view-graph-w-preview.png', alt: 'Logic graph with live preview', caption: '02 — Logic with result in view' },
        { id: 'design', kind: 'image', src: '/images/artifacts/strella/page-view-design.png', alt: 'Strella canvas editor', caption: '03 — Canvas detail' },
        { id: 'graph', kind: 'image', src: '/images/artifacts/strella/page-view-graph.png', alt: 'Strella graph view', caption: '04 — Node topology' },
        { id: 'project', kind: 'image', src: '/images/artifacts/strella/project-view-design.png', alt: 'Strella project structure', caption: '05 — Project structure' },
      ]}
      note={{ label: 'Working note', text: 'What if the prototype itself became the spec?' }}
      principle={{ label: 'Principle 02', text: 'Keep the work close enough to touch.' }}
    />
  )
}
