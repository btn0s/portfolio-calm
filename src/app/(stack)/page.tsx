import type { Metadata } from 'next'
import { baseUrl } from '@/app/sitemap'

// Use default title from root layout to avoid duplication
export const metadata: Metadata = {
  description: "Product designer, coder, and tinkerer. Portfolio of work, artifacts, and thoughts on design, engineering, and game development.",
  keywords: ['product design', 'design engineer', 'game development', 'portfolio', 'design systems', 'frontend development'],
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
