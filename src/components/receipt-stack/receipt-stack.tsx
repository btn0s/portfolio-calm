"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, PanInfo, useDragControls } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { STACK_SPRING, getStackOffset } from "@/lib/motion/stack";

type RouteId = "home" | "thoughts" | "artifacts";

type StackRoute = {
  id: RouteId;
  href: string;
  match: (path: string) => boolean;
};

const STACK_ROUTES: StackRoute[] = [
  { id: "home", href: "/", match: (p) => p === "/" },
  {
    id: "thoughts",
    href: "/thoughts",
    match: (p) => p === "/thoughts" || p.startsWith("/thoughts/"),
  },
  {
    id: "artifacts",
    href: "/artifacts",
    match: (p) => p === "/artifacts" || p.startsWith("/artifacts/"),
  },
];

function classifyPath(pathname: string) {
  const route =
    STACK_ROUTES.find((r) => r.match(pathname))?.id ?? "home";
  const routeConfig = STACK_ROUTES.find((r) => r.id === route)!;
  const isSubpage = pathname !== routeConfig.href;
  const lockStackInteractions = isSubpage;
  const shouldHideStack = pathname === "/me";
  return { route, isSubpage, lockStackInteractions, shouldHideStack };
}

function hrefForRoute(routeId: RouteId) {
  return STACK_ROUTES.find((r) => r.id === routeId)!.href;
}

// Gesture tuning constants
const FLICK_VELOCITY_THRESHOLD = 150; // velocity needed to change page
const INTENT_THRESHOLD = 8; // pixels to travel before locking direction
const VERTICAL_CONE_DEGREES = 15; // degrees from pure vertical that counts as "vertical"
const VERTICAL_CONE_RATIO =
  1 / Math.tan((VERTICAL_CONE_DEGREES * Math.PI) / 180);
const HORIZONTAL_VELOCITY_RATIO = 0.5; // vx must be > vy * this for flick
const DRAG_UNLOCK_RESET_DELAY = 50; // ms to wait before resetting drag state
const DRAG_ELASTICITY = 1; // drag resistance (0 = stiff, 1 = loose)

// Animation constants
const HOVER_SPREAD_MULTIPLIER = 1.5;

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
  const [isCollapsedHovered, setIsCollapsedHovered] = useState(false);

  const { route, isSubpage, lockStackInteractions, shouldHideStack } =
    classifyPath(pathname);

  // "Intent Gatekeeper" - only unlock drag after confirming horizontal intent
  const [dragUnlocked, setDragUnlocked] = useState(false);
  const [verticalLocked, setVerticalLocked] = useState(false);
  const gestureStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragControls = useDragControls();
  const dragConstraintsRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    gestureStartRef.current = { x: e.clientX, y: e.clientY };
    setDragUnlocked(false);
    setVerticalLocked(false);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!gestureStartRef.current) {
        return;
      }
      if (dragUnlocked) {
        // Already unlocked, Framer Motion handles it
        return;
      }

      const dx = Math.abs(e.clientX - gestureStartRef.current.x);
      const dy = Math.abs(e.clientY - gestureStartRef.current.y);

      // Only decide after moving past the threshold
      if (dx > INTENT_THRESHOLD || dy > INTENT_THRESHOLD) {
        // Vertical cone is ~10deg from pure vertical
        const isNearlyPureVertical = dy > dx * VERTICAL_CONE_RATIO;

        if (isNearlyPureVertical) {
          // Vertical intent - still allow drag but lock to vertical only
          setVerticalLocked(true);
          setDragUnlocked(true);
          dragControls.start(e, { snapToCursor: false });
        } else {
          // Horizontal intent confirmed - start drag with the current event
          setDragUnlocked(true);
          // Start drag with the CURRENT move event (not the original down event)
          dragControls.start(e, { snapToCursor: false });
        }
      }
    },
    [dragUnlocked, dragControls]
  );

  const handlePointerUp = useCallback(() => {
    gestureStartRef.current = null;
    // Small delay to let Framer Motion's dragEnd fire first
    setTimeout(() => {
      setDragUnlocked(false);
      setVerticalLocked(false);
    }, DRAG_UNLOCK_RESET_DELAY);
  }, []);

  // Build order from current route (derived from pathname)
  const getOrderFromRoute = (
    currentRoute: RouteId
  ): [RouteId, RouteId, RouteId] => {
    const routes: RouteId[] = ["home", "thoughts", "artifacts"];
    const currentIndex = routes.indexOf(currentRoute);
    return [
      routes[currentIndex],
      routes[(currentIndex + 1) % 3],
      routes[(currentIndex + 2) % 3],
    ] as [RouteId, RouteId, RouteId];
  };

  const order = getOrderFromRoute(route);

  const receiptMap: Record<RouteId, React.ReactNode> = {
    home: homeReceipt,
    thoughts: thoughtsReceipt,
    artifacts: artifactsReceipt,
  };

  const showSpread = isHovered;

  const rotateForward = useCallback(() => {
    const nextRoute = order[1];
    router.push(hrefForRoute(nextRoute));
  }, [order, router]);

  const rotateBackward = useCallback(() => {
    const prevRoute = order[2];
    router.push(hrefForRoute(prevRoute));
  }, [order, router]);

  // Global arrow key handler for route switching
  useEffect(() => {
    if (lockStackInteractions) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an editable element
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        rotateForward();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        rotateBackward();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [lockStackInteractions, rotateForward, rotateBackward]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const velocity = Math.sqrt(info.velocity.x ** 2 + info.velocity.y ** 2);
    const isHorizontalEnough =
      Math.abs(info.velocity.x) >
      Math.abs(info.velocity.y) * HORIZONTAL_VELOCITY_RATIO;

    if (velocity > FLICK_VELOCITY_THRESHOLD && isHorizontalEnough) {
      rotateForward();
    }
    // Otherwise Framer Motion snaps back automatically
  };

  const bringToFront = useCallback(
    (routeId: RouteId) => {
      router.push(hrefForRoute(routeId));
    },
    [router]
  );

  const handleCardClick = (routeId: RouteId, position: number) => {
    // Disable card clicks when interactions are locked
    if (lockStackInteractions) return;
    
    if (position === 0) return; // Front card is not clickable

    bringToFront(routeId);
  };


  if (shouldHideStack) {
    return null;
  }

  const handleOverlayClick = () => {
    if (isSubpage) {
      router.push(hrefForRoute(order[0]));
    }
  };

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (isSubpage && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      router.push(hrefForRoute(order[0]));
    }
  };

  return (
    <>
      {/* Fixed drag constraints area */}
      <div
        ref={dragConstraintsRef}
        className="fixed top-20 left-6 right-6 bottom-6 pointer-events-none"
      />
      <motion.div
        className={cn(
          "flex flex-col items-center justify-center isolate pb-12",
          isSubpage ? "fixed bottom-0 left-0 right-0 z-10" : "relative z-0"
        )}
        style={{ clipPath: "inset(-100vh -100vw 0 -100vw)", contain: "layout" }}
        animate={{
          y: isSubpage ? (isCollapsedHovered ? "85%" : "90%") : 0,
        }}
        transition={STACK_SPRING}
        onMouseEnter={() => isSubpage && setIsCollapsedHovered(true)}
        onMouseLeave={() => isSubpage && setIsCollapsedHovered(false)}
      >
        <div
          className="relative w-full max-w-xl flex items-center justify-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Stack-area overlay for subpages - intercepts clicks to navigate back */}
          {lockStackInteractions && (
            <button
              type="button"
              className="absolute inset-0 z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 focus:ring-offset-transparent rounded-sm"
              onClick={handleOverlayClick}
              onKeyDown={handleOverlayKeyDown}
              aria-label={`Go to ${order[0]} page`}
            />
          )}
          {order.map((routeId, position) => {
            const isFront = position === 0;
            const offset = getStackOffset(position);
            const breathe =
              showSpread && !isFront ? HOVER_SPREAD_MULTIPLIER : 1;

            return (
              <motion.div
                key={routeId}
                layout="position"
                style={{
                  zIndex: 3 - position,
                  // Start with none - we manually handle scroll pass-through
                  touchAction: isFront && !lockStackInteractions ? "none" : undefined,
                }}
                drag={isFront && !lockStackInteractions ? (verticalLocked ? "y" : true) : false}
                dragControls={isFront && !lockStackInteractions ? dragControls : undefined}
                dragListener={false} // We manually start drag via dragControls
                dragSnapToOrigin={!verticalLocked} // Don't snap in vertical mode
                dragElastic={DRAG_ELASTICITY}
                dragConstraints={
                  isFront && verticalLocked && !lockStackInteractions ? dragConstraintsRef : undefined
                }
                onPointerDown={isFront && !lockStackInteractions ? handlePointerDown : undefined}
                onPointerMove={isFront && !lockStackInteractions ? handlePointerMove : undefined}
                onPointerUp={isFront && !lockStackInteractions ? handlePointerUp : undefined}
                onPointerCancel={isFront && !lockStackInteractions ? handlePointerUp : undefined}
                onDragEnd={isFront && !lockStackInteractions ? handleDragEnd : undefined}
                animate={
                  isFront
                    ? { x: 0, y: 0, rotate: 0, scale: 1 }
                    : {
                        x: offset.x * breathe,
                        y: offset.y * breathe,
                        rotate: offset.rotate * breathe,
                        scale: 1 - position * 0.01,
                      }
                }
                transition={STACK_SPRING}
                onClick={() => handleCardClick(routeId, position)}
                tabIndex={isFront && !lockStackInteractions ? 0 : -1}
                aria-label={
                  isFront && !lockStackInteractions
                    ? `Receipt stack navigation. Use Left and Right arrow keys to switch routes.`
                    : undefined
                }
                className={cn(
                  "w-full",
                  isFront
                    ? lockStackInteractions
                      ? "relative cursor-default"
                      : "relative cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 focus:ring-offset-transparent rounded-sm"
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
      </motion.div>
    </>
  );
}
