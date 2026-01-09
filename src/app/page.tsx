import Link from 'next/link'
import { BlogPosts } from '@/components/blog-posts'
import { baseUrl } from '@/app/sitemap'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'bt norris, design engineer',
  description: 'Product designer, coder, and tinkerer. Portfolio of work, artifacts, and thoughts on design, engineering, and game development.',
  openGraph: {
    title: 'bt norris, design engineer',
    description: 'Product designer, coder, and tinkerer. Portfolio of work, artifacts, and thoughts on design, engineering, and game development.',
    url: baseUrl,
    type: 'website',
  },
  alternates: {
    canonical: baseUrl,
  },
}

const CAREER_ITEMS: {
  title: string;
  company: string;
  date: string;
  href?: string;
}[] = [
  {
    title: "Principal Design Engineer",
    company: "thinkhuman.co",
    date: "2025",
  },
  {
    title: "Labs Program Lead",
    company: "Backbone",
    date: "2024",
  },
  {
    title: "Senior Design Engineer",
    company: "Backbone",
    date: "2021",
  },
  {
    title: "SWE II",
    company: "American Express",
    date: "2019",
  },
];

const PROJECTS = [
  {
    title: "IndieFindr",
    description:
      "Discover your next favorite indie game through AI-powered recommendations",
    href: "https://indiefindr.gg",
  },
  {
    title: "Computer",
    description: "Slack-native agent harness for Cursor Background Agents",
    href: "https://github.com/btn0s/computer",
  },
  {
    title: "Unreal MCP",
    description:
      "Control Unreal Engine through natural language using Model Context Protocol",
    href: "https://github.com/btn0s/unreal-mcp",
  },
];

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "bt norris",
            jobTitle: "Design Engineer",
            description: "Product designer, coder, and tinkerer",
            url: baseUrl,
            sameAs: ["https://github.com/btn0s"],
          }),
        }}
      />
      <main className="flex flex-col gap-8 [&>section>h2]:font-mono [&>section>h2]:tracking-tighter [&>section>h2]:text-base [&>section>h2]:font-semibold [&>section>h2]:mb-3">
        <section className="text-foreground">
          <p>
            I&apos;m bt norris—product designer, coder, tinkerer... This is my
            personal website, where I share things I&apos;m working on and
            thinking about.
          </p>
        </section>

        <section>
          <h2>Career</h2>
          <ul className="flex flex-col gap-1.5">
            {CAREER_ITEMS.map((item) => (
              <li
                key={`${item.date}-${item.title}`}
                className="flex items-center gap-4 text-sm"
              >
                <span className="text-muted-foreground font-mono text-xs w-12">
                  {item.date}
                </span>
                <span className="font-medium">{item.title}</span>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-muted-foreground flex-1 text-right hover:text-foreground transition-colors font-mono text-xs"
                  >
                    @{item.company.toLowerCase()}
                  </Link>
                ) : (
                  <span className="text-muted-foreground flex-1 text-right font-mono text-xs">
                    @{item.company.toLowerCase()}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <Link
            href="/resume"
            className="text-muted-foreground hover:text-foreground text-sm hover:underline mt-2 block"
          >
            View resume
          </Link>
        </section>

        <section>
          <h2>Projects</h2>
          <div className="flex flex-col gap-2">
            {PROJECTS.map((project) => (
              <a
                key={project.title}
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group -mx-2 px-2 py-0.5 rounded-sm hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2 mb-1">
                    <h3 className="font-medium text-sm text-foreground">
                      {project.title}
                    </h3>
                    <span className="text-xs text-muted-foreground font-mono">
                      {project.href.split("//")[1]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section>
          <h2>Recent Thoughts</h2>
          <BlogPosts />
          <Link
            href="/thoughts"
            className="text-muted-foreground hover:text-foreground text-sm hover:underline mt-2 block"
          >
            View all
          </Link>
        </section>
      </main>
    </>
  );
}
