"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type RouteId = "home" | "thoughts" | "artifacts";

const ROUTE_MAP: Record<string, RouteId> = {
  "/": "home",
  "/thoughts": "thoughts",
  "/artifacts": "artifacts",
};

const ROUTE_HREFS: Record<RouteId, string> = {
  home: "/",
  thoughts: "/thoughts",
  artifacts: "/artifacts",
};

// Seed-based pseudo-random for consistent but varied offsets
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

const getOffset = (position: number) => {
  const direction = position % 2 === 0 ? -1 : 1;
  const baseX = direction * (30 + position * 15);

  return {
    x: baseX + (seededRandom(position * 1.1) - 0.5) * 20,
    y: (seededRandom(position * 2.2) - 0.5) * 20 + position * 5,
    rotate: direction * (3 + seededRandom(position * 3.3) * 5),
  };
};

interface ReceiptStackProps {
  homeReceipt: React.ReactNode;
  thoughtsReceipt: React.ReactNode;
  artifactsReceipt: React.ReactNode;
}

export function ReceiptStack({
  homeReceipt,
  thoughtsReceipt,
  artifactsReceipt,
}: ReceiptStackProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const isNavigatingRef = useRef(false);

  const getInitialOrder = (currentPath: string): [RouteId, RouteId, RouteId] => {
    const currentRoute = ROUTE_MAP[currentPath] || "home";
    const routes: RouteId[] = ["home", "thoughts", "artifacts"];
    const currentIndex = routes.indexOf(currentRoute);
    return [
      routes[currentIndex],
      routes[(currentIndex + 1) % 3],
      routes[(currentIndex + 2) % 3],
    ] as [RouteId, RouteId, RouteId];
  };

  const [order, setOrder] = useState<[RouteId, RouteId, RouteId]>(() =>
    getInitialOrder(pathname)
  );

  // Sync order when pathname changes (from navbar clicks, back/forward, etc.)
  useEffect(() => {
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }
    const currentRoute = ROUTE_MAP[pathname] || "home";
    if (order[0] !== currentRoute) {
      const routes: RouteId[] = ["home", "thoughts", "artifacts"];
      const currentIndex = routes.indexOf(currentRoute);
      setOrder([
        routes[currentIndex],
        routes[(currentIndex + 1) % 3],
        routes[(currentIndex + 2) % 3],
      ] as [RouteId, RouteId, RouteId]);
    }
  }, [pathname, order]);

  const receiptMap: Record<RouteId, React.ReactNode> = {
    home: homeReceipt,
    thoughts: thoughtsReceipt,
    artifacts: artifactsReceipt,
  };

  const showSpread = isHovered;

  const handleCardClick = (routeId: RouteId, position: number) => {
    if (position === 0) return; // Front card is not clickable

    // Update order to bring clicked card to front
    setOrder((prev) => {
      const next: RouteId[] = [
        routeId,
        ...prev.filter((id) => id !== routeId),
      ];
      return next as [RouteId, RouteId, RouteId];
    });

    // Navigate to the route
    isNavigatingRef.current = true;
    router.push(ROUTE_HREFS[routeId]);
  };

  return (
    <div className="py-20 flex flex-col items-center justify-center overflow-visible">
      <div
        className="relative w-full max-w-[320px] h-[480px] flex items-center justify-center mt-10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {order.map((routeId, position) => {
          const isFront = position === 0;
          const offset = getOffset(position);
          const breathe = showSpread && !isFront ? 1.5 : 1;

          return (
            <motion.div
              key={routeId}
              style={{ zIndex: 3 - position }}
              animate={{
                x: isFront ? 0 : offset.x * breathe,
                y: isFront ? -40 : offset.y * breathe,
                rotate: isFront ? 0 : offset.rotate * breathe,
                scale: 1 - position * 0.01,
              }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              onClick={() => handleCardClick(routeId, position)}
              className={cn(
                "absolute inset-0",
                isFront ? "cursor-default" : "cursor-pointer"
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
              <div
                className={cn(
                  "h-full w-full",
                  !isFront && "pointer-events-none"
                )}
                aria-hidden={!isFront}
              >
                {receiptMap[routeId]}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
