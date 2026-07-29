"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Mic2,
  MicOff,
  Megaphone,
  MegaphoneOff,
  Pause,
  Pencil,
  Play as PlayIcon,
  RotateCw,
  Shuffle,
  Smartphone,
  Users,
} from "lucide-react";
import { SyllableDisplay } from "./SyllableDisplay";
import { BeatCounter } from "./BeatCounter";
import { TempoControl, MIN_BPM, MAX_BPM } from "./TempoControl";
import { AudioControls } from "./AudioControls";
import { StyleToggle } from "./StyleToggle";
import { TapMode } from "./TapMode";
import { ShareButton } from "./ShareButton";
import { StoryCard } from "./StoryCard";
import { InstrumentMixer } from "./InstrumentMixer";
import { useRhythmEngine } from "@/hooks/useRhythmEngine";
import { RHYTHM_STYLES, getVariantPattern, slotDurationSeconds } from "@/lib/rhythm/styles";
import { mapSyllablesToBeats } from "@/lib/rhythm/mapping";
import { buildMelodyNotes, buildSyllableFrequencies } from "@/lib/rhythm/melody";
import { parseManualSyllables, syllablesToEditableString } from "@/lib/rhythm/name";
import { cancelNameCallout, isSpeechSupported, speakNameCallout } from "@/lib/audio/speech";
import type { DanceStyle, NameData, PercussionType } from "@/types/rhythm";

interface RhythmPlayerProps {
  nameData: NameData;
  style: DanceStyle;
  onStyleChange: (style: DanceStyle) => void;
  onSyllablesChange: (syllables: string[]) => void;
  onTryAnotherName: () => void;
}

type Tab = "generated" | "tap";

export function RhythmPlayer({
  nameData,
  style,
  onStyleChange,
  onSyllablesChange,
  onTryAnotherName,
}: RhythmPlayerProps) {
  const def = RHYTHM_STYLES[style];

  // Manually toggling style keeps the tempo you picked; only "Surprise Me"
  // (below) intentionally randomizes tempo and variation together.
  const [bpm, setBpm] = useState(def.defaultBpm);
  const [variant, setVariant] = useState({ offset: 0, spicy: false });
  const [tab, setTab] = useState<Tab>("generated");
  const [editingSyllables, setEditingSyllables] = useState(false);
  const [storyView, setStoryView] = useState(false);
  const [singing, setSinging] = useState(true);
  const [callout, setCallout] = useState(true);
  const [mutedInstruments, setMutedInstruments] = useState<Set<PercussionType>>(() => new Set());

  // Speech support can only be known on the client — start false (matching
  // the server-rendered markup) and detect it after mount, so the button's
  // presence never differs between server and client HTML. A lazy useState
  // initializer would still read `window` during the first client render
  // (before hydration completes) and reintroduce the exact mismatch this
  // avoids, so the check has to happen in an effect specifically.
  const [speechSupported, setSpeechSupported] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSpeechSupported(isSpeechSupported());
  }, []);

  const engine = useRhythmEngine();

  // Keep the editable syllable draft in sync whenever the syllables prop
  // itself changes (new name, manual edit) — adjusted during render rather
  // than an effect, per React's guidance for resetting state on prop change.
  const [prevSyllables, setPrevSyllables] = useState(nameData.syllables);
  const [syllableDraft, setSyllableDraft] = useState(syllablesToEditableString(nameData.syllables));
  if (nameData.syllables !== prevSyllables) {
    setPrevSyllables(nameData.syllables);
    setSyllableDraft(syllablesToEditableString(nameData.syllables));
  }

  const pattern = useMemo(
    () => getVariantPattern(style, variant.offset, variant.spicy),
    [style, variant.offset, variant.spicy]
  );
  const slotDuration = useMemo(() => slotDurationSeconds(style, bpm), [style, bpm]);
  const beatToSyllable = useMemo(
    () => mapSyllablesToBeats(nameData.syllables, pattern.length),
    [nameData.syllables, pattern.length]
  );

  // One pitch per syllable (always resolving to the tonic on the last one),
  // then one sung note per beat slot for whichever syllable lands there.
  const syllableFreqs = useMemo(
    () => buildSyllableFrequencies(nameData.syllables.length, style),
    [nameData.syllables.length, style]
  );
  const melodyNotes = useMemo(
    () => buildMelodyNotes(syllableFreqs, pattern, beatToSyllable, slotDuration),
    [syllableFreqs, pattern, beatToSyllable, slotDuration]
  );

  const activeSyllableIndex = engine.currentBeat >= 0 ? beatToSyllable[engine.currentBeat] : -1;
  const activeIsAccent = engine.currentBeat >= 0 ? pattern[engine.currentBeat]?.isAccent ?? false : false;

  // The instruments actually present in this style's pattern (for the mixer),
  // and a copy of the pattern with muted instruments filtered out of each
  // slot before it's handed to the audio engine.
  const usedInstruments = useMemo(
    () => Array.from(new Set(pattern.flatMap((s) => s.instrument.map((h) => h.type)))),
    [pattern]
  );
  const audiblePattern = useMemo(
    () =>
      pattern.map((s) => ({
        ...s,
        instrument: s.instrument.filter((h) => !mutedInstruments.has(h.type)),
      })),
    [pattern, mutedInstruments]
  );

  function toggleInstrument(type: PercussionType) {
    setMutedInstruments((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function stopEverything() {
    engine.stop();
    cancelNameCallout();
  }

  function handlePlay() {
    void engine.play({ pattern: audiblePattern, slotDuration, notes: singing ? melodyNotes : undefined, style });
    if (callout) speakNameCallout(nameData.display, style);
  }

  // Live-update a running loop when style, variation, tempo, muting, or
  // singing change mid-playback, so the audio and visuals never fall out of
  // sync with what's on screen. (Deliberately doesn't re-trigger the spoken
  // callout — that only fires on an explicit Play/Replay press.)
  useEffect(() => {
    if (engine.isPlaying) {
      void engine.play({ pattern: audiblePattern, slotDuration, notes: singing ? melodyNotes : undefined, style });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audiblePattern, slotDuration, melodyNotes, singing, style]);

  useEffect(() => {
    return () => stopEverything();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSurpriseMe() {
    const nextStyle: DanceStyle = style === "salsa" ? "bachata" : "salsa";
    const nextDef = RHYTHM_STYLES[nextStyle];
    const jitter = Math.round((Math.random() - 0.5) * 30);
    const nextBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, nextDef.defaultBpm + jitter));
    onStyleChange(nextStyle);
    setBpm(nextBpm);
    setVariant({ offset: Math.floor(Math.random() * nextDef.pattern.length), spicy: Math.random() > 0.5 });
  }

  function applySyllableEdit() {
    const parsed = parseManualSyllables(syllableDraft);
    if (parsed.length > 0) onSyllablesChange(parsed);
    setEditingSyllables(false);
  }

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-10 sm:gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-display text-4xl font-bold text-warm-white sm:text-5xl">{nameData.display}</h1>
        <p className="text-base text-muted sm:text-lg">{def.labelTemplate(nameData.display)}</p>
      </div>

      <StyleToggle value={style} onChange={onStyleChange} />

      <div className="glass-panel flex w-full flex-col items-center gap-6 rounded-3xl px-4 py-8 sm:px-8">
        <div role="tablist" aria-label="Rhythm mode" className="flex gap-2 rounded-full bg-white/5 p-1">
          <button
            role="tab"
            aria-selected={tab === "generated"}
            onClick={() => setTab("generated")}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            style={{
              background: tab === "generated" ? def.theme.primary : "transparent",
              color: tab === "generated" ? "#120B14" : "var(--color-muted)",
            }}
          >
            <Users size={14} aria-hidden="true" />
            Generated
          </button>
          <button
            role="tab"
            aria-selected={tab === "tap"}
            onClick={() => {
              stopEverything();
              setTab("tap");
            }}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            style={{
              background: tab === "tap" ? def.theme.primary : "transparent",
              color: tab === "tap" ? "#120B14" : "var(--color-muted)",
            }}
          >
            <Smartphone size={14} aria-hidden="true" />
            Tap Your Name
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === "generated" ? (
            <motion.div
              key="generated"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full flex-col items-center gap-6"
            >
              <SyllableDisplay
                syllables={nameData.syllables}
                activeIndex={activeSyllableIndex}
                isAccentBeat={activeIsAccent}
                isPlaying={engine.isPlaying}
                style={def}
              />

              <BeatCounter
                pattern={pattern}
                currentBeat={engine.currentBeat}
                primary={def.theme.primary}
                secondary={def.theme.secondary}
              />

              <div className="flex flex-wrap items-center justify-center gap-3">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => (engine.isPlaying ? stopEverything() : handlePlay())}
                  className="flex items-center gap-2 rounded-full px-8 py-4 text-lg font-bold text-[#120B14] shadow-lg transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                  style={{ background: def.theme.primary, boxShadow: `0 10px 30px -8px ${def.theme.glow}` }}
                  aria-label={engine.isPlaying ? "Pause" : "Play"}
                >
                  {engine.isPlaying ? <Pause size={20} /> : <PlayIcon size={20} />}
                  {engine.isPlaying ? "Pause" : "Play"}
                </motion.button>

                <button
                  type="button"
                  onClick={handlePlay}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-4 text-sm font-semibold text-warm-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  aria-label="Replay from the top"
                >
                  <RotateCw size={16} aria-hidden="true" />
                  Replay
                </button>

                <button
                  type="button"
                  onClick={handleSurpriseMe}
                  className="flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 py-4 text-sm font-semibold text-gold transition hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  <Shuffle size={16} aria-hidden="true" />
                  Surprise Me
                </button>

                <button
                  type="button"
                  onClick={() => setSinging((prev) => !prev)}
                  aria-pressed={singing}
                  aria-label={singing ? "Turn off singing" : "Turn on singing"}
                  className="flex items-center gap-2 rounded-full border px-5 py-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  style={{
                    borderColor: singing ? `${def.theme.primary}66` : "rgba(255,247,237,0.15)",
                    background: singing ? `${def.theme.primary}22` : "rgba(255,247,237,0.05)",
                    color: singing ? "var(--color-warm-white)" : "var(--color-muted)",
                  }}
                >
                  {singing ? <Mic2 size={16} aria-hidden="true" /> : <MicOff size={16} aria-hidden="true" />}
                  Sing It
                </button>

                {speechSupported && (
                  <button
                    type="button"
                    onClick={() => setCallout((prev) => !prev)}
                    aria-pressed={callout}
                    aria-label={callout ? "Turn off name callout" : "Turn on name callout"}
                    className="flex items-center gap-2 rounded-full border px-5 py-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    style={{
                      borderColor: callout ? `${def.theme.primary}66` : "rgba(255,247,237,0.15)",
                      background: callout ? `${def.theme.primary}22` : "rgba(255,247,237,0.05)",
                      color: callout ? "var(--color-warm-white)" : "var(--color-muted)",
                    }}
                  >
                    {callout ? <Megaphone size={16} aria-hidden="true" /> : <MegaphoneOff size={16} aria-hidden="true" />}
                    Callout
                  </button>
                )}
              </div>

              <div className="flex w-full flex-wrap items-center justify-center gap-6">
                <TempoControl bpm={bpm} onChange={setBpm} accent={def.theme.primary} />
                <AudioControls
                  volume={engine.volume}
                  muted={engine.muted}
                  onVolumeChange={engine.setVolume}
                  onToggleMute={engine.toggleMute}
                  audioAvailable={engine.audioAvailable}
                />
              </div>

              <InstrumentMixer
                instruments={usedInstruments}
                mutedInstruments={mutedInstruments}
                onToggle={toggleInstrument}
                accent={def.theme.primary}
              />
            </motion.div>
          ) : (
            <motion.div
              key="tap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <TapMode
                syllables={nameData.syllables}
                style={def}
                onTap={engine.tap}
                onSing={singing ? (note) => engine.sing(note, style) : undefined}
                syllableFreqs={syllableFreqs}
                mutedInstruments={mutedInstruments}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex w-full flex-col items-center gap-3">
        {editingSyllables ? (
          <div className="flex w-full max-w-sm flex-col gap-2">
            <label htmlFor="syllable-edit" className="text-xs font-medium text-muted">
              Separate syllables with a hyphen, e.g. Ta-lal
            </label>
            <div className="flex gap-2">
              <input
                id="syllable-edit"
                type="text"
                value={syllableDraft}
                onChange={(e) => setSyllableDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applySyllableEdit()}
                className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-warm-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              />
              <button
                type="button"
                onClick={applySyllableEdit}
                className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-[#120B14]"
              >
                Apply
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingSyllables(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <Pencil size={12} aria-hidden="true" />
            Edit syllables
          </button>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <ShareButton name={nameData.display} style={style} />
          <button
            type="button"
            onClick={() => setStoryView(true)}
            className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-warm-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Story View
          </button>
          <button
            type="button"
            onClick={onTryAnotherName}
            className="rounded-full px-5 py-3 text-sm font-semibold text-muted transition hover:text-warm-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Try Another Name
          </button>
        </div>
      </div>

      <AnimatePresence>
        {storyView && (
          <StoryCard
            name={nameData.display}
            syllables={nameData.syllables}
            style={def}
            onClose={() => setStoryView(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
