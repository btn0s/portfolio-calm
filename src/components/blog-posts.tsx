import { formatDate, getBlogPosts } from '@/lib/blog'
import { ListItem } from './list-item'

export function BlogPosts() {
  const allBlogs = getBlogPosts();

  const sortedBlogs = allBlogs.sort((a, b) => {
    if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
      return -1;
    }
    return 1;
  });

  return (
    <div className="space-y-6">
      {sortedBlogs.map((post) => (
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
  );
}
