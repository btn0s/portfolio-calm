"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, PanInfo, useDragControls, LayoutGroup } from "framer-motion";
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
  const [isFrontCardHovered, setIsFrontCardHovered] = useState(false);
  // Only state needed for rendering: touchAction needs to update when intent is confirmed
  const [touchAction, setTouchAction] = useState<"pan-y" | "none">("pan-y");
  const [hasHover, setHasHover] = useState(false);
  const frontCardRef = useRef<HTMLDivElement>(null);

  const { route, isSubpage, lockStackInteractions, shouldHideStack } =
    classifyPath(pathname);

  // Detect if device supports hover (not touch-only)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover)");
    setHasHover(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setHasHover(e.matches);
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Lock scroll during horizontal drag
  useEffect(() => {
    if (touchAction === "none" && typeof window !== "undefined") {
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      if (isMobile) {
        document.body.classList.add("dragging-horizontal");
        return () => {
          document.body.classList.remove("dragging-horizontal");
        };
      }
    }
  }, [touchAction]);

  // "Intent Gatekeeper" - only unlock drag after confirming horizontal intent
  // Using refs instead of state to avoid React re-renders in the hot path
  const dragUnlockedRef = useRef(false);
  const scrollCommittedRef = useRef(false);
  const gestureStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragControls = useDragControls();
  const dragConstraintsRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Check if the click target is an interactive element (link, button, input, etc.)
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('a[href], button, input, textarea, select, [role="link"], [role="button"], [contenteditable="true"]');
    
    // If clicking on an interactive element, don't interfere with the click
    if (isInteractive) {
      return;
    }
    
    // Don't prevent default here - we want interactive elements to work if it's just a click
    gestureStartRef.current = { x: e.clientX, y: e.clientY };
    dragUnlockedRef.current = false;
    scrollCommittedRef.current = false;
    // Capture pointer to get all events even over interactive elements
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!gestureStartRef.current) {
        return;
      }
      if (dragUnlockedRef.current || scrollCommittedRef.current) {
        // Already committed to drag or scroll, let browser/Framer handle it
        return;
      }

      // Check if we started on an interactive element - if so, don't interfere
      const target = e.target as HTMLElement;
      const isInteractive = target.closest('a[href], button, input, textarea, select, [role="link"], [role="button"], [contenteditable="true"]');
      if (isInteractive) {
        return;
      }

      const dx = Math.abs(e.clientX - gestureStartRef.current.x);
      const dy = Math.abs(e.clientY - gestureStartRef.current.y);

      // Only decide after moving past the threshold
      if (dx > INTENT_THRESHOLD || dy > INTENT_THRESHOLD) {
        // Vertical cone is ~10deg from pure vertical
        const isNearlyPureVertical = dy > dx * VERTICAL_CONE_RATIO;

        if (isNearlyPureVertical) {
          // Vertical intent - commit to scroll, do nothing (let browser handle it)
          scrollCommittedRef.current = true;
        } else {
          // Horizontal intent confirmed - start drag with the current event
          dragUnlockedRef.current = true;
          setTouchAction("none"); // Block native scrolling once drag starts
          // Start drag with the CURRENT move event (not the original down event)
          dragControls.start(e, { snapToCursor: false });
        }
      }
    },
    [dragControls]
  );

  const handlePointerUp = useCallback((e?: React.PointerEvent) => {
    // Release pointer capture
    if (e && e.currentTarget instanceof HTMLElement) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    gestureStartRef.current = null;
    // Small delay to let Framer Motion's dragEnd fire first
    setTimeout(() => {
      dragUnlockedRef.current = false;
      scrollCommittedRef.current = false;
      setTouchAction("pan-y"); // Re-enable native vertical scroll
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
    // Reset scroll to top when rotating routes
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    router.push(hrefForRoute(nextRoute));
  }, [order, router]);

  const rotateBackward = useCallback(() => {
    const prevRoute = order[2];
    // Reset scroll to top when rotating routes
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
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

  // Render a single card with shared layout
  const renderCard = (routeId: RouteId, position: number, isInBackStage: boolean) => {
    const isFront = position === 0;
    const offset = getStackOffset(position);
    const breathe = showSpread && !isFront ? HOVER_SPREAD_MULTIPLIER : 1;

    // Shadow values: front card gets stronger shadow, back cards get lighter
    const shadowStyle = isFront
      ? { boxShadow: "0 12px 24px rgba(0,0,0,0.2)" }
      : { boxShadow: "0 4px 8px rgba(0,0,0,0.1)" };

    return (
      <motion.div
        key={routeId}
        layoutId={routeId}
        style={{
          zIndex: 3 - position,
          position: isInBackStage ? "absolute" : "relative",
          top: isInBackStage ? 0 : undefined,
          left: isInBackStage ? 0 : undefined,
          right: isInBackStage ? 0 : undefined,
          willChange: "transform",
          touchAction: isFront && !lockStackInteractions ? touchAction : undefined,
          ...shadowStyle,
        }}
        drag={isFront && !lockStackInteractions ? true : false}
        dragControls={isFront && !lockStackInteractions ? dragControls : undefined}
        dragListener={false}
        dragSnapToOrigin={true}
        dragElastic={DRAG_ELASTICITY}
        onPointerDown={isFront && !lockStackInteractions ? handlePointerDown : undefined}
        onPointerMove={isFront && !lockStackInteractions ? handlePointerMove : undefined}
          onPointerUp={isFront && !lockStackInteractions ? (e) => handlePointerUp(e) : undefined}
          onPointerCancel={isFront && !lockStackInteractions ? (e) => handlePointerUp(e) : undefined}
        onDragEnd={isFront && !lockStackInteractions ? handleDragEnd : undefined}
        animate={
          isFront
            ? isSubpage
              ? { x: 0, rotate: 0, scale: 1 }
              : { x: 0, y: 0, rotate: 0, scale: 1 }
            : isSubpage
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
          isFront
            ? lockStackInteractions
              ? "cursor-default"
              : "cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 focus:ring-offset-transparent rounded-sm select-none"
            : "cursor-pointer",
          "w-full"
        )}
      >
        {/* Paint layer: contains clip-path and texture, not animated */}
        <div
          className={cn(
            "relative h-full w-full",
            !isFront && isInBackStage && "pointer-events-none",
            isFront && !lockStackInteractions && "select-none"
          )}
          style={isFront && !lockStackInteractions ? { userSelect: "none" } : undefined}
          aria-hidden={!isFront}
        >
          {receiptMap[routeId]}
        </div>
      </motion.div>
    );
  };

  return (
    <LayoutGroup>
      {/* Fixed drag constraints area */}
      <div
        ref={dragConstraintsRef}
        className="fixed top-20 left-6 right-6 bottom-6 pointer-events-none"
      />
      
      {/* BackStage: Fixed container for back cards */}
      <div
        className={cn(
          "fixed z-10",
          isSubpage
            ? "bottom-0 left-0 right-0 px-4 w-full md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-xl md:px-0"
            : "top-20 left-0 right-0 w-full max-w-xl mx-auto"
        )}
      >
        <motion.div
          className="flex flex-col items-center justify-center isolate pb-12 min-h-[600px] md:min-h-[800px]"
          animate={{
            y: isSubpage ? "100%" : 0,
          }}
          transition={STACK_SPRING}
        >
          <div
            className="relative w-full max-w-xl flex items-center justify-center"
            style={{ minHeight: "inherit" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Back slots - render cards that are NOT front */}
            {order.map((routeId, position) => {
              if (position === 0) return null; // Front card goes in FrontSlot
              return (
                <div key={`back-slot-${routeId}`} className="absolute inset-0">
                  {renderCard(routeId, position, true)}
                </div>
              );
            })}
            
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
          </div>
        </motion.div>
      </div>

      {/* FrontSlot: In-flow container for front card - this moves with page scroll */}
      <motion.div
        ref={frontCardRef}
        layout
        className={cn(
          "z-20 w-full max-w-xl mx-auto",
          isSubpage 
            ? "fixed left-0 right-0 px-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:px-0" 
            : "relative -mt-8"
        )}
        style={
          !isSubpage
            ? {
                top: "auto",
              }
            : undefined
        }
        animate={
          isSubpage
            ? {
                top: "calc(100vh - 1.5rem)",
                y: hasHover && isFrontCardHovered ? "-0.5rem" : 0,
              }
            : {
                y: 0,
              }
        }
        transition={STACK_SPRING}
      >
        <div className="flex flex-col items-center justify-center pb-12 min-h-[600px] md:min-h-[800px]">
          <div className="relative w-full max-w-xl flex items-center justify-center">
            {/* Front card - only render if position is 0 */}
            {order.map((routeId, position) => {
              if (position !== 0) return null;
              return (
                <div key={`front-slot-${routeId}`} className="w-full">
                  {renderCard(routeId, position, false)}
                </div>
              );
            })}
            
            {/* Front card overlay for subpages - intercepts clicks to navigate back */}
            {isSubpage && (
              <button
                type="button"
                className="absolute inset-0 z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 focus:ring-offset-transparent rounded-sm"
                onClick={handleOverlayClick}
                onKeyDown={handleOverlayKeyDown}
                onMouseEnter={() => hasHover && setIsFrontCardHovered(true)}
                onMouseLeave={() => hasHover && setIsFrontCardHovered(false)}
                aria-label={`Go to ${order[0]} page`}
              />
            )}
          </div>
        </div>
      </motion.div>
    </LayoutGroup>
  );
}
