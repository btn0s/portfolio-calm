export const PIXEL_PATTERN_FPS = 30;
export const PIXEL_PATTERN_FRAME_INTERVAL_MS = 1000 / PIXEL_PATTERN_FPS;

const FRAME_INTERVAL_TOLERANCE_MS = 1;

export function shouldRenderPixelPatternFrame(
  timestamp: number,
  lastRenderedAt: number | null,
  frameInterval = PIXEL_PATTERN_FRAME_INTERVAL_MS
) {
  if (lastRenderedAt === null) {
    return true;
  }

  return (
    timestamp - lastRenderedAt >=
    Math.max(0, frameInterval - FRAME_INTERVAL_TOLERANCE_MS)
  );
}
