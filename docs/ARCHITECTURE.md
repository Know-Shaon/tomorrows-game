# Architecture

```text
browser UI (frontend/) ── input per fixed tick ──> deterministic core (shared/)
         │                                            │
         ├── Canvas rendering                         ├── seeded RNG
         ├── WebAudio synthesizer                      ├── eased difficulty curve
         ├── localStorage adapter                      ├── state machine
         └── share-card Canvas                         ├── validated daily configs
                                                      └── explicit engine dispatch

Cloudflare Worker entry (backend/) ── serves only built static assets
```

The shared core accepts plain data and has no DOM, Canvas, timing, storage, or network dependency. The browser runner uses a 60 Hz fixed timestep, a ref-backed action queue, and capped catch-up work after delayed frames. Microwave stop input captures the visible simulation clock at the input event, so display and scoring share one authority. A discriminated `DailyGameConfig` selects one of seven explicit simulation modules: tap defense (`defense-v1`), constrained lane driving (`dodge-v1`), target hunting (`tap-v1`), message classification (`classify-v1`), elapsed-time precision (`timing-v1`), floor-sequence rhythm (`sequence-v1`), or garment sorting (`sort-v1`). Daily definitions use enumerated tokens and validated primitive fields; they cannot inject HTML, CSS, JavaScript, expressions, or remote asset URLs. Canvas drawing is browser-only and scales its backing store to a capped device-pixel ratio.

The visual layer has two intentionally separate Canvas paths: `DailyPoster` renders detailed 900×700 discovery art, while `game-renderers` renders the interactive 1000×1000 scenes. Both are deterministic, generated locally, and use DPR-backed canvases; CSS supplies responsive framing, surfaces, focus states, and reduced-motion fallbacks without entering shared game logic.

Prototype state uses a versioned localStorage record. Parse failures and unsupported storage fall back safely to defaults. Optional sound is synthesized after interaction with WebAudio and needs no media asset. Development playtest summaries use a separate localStorage key and their UI/code is removed from production bundles. No sensitive data belongs in either store.

The Worker entrypoint only delegates to the Cloudflare static asset binding in this milestone. Database, identity, moderation, production voting, and administration are deferred.

## Milestone 2.4 rendering experiment

React owns the accessible title, controls, result flow and persistence. `player-presentation.ts` translates state into intrinsic descriptions, never classification answers. Canvas uses shared local art primitives and state ticks for animation. Pointer adapters provide a minimum 44px acquisition area without changing the shared simulation.

`laundry-pixi-pilot.ts` is an opt-in PixiJS 8.18.1 WebGL experiment (`?pixi=1` in development, or `npm run build -- --mode renderer-pilot`). Its scene graph consumes the same state and DOM input bridge, has no independent simulation clock, and cleans up on unmount. Context loss or initialization rejection falls back to Canvas. The ordinary production build removes this import and all tuning UI/renderer identifiers. Pixi remains a development dependency solely to reproduce the comparison; the seven production games remain Canvas-rendered.
