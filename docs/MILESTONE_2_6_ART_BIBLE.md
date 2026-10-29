# Milestone 2.6 art bible

30 October 2026. Painted workshop is the selected working brief; no generated artwork or pilot has been accepted.

## The family

Premium illustrated everyday arcade: familiar objects, deliberate silhouettes, tactile materials and a little mischief. Keep the dark editorial shell, cream typography and short action words. The illustration should supply character; the interface should supply exact information.

| Element     | Production rule                                                                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shape       | Broad, slightly asymmetric silhouettes; rounded mechanical corners; one recognizable feature per small prop.                                                         |
| Edges       | Crisp silhouette, softened internal shading; dark colored outlines only where separation needs them. No universal thick black contour.                               |
| Palette     | Ink `#0b1d31`, cream `#fff5df`, muted teal and warm ochre form the family. Coral, violet, green and cyan distinguish games.                                          |
| Saturation  | Quiet surroundings, a stronger actor accent, the brightest value reserved for interaction or success.                                                                |
| Light       | One motivated key light and subdued opposite-temperature fill. Warm highlights, colored shadows, no arbitrary neon halo.                                             |
| Shadows     | Tight contact shadow beneath an object; broader soft cast shadow away from it. No detached floating props.                                                           |
| Materials   | Matte painted metal, woven cloth, toasted pastry and lightly reflective glass. Two or three readable texture cues, no high-frequency noise.                          |
| Characters  | Expressive pose and silhouette; modest exaggeration of head, wing and eyes. No franchise resemblance or branded features.                                            |
| Environment | One clear place, two or three supporting props, quiet space around targets. Foreground, gameplay plane and distant context have distinct contrast.                   |
| Perspective | Shallow consistent perspective for appliances and rooms. Actors and interaction zones retain the existing simulation geometry.                                       |
| Texture     | Restrained painted grain visible at desktop size, clean color masses at 360px. Texture must survive WebP compression without muddy edges.                            |
| Highlights  | Small broad cream shapes following material curvature. Glass uses a few controlled translucent reflections.                                                          |
| Icons       | Simplified silhouettes from the accepted production art, readable at 32–48px; mastery remains a separate live mark.                                                  |
| Effects     | Short authored arcs, feather/crumb fragments, warm light pulses and clear success labels. Bounded Canvas particles; reduced motion uses static color/value feedback. |

Never generate letters, numbers, UI text, timer values, answer labels, titles, logos, watermarks, directions to safe lanes or future content. All required information stays in the deterministic simulation and accessible programmatic layers.

## Three concepts to compare

These are briefs, not generated candidates. The working direction is selected below; production assets still require visual review.

1. **Painted workshop:** matte enamel, restrained gouache texture, warm food against a cool kitchen, confident editorial silhouettes. Test whether texture adds character without reducing mobile clarity.
2. **Paper theatre:** cut-paper depth, crisp bevel-like edge accents, layered soft shadows and economical geometric character. Test whether it materially exceeds the existing vector appearance.
3. **Illustrated miniature:** shallow dimensional staging, hand-painted surfaces, soft directional lighting and selective detail. Reject toy-like glossy rendering or excessive background realism.

Each concept uses the same Microwave subject and composition: a charming original appliance on a small kitchen counter, one readable food hero, a separate object study and a gameplay composition with blank display/control areas. Use existing screenshots as composition references, not as style authority.

**Selected working direction: Painted workshop.** Crisp silhouettes, restrained matte texture and warm/cool material separation offer the strongest balance of original character, phone readability and reusable layers across all seven games. Housing, food, tray and glass remain separable for inexpensive animation. Paper theatre is practical but risks staying too close to the existing vector look. Illustrated miniature offers depth but increases the risk of glossy styling, muddy mobile detail and difficult layer extraction.

This selection evaluates the prepared briefs, not generated pixels. Review actual outputs for recognition, gameplay readability, family consistency, originality, mobile clarity, separable animation, production practicality and payload. A successful render is not acceptance.

## Microwave pilot

The current portrait rendering stretches a square composition into a tall stage. The appliance becomes unusually narrow; the food reads as a generic disc. The pilot must fix composition and recognizable food before adding detail.

Keep the housing broad and use quiet kitchen wall/counter space to absorb portrait height. Begin with one unmistakable folded pastry: a crimped edge and a few large toasted patches. Reserve uncluttered dark display areas for live information; keep reflections away from them. Texture stays inside broad color masses, with no tiny highlight speckles or decorative grain.

| Layer    | Intended treatment                                                                                                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kitchen  | Cool muted wall, one shelf or plant, countertop; cover-cropped background only.                                                                                         |
| Housing  | Original warm enamel appliance with controlled asymmetry, dimensional side/top, one handle, plausible physical buttons, blank display. Preserve its native proportions. |
| Interior | Separate cavity and warm lamp pool, tray and food contact shadow.                                                                                                       |
| Tray     | Separate elliptical plate; subtle highlights and rotation cue.                                                                                                          |
| Food     | Three clearly different non-branded foods: pizza slice, folded pastry and noodle bowl. Keep bowl upright; do not rotate the whole illustration like a flat disc.        |
| Glass    | Independent translucent door/reflection mask; avoid reflections across the timer.                                                                                       |
| Steam    | Programmatic soft curls with bounded lifetime; no continuous animation under reduced motion.                                                                            |
| Feedback | Warm interior light responds to STOP; PINPOINT gets a brief controlled brightness accent and existing live label.                                                       |

Timer, target, round, STOP control and Blind Finish visibility remain live. Fit foreground assets without nonuniform scaling. Reposition the complete appliance within available space instead of stretching it. Canvas hit regions, semantic controls and timing rules remain unchanged.

Compare old/new at 1440×900, 1280×720, 390×844 and 360×800: idle, active, PINPOINT, result and Encore Blind Finish. Check aspect ratio, readable controls, layering, keyboard flow, reduced motion, asset failure fallback, payload and frame cadence. Continue to the other games only after a visible material improvement and passing functional/performance checks.

## Family expansion after acceptance

| Game               | Art priority                                                                                    | Light and depth                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Samosa Shield      | Pigeon body/head/wing parts, readable poses, toasted folded samosa and plate.                   | Evening roof, warm rim light, softer skyline and restrained foliage.   |
| Pothole Patrol     | Original car, wheel detail and strong pothole silhouette; decoration independent of collisions. | Clear outdoor key light, subdued distant city, readable road plane.    |
| Mosquito Meeting   | Strong mosquito body/wing silhouette and tactile desk objects.                                  | Warm desk-lamp pool in cool night room; targets dominate.              |
| Inbox Zero Hero    | Original sender tokens, paper/stamp surfaces and physical stacks.                               | Soft desk light; actual sender and subject text stays live.            |
| Elevator Orchestra | Brass cab, split doors, physical button/display frames and reflected light.                     | Warm overhead light, coherent brushed material; live floors and notes. |
| Laundry Logic      | Recognizable T-shirt, sock, hoodie, jeans and towel; washer and baskets.                        | Cool room with warm machine accents; no category labels in art.        |

Posters, deck tokens and share art reuse accepted source shapes and palettes. Titles remain HTML; share-card text remains programmatic. No separate promotional art style.

## Production discipline

- Keep references, candidates, selected masters, processed assets, rejected work and motion studies in ignored `art-workbench/` subdirectories.
- Download every successful generation immediately. Record model/schema, prompt, task ID, observable cost, output and review decision without credentials.
- Inspect geometry, handles/buttons, letters/symbols, perspective, contact shadows, light direction and texture at native size and mobile scale. Correct, trace or reject defects.
- Prefer WebP for illustrated raster layers; SVG for clean tokens and reconstructed details. Retain masters locally. No generated video in gameplay.
- Load only the current game's art; optional decoration failure must retain playable Canvas fallback. Release decoded resources on switching; discard stale loads.
- Aim well below 1 MB compressed per game, no seven-pack preload, approximately 60 FPS. Record actual compressed bytes and measured performance before acceptance.
- KIE is an offline studio only. No credential, temporary provider URL or provider request may reach the frontend or production bundle.

## Current acceptance status

Preproduction only. Existing Milestone 2.4/2.5 scenes, home/poster, results, deck implementation and share contact sheets were inspected. Painted workshop is the selected working brief. The refreshed environment authenticates with 1,004 credits, but current pricing is still inaccessible. Generated assets, layered pilot, before/after comparison and expansion remain pending cost verification and visual acceptance. This document is not a claim of Milestone 2.6 completion.
