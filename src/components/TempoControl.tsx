"use client";

export const MIN_BPM = 70;
export const MAX_BPM = 140;

interface TempoControlProps {
  bpm: number;
  onChange: (bpm: number) => void;
  accent: string;
}

export function TempoControl({ bpm, onChange, accent }: TempoControlProps) {
  return (
    <div className="flex w-full max-w-xs flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor="tempo-control" className="text-sm font-medium text-muted">
          Tempo
        </label>
        <span className="font-display text-lg font-semibold text-warm-white">{bpm} BPM</span>
      </div>
      <input
        id="tempo-control"
        type="range"
        min={MIN_BPM}
        max={MAX_BPM}
        step={1}
        value={bpm}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuemin={MIN_BPM}
        aria-valuemax={MAX_BPM}
        aria-valuenow={bpm}
        aria-label="Tempo in beats per minute"
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        style={{ ["--accent" as string]: accent }}
      />
      <div className="flex justify-between text-[11px] text-muted">
        <span>{MIN_BPM}</span>
        <span>{MAX_BPM}</span>
      </div>
    </div>
  );
}
