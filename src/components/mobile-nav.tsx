"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", name: "home" },
  { href: "/thoughts", name: "thoughts" },
  { href: "/artifacts", name: "artifacts" },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [direction, setDirection] = useState(0);

  const getCurrentIndex = () => {
    // Default to home if no match or on subpages
    const index = navItems.findIndex(
      (item) =>
        item.href === pathname ||
        (item.href !== "/" && pathname.startsWith(item.href))
    );
    return index === -1 ? 0 : index;
  };

  const currentIndex = getCurrentIndex();
  const currentItem = navItems[currentIndex];

  const handlePrev = () => {
    setDirection(-1);
    const prevIndex = (currentIndex - 1 + navItems.length) % navItems.length;
    router.push(navItems[prevIndex].href);
  };

  const handleNext = () => {
    setDirection(1);
    const nextIndex = (currentIndex + 1) % navItems.length;
    router.push(navItems[nextIndex].href);
  };

  return (
    <nav className="fixed bottom-6 inset-x-0 z-50 md:hidden pointer-events-none flex justify-center px-4">
      <motion.div className="flex gap-1.5 items-center justify-between w-full max-w-[320px] bg-[#e6e6e6] dark:bg-[#1a1a1a] border border-[#d4d4d4] dark:border-[#262626] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] rounded-2xl pointer-events-auto relative p-1.5 h-[68px]">
        {/* Fine Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none paper-texture rounded-2xl" />

        {/* Screen Display Area */}
        <div className="flex-1 h-full flex items-center">
          <div className="w-full h-full bg-[#9ea792] dark:bg-[#202020] rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.05)] flex items-center px-3 relative overflow-hidden border border-black/10 dark:border-black/50 group/screen">
            {/* Dot Matrix Texture */}
            <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.2] bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:2px_2px] pointer-events-none" />
            
            {/* Screen inner glow/vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_12px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_12px_rgba(0,0,0,0.5)] pointer-events-none" />

            <div className="flex flex-col relative z-10 w-full overflow-hidden">
              <span className="text-[6px] uppercase tracking-[0.2em] text-black/50 dark:text-white/40 font-mono leading-none mb-0.5">
                Current View
              </span>
              <div className="relative h-4 w-full">
                <AnimatePresence mode="popLayout" custom={direction}>
                  <motion.span
                    key={currentItem.name}
                    custom={direction}
                    initial={{ y: direction * 20, opacity: 0, filter: "blur(4px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: direction * -20, opacity: 0, filter: "blur(4px)" }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      opacity: { duration: 0.1 },
                    }}
                    className="text-xs font-bold uppercase tracking-[0.15em] text-black/80 dark:text-white/90 font-mono leading-none truncate absolute inset-0 flex items-center"
                  >
                    {currentItem.name}
                  </motion.span>
                </AnimatePresence>
                
                {/* Glitch Overlay effect on change */}
                <AnimatePresence>
                  <motion.div
                    key={`${currentItem.name}-glitch`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.5, 0, 0.3, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, times: [0, 0.2, 0.4, 0.6, 1] }}
                    className="absolute inset-0 bg-white/20 dark:bg-white/10 mix-blend-overlay pointer-events-none"
                  />
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Physical Button Group */}
        <div className="flex gap-1.5 bg-[#d6d6d6] dark:bg-[#111] p-1 rounded-xl shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)] h-full">
          {/* Prev Button */}
          <button
            onClick={handlePrev}
            className="group relative w-16 h-full flex items-center justify-center rounded-lg active:scale-95 transition-transform outline-none"
            aria-label="Previous page"
          >
            <div className="absolute inset-0 bg-[#f0f0f0] dark:bg-[#222] rounded-lg shadow-[0_2px_0_#bbb,0_3px_3px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_2px_0_#000,0_3px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] group-active:translate-y-[2px] group-active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] transition-all" />
            <ChevronLeft className="w-5 h-5 text-foreground/70 relative z-10 group-active:opacity-80" />
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="group relative w-16 h-full flex items-center justify-center rounded-lg active:scale-95 transition-transform outline-none"
            aria-label="Next page"
          >
            <div className="absolute inset-0 bg-[#f0f0f0] dark:bg-[#222] rounded-lg shadow-[0_2px_0_#bbb,0_3px_3px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_2px_0_#000,0_3px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] group-active:translate-y-[2px] group-active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] transition-all" />
            <ChevronRight className="w-5 h-5 text-foreground/70 relative z-10 group-active:opacity-80" />
          </button>
        </div>
      </motion.div>
    </nav>
  );
}
