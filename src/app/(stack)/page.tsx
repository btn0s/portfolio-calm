import { baseUrl } from '@/app/sitemap'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "bt norris, design engineer",
  description:
    "Product designer, coder, and tinkerer. Portfolio of work, artifacts, and thoughts on design, engineering, and game development.",
  openGraph: {
    title: "bt norris, design engineer",
    description:
      "Product designer, coder, and tinkerer. Portfolio of work, artifacts, and thoughts on design, engineering, and game development.",
    url: baseUrl,
    type: "website",
  },
  alternates: {
    canonical: baseUrl,
  },
};

export default function Page() {
  return (
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
  );
}
