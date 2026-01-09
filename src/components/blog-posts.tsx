import Link from 'next/link'
import { formatDate, getBlogPosts } from '@/lib/blog'

export function BlogPosts() {
  const allBlogs = getBlogPosts();

  const sortedBlogs = allBlogs.sort((a, b) => {
    if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
      return -1;
    }
    return 1;
  });

  return (
    <div className="space-y-2">
      {sortedBlogs.map((post) => (
        <Link
          key={post.slug}
          className="flex justify-between items-baseline gap-2 text-sm group transition-none"
          href={`/thoughts/${post.slug}`}
        >
          <span className="font-bold uppercase underline decoration-dotted underline-offset-2 group-hover:decoration-solid max-w-1/2 text-pretty">
            {post.metadata.title}
          </span>
          <span className="shrink-0 opacity-70">
            {formatDate(post.metadata.publishedAt, false)}
          </span>
        </Link>
      ))}
    </div>
  );
}
