"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RhythmEngine } from "@/lib/audio/RhythmEngine";
import type { BeatSlot, DanceStyle, MelodyNote, PercussionHit } from "@/types/rhythm";

interface PlayOptions {
  pattern: BeatSlot[];
  slotDuration: number;
  notes?: (MelodyNote | null)[];
  style: DanceStyle;
}

export function useRhythmEngine() {
  const engineRef = useRef<RhythmEngine | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [volume, setVolumeState] = useState(0.8);
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    engineRef.current = new RhythmEngine();
    return () => {
      if (fallbackTimerRef.current) clearInterval(fallbackTimerRef.current);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  const stopFallback = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    stopFallback();
    setIsPlaying(false);
    setCurrentBeat(-1);
  }, [stopFallback]);

  const play = useCallback(
    async ({ pattern, slotDuration, notes, style }: PlayOptions) => {
      const engine = engineRef.current;
      if (!engine || pattern.length === 0) return;

      stop();

      const ready = engine.init();
      setAudioAvailable(ready);

      if (!ready) {
        // Audio couldn't start on this browser — keep the experience alive
        // with a plain interval driving the same visual beat progression.
        let beat = 0;
        setCurrentBeat(0);
        setIsPlaying(true);
        fallbackTimerRef.current = setInterval(() => {
          beat = (beat + 1) % pattern.length;
          setCurrentBeat(beat);
        }, slotDuration * 1000);
        return;
      }

      engine.setVolume(volume);
      engine.setMuted(muted);
      await engine.resume();
      setCurrentBeat(-1);
      engine.start(pattern, slotDuration, (beatIndex) => setCurrentBeat(beatIndex), notes ?? [], style);
      setIsPlaying(true);
    },
    [muted, stop, volume]
  );

  const tap = useCallback(
    (hit: PercussionHit) => {
      const engine = engineRef.current;
      if (!engine) return;
      const ready = engine.init();
      setAudioAvailable(ready);
      if (!ready) return;
      void engine.resume();
      engine.setVolume(volume);
      engine.setMuted(muted);
      engine.playOneShot(hit);
    },
    [muted, volume]
  );

  const sing = useCallback(
    (note: MelodyNote, style: DanceStyle) => {
      const engine = engineRef.current;
      if (!engine) return;
      const ready = engine.init();
      setAudioAvailable(ready);
      if (!ready) return;
      void engine.resume();
      engine.setVolume(volume);
      engine.setMuted(muted);
      engine.singOneShot(note, style);
    },
    [muted, volume]
  );

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    engineRef.current?.setVolume(v);
  }, []);

  const toggleMute = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      engineRef.current?.setMuted(next);
      return next;
    });
  }, []);

  return {
    play,
    stop,
    tap,
    sing,
    isPlaying,
    currentBeat,
    audioAvailable,
    volume,
    setVolume,
    muted,
    toggleMute,
  };
}
