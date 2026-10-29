# Milestone 2.5 — Signature Edition

Implementation and verification: 29–30 October 2026.

Implemented locally on `master`, HEAD `8fa981df43431ce2bedcfafbd539c61740417c37`. No commit, push, deployment, backend, new engine or new daily game. The starting tree was clean. No dependencies added; authored Canvas/SVG geometry and synthesized WebAudio use existing browser APIs. The existing optional Pixi pilot remains development-only.

## Baseline and rendering

The [baseline audit](MILESTONE_2_5_AUDIT.md) records the inspection before implementation. Baseline browser automation attempted every game on desktop/mobile: 8 of 16 cases passed; timeouts and browser/server interruptions prevented a clean complete baseline matrix. Thus baseline visual evidence is useful, but it is not a claim that every baseline run passed. All 43 original unit tests passed with the existing expensive fairness test given a 30-second timeout.

Canvas 2D remains the production renderer. Scene order is cached environment/material layers, moving actors, foreground controls/occlusion, then bounded impact effects. Static layers use detached native-resolution canvases owned through a WeakMap; backing-store changes invalidate them, and leaving a game releases their owner. DPR remains capped at two. Gradients, brushed doors and environment detail are cached; actor parts remain dynamic. Workers/OffscreenCanvas, raster atlases and Path2D pose caches were unnecessary for these small scenes and would add lifecycle or invalidation work. No large raster backgrounds or remote media ship.

Pure fixed-tick transitions generate signature events. Rendering consumes those events without awarding points or changing simulation time. Effects have bounded particles and short lifetimes. Decorative recoil, throw arcs and lighting do not affect hit tests. Inactive-page pause and requestAnimationFrame remain in place.

## Seven games: art, motion, signature, grades, medals and Encore

| Game               | Asset and motion changes                                                                                                                                  | Signature moment                                                                                                              | Grade / medal criteria                                                                                                                                                   | Encore                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Samosa Shield      | Rooftop lights, plant, skyline; toasted crust, seam detail, steam and plate shadow; articulated pigeon head/wing/feet, wing flap and repel follow-through | A successful shoo inside the final 200 world units creates a last-second-save label, feather burst, retreat and audio accent  | B/Clear: survive; A/Great: at most one escape; S/Perfect: zero escapes, with successful shooing                                                                          | Hungry Hour: 20 seconds, 10% shorter approach times                                                   |
| Pothole Patrol     | Layered city/curbs, authored car body/windows/wheels/lights, contact shadow and suspension; road motion and impact reaction                               | Narrow safe passage at hazard resolution: near-miss label, streak/ring and accent; no score bonus or altered collision window | B/Clear: survive; A/Great: at least two health; S/Perfect: three health and hazards avoided                                                                              | Rush Hour: 20 seconds, 12% shorter wave intervals with reachability floor                             |
| Mosquito Meeting   | Night office, lamp pool, window, keyboard; mosquito body, eyes, legs and wing motion; bounded swat particles                                              | Clean combo meter and escalating hit energy/pitch                                                                             | B: 3+ hits, 60% accuracy; A/Great: 8+ hits, 90%; S/Perfect: 10+ hits, no misses, average reaction at most 500 ms; Clear requires a hit and full duration                 | Lights Out: 20 seconds, lower ambient light with readable targets                                     |
| Inbox Zero Hero    | Layered stationery, avatars/stamps and paper shadows; aspect-correct throw arc, destination stack response                                                | Rapid correct decisions build stamped throws and rising sound rhythm                                                          | B: 5+ correct, 60% accuracy; A/Great: at least ceil(duration × .4), 90%; S/Perfect: ceil(duration × .6), no mistakes; Clear requires correct decisions and full duration | Inbox Storm: 20 seconds, 18% less decision time                                                       |
| Perfect Microwave  | Material housing, dark glass/reflections, handle, lit textured food, plate rotation and steam                                                             | Exceptional stop produces PINPOINT, interior/display emphasis and precision sound                                             | Clear: all rounds; B: mean absolute error ≤150 ms and every stop ≤300 ms; A/Great: every stop ≤75 ms; S/Perfect: every stop ≤25 ms                                       | Blind Finish: same rounds/duration, timer hidden in the final 400 ms in Canvas and accessibility text |
| Elevator Orchestra | Brushed split doors, brass cab, reflected light, physical buttons/display, moving floor indicator; doors open on successful notes                         | Correct hits construct an original eight-note phrase with note/light response                                                 | Clear: completed sequence with a hit; B: at least half the notes; A/Great: ≥85%, at most one miss; S/Perfect: all notes, no misses, ≥90% maximum precision points        | Express: 20 seconds, eight notes, 15% faster travel                                                   |
| Laundry Logic      | Recognizable garment silhouettes with seams/folds, contact shadows and tumble; washer, shelf, basket rims and landing arcs                                | Long clean combos enter SPIN FLOW: washer/light movement, basket response and escalating pitch                                | Same throughput/accuracy grade thresholds as Inbox, applied to sorting                                                                                                   | Spin Cycle: 20 seconds, 15% shorter fall time                                                         |

C denotes performance below B; it can still earn Clear where completion qualifies. Failed/incomplete/idle snapshots never earn Perfect. Played, Clear, Great and Perfect are ordered local records; the visible achievement strip contains Clear/Great/Perfect. Tests establish achievable S outcomes for all seven Daily and all seven Encore configurations, and preserve deterministic simulation/fairness checks.

The Elevator pass also fixed an existing correctness bug: direction previously flipped repeatedly around an unanswered requested floor. The lift now passes and misses that floor, choosing its next direction when the request advances. A regression test failed against the old logic and passes with the fix. Results only say every floor landed when every note actually landed.

## Replay, results and local state

- The result hierarchy is grade, performance, PB comparison, dominant Retry, then unlocked Encore. Original diagnostic statistics are behind Details; Share/Save card/Community/Today are secondary. Near-PB gaps are exact differences, including ties and lower-is-better timing. “One mistake from Perfect” requires the actual throughput condition. Microwave reports mean absolute milliseconds instead of pretending points are the timing PB.
- Quiet BEAT targets appear where useful; precision games keep their attention in the scene. Retry resets simulation and starts with a 140 ms cue; first start uses 180 ms. A 260 ms final impact hold leads into the result. Transitions are brief, and reduced motion removes decorative movement.
- Encore unlocks only after a finished normal run for that local day/game. It reuses the same engine/seed and stores a separate PB. Encore does not upgrade the normal Daily Deck medal or daily score. No repeat-grinding rewards are added.
- Nested mastery storage is version 1 inside the existing version-1 prototype store. Migration retains existing scores, sound preference and streak. Best grades/medals remain monotonic. The compact Daily Deck shows seven recent cards, retaining at most 90 locally. Current and longest local streaks appear without urgency or recovery prompts.
- The run pins its starting day for result/deck persistence. Records remain device-local, with no account or analytics calls.

## Share art, audio, copy and accessibility

Save card generates an original local 1200×630 PNG containing title/icon, day, mode, grade, public performance, medal and streak. The renderer also supports 2×/3× export on demand. A typed public projection excludes target answers, classification solutions, safe routes and future games. Tests check that projection and export scaling; real browser downloads cover all 28 Daily/Encore runs. The share cards are generated only when requested and add no initial media payload.

Synthesized audio adds combo pitch steps, save/near-miss/Encore accents, PB and S-rank stings, plus an original eight-note Elevator motif. There is no continuous soundtrack. Sound remains opt-in and persisted; browser tests exercise oscillator creation and muting. This proves audio execution, not subjective speaker/listening quality.

The active screen now keeps title, time, score and quiet personal target; health, timing, floor requests, combo and current objects live mainly in the world. Duplicate HUD detail and the always-expanded result statistics were removed. Copy uses SHOO, DODGE, SWAT, DECIDE, STOP, HIT and SORT; result targets state actual conditions.

Controls retain semantic labels, keyboard operation, visible focus and 44px targets. Pause prevents queued gameplay input; Space/Enter on focused buttons uses native activation. Pause dialogs contain keyboard focus. DOM status gives equivalent intrinsic problems without leaking decisions or Blind Finish timing. Reduced motion retains readable labels, colors and static success feedback while removing throw/recoil/transition movement. Mobile/high-DPI, portrait text proportions, answer integrity and title safe areas are covered by browser assertions.

## Local playtest metrics

The development-only lazy-loaded recorder tracks first completion, Retry, Encore start/completion, S/A/B/C distribution, Perfect, PB improvements, runs in the current session and elapsed result-to-Retry time. Encore entry does not increment Retry; dwell time starts when the result is visible and ends at the press. Reset clears local counters. No external analytics. Production assertions check that tuning, Pixi code and telemetry identifiers are absent. Automated replay counts are test activity, not retention evidence.

## Measurements and validation

| Payload (Vite production report, decimal KB) | Milestone 2.4 baseline | Signature Edition |         Delta |
| -------------------------------------------- | ---------------------: | ----------------: | ------------: |
| JavaScript raw                               |                 291.06 |            312.70 |        +21.64 |
| JavaScript gzip                              |                  90.05 |             98.27 |  +8.22 / 9.1% |
| CSS raw                                      |                  37.38 |             42.27 |         +4.89 |
| CSS gzip                                     |                   8.63 |              9.71 | +1.08 / 12.5% |
| Local static media bytes                     |                    276 |               276 |             0 |

The increase pays for authored vectors, mastery/Encore/results and share generation. No new dependency or preloaded image/audio bytes. Vite's gzip estimates are used consistently for the comparison; a separate Node gzip-default measurement of the final files was 97,354 JS bytes and 9,658 CSS bytes.

| Baseline local production sample                               | Desktop 1440×900, DPR1 | Mobile emulation 390×844, DPR2 |
| -------------------------------------------------------------- | ---------------------: | -----------------------------: |
| DOMContentLoaded                                               |                 206 ms |                       9,313 ms |
| Play → active, including instruction-start click and countdown |               2,653 ms |                       2,175 ms |
| RAF FPS / p95 interval                                         |        59.31 / 16.7 ms |                49.28 / 33.4 ms |

Baseline sampling overlapped other QA; especially the mobile load is not a representative network/phone result. Final sampling uses the built static production output with no simultaneous browser QA. These host measurements do not establish a causal speedup over Milestone 2.4.

Final production sample, 190 RAF callbacks per game with the first ten omitted, installed Chromium 1228:

| Game      | Desktop RAF FPS / p95 ms | Mobile DPR2 RAF FPS / p95 ms |
| --------- | -----------------------: | ---------------------------: |
| Samosa    |              59.0 / 16.7 |                  60.0 / 16.7 |
| Pothole   |              58.4 / 16.8 |                  60.0 / 16.7 |
| Mosquito  |              60.0 / 16.7 |                  59.3 / 16.8 |
| Inbox     |              60.0 / 16.7 |                  60.0 / 16.8 |
| Microwave |              60.0 / 16.7 |                  59.3 / 16.8 |
| Elevator  |              60.0 / 16.7 |                  60.0 / 16.8 |
| Laundry   |              59.0 / 16.8 |                  60.0 / 16.8 |

Actual game-canvas paint cadence was also instrumented: desktop 58.4–60.0 paints/sec with 18.1–20.1 ms p95 intervals; mobile 59.4–60.3 paints/sec with 18.1–18.4 ms p95. Paint intervals include React/effect scheduling and are not GPU execution durations. Short-window sampling explains minor values above display refresh. No sustained decoration spike appeared in this sample; this does not profile every worst-case effect burst.

Desktop DOMContentLoaded was 61–136 ms and Play→active 407–739 ms; mobile was 56–76 ms and 376–511 ms. Start measurements include the automated Play and instruction-start clicks. Mobile backing resolution reaches 760×1460 for a 380×730 CSS stage; gameplay remains DPR-capped at two. Full mobile browser runs also used the Pixel 5 emulation profile, whose higher device DPR remains capped by the renderer. No CPU/network throttling or physical device was used.

Command: `node .cache/final-performance.mjs`. Raw samples: `.cache/final-performance.json` and `.cache/final-performance.log`. The harness fixes only the calendar date to select seven production games; simulation/performance clocks run normally. Production screenshots are `screenshots/milestone-2.5/production-{1440,390}-*.png`.

The preserved development four-size matrix additionally measured 36–46 RAF FPS at 1440×900, 47–57 at 1280×720 and 60 at the two narrow viewports (that matrix uses DPR1). These lower desktop observations are retained, not replaced by a universal 60 FPS claim. The development Pixi pilot measured 20 FPS/83 ms p95 on desktop and 9 FPS/167 ms p95 in an earlier mobile-emulated batch. Neither ships in production.

Quality commands:

```powershell
npm run typecheck
npm run lint
npm run format:check
npm test -- --maxWorkers=2 --testTimeout=30000
npm run build
git -c core.safecrlf=false diff --check
```

All pass: 61 unit/React tests across 17 files, including existing deterministic, fairness, integrity and state-machine tests. New tests cover grades/medals, PB differences, reachable Perfects, 40,000 Encore Rush Hour waves, unlock/migration/persistence, collection/streak, result actions, share projection/scaling, audio preference/phrase, local metrics and Elevator misses. The existing 200,000-wave fairness check remains intact.

Browser commands used `.cache/final.config.ts` to select installed Chromium, the files `tests/e2e/{signature,experience,tomorrows-game,production}.spec.ts`, and one or two workers. Raw commands/results are in `.cache/signature-browser.log`, `.cache/layout-browser.log`, `.cache/failure-browser-rerun.log`, `.cache/low-grade-final.log`, `.cache/regression-final.log` and `.cache/recheck-final.log`. Full runs use visible/intrinsic problem descriptions and ordinary game inputs, with no forced completion or answer hook. Only layout smoke tests use the existing development Finish control.

All 28 Daily/Encore full runs passed, including share downloads, medals, separate mode entry, Retry and deck reload persistence. After the Elevator fix, its four full runs were repeated: desktop S/S, mobile A/B. Other observed Daily/Encore grades were S/S for Samosa, Pothole, Inbox and Laundry; B/B for Mosquito; Microwave A/A desktop and S/S mobile. Full-run Retry latency was 225–437 ms (the repeated Elevator sample was 302/397 ms). Poor-play/audio checks establish the contrasting C outcomes. Production tests on both browser projects passed the absence of tuning, renderer-pilot and telemetry code/UI.

Interrupted test attempts are recorded in the logs. Causes included the generated-file Vite watcher failure, a file-normalization HMR reload during automation, an audio-probe test using an inherited method incorrectly, an Inbox assertion preceding the first Canvas paint and an Elevator bad-play bot accidentally earning B. Test probes now wait for painted evidence and deliberately miss Elevator notes; assertions on game outcomes and production separation remain intact.

## Files changed

Final browser coverage: **38 distinct cases passed across batches**: 14 full Daily+Encore cases (28 runs), 14 poor-play/audio cases, one seven-game/four-size reduced-motion layout case, and nine preserved regression/production cases. Project-specific duplicate cases are skipped as configured. `.cache/recheck-final.log` ends with 9 passed / 1 configured skip; it closes all previously failed regression and poor-play cases. The original full-run and layout evidence remains in their earlier logs.

- Simulation: `shared/game/{mastery,encore,signature}.ts`, `platform.ts`, `types.ts`, `sequence-engine.ts`; mastery/signature/sequence-miss tests.
- Rendering/assets: `frontend/components/game-renderers.ts`, `GameIcon.tsx`; `frontend/lib/{signature-art,signature-fx,scene-cache,scene-art}.ts`.
- Product/state: `frontend/App.tsx`, `components/{GameExperience,RunResult,TodayPage}.tsx`, `lib/{mastery-storage,storage,game-result,player-presentation,share-card,audio}.ts`, `styles.css`; associated result/storage/share/audio tests.
- Dev metrics: `frontend/lib/playtest.ts`, its tests and `components/DevPlaytestPanel.tsx`.
- QA/tooling: `tests/e2e/{signature,experience,production,tomorrows-game}.spec.ts`, `tests/setup.ts`, `vite.config.ts`, `eslint.config.js`, `.prettierignore`, `.prettierrc.json`, this report and the baseline audit. No dependency or lockfile changes.

Vite now ignores generated traces, screenshots and cache artifacts. During QA it previously watched generated trace HTML and hit a Windows `EBUSY` watch failure; the ignore list prevents that feedback loop. Prettier accepts the checkout's existing line endings. Expensive browser matrices have larger timeouts without weakened assertions. The installed Chromium 1228 is selected through ignored `.cache/final.config.ts`, because Playwright's expected Chromium 1234 is absent.

## Evidence and remaining judgment

Quick visual indexes: [clean mobile production scenes](../screenshots/milestone-2.5/production-390-contact.png), [clean desktop production scenes](../screenshots/milestone-2.5/production-1440-contact.png), [share cards](../screenshots/milestone-2.5/share-contact.png). Full-run captures use the development launcher; production captures verify the shipped surface separately.

Evidence lives in `screenshots/milestone-2.5/`: four-size game/results, desktop/mobile Daily and Encore sequences/results/share downloads, 14 short three-frame GIFs and contact sheets. Three frames sampled roughly 900 ms apart show scene changes; they are not smooth video or proof of human comprehension. `screenshots/milestone-2.4/` preserves baseline captures. `.cache/` contains raw command logs and performance JSON. Generated evidence is intentionally ignored by Git.

The weakest remaining game is **Perfect Microwave**: its precision feedback is stronger, but its static appliance composition and food motion still have less personality than the character-led games. The collection/result presentation is coherent and the seven mechanics are visibly distinct; whether silent clips communicate immediately, inputs feel premium and Retry is tempting requires a small human playtest.

**Milestone 3 readiness: conditional.** The local implementation is suitable for a frontend review/playtest checkpoint. Do not treat browser emulation as physical Android/iOS performance, thumb ergonomics, screen-reader certification, subjective audio quality or measured human retention. Validate those before expanding into backend/community work. No Milestone 3 implementation was started.
