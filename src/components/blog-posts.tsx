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
    <div className="space-y-4">
      {sortedBlogs.map((post) => (
        <Link
          key={post.slug}
          className="group block transition-none"
          href={`/thoughts/${post.slug}`}
        >
          <div className="flex justify-between items-baseline mb-1">
            <span className="font-bold uppercase text-xs underline decoration-dotted underline-offset-2 group-hover:decoration-solid text-pretty">
              {post.metadata.title}
            </span>
            <span className="shrink-0 opacity-70 text-[9px] font-mono">
              {formatDate(post.metadata.publishedAt, false)}
            </span>
          </div>
          <p className="text-[10px] leading-tight opacity-70 mb-1">
            {post.metadata.summary}
          </p>
          <span className="text-[9px] opacity-50 block truncate">
            thoughts/{post.slug}
          </span>
        </Link>
      ))}
    </div>
  );
}
