'use client'

import { useState } from 'react'
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

export function BlogPosts({ posts }: BlogPostsProps) {
  const allPosts = posts
  const [filter, setFilter] = useState<Filter>('recent')

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
      <div className="flex items-center gap-3 mb-6 text-[10px] font-mono uppercase tracking-wider text-[#1a1a1a]/50">
        <button
          onClick={() => setFilter('recent')}
          className={`transition-opacity hover:opacity-100 ${
            filter === 'recent' ? 'opacity-100 font-bold' : 'opacity-40'
          }`}
        >
          Recent
        </button>
        <span className="opacity-20">/</span>
        <button
          onClick={() => setFilter('professional')}
          className={`transition-opacity hover:opacity-100 ${
            filter === 'professional' ? 'opacity-100 font-bold' : 'opacity-40'
          }`}
        >
          Professional
        </button>
        <span className="opacity-20">/</span>
        <button
          onClick={() => setFilter('personal')}
          className={`transition-opacity hover:opacity-100 ${
            filter === 'personal' ? 'opacity-100 font-bold' : 'opacity-40'
          }`}
        >
          Personal
        </button>
      </div>
      <div className="space-y-6">
        {filteredPosts.map((post) => (
          <div key={post.slug} className="relative group">
            <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-foreground/10 group-hover:bg-foreground/40 transition-colors" />
            <ListItem
              title={post.metadata.title}
              description={post.metadata.summary}
              date={formatDate(post.metadata.publishedAt, false)}
              subtext={`log/${post.slug}`}
              href={`/thoughts/${post.slug}`}
            />
          </div>
        ))}
      </div>
    </>
  );
}
