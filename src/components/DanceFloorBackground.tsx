"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface DanceFloorBackgroundProps {
  primary?: string;
  secondary?: string;
  pulse?: boolean;
  accent?: boolean;
}

const BAR_HEIGHTS = [22, 40, 66, 34, 88, 50, 30, 70, 44, 60, 26, 78];

export function DanceFloorBackground({
  primary = "#FF4D5A",
  secondary = "#FFC857",
  pulse = false,
  accent = false,
}: DanceFloorBackgroundProps) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg">
      <div className="absolute inset-0 dance-floor-grid" />

      <motion.div
        className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: primary, opacity: 0.35 }}
        animate={
          reducedMotion
            ? {}
            : {
                scale: accent ? [1, 1.25, 1] : pulse ? [1, 1.1, 1] : [1, 1.05, 1],
                opacity: accent ? [0.35, 0.55, 0.35] : [0.3, 0.4, 0.3],
              }
        }
        transition={{ duration: pulse ? 0.5 : 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/4 translate-y-1/4 rounded-full blur-3xl"
        style={{ background: secondary, opacity: 0.25 }}
        animate={reducedMotion ? {} : { scale: [1, 1.15, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-24 left-0 h-72 w-72 -translate-x-1/4 rounded-full blur-3xl"
        style={{ background: "#211525", opacity: 0.6 }}
        animate={reducedMotion ? {} : { scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {!reducedMotion && (
        <div className="absolute inset-x-0 bottom-0 flex h-24 items-end justify-center gap-2 opacity-30 sm:h-32">
          {BAR_HEIGHTS.map((h, i) => (
            <motion.span
              key={i}
              className="w-2 rounded-t-full sm:w-3"
              style={{ background: i % 2 === 0 ? primary : secondary }}
              animate={{ height: [h * 0.4, h, h * 0.4] }}
              transition={{
                duration: pulse ? 0.6 : 1.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.08,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
