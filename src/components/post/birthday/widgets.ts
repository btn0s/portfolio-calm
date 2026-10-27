// Widgets for the birthday-surprise post, mounted by <Widget name=… /> on the client.
// Behind the scenes: the interactive figures. Each widget mounts into its section by id and
// uses the show's real data where it can (the speed curve module, the scene filter settings,
// the finale waveform, the prompt and commit history).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MOODS, type Mood } from './music';
import { FLIGHTS, distance, type Flight } from './flights';
import history from './history.json';
import wave from './finale-wave.json';

const INK = '#ededed';
const MUTE = '#b5b5b5';
const PINK = '#e83d97';
const BLUE = '#2495d6';
const INK3 = '#7a7a7a';
const LINE = '#26262a';
const SVG = 'http://www.w3.org/2000/svg';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...kids: (Node | string)[]) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  e.append(...kids);
  return e;
}
function s<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}) {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}
function chips<T extends string>(parent: HTMLElement, items: { id: T; label: string }[], pick: (id: T) => void, initial: T) {
  const row = h('div', { class: 'seg', role: 'group' });
  const buttons = items.map((it) => {
    const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': String(it.id === initial) }, it.label);
    b.onclick = () => {
      buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      pick(it.id);
    };
    row.append(b);
    return b;
  });
  parent.append(row);
  return row;
}
/** The control bar every widget opens with: actions on the left, choices next to them. */
function toolbar(root: HTMLElement, ...kids: HTMLElement[]) {
  const bar = h('div', { class: 'toolbar' }, ...kids);
  root.prepend(bar);
  return bar;
}
/** Runs `draw` every frame while the element is on screen. */
function whileVisible(el: Element, draw: (dt: number) => void) {
  let on = false;
  let last = 0;
  let raf = 0;
  const loop = (now: number) => {
    draw(Math.min(0.1, (now - (last || now)) / 1000));
    last = now;
    if (on) raf = requestAnimationFrame(loop);
  };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on) {
      on = true;
      last = 0;
      raf = requestAnimationFrame(loop);
    } else if (!e.isIntersecting) {
      on = false;
      cancelAnimationFrame(raf);
    }
  }).observe(el);
}
/** A canvas sized to its box at device resolution. */
function canvas2d(parent: HTMLElement, cls = '') {
  const c = h('canvas', cls ? { class: cls } : {});
  parent.append(c);
  const ctx = c.getContext('2d')!;
  const fit = () => {
    const r = c.getBoundingClientRect();
    const d = Math.min(2, devicePixelRatio);
    c.width = Math.max(1, Math.round(r.width * d));
    c.height = Math.max(1, Math.round(r.height * d));
    ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  new ResizeObserver(fit).observe(c);
  fit();
  return { c, ctx, size: () => c.getBoundingClientRect() };
}

// Tooltip, shared.
const tip = document.body.appendChild(h('div', { id: 'bts-tip', role: 'tooltip' }));
function showTip(html: string, x: number, y: number) {
  tip.innerHTML = html;
  tip.classList.add('on');
  const r = tip.getBoundingClientRect();
  tip.style.left = `${Math.min(innerWidth - r.width - 8, Math.max(8, x + 14))}px`;
  tip.style.top = `${Math.min(innerHeight - r.height - 8, y + 14)}px`;
}
const hideTip = () => tip.classList.remove('on');
// A tapped tooltip stays until the next tap elsewhere or a scroll.
document.addEventListener('click', (e) => {
  if ((e.target as Element).closest('.hit')) return;
  hideTip();
  document.querySelectorAll('#timeline .dot.on').forEach((d) => d.classList.remove('on'));
});
addEventListener('scroll', hideTip, { passive: true });
const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);

// Strips: tap a frame to see it big.
document.addEventListener('click', (e) => {
  const img = (e.target as HTMLElement).closest('.strip img, .crowd-grid img') as HTMLImageElement | null;
  if (!img) return;
  const box = h('div', { class: 'lightbox' }, h('img', { src: img.src, alt: img.alt }));
  box.onclick = () => box.remove();
  document.body.append(box);
});
// ── 1. The weekend timeline ──────────────────────────────────────────────────────────────
function timeline(root: HTMLElement) {
  const END = 24;
  const W = 1000;
  const H = 230;
  const L = 8;
  const R = 8;
  const x = (hr: number) => L + (hr / END) * (W - L - R);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Timeline of prompts and commits over 24 hours' });
  const prompts = history.prompts.filter((p) => p.h <= END);
  const hits: SVGCircleElement[] = [];
  const commits = history.commits.filter((c) => c.h <= END);
  // The night: the gap with no prompts.
  let gap = { a: 0, b: 0 };
  for (let i = 1; i < prompts.length; i++) if (prompts[i].h - prompts[i - 1].h > gap.b - gap.a) gap = { a: prompts[i - 1].h, b: prompts[i].h };
  svg.append(s('rect', { x: x(gap.a + 0.2), y: 40, width: x(gap.b - 0.2) - x(gap.a + 0.2), height: 130, fill: '#ffffff06', rx: 8 }));
  const sleep = s('text', { x: (x(gap.a) + x(gap.b)) / 2, y: 110, 'text-anchor': 'middle', fill: INK3, 'font-size': 13 });
  sleep.textContent = 'asleep';
  svg.append(sleep);
  // Chapters.
  const marks: [number, string][] = [
    [0, 'Tickets'],
    [0.32, 'Treasure hunt'],
    [0.97, 'Simpler'],
    [2.16, '3D'],
    [3.26, 'Scenes'],
    [7.5, 'Decoy'],
    [18.67, 'Finale'],
    [20.42, 'Flight'],
    [22.3, 'iPhone bug'],
    [23, 'She loved it'],
  ];
  let lastX = -999;
  let lane = 0;
  for (const [hr, label] of marks) {
    const px = x(hr);
    lane = px - lastX < 90 ? (lane + 1) % 3 : 0;
    lastX = px;
    svg.append(s('line', { x1: px, x2: px, y1: 8 + lane * 15, y2: 170, stroke: LINE }));
    const t = s('text', { x: px + 4, y: 12 + lane * 15, fill: '#a3a3a3', 'font-size': 12, 'font-weight': 600 });
    t.textContent = label;
    svg.append(t);
  }
  // Prompts: a beeswarm of dots, stacked within 6-minute buckets.
  const stacks = new Map<number, number>();
  for (const p of prompts) {
    const k = Math.round(p.h * 10);
    const n = stacks.get(k) ?? 0;
    stacks.set(k, n + 1);
    const dot = s('circle', { class: 'dot', cx: x(p.h), cy: 150 - n * 11, r: 4.5, fill: PINK, stroke: '#111113', 'stroke-width': 2 });
    const hr = Math.floor(p.h);
    const min = Math.round((p.h - hr) * 60);
    const html = `<small>Hour ${hr}:${String(min).padStart(2, '0')}${p.photos ? ` · ${p.photos} photo${p.photos > 1 ? 's' : ''}` : ''}</small>${esc(p.text || '(photos)')}`;
    const hit = s('circle', { class: 'hit', cx: x(p.h), cy: 150 - n * 11, r: 9, fill: 'transparent' });
    const show = (e: PointerEvent) => {
      svg.querySelectorAll('.dot.on').forEach((d) => d.classList.remove('on'));
      dot.classList.add('on');
      showTip(html, e.clientX, e.clientY);
    };
    hit.addEventListener('pointerenter', show);
    hit.addEventListener('pointermove', (e) => e.pointerType === 'mouse' && showTip(html, e.clientX, e.clientY));
    hit.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse') return;
      dot.classList.remove('on');
      hideTip();
    });
    hit.addEventListener('click', (e) => show(e as PointerEvent));
    svg.append(dot);
    hits.push(hit);
  }
  hits.forEach((c) => svg.append(c));
  // Commits: ticks under the axis.
  for (const c of commits) {
    const tick = s('rect', { x: x(c.h) - 1, y: 178, width: 2.5, height: 16, rx: 1, fill: BLUE });
    const html = `<small>${c.sha}</small>${esc(c.msg)}`;
    tick.addEventListener('pointerenter', (e) => showTip(html, e.clientX, e.clientY));
    tick.addEventListener('pointerleave', hideTip);
    svg.append(tick);
    svg.append(Object.assign(s('rect', { x: x(c.h) - 5, y: 174, width: 10, height: 24, fill: 'transparent' }), {}));
  }
  const axis = s('g', { class: 'axis' });
  axis.append(s('line', { x1: L, x2: W - R, y1: 172, y2: 172 }));
  for (let hr = 0; hr <= END; hr += 4) {
    const t = s('text', { x: x(hr), y: 214, 'text-anchor': hr === 0 ? 'start' : hr === END ? 'end' : 'middle' });
    t.textContent = `${hr}h`;
    axis.append(t);
  }
  svg.append(axis);
  root.classList.add('screen', 'pad');
  root.append(svg);
  root.append(
    h('div', { class: 'legend' }, h('span', {}, h('i', { style: `background:${PINK};height:9px;width:9px;border-radius:50%` }), `${prompts.length} prompts`), h('span', {}, h('i', { style: `background:${BLUE};height:12px;width:3px` }), `${commits.length} commits`), h('span', { class: 'hint' }, matchMedia('(hover: hover)').matches ? 'Hover a dot to read the prompt' : 'Tap a dot to read the prompt')),
  );
}

// ── 2. Ticket options ────────────────────────────────────────────────────────────────────
function tickets(root: HTMLElement) {
  const opts = [
    { id: 'option1', label: 'Night sky' },
    { id: 'option2', label: 'Kiss clock' },
    { id: 'option3', label: 'Admit one' },
    { id: 'option4', label: 'Mirror ball' },
    { id: 'letterpress', label: 'Letterpress' },
    { id: 'final', label: 'Chosen' },
  ] as const;
  const img = h('img', { src: '/thoughts/birthday/tix/final.jpg', alt: 'The chosen ticket' });
  root.append(h('div', { class: 'tix-stage' }, img));
  for (const o of opts) new Image().src = `/thoughts/birthday/tix/${o.id}.jpg`;
  toolbar(root, chips(root, [...opts], (id) => (img.src = `/thoughts/birthday/tix/${id}.jpg`), 'final'));
}

// ── 3. Mirror ball ───────────────────────────────────────────────────────────────────────
// The show's ball: rows of flat square tiles, each with its normal knocked off true by `wobble`.
function ballGeometry(rows: number, wobble: number) {
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const dLat = Math.PI / rows;
  const hw = dLat * 0.43;
  const n = new THREE.Vector3();
  const e = new THREE.Vector3();
  const u = new THREE.Vector3();
  const j = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let r = 0; r < rows; r++) {
    const lat = -Math.PI / 2 + dLat * (r + 0.5);
    const count = Math.max(6, Math.round((Math.PI * 2 * Math.cos(lat)) / dLat));
    for (let i = 0; i < count; i++) {
      const lon = ((i + (r % 2) * 0.5) / count) * Math.PI * 2;
      n.set(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
      e.crossVectors(up, n).normalize();
      u.crossVectors(n, e);
      j.set(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(wobble).add(n).normalize();
      const shade = 0.75 + rand() * 0.25;
      for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) {
        pos.push(n.x + (e.x * a + u.x * b) * hw, n.y + (e.y * a + u.y * b) * hw, n.z + (e.z * a + u.z * b) * hw);
        nor.push(j.x, j.y, j.z);
        col.push(shade, shade, shade);
      }
    }
  }
  const core = new THREE.SphereGeometry(0.97, 32, 16).toNonIndexed();
  const p = core.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    pos.push(p.getX(i), p.getY(i), p.getZ(i));
    nor.push(p.getX(i), p.getY(i), p.getZ(i));
    col.push(0.02, 0.02, 0.025);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

function stage(box: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  box.append(renderer.domElement);
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 5.2);
  const fit = () => {
    const r = box.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(fit).observe(box);
  fit();
  return { renderer, scene, camera };
}

function ball(root: HTMLElement) {
  const box = h('div', { class: 'canvas-box' });
  const controls = h('div', { class: 'controls' });
  root.append(h('div', { class: 'split' }, box, controls));
  const { renderer, scene, camera } = stage(box);
  const mat = new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0.16, vertexColors: true, envMapIntensity: 1.1 });
  const mesh = new THREE.Mesh(ballGeometry(22, 0.12), mat);
  scene.add(mesh);
  const lights = [new THREE.PointLight('#e83d97', 40, 0, 1.6), new THREE.PointLight('#2495d6', 40, 0, 1.6), new THREE.PointLight('#ffffff', 25, 0, 1.6)];
  lights.forEach((l) => scene.add(l));
  const state = { rows: 22, wobble: 0.12, spin: 0.35 };
  const rebuild = () => {
    mesh.geometry.dispose();
    mesh.geometry = ballGeometry(state.rows, state.wobble);
  };
  const slider = (label: string, key: keyof typeof state, min: number, max: number, step: number, fmt: (v: number) => string, onChange: () => void) => {
    const input = h('input', { type: 'range', min: String(min), max: String(max), step: String(step), value: String(state[key]) }) as HTMLInputElement;
    const out = h('output', {}, fmt(state[key]));
    input.oninput = () => {
      state[key] = Number(input.value);
      out.textContent = fmt(state[key]);
      onChange();
    };
    controls.append(h('label', { class: 'slider' }, label, input, out));
    resets.push(() => {
      state[key] = initial[key];
      input.value = String(initial[key]);
      out.textContent = fmt(initial[key]);
    });
  };
  const initial = { ...state };
  const resets: (() => void)[] = [];
  slider('Tile wobble', 'wobble', 0, 0.4, 0.01, (v) => v.toFixed(2), rebuild);
  slider('Rows of tiles', 'rows', 6, 40, 1, (v) => String(v), rebuild);
  slider('Spin', 'spin', 0, 1.5, 0.05, (v) => v.toFixed(2), () => {});
  const reset = h('button', { class: 'chip', type: 'button' }, 'Reset to the show’s ball');
  reset.onclick = () => {
    resets.forEach((f) => f());
    rebuild();
  };
  controls.append(h('div', { class: 'row' }, reset));
  let t = 0;
  whileVisible(box, (dt) => {
    t += dt;
    mesh.rotation.y += dt * state.spin;
    mesh.rotation.x = 0.25;
    lights[0].position.set(Math.cos(t * 0.7) * 3, 1.5, Math.sin(t * 0.7) * 3 + 1);
    lights[1].position.set(Math.cos(t * 0.7 + 2.1) * 3, -1.2, Math.sin(t * 0.7 + 2.1) * 3 + 1);
    lights[2].position.set(Math.cos(t * 0.5 + 4.2) * 3, 2.4, Math.sin(t * 0.5 + 4.2) * 3 + 1.5);
    renderer.render(scene, camera);
  });
}

// ── 4. Scene moods ───────────────────────────────────────────────────────────────────────
function mood(root: HTMLElement) {
  const scenes: { id: Mood; label: string }[] = [
    { id: 'far', label: 'Through a wall' },
    { id: 'intimate', label: 'Next room' },
    { id: 'party', label: 'The party' },
    { id: 'inside', label: 'Inside the ball' },
    { id: 'crowd', label: 'The crowd' },
  ];
  let current: Mood = 'far';
  let ctx: AudioContext | null = null;
  let filter: BiquadFilterNode | null = null;
  let gain: GainNode | null = null;
  let analyser: AnalyserNode | null = null;
  const el = new Audio('/thoughts/birthday/music.m4a');
  el.loop = true;
  el.preload = 'none';
  const play = h('button', { class: 'chip play', type: 'button', 'aria-pressed': 'false' }, '▶ Play');
  const apply = (seconds: number) => {
    if (!ctx || !filter || !gain) return;
    const m = MOODS[current];
    const now = ctx.currentTime;
    filter.frequency.cancelScheduledValues(now);
    filter.frequency.setValueAtTime(filter.frequency.value, now);
    filter.frequency.exponentialRampToValueAtTime(m.hz, now + seconds);
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(m.level * 0.8, now + seconds);
  };
  play.onclick = async () => {
    if (!ctx) {
      ctx = new AudioContext();
      filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = MOODS[current].hz;
      gain = ctx.createGain();
      gain.gain.value = 0;
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      ctx.createMediaElementSource(el).connect(filter).connect(gain).connect(analyser).connect(ctx.destination);
    }
    if (el.paused) {
      await ctx.resume();
      await el.play();
      apply(0.6);
      play.textContent = '❚❚ Pause';
      play.setAttribute('aria-pressed', 'true');
    } else {
      el.pause();
      play.textContent = '▶ Play';
      play.setAttribute('aria-pressed', 'false');
    }
  };
  const picker = chips(root, scenes, (id) => {
    current = id;
    apply(0.8);
    readout.textContent = `Cutoff ${MOODS[id].hz.toLocaleString()} Hz`;
  }, current);
  const box = h('div', { class: 'screen', style: 'height:220px' });
  root.append(box);
  const readout = h('p', { class: 'note' }, `Cutoff ${MOODS.far.hz.toLocaleString()} Hz`);
  root.append(readout);
  toolbar(root, play, picker);
  const { ctx: g, size } = canvas2d(box);
  box.firstElementChild!.setAttribute('style', 'width:100%;height:100%');
  const N = 160;
  const freqs = new Float32Array(N).map((_, i) => 20 * Math.pow(1000, i / (N - 1)));
  const mag = new Float32Array(N);
  const ph = new Float32Array(N);
  const spare = ctx0();
  function ctx0() {
    // An offline filter so the curve draws before anything plays.
    const o = new OfflineAudioContext(1, 1, 44100);
    return o.createBiquadFilter();
  }
  let shownHz: number = MOODS.far.hz;
  let bins = new Uint8Array(1024);
  whileVisible(box, (dt) => {
    const { width: W, height: H } = size();
    g.clearRect(0, 0, W, H);
    const pad = { l: 34, r: 8, t: 8, b: 22 };
    const px = (f: number) => pad.l + (Math.log10(f / 20) / 3) * (W - pad.l - pad.r);
    const py = (db: number) => pad.t + ((6 - db) / 54) * (H - pad.t - pad.b);
    g.strokeStyle = LINE;
    g.fillStyle = INK3;
    g.font = '11px ui-monospace, monospace';
    g.lineWidth = 1;
    for (const f of [20, 100, 1000, 10000, 20000]) {
      g.beginPath();
      g.moveTo(px(f), pad.t);
      g.lineTo(px(f), H - pad.b);
      g.stroke();
      g.fillText(f >= 1000 ? `${f / 1000}k` : String(f), px(f) - (f === 20000 ? 22 : 6), H - 6);
    }
    for (const db of [0, -24, -48]) {
      g.beginPath();
      g.moveTo(pad.l, py(db));
      g.lineTo(W - pad.r, py(db));
      g.stroke();
      g.fillText(`${db}dB`, 0, py(db) + 4);
    }
    // The live spectrum, faint, under the curve.
    if (analyser && ctx && !el.paused) {
      if (bins.length !== analyser.frequencyBinCount) bins = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(bins);
      g.fillStyle = '#2495d640';
      const ny = ctx.sampleRate / 2;
      for (let i = 1; i < bins.length; i += 2) {
        const f = (i / bins.length) * ny;
        if (f < 20) continue;
        const v = bins[i] / 255;
        const x0 = px(f);
        g.fillRect(x0, py(-48 + v * 50), 2, H - pad.b - py(-48 + v * 50));
      }
    }
    // The filter's response: from the live filter while playing, else eased toward the pick.
    const f = filter && ctx ? filter : spare;
    if (f === spare) {
      shownHz += (MOODS[current].hz - shownHz) * Math.min(1, dt * 5);
      spare.frequency.value = shownHz;
    }
    f.getFrequencyResponse(freqs, mag, ph);
    const level = MOODS[current].level;
    g.beginPath();
    for (let i = 0; i < N; i++) {
      const db = Math.max(-54, 20 * Math.log10(mag[i] * level));
      i ? g.lineTo(px(freqs[i]), py(db)) : g.moveTo(px(freqs[i]), py(db));
    }
    g.strokeStyle = PINK;
    g.lineWidth = 2;
    g.stroke();
  });
}

// ── 5. Crowds ────────────────────────────────────────────────────────────────────────────
function crowd(root: HTMLElement) {
  const grid = h('div', { class: 'crowd-grid' });
  const items: [string, string, string][] = [
    ['/thoughts/birthday/versions/crowd-1-wave.jpg', 'Before', ''],
    ['/thoughts/birthday/versions/crowd-4-photo.jpg', 'After', ''],
  ];
  for (const [src, title, said] of items) {
    const img = h('img', { src, alt: title, loading: 'lazy' });
    const fig = h('figure', {}, img, h('figcaption', {}, title));
    img.onerror = () => fig.remove();
    grid.append(fig);
  }
  root.append(grid);
}

// ── 6. The finale in the song ────────────────────────────────────────────────────────────
type Cut = { sha: string; name: string; start: number; open?: number; drop?: number; hit: number; next: string };
const CUTS: Cut[] = [
  { sha: 'f5ad7a1', name: 'First try', start: 20.14, drop: 21.94, hit: 24.25, next: 'no but the drums need to end at the explosion … the disco ball needs to open at almost exactly 0:23' },
  { sha: '923b09c', name: 'Earlier, more room', start: 17, open: 19.2, drop: 21.94, hit: 23, next: 'ok yes yes yes but we need more movement' },
  { sha: 'today', name: 'Final', start: 18.4, open: 19.7, drop: 21.5, hit: 23, next: 'Starts at 0:18.40, takes off immediately, and bursts on the hit at 0:23.' },
];
function waveWidget(root: HTMLElement) {
  let cut = CUTS[CUTS.length - 1];
  const el = new Audio('/thoughts/birthday/finale.m4a');
  el.preload = 'none';
  // The trimmed finale starts at 0:18.40, so an earlier cut plays from the top of the file.
  const IN = 18.4;
  const play = h('button', { class: 'chip play', type: 'button', 'aria-pressed': 'false' }, '▶ Play');
  const stop = () => {
    el.pause();
    play.textContent = '▶ Play';
    play.setAttribute('aria-pressed', 'false');
  };
  play.onclick = () => {
    if (!el.paused) return stop();
    el.currentTime = Math.max(0, cut.start - IN);
    void el.play();
    play.textContent = '■ Stop';
    play.setAttribute('aria-pressed', 'true');
  };
  el.onended = stop;
  el.ontimeupdate = () => el.currentTime > cut.hit - IN + 1.2 && stop();
  const box = h('div', { class: 'screen', style: 'height:210px' });
  const said = h('blockquote', {});
  const meta = h('p', { class: 'note' });
  root.append(box);
  const picker = chips(root, CUTS.map((c) => ({ id: String(CUTS.indexOf(c)), label: c.name })), (id) => {
    cut = CUTS[Number(id)];
    if (!el.paused) stop();
    tell();
  }, String(CUTS.length - 1));
  root.append(meta, h('div', { class: 'said' }, said));
  toolbar(root, play, picker);
  const tell = () => {
    said.textContent = cut.next;
    said.style.setProperty('--who', '');
    const parts = [`starts ${fmt(cut.start)}`, cut.open && `tunnel opens ${fmt(cut.open)}`, cut.drop && `ball drops ${fmt(cut.drop)}`, `bursts ${fmt(cut.hit)}`].filter(Boolean);
    meta.textContent = parts.join(' · ');
    said.style.display = cut.sha === 'today' ? 'none' : 'block';
  };
  const fmt = (t: number) => `0:${t.toFixed(2).padStart(5, '0')}`;
  tell();
  const { ctx: g, size } = canvas2d(box);
  box.firstElementChild!.setAttribute('style', 'width:100%;height:100%');
  const BEAT = 60 / 117.45;
  let shown = { start: cut.start, hit: cut.hit, open: cut.open ?? 0, drop: cut.drop ?? 0 };
  whileVisible(box, (dt) => {
    const { width: W, height: H } = size();
    const pad = { l: 4, r: 4, t: 26, b: 24 };
    const x = (t: number) => pad.l + ((t - wave.start) / wave.dur) * (W - pad.l - pad.r);
    const mid = pad.t + (H - pad.t - pad.b) / 2;
    const amp = (H - pad.t - pad.b) / 2;
    const k = Math.min(1, dt * 10);
    shown = {
      start: shown.start + (cut.start - shown.start) * k,
      hit: shown.hit + (cut.hit - shown.hit) * k,
      open: shown.open + ((cut.open ?? 0) - shown.open) * k,
      drop: shown.drop + ((cut.drop ?? 0) - shown.drop) * k,
    };
    g.clearRect(0, 0, W, H);
    // Selected window.
    g.fillStyle = '#e83d971f';
    g.fillRect(x(shown.start), pad.t - 4, x(shown.hit) - x(shown.start), H - pad.t - pad.b + 8);
    // Beat grid.
    g.strokeStyle = LINE;
    g.lineWidth = 1;
    for (let b = 17.34 - BEAT * 7; b < wave.start + wave.dur; b += BEAT) {
      if (b < wave.start) continue;
      g.beginPath();
      g.moveTo(x(b), pad.t);
      g.lineTo(x(b), H - pad.b);
      g.stroke();
    }
    // Waveform.
    const n = wave.peaks.length;
    const bw = (W - pad.l - pad.r) / n;
    for (let i = 0; i < n; i++) {
      const t = wave.start + (i / n) * wave.dur;
      const inside = t >= shown.start && t <= shown.hit;
      g.fillStyle = inside ? PINK : '#3b3a40';
      const a = wave.peaks[i] * amp;
      g.fillRect(pad.l + i * bw, mid - a, Math.max(1, bw - 0.6), a * 2);
    }
    // Markers.
    const mark = (t: number, label: string, color: string, row: number) => {
      if (!t) return;
      g.strokeStyle = color;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x(t), pad.t - 4);
      g.lineTo(x(t), H - pad.b + 4);
      g.stroke();
      g.fillStyle = INK;
      g.font = '600 11px Helvetica, Arial, sans-serif';
      const tw = g.measureText(label).width;
      g.fillText(label, Math.min(W - tw - 2, Math.max(2, x(t) - tw / 2)), 10 + row * 12);
    };
    mark(shown.start, 'in', INK, 0);
    mark(shown.open, 'opens', BLUE, 1);
    mark(shown.drop, 'drop', BLUE, 0);
    mark(shown.hit, 'burst', PINK, 1);
    // Axis.
    g.fillStyle = INK3;
    g.font = '11px ui-monospace, monospace';
    for (let t = Math.ceil(wave.start); t <= wave.start + wave.dur; t++) g.fillText(`0:${t}`, x(t) - 10, H - 6);
    // Playhead.
    if (!el.paused) {
      const t = IN + el.currentTime;
      g.fillStyle = INK;
      g.fillRect(x(t) - 1, pad.t - 6, 2, H - pad.t - pad.b + 12);
    }
  });
}

// ── 7. The flight ────────────────────────────────────────────────────────────────────────
function flight(root: HTMLElement) {
  let f: Flight = FLIGHTS[FLIGHTS.length - 1];
  const chartBox = h('div', { class: 'screen', style: 'height:280px' });
  const tunnelBox = h('div', { class: 'tunnel' });
  const clock = h('span', { class: 't' }, '');
  tunnelBox.append(clock);
  const said = h('blockquote', {});
  const did = h('p', {});
  root.append(h('div', { class: 'flight-grid' }, h('div', {}, chartBox, h('div', { class: 'said' }, said)), tunnelBox));
  toolbar(root, chips(root, FLIGHTS.map((v, i) => ({ id: String(i), label: v.name })), (id) => {
    f = FLIGHTS[Number(id)];
    t = f.start - 0.4;
    tell();
  }, String(FLIGHTS.length - 1)));
  const tell = () => {
    said.textContent = f.heard;
  };
  tell();
  // Distance tables, so the tunnel can fly any version at 60fps.
  const tables = new Map<Flight, Float32Array>();
  const dist = (v: Flight, at: number) => {
    let tb = tables.get(v);
    if (!tb) {
      tb = new Float32Array(Math.ceil((v.stop - v.start) / 0.01) + 2);
      for (let i = 0; i < tb.length; i++) tb[i] = distance(v, v.start + i * 0.01);
      tables.set(v, tb);
    }
    const i = Math.min(tb.length - 1, Math.max(0, (at - v.start) / 0.01));
    const a = Math.floor(i);
    return tb[a] + (tb[Math.min(tb.length - 1, a + 1)] - tb[a]) * (i - a);
  };
  const T0 = 16.8;
  const T1 = 23.4;
  const { ctx: g, size } = canvas2d(chartBox);
  chartBox.firstElementChild!.setAttribute('style', 'width:100%;height:100%');
  const tun = canvas2d(tunnelBox);
  let t = f.start - 0.4;
  whileVisible(root, (dt) => {
    t += reduced ? 0 : dt;
    if (t > f.stop + 0.9) t = f.start - 0.4;
    // Chart.
    const { width: W, height: H } = size();
    const pad = { l: 34, r: 8, t: 10, b: 24 };
    const x = (s: number) => pad.l + ((s - T0) / (T1 - T0)) * (W - pad.l - pad.r);
    const y = (v: number) => pad.t + (1 - v / 36) * (H - pad.t - pad.b);
    g.clearRect(0, 0, W, H);
    g.strokeStyle = LINE;
    g.fillStyle = INK3;
    g.font = '11px ui-monospace, monospace';
    g.lineWidth = 1;
    for (const v of [0, 10, 20, 30]) {
      g.beginPath();
      g.moveTo(pad.l, y(v));
      g.lineTo(W - pad.r, y(v));
      g.stroke();
      g.fillText(String(v), 6, y(v) + 4);
    }
    for (let s = 17; s <= 23; s++) g.fillText(`0:${s}`, x(s) - 12, H - 6);
    for (const v of FLIGHTS) {
      const on = v === f;
      g.beginPath();
      for (let s = T0, i = 0; s <= T1; s += 0.01, i++) {
        const sp = s < v.start ? (v === FLIGHTS[FLIGHTS.length - 1] ? 1 : v.speed(v.start)) : s > v.stop ? 0 : v.speed(s);
        i ? g.lineTo(x(s), y(sp)) : g.moveTo(x(s), y(sp));
      }
      g.strokeStyle = on ? PINK : '#2495d655';
      g.lineWidth = on ? 2.5 : 1.25;
      g.stroke();
    }
    const now = Math.min(f.stop, Math.max(f.start, t));
    g.fillStyle = INK;
    g.fillRect(x(now) - 1, pad.t, 2, H - pad.t - pad.b);
    g.beginPath();
    g.arc(x(now), y(f.speed(now)), 5, 0, Math.PI * 2);
    g.fillStyle = PINK;
    g.fill();
    g.strokeStyle = '#111113';
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = INK3;
    g.fillText('speed', pad.l + 4, pad.t + 12);
    // Tunnel: rings every 1.6 units, seen from the camera's distance along it.
    const { width: TW, height: TH } = tun.size();
    const c = tun.ctx;
    c.fillStyle = '#000';
    c.fillRect(0, 0, TW, TH);
    const d = dist(f, now);
    const focal = Math.min(TW, TH) * 0.9;
    const GAP = 1.6;
    const first = Math.floor(d / GAP) + 1;
    for (let k = first + 70; k >= first; k--) {
      const z = k * GAP - d;
      if (z < 0.25) continue;
      const r = (2.4 * focal) / z / 2;
      const fade = Math.min(1, 6 / z) * Math.min(1, (z - 0.25) * 2);
      const hue = (k * 23) % 360;
      c.strokeStyle = `hsla(${hue}, 85%, 62%, ${fade})`;
      c.lineWidth = Math.max(1, 6 / z);
      c.beginPath();
      // Panels: a ring of short arcs, turned with the tunnel's spin.
      const spin = k * 0.2 + now * 0.6;
      for (let p = 0; p < 12; p++) {
        const a0 = spin + (p / 12) * Math.PI * 2;
        c.moveTo(TW / 2 + Math.cos(a0) * r, TH / 2 + Math.sin(a0) * r);
        c.arc(TW / 2, TH / 2, r, a0, a0 + (Math.PI * 2) / 12 - 0.12);
      }
      c.stroke();
    }
    clock.textContent = `0:${now.toFixed(2)} · speed ${f.speed(now).toFixed(1)}`;
  });
}

// ── 8. Make a hitch ──────────────────────────────────────────────────────────────────────
function hitch(root: HTMLElement) {
  const box = h('div', { class: 'canvas-box' });
  const controls = h('div', { class: 'controls' });
  root.append(h('div', { class: 'split' }, box, controls));
  const { renderer, scene, camera } = stage(box);
  scene.add(new THREE.HemisphereLight('#ffd6ec', '#1b1830', 1.2));
  const sun = new THREE.DirectionalLight('#ffffff', 2);
  sun.position.set(2, 3, 4);
  scene.add(sun);
  const group = new THREE.Group();
  scene.add(group);
  const frames = canvas2d(controls, 'frames');
  const times: number[] = [];
  const result = h('p', { class: 'note' }, '');
  let worst = 0;
  let n = 0;
  // Every object gets a material the GPU has never seen: a physical material with its own shader variant.
  const fresh = () => {
    n++;
    const m = new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setHSL((n * 0.13) % 1, 0.7, 0.6), roughness: 0.3, clearcoat: 1, sheen: 1, iridescence: 1, transmission: 0.2, thickness: 0.5 });
    const salt = `${n}_${Math.random().toString(36).slice(2)}`;
    m.customProgramCacheKey = () => salt;
    m.onBeforeCompile = (sh) => {
      sh.fragmentShader = `// variant ${salt}\n` + sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>\n gl_FragColor.rgb *= ${(0.9 + Math.random() * 0.1).toFixed(4)};`);
    };
    const mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(0.28, 0.1, 96, 12), m);
    mesh.position.set((Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 1.2);
    return mesh;
  };
  const cold = h('button', { class: 'chip', type: 'button' }, 'Add a new shape');
  const warm = h('button', { class: 'chip', type: 'button' }, 'Add one, compiled first');
  const clear = h('button', { class: 'chip', type: 'button' }, 'Clear');
  let watch = '';
  cold.onclick = () => {
    worst = 0;
    watch = 'cold';
    group.add(fresh());
  };
  let upfront = 0;
  warm.onclick = () => {
    const mesh = fresh();
    // Compile it now, while it isn't on screen yet: in the show this happens behind the loader.
    const t0 = performance.now();
    renderer.compile(mesh, camera, scene);
    upfront = performance.now() - t0;
    result.innerHTML = `Compiled up front: <b>${Math.round(upfront)} ms</b>`;
    setTimeout(() => {
      worst = 0;
      since = 0;
      watch = 'warm';
      group.add(mesh);
    }, 900);
  };
  clear.onclick = () => {
    group.clear();
    worst = 0;
  };
  controls.append(h('div', { class: 'row' }, cold, warm, clear), result);
  // Start with one shape on screen, compiled while the page loaded.
  const first = fresh();
  first.position.set(0, 0, 0);
  renderer.compile(first, camera, scene);
  group.add(first);
  let last = performance.now();
  let since = 0;
  whileVisible(box, () => {
    const now = performance.now();
    const ft = now - last;
    last = now;
    times.push(ft);
    if (times.length > 180) times.shift();
    group.rotation.y += 0.01;
    group.children.forEach((m, i) => (m.rotation.x += 0.01 + i * 0.001));
    renderer.render(scene, camera);
    if (watch) {
      worst = Math.max(worst, ft);
      if (++since > 20) {
        result.innerHTML =
          watch === 'cold'
            ? `Worst frame <b>${Math.round(worst)} ms</b>`
            : `Compiled up front: ${Math.round(upfront)} ms · worst frame <b>${Math.round(worst)} ms</b>`;
        watch = '';
        since = 0;
      }
    }
    // Frame-time chart.
    const { width: W, height: H } = frames.size();
    const c = frames.ctx;
    c.clearRect(0, 0, W, H);
    const y = (ms: number) => H - 6 - (Math.min(ms, 120) / 120) * (H - 12);
    c.strokeStyle = LINE;
    c.beginPath();
    c.moveTo(0, y(16.7));
    c.lineTo(W, y(16.7));
    c.stroke();
    c.fillStyle = INK3;
    c.font = '11px ui-monospace, monospace';
    c.fillText('16 ms', 6, y(16.7) - 4);
    c.fillText('frame time', 6, 14);
    const bw = W / 180;
    times.forEach((ms, i) => {
      c.fillStyle = ms > 34 ? PINK : BLUE;
      c.fillRect(i * bw, y(ms), Math.max(1, bw - 1), H - 6 - y(ms));
    });
  });
}

// ── 9. The race inside one tap ───────────────────────────────────────────────────────────
function race(root: HTMLElement) {
  const END = 3;
  const CUT = 2.5;
  const START = 0.3; // when the iPhone actually starts playback
  let fixed = false;
  let t = CUT;
  const picker = chips(root, [
    { id: 'bug', label: 'Before the fix' },
    { id: 'fix', label: 'After the fix' },
  ], (id) => {
    fixed = id === 'fix';
    replay();
  }, 'bug');
  // Play runs the three seconds in slow motion; dragging the slider takes over.
  const play = h('button', { class: 'chip play', type: 'button' }, '▶ Replay');
  let raf = 0;
  const replay = () => {
    cancelAnimationFrame(raf);
    const t0 = performance.now();
    const step = (now: number) => {
      t = Math.min(END, ((now - t0) / 1000) * 0.6);
      input.value = String(t);
      draw();
      if (t < END) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
  play.onclick = replay;
  const lane = (label: string) => {
    const track = h('div', { class: 'track' });
    root.querySelector('.lanes')!.append(h('div', { class: 'lane' }, h('span', {}, label), track));
    return track;
  };
  root.append(h('div', { class: 'lanes' }));
  const code = lane('Our code');
  const song = lane('Finale song');
  const fly = lane('The flight');
  const input = h('input', { type: 'range', min: '0', max: String(END), step: '0.01', value: String(t), 'aria-label': 'Seconds after the tap' }) as HTMLInputElement;
  const at = h('output', {}, '');
  root.append(h('label', { class: 'slider', style: 'margin-top:14px' }, 'After the tap', input, at));
  const out = h('div', { class: 'readout' });
  root.append(out);
  toolbar(root, play, picker);
  input.oninput = () => {
    cancelAnimationFrame(raf);
    t = Number(input.value);
    draw();
  };
  const pct = (s: number) => `${(s / END) * 100}%`;
  function draw() {
    at.textContent = `${t.toFixed(2)} s`;
    const events: [number, string][] = fixed
      ? [
          [0, 'tap: play()'],
          [0.04, 'pause()'],
          [START, "'playing': pause + rewind"],
          [CUT, 'cut: play from 0'],
        ]
      : [
          [0, 'tap: play()'],
          [0.04, 'promise resolves: pause()'],
          [CUT, 'cut'],
        ];
    code.replaceChildren(
      ...events
        .filter(([s]) => s <= t)
        .flatMap(([s, label], i, all) => {
          const ev = h('div', { class: 'ev', style: `left:${pct(s)}` });
          const lbl = h('div', { class: 'lbl', style: s > END * 0.6 ? 'right:8px' : `left:${pct(s)}` }, i === all.length - 1 ? label : '');
          return [ev, lbl];
        }),
    );
    // The song: on the bug path it starts at 0.3 s and runs on silently until the cut.
    const pos = (now: number) => (fixed ? Math.max(0, now - CUT) : Math.max(0, now - START));
    const running = fixed ? t > CUT : t > START;
    const from = fixed ? CUT : START;
    song.replaceChildren(...(running ? [h('div', { class: 'bar', style: `left:${pct(from)};width:${pct(t - from)}` }), h('div', { class: 'lbl', style: `left:${pct(from)}` }, `song at ${pos(t).toFixed(2)} s${!fixed && t < CUT ? ' (nobody hears it)' : ''}`)] : []));
    const atCut = fixed ? 0 : CUT - START;
    fly.replaceChildren(...(t >= CUT ? [h('div', { class: 'bar', style: `left:${pct(CUT)};width:${pct(t - CUT)};background:linear-gradient(180deg,#f06aae,#e83d97)` }), h('div', { class: 'lbl', style: 'right:8px' }, fixed ? 'takes off from the start' : `starts ${atCut.toFixed(1)} s into its 4.6 s`)] : []));
    out.replaceChildren(
      h('div', { class: fixed ? '' : 'bad' }, h('b', {}, `${atCut.toFixed(2)} s`), h('span', {}, 'this demo')),
      h('div', { class: 'bad' }, h('b', {}, '2.215 s'), h('span', {}, 'iPhone, before')),
      h('div', {}, h('b', {}, '0.000 s'), h('span', {}, 'iPhone, after')),
    );
  }
  draw();
}

export { timeline, tickets, ball, mood, crowd, waveWidget as wave, flight, hitch, race };
