import { ListItem } from './list-item'
import { YearGroups } from './year-groups'

type BlogPost = {
  metadata: {
    title: string
    publishedAt: string
  }
  slug: string
}

const day = (post: BlogPost) => new Date(`${post.metadata.publishedAt.slice(0, 10)}T00:00:00`)

/** Every post, newest first, grouped by year. */
export function BlogPosts({ posts }: { posts: BlogPost[] }) {
  const sorted = [...posts].sort((a, b) => day(b).getTime() - day(a).getTime())

  return (
    <YearGroups items={sorted} year={(post) => day(post).getFullYear()}>
      {(post) => (
        <div key={post.slug} className="relative group py-3">
          <div className="absolute -left-3 top-3 bottom-3 w-0.5 bg-foreground/10 group-hover:bg-foreground/40 transition-colors" />
          <ListItem
            title={post.metadata.title}
            date={day(post).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            href={`/thoughts/${post.slug}`}
            titleClassName="font-serif italic capitalize tracking-normal text-sm max-w-[32ch] text-balance"
          />
        </div>
      )}
    </YearGroups>
  )
}
