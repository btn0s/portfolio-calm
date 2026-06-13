"use client";

import { useEffect, useState } from "react";

export function SafariBar() {
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isSafariBrowser =
      /safari/.test(userAgent) && !/chrome/.test(userAgent);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time UA sniff on mount; navigator is not available during SSR
    setIsSafari(isSafariBrowser);
  }, []);

  if (!isSafari) return null;

  return (
    <div className="isolate fixed inset-x-0 h-2 bg-[#e6e6e6] dark:bg-[#1a1a1a] border-t z-9999 bottom-0" />
  );
}
