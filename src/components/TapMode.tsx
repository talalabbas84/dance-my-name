"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import type { MelodyNote, PercussionHit, PercussionType, RhythmStyleDefinition } from "@/types/rhythm";

interface TapModeProps {
  syllables: string[];
  style: RhythmStyleDefinition;
  onTap: (hit: PercussionHit) => void;
  onSing?: (note: MelodyNote) => void;
  syllableFreqs?: number[];
  mutedInstruments?: Set<PercussionType>;
}

const MAX_HISTORY = 20;

export function TapMode({ syllables, style, onTap, onSing, syllableFreqs, mutedInstruments }: TapModeProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  function pressPad(i: number) {
    const instrument = style.tapInstruments[i % style.tapInstruments.length];
    if (!mutedInstruments?.has(instrument)) {
      onTap({ type: instrument, velocity: 0.95 });
      const freq = syllableFreqs?.[i];
      if (onSing && freq) onSing({ freq, duration: 0.32, gain: 0.5 });
    }
    setActiveIndex(i);
    setHistory((prev) => [...prev.slice(-(MAX_HISTORY - 1)), i]);
    window.setTimeout(() => setActiveIndex((current) => (current === i ? null : current)), 180);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const num = Number(e.key);
      if (Number.isInteger(num) && num >= 1 && num <= syllables.length) {
        pressPad(num - 1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syllables.length, style]);

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div>
        <h3 className="font-display text-center text-xl font-semibold text-warm-white sm:text-2xl">
          Tap Your Name
        </h3>
        <p className="mt-1 text-center text-sm text-muted">
          Freestyle it — tap the pads, or press number keys 1–{syllables.length}.
        </p>
      </div>

      <div className="grid w-full max-w-lg grid-cols-2 gap-3 sm:grid-cols-3">
        {syllables.map((syllable, i) => {
          const active = activeIndex === i;
          return (
            <motion.button
              key={`${syllable}-${i}`}
              type="button"
              onClick={() => pressPad(i)}
              whileTap={{ scale: 0.92 }}
              animate={{
                scale: active ? 1.06 : 1,
                boxShadow: active ? `0 0 32px ${style.theme.glow}` : "0 0 0px transparent",
              }}
              transition={{ duration: 0.15 }}
              aria-label={`Tap syllable ${syllable} (key ${i + 1})`}
              className="font-display flex min-h-24 items-center justify-center rounded-2xl border px-4 py-6 text-2xl font-bold text-warm-white transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold sm:text-3xl"
              style={{
                borderColor: active ? style.theme.primary : "rgba(255,247,237,0.14)",
                background: active
                  ? `linear-gradient(135deg, ${style.theme.primary}44, ${style.theme.secondary}22)`
                  : "rgba(255,247,237,0.05)",
              }}
            >
              {syllable}
            </motion.button>
          );
        })}
      </div>

      <div className="flex w-full max-w-lg items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-1.5" aria-label="Your tap history" role="status">
          <AnimatePresence initial={false}>
            {history.map((i, historyIndex) => (
              <motion.span
                key={`${historyIndex}-${i}`}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                style={{ background: `${style.theme.primary}33`, color: "var(--color-warm-white)" }}
              >
                {syllables[i]?.[0]?.toUpperCase() ?? "•"}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={() => setHistory([])}
          disabled={history.length === 0}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-muted transition hover:text-warm-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw size={14} aria-hidden="true" />
          Reset
        </button>
      </div>
    </div>
  );
}
