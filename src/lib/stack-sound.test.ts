import { describe, expect, it } from "vitest";

import { stackSoundRecipe, type Paper, type StackSoundEvent } from "@/lib/stack-sound";
import { validateSynthRecipe } from "@/lib/synth-recipes";

describe("stack sound", () => {
  it("builds a valid recipe for every stack event", () => {
    const papers: Paper[] = ["dossier", "stationery", "blueprint"];
    const events: StackSoundEvent[] = papers.flatMap((paper): StackSoundEvent[] => [
      { kind: "flip", direction: "forward", from: paper, to: "stationery" },
      { kind: "flip", direction: "backward", from: "blueprint", to: paper, intensity: 1.4 },
      { kind: "flip", direction: "forward", from: paper, to: "dossier", throw: { landsAt: 0.5, pan: -1 } },
      { kind: "grab", paper },
      { kind: "settle", paper },
    ]);
    for (const event of events) {
      expect(validateSynthRecipe(stackSoundRecipe(event)).errors).toEqual([]);
    }
  });

  it("never plays the same paper slice on two flips in a row", () => {
    const from = (seed: number) => {
      const layer = stackSoundRecipe({ kind: "flip", direction: "forward", from: "dossier", to: "stationery" }, () => seed).layers[0];
      return layer.kind === "sample" ? layer.from : null; // crack layer
    };
    // A constant random source would pick the same slice every time without the guard.
    const picks = [0.1, 0.1, 0.1, 0.1].map(from);
    for (let i = 1; i < picks.length; i++) expect(picks[i]).not.toBe(picks[i - 1]);
  });
});
