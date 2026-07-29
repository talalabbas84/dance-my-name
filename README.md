# Dance My Name

Type your name and turn it into a salsa or bachata rhythm. A playful,
mobile-first, shareable web experience — no signup, no backend, no external
audio files. Every percussion sound is synthesized live with the Web Audio
API.

## Requirements

- Node.js 20.9+ (this repo was built and tested on Node 22.23.0 — see
  `.nvmrc`). Next.js 16 will fail to build on Node < 20.9.

## Getting started

```bash
nvm use          # picks up .nvmrc (Node 22.23.0)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run lint       # ESLint (flat config, eslint-config-next)
npx tsc --noEmit   # strict TypeScript check
npm run build      # production build (Turbopack)
npm run start      # serve the production build
```

## How it's organized

- `src/lib/rhythm/` — pure, framework-free rhythm logic: name validation and
  syllable splitting (`name.ts`), the salsa/bachata pattern data
  (`styles.ts`), syllable-to-beat mapping (`mapping.ts`), and share text/URL
  helpers (`share.ts`).
- `src/lib/audio/` — the Web Audio layer: oscillator/noise-based percussion
  synthesis (`sound.ts`) and a look-ahead scheduler (`RhythmEngine.ts`) that
  schedules beats against the `AudioContext` clock rather than `setInterval`.
- `src/hooks/` — `useRhythmEngine` (React binding for the audio engine, with
  a silent visual-only fallback if `AudioContext` is unavailable) and
  `usePrefersReducedMotion`.
- `src/components/` — presentation: `NameEntry`, `StyleToggle`,
  `SyllableDisplay`, `BeatCounter`, `TempoControl`, `TapMode`,
  `AudioControls`, `ShareButton`, `StoryCard`, and `RhythmPlayer` /
  `DanceMyNameApp`, which compose everything into the result screen and the
  overall landing → result state machine.

Adding a new style (merengue, cha-cha, reggaeton) means adding one entry to
`RHYTHM_STYLES` in `src/lib/rhythm/styles.ts` — the rest of the app is
data-driven off that definition.

## Sharing a rhythm

State lives entirely in the URL — no backend. A shared link like
`/?name=Talal&style=bachata` restores the name and style on load. The Share
button uses the Web Share API where available, falling back to copying a
share-text string to the clipboard.

## Deploying

This is a stock Next.js App Router project — deploy directly on
[Vercel](https://vercel.com/new) by importing the repo. No environment
variables or backend services are required.
