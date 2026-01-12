"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Play, RotateCcw } from "lucide-react";
import { SOUND_CONFIG, type SoundCategory } from "@/contexts/sound-context";
import { useSoundSettings } from "@/contexts/sound-context";

const OVERRIDE_PREFIX = "sound-override-";

function getOverrideKey(category: SoundCategory, key: string): string {
  return `${OVERRIDE_PREFIX}${category}-${key}`;
}

function hasOverride(category: SoundCategory, key: string): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(getOverrideKey(category, key));
}

function clearOverride(category: SoundCategory, key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getOverrideKey(category, key));
  // Trigger storage event for cross-tab sync
  window.dispatchEvent(new StorageEvent("storage", {
    key: getOverrideKey(category, key),
    newValue: null,
  }));
}

function saveOverride(category: SoundCategory, key: string, dataUrl: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getOverrideKey(category, key), dataUrl);
  // Trigger storage event for cross-tab sync
  window.dispatchEvent(new StorageEvent("storage", {
    key: getOverrideKey(category, key),
    newValue: dataUrl,
  }));
}

interface SoundUploadSectionProps {
  category: SoundCategory;
  soundKey: string;
  label: string;
  defaultPath: string;
}

export function SoundUploadSection({
  category,
  soundKey,
  label,
  defaultPath,
}: SoundUploadSectionProps) {
  const { getSoundUrl, playIntro, playTransition, playSound } = useSoundSettings();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasCustomSound = hasOverride(category, soundKey);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("audio/")) {
      setError("Please select an audio file (.mp3, .wav, .ogg)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Convert file to data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        saveOverride(category, soundKey, dataUrl);
        setIsUploading(false);
        // Reload page to pick up new sound
        window.location.reload();
      };
      reader.onerror = () => {
        setError("Failed to read file");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to process file");
      setIsUploading(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    clearOverride(category, soundKey);
    // Reload page to pick up default sound
    window.location.reload();
  };

  const handleTest = () => {
    // Play the sound based on category
    if (category === "intro") {
      if (soundKey === "home") playIntro("home");
      else if (soundKey === "thoughts") playIntro("thoughts");
      else if (soundKey === "artifacts") playIntro("artifacts");
    } else if (category === "transition") {
      if (soundKey === "swipeForward") playTransition("forward");
      else if (soundKey === "swipeBackward") playTransition("backward");
    } else if (category === "interaction") {
      if (soundKey === "click") playSound("click");
      else if (soundKey === "clickAlt") playSound("click", true);
      else if (soundKey === "confetti") playSound("confetti");
      else if (soundKey === "drop") playSound("drop");
    }
    // Ambient sounds are tested via the ambient manager, so we'll skip those
  };

  const currentUrl = getSoundUrl(category, soundKey);
  const isDefault = currentUrl === defaultPath;

  return (
    <div className="space-y-2 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor={`${category}-${soundKey}`} className="font-medium">
            {label}
          </Label>
          {hasCustomSound && (
            <Badge variant="secondary" className="text-xs">
              Custom
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={category === "ambient"}
            title={category === "ambient" ? "Ambient sounds play automatically" : "Test sound"}
          >
            <Play className="h-4 w-4" />
          </Button>
          {hasCustomSound && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              title="Reset to default"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {isDefault ? (
          <span>Default: {defaultPath}</span>
        ) : (
          <span className="text-green-600 dark:text-green-400">Using custom sound</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          ref={fileInputRef}
          id={`${category}-${soundKey}`}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {isUploading && (
        <div className="text-sm text-muted-foreground">Uploading…</div>
      )}
    </div>
  );
}
