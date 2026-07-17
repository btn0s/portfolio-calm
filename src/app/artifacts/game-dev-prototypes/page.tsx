import { ArtifactDesk } from '@/components/artifact-desk'
import { generatePageMetadata } from '@/lib/metadata'

const VIDEOS = [
  'https://pub-627932c2845d4a40839460d52d8a0d2d.r2.dev/Streamable%20Dashboard%20(1).mp4',
  'https://pub-627932c2845d4a40839460d52d8a0d2d.r2.dev/Streamable%20Dashboard%20(2).mp4',
  'https://pub-627932c2845d4a40839460d52d8a0d2d.r2.dev/Streamable%20Dashboard%20Video%20(1).mp4',
  'https://pub-627932c2845d4a40839460d52d8a0d2d.r2.dev/Streamable%20Dashboard%20Video%20(2).mp4',
  'https://pub-627932c2845d4a40839460d52d8a0d2d.r2.dev/Streamable%20Dashboard%20Video%20(3).mp4',
  'https://pub-627932c2845d4a40839460d52d8a0d2d.r2.dev/Streamable%20Dashboard%20Video%20(4).mp4',
]

export const metadata = generatePageMetadata({
  title: 'game dev prototypes',
  description: 'Collection of game development experiments and prototypes built in Unreal Engine Blueprints',
  path: '/artifacts/game-dev-prototypes',
  keywords: ['game development', 'unreal engine', 'blueprints', 'prototypes', 'experiments'],
})

export default function GameDevPrototypesPage() {
  return (
    <ArtifactDesk
      title="Game dev prototypes"
      year="2023–24"
      description="A collection of gameplay systems, mechanics, and level-design experiments built in Unreal Engine."
      metadata={[
        { label: 'Engine', value: 'Unreal' },
        { label: 'Build', value: 'Blueprints' },
        { label: 'Type', value: 'Collection' },
      ]}
      brief={{
        title: 'Build each piece, then wire it together.',
        paragraphs: [
          'These prototypes combine level design, modeling, animation, and gameplay mechanics explored over several years.',
          'Each begins with a reference or mechanic, gets decomposed into isolated components, and is rebuilt as a working system.',
        ],
        facts: [
          { label: 'Focus', value: 'Mechanics' },
          { label: 'Format', value: 'Experiments' },
        ],
      }}
      media={[
        { id: 'cover', kind: 'image', src: '/images/artifacts/game-dev-prototypes/cover.png', alt: 'Game development prototypes', caption: '01 — Prototype collection' },
        ...VIDEOS.map((src, index) => ({
          id: `demo-${index + 1}`,
          kind: 'video' as const,
          src,
          alt: `Gameplay prototype ${index + 1}`,
          caption: `${String(index + 2).padStart(2, '0')} — Gameplay study`,
        })),
      ]}
      note={{ label: 'Process', text: 'Reference, decompose, isolate, rebuild, connect.' }}
      principle={{ label: 'Collection rule', text: 'A working mechanic teaches more than a finished mockup.' }}
    />
  )
}
