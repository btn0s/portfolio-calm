import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/nav";
import Footer from "@/components/footer";
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { baseUrl } from './sitemap'

const abcOracle = localFont({
  src: "../assets/fonts/ABC-Stefan/ABCOracleVariable-Trial.ttf",
  variable: "--font-sans-header",
  display: "swap",
});

const abcDiatype = localFont({
  src: [
    { path: "../assets/fonts/ABC-Collection/Diatype-Regular.woff2", weight: "400" },
    { path: "../assets/fonts/ABC-Collection/Diatype-Bold.woff2", weight: "700" },
  ],
  variable: "--font-sans-body",
  display: "swap",
});

const departureMono = localFont({
  src: [
    {
      path: "../assets/fonts/DepartureMono-1.500/DepartureMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/DepartureMono-1.500/DepartureMono-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/DepartureMono-1.500/DepartureMono-Regular.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'bt norris, design engineer',
    template: '%s | bt norris',
  },
  description: 'Product designer, coder, and tinkerer. Portfolio of work, artifacts, and thoughts on design, engineering, and game development.',
  keywords: ['product design', 'design engineer', 'game development', 'portfolio', 'design systems', 'frontend development'],
  authors: [{ name: 'bt norris' }],
  creator: 'bt norris',
  openGraph: {
    title: 'bt norris, design engineer',
    description: 'Product designer, coder, and tinkerer. Portfolio of work, artifacts, and thoughts on design, engineering, and game development.',
    url: baseUrl,
    siteName: 'bt norris',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og?title=${encodeURIComponent('bt norris, design engineer')}`,
        width: 1200,
        height: 630,
        alt: 'bt norris portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'bt norris, design engineer',
    description: 'Product designer, coder, and tinkerer. Portfolio of work, artifacts, and thoughts.',
    images: [`${baseUrl}/og?title=${encodeURIComponent('bt norris, design engineer')}`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className={`${abcOracle.variable} ${abcDiatype.variable} ${departureMono.variable}`}
    >
      <body className="antialiased max-w-xl mx-4 mt-8 lg:mx-auto">
        <main className="flex-auto min-w-0 mt-6 flex flex-col">
          <Navbar />
          {children}
          <Footer />
          <Analytics />
          <SpeedInsights />
        </main>
      </body>
    </html>
  );
}
