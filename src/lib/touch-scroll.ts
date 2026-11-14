/**
 * Page scrolling driven by a touch gesture we own (the receipt stack takes every touch on its
 * front card so it, not the browser, decides drag vs scroll). Follows the finger 1:1, then coasts
 * with iOS's own deceleration (UIScrollView "normal": velocity × 0.998 per ms) until it stops,
 * hits an edge, or the next touch/wheel catches it.
 *
 * This runs on the main thread, unlike native scrolling, so it does as little as possible: touch
 * events only record the finger, one requestAnimationFrame applies one scroll per frame, and the
 * scroll position and range are tracked here rather than read back from the page (a read of
 * scrollHeight can force layout).
 */

const DECELERATION_PER_MS = 0.998;
/** Below this (px/ms) the coast is over. */
const MIN_VELOCITY = 0.02;
/** Only the last stretch of the gesture sets the release velocity. */
const VELOCITY_WINDOW_MS = 80;

export function createTouchScroll() {
  let top = 0;
  let max = 0;
  /** Scroll position the finger asks for; applied on the next frame. */
  let target = 0;
  let anchorY = 0;
  let anchorTop = 0;
  let samples: { y: number; t: number }[] = [];
  let frame = 0;

  const apply = (next: number) => {
    const clamped = Math.min(max, Math.max(0, next));
    if (clamped !== top) {
      top = clamped;
      window.scrollTo(0, top);
    }
    return clamped === next;
  };

  const cancelFrame = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };

  const stop = () => {
    cancelFrame();
    window.removeEventListener("pointerdown", stop, true);
    window.removeEventListener("wheel", stop, true);
  };

  const follow = () => {
    frame = 0;
    apply(target);
  };

  return {
    /** The gesture became a scroll at `y` (client px), having started at `startY`. */
    begin(startY: number, y: number, t: number) {
      stop();
      top = window.scrollY;
      max = document.documentElement.scrollHeight - window.innerHeight;
      anchorY = startY;
      anchorTop = top;
      samples = [{ y, t }];
      this.move(y, t);
    },
    move(y: number, t: number) {
      // Content moves opposite to the finger: dragging up scrolls down.
      target = anchorTop + (anchorY - y);
      samples.push({ y, t });
      while (samples.length > 2 && t - samples[0].t > VELOCITY_WINDOW_MS) samples.shift();
      if (!frame) frame = requestAnimationFrame(follow);
    },
    /** Finger lifted: catch up to the finger, then coast on with the release velocity. */
    release(t: number) {
      cancelFrame();
      apply(target);
      const first = samples[0];
      const last = samples.at(-1);
      samples = [];
      if (!first || !last || t - last.t > VELOCITY_WINDOW_MS || last.t === first.t) return;
      let velocity = (first.y - last.y) / (last.t - first.t);
      let previous = performance.now();
      const coast = (now: number) => {
        const dt = now - previous;
        previous = now;
        velocity *= Math.pow(DECELERATION_PER_MS, dt);
        if (Math.abs(velocity) < MIN_VELOCITY || !apply(top + velocity * dt)) return stop();
        frame = requestAnimationFrame(coast);
      };
      frame = requestAnimationFrame(coast);
      // Any new touch or wheel catches the page, like native momentum.
      window.addEventListener("pointerdown", stop, true);
      window.addEventListener("wheel", stop, true);
    },
    stop,
  };
}
