import Link from 'next/link'
import { formatDate, getBlogPosts } from '@/lib/blog'

export function BlogPosts() {
  const allBlogs = getBlogPosts();

  return (
    <div className="flex flex-col gap-2">
      {allBlogs
        .sort((a, b) => {
          if (
            new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)
          ) {
            return -1
          }
          return 1
        })
        .map((post) => (
          <Link
            key={post.slug}
            className="flex items-center gap-4 -mx-2 px-2 py-0.5 rounded-sm hover:bg-muted/50 transition-colors"
            href={`/thoughts/${post.slug}`}
          >
            <p className="text-foreground tracking-tight text-sm">
              {post.metadata.title}
            </p>
            <p className="text-muted-foreground w-32 tabular-nums font-mono text-xs whitespace-nowrap shrink-0">
              {formatDate(post.metadata.publishedAt, false)}
            </p>
          </Link>
        ))}
    </div>
  )
}
