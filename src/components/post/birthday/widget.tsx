"use client";

import { useEffect, useRef } from "react";
import { registerLightbox } from "../lightbox";
import "./birthday.css";
import "../indiefindr/indiefindr.css";

/** Each post's figures, loaded only when that post mounts one. */
const POSTS = {
  birthday: () => import("./widgets"),
  indiefindr: () => import("../indiefindr/widgets"),
};
type Mount = (root: HTMLElement) => void;

/** Mounts one of a post's interactive figures once it reaches the client. */
export function Widget({ name, post = "birthday" }: { name: string; post?: keyof typeof POSTS }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    void POSTS[post]().then((m) => {
      const root = ref.current;
      const mount = (m as unknown as Record<string, Mount>)[name];
      if (cancelled || !root || root.childElementCount || !mount) return;
      mount(root);
    });
    return () => {
      cancelled = true;
    };
  }, [name, post]);
  return (
    <section className="widget wide" id={`${name}-section`}>
      <div ref={ref} id={name} />
    </section>
  );
}

/** A row of screenshots from the show; tap one to see it big. */
export function Strip({ images, dir = "birthday" }: { images: [string, string][]; dir?: string }) {
  useEffect(registerLightbox, []);
  return (
    <figure className="strip wide">
      {images.map(([src, alt]) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={`/thoughts/${dir}/${src}`} alt={alt} loading="lazy" />
      ))}
    </figure>
  );
}

/** The mood board: the tour's own screen looks, each named. */
export function Board({ images, credit }: { images: [string, string][]; credit: string }) {
  useEffect(registerLightbox, []);
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
