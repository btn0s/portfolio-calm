import { describe, expect, it } from "vitest";

import { stackSoundRecipe, type StackSoundEvent } from "@/lib/stack-sound";
import { validateSynthRecipe } from "@/lib/synth-recipes";

describe("stack sound", () => {
  it("builds a valid recipe for every stack event", () => {
    const events: StackSoundEvent[] = [
      { kind: "flip", direction: "forward" },
      { kind: "flip", direction: "backward", intensity: 1.4 },
      { kind: "grab" },
      { kind: "settle" },
    ];
    for (const event of events) {
      expect(validateSynthRecipe(stackSoundRecipe(event)).errors).toEqual([]);
    }
  });

  it("never plays the same paper slice on two flips in a row", () => {
    const from = (seed: number) => {
      const layer = stackSoundRecipe({ kind: "flip", direction: "forward" }, () => seed).layers[0];
      return layer.kind === "sample" ? layer.from : null; // crack layer
    };
    // A constant random source would pick the same slice every time without the guard.
    const picks = [0.1, 0.1, 0.1, 0.1].map(from);
    for (let i = 1; i < picks.length; i++) expect(picks[i]).not.toBe(picks[i - 1]);
  });
});
