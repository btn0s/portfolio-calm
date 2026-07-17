import { describe, expect, it } from "vitest";
import {
  PIXEL_PATTERN_FRAME_INTERVAL_MS,
  shouldRenderPixelPatternFrame,
} from "./pixel-animation";

describe("shouldRenderPixelPatternFrame", () => {
  it("renders immediately when the loop starts or resumes", () => {
    expect(shouldRenderPixelPatternFrame(0, null)).toBe(true);
    expect(shouldRenderPixelPatternFrame(10_000, null)).toBe(true);
  });

  it("limits the expensive draw to roughly 30 frames per second", () => {
    const lastRenderedAt = 100;

    expect(
      shouldRenderPixelPatternFrame(
        lastRenderedAt + PIXEL_PATTERN_FRAME_INTERVAL_MS - 2,
        lastRenderedAt
      )
    ).toBe(false);
    expect(
      shouldRenderPixelPatternFrame(
        lastRenderedAt + PIXEL_PATTERN_FRAME_INTERVAL_MS,
        lastRenderedAt
      )
    ).toBe(true);
  });

  it("allows four 120 Hz display frames to accumulate before drawing", () => {
    const displayFrameInterval = 1000 / 120;
    const lastRenderedAt = 0;

    expect(
      shouldRenderPixelPatternFrame(
        displayFrameInterval * 3,
        lastRenderedAt
      )
    ).toBe(false);
    expect(
      shouldRenderPixelPatternFrame(
        displayFrameInterval * 4,
        lastRenderedAt
      )
    ).toBe(true);
  });
});
