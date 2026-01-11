"use client";

import { useRef, useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { Barcode } from "@/components/barcode";
import { PixelPattern } from "@/components/pixel-pattern";
import { cn } from "@/lib/utils";
import { STACK_SPRING, getStackOffset } from "@/lib/motion/stack";

const CARDS = [
  {
    id: 1,
    title: "BT NORRIS",
    role: "DESIGN ENGINEER // 2026",
    location: "PHOENIX, AZ",
    summary:
      "Product designer, coder, tinkerer. Specialized in building interfaces that bridge the gap between design and engineering.",
    total: "1.0",
  },
  {
    id: 2,
    title: "THINK HUMAN",
    role: "PRINCIPAL DESIGN ENGINEER",
    location: "REMOTE // NYC",
    summary:
      "Leading design systems and front-end architecture for human-centric tools. Focused on high-fidelity prototyping and React.",
    total: "2.5",
  },
  {
    id: 3,
    title: "BACKBONE",
    role: "LABS PROGRAM LEAD",
    location: "LOS ANGELES, CA",
    summary:
      "R&D Lead for next-gen gaming hardware interfaces. Exploring the intersection of software and physical controllers.",
    total: "4.0",
  },
  {
    id: 4,
    title: "AMEX",
    role: "SWE II // PLATFORM",
    location: "PHOENIX, AZ",
    summary:
      "Infrastructure and frontend for global financial services. Built scalable design systems for enterprise-level applications.",
    total: "12.0",
  },
];


export default function CardStackPage() {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const dragActiveRef = useRef(false);
  const dragJustShuffledRef = useRef(false);

  const shuffle = () => {
    setIndex((prev) => (prev + 1) % CARDS.length);
  };

  const handleDragEnd = (_: never, info: PanInfo) => {
    setIsDragging(false);
    
    const shouldShuffle = 
      Math.abs(info.velocity.x) > 300 || 
      Math.abs(info.velocity.y) > 300 ||
      Math.abs(info.offset.x) > 80 ||
      Math.abs(info.offset.y) > 80;
    
    dragActiveRef.current = false;
    dragJustShuffledRef.current = shouldShuffle;

    if (shouldShuffle) shuffle();
  };
  
  const showSpread = isHovered && !isDragging;

  return (
    <main className="py-20 flex flex-col items-center justify-center overflow-visible">
      <div
        className="relative w-full max-w-[320px] h-[480px] flex items-center justify-center mt-10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {CARDS.map((card, i) => {
          const position = (i - index + CARDS.length) % CARDS.length;
          const isFront = position === 0;
          const offset = getStackOffset(position);
          const breathe = showSpread && !isFront ? 1.5 : 1;

          return (
            <motion.div
              key={card.id}
              style={{ zIndex: CARDS.length - position }}
              animate={{
                x: isFront ? 0 : offset.x * breathe,
                y: isFront ? -40 : offset.y * breathe,
                rotate: isFront ? 0 : offset.rotate * breathe,
                scale: 1 - position * 0.01,
              }}
              transition={STACK_SPRING}
              drag={isFront}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.6}
              onDragStart={() => {
                dragActiveRef.current = true;
                dragJustShuffledRef.current = false;
                setIsDragging(true);
              }}
              onDragEnd={handleDragEnd}
              onClick={
                isFront
                  ? () => {
                      if (dragActiveRef.current) return;
                      if (dragJustShuffledRef.current) {
                        dragJustShuffledRef.current = false;
                        return;
                      }

                      shuffle();
                    }
                  : undefined
              }
              whileHover={isFront ? { y: -55 } : undefined}
              whileTap={isFront ? { scale: 0.98 } : undefined}
              className={cn(
                "absolute inset-0",
                isFront ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
              )}
            >
              <div
                className={cn(
                  "absolute inset-2 bg-black/20 -z-10 pointer-events-none",
                  isFront
                    ? "blur-2xl translate-y-10 scale-95 opacity-50"
                    : "blur-md translate-y-1 scale-[0.98] opacity-30"
                )}
                aria-hidden="true"
              />
              <ReceiptCard card={card} />
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 flex flex-col items-center gap-2"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-40">
          Click or drag to shuffle
        </p>
        <div className="flex gap-1">
          {CARDS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1 h-1 rounded-full transition-colors duration-300",
                i === index ? "bg-black" : "bg-black/10"
              )}
            />
          ))}
        </div>
      </motion.div>
    </main>
  );
}

function ReceiptCard({ card }: { card: (typeof CARDS)[0] }) {
  const today = new Date()
    .toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    .toUpperCase();

  return (
    <div className="bg-(--paper) text-(--paper-foreground) p-6 pt-10 pb-10 receipt-edge-top receipt-edge-bottom relative overflow-hidden h-full flex flex-col font-mono text-sm border border-black/5">
      <div className="absolute inset-0 paper-texture" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex flex-col items-center text-center mb-6 gap-1">
          <h1 className="text-xl font-bold uppercase tracking-widest leading-none">
            {card.title}
          </h1>
          <p className="text-[9px] leading-none opacity-70 mt-1">{card.role}</p>
          <p className="text-[9px] leading-none opacity-70">{card.location}</p>

          <div className="mt-4 border-y border-(--paper-foreground) border-dashed py-2 w-full flex justify-between px-2 text-[9px]">
            <span>{today}</span>
            <span>12:00 PM</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <section>
            <h2 className="border-b border-(--paper-foreground) border-dashed pb-1 mb-3 uppercase font-bold text-[10px] tracking-tighter">
              Summary
            </h2>
            <p className="text-[10px] leading-relaxed opacity-90">
              {card.summary}
            </p>
          </section>

          <section className="mt-auto">
            <div className="flex justify-between items-end">
              <div className="w-16 h-16 opacity-20 mix-blend-multiply">
                <PixelPattern size={20} />
              </div>
              <div className="text-right">
                <p className="text-[8px] uppercase opacity-50">Total_Exp</p>
                <p className="text-2xl font-bold tracking-tighter">
                  ${card.total}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 pt-6 border-t border-(--paper-foreground) border-dashed flex flex-col items-center gap-3">
          <Barcode className="opacity-60 h-8 mix-blend-multiply scale-x-90" />
          <p className="text-[8px] opacity-30 tracking-[0.3em]">
            REF_{card.id}009421
          </p>
        </div>
      </div>
    </div>
  );
}
