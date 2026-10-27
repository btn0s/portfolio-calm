"use client";

import { useEffect, useRef } from "react";

/**
 * The post body: a sheet of paper pulled out of the dark dossier. While the sheet is under the
 * fixed nav, <html data-paper> flips the chrome to dark-on-paper so it stays legible.
 */
export function PaperSheet({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    let raf = 0;
    const check = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      if (r.top < 40 && r.bottom > 40) root.dataset.paper = "";
      else delete root.dataset.paper;
    };
    const onScroll = () => (raf ||= requestAnimationFrame(check));
    check();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      delete root.dataset.paper;
    };
  }, []);
  return (
    <div ref={ref} className="paper-sheet">
      {children}
    </div>
  );
}
