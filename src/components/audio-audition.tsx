"use client";

import { useEffect, useState } from "react";
import { PlayIcon, RadioIcon } from "lucide-react";
import {
  SOUND_URLS,
  getSoundVolume,
  playSample,
  type SoundName,
} from "@/lib/audio";
import {
  audioBufferToWavDataUrl,
  playSynth,
  prepareSynthAudio,
  renderSynthOffline,
} from "@/lib/synth-audio";
import { useSoundSettings } from "@/contexts/sound-context";

declare global {
  interface Window {
    __renderSynthForAnalysis?: (name: SoundName) => Promise<string>;
    __benchmarkSynthPreparation?: () => Promise<{
      elapsedMs: number;
      maxEventLoopGapMs: number;
      timerTicks: number;
    }>;
  }
}

async function benchmarkSynthPreparation() {
  const startedAt = performance.now();
  let previousTick = startedAt;
  let maxEventLoopGapMs = 0;
  let timerTicks = 0;
  let running = true;
  const recordTick = () => {
    const now = performance.now();
    maxEventLoopGapMs = Math.max(maxEventLoopGapMs, now - previousTick);
    previousTick = now;
    timerTicks += 1;
  };
  const tick = () => {
    recordTick();
    if (running) window.setTimeout(tick, 0);
  };
  window.setTimeout(tick, 0);
  await prepareSynthAudio();
  const elapsedMs = performance.now() - startedAt;
  running = false;
  await new Promise<void>((resolve) => {
    window.setTimeout(() => {
      recordTick();
      resolve();
    }, 0);
  });
  return { elapsedMs, maxEventLoopGapMs, timerTicks };
}

const SOUND_GROUPS: Array<{
  label: string;
  description: string;
  sounds: Array<{ name: SoundName; label: string; note: string }>;
}> = [
  {
    label: "Live interactions",
    description: "The four sounds currently connected to portfolio interactions.",
    sounds: [
      { name: "click", label: "Click", note: "Links, navigation, and toggles" },
      { name: "drop", label: "Drop", note: "Existing but not currently triggered" },
      { name: "swipeForward", label: "Swipe forward", note: "Receipt stack advancing" },
      { name: "swipeBackward", label: "Swipe backward", note: "Receipt stack reversing" },
    ],
  },
  {
    label: "Paper and character",
    description: "Larger source recordings and one-off personality sounds.",
    sounds: [
      { name: "paperRustle", label: "Paper rustle", note: "6.48-second shuffle reference" },
      { name: "clickOriginal", label: "Original click", note: "Uncompressed WAV reference" },
      { name: "partyHorn", label: "Sad party horn", note: "One-off celebration reference" },
    ],
  },
  {
    label: "Route sketches",
    description: "Short ambient and intro files retained in the asset folder.",
    sounds: [
      { name: "ambientGlobal", label: "Ambient · global", note: "Global atmosphere sketch" },
      { name: "ambientHome", label: "Ambient · home", note: "Home atmosphere sketch" },
      { name: "ambientThoughts", label: "Ambient · thoughts", note: "Thoughts atmosphere sketch" },
      { name: "ambientArtifacts", label: "Ambient · artifacts", note: "Artifacts atmosphere sketch" },
      { name: "introHome", label: "Intro · home", note: "Home arrival sketch" },
      { name: "introThoughts", label: "Intro · thoughts", note: "Thoughts arrival sketch" },
      { name: "introArtifacts", label: "Intro · artifacts", note: "Artifacts arrival sketch" },
    ],
  },
];

function PlayButton({
  children,
  onPlay,
  active,
}: {
  children: React.ReactNode;
  onPlay: () => void;
  active: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-xs font-bold shadow-[0_0_0_1px_rgba(255,255,255,0.1)] transition-[scale,background-color,box-shadow] duration-150 ease-out hover:bg-foreground/5 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.16)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {active ? <RadioIcon className="size-3.5" /> : <PlayIcon className="ml-px size-3.5" />}
      {children}
    </button>
  );
}

export function AudioAudition() {
  const { engine, setEngine } = useSoundSettings();
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    const deferPrewarm = new URLSearchParams(window.location.search)
      .has("defer-prewarm");
    if (!deferPrewarm) void prepareSynthAudio();
    window.__benchmarkSynthPreparation = benchmarkSynthPreparation;
    window.__renderSynthForAnalysis = async (name) =>
      audioBufferToWavDataUrl(await renderSynthOffline(name));
    return () => {
      delete window.__benchmarkSynthPreparation;
      delete window.__renderSynthForAnalysis;
    };
  }, []);

  const audition = (key: string, play: () => void) => {
    setPlaying(key);
    play();
    window.setTimeout(() => setPlaying((current) => (current === key ? null : current)), 900);
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-400" />
          Audio lab
        </div>
        <h1 className="max-w-lg text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Samples against synthesis
        </h1>
        <p className="max-w-xl text-pretty text-sm leading-6 text-muted-foreground">
          Audition every audio asset beside a generated equivalent. The selected engine also controls live portfolio interactions and persists across reloads.
        </p>
      </header>

      <section className="rounded-xl bg-foreground/[0.035] p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
        <div className="grid grid-cols-2 gap-2">
          {(["sample", "synth"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setEngine(option)}
              aria-pressed={engine === option}
              className={`min-h-11 rounded-lg px-4 text-sm font-bold capitalize transition-[scale,background-color,color,box-shadow] duration-150 ease-out active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                engine === option
                  ? "bg-foreground text-background shadow-[0_1px_2px_rgba(0,0,0,0.16)]"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              }`}
            >
              {option} engine
            </button>
          ))}
        </div>
      </section>

      {SOUND_GROUPS.map((group) => (
        <section key={group.label} className="space-y-4">
          <div>
            <h2 className="text-balance text-lg font-bold">{group.label}</h2>
            <p className="mt-1 text-pretty text-xs leading-5 text-muted-foreground">
              {group.description}
            </p>
          </div>

          <div className="overflow-hidden rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            {group.sounds.map((sound, index) => {
              const sampleKey = `${sound.name}-sample`;
              const synthKey = `${sound.name}-synth`;

              return (
                <article
                  key={sound.name}
                  className={`grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_132px_132px] sm:items-center ${
                    index > 0 ? "border-t border-foreground/10" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold">{sound.label}</h3>
                    <p className="mt-1 truncate text-xs text-muted-foreground" title={SOUND_URLS[sound.name]}>
                      {sound.note}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:contents">
                    <PlayButton
                      active={playing === sampleKey}
                      onPlay={() => audition(sampleKey, () => playSample(sound.name))}
                    >
                      Sample
                    </PlayButton>
                    <PlayButton
                      active={playing === synthKey}
                      onPlay={() =>
                        audition(synthKey, () => {
                          void playSynth(sound.name, {
                            gain: getSoundVolume(sound.name),
                          });
                        })
                      }
                    >
                      Synth
                    </PlayButton>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
