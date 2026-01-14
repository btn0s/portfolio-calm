'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { formatDate } from '@/lib/blog-utils'
import { ListItem } from './list-item'

type Filter = 'recent' | 'professional' | 'personal'

type BlogPost = {
  metadata: {
    title: string
    publishedAt: string
    summary: string
    category?: 'professional' | 'personal'
  }
  slug: string
}

type BlogPostsProps = {
  posts: BlogPost[]
}

function BlogPostsContent({ posts }: BlogPostsProps) {
  const allPosts = posts
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [filter, setFilter] = useState<Filter>((searchParams.get('filter') as Filter) || 'recent')

  // Sync filter to URL
  useEffect(() => {
    const currentFilter = searchParams.get('filter') as Filter | null
    // Only update URL if filter actually changed from what's in the URL
    if (currentFilter === filter) return
    
    const params = new URLSearchParams(searchParams.toString())
    if (filter === 'recent') {
      params.delete('filter')
    } else {
      params.set('filter', filter)
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(newUrl, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const sortedPosts = [...allPosts].sort((a, b) => {
    if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
      return -1;
    }
    return 1;
  })

  const filteredPosts = sortedPosts.filter((post) => {
    if (filter === 'recent') return true
    const category = post.metadata.category || 'personal'
    return category === filter
  })

  return (
    <>
      <div className="flex items-center gap-3 mb-6 text-[10px] font-mono uppercase tracking-wider text-[#1a1a1a]/50" role="tablist" aria-label="Filter posts">
        <button
          onClick={() => setFilter('recent')}
          aria-pressed={filter === 'recent'}
          role="tab"
          aria-controls="posts-list"
          className={`transition-opacity hover:opacity-100 rounded-sm ${
            filter === 'recent' ? 'opacity-100 font-bold' : 'opacity-40'
          }`}
        >
          Recent
        </button>
        <span className="opacity-20" aria-hidden="true">/</span>
        <button
          onClick={() => setFilter('professional')}
          aria-pressed={filter === 'professional'}
          role="tab"
          aria-controls="posts-list"
          className={`transition-opacity hover:opacity-100 rounded-sm ${
            filter === 'professional' ? 'opacity-100 font-bold' : 'opacity-40'
          }`}
        >
          Professional
        </button>
        <span className="opacity-20" aria-hidden="true">/</span>
        <button
          onClick={() => setFilter('personal')}
          aria-pressed={filter === 'personal'}
          role="tab"
          aria-controls="posts-list"
          className={`transition-opacity hover:opacity-100 rounded-sm ${
            filter === 'personal' ? 'opacity-100 font-bold' : 'opacity-40'
          }`}
        >
          Personal
        </button>
      </div>
      <div id="posts-list" className="space-y-6" role="tabpanel">
        {filteredPosts.map((post) => (
          <div key={post.slug} className="relative group">
            <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-foreground/10 group-hover:bg-foreground/40 transition-colors" />
            <ListItem
              title={post.metadata.title}
              description={post.metadata.summary}
              date={formatDate(post.metadata.publishedAt, false)}
              subtext={`log/${post.slug}`}
              href={`/thoughts/${post.slug}`}
              titleClassName="font-serif italic capitalize tracking-normal text-sm"
              descriptionClassName="font-serif italic opacity-60"
            />
          </div>
        ))}
      </div>
    </>
  );
}

export function BlogPosts({ posts }: BlogPostsProps) {
  return (
    <Suspense fallback={<div className="space-y-6">Loading posts…</div>}>
      <BlogPostsContent posts={posts} />
    </Suspense>
  )
}
