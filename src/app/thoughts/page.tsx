import { BlogPosts } from '@/components/blog-posts'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Thoughts',
  description: 'Read my thoughts.',
}

export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-xl mb-6 tracking-tighter font-mono">Thoughts</h1>
      <BlogPosts />
    </section>
  )
}
