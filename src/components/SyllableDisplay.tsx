"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { RhythmStyleDefinition } from "@/types/rhythm";

interface SyllableDisplayProps {
  syllables: string[];
  activeIndex: number;
  isAccentBeat: boolean;
  isPlaying: boolean;
  style: RhythmStyleDefinition;
}

export function SyllableDisplay({ syllables, activeIndex, isAccentBeat, isPlaying, style }: SyllableDisplayProps) {
  const reducedMotion = usePrefersReducedMotion();
  const sharp = style.motion.personality === "sharp";

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4" role="list" aria-label="Syllables">
      {syllables.map((syllable, i) => {
        const active = isPlaying && i === activeIndex;
        const accentActive = active && isAccentBeat;

        return (
          <motion.div
            key={`${syllable}-${i}`}
            role="listitem"
            initial={{ opacity: 0, y: 24, scale: 0.85 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: reducedMotion ? 1 : active ? style.motion.activeScale : 1,
              rotate: reducedMotion || !active ? 0 : sharp ? style.motion.rotate : style.motion.rotate * -1,
            }}
            transition={
              active
                ? { type: "spring", stiffness: sharp ? 500 : 260, damping: sharp ? 16 : 22 }
                : { delay: i * 0.08, type: "spring", stiffness: 260, damping: 20 }
            }
            className="font-display flex min-h-16 min-w-16 items-center justify-center rounded-2xl border px-5 py-3 text-3xl font-semibold sm:min-h-20 sm:min-w-20 sm:px-6 sm:text-4xl md:text-5xl"
            style={{
              borderColor: active ? style.theme.primary : "rgba(255,247,237,0.14)",
              background: active
                ? `linear-gradient(135deg, ${style.theme.primary}33, ${style.theme.secondary}22)`
                : "rgba(255,247,237,0.04)",
              boxShadow: active
                ? `0 0 ${accentActive ? 48 : 28}px ${style.theme.glow}`
                : "none",
              color: active ? "var(--color-warm-white)" : "var(--color-muted)",
            }}
          >
            {syllable}
          </motion.div>
        );
      })}
    </div>
  );
}
