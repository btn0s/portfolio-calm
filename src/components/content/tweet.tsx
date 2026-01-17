"use client";

import { useEffect, useRef } from "react";

interface TweetProps {
  url: string;
  className?: string;
}

function getTweetId(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
}

export function Tweet({ url, className }: TweetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tweetId = getTweetId(url);
    if (!containerRef.current || !tweetId) return;

    containerRef.current.innerHTML = "";

    const renderTweet = () => {
      if (!containerRef.current) return;
      window.twttr!.widgets.createTweet(tweetId, containerRef.current, {
        theme: "light",
        dnt: true,
      });
    };

    if (!window.twttr) {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.charset = "utf-8";
      document.head.appendChild(script);
      script.onload = renderTweet;
    } else {
      renderTweet();
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [url]);

  return (
    <div className="flex flex-col items-center justify-center bg-card border w-full max-w-4xl p-4">
      <div
        ref={containerRef}
        className={className}
        style={{ display: "flex", justifyContent: "center", width: "100%" }}
      />
    </div>
  );
}

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (el?: HTMLElement) => void;
        createTweet: (
          tweetId: string,
          container: HTMLElement,
          options?: { theme?: string; dnt?: boolean }
        ) => Promise<HTMLElement | undefined>;
      };
    };
  }
}
