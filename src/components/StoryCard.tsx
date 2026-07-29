"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { RhythmStyleDefinition } from "@/types/rhythm";

interface StoryCardProps {
  name: string;
  syllables: string[];
  style: RhythmStyleDefinition;
  onClose: () => void;
}

export function StoryCard({ name, syllables, style, onClose }: StoryCardProps) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Story view rhythm card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex aspect-[9/16] w-full max-w-sm flex-col items-center justify-between overflow-hidden rounded-3xl border border-white/10 p-8 text-center shadow-2xl"
        style={{
          background: `linear-gradient(160deg, ${style.theme.primary} -10%, #120B14 55%, ${style.theme.secondary} 130%)`,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close story view"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-warm-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <X size={18} />
        </button>

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-warm-white/70">Dance My Name</p>

        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <h2 className="font-display text-4xl font-bold text-warm-white drop-shadow-lg">{name}</h2>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {syllables.map((s, i) => (
              <span
                key={i}
                className="font-display rounded-xl border border-white/20 bg-black/25 px-4 py-2 text-xl font-semibold text-warm-white"
              >
                {s}
              </span>
            ))}
          </div>
          <p className="font-display text-lg italic text-warm-white/90">{style.labelTemplate(name)}</p>
        </div>

        <p className="mb-4 text-xs font-medium text-warm-white/60">dancemyname.app</p>
      </motion.div>
    </motion.div>
  );
}
