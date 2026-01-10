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
    <div className="space-y-4">
      {sortedBlogs.map((post) => (
        <ListItem
          key={post.slug}
          title={post.metadata.title}
          description={post.metadata.summary}
          date={formatDate(post.metadata.publishedAt, false)}
          subtext={`thoughts/${post.slug}`}
          href={`/thoughts/${post.slug}`}
        />
      ))}
    </div>
  );
}
