"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
}

export function Video({ src, className, ...props }: VideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: "100px", // Start playing slightly before it comes into view
      }
    );

    observer.observe(video);

    return () => {
      observer.unobserve(video);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInView) {
      video.play().catch(() => {
        // Handle autoplay block or other errors
      });
    } else {
      video.pause();
    }
  }, [isInView]);

  return (
    <video
      ref={videoRef}
      className={cn(className)}
      muted
      playsInline
      loop
      preload="none"
      {...props}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
