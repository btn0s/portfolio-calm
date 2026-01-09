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
    default: 'Portfolio',
    template: '%s | Portfolio',
  },
  description: 'Personal portfolio and thoughts.',
  openGraph: {
    title: 'Portfolio',
    description: 'Personal portfolio and thoughts.',
    url: baseUrl,
    siteName: 'Portfolio',
    locale: 'en_US',
    type: 'website',
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
        <main className="flex-auto min-w-0 mt-6 flex flex-col px-2 md:px-0">
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
