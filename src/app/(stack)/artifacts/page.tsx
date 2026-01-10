import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'artifacts',
  description: 'Experiments, prototypes, and explorations in game development, tooling, and visual design',
  path: '/artifacts',
  keywords: ['experiments', 'prototypes', 'game development', 'tooling', 'visual design'],
})

export default function Page() {
  return null;
}
