import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'card stack click',
  description: 'Interactive card stack with click interactions - exploring receipt-style UI and animation patterns',
  path: '/artifacts/card-stack-click',
  keywords: ['animation', 'framer motion', 'react', 'ui design', 'receipt design'],
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
