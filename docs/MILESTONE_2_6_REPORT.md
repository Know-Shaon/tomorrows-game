# Milestone 2.6 — preproduction checkpoint

30 October 2026. **Incomplete: no generated art or visual upgrade shipped.**

## Latest resume: funding resolved, pricing still blocked

**Public model-page verification and budget update:** the exact public pages `https://kie.ai/gpt-image-2` and `https://kie.ai/nano-banana-2-1` were checked directly, including an ordinary HTML request and a Markdown representation request. Both return **HTTP 403 Cloudflare challenges**. These are webpage failures, not failures of a pricing API. The corresponding live model schemas are accessible but contain no published current price table. Public searches did not supply a usable official table. The user's example rates remain unverified and were not used to authorize spend.

Microwave now has an explicit **150-credit hard cap**; the total ceiling is **650 credits**, preserving at least **250 credits**. Painted Workshop and all existing preparation remain in place. The [art production work log](MILESTONE_2_6_WORK_LOG.md) records those limits, exact candidate model IDs, price-source attempts and zero paid requests. No generated candidate or gameplay change was made.

The latest fresh read of Windows **User** environment `KIE_API_KEY` authenticated successfully and returned **1,004.0 credits** from `GET /api/v1/chat/credit` (`code: 200`). Process and Machine scopes had no credential. The request used the current environment value, not a saved key or a cached balance. No prior key value was retained for a byte comparison.

Current official pricing remains unavailable:

- `https://kie.ai/pricing` and `/market`: HTTP 403, Cloudflare challenge.
- Live catalogue, Getting Started and relevant model schemas: HTTP 200.
- Readable official pages direct price lookup back to `/pricing`; no documented model-price API was found.
- The linked official homepage and public skill-discovery metadata also return HTTP 403. No alternative current price table was retrieved. The available in-app browser could not be created (`Browser is not available: iab`).

The user's resume instructions explicitly require no credit spend when a skill-compliant expected cost cannot be determined. The installed skill's cost-calculation requirement still applies. **There were zero generation requests, uploads or credit spend.** This latest access attempt made one authenticated balance request; public documentation/discovery requests are recorded under `.cache/kie-resume-access/`. The account balance is no longer the blocker.

**Painted workshop** is selected as the working direction from the three existing briefs: matte enamel, restrained gouache shading, broad silhouettes and warm food against a cool room. Paper theatre risks too little improvement over the current vector appearance; illustrated miniature has greater risk of glossy styling and muddy mobile detail. This is a brief selection, not approval of generated output. The art bible records the decision and Microwave composition constraints.

Existing preparation and screenshots were reused. This resume changes only the report and art bible, plus ignored access evidence; no runtime code or dependencies. Baseline quality commands were not rerun. A fresh non-printing comparison of the currently available credential against source and existing build output is recorded in `.cache/m26-security.json`.

No Microwave iteration, other-game asset, visual integration or before/after result exists yet. Performance, accessibility, art payload, share cards and gameplay remain at the previously verified baseline below. Microwave remains the weakest visual game. **M2.6 is not complete; the next implementation step is the funded, costed Microwave pilot.** Existing M2.5 human playtesting can proceed independently; no Milestone 3 work was started.

Evidence: `.cache/kie-resume-access/{pricing-access,official-pricing-link-discovery,public-alternative-discovery}.json`.

## Earlier preparation record

The environment-provided KIE credential authenticated successfully. The official balance endpoint returned **4.0 credits**. Live model documentation was accessible, but `https://kie.ai/market` and `https://kie.ai/pricing` returned Cloudflare 403. Exact current prices could not be verified. No paid task, reference upload, purchase or credential change was made; zero generation credits were spent.

The installed `kie-models` skill requires: **“Calculate expected cost before any paid request.”** Public callback examples are not current price quotations. Their illustrative costs also exceed the available balance for a useful three-concept, edited and separated Microwave pilot. Generation remains pending verified prices and a sufficient funded balance; this is not a request to weaken the pilot gate.

## Initial preparation delivery and status

| Requested report item                | Current evidence / status                                                                                                                                                                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Branch / HEAD                     | `master`, `8fa981df43431ce2bedcfafbd539c61740417c37`. Starting tree already contained uncommitted M2.5 implementation.                                                                                                                    |
| 2. Files changed                     | This turn adds `/art-workbench/` to `.gitignore`, this report and `docs/MILESTONE_2_6_ART_BIBLE.md`. Ignored briefs, copied references, live documentation, scripts and baseline captures are local artifacts. No gameplay source change. |
| 3. KIE integration/security          | Installed skill read. Existing user-environment credential used only in a local authenticated balance request; never copied into source, prompt, report or browser. Repository and build exact-value comparisons found zero matches.      |
| 4. Live models/categories considered | GPT Image 2.5 Flare/Sunburst; Seedream 5 Flash/Pro generation, editing and decomposition; Nano Banana 2.1; Z-image; Recraft background removal/crisp upscale; Topaz upscale. Live schemas cached in `.cache/kie-catalog/`.                |
| 5. Provisional model choices         | Flare for consistent reference editing and native-alpha 1K parts; Flash decomposition for a coherent scene with layer placement metadata. Recraft only if cleanup is required. No model has been visually accepted.                       |
| 6. Credits/tasks                     | 4.0 credits observed; zero paid tasks, zero uploads, zero generation spend. No cost estimate is represented as a current quote.                                                                                                           |
| 7. Direction candidates              | Three written briefs: Painted workshop, Paper theatre, Illustrated miniature. They are **not generated candidates**. Prompts are in `art-workbench/candidates/`.                                                                          |
| 8. Chosen direction                  | None. Shared palette, form, lighting and material constraints are documented in the art bible; selection awaits comparison of real candidates.                                                                                            |
| 9. Microwave before/after            | Before inspected at all four requested sizes. Appliance is visibly stretched tall on portrait screens; food resembles a generic disc. No after image exists.                                                                              |
| 10. Microwave assets                 | None generated. Layer brief covers kitchen, housing, cavity, tray, three foods, glass, steam and live feedback.                                                                                                                           |
| 11. Pilot impact                     | No integrated pilot; no asset or performance delta. Acceptance gate remains closed.                                                                                                                                                       |
| 12. Other six games                  | Current scenes inspected; per-game art priorities documented. No mass production or replacement started.                                                                                                                                  |
| 13. AI artifacts rejected            | No generated outputs to judge. Geometry, pseudo-text, shadows, light, texture and duplicated-part checks are defined.                                                                                                                     |
| 14. Cleanup/tracing                  | None performed; no generated source was available.                                                                                                                                                                                        |
| 15. Animation                        | Existing Canvas animation unchanged. Layer/pose integration is pending the pilot.                                                                                                                                                         |
| 16. Lighting/depth                   | Art bible defines motivated warm/cool lighting and depth per game. No renderer change.                                                                                                                                                    |
| 17. UI reduction                     | No UI changes; existing short action copy retained.                                                                                                                                                                                       |
| 18. Home/posters                     | Current home/poster captured for all seven games at desktop/mobile. No replacement art.                                                                                                                                                   |
| 19. Daily Deck                       | Existing Microwave card confirmed after a real run and reload on desktop/mobile; screenshots saved. No icon change.                                                                                                                       |
| 20. Share cards                      | Existing M2.5 contact sheet inspected and copied to references. No new art or export change.                                                                                                                                              |
| 21. Asset formats/sizes              | Zero new production assets. Existing local static image payload remains 276 bytes. Masters and preparation artifacts are ignored.                                                                                                         |
| 22. Lazy loading                     | Strategy specified: only current-game art, playable fallback, stale-load disposal and decoded-resource release. No speculative loader added before actual assets.                                                                         |
| 23. JS/CSS delta                     | Fresh Vite build: JS 312.70 KB / 98.27 KB gzip; CSS 42.27 KB / 9.71 KB gzip. Delta from supplied M2.5 report: zero at reported precision.                                                                                                 |
| 24. Current-game payload             | Zero added bytes. Future target well below 1 MB/game remains untested.                                                                                                                                                                    |
| 25. Desktop performance              | Production smoke: DCL 231 ms, Play plus instruction start 620 ms. No new FPS sample; M2.5's earlier FPS result remains historical evidence.                                                                                               |
| 26. Mobile performance               | Chromium emulation smoke: DCL 70 ms, Play plus instruction start 454 ms. No physical device or new FPS sample.                                                                                                                            |
| 27. Accessibility                    | Source unchanged. New baseline checks verified viewport fit and readable current controls; real Space inputs completed Microwave. This is not an accessibility certification or a new full audit.                                         |
| 28. Security/runtime KIE             | Zero built `api.kie.ai`, variable-name or actual-key matches. Source actual-key comparison also zero. No provider runtime code introduced. Production dependencies audit: zero reported vulnerabilities.                                  |
| 29. Automated gates                  | Typecheck, lint, format, all 61 unit/React tests, build, diff check and both production Playwright cases pass. Additional baseline script passed 16 combinations with zero browser errors. Full 38-case M2.5 suite was not repeated.      |
| 30. Visual evidence                  | 52 new before screenshots plus eight before contact sheets. No after comparison, signature-motion capture or generated art is claimed.                                                                                                    |
| 31. Weakest visual                   | Perfect Microwave remains weakest; portrait aspect distortion and anonymous food are concrete pilot priorities. Elevator is next for material/personality work.                                                                           |
| 32. Human playtesting                | Existing M2.5 can receive human playtesting now. M2.6 art cannot be judged until the pilot exists.                                                                                                                                        |
| 33. Milestone 3                      | No new readiness claim. M2.6 acceptance conditions are unmet; existing M2.5 conditional-readiness judgment is unchanged. No M3 work.                                                                                                      |

## Model findings

Live [catalog index](https://docs.kie.ai/llms.txt) and model schemas were read rather than relying on remembered names. Relevant findings:

- [Flare generation](https://docs.kie.ai/market/gpt/gpt-image-2-5-flare-text-to-image.md) and [editing](https://docs.kie.ai/market/gpt/gpt-image-2-5-flare-image-to-image.md) expose aspect ratio, resolution and background; transparent background is supported only at 1K. Editing accepts up to 16 reference URLs.
- [Seedream Flash decomposition](https://docs.kie.ai/market/seedream/5-flash-layer-decomposition.md) returns separate PNG layers plus z-order, size, absolute/normalized bounds and placement metadata. Base image and **each layer** are separately billed. There is no hard layer-count parameter, so a prompt cannot enforce an exact cost ceiling.
- [Nano Banana 2.1](https://docs.kie.ai/market/google/nanobanana-2-1.md) supports reference editing but its schema exposes no transparent-background control.
- [Z-image](https://docs.kie.ai/market/z-image/z-image.md) is text-only with a 1,000-character prompt limit and no exposed reference/edit control; cheap sketches would not solve consistent layered asset production.
- [Recraft background removal](https://docs.kie.ai/market/recraft/remove-background.md), [crisp upscale](https://docs.kie.ai/market/recraft/crisp-upscale.md) and [Topaz upscale](https://docs.kie.ai/market/topaz/image-upscale.md) were considered for cleanup, not selected automatically. No video generation was needed for preproduction.

Callback examples show 3 credits for Flare, 3.24 for a Flash image, 12.96 for a Flash base plus three layers, 0.8 for Z-image, 1 for Recraft removal and 0.5 for crisp upscale. **These are illustrative response fields, not verified prices.** An illustrative three-Flare-concept + Flash edit + four-output separation sequence totals 25.20 credits before revisions; the exact payable amount remains unknown. Preserve the 4-credit balance until a viable complete pilot can be budgeted.

## Evidence and commands

- [Art bible](MILESTONE_2_6_ART_BIBLE.md)
- [Mobile gameplay contact sheet](../screenshots/milestone-2.6/before/390-game-contact.png)
- [Desktop gameplay contact sheet](../screenshots/milestone-2.6/before/1440-game-contact.png)
- [Microwave four sizes](../screenshots/milestone-2.6/before/microwave-four-sizes-contact.png)
- [Microwave home / idle / gameplay / result](../screenshots/milestone-2.6/before/microwave-surfaces-contact.png)
- [Current mobile Daily Deck](../screenshots/milestone-2.6/before/390-daily-deck.png)
- [Existing share art reference](../art-workbench/references/m25-share.png)

Baseline script: `.cache/m26-baseline/capture.mjs`; results and raw output: `.cache/m26-baseline/{results.json,capture.log}`. It serves the fresh production build locally, selects games by fixing only calendar dates, and uses ordinary inputs. Gameplay clocks run normally. Real early stops produce Microwave C results; no forced finish or injected score. It checks all seven home/idle/active scenes at 1440×900 and 390×844, plus Microwave at 1280×720 and 360×800. Mobile DPR is two. All stages fit, no horizontal overflow, no browser errors. Temporary baseline server/browser closed.

```powershell
npm run typecheck
npm run lint
npm run format:check
npm test -- --maxWorkers=2 --testTimeout=30000
npm run build
npm audit --omit=dev --json
npm ls --omit=dev --depth=0
node .cache/m26-baseline/capture.mjs
python .cache/m26-baseline/contacts.py
npx playwright test --config .cache/final.config.ts tests/e2e/production.spec.ts --workers=1 --output .cache/m26-production-results
powershell -NoProfile -File .cache/m26-security.ps1
git -c core.safecrlf=false diff --check
```

The build scan compares the actual environment credential in memory without printing it. `.cache/m26-security.json` contains only flags, counts and matching paths. HTTP smoke measurements use a local uncompressed static server, not a production CDN, network throttle or physical phone. All tools were already installed; **no dependencies added**. No commit, push, deployment, backend, engine, game or additional workspace was created.
