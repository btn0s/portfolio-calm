"use client";

import { useEffect, useRef, useState } from "react";
import { motion, PanInfo } from "framer-motion";
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
  const [frontPosition, setFrontPosition] = useState({ x: 0, y: -40 });

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
      setFrontPosition({ x: 0, y: -40 });
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

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const velocityThreshold = 300;
    const velocity = Math.sqrt(info.velocity.x ** 2 + info.velocity.y ** 2);

    if (velocity > velocityThreshold) {
      // Reset position for next front card
      setFrontPosition({ x: 0, y: -40 });

      // Send front card to back, bring next card forward
      setOrder((prev) => {
        const [front, ...rest] = prev;
        const next = [...rest, front] as [RouteId, RouteId, RouteId];
        return next;
      });

      // Navigate to the new front card's route
      const nextRoute = order[1];
      isNavigatingRef.current = true;
      router.push(ROUTE_HREFS[nextRoute]);
    } else {
      // Stay where dropped temporarily
      setFrontPosition({
        x: frontPosition.x + info.offset.x,
        y: frontPosition.y + info.offset.y,
      });

      // Snap back to center after 500ms
      setTimeout(() => {
        setFrontPosition({ x: 0, y: -40 });
      }, 500);
    }
  };

  const handleCardClick = (routeId: RouteId, position: number) => {
    if (position === 0) return; // Front card is not clickable

    // Reset position for new front card
    setFrontPosition({ x: 0, y: -40 });

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
    <div className="py-10 flex flex-col items-center justify-center overflow-visible">
      <div
        className="relative w-full max-w-xl flex items-center justify-center mt-4"
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
              style={{
                zIndex: 3 - position,
                willChange: "transform",
                touchAction: isFront ? "none" : undefined,
              }}
              drag={isFront}
              dragMomentum={false}
              onDragEnd={isFront ? handleDragEnd : undefined}
              animate={{
                x: isFront ? frontPosition.x : offset.x * breathe,
                y: isFront ? frontPosition.y : offset.y * breathe,
                rotate: isFront ? 0 : offset.rotate * breathe,
                scale: 1 - position * 0.01,
              }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              onClick={() => handleCardClick(routeId, position)}
              className={cn(
                "absolute top-0 left-0 w-full",
                isFront ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
              )}
            >
              {/* Shadow element behind content */}
              <div
                className={cn(
                  "absolute inset-4 rounded-sm bg-black/0",
                  isFront
                    ? "shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
                    : "shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
                )}
                style={{ transform: "translateZ(0)" }}
              />
              <div
                className={cn(
                  "relative h-full w-full",
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
