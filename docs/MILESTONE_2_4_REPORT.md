# Milestone 2.4 evidence

1. **Branch / HEAD:** `master`, `38b669f69b1dcf2e84ea4f4702c87286470e8082`. No commit, branch, deployment or backend change.
2. **Files changed in this milestone:** `.prettierignore`, `package.json`, `package-lock.json`, `README.md`; `docs/{ARCHITECTURE,PRODUCT_SPEC,MILESTONE_2_4_AUDIT,MILESTONE_2_4_REPORT}.md`; `frontend/{App.tsx,App.test.tsx,styles.css}`; `frontend/components/{DailyPoster,EngineControls,GameCanvas,GameExperience,TodayPage}.tsx`, `game-renderers.ts`, `laundry-pixi-pilot.ts`; `frontend/lib/{gameplay.test.tsx,player-presentation.ts,scene-art.ts}`; `tests/setup.ts`; `tests/e2e/{tomorrows-game,experience,production}.spec.ts`. Earlier M2.2/M2.3 edits and unrelated `outputs/` artifacts are preserved. The formatter now excludes those unrelated generated outputs.
3. **Leaks found:** Laundry printed LIGHT/DARK and spoke “Choose [basket]”; Pothole showed a color/check safe-route diagram and spoke the safe lane; Elevator displayed HIT NOW and a success-window ring; Microwave colored its ring at the scoring window; Mosquito marked its target yellow, named other objects “decoys”, and ignored keyboard attacks on them. Inbox exposed sender/subject only. Samosa had no classification answer.
4. **Fixes:** garment silhouettes and intrinsic descriptions only; physical road obstacles and spoken obstacle locations; current/target clocks without automatic solution prompts; neutral object outlines and literal object descriptions; Space now attacks the current object, including decoys. Debug route information exists only in the explicitly opened development panel.
5. **Title problems:** poster title duplicated the DOM title and overflowed its fixed capsule; Mosquito and Inbox repeated names inside gameplay; other active games lacked a consistent title; Microwave’s long title overflowed its text column.
6. **Alignment:** independent DOM title, no title painted in art, responsive title sizing, four-size browser bounds checks, foreground-safe control placement, legible basket labels, portrait stage with intrinsic actor/text aspect correction. Final screenshot review also caught vertically stretched Inbox text and props: mail cards, washer, bottles, desk props, car, road objects and snack now preserve their proportions around their world positions. Microwave food rotates in the tray's plane.
7. **Copy:** approximately 55–65% less supporting Today copy, including dynamic summary, caption, author and candidate pitches. Static JSX text alone fell from about 137 to 73 words (47%); this is a rough count, not a marketing metric. Before a first run the community sections are absent entirely.
8. **Landing:** small header → today’s title/art → Play → small local score; community follows a completed run. Section headings are smaller; prototype truth remains visible near community controls and in the footer.
9. **Active play:** full-height phone stage, large desktop stage, one verb at start, immediate retry, one title, compact HUD, game-only navigation. Surrounding site sections are unmounted during play.
10. **Pixi pilot:** actual PixiJS 8.18.1 WebGL scene graph for Laundry, independent garments/drum/particles, shared DOM input and deterministic state, DPR cap 2, resize observer, cleanup, pause/retry and context-loss fallback. Desktop and mobile emulation measured 59–60 rAF FPS / 17ms p95. The experimental production build succeeds and adds roughly 150KB gzip in optional renderer chunks.
11. **Decision:** not adopted for ordinary production. Canvas also reaches 60 FPS here, the small GPU scene is not a material visual improvement, and the extra lifecycle/bundle cost is unjustified at this complexity. The opt-in pilot remains reproducible as a development dependency. No WebGPU requirement.
12. **Architecture:** React = shell/accessibility/storage; shared core = deterministic gameplay; Canvas or experimental Pixi = state-driven drawing; browser adapter = pointer/keyboard actions. `player-presentation.ts` holds safe descriptions; `scene-art.ts` shares authored local vector primitives. React review kept heavy code conditional and moved non-component exports out of component modules.
13. **Migrated games:** zero production migrations; Laundry alone has an optional GPU pilot.
14. **Art:** Samosa reuses shaded curved crust art plus crumbs; Laundry adds fabric seams and basket weave; Inbox adds a layered paper stack; Microwave adds food toppings. Existing pigeon, desk, car/road, oven and lift illustrations remain local vector drawings. No new raster or remote assets.
15. **Animation:** Samosa flapping/steam; Pothole road scroll/wheel rotation/steering lean; Mosquito wing flicker/lamp pulse; Inbox card entry; Microwave heat/steam/tray; Elevator traveling light sequence; Laundry drum spin/garment tumble. Decorative motion respects reduced motion.
16. **Controls:** baskets, mail-window Keep/Trash, round appliance Stop, lift-panel Hit; road arrows sit over the road; pigeons/mosquitoes are direct targets. Native buttons retain keyboard/focus support, and direct target acquisition is at least 44 CSS pixels.
17. **Feel:** each game combines its existing synthesized audio and score response with distinct feedback words/particles and scene movement. Failures use a brief impact; reduced motion removes camera reaction/particles. Samosa has snack danger feedback, Pothole a suspension bump, Mosquito swat feedback, Inbox filing feedback, Microwave rating/offset feedback, Elevator chimes/notes, Laundry basket success/error feedback.
18. **Payload/load:** earlier M2.3 JS 89.88KB gzip, CSS 7.71KB; final production JS 90.05KB, CSS 8.63KB. Added image/audio payload: 0 bytes. Pilot optional chunks approximately 150KB gzip. Final local uncompressed static-server measurements were 40ms desktop / 39ms mobile DOMContentLoaded, 329,053 resource bytes and 1,942ms / 1,937ms to active play including the deliberate countdown. These are local measurements, not cellular network benchmarks; no equivalent pre-change load timing was preserved.
19. **Desktop:** all seven tested at 1440×900 and 1280×720; sampled 60 rAF FPS / 17ms p95. Full runs exercise the actual simulation and results.
20. **Mobile:** 390×844 and 360×800 layouts, Pixel 5 touch/DPR-2 emulation, all games and result screens. Sampled 60 rAF FPS / 17ms p95. Physical-phone thermal/GPU performance has not been measured.
21. **Answer tests:** every Laundry token checked in speech and canvas text; all scene text checked for duplicate names, solution-lane and HIT NOW prompts; semantic/direct basket dispatch tested; normal player descriptions omit internal category/decoy metadata. Existing seeded fairness tests remain.
22. **Title/control/reset tests:** four viewports × seven titles, visible title count, overflow bounds, 44px semantic controls, DPR 1/2, keyboard pause, retry and game switch. A browser regression records real Canvas text transforms and rejects portrait distortion; it failed on the original Inbox text, then passed after correction. Pilot checks one canvas after retry and Canvas fallback after WebGL context loss.
23. **Quality gates:** `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build` and `git diff --check` pass. `npm test`: 43 tests in 11 files pass. Final browser command below: 23 passed, 17 intentionally skipped project duplicates, zero failures, 3.6 minutes. This includes all 14 natural desktop/mobile runs, 28 title/layout combinations, controls/retry/reduced-motion journeys, portrait text, WebGL fallback and production exclusion checks. Production dependency audit reports zero vulnerabilities; npm reports 11 development-tool advisories (4 moderate, 7 high), which were not upgraded in this milestone. The installed Node 25 runtime also produces dependency engine warnings; checks passed in this environment.
24. **Screenshots:** ignored `screenshots/milestone-2.4/`: 84 game/title/result captures (7 × 4 × 3), four community captures, two pilot captures, two production captures. Inspected individual images across all seven games and mobile/desktop sizes. Playwright also retains test screenshots/attachments.
25. **Weakest remaining:** Elevator’s environment is sparse and its interaction has less physical character than Laundry or Samosa. Canvas scenes remain stylized vector art; this milestone does not claim hand-painted assets or physical-device performance.
26. **Next milestone:** real-device thumb/contrast/performance playtests and a focused Elevator animation/asset pass. Validate player comprehension/retry behavior before any backend or renderer expansion.

## Player experience review

All seven work from the short action command; none needs a paragraph. The scenes have distinct settings and motion before input. Normal presentation exposes the problem without a solution prompt. The following replay assessment is engineering judgment from browser playthroughs and image inspection, not a user study.

| Game      | Discovery and response                                                               | Reason to retry                                             |
| --------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| Samosa    | Follow diving pigeons; taps repel them, with wing motion, crumbs and sound.          | Protect the snack longer.                                   |
| Mosquito  | Distinguish insects from office objects; swats give hit/miss feedback.               | Improve aim without hitting other objects.                  |
| Microwave | Read the moving clock against the target; Stop produces an offset and rating.        | Reduce timing error.                                        |
| Laundry   | Infer the basket from garment color; sorting gives score, sound and basket feedback. | Keep a longer sorting streak.                               |
| Pothole   | Read physical road hazards and steer; hits bump the car.                             | Travel farther and collect more coins.                      |
| Inbox     | Judge sender and subject; filing moves the stack and reports success/error.          | Decide faster without misfiling.                            |
| Elevator  | Match the moving floor display to the requested note; hits produce chimes.           | Improve timing across the sequence; weakest visual setting. |

## Reproduction

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
$env:RUN_FULL_PLAYTEST='1'
npm run test:e2e -- --grep 'title safe|portrait Inbox|Pixi Laundry|production excludes|all seven|full playtest: desktop .* run 1|full playtest: mobile' --workers=3
```

The full-run automation reads intrinsic object characteristics; its Pothole test deliberately changes lanes rather than reading an internal safe-route answer. Test success verifies execution, input and absence of errors, not expert player skill or subjective enjoyment.

## References used for interaction principles

[WarioWare](https://www.nintendo.com/us/store/products/warioware-move-it-118742/), [Dumb Ways to Die](https://www.dumbwaystodie.com/games), [Neal.fun](https://neal.fun/), [Madbox / Stickman Hook](https://www.madbox.io/), and [Level Devil](https://playleveldevil.com/) informed short commands, direct action, distinct situations and fast retry. No reference artwork or branding was copied. [Pixi’s renderer guidance](https://pixijs.com/8.x/guides/components/renderers) supports the WebGL-first experiment.
