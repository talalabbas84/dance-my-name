"use client";

import { Volume1, Volume2, VolumeX } from "lucide-react";

interface AudioControlsProps {
  volume: number;
  muted: boolean;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
  audioAvailable: boolean;
}

export function AudioControls({ volume, muted, onVolumeChange, onToggleMute, audioAvailable }: AudioControlsProps) {
  const Icon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        aria-pressed={muted}
        disabled={!audioAvailable}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-warm-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Icon size={18} aria-hidden="true" />
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={muted ? 0 : volume}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        disabled={muted || !audioAvailable}
        aria-label="Volume"
        className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-white/10 accent-gold disabled:cursor-not-allowed disabled:opacity-40 sm:w-28"
      />
      {!audioAvailable && (
        <span className="text-xs text-muted">Audio unavailable — beat still visible</span>
      )}
    </div>
  );
}
