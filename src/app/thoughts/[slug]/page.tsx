import { notFound } from 'next/navigation'
import { CustomMDX } from '@/components/mdx'
import { formatDate, getBlogPosts } from '@/lib/blog'
import { generatePageMetadata } from '@/lib/metadata'
import { baseUrl } from '@/app/sitemap'
import type { Metadata } from "next";
import { Barcode } from '@/components/barcode'
import { PixelPattern } from '@/components/pixel-pattern'

export async function generateStaticParams() {
  try {
    const posts = getBlogPosts();
    return posts.map((post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPosts().find((post) => post.slug === slug);
  if (!post) {
    return {};
  }

  const {
    title,
    publishedAt: publishedTime,
    summary: description,
    image,
  } = post.metadata;

  return generatePageMetadata({
    title,
    description,
    path: `/thoughts/${post.slug}`,
    ogImage: image,
    ogType: "article",
    publishedTime,
  });
}

export default async function Post({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPosts().find((post) => post.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <section className="pb-32 max-w-2xl mx-auto">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.summary,
            image: post.metadata.image
              ? `${baseUrl}${post.metadata.image}`
              : `${baseUrl}/og?title=${encodeURIComponent(
                  post.metadata.title
                )}`,
            url: `${baseUrl}/thoughts/${post.slug}`,
            author: {
              "@type": "Person",
              name: "bt norris",
            },
            publisher: {
              "@type": "Person",
              name: "bt norris",
            },
          }),
        }}
      />
      
      {/* Technical Header */}
      <header className="pt-12 pb-16">
        <div className="flex justify-between items-start mb-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-foreground text-background px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tighter">
                ENTRY_{slug.toUpperCase().replace(/-/g, '_')}
              </span>
              <div className="h-px bg-foreground/10 flex-1 min-w-[40px]" />
            </div>
            <h1 className="font-black text-4xl tracking-tighter uppercase leading-[0.9] max-w-[15ch]">
              {post.metadata.title}
            </h1>
          </div>
          <div className="w-16 h-16 border border-foreground/5 p-1 opacity-20 hidden sm:block">
            <PixelPattern size={32} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-foreground/10 py-6 font-mono">
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">PUBLISHED</span>
            <span className="text-[10px] font-bold">{formatDate(post.metadata.publishedAt, false).toUpperCase()}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">STATUS</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase">ARCHIVED</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">CHANNEL</span>
            <span className="text-[10px] font-bold uppercase">PUBLIC_LOG</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">VERSION</span>
            <span className="text-[10px] font-bold uppercase">2026.01</span>
          </div>
        </div>
      </header>

      <article className="prose prose-neutral prose-sm max-w-none">
        <CustomMDX source={post.content} />
      </article>

      {/* Technical Footer */}
      <footer className="mt-32 pt-16 border-t-2 border-foreground/10 flex flex-col items-center gap-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 w-full gap-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-foreground" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">CERTIFICATION</span>
            </div>
            <div className="pl-3 border-l-2 border-foreground/5 italic text-sm opacity-50 font-serif">
              "This entry represents a point-in-time reflection from the personal archives of BT Norris. 
              The thoughts contained herein are subject to evolution and iteration."
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:items-end">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">IDENTIFIER</span>
              <div className="w-1 h-1 bg-foreground" />
            </div>
            <div className="flex flex-col sm:items-end gap-1 font-mono">
              <div className="text-[10px] font-bold opacity-60">
                TH_{slug.substring(0, 8).toUpperCase()}_01
              </div>
              <Barcode className="opacity-40 mix-blend-multiply h-6 mt-1" />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-1 h-1 bg-foreground/20" />
            ))}
          </div>
          <p className="text-[8px] font-black opacity-20 uppercase tracking-[1.5em] pl-[1.5em]">
            END_OF_DOCUMENT
          </p>
        </div>
      </footer>
    </section>
  );
}
