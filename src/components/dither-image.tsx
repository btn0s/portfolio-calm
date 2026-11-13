"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A picture printed the way the card it sits on would print it.
 *
 * The source is pulled small through Next's image optimizer, drawn into a canvas with one
 * cell per printed dot, and dithered in place. Each card owns a treatment:
 *
 * - `riso`: the Field Log's zine print. Two inks (bright red and blue) are separated with a
 *   Beer–Lambert density fit, screened with their own ordered (Bayer) dither, and overprinted
 *   onto the paper, with the blue drum a dot out of register.
 * - `blueprint`: the archive's cyanotype. Luminance, levelled and printed as a negative when the
 *   source is light (white marks on blue ground), through Atkinson error diffusion into three
 *   blueprint tones.
 *
 * With no `src`, the same press prints a plate from the seed, so every entry gets one.
 */

type Rgb = [number, number, number];

const hex = (h: string): Rgb => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;

export const TREATMENTS = {
  riso: { dot: 1.5, paper: hex("#faf9f6"), inks: [hex("#f15060"), hex("#0078bf")] as Rgb[] },
  blueprint: { dot: 3, tones: [hex("#00266b"), hex("#2f74d6"), hex("#e8f1ff")] as Rgb[] },
} as const;

export type Treatment = keyof typeof TREATMENTS;

// 8×8 Bayer matrix, thresholds in (0, 1).
const BAYER = (() => {
  const m = [[0]];
  let n = 1;
  while (n < 8) {
    const next: number[][] = [];
    for (let y = 0; y < n * 2; y++) {
      next.push([]);
      for (let x = 0; x < n * 2; x++) {
        const q = [0, 2, 3, 1][(y >= n ? 2 : 0) + (x >= n ? 1 : 0)];
        next[y][x] = 4 * m[y % n][x % n] + q;
      }
    }
    m.splice(0, m.length, ...next);
    n *= 2;
  }
  return m.map((row) => row.map((v) => (v + 0.5) / 64));
})();

/** Next's optimizer serves these widths; pick the smallest that covers the canvas twice over. */
const WIDTHS = [128, 256, 384, 640, 750, 828, 1080];
const optimized = (src: string, cols: number) =>
  `/_next/image?url=${encodeURIComponent(src)}&w=${WIDTHS.find((w) => w >= cols * 2) ?? 1080}&q=75`;

function seedOf(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** A soft two-tone field from the seed, standing in for a photo. */
function plate(ctx: CanvasRenderingContext2D, cols: number, rows: number, seed: number, treatment: Treatment) {
  const rand = (i: number) => {
    const x = Math.sin((seed % 9973) + i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  const blobs = Array.from({ length: 5 }, (_, i) => ({
    x: rand(i * 3) * cols,
    y: rand(i * 3 + 1) * rows,
    r: (0.35 + rand(i * 3 + 2) * 0.6) * Math.max(cols, rows),
    warm: i % 2 === 0,
  }));
  const img = ctx.createImageData(cols, rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let warm = 0;
      let cool = 0;
      for (const b of blobs) {
        const d = Math.hypot(x - b.x, y - b.y) / b.r;
        const v = Math.max(0, 1 - d * d);
        if (b.warm) warm += v;
        else cool += v;
      }
      const o = (y * cols + x) * 4;
      if (treatment === "riso") {
        // Paint in the inks' own colours so the separation lands them on their drums.
        img.data[o] = 250 - cool * 220;
        img.data[o + 1] = 249 - warm * 150 - cool * 110;
        img.data[o + 2] = 246 - warm * 140 - cool * 40;
      } else {
        // A full-range sweep: error diffusion draws gradients beautifully.
        img.data[o] = img.data[o + 1] = img.data[o + 2] = Math.min(1, warm * 0.7 + cool * 0.35) * 255;
      }
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** The picture inside any flat margin (screenshots on a white sheet, letterboxing), in source pixels. */
function trim(img: HTMLImageElement) {
  const W = 128;
  const H = Math.max(1, Math.round((W * img.naturalHeight) / img.naturalWidth));
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
  ctx.canvas.width = W;
  ctx.canvas.height = H;
  ctx.drawImage(img, 0, 0, W, H);
  const d = ctx.getImageData(0, 0, W, H).data;
  const at = (x: number, y: number) => (y * W + x) * 4;
  const bg = [d[0], d[1], d[2]];
  const flat = (x: number, y: number) => {
    const o = at(x, y);
    return Math.abs(d[o] - bg[0]) + Math.abs(d[o + 1] - bg[1]) + Math.abs(d[o + 2] - bg[2]) < 24;
  };
  const rowFlat = (y: number) => Array.from({ length: W }, (_, x) => x).every((x) => flat(x, y));
  const colFlat = (x: number) => Array.from({ length: H }, (_, y) => y).every((y) => flat(x, y));
  let top = 0;
  let bottom = H - 1;
  let left = 0;
  let right = W - 1;
  while (top < bottom && rowFlat(top)) top++;
  while (bottom > top && rowFlat(bottom)) bottom--;
  while (left < right && colFlat(left)) left++;
  while (right > left && colFlat(right)) right--;
  // Nothing to trim, or so much it's probably the subject: use the whole picture.
  if ((right - left + 1) * (bottom - top + 1) < W * H * 0.2) return { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
  const k = img.naturalWidth / W;
  return { x: left * k, y: top * k, w: (right - left + 1) * k, h: (bottom - top + 1) * k };
}

function riso(img: ImageData) {
  const { paper, inks } = TREATMENTS.riso;
  const { width: w, height: h, data } = img;
  // Optical density of each ink per channel, relative to the paper.
  const dens = inks.map((ink) => ink.map((c, i) => -Math.log(Math.max(c, 4) / paper[i])));
  const [A, B] = dens;
  // Least-squares fit of target density as a·A + b·B (2×2 normal equations).
  const aa = A[0] * A[0] + A[1] * A[1] + A[2] * A[2];
  const bb = B[0] * B[0] + B[1] * B[1] + B[2] * B[2];
  const ab = A[0] * B[0] + A[1] * B[1] + A[2] * B[2];
  const det = aa * bb - ab * ab;
  const cover = new Float32Array(w * h * 2);
  for (let p = 0; p < w * h; p++) {
    const o = p * 4;
    const D = [0, 1, 2].map((i) => -Math.log(Math.max(data[o + i], 4) / paper[i]));
    const da = D[0] * A[0] + D[1] * A[1] + D[2] * A[2];
    const db = D[0] * B[0] + D[1] * B[1] + D[2] * B[2];
    // Eased a little toward the paper: a riso print leaves more sheet showing than the fit would.
    cover[p * 2] = Math.pow(Math.min(1, Math.max(0, (bb * da - ab * db) / det)), 1.25);
    cover[p * 2 + 1] = Math.pow(Math.min(1, Math.max(0, (aa * db - ab * da) / det)), 1.25);
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      // Red screens on the matrix as is; blue on it turned a quarter, one dot out of register.
      const red = cover[p * 2] > BAYER[y & 7][x & 7];
      const bx = Math.max(0, x - 1);
      const blue = cover[(y * w + bx) * 2 + 1] > BAYER[x & 7][7 - (y & 7)];
      const o = p * 4;
      for (let i = 0; i < 3; i++) {
        let c = paper[i];
        if (red) c = (c * inks[0][i]) / 255;
        if (blue) c = (c * inks[1][i]) / 255;
        data[o + i] = c;
      }
      data[o + 3] = 255;
    }
  }
}

function blueprint(img: ImageData) {
  const { tones } = TREATMENTS.blueprint;
  const { width: w, height: h, data } = img;
  const steps = tones.length - 1;
  const n = w * h;
  const lum = new Float32Array(n);
  let mean = 0;
  for (let p = 0; p < n; p++) {
    const o = p * 4;
    lum[p] = (0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2]) / 255;
    mean += lum[p] / n;
  }
  // Levels: stretch the 2nd–98th percentile to full range so flat screenshots still print detail.
  const sorted = Float32Array.from(lum).sort();
  const lo = sorted[Math.floor(n * 0.02)];
  const hi = Math.max(lo + 0.05, sorted[Math.floor(n * 0.98)]);
  // Blueprints are white marks on blue ground: a light source prints as its negative.
  const negative = mean > 0.5;
  for (let p = 0; p < n; p++) {
    const l = Math.min(1, Math.max(0, (lum[p] - lo) / (hi - lo)));
    lum[p] = negative ? 1 - l : l;
  }
  // Atkinson: pass on 6/8 of the error, 1/8 to each of six neighbours.
  const spread: [number, number][] = [[1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      const q = Math.round(Math.min(1, Math.max(0, lum[p])) * steps);
      const err = (lum[p] - q / steps) / 8;
      for (const [dx, dy] of spread) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < w && ny < h) lum[ny * w + nx] += err;
      }
      const o = p * 4;
      data[o] = tones[q][0];
      data[o + 1] = tones[q][1];
      data[o + 2] = tones[q][2];
      data[o + 3] = 255;
    }
  }
}

export function DitherImage({
  src,
  seed,
  alt,
  treatment,
  className,
}: {
  src?: string;
  /** Seeds the generated plate when there's no picture. */
  seed: string;
  alt: string;
  treatment: Treatment;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = box.current;
    const c = canvas.current;
    if (!el || !c) return;
    // Snap the dot to whole device pixels so every dot prints the same size.
    const dpr = window.devicePixelRatio || 1;
    const dot = Math.max(1, Math.round(TREATMENTS[treatment].dot * dpr)) / dpr;
    let source: HTMLImageElement | null = null;
    let crop = { x: 0, y: 0, w: 1, h: 1 };
    let cols = 0;
    let rows = 0;
    let cancelled = false;

    const print = () => {
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx || cancelled || !cols || !rows) return;
      c.width = cols;
      c.height = rows;
      if (source) {
        // object-fit: cover, one source sample per printed dot.
        const s = Math.max(cols / crop.w, rows / crop.h);
        const sw = cols / s;
        const sh = rows / s;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(source, crop.x + (crop.w - sw) / 2, crop.y + (crop.h - sh) / 2, sw, sh, 0, 0, cols, rows);
      } else {
        plate(ctx, cols, rows, seedOf(seed), treatment);
      }
      const img = ctx.getImageData(0, 0, cols, rows);
      if (treatment === "riso") riso(img);
      else blueprint(img);
      ctx.putImageData(img, 0, 0);
      setReady(true);
    };

    const fit = () => {
      const r = el.getBoundingClientRect();
      // Round up and let the box clip, so every dot is exactly `dot` CSS pixels.
      const nc = Math.ceil(r.width / dot);
      const nr = Math.ceil(r.height / dot);
      if (nc === cols && nr === rows) return;
      cols = nc;
      rows = nr;
      c.style.width = `${cols * dot}px`;
      c.style.height = `${rows * dot}px`;
      if (!src || source) print();
    };

    const ro = new ResizeObserver(fit);
    ro.observe(el);
    fit();
    if (src) {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        source = img;
        crop = trim(img);
        print();
      };
      img.onerror = () => print();
      img.src = optimized(src, Math.max(cols, 64));
    }
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [src, seed, treatment]);

  return (
    <div ref={box} role="img" aria-label={alt} className={cn("relative overflow-hidden", className)}>
      <canvas
        ref={canvas}
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-0 [image-rendering:pixelated] transition-opacity duration-500",
          ready ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
