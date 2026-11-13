"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A picture printed the way the card it sits on would print it.
 *
 * The source is pulled small through Next's image optimizer, drawn into a canvas with one
 * cell per printed dot, and printed in place. Each card owns a treatment:
 *
 * - `riso`: the Field Log's zine print. The picture is separated into two inks (bright red
 *   and blue) with a Beer–Lambert density fit, each plate is levelled and sharpened, then
 *   screened through blue noise (the stochastic "grain" screen a risograph uses) and
 *   overprinted on the paper with uneven ink and the blue drum a dot out of register.
 * - `blueprint`: the archive's cyanotype. A blueprint is a drawing, not a photo: edges become
 *   white lines (difference of Gaussians), tone becomes 45° drafting hatch, and a light source
 *   prints as its negative so the drawing is white on blue ground.
 *
 * With no `src`, the riso press prints a type plate from the title instead.
 */

type Rgb = [number, number, number];

const hex = (h: string): Rgb => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;

export const TREATMENTS = {
  riso: { dot: 1, paper: hex("#faf9f6"), inks: [hex("#f15060"), hex("#0078bf")] as Rgb[] },
  blueprint: { dot: 1.5, tones: [hex("#00266b"), hex("#2f74d6"), hex("#e8f1ff")] as Rgb[] },
} as const;

export type Treatment = keyof typeof TREATMENTS;

/** A seeded PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A 64×64 blue-noise threshold mask, by Ulichney's void-and-cluster method: dots are ranked so
 * that every threshold level spreads them as evenly as possible, with no pattern to see.
 */
const NOISE = 64;
let noiseMask: Float32Array | null = null;
function blueNoise() {
  if (noiseMask) return noiseMask;
  const N = NOISE;
  const n = N * N;
  const sigma = 1.5;
  const R = 6;
  const kernel: number[] = [];
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) kernel.push(Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma)));
  const bits = new Uint8Array(n);
  const energy = new Float32Array(n);
  const splat = (i: number, sign: number) => {
    const x0 = i % N;
    const y0 = (i / N) | 0;
    let k = 0;
    for (let dy = -R; dy <= R; dy++) {
      const row = ((y0 + dy + N) % N) * N;
      for (let dx = -R; dx <= R; dx++) energy[row + ((x0 + dx + N) % N)] += sign * kernel[k++];
    }
  };
  // Tightest cluster: the 1 with the most energy. Largest void: the 0 with the least.
  const pick = (want: number, best: (a: number, b: number) => boolean) => {
    let at = -1;
    for (let i = 0; i < n; i++) if (bits[i] === want && (at < 0 || best(energy[i], energy[at]))) at = i;
    return at;
  };
  const cluster = () => pick(1, (a, b) => a > b);
  const voidAt = () => pick(0, (a, b) => a < b);
  const rand = rng(7);
  for (let k = 0; k < n / 10; k++) {
    const i = Math.floor(rand() * n);
    if (!bits[i]) (bits[i] = 1), splat(i, 1);
  }
  // Relax the seed pattern until moving the tightest dot into the largest void changes nothing.
  for (;;) {
    const i = cluster();
    bits[i] = 0;
    splat(i, -1);
    const j = voidAt();
    bits[j] = 1;
    splat(j, 1);
    if (j === i) break;
  }
  const seedBits = bits.slice();
  const seedEnergy = energy.slice();
  const ones = seedBits.reduce((a, b) => a + b, 0);
  const rank = new Float32Array(n);
  for (let r = ones - 1; r >= 0; r--) {
    const i = cluster();
    bits[i] = 0;
    splat(i, -1);
    rank[i] = r;
  }
  bits.set(seedBits);
  energy.set(seedEnergy);
  for (let r = ones; r < n; r++) {
    const j = voidAt();
    bits[j] = 1;
    splat(j, 1);
    rank[j] = r;
  }
  noiseMask = rank.map((r) => (r + 0.5) / n);
  return noiseMask;
}

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

/** The value at a fraction of the way through the field's sorted values. */
function percentile(f: Float32Array, q: number) {
  const sorted = Float32Array.from(f).sort();
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
}

/** Next's optimizer serves these widths; pick the smallest that covers the canvas twice over. */
const WIDTHS = [128, 256, 384, 640, 750, 828, 1080];
const optimized = (src: string, cols: number) =>
  `/_next/image?url=${encodeURIComponent(src)}&w=${WIDTHS.find((w) => w >= cols * 2) ?? 1080}&q=75`;

function seedOf(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
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

/** Each ink's coverage (0–1) of a picture, by fitting its optical density as a mix of the two inks. */
function separate(img: ImageData): [Float32Array, Float32Array] {
  const { paper, inks } = TREATMENTS.riso;
  const { width: w, height: h, data } = img;
  const dens = inks.map((ink) => ink.map((c, i) => -Math.log(Math.max(c, 4) / paper[i])));
  const [A, B] = dens;
  // Least-squares fit of target density as a·A + b·B (2×2 normal equations).
  const aa = A[0] * A[0] + A[1] * A[1] + A[2] * A[2];
  const bb = B[0] * B[0] + B[1] * B[1] + B[2] * B[2];
  const ab = A[0] * B[0] + A[1] * B[1] + A[2] * B[2];
  const det = aa * bb - ab * ab;
  const red = new Float32Array(w * h);
  const blue = new Float32Array(w * h);
  for (let p = 0; p < w * h; p++) {
    const o = p * 4;
    const D = [0, 1, 2].map((i) => -Math.log(Math.max(data[o + i], 4) / paper[i]));
    const da = D[0] * A[0] + D[1] * A[1] + D[2] * A[2];
    const db = D[0] * B[0] + D[1] * B[1] + D[2] * B[2];
    red[p] = Math.max(0, (bb * da - ab * db) / det);
    blue[p] = Math.max(0, (aa * db - ab * da) / det);
  }
  // Prepress each plate: level it to the ink's full range (but never stretch a barely-used ink
  // into noise), sharpen so small shapes survive the screen, and ease toward the paper.
  return [red, blue].map((c) => {
    const lo = percentile(c, 0.03);
    const hi = Math.max(lo + 0.6, percentile(c, 0.985));
    const soft = blur(c, w, h, 1.2);
    return c.map((v, p) => {
      const sharp = v + 0.9 * (v - soft[p]);
      const t = Math.pow(Math.min(1, Math.max(0, (sharp - lo) / (hi - lo))), 1.3);
      // An S-curve, like a print's: clean paper in the lights, solid ink in the darks.
      return t + 0.6 * (t * t * (3 - 2 * t) - t);
    });
  }) as [Float32Array, Float32Array];
}

/** A type plate for an entry with no picture: the title's initial in red over a blue shape. */
function typePlate(w: number, h: number, title: string, seed: number): [Float32Array, Float32Array] {
  const rand = rng(seed);
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
  ctx.canvas.width = w;
  ctx.canvas.height = h;
  const layer = (draw: () => void, tint: number) => {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#000";
    draw();
    const d = ctx.getImageData(0, 0, w, h).data;
    return Float32Array.from({ length: w * h }, (_, p) => (1 - d[p * 4] / 255) * tint);
  };
  const blue = layer(() => {
    const kind = Math.floor(rand() * 3);
    if (kind === 0) {
      ctx.beginPath();
      ctx.arc(w * (0.55 + rand() * 0.35), h * (0.3 + rand() * 0.5), h * (0.55 + rand() * 0.25), 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 1) {
      const bands = 3 + Math.floor(rand() * 3);
      for (let i = 0; i < bands; i++) ctx.fillRect(0, (h / bands) * i, w, h / bands / 2);
    } else {
      ctx.beginPath();
      ctx.moveTo(w * 0.35, h);
      ctx.lineTo(w, h * (rand() * 0.3));
      ctx.lineTo(w, h);
      ctx.fill();
    }
  }, 0.7);
  const words = title.replace(/[^\w\s]/g, "").split(/\s+/).filter((t) => t.length > 2 && !/^(the|and|for|with|into|again|building|turning|making|how|why)$/i.test(t));
  const letter = (words[0] ?? title).charAt(0).toUpperCase();
  const red = layer(() => {
    // As tall as the plate allows, but never wider than three quarters of it.
    let size = h * 1.25;
    ctx.font = `italic bold ${size}px Georgia, "Times New Roman", serif`;
    size *= Math.min(1, (w * 0.75) / ctx.measureText(letter).width);
    ctx.font = `italic bold ${Math.round(size)}px Georgia, "Times New Roman", serif`;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(letter, w * (0.06 + rand() * 0.1), h * 0.95);
  }, 0.92);
  return [red, blue];
}

/** Screen two ink plates through blue noise and overprint them on the paper. */
function overprint(img: ImageData, [red, blue]: [Float32Array, Float32Array], seed: number) {
  const { paper, inks } = TREATMENTS.riso;
  const { width: w, height: h, data } = img;
  const mask = blueNoise();
  const rand = rng(seed);
  // Uneven ink: a soft field of density that varies across the sheet, per drum.
  const field = () => blur(Float32Array.from({ length: w * h }, rand), w, h, 3);
  const flow = [field(), field()];
  const span = flow.map((f) => [percentile(f, 0.02), percentile(f, 0.98)]);
  // The blue drum lands a dot off, in a direction that varies by print.
  const ox = rand() < 0.5 ? -1 : 1;
  const oy = rand() < 0.5 ? 0 : 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      const bx = Math.min(w - 1, Math.max(0, x - ox));
      const by = Math.min(h - 1, Math.max(0, y - oy));
      const on = [
        red[p] > mask[(y % NOISE) * NOISE + (x % NOISE)],
        blue[by * w + bx] > mask[((y + 37) % NOISE) * NOISE + ((x + 19) % NOISE)],
      ];
      const o = p * 4;
      for (let i = 0; i < 3; i++) {
        let c = paper[i];
        for (let k = 0; k < 2; k++) {
          if (!on[k]) continue;
          const [a, b] = span[k];
          const ink = 0.8 + 0.2 * Math.min(1, Math.max(0, (flow[k][p] - a) / (b - a || 1)));
          c *= 1 - ink + (ink * inks[k][i]) / 255;
        }
        data[o + i] = c;
      }
      data[o + 3] = 255;
    }
  }
}

function blueprint(img: ImageData) {
  const { tones } = TREATMENTS.blueprint;
  const { width: w, height: h, data } = img;
  const n = w * h;
  const lum = new Float32Array(n);
  let mean = 0;
  for (let p = 0; p < n; p++) {
    const o = p * 4;
    lum[p] = (0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2]) / 255;
    mean += lum[p] / n;
  }
  // Levels: stretch the 2nd–98th percentile to full range so flat screenshots still print detail.
  const lo = percentile(lum, 0.02);
  const hi = Math.max(lo + 0.05, percentile(lum, 0.98));
  // Blueprints are white marks on blue ground: a light source prints as its negative.
  const negative = mean > 0.5;
  for (let p = 0; p < n; p++) {
    const l = Math.min(1, Math.max(0, (lum[p] - lo) / (hi - lo)));
    lum[p] = negative ? 1 - l : l;
  }
  // Lines: where the fine blur stands above the coarse one (difference of Gaussians), a bright
  // edge or stroke is there to trace.
  const fine = blur(lum, w, h, 0.7);
  const coarse = blur(lum, w, h, 1.8);
  // Tone: 45° drafting hatch, denser with brightness.
  const P = 4;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      // White is for lines only; even the brightest area stays hatched, never a solid slab.
      const line = fine[p] - coarse[p] > 0.045;
      const hatch = Math.min(0.8, fine[p]) > ((x + y) % P + 0.5) / P;
      const t = tones[line ? 2 : hatch ? 1 : 0];
      const o = p * 4;
      data[o] = t[0];
      data[o + 1] = t[1];
      data[o + 2] = t[2];
      data[o + 3] = 255;
    }
  }
}

export function DitherImage({
  src,
  seed,
  title = "",
  alt,
  treatment,
  className,
}: {
  src?: string;
  /** Seeds the print's variation (ink flow, register, the type plate's shape). */
  seed: string;
  /** Set on the type plate when there's no picture. */
  title?: string;
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
      }
      const img = source ? ctx.getImageData(0, 0, cols, rows) : ctx.createImageData(cols, rows);
      if (treatment === "blueprint") blueprint(img);
      else overprint(img, source ? separate(img) : typePlate(cols, rows, title || seed, seedOf(seed)), seedOf(seed));
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
  }, [src, seed, title, treatment]);

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
