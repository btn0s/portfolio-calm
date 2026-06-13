import { describe, it, expect, vi, afterEach } from "vitest";
import { formatDate } from "./blog-utils";

describe("formatDate", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-12T12:00:00"));

  afterEach(() => {
    vi.useRealTimers();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-12T12:00:00"));
  });

  it("returns formatted date without relative when includeRelative is false", () => {
    expect(formatDate("2026-06-01")).toBe("June 1, 2026");
  });

  it("returns formatted date with relative days (11d ago)", () => {
    expect(formatDate("2026-06-01", true)).toMatch(/\(11d ago\)$/);
  });

  it("returns formatted date with relative months (2mo ago)", () => {
    expect(formatDate("2026-04-01", true)).toMatch(/\(2mo ago\)$/);
  });

  it("returns formatted date with relative months (6mo ago) for Dec 2025 from Jun 2026", () => {
    expect(formatDate("2025-12-01", true)).toMatch(/\(6mo ago\)$/);
  });

  it("returns formatted date with relative years (1y ago) for Jun 2025 from Jun 2026", () => {
    expect(formatDate("2025-06-01", true)).toMatch(/\(1y ago\)$/);
  });

  it("returns formatted date with relative days (13d ago) for May 30 2026", () => {
    expect(formatDate("2026-05-30", true)).toMatch(/\(13d ago\)$/);
  });

  it("returns formatted date with Today when same day", () => {
    expect(formatDate("2026-06-12", true)).toMatch(/\(Today\)$/);
  });

  it("returns formatted date with T in string (11d ago)", () => {
    expect(formatDate("2026-06-01T10:00:00", true)).toBe("June 1, 2026 (11d ago)");
  });
});
