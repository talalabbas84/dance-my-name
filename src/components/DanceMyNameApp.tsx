"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Music4 } from "lucide-react";
import { NameEntry } from "./NameEntry";
import { RhythmPlayer } from "./RhythmPlayer";
import { DanceFloorBackground } from "./DanceFloorBackground";
import { buildNameData } from "@/lib/rhythm/name";
import { RHYTHM_STYLES } from "@/lib/rhythm/styles";
import type { DanceStyle, NameData } from "@/types/rhythm";

export function DanceMyNameApp() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Restore state from a shared URL, e.g. /?name=Talal&style=bachata. Lazy
  // initializers run once on mount, so this never re-runs on our own
  // router.replace calls further down.
  const [nameData, setNameData] = useState<NameData | null>(() => {
    const paramName = searchParams.get("name");
    return paramName ? buildNameData(paramName) : null;
  });
  const [style, setStyle] = useState<DanceStyle>(() => {
    const paramStyle = searchParams.get("style");
    return paramStyle === "bachata" ? "bachata" : "salsa";
  });

  const syncUrl = useCallback(
    (name: string, nextStyle: DanceStyle) => {
      const params = new URLSearchParams({ name, style: nextStyle });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router]
  );

  function handleSubmitName(raw: string) {
    const data = buildNameData(raw);
    if (!data) return;
    setNameData(data);
    syncUrl(data.display, style);
  }

  function handleStyleChange(next: DanceStyle) {
    setStyle(next);
    if (nameData) syncUrl(nameData.display, next);
  }

  function handleSyllablesChange(syllables: string[]) {
    setNameData((prev) => (prev ? { ...prev, syllables, isManual: true } : prev));
  }

  function handleTryAnotherName() {
    setNameData(null);
    router.replace(pathname, { scroll: false });
  }

  const theme = RHYTHM_STYLES[style].theme;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden">
      <DanceFloorBackground primary={theme.primary} secondary={theme.secondary} pulse={Boolean(nameData)} />

      <AnimatePresence mode="wait">
        {!nameData ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24, scale: 0.98 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex w-full flex-col items-center gap-8 px-4 py-16 text-center sm:py-24"
          >
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-gold">
              <Music4 size={16} aria-hidden="true" />
              Dance My Name
            </div>

            <div className="flex max-w-2xl flex-col gap-4">
              <h1 className="font-display text-4xl font-bold leading-tight text-warm-white sm:text-5xl md:text-6xl">
                What does your name sound like on the dance floor?
              </h1>
              <p className="text-lg text-muted sm:text-xl">
                Type your name and turn it into a salsa or bachata rhythm.
              </p>
            </div>

            <NameEntry onSubmit={handleSubmitName} />
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex w-full flex-col items-center"
          >
            <RhythmPlayer
              nameData={nameData}
              style={style}
              onStyleChange={handleStyleChange}
              onSyllablesChange={handleSyllablesChange}
              onTryAnotherName={handleTryAnotherName}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
