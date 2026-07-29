"use client";

import { motion } from "framer-motion";
import { DANCE_STYLES, RHYTHM_STYLES } from "@/lib/rhythm/styles";
import type { DanceStyle } from "@/types/rhythm";

interface StyleToggleProps {
  value: DanceStyle;
  onChange: (style: DanceStyle) => void;
  disabled?: boolean;
}

export function StyleToggle({ value, onChange, disabled }: StyleToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Dance style"
      className="glass-panel relative flex w-full max-w-xs rounded-full p-1"
    >
      {DANCE_STYLES.map((style) => {
        const def = RHYTHM_STYLES[style];
        const active = value === style;
        return (
          <button
            key={style}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(style)}
            className="relative z-10 flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
            style={{ color: active ? "#120B14" : "var(--color-warm-white)" }}
          >
            {active && (
              <motion.span
                layoutId="style-toggle-pill"
                className="absolute inset-0 -z-10 rounded-full"
                style={{ background: def.theme.primary }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            {def.name}
          </button>
        );
      })}
    </div>
  );
}
