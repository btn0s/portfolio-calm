import { notFound } from 'next/navigation'
import { CustomMDX } from '@/components/mdx'
import { formatDate, getBlogPosts } from '@/lib/blog'
import { generatePageMetadata } from '@/lib/metadata'
import { baseUrl } from '@/app/sitemap'
import type { Metadata } from 'next'
import { PostContentWrapper } from '@/components/post-content-wrapper'

export async function generateStaticParams() {
  try {
    let posts = getBlogPosts()
    return posts.map((post) => ({
      slug: post.slug,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  let { slug } = await params
  let post = getBlogPosts().find((post) => post.slug === slug)
  if (!post) {
    return {}
  }

  let {
    title,
    publishedAt: publishedTime,
    summary: description,
    image,
  } = post.metadata

  return generatePageMetadata({
    title,
    description,
    path: `/thoughts/${post.slug}`,
    ogImage: image,
    ogType: 'article',
    publishedTime,
  })
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  let { slug } = await params
  let post = getBlogPosts().find((post) => post.slug === slug)

  if (!post) {
    notFound()
  }

  return (
    <section>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.summary,
            image: post.metadata.image
              ? `${baseUrl}${post.metadata.image}`
              : `${baseUrl}/og?title=${encodeURIComponent(post.metadata.title)}`,
            url: `${baseUrl}/thoughts/${post.slug}`,
            author: {
              '@type': 'Person',
              name: 'bt norris',
            },
            publisher: {
              '@type': 'Person',
              name: 'bt norris',
            },
          }),
        }}
      />
      <PostContentWrapper>
        <div className="pt-8 pb-6">
          <h1 className="font-semibold text-xl tracking-tighter mb-2 font-mono">
            {post.metadata.title}
          </h1>
          <div className="flex justify-between items-center text-sm">
            <p className="text-sm text-muted-foreground">
              {formatDate(post.metadata.publishedAt)}
            </p>
          </div>
        </div>
        <article className="prose prose-sm">
          <CustomMDX source={post.content} />
        </article>
      </PostContentWrapper>
    </section>
  )
}
