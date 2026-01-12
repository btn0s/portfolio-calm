"use client";

import { SoundUploadSection } from "./components/sound-upload-section";
import { SOUND_CONFIG } from "@/contexts/sound-context";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

const OVERRIDE_PREFIX = "sound-override-";

function clearAllOverrides(): void {
  if (typeof window === "undefined") return;
  
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(OVERRIDE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });
  
  // Reload to pick up defaults
  window.location.reload();
}

function countOverrides(): number {
  if (typeof window === "undefined") return 0;
  
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(OVERRIDE_PREFIX)) {
      count++;
    }
  }
  return count;
}

export default function SoundDesignerPage() {
  const overrideCount = countOverrides();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sound Designer</h1>
        <p className="text-muted-foreground">
          Upload custom sounds to override defaults. Sounds are stored in localStorage and persist across sessions.
        </p>
        {overrideCount > 0 && (
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {overrideCount} custom sound{overrideCount !== 1 ? "s" : ""} active
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllOverrides}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset All
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Interaction Sounds */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Interaction Sounds</h2>
          <div className="grid gap-4">
            <SoundUploadSection
              category="interaction"
              soundKey="click"
              label="Click"
              defaultPath={SOUND_CONFIG.interaction.click}
            />
            <SoundUploadSection
              category="interaction"
              soundKey="clickAlt"
              label="Click (Alt)"
              defaultPath={SOUND_CONFIG.interaction.clickAlt}
            />
            <SoundUploadSection
              category="interaction"
              soundKey="confetti"
              label="Confetti"
              defaultPath={SOUND_CONFIG.interaction.confetti}
            />
            <SoundUploadSection
              category="interaction"
              soundKey="drop"
              label="Drop"
              defaultPath={SOUND_CONFIG.interaction.drop}
            />
          </div>
        </section>

        {/* Intro Sounds */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Intro Sounds</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Played when entering each main route
          </p>
          <div className="grid gap-4">
            <SoundUploadSection
              category="intro"
              soundKey="home"
              label="Home Intro"
              defaultPath={SOUND_CONFIG.intro.home}
            />
            <SoundUploadSection
              category="intro"
              soundKey="thoughts"
              label="Thoughts Intro"
              defaultPath={SOUND_CONFIG.intro.thoughts}
            />
            <SoundUploadSection
              category="intro"
              soundKey="artifacts"
              label="Artifacts Intro"
              defaultPath={SOUND_CONFIG.intro.artifacts}
            />
          </div>
        </section>

        {/* Ambient Sounds */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Ambient Sounds</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Background loops that play continuously. Global ambient plays at lower volume, route-specific ambient layers on top.
          </p>
          <div className="grid gap-4">
            <SoundUploadSection
              category="ambient"
              soundKey="global"
              label="Global Ambient"
              defaultPath={SOUND_CONFIG.ambient.global}
            />
            <SoundUploadSection
              category="ambient"
              soundKey="home"
              label="Home Ambient"
              defaultPath={SOUND_CONFIG.ambient.home}
            />
            <SoundUploadSection
              category="ambient"
              soundKey="thoughts"
              label="Thoughts Ambient"
              defaultPath={SOUND_CONFIG.ambient.thoughts}
            />
            <SoundUploadSection
              category="ambient"
              soundKey="artifacts"
              label="Artifacts Ambient"
              defaultPath={SOUND_CONFIG.ambient.artifacts}
            />
          </div>
        </section>

        {/* Transition Sounds */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Transition Sounds</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Played when swiping between routes in the stack
          </p>
          <div className="grid gap-4">
            <SoundUploadSection
              category="transition"
              soundKey="swipeForward"
              label="Swipe Forward"
              defaultPath={SOUND_CONFIG.transition.swipeForward}
            />
            <SoundUploadSection
              category="transition"
              soundKey="swipeBackward"
              label="Swipe Backward"
              defaultPath={SOUND_CONFIG.transition.swipeBackward}
            />
          </div>
        </section>
      </div>

      <div className="mt-12 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Tips</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Audio files should be in MP3, WAV, or OGG format</li>
          <li>Maximum file size: 5MB per sound</li>
          <li>Sounds are stored locally in your browser</li>
          <li>To share sounds, export your localStorage data</li>
          <li>Ambient sounds should loop seamlessly</li>
          <li>Intro sounds should be short (1-3 seconds)</li>
        </ul>
      </div>
    </div>
  );
}
