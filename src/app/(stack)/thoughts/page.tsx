import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'thoughts',
  description: 'Thoughts on design, engineering, game development, and building products',
  path: '/thoughts',
  keywords: ['blog', 'design', 'engineering', 'game development', 'product development'],
})

export default function Page() {
  return null;
}
