import { ArtifactDesk } from '@/components/artifact-desk'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'tldraw rts',
  description: 'A real-time strategy game prototype built with Tldraw SDK',
  path: '/artifacts/tldraw-rts',
  keywords: ['tldraw', 'game prototype', 'RTS', 'canvas', 'typescript'],
})

export default function TldrawRTSPage() {
  return (
    <ArtifactDesk
      title="Tldraw RTS"
      year="2023"
      description="A real-time strategy game hiding inside a collaborative drawing canvas."
      metadata={[
        { label: 'Platform', value: 'Tldraw SDK' },
        { label: 'Type', value: 'Game prototype' },
        { label: 'Status', value: 'Verified' },
      ]}
      brief={{
        title: 'A canvas tick became a game loop.',
        paragraphs: [
          'While building a canvas tool with the Tldraw SDK, I noticed its tick function and used it to prototype a real-time strategy game.',
          'The experiment grew into animations and an AI-driven RTS system. Tldraw responded and reposted the prototype.',
        ],
        facts: [
          { label: 'Stack', value: 'Tldraw / TS' },
          { label: 'Mode', value: 'Real time' },
        ],
      }}
      externalLink={{ label: 'More Tldraw experiments', href: 'https://x.com/search?q=from:btn0s%20tldraw&src=typed_query' }}
      media={[
        { id: 'demo', kind: 'video', src: '/assets/videos/rts01.mp4', alt: 'Tldraw RTS prototype demo', caption: '01 — Live prototype feed' },
      ]}
      note={{ label: 'Observation', text: 'General-purpose tools often hide surprisingly specific games.' }}
      principle={{ label: 'Finding', text: 'A useful primitive can become an entire genre.' }}
    />
  )
}
