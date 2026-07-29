"use client";

import { motion } from "framer-motion";
import type { BeatSlot } from "@/types/rhythm";

interface BeatCounterProps {
  pattern: BeatSlot[];
  currentBeat: number;
  primary: string;
  secondary: string;
}

export function BeatCounter({ pattern, currentBeat, primary, secondary }: BeatCounterProps) {
  return (
    <div className="flex flex-col items-center gap-2" aria-live="off">
      <div className="flex items-center gap-1.5 sm:gap-2" role="group" aria-label="Beat position">
        {pattern.map((slot) => {
          const active = slot.index === currentBeat;
          return (
            <div key={slot.index} className="flex flex-col items-center gap-1">
              <motion.span
                aria-hidden="true"
                className="block h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3"
                animate={{
                  backgroundColor: active ? (slot.isAccent ? secondary : primary) : "rgba(255,247,237,0.18)",
                  scale: active ? 1.4 : 1,
                }}
                transition={{ duration: 0.15 }}
              />
              <span
                className="text-[10px] font-semibold tracking-wide sm:text-xs"
                style={{ color: active ? "var(--color-warm-white)" : "var(--color-muted)" }}
              >
                {slot.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted sm:text-sm">
        Beat <span className="font-semibold text-warm-white">{currentBeat >= 0 ? currentBeat + 1 : "–"}</span> of{" "}
        {pattern.length}
      </p>
    </div>
  );
}
