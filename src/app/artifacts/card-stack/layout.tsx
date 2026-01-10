import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'card stack',
  description: 'Interactive card stack with drag interactions - exploring receipt-style UI and animation patterns',
  path: '/artifacts/card-stack',
  keywords: ['animation', 'framer motion', 'drag interaction', 'react', 'ui design'],
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
