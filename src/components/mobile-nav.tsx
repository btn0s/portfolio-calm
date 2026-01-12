"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { href: "/", name: "home" },
  { href: "/thoughts", name: "thoughts" },
  { href: "/artifacts", name: "artifacts" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-10 inset-x-0 z-50 md:hidden pointer-events-none flex justify-center px-6">
      <motion.div 
        className="flex items-center bg-[#f2f2f2] dark:bg-[#111] border border-[#d8d8d8] dark:border-[#1d1d1d] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_56px_-12px_rgba(0,0,0,0.7)] rounded-full pointer-events-auto relative overflow-hidden"
      >
        {/* Fine-grained texture */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none paper-texture" />
        
        {/* Top edge highlight (rim light) */}
        <div className="absolute inset-x-5 top-0 h-[0.5px] bg-white opacity-40 dark:opacity-10 pointer-events-none" />
        
        <div className="flex items-center gap-0 relative z-10 px-1">
          {navItems.map(({ href, name }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative px-5 py-3.5 flex flex-col items-center justify-center min-w-[88px] group/item transition-all",
                  "active:scale-95"
                )}
              >
                {/* Tactical Recess (Active State) */}
                {isActive && (
                  <motion.div 
                    layoutId="te-active-well"
                    className="absolute inset-[5px] rounded-full bg-[#ebebeb] dark:bg-[#080808] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_0.5px_0_rgba(255,255,255,1)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_0.5px_0_rgba(255,255,255,0.05)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}

                {/* Button Surface Bevel (Inactive) */}
                {!isActive && (
                  <div className="absolute inset-[8px] rounded-full bg-[#f8f8f8] dark:bg-[#151515] opacity-0 group-hover/item:opacity-100 transition-opacity shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_white] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]" />
                )}

                <span className={cn(
                  "font-mono text-[8px] uppercase tracking-[0.3em] relative z-10 transition-colors duration-300 leading-none mb-1",
                  isActive ? "text-foreground font-bold" : "text-muted-foreground font-medium group-hover/item:text-foreground"
                )}>
                  {name}
                </span>

                {/* Precision Pinhole LED with Bevel */}
                <div className="relative z-10 flex items-center justify-center p-[1px] rounded-full bg-black/5 dark:bg-white/5 shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.5)]">
                  <div className="size-[4px] rounded-full bg-[#333] dark:bg-[#000] p-[0.5px] shadow-[0_0.5px_0_rgba(255,255,255,0.5)] dark:shadow-[0_0.5px_0_rgba(255,255,255,0.02)]">
                    <div className={cn(
                      "size-full rounded-full transition-all duration-700 ease-out",
                      isActive 
                        ? "bg-[#ff2d55] shadow-[0_0_5px_#ff2d55,0_0_2px_#ff2d55]" 
                        : "bg-[#888] dark:bg-[#222]"
                    )} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </nav>
  );
}
