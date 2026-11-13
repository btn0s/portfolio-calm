"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { noise2d } from "./pixel-pattern";

/**
 * A picture printed in the home card's pixel language (see `PixelPattern`): square cells with a
 * gap, one ink (the card's text colour) laid over the card at a per-cell alpha, and edges that
 * dissolve with noise.
 *
 * Each cell's alpha is the picture's sharpened, contrast-stretched luminance averaged over the
 * cell. On a dark card the ink goes where the picture is bright; on a light card, where it's
 * dark. A little ambient ink keeps the grid visible, and four levels keep it graphic.
 *
 * With no `src`, it prints a type plate: the title's initial, through the same cells.
 */

const CELL = 6; // CSS px, including the gap
const GAP = 1;
const AMBIENT = 0.05;
const LEVELS = 4;
const EDGE = 0.22; // of the shorter side
const SAMPLE = 4; // source samples per cell, per axis

/** Next's optimizer serves these widths; pick the smallest that covers the samples. */
const WIDTHS = [128, 256, 384, 640, 750, 828, 1080];
const optimized = (src: string, w: number) =>
  `/_next/image?url=${encodeURIComponent(src)}&w=${WIDTHS.find((x) => x >= w) ?? 1080}&q=75`;

/** Separable Gaussian blur of a w×h field, edges clamped. */
function blur(src: Float32Array, w: number, h: number, sigma: number) {
  const R = Math.max(1, Math.ceil(sigma * 2.5));
  const k = Array.from({ length: R * 2 + 1 }, (_, i) => Math.exp(-((i - R) ** 2) / (2 * sigma * sigma)));
  const sum = k.reduce((a, b) => a + b, 0);
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let i = -R; i <= R; i++) v += k[i + R] * src[y * w + Math.min(w - 1, Math.max(0, x + i))];
      tmp[y * w + x] = v / sum;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let i = -R; i <= R; i++) v += k[i + R] * tmp[Math.min(h - 1, Math.max(0, y + i)) * w + x];
      out[y * w + x] = v / sum;
    }
  return out;
}

function percentile(f: Float32Array, q: number) {
  const sorted = Float32Array.from(f).sort();
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
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
  const bg = [d[0], d[1], d[2]];
  const flat = (x: number, y: number) => {
    const o = (y * W + x) * 4;
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

/** Per-cell ink (0–1) for a picture: sharpened, box-averaged into cells, contrast-stretched. */
function pictureInk(img: HTMLImageElement, gw: number, gh: number, inkOnBright: boolean) {
  const w = gw * SAMPLE;
  const h = gh * SAMPLE;
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
  ctx.canvas.width = w;
  ctx.canvas.height = h;
  // object-fit: cover, centred a little above the middle.
  const crop = trim(img);
  const s = Math.max(w / crop.w, h / crop.h);
  const sw = w / s;
  const sh = h / s;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, crop.x + (crop.w - sw) / 2, crop.y + (crop.h - sh) * 0.45, sw, sh, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const lum = Float32Array.from({ length: w * h }, (_, p) => (0.299 * d[p * 4] + 0.587 * d[p * 4 + 1] + 0.114 * d[p * 4 + 2]) / 255);
  // Unsharp mask, so small shapes survive the cells.
  const soft = blur(lum, w, h, 2);
  const cells = new Float32Array(gw * gh);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      cells[((y / SAMPLE) | 0) * gw + ((x / SAMPLE) | 0)] += (lum[p] + (lum[p] - soft[p])) / (SAMPLE * SAMPLE);
    }
  const lo = percentile(cells, 0.02);
  const hi = Math.max(lo + 1e-3, percentile(cells, 0.98));
  return cells.map((v) => {
    const l = Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
    return inkOnBright ? l : 1 - l;
  });
}

/** The site's pixel face (Departure Mono, renamed by next/font). */
const monoFamily = () => getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim() || "monospace";

/** Per-cell ink for a type plate: the title's initial in the pixel face, set inside the dissolving edge. */
function plateInk(gw: number, gh: number, title: string, family: string) {
  const w = gw * SAMPLE;
  const h = gh * SAMPLE;
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
  ctx.canvas.width = w;
  ctx.canvas.height = h;
  const words = title.replace(/[^\w\s]/g, "").split(/\s+/).filter((t) => t.length > 2 && !/^(the|and|for|with|into|again|building|turning|making|how|why)$/i.test(t));
  const letter = (words[0] ?? title).charAt(0).toUpperCase();
  let size = h * 0.8;
  ctx.font = `${size}px ${family}`;
  size *= Math.min(1, (w * 0.6) / ctx.measureText(letter).width);
  ctx.font = `${Math.round(size)}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, w / 2, h / 2);
  const d = ctx.getImageData(0, 0, w, h).data;
  const cells = new Float32Array(gw * gh);
  for (let p = 0; p < w * h; p++) {
    const x = p % w;
    const y = (p / w) | 0;
    cells[((y / SAMPLE) | 0) * gw + ((x / SAMPLE) | 0)] += d[p * 4 + 3] / 255 / (SAMPLE * SAMPLE);
  }
  return cells;
}

/** Ambient ink, four levels, and the noisy edge dissolve. */
function finish(ink: Float32Array, gw: number, gh: number) {
  const margin = Math.max(1, Math.min(gw, gh) * EDGE);
  return ink.map((v, i) => {
    const x = i % gw;
    const y = (i / gw) | 0;
    const a = Math.round((AMBIENT + v * (1 - AMBIENT)) * (LEVELS - 1)) / (LEVELS - 1);
    const edge = Math.min(Math.min(x, gw - 1 - x), Math.min(y, gh - 1 - y)) / margin;
    return a * Math.min(1, Math.max(0, edge + (noise2d(x, y, 500) - 0.5) * 0.5));
  });
}

/** Whether a colour is light, i.e. the ink of a dark card. */
function isLight(color: string) {
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return 0.299 * r + 0.587 * g + 0.114 * b > 128;
}

export function DitherImage({
  src,
  title = "",
  alt,
  className,
}: {
  src?: string;
  /** Set on the type plate when there's no picture. */
  title?: string;
  alt: string;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = box.current;
    const c = canvas.current;
    if (!el || !c) return;
    let source: HTMLImageElement | null = null;
    let size = { w: 0, h: 0 };
    let cancelled = false;

    const print = () => {
      const ctx = c.getContext("2d");
      if (!ctx || cancelled || !size.w) return;
      const dpr = window.devicePixelRatio || 1;
      // Whole device pixels per cell and gap, so every cell prints crisp and the same size.
      const cell = Math.max(2, Math.round(CELL * dpr));
      const gap = Math.max(1, Math.round(GAP * dpr));
      const W = Math.round(size.w * dpr);
      const H = Math.round(size.h * dpr);
      const gw = Math.max(1, Math.floor(W / cell));
      const gh = Math.max(1, Math.floor(H / cell));
      c.width = W;
      c.height = H;
      c.style.width = `${W / dpr}px`;
      c.style.height = `${H / dpr}px`;
      const ink = getComputedStyle(el).color;
      const alpha = finish(source ? pictureInk(source, gw, gh, isLight(ink)) : plateInk(gw, gh, title, monoFamily()), gw, gh);
      const ox = Math.floor((W - gw * cell) / 2);
      const oy = Math.floor((H - gh * cell) / 2);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = ink;
      for (let i = 0; i < alpha.length; i++) {
        if (alpha[i] <= 0.01) continue;
        ctx.globalAlpha = alpha[i];
        ctx.fillRect(ox + (i % gw) * cell, oy + ((i / gw) | 0) * cell, cell - gap, cell - gap);
      }
      ctx.globalAlpha = 1;
      setReady(true);
    };

    const fit = () => {
      const r = el.getBoundingClientRect();
      if (r.width === size.w && r.height === size.h) return;
      size = { w: r.width, h: r.height };
      if (!src || source) print();
    };

    const ro = new ResizeObserver(fit);
    ro.observe(el);
    fit();
    // A plate is set in the pixel face: print it again once that has loaded.
    if (!src) document.fonts.load(`16px ${monoFamily()}`).then(print, () => {});
    if (src) {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        source = img;
        print();
      };
      img.onerror = () => print();
      img.src = optimized(src, Math.max(256, Math.ceil(size.w / CELL) * SAMPLE * 2));
    }
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [src, title]);

  return (
    <div ref={box} role="img" aria-label={alt} className={cn("relative overflow-hidden", className)}>
      <canvas
        ref={canvas}
        aria-hidden="true"
        className={cn("absolute left-0 top-0 transition-opacity duration-500", ready ? "opacity-100" : "opacity-0")}
      />
    </div>
  );
}
