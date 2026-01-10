"use client";

import { useEffect, useRef, useState } from "react";
import { motion, PanInfo, useAnimation } from "framer-motion";
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

// Gesture tuning constants
const GESTURE_DECISION_THRESHOLD = 10; // pixels before deciding drag vs scroll
const VERTICAL_SCROLL_RATIO = 2; // dy must be > dx * this to count as scroll
const FLICK_VELOCITY_THRESHOLD = 300; // velocity needed to change page
const SNAP_BACK_DELAY = 500; // ms before card snaps back to rest
const REST_POSITION = { x: 0, y: -40 }; // default card position

// Animation constants
const SPRING_CONFIG = { stiffness: 200, damping: 25 };
const HOVER_SPREAD_MULTIPLIER = 1.5;

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

  // Gesture state
  const gestureMode = useRef<"undecided" | "drag" | "scroll">("undecided");
  const gestureStartPosition = useRef({ x: 0, y: 0 });
  const controls = useAnimation();

  const getInitialOrder = (
    currentPath: string
  ): [RouteId, RouteId, RouteId] => {
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
  const [frontPosition, setFrontPosition] = useState(REST_POSITION);

  // Sync controls with frontPosition
  useEffect(() => {
    controls.start({
      x: frontPosition.x,
      y: frontPosition.y,
      rotate: 0,
      scale: 1,
    });
  }, [frontPosition, controls]);

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
      setFrontPosition(REST_POSITION);
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

  const handlePanStart = () => {
    gestureMode.current = "undecided";
    gestureStartPosition.current = { ...frontPosition };
  };

  const handlePan = (_: unknown, info: PanInfo) => {
    const { offset } = info;
    const dx = Math.abs(offset.x);
    const dy = Math.abs(offset.y);

    // Decide gesture mode if still undecided
    if (
      gestureMode.current === "undecided" &&
      (dx > GESTURE_DECISION_THRESHOLD || dy > GESTURE_DECISION_THRESHOLD)
    ) {
      // Only pure vertical = scroll, otherwise drag
      if (dy > dx * VERTICAL_SCROLL_RATIO) {
        gestureMode.current = "scroll";
      } else {
        gestureMode.current = "drag";
      }
    }

    if (gestureMode.current === "drag") {
      // Update card position
      controls.set({
        x: gestureStartPosition.current.x + offset.x,
        y: gestureStartPosition.current.y + offset.y,
      });
    }
    // scroll mode: do nothing, let native scroll handle via touchAction
  };

  const handlePanEnd = (_: unknown, info: PanInfo) => {
    if (gestureMode.current === "drag") {
      const velocity = Math.sqrt(info.velocity.x ** 2 + info.velocity.y ** 2);

      if (velocity > FLICK_VELOCITY_THRESHOLD) {
        // Reset position for next front card
        setFrontPosition(REST_POSITION);

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
        const newPos = {
          x: gestureStartPosition.current.x + info.offset.x,
          y: gestureStartPosition.current.y + info.offset.y,
        };
        setFrontPosition(newPos);

        // Snap back to center after delay
        setTimeout(() => {
          setFrontPosition(REST_POSITION);
        }, SNAP_BACK_DELAY);
      }
    }

    gestureMode.current = "undecided";
  };

  const handleCardClick = (routeId: RouteId, position: number) => {
    if (position === 0) return; // Front card is not clickable

    // Reset position for new front card
    setFrontPosition(REST_POSITION);

    // Update order to bring clicked card to front
    setOrder((prev) => {
      const next: RouteId[] = [routeId, ...prev.filter((id) => id !== routeId)];
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
          const breathe = showSpread && !isFront ? HOVER_SPREAD_MULTIPLIER : 1;

          return (
            <motion.div
              key={routeId}
              style={{
                zIndex: 3 - position,
                willChange: "transform",
                touchAction: isFront ? "pan-y" : undefined,
              }}
              animate={isFront ? controls : undefined}
              initial={false}
              onPanStart={isFront ? handlePanStart : undefined}
              onPan={isFront ? handlePan : undefined}
              onPanEnd={isFront ? handlePanEnd : undefined}
              {...(!isFront && {
                animate: {
                  x: offset.x * breathe,
                  y: offset.y * breathe,
                  rotate: offset.rotate * breathe,
                  scale: 1 - position * 0.01,
                },
              })}
              transition={{ type: "spring", ...SPRING_CONFIG }}
              onClick={() => handleCardClick(routeId, position)}
              className={cn(
                "w-full",
                isFront
                  ? "relative cursor-grab active:cursor-grabbing"
                  : "absolute top-0 left-0 cursor-pointer"
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
