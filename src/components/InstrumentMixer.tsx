"use client";

import { Volume2, VolumeX } from "lucide-react";
import type { PercussionType } from "@/types/rhythm";

const INSTRUMENT_LABELS: Record<PercussionType, string> = {
  clave: "Clave",
  "conga-low": "Conga (open)",
  "conga-hi": "Conga (slap)",
  cowbell: "Cowbell",
  cascara: "Cáscara",
  maracas: "Maracas",
  guiro: "Güiro",
  "bongo-low": "Bongo (low)",
  "bongo-hi": "Bongo (hi)",
  bass: "Bass",
  guira: "Güira",
  "accent-hit": "Accent",
};

interface InstrumentMixerProps {
  instruments: PercussionType[];
  mutedInstruments: Set<PercussionType>;
  onToggle: (type: PercussionType) => void;
  accent: string;
}

export function InstrumentMixer({ instruments, mutedInstruments, onToggle, accent }: InstrumentMixerProps) {
  if (instruments.length === 0) return null;

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Instruments</p>
      <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Mute individual instruments">
        {instruments.map((type) => {
          const muted = mutedInstruments.has(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => onToggle(type)}
              aria-pressed={!muted}
              aria-label={`${muted ? "Unmute" : "Mute"} ${INSTRUMENT_LABELS[type]}`}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              style={{
                borderColor: muted ? "rgba(255,247,237,0.1)" : `${accent}55`,
                background: muted ? "rgba(255,247,237,0.03)" : `${accent}1a`,
                color: muted ? "var(--color-muted)" : "var(--color-warm-white)",
              }}
            >
              {muted ? <VolumeX size={12} aria-hidden="true" /> : <Volume2 size={12} aria-hidden="true" />}
              {INSTRUMENT_LABELS[type]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
