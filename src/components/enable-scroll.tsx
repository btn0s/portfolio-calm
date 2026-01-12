"use client";

import { useEffect } from "react";

export function EnableScroll() {
  useEffect(() => {
    document.body.classList.add("scroll-enabled");
    return () => {
      document.body.classList.remove("scroll-enabled");
    };
  }, []);

  return null;
}
