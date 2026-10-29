# Signature Edition baseline

Inspected 29 October 2026. Branch `master`, HEAD `8fa981df43431ce2bedcfafbd539c61740417c37`; clean starting tree.

- Production: JS 291,060 bytes / 90.05 KB gzip; CSS 37,380 bytes / 8.63 KB gzip. Local media: 276-byte favicon; no downloaded art/audio.
- Live local production sample: DOMContentLoaded 378 ms; resources 329,629 bytes; Play-to-active 1,948 ms including the countdown. Concurrent QA was running; this is not a network or physical-phone benchmark.
- All 43 unit tests passed with two workers and a 30-second test timeout. The initial default run timed out in the existing 200,000-wave fairness test.
- The Playwright-requested Chromium 1234 is absent. QA uses installed Chromium 1228 through an ignored local configuration. Baseline screenshots and logs are under `screenshots/milestone-2.4/` and `.cache/baseline-*`.
- Existing screenshots were absent from this checkout. New baseline captures cover the current application.
- The full baseline browser batch attempted every game but finished with 8 passed / 8 failed cases (timeouts and interrupted browser/server work). Complete baseline gameplay is therefore not proven for every game.
- The separate production sample at 1440×900/DPR1 measured 59.31 RAF FPS, 16.7 ms p95, 206 ms DOMContentLoaded and 2,653 ms Play-to-active. At 390×844/DPR2 it measured 49.28 FPS, 33.4 ms p95, 9,313 ms load and 2,175 ms Play-to-active. Other QA was active: particularly the mobile load is a contended-host observation, not a phone/network result.
- Later QA identified Vite watching generated trace HTML and an `EBUSY` Windows watch failure under `.cache`. Generated-artifact ignores were added. Earlier interrupted baseline cases are retained as limitations rather than counted as passes.

| Area         | Finding                                                               | Focus                                                          |
| ------------ | --------------------------------------------------------------------- | -------------------------------------------------------------- |
| Illustration | Flat silhouettes; microwave food, car and mosquito especially simple  | Authored parts, material detail and contact shadows            |
| Animation    | Several actors vanish immediately; border flashes do most of the work | Visible recoil, throws, landings and precision response        |
| Interaction  | Controls work; pause can still queue gameplay actions                 | Gate input during pause; preserve quick retry                  |
| Results      | Three statistics, explanation and verdict compete with score          | Grade, performance, PB, Retry, then Encore                     |
| Replay       | Score-only PB, no daily mastery or variation                          | Honest targets, deterministic medals, separately scored Encore |
| Composition  | Elevator is a large empty striped rectangle                           | Brushed doors, lit cab, physical panel and musical progression |
| HUD          | Repeats scene health/combo/target                                     | Keep time and score; put mechanic state in the scene           |

Canvas 2D stays in production. Cache authored static layers at the backing-store size, keep actors/effects dynamic and capped, and retain the existing DPR cap of two. No additional engine, network service or dependency is needed. Rendering never determines scores or rewards.

Mastery uses a complete run plus meaningful engine-specific performance. Microwave compares mean absolute timing error; score games compare points. Survival games require zero damage for Perfect; sorting games require flawless accuracy and minimum throughput; Elevator requires every requested note and precision. Encore has separate records and unlocks only after a finished daily run.
