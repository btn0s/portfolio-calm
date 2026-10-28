"use client";

import { useEffect, useRef } from "react";
import "./birthday.css";

type Name = "timeline" | "tickets" | "ball" | "mood" | "crowd" | "wave" | "flight" | "hitch" | "race" | "cameras";

/** Mounts one of the post's interactive figures once it reaches the client. */
export function Widget({ name }: { name: Name }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    void import("./widgets").then((m) => {
      const root = ref.current;
      if (cancelled || !root || root.childElementCount) return;
      m[name](root);
    });
    return () => {
      cancelled = true;
    };
  }, [name]);
  return (
    <section className="widget wide" id={`${name}-section`}>
      <div ref={ref} id={name} />
    </section>
  );
}

/** A row of screenshots from the show; tap one to see it big. */
export function Strip({ images }: { images: [string, string][] }) {
  return (
    <figure className="strip wide">
      {images.map(([src, alt]) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={`/thoughts/birthday/${src}`} alt={alt} loading="lazy" />
      ))}
    </figure>
  );
}

/** The mood board: the tour's own screen looks, each named. */
export function Board({ images, credit }: { images: [string, string][]; credit: string }) {
  return (
    <figure className="board wide">
      <div className="board-grid">
        {images.map(([src, label]) => (
          <figure key={src}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/thoughts/birthday/${src}`} alt={label} loading="lazy" />
            <figcaption>{label}</figcaption>
          </figure>
        ))}
      </div>
      <figcaption className="caption">{credit}</figcaption>
    </figure>
  );
}
