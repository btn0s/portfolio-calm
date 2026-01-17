import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/nav";
import Footer from "@/components/footer";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { baseUrl } from "./sitemap";
import { ReceiptStack } from "@/components/receipt-stack/receipt-stack";
import { HomeReceipt } from "./(stack)/_receipts/home-receipt";
import { ThoughtsReceipt } from "./(stack)/_receipts/thoughts-receipt";
import { ArtifactsReceipt } from "./(stack)/_receipts/artifacts-receipt";
import { ScrollToTop } from "@/components/scroll-to-top";
import React from "react";
import { cn } from "@/lib/utils";
import { MobileNav } from "@/components/mobile-nav";
import { SoundProvider } from "@/contexts/sound-context";
import { DragProvider } from "@/contexts/drag-context";
import { ClickHandler } from "@/components/click-handler";
import { AmbientSoundManager } from "@/components/ambient-sound-manager";
import { RouteIntroHandler } from "@/components/route-intro-handler";
import { SafariBar } from "@/components/safari-bar";
import { FpsMonitor } from "@/components/fps-monitor";

const abcOracle = localFont({
  src: "../assets/fonts/ABC-Stefan/ABCOracleVariable-Trial.ttf",
  variable: "--font-sans-header",
  display: "swap",
});

const abcDiatype = localFont({
  src: [
    {
      path: "../assets/fonts/ABC-Collection/Diatype-Regular.woff2",
      weight: "400",
    },
    {
      path: "../assets/fonts/ABC-Collection/Diatype-Bold.woff2",
      weight: "700",
    },
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
    default: "bt norris, design engineer",
    template: "%s — bt norris",
  },
  description:
    "Product designer, coder, and tinkerer. Portfolio of work, artifacts, and thoughts on design, engineering, and game development.",
  keywords: [
    "product design",
    "design engineer",
    "game development",
    "portfolio",
    "design systems",
    "frontend development",
  ],
  authors: [{ name: "bt norris" }],
  creator: "bt norris",
  openGraph: {
    title: "bt norris, design engineer",
    description:
      "Product designer, coder, and tinkerer. Portfolio of work, artifacts, and thoughts on design, engineering, and game development.",
    url: baseUrl,
    siteName: "bt norris",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: `${baseUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "bt norris portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "bt norris, design engineer",
    description:
      "Product designer, coder, and tinkerer. Portfolio of work, artifacts, and thoughts.",
    images: [`${baseUrl}/og.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <html
      lang="en"
      className={`dark ${abcOracle.variable} ${abcDiatype.variable} ${departureMono.variable}`}
      style={{ colorScheme: 'dark' }}
    >
      <head>
        <meta
          name="theme-color"
          content="#252525"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
      </head>
      <body className="antialiased">
        <SoundProvider>
          <DragProvider>
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border-2 focus:border-foreground focus:rounded-md focus:font-bold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Skip to content
          </a>
          {/* <AmbientSoundManager /> */}
          <RouteIntroHandler />
          <ClickHandler />
          <SafariBar />
          <ScrollToTop />
          <main className="min-w-0 pt-16 flex flex-col px-4 overflow-x-clip overflow-y-visible md:overflow-visible">
            <Navbar />
            <MobileNav />
            <div
              id="content"
              tabIndex={-1}
              className={cn(
                "relative outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                hasChildren ? "pb-24" : ""
              )}
            >
              <div
                className={cn(
                  "max-w-full md:max-w-xl mx-auto",
                  !hasChildren && "hidden"
                )}
              >
                {children}
              </div>
              <ReceiptStack
                homeReceipt={<HomeReceipt />}
                thoughtsReceipt={<ThoughtsReceipt />}
                artifactsReceipt={<ArtifactsReceipt />}
              />
            </div>
            <Analytics />
            <SpeedInsights />
          </main>
          <Footer />
          </DragProvider>
        </SoundProvider>
        <FpsMonitor />
      </body>
    </html>
  );
}
