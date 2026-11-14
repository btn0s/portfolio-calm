/**
 * Page scrolling driven by a touch gesture we own (the receipt stack takes every touch on its
 * front card so it, not the browser, decides drag vs scroll). Follows the finger 1:1, then coasts
 * with iOS's own deceleration (UIScrollView "normal": velocity × 0.998 per ms) until it stops,
 * hits an edge, or the next touch/wheel catches it.
 */

const DECELERATION_PER_MS = 0.998;
/** Below this (px/ms) the coast is over. */
const MIN_VELOCITY = 0.02;
/** Only the last stretch of the gesture sets the release velocity. */
const VELOCITY_WINDOW_MS = 80;

export function createTouchScroll() {
  let lastY = 0;
  let samples: { y: number; t: number }[] = [];
  let frame = 0;

  const stopCoast = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    window.removeEventListener("pointerdown", stopCoast, true);
    window.removeEventListener("wheel", stopCoast, true);
  };

  const scrollBy = (dy: number) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const before = window.scrollY;
    const next = Math.min(max, Math.max(0, before + dy));
    window.scrollTo({ top: next, behavior: "instant" });
    return next !== before;
  };

  return {
    /** The gesture became a scroll at `y` (client px), having started at `startY`. */
    begin(startY: number, y: number, t: number) {
      stopCoast();
      scrollBy(startY - y);
      lastY = y;
      samples = [{ y, t }];
    },
    move(y: number, t: number) {
      scrollBy(lastY - y);
      lastY = y;
      samples.push({ y, t });
      while (samples.length > 2 && t - samples[0].t > VELOCITY_WINDOW_MS) samples.shift();
    },
    /** Finger lifted: coast on with the release velocity. */
    release(t: number) {
      const first = samples[0];
      const last = samples.at(-1);
      samples = [];
      if (!first || !last || t - last.t > VELOCITY_WINDOW_MS || last.t === first.t) return;
      // Content moves opposite to the finger: dragging up scrolls down.
      let velocity = (first.y - last.y) / (last.t - first.t);
      let previous = performance.now();
      const step = (now: number) => {
        const dt = now - previous;
        previous = now;
        velocity *= Math.pow(DECELERATION_PER_MS, dt);
        if (Math.abs(velocity) < MIN_VELOCITY || !scrollBy(velocity * dt)) return stopCoast();
        frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
      // Any new touch or wheel catches the page, like native momentum.
      window.addEventListener("pointerdown", stopCoast, true);
      window.addEventListener("wheel", stopCoast, true);
    },
    stop: stopCoast,
  };
}
