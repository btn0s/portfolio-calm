import { getBlogPosts } from '@/lib/blog'
import type { MetadataRoute } from 'next'

export const baseUrl = 'https://portfolio.example.com'

const ARTIFACTS = [
  'echelon',
  'strella',
  'tldraw-rts',
  'game-dev-prototypes',
  'delphi-falling-chips',
  'portfolio-v1',
  'card-stack',
  'card-stack-click',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let blogs = getBlogPosts().map((post) => ({
    url: `${baseUrl}/thoughts/${post.slug}`,
    lastModified: post.metadata.publishedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  let routes = [
    { route: '', priority: 1.0 },
    { route: '/thoughts', priority: 0.9 },
    { route: '/artifacts', priority: 0.9 },
    { route: '/me', priority: 0.5 },
  ].map(({ route, priority }) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'weekly' as const,
    priority,
  }))

  let artifacts = ARTIFACTS.map((slug) => ({
    url: `${baseUrl}/artifacts/${slug}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...routes, ...blogs, ...artifacts]
}
