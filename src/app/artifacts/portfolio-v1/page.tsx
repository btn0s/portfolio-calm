import { ArtifactDesk } from '@/components/artifact-desk'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'portfolio v1',
  description: 'Previous portfolio iteration showcasing an earlier approach to presenting work and projects',
  path: '/artifacts/portfolio-v1',
})

export default function PortfolioV1Page() {
  return (
    <ArtifactDesk
      title="Portfolio v1"
      year="2024"
      description="The previous iteration of this portfolio and an earlier approach to presenting work."
      metadata={[
        { label: 'Role', value: 'Everything' },
        { label: 'Type', value: 'Portfolio' },
        { label: 'State', value: 'Archived' },
      ]}
      brief={{
        title: 'The version before this one.',
        paragraphs: [
          'An earlier portfolio experiment exploring a different balance of project storytelling, interaction, and personal identity.',
        ],
        facts: [
          { label: 'Artifact', value: 'Website' },
          { label: 'Status', value: 'Archived' },
        ],
      }}
      media={[
        { id: 'walkthrough', kind: 'video', src: '/assets/videos/portfolio.mp4', alt: 'Portfolio version one walkthrough', caption: '01 — Portfolio walkthrough' },
      ]}
      note={{ label: 'Retrospective', text: 'A portfolio is never finished. It just becomes the reference for the next one.' }}
      principle={{ label: 'Lesson', text: 'Keep the experiments, even after the system changes.' }}
    />
  )
}
