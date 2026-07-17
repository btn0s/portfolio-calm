import { ArtifactDesk } from '@/components/artifact-desk'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'echelon',
  description: 'A multiplayer stealth game concept designed and prototyped in Unreal Engine Blueprints',
  path: '/artifacts/echelon',
  keywords: ['game development', 'unreal engine', 'blueprints', 'multiplayer', 'stealth game'],
})

export default function EchelonPage() {
  return (
    <ArtifactDesk
      title="Echelon"
      year="2024"
      description="An asymmetric multiplayer stealth game built as a technical and interaction-design vertical slice."
      metadata={[
        { label: 'Engine', value: 'Unreal 5' },
        { label: 'Mode', value: 'Spies v. mercs' },
        { label: 'Status', value: 'Vertical slice' },
      ]}
      brief={{
        title: 'Agility against firepower.',
        paragraphs: [
          'Echelon is an asymmetric multiplayer stealth game inspired by the tactical tension of early stealth classics. Spies versus mercenaries. Third-person agility versus first-person firepower.',
          'Built entirely with Blueprints in Unreal Engine 5, it stress-tests complex gameplay systems and network-replicated player states.',
        ],
        facts: [
          { label: 'Role', value: 'Game designer' },
          { label: 'Build', value: 'Blueprints' },
        ],
      }}
      media={[
        { id: 'cover', kind: 'image', src: '/images/artifacts/echelon/cover.png', alt: 'Echelon game prototype', caption: '01 — Live game prototype' },
        { id: 'menu', kind: 'image', src: '/images/artifacts/echelon/main-menu-concept.png', alt: 'Echelon main menu concept', caption: '02 — Interface architecture' },
        { id: 'match', kind: 'image', src: '/images/artifacts/echelon/match-start-spies.png', alt: 'Echelon match start for spies', caption: '03 — Deployment view' },
        { id: 'damage', kind: 'image', src: '/images/artifacts/echelon/damage-merc.png', alt: 'Mercenary damage indicator', caption: '04 — Combat feedback' },
        { id: 'eliminated', kind: 'image', src: '/images/artifacts/echelon/eliminated.png', alt: 'Eliminated screen', caption: '05 — Elimination state' },
        { id: 'wireframes', kind: 'image', src: '/images/artifacts/echelon/menu-wireframes.png', alt: 'Menu wireframes', caption: '06 — Menu wireframes' },
        { id: 'prematch', kind: 'image', src: '/images/artifacts/echelon/prematch-concept.png', alt: 'Prematch concept', caption: '07 — Prematch concept' },
      ]}
      note={{ label: 'Design tension', text: 'Two perspectives. Two power fantasies. One shared arena.' }}
      principle={{ label: 'System rule', text: 'Every advantage should create a new vulnerability.' }}
    />
  )
}
