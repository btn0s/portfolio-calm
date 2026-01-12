"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, PanInfo, useDragControls, LayoutGroup } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { STACK_SPRING, getStackOffset } from "@/lib/motion/stack";
import { useSoundSettings } from "@/contexts/sound-context";

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

const STACK_CONFIG = {
  // Gesture tuning
  gesture: {
    flickVelocityThreshold: 50,
    intentThresholdPx: 8,
    verticalConeDegrees: 15,
    horizontalVelocityRatio: 0.5,
    dragUnlockResetDelayMs: 50,
    dragElasticity: 1,
  },

  // Animation values
  animation: {
    hoverSpreadMultiplier: 1.5,
    scaleReductionPerPosition: 0.01,
    collapsedY: "95%",
    collapsedHoverY: "90%",
  },

  // Layout breakpoints and dimensions
  layout: {
    mobileBreakpoint: 768,
    minHeightMobile: 600,
    minHeightDesktop: 800,
  },

  // Visual styling
  style: {
    frontCardShadow: "0 12px 24px rgba(0,0,0,0.2)",
    backCardShadow: "0 4px 8px rgba(0,0,0,0.1)",
    baseZIndex: 3,
  },
} as const;

// Derived constants
const VERTICAL_CONE_RATIO =
  1 / Math.tan((STACK_CONFIG.gesture.verticalConeDegrees * Math.PI) / 180);

// Helper functions
const getCardShadow = (isFront: boolean) =>
  isFront ? STACK_CONFIG.style.frontCardShadow : STACK_CONFIG.style.backCardShadow;

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
  const { playTransition } = useSoundSettings();
  const [isHovered, setIsHovered] = useState(false);
  const [isFrontCardHovered, setIsFrontCardHovered] = useState(false);
  // Only state needed for rendering: touchAction needs to update when intent is confirmed
  const [touchAction, setTouchAction] = useState<"pan-y" | "none">("pan-y");
  const [hasHover, setHasHover] = useState(false);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const audioPoolRef = useRef<HTMLAudioElement[]>([]);

  const { route, isSubpage, lockStackInteractions, shouldHideStack } =
    classifyPath(pathname);

  // Initialize audio pool with multiple instances for variation
  useEffect(() => {
    // Create 3 audio instances for variation
    audioPoolRef.current = Array.from({ length: 3 }, () => {
      const audio = new Audio("/assets/audio/Paper Rustle Sound Effect.mp3");
      audio.volume = 0.5;
      return audio;
    });
    return () => {
      audioPoolRef.current.forEach((audio) => {
        audio.pause();
      });
      audioPoolRef.current = [];
    };
  }, []);

  const playCardChangeSound = useCallback(() => {
    if (audioPoolRef.current.length === 0) return;

    // Find an available audio instance (not currently playing)
    let audio = audioPoolRef.current.find((a) => a.paused);
    
    // If all are playing, use a random one
    if (!audio) {
      audio = audioPoolRef.current[Math.floor(Math.random() * audioPoolRef.current.length)];
    }

    // Vary playback rate between 0.85x and 1.15x for natural variation
    const playbackRate = 0.85 + Math.random() * 0.3;
    audio.playbackRate = playbackRate;
    audio.currentTime = 0;
    
    audio.play().catch(() => {
      // Ignore play errors (e.g., user hasn't interacted with page yet)
    });
    
    // Stop after 1 second
    setTimeout(() => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }, 1000);
  }, []);

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
      const isMobile = window.matchMedia(
        `(max-width: ${STACK_CONFIG.layout.mobileBreakpoint}px)`
      ).matches;
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
    const isInteractive = target.closest(
      'a[href], button, input, textarea, select, [role="link"], [role="button"], [contenteditable="true"]'
    );

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
      const isInteractive = target.closest(
        'a[href], button, input, textarea, select, [role="link"], [role="button"], [contenteditable="true"]'
      );
      if (isInteractive) {
        return;
      }

      const dx = Math.abs(e.clientX - gestureStartRef.current.x);
      const dy = Math.abs(e.clientY - gestureStartRef.current.y);

      // Only decide after moving past the threshold
      if (
        dx > STACK_CONFIG.gesture.intentThresholdPx ||
        dy > STACK_CONFIG.gesture.intentThresholdPx
      ) {
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
    }, STACK_CONFIG.gesture.dragUnlockResetDelayMs);
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
    playTransition("forward");
    const currentOrder = getOrderFromRoute(route);
    const nextRoute = currentOrder[1];
    // Reset scroll to top when rotating routes
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    playCardChangeSound();
    router.push(hrefForRoute(nextRoute));
  }, [route, router, playTransition, playCardChangeSound]);

  const rotateBackward = useCallback(() => {
    playTransition("backward");
    const currentOrder = getOrderFromRoute(route);
    const prevRoute = currentOrder[2];
    // Reset scroll to top when rotating routes
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    playCardChangeSound();
    router.push(hrefForRoute(prevRoute));
  }, [route, router, playTransition, playCardChangeSound]);

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
      Math.abs(info.velocity.y) * STACK_CONFIG.gesture.horizontalVelocityRatio;

    if (velocity > STACK_CONFIG.gesture.flickVelocityThreshold && isHorizontalEnough) {
      rotateForward();
    }
    // Otherwise Framer Motion snaps back automatically
  };

  const bringToFront = useCallback(
    (routeId: RouteId) => {
      playCardChangeSound();
      router.push(hrefForRoute(routeId));
    },
    [router, playCardChangeSound]
  );

  const handleCardClick = (e: React.MouseEvent, routeId: RouteId, position: number) => {
    // Disable card clicks when interactions are locked
    if (lockStackInteractions) return;
    
    // If clicking on a link inside the card, let it handle the click
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (link) {
      return; // Allow link to work normally
    }
    
    if (position === 0) return; // Front card is not clickable

    bringToFront(routeId);
  };


  if (shouldHideStack) {
    return null;
  }

  const handleOverlayClick = () => {
    if (isSubpage) {
      playCardChangeSound();
      router.push(hrefForRoute(order[0]));
    }
  };

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (isSubpage && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      playCardChangeSound();
      router.push(hrefForRoute(order[0]));
    }
  };

  // Helper functions for card rendering
  const getCardAnimation = (
    isFront: boolean,
    isSubpage: boolean,
    offset: ReturnType<typeof getStackOffset>,
    breathe: number,
    position: number
  ) => {
    if (isFront) {
      return isSubpage
        ? { x: 0, rotate: 0, scale: 1 }
        : { x: 0, y: 0, rotate: 0, scale: 1 };
    }
    // When collapsed (isSubpage), back cards have no rotation or offset
    if (isSubpage) {
      return { x: 0, y: 0, rotate: 0, scale: 1 };
    }
    // When expanded, back cards have offset, rotation, and scale based on position
    return {
      x: offset.x * breathe,
      y: offset.y * breathe,
      rotate: offset.rotate * breathe,
      scale: 1 - position * STACK_CONFIG.animation.scaleReductionPerPosition,
    };
  };

  const getBackStageContainerClassName = (isSubpage: boolean) => {
    const baseClasses = "fixed z-10";
    return isSubpage
      ? cn(baseClasses, "bottom-0 left-0 right-0 px-4 w-full md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-xl md:px-0")
      : cn(baseClasses, "top-20 left-0 right-0 w-full max-w-xl mx-auto");
  };

  const getFrontSlotClassName = (isSubpage: boolean) => {
    const baseClasses = "z-20 w-full max-w-xl mx-auto";
    return isSubpage
      ? cn(baseClasses, "fixed left-0 right-0 px-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:px-0")
      : cn(baseClasses, "relative -mt-8");
  };

  const getFrontSlotStyle = (isSubpage: boolean) => {
    return isSubpage
      ? { top: "calc(100dvh - 1.5rem)" }
      : undefined;
  };

  const getFrontSlotAnimation = (isSubpage: boolean, hasHover: boolean, isFrontCardHovered: boolean) => {
    return {
      y: isSubpage && hasHover && isFrontCardHovered ? "-0.5rem" : 0,
    };
  };

  const getCardClassName = (isFront: boolean, lockStackInteractions: boolean) => {
    const baseClasses = "w-full";
    if (isFront) {
      const frontClasses = lockStackInteractions
        ? "cursor-default"
        : "cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 focus:ring-offset-transparent rounded-sm select-none";
      return cn(frontClasses, baseClasses);
    }
    return cn("cursor-pointer", baseClasses);
  };

  const getCardStyle = (
    isFront: boolean,
    isInBackStage: boolean,
    position: number,
    lockStackInteractions: boolean,
    touchAction: "pan-y" | "none",
    wantsWillChange: boolean
  ) => ({
    zIndex: STACK_CONFIG.style.baseZIndex - position,
    position: isInBackStage ? ("absolute" as const) : ("relative" as const),
    top: isInBackStage ? 0 : undefined,
    left: isInBackStage ? 0 : undefined,
    right: isInBackStage ? 0 : undefined,
    willChange: wantsWillChange ? "transform" : "auto",
    touchAction: isFront && !lockStackInteractions ? touchAction : undefined,
    boxShadow: getCardShadow(isFront),
  });

  const canDrag = (isFront: boolean, lockStackInteractions: boolean) =>
    isFront && !lockStackInteractions;

  // Render a single card with shared layout
  const renderCard = (routeId: RouteId, position: number, isInBackStage: boolean) => {
    const isFront = position === 0;
    const offset = getStackOffset(position);
    const breathe = showSpread && !isFront ? STACK_CONFIG.animation.hoverSpreadMultiplier : 1;
    // Only apply willChange when actively animating (front card dragable or back cards spreading)
    const wantsWillChange = (isFront && !lockStackInteractions) || showSpread;
    const dragEnabled = canDrag(isFront, lockStackInteractions);
    const animation = getCardAnimation(isFront, isSubpage, offset, breathe, position);
    // Initial state for back cards should match final state without spread to prevent animation on mount
    const initialAnimation = !isFront 
      ? getCardAnimation(isFront, isSubpage, offset, 1, position)
      : undefined;

    return (
      <motion.div
        key={routeId}
        layoutId={routeId}
        layout={isFront ? "position" : false}
        style={getCardStyle(isFront, isInBackStage, position, lockStackInteractions, touchAction, wantsWillChange)}
        drag={dragEnabled}
        dragControls={dragEnabled ? dragControls : undefined}
        dragListener={false}
        dragSnapToOrigin={true}
        dragElastic={STACK_CONFIG.gesture.dragElasticity}
        onPointerDown={dragEnabled ? handlePointerDown : undefined}
        onPointerMove={dragEnabled ? handlePointerMove : undefined}
        onPointerUp={dragEnabled ? (e) => handlePointerUp(e) : undefined}
        onPointerCancel={dragEnabled ? (e) => handlePointerUp(e) : undefined}
        onDragEnd={dragEnabled ? handleDragEnd : undefined}
        initial={initialAnimation}
        animate={animation}
        transition={STACK_SPRING}
        onClick={(e) => handleCardClick(e, routeId, position)}
        tabIndex={dragEnabled ? 0 : -1}
        aria-label={
          dragEnabled
            ? `Receipt stack navigation. Use Left and Right arrow keys to switch routes.`
            : undefined
        }
        className={getCardClassName(isFront, lockStackInteractions)}
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
      <div className={getBackStageContainerClassName(isSubpage)}>
        <motion.div
          className="flex flex-col items-center justify-center isolate pb-12 min-h-[600px] md:min-h-[800px]"
          initial={{
            y: isSubpage ? "100%" : 0,
          }}
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
        className={getFrontSlotClassName(isSubpage)}
        style={getFrontSlotStyle(isSubpage)}
        animate={getFrontSlotAnimation(isSubpage, hasHover, isFrontCardHovered)}
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
