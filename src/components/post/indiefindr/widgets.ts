// Figures for the indiefindr rebuild post, mounted by <Widget post="indiefindr" name=… />.
// All of it is the night's real data: the prompts and results from the three bb threads, the
// compare pages' picks, the scores from the reports, and Steam's tag votes run through Fable's
// own recipe (votes/top ^ p × IDF ^ q, L2-normalised).
import data from './data.json';

type Lane = 'bt' | 'sol' | 'fable';
type Event = { m: number; lane: Lane; who: string; kind: 'prompt' | 'result'; text: string };

function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...kids: (Node | string)[]) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  e.append(...kids);
  return e;
}
function chips<T extends string>(items: { id: T; label: string }[], pick: (id: T) => void, initial: T) {
  const row = h('div', { class: items.length <= 3 ? 'seg fill' : 'seg', role: 'group' });
  const buttons = items.map((it) => {
    const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': String(it.id === initial) }, it.label);
    b.onclick = () => {
      buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      pick(it.id);
    };
    row.append(b);
    return b;
  });
  return row;
}
/** The widget's own accent, so this post doesn't borrow the birthday pink. */
const theme = (root: HTMLElement) => root.closest('.widget')?.classList.add('indie');

// ── The night ───────────────────────────────────────────────────────────────────────────
// Three lanes: what I typed, and what Sol and Fable were doing with the coordinator's briefs.
// Minutes are since 03:00 UTC, which was 8:00 PM my time.
function timeline(root: HTMLElement) {
  theme(root);
  const events = data.timeline as Event[];
  const START = 10;
  const END = 230;
  const lanes: { id: Lane; label: string }[] = [
    { id: 'bt', label: 'Me' },
    { id: 'sol', label: 'Sol' },
    { id: 'fable', label: 'Fable' },
  ];
  const clock = (m: number) => {
    const total = 20 * 60 + Math.round(m);
    const hr = Math.floor(total / 60);
    return `${hr > 12 ? hr - 12 : hr}:${String(total % 60).padStart(2, '0')} PM`;
  };
  const x = (m: number) => ((m - START) / (END - START)) * 100;

  const when = h('span', {});
  const who = h('span', { class: 'chapter' });
  const count = h('span', { class: 'count' });
  const text = h('p', { class: 'tl-text' });
  const chart = h('div', { class: 'if-lanes', tabindex: '0', role: 'slider', 'aria-label': 'Event', 'aria-valuemin': '1', 'aria-valuemax': String(events.length) });
  const cursor = h('i', { class: 'if-cursor' });
  const dots: HTMLElement[] = [];
  for (const lane of lanes) {
    const row = h('div', { class: 'if-lane' }, h('span', { class: 'if-lane-name' }, lane.label));
    const track = h('div', { class: 'if-track' });
    events.forEach((e, i) => {
      if (e.lane !== lane.id) return;
      const dot = h('i', { class: `if-dot ${e.kind}`, style: `left:${x(e.m)}%` });
      dots[i] = dot;
      track.append(dot);
    });
    row.append(track);
    chart.append(row);
  }
  const axis = h('div', { class: 'if-axis' });
  for (const m of [60, 120, 180]) axis.append(h('span', { style: `left:${x(m)}%` }, clock(m).replace(':00', '')));
  chart.append(cursor, axis);
  const legend = h('div', { class: 'if-legend' }, h('span', {}, h('i', { class: 'if-dot prompt' }), 'a prompt'), h('span', {}, h('i', { class: 'if-dot result' }), 'a result'));
  root.append(h('div', { class: 'tl-read' }, h('div', { class: 'tl-meta' }, when, who, count), text), chart, legend);
  const mine = events.filter((e) => e.lane === 'bt' && e.kind === 'prompt').length;
  root.append(h('p', { class: 'caption' }, `${mine} prompts from me between the handoff and "full send". I never typed into Sol or Fable. Drag across to read it all.`));

  let at = 0;
  const show = (i: number) => {
    at = Math.max(0, Math.min(events.length - 1, i));
    const e = events[at];
    when.textContent = clock(e.m);
    who.textContent = e.who;
    count.textContent = `${at + 1} / ${events.length}`;
    text.textContent = e.text;
    text.classList.toggle('result', e.kind === 'result');
    dots.forEach((d, k) => d?.classList.toggle('on', k === at));
    cursor.style.left = `calc(var(--name) + (100% - var(--name)) * ${x(e.m) / 100})`;
    chart.setAttribute('aria-valuenow', String(at + 1));
  };
  const nearest = (clientX: number) => {
    const r = chart.querySelector('.if-track')!.getBoundingClientRect();
    const m = START + ((clientX - r.left) / r.width) * (END - START);
    let best = 0;
    events.forEach((e, k) => Math.abs(e.m - m) < Math.abs(events[best].m - m) && (best = k));
    return best;
  };
  chart.style.touchAction = 'pan-y';
  let down = false;
  chart.addEventListener('pointerdown', (e) => {
    down = true;
    chart.setPointerCapture(e.pointerId);
    show(nearest(e.clientX));
  });
  chart.addEventListener('pointermove', (e) => (down || e.pointerType === 'mouse') && show(nearest(e.clientX)));
  chart.addEventListener('pointerup', () => (down = false));
  chart.addEventListener('pointercancel', () => (down = false));
  chart.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(at + 1);
    else if (e.key === 'ArrowLeft') show(at - 1);
    else return;
    e.preventDefault();
  });
  show(0);
}

// ── The answer key vs the models ────────────────────────────────────────────────────────────
function picks(root: HTMLElement) {
  theme(root);
  type Pick = (typeof data.picks)[number];
  let seed: Pick = data.picks[0];
  let model: 'merged' | 'fable' = 'merged';
  const art = h('img', { class: 'if-seed-art', alt: '' }) as HTMLImageElement;
  const name = h('b', {});
  const note = h('span', {});
  const cols = h('div', { class: 'if-cols' });
  const seeds = chips(
    data.picks.map((p) => ({ id: p.seed, label: p.seed })),
    (id) => {
      seed = data.picks.find((p) => p.seed === id)!;
      draw();
    },
    seed.seed,
  );
  const models = chips(
    [
      { id: 'merged', label: 'Merged' },
      { id: 'fable', label: 'Fable' },
    ],
    (id) => {
      model = id as typeof model;
      draw();
    },
    model,
  );
  root.append(
    h('div', { class: 'toolbar' }, seeds),
    h('div', { class: 'if-seed' }, art, h('div', { class: 'title' }, name, note), models),
    cols,
    h('p', { class: 'caption' }, 'Highlighted: a game both lists picked. These seeds were in the training split, which flatters every model a bit.'),
  );
  const list = (title: string, sub: string, items: [string, boolean][]) =>
    h(
      'div',
      { class: 'if-col' },
      h('div', { class: 'if-col-head' }, h('b', {}, title), h('span', {}, sub)),
      h('ol', {}, ...items.map(([t, hit]) => h('li', hit ? { class: 'hit' } : {}, t))),
    );
  function draw() {
    const theirs = seed[model] as [string, boolean][];
    const found = new Set(theirs.filter(([, hit]) => hit).map(([t]) => t));
    art.src = `/thoughts/indiefindr/seeds/${seed.appid}.jpg`;
    name.textContent = `Games like ${seed.seed}`;
    note.textContent = `${found.size} of 10 in common`;
    cols.replaceChildren(
      list('The answer key', 'the old LLM pipeline', seed.golden.map((t) => [t, found.has(t)])),
      list(model === 'merged' ? 'The merged model' : "Fable's model", model === 'merged' ? 'free, precomputed' : 'every number hand-typed', theirs),
    );
  }
  draw();
}

// ── The ladder ────────────────────────────────────────────────────────────────────────────
function ladder(root: HTMLElement) {
  theme(root);
  const rows: { label: string; who: string; recall: number; skew?: number; best?: boolean }[] = [
    { label: '10 random games', who: 'expected', recall: 0.04 },
    { label: 'Most popular games', who: 'baseline', recall: 0.1, skew: 824 },
    { label: 'Off-the-shelf embeddings', who: 'Sol', recall: 5.6, skew: 0.05 },
    { label: 'Fine-tuned embeddings', who: 'Sol', recall: 9.4, skew: 0.07 },
    { label: 'Steam tags', who: 'Sol', recall: 14.4, skew: 0.07 },
    { label: 'Tags + ranking model', who: 'Sol', recall: 15.9, skew: 1.2 },
    { label: 'Hand-written', who: 'Fable', recall: 18.3, skew: 0.67 },
    { label: 'Merged', who: 'Sol + Fable', recall: 20.8, skew: 0.78, best: true },
  ];
  let mode: 'recall' | 'skew' = 'recall';
  const list = h('div', { class: 'if-ladder' });
  const caption = h('p', { class: 'caption' });
  root.append(
    h(
      'div',
      { class: 'toolbar' },
      chips(
        [
          { id: 'recall', label: 'Recall@10' },
          { id: 'skew', label: 'How mainstream' },
        ],
        (id) => {
          mode = id as typeof mode;
          draw();
        },
        mode,
      ),
    ),
    list,
    caption,
  );
  // Mainstream is a ratio, so it's drawn on a log scale with the LLM's picks at 1×.
  const LO = Math.log10(0.02);
  const HI = Math.log10(1000);
  const logX = (v: number) => ((Math.log10(v) - LO) / (HI - LO)) * 100;
  function draw() {
    list.replaceChildren(
      ...rows.map((r) => {
        const v = mode === 'recall' ? r.recall : r.skew;
        const bar = h('div', { class: 'if-bar' });
        if (v !== undefined) {
          const w = mode === 'recall' ? (v / 25) * 100 : logX(v);
          bar.append(h('i', { style: `width:${Math.max(0.6, w)}%` }));
        }
        if (mode === 'skew') bar.append(h('u', { style: `left:${logX(1)}%` }));
        const value = v === undefined ? 'n/a' : mode === 'recall' ? `${v}%` : `${v}×`;
        return h('div', { class: `if-row${r.best ? ' best' : ''}` }, h('span', { class: 'if-label' }, r.label, h('small', {}, r.who)), bar, h('output', {}, value));
      }),
    );
    caption.textContent =
      mode === 'recall'
        ? 'How many of the LLM’s 10 picks land in the model’s top 10, on 1,730 games nothing was tuned on.'
        : 'Median review count of a model’s picks, relative to the LLM’s picks (the line). Under 1× is less mainstream. Log scale.';
  }
  draw();
}

// ── Flattening ──────────────────────────────────────────────────────────────────────────
// One game's 20 Steam tags as a vector: linear votes × IDF, or Fable's votes^0.3 × IDF^0.5.
function flatten(root: HTMLElement) {
  theme(root);
  const games = data.tags as Record<string, { tags: string[]; votes: number[]; linear: number[]; flat: number[] }>;
  let game = Object.keys(games)[0];
  let mode: 'linear' | 'flat' = 'linear';
  const bars = h('div', { class: 'if-tags' });
  const share = h('p', { class: 'note' });
  root.append(
    h(
      'div',
      { class: 'toolbar' },
      chips(
        [
          { id: 'linear', label: 'Linear' },
          { id: 'flat', label: 'Flattened' },
        ],
        (id) => {
          mode = id as typeof mode;
          draw();
        },
        mode,
      ),
      chips(
        Object.keys(games).map((g) => ({ id: g, label: g })),
        (id) => {
          game = id;
          draw(true);
        },
        game,
      ),
    ),
    bars,
    share,
    h('p', { class: 'caption' }, 'Bar length is each tag’s weight in the vector the model compares, scaled to the biggest one.'),
  );
  function draw(rebuild = false) {
    const g = games[game];
    const v = g[mode];
    const max = Math.max(...v);
    // Biggest first, so the shape of the profile is what you see.
    const order = v.map((_, i) => i).sort((a, b) => v[b] - v[a]);
    if (rebuild || bars.childElementCount !== g.tags.length) {
      bars.replaceChildren(...g.tags.map((t, i) => h('div', { class: 'if-tag', 'data-i': String(i) }, h('span', {}, t), h('div', { class: 'if-bar' }, h('i', {})))));
    }
    const els = [...bars.children] as HTMLElement[];
    for (const el of els) {
      const i = Number(el.dataset.i);
      el.style.order = String(order.indexOf(i));
      (el.querySelector('i') as HTMLElement).style.width = `${(v[i] / max) * 100}%`;
    }
    const top3 = order.slice(0, 3).reduce((s, i) => s + v[i] * v[i], 0);
    share.innerHTML = `Top three tags: <b>${Math.round(top3 * 100)}%</b> of the vector. ${mode === 'linear' ? 'Three tags out of twenty carry nearly half of it.' : 'Much closer to even: the whole profile gets a say.'}`;
  }
  draw(true);
}

export { timeline, picks, ladder, flatten };
