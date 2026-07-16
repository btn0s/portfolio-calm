export type SynthSoundName =
  | "ambientArtifacts"
  | "ambientGlobal"
  | "ambientHome"
  | "ambientThoughts"
  | "click"
  | "clickOriginal"
  | "drop"
  | "introArtifacts"
  | "introHome"
  | "introThoughts"
  | "paperRustle"
  | "partyHorn"
  | "swipeBackward"
  | "swipeForward";

type AudioContextConstructor = typeof AudioContext;

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (context) return context;
  if (typeof window === "undefined") return null;

  const Constructor =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext;

  if (!Constructor) return null;

  try {
    context = new Constructor();
  } catch {
    return null;
  }

  return context;
}

function envelope(
  parameter: AudioParam,
  start: number,
  attack: number,
  peak: number,
  release: number,
) {
  parameter.setValueAtTime(0.0001, start);
  parameter.exponentialRampToValueAtTime(peak, start + attack);
  parameter.exponentialRampToValueAtTime(0.0001, start + attack + release);
}

function tone(
  audioContext: BaseAudioContext,
  destination: AudioNode,
  options: {
    start: number;
    frequency: number;
    endFrequency?: number;
    attack?: number;
    release: number;
    peak: number;
    type?: OscillatorType;
  },
) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const attack = options.attack ?? 0.003;
  const end = options.start + attack + options.release;

  oscillator.type = options.type ?? "sine";
  oscillator.frequency.setValueAtTime(options.frequency, options.start);
  if (options.endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, end);
  }
  envelope(gain.gain, options.start, attack, options.peak, options.release);
  oscillator.connect(gain).connect(destination);
  oscillator.start(options.start);
  oscillator.stop(end + 0.03);
}

function sustainedHorn(
  audioContext: BaseAudioContext,
  destination: AudioNode,
  start: number,
) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const settle = start + 0.38;
  const release = start + 1.27;

  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(311, start);
  oscillator.frequency.exponentialRampToValueAtTime(233, settle);
  oscillator.frequency.setValueAtTime(233, release);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.4, start + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.16, settle);
  gain.gain.exponentialRampToValueAtTime(0.095, release);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.42);

  oscillator.connect(gain).connect(destination);
  oscillator.start(start);
  oscillator.stop(start + 1.45);
}

function noiseBuffer(
  audioContext: BaseAudioContext,
  seconds: number,
  random: () => number,
) {
  const length = Math.ceil(audioContext.sampleRate * seconds);
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const channel = buffer.getChannelData(0);
  let previous = 0;

  for (let index = 0; index < length; index += 1) {
    const white = random() * 2 - 1;
    previous = previous * 0.35 + white * 0.65;
    channel[index] = previous;
  }

  return buffer;
}

function noise(
  audioContext: BaseAudioContext,
  destination: AudioNode,
  buffer: AudioBuffer,
  options: {
    start: number;
    attack?: number;
    release: number;
    peak: number;
    frequency: number;
    endFrequency?: number;
    q?: number;
    type?: BiquadFilterType;
    playbackRate?: number;
  },
) {
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  const attack = options.attack ?? 0.004;
  const end = options.start + attack + options.release;

  source.buffer = buffer;
  source.playbackRate.value = options.playbackRate ?? 1;
  filter.type = options.type ?? "bandpass";
  filter.Q.value = options.q ?? 0.8;
  filter.frequency.setValueAtTime(options.frequency, options.start);
  if (options.endFrequency) {
    filter.frequency.exponentialRampToValueAtTime(options.endFrequency, end);
  }
  envelope(gain.gain, options.start, attack, options.peak, options.release);
  source.connect(filter).connect(gain).connect(destination);
  source.start(options.start);
  source.stop(end + 0.03);
}

function paper(
  audioContext: BaseAudioContext,
  destination: AudioNode,
  start: number,
  direction: "forward" | "backward" | "shuffle",
  random: () => number,
  level = 1,
) {
  const duration = direction === "shuffle" ? 1.15 : 0.34;
  const buffer = noiseBuffer(audioContext, duration + 0.1, random);
  const rising = direction !== "backward";

  if (direction === "shuffle") {
    // Real paper has a continuous friction bed with irregular creases riding
    // above it. Keeping the bed alive prevents audible holes between impacts.
    noise(audioContext, destination, buffer, {
      start: start + 0.04,
      attack: 0.14,
      release: 0.42,
      peak: 0.28 * level,
      frequency: 520,
      endFrequency: 1050,
      q: 0.25,
      type: "highpass",
      playbackRate: 0.94,
    });

    const creases = [
      { offset: 0.06, peak: 0.05, release: 0.06, frequency: 1650 },
      { offset: 0.14, peak: 0.075, release: 0.07, frequency: 2100 },
      { offset: 0.22, peak: 0.12, release: 0.08, frequency: 2750 },
      { offset: 0.3, peak: 0.095, release: 0.07, frequency: 1900 },
      { offset: 0.37, peak: 0.19, release: 0.08, frequency: 3350 },
      { offset: 0.44, peak: 0.29, release: 0.075, frequency: 4200 },
      { offset: 0.5, peak: 0.15, release: 0.08, frequency: 2600 },
      { offset: 0.56, peak: 0.22, release: 0.1, frequency: 3600 },
    ];

    for (const crease of creases) {
      noise(audioContext, destination, buffer, {
        start: start + crease.offset + random() * 0.008,
        attack: 0.004 + random() * 0.006,
        release: crease.release,
        peak: crease.peak * 1.55 * level,
        frequency: crease.frequency * 0.34,
        endFrequency: crease.frequency * (0.46 + random() * 0.12),
        q: 0.4,
        type: "highpass",
        playbackRate: 0.88 + random() * 0.28,
      });
    }
    return;
  }

  // A single page movement is a compact friction bed plus staggered creases.
  noise(audioContext, destination, buffer, {
    start,
    attack: 0.045,
    release: 0.29,
    peak: 0.038,
    frequency: rising ? 480 : 1150,
    endFrequency: rising ? 1150 : 420,
    q: 0.3,
    type: "highpass",
  });

  for (let index = 0; index < 5; index += 1) {
    const progress = index / 4;
    const from = rising ? 1150 + progress * 2400 : 3550 - progress * 2400;
    noise(audioContext, destination, buffer, {
      start: start + index * 0.048 + random() * 0.006,
      attack: 0.006,
      release: 0.12,
      peak: 0.035 + Math.sin(progress * Math.PI) * 0.035,
      frequency: from * 0.3,
      endFrequency: rising ? from * 0.44 : Math.max(320, from * 0.2),
      q: 0.35,
      type: "highpass",
      playbackRate: 0.9 + random() * 0.22,
    });
  }
}

function render(
  audioContext: BaseAudioContext,
  destination: AudioNode,
  name: SynthSoundName,
  random: () => number,
) {
  const now = audioContext.currentTime + 0.008;
  const master = audioContext.createGain();
  master.gain.value = 0.52;
  master.connect(destination);

  const shortNoise = noiseBuffer(audioContext, 0.65, random);

  switch (name) {
    case "click":
      [
        { offset: 0.035, release: 0.022, peak: 1.05, frequency: 3100 },
        { offset: 0.058, release: 0.026, peak: 1.25, frequency: 2200 },
        { offset: 0.125, release: 0.023, peak: 1.3, frequency: 3500 },
        { offset: 0.145, release: 0.032, peak: 1.05, frequency: 1800 },
      ].forEach((hit) =>
        noise(audioContext, master, shortNoise, {
          start: now + hit.offset,
          attack: 0.002,
          release: hit.release,
          peak: hit.peak,
          frequency: hit.frequency,
          q: 0.9,
        }),
      );
      break;
    case "clickOriginal":
      [0.095, 0.195].forEach((offset, index) => {
        noise(audioContext, master, shortNoise, {
          start: now + offset,
          attack: 0.001,
          release: index === 0 ? 0.022 : 0.025,
          peak: index === 0 ? 1.55 : 2,
          frequency: 2450,
          q: 1.4,
        });
        tone(audioContext, master, {
          start: now + offset,
          frequency: 1250,
          endFrequency: 720,
          attack: 0.001,
          release: 0.022,
          peak: 0.28,
        });
      });
      break;
    case "drop":
      tone(audioContext, master, {
        start: now + 0.035,
        frequency: 1050,
        endFrequency: 190,
        attack: 0.105,
        release: 0.2,
        peak: 0.9,
      });
      noise(audioContext, master, shortNoise, {
        start: now + 0.035,
        attack: 0.09,
        release: 0.12,
        peak: 0.12,
        frequency: 1100,
        q: 0.9,
      });
      break;
    case "swipeForward":
      paper(audioContext, master, now, "forward", random);
      break;
    case "swipeBackward":
      paper(audioContext, master, now, "backward", random);
      break;
    case "paperRustle":
      // The source recording is a sequence of five separate handling gestures.
      // Keep that macro rhythm here; live swipes use the compact recipes above.
      [
        { offset: 0.3, level: 0.38 },
        { offset: 1.55, level: 1 },
        { offset: 3.35, level: 0.38 },
        { offset: 4.95, level: 0.48 },
        { offset: 5.93, level: 1 },
      ].forEach(({ offset, level }) =>
        paper(audioContext, master, now + offset, "shuffle", random, level),
      );
      break;
    case "partyHorn":
      sustainedHorn(audioContext, master, now + 0.075);
      break;
    case "introHome":
    case "introThoughts":
    case "introArtifacts": {
      const roots = { introHome: 392, introThoughts: 440, introArtifacts: 523.25 };
      const root = roots[name];
      [1, 1.25, 1.5].forEach((ratio, index) => {
        tone(audioContext, master, {
          start: now + index * 0.065,
          frequency: root * ratio,
          attack: 0.018,
          release: 0.28,
          peak: 0.055,
        });
      });
      break;
    }
    case "ambientGlobal":
    case "ambientHome":
    case "ambientThoughts":
    case "ambientArtifacts": {
      const roots = {
        ambientGlobal: 196,
        ambientHome: 220,
        ambientThoughts: 174.61,
        ambientArtifacts: 261.63,
      };
      const root = roots[name];
      [1, 1.5, 2].forEach((ratio) => {
        tone(audioContext, master, {
          start: now,
          frequency: root * ratio,
          attack: 0.18,
          release: 0.72,
          peak: 0.035,
          type: "sine",
        });
      });
      noise(audioContext, master, shortNoise, {
        start: now,
        attack: 0.12,
        release: 0.48,
        peak: 0.022,
        frequency: 1100,
        type: "lowpass",
      });
      break;
    }
  }

  return master;
}

export function playSynth(name: SynthSoundName) {
  const audioContext = getContext();
  if (!audioContext) return;

  const play = () => {
    try {
      const master = render(audioContext, audioContext.destination, name, Math.random);
      window.setTimeout(() => master.disconnect(), 1800);
    } catch {
      // Audio feedback is progressive enhancement.
    }
  };

  if (audioContext.state === "running") {
    play();
    return;
  }

  void audioContext.resume().then(play, () => {});
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const OFFLINE_DURATIONS: Record<SynthSoundName, number> = {
  ambientArtifacts: 1.1,
  ambientGlobal: 1.1,
  ambientHome: 1.1,
  ambientThoughts: 1.1,
  click: 0.366,
  clickOriginal: 0.465,
  drop: 1.32,
  introArtifacts: 0.7,
  introHome: 0.7,
  introThoughts: 0.7,
  paperRustle: 6.75,
  partyHorn: 1.503,
  swipeBackward: 0.45,
  swipeForward: 0.45,
};

export async function renderSynthOffline(name: SynthSoundName) {
  const sampleRate = 48_000;
  const duration = OFFLINE_DURATIONS[name];
  const offline = new OfflineAudioContext(1, Math.ceil(sampleRate * duration), sampleRate);
  render(offline, offline.destination, name, seededRandom(1729));
  return offline.startRendering();
}

export function audioBufferToWavDataUrl(buffer: AudioBuffer) {
  const samples = buffer.getChannelData(0);
  const bytes = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(bytes);
  const write = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  write(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples.length * 2, true);

  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(44 + index * 2, sample < 0 ? sample * 32768 : sample * 32767, true);
  }

  const binary = new Uint8Array(bytes);
  let encoded = "";
  for (let index = 0; index < binary.length; index += 1) {
    encoded += String.fromCharCode(binary[index]);
  }
  return `data:audio/wav;base64,${btoa(encoded)}`;
}
