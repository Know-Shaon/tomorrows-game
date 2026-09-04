# Architecture

```text
browser UI (frontend/) ── input per fixed tick ──> deterministic core (shared/)
         │                                            │
         ├── Canvas rendering                         ├── seeded RNG
         ├── localStorage adapter                      ├── state machine
         └── share-card Canvas                         ├── validated daily configs
                                                      └── explicit engine dispatch

Cloudflare Worker entry (backend/) ── serves only built static assets
```

The shared core accepts plain data and has no DOM, Canvas, timing, storage, or network dependency. The browser runner uses a 60 Hz fixed timestep and caps catch-up work after delayed frames. A discriminated `DailyGameConfig` selects one of seven explicit simulation modules: tap defense (`defense-v1`), constrained lane driving (`dodge-v1`), target hunting (`tap-v1`), message classification (`classify-v1`), elapsed-time precision (`timing-v1`), floor-sequence rhythm (`sequence-v1`), or garment sorting (`sort-v1`). Daily definitions use enumerated tokens and validated primitive fields; they cannot inject HTML, CSS, JavaScript, expressions, or remote asset URLs. Canvas drawing is browser-only and scales its backing store to a capped device-pixel ratio.

Prototype state uses a versioned localStorage record. Parse failures and unsupported storage fall back safely to defaults. No sensitive data belongs there.

The Worker entrypoint only delegates to the Cloudflare static asset binding in this milestone. Database, identity, moderation, production voting, and administration are deferred.
