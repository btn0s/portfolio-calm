import { ArtifactDesk } from '@/components/artifact-desk'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'delphi falling chips',
  description: 'Interactive visual experiment exploring particle systems and physics',
  path: '/artifacts/delphi-falling-chips',
  keywords: ['animation', 'framer motion', 'react', 'visual experiment'],
})

export default function DelphiFallingChipsPage() {
  return (
    <ArtifactDesk
      title="Falling chips"
      year="2025"
      description="A small interaction study rebuilt from a delightful moment in Delphi’s onboarding."
      metadata={[
        { label: 'Stack', value: 'React' },
        { label: 'Motion', value: 'Framer' },
        { label: 'Type', value: 'Study' },
      ]}
      brief={{
        title: 'Rebuild the moment that sticks.',
        paragraphs: [
          'I was going through the Delphi onboarding and loved its falling-chip animation, so I decided to reverse-engineer and rebuild it.',
        ],
        facts: [
          { label: 'Focus', value: 'Physics' },
          { label: 'Output', value: 'Prototype' },
        ],
      }}
      externalLink={{ label: 'View live', href: 'https://delphi-chips-falling.vercel.app/' }}
      media={[
        { id: 'demo', kind: 'video', src: '/assets/videos/delphi-falling-chips.mp4', alt: 'Delphi falling chips animation', caption: '01 — Interaction study' },
      ]}
      note={{ label: 'Why this', text: 'Tiny transitions can carry the personality of an entire product.' }}
      principle={{ label: 'Study rule', text: 'Rebuild delight to understand how it works.' }}
    />
  )
}
