# Tomorrow's Game — prototype product spec

## Promise

“Suggest it today. Vote tonight. Play it tomorrow.”

Tomorrow's Game is a mobile-first daily browser arcade. A visitor should understand today's 20–45 second challenge and start it within five seconds, then see a score, local personal best, clearly labelled demo leaderboard, local-only community vote, and device-only suggestion form.

## Prototype scope

This milestone provides a reusable deterministic platform with one explicit engine per game: `defense-v1`, `dodge-v1`, `tap-v1`, `classify-v1`, `timing-v1`, `sequence-v1`, and `sort-v1`. It includes three-phase deterministic difficulty, seven distinct Canvas scenes and control schemes, queued keyboard/pointer/touch input, pause/resume, optional local synthesized sound, human-readable score and personal-best moments, rapid retry, local preferences and best scores, demo community data, and accessibility/responsive support.

It does not provide accounts, a production database, public submissions, administration, deployment, public challenge links, or runtime AI.

## Success criteria

- The opening viewport makes the challenge and Play action immediately clear.
- Identical seeds, configurations, and input events produce identical results.
- Early play teaches, middle play concentrates, and the final portion tightens without becoming impossible.
- Gameplay remains complete and understandable while muted or with reduced motion.
- The complete interaction works at 360–430px and desktop sizes.
- Prototype and demo information is never presented as live community data.

## Milestone 2.3 visual standard

This section records the preceding milestone; the interaction standard below supersedes its page hierarchy.

The experience uses one premium dark arcade system across discovery, play, and results: cream display type, restrained per-game accents, layered translucent surfaces, softened borders, and compact data typography. Every daily game has bespoke local key art and a recognizably different scene. At 390px, the title and primary Play action stay in the first viewport, controls remain at least 44px, and no horizontal scrolling is introduced. Motion is brief and decorative, with explicit reduced-motion removal.

## Milestone 2.4 interaction standard

One canonical DOM title, independent artwork, one starting verb, and a viewport-filling stage on phones. Destination controls live inside baskets, the mail window, microwave and lift panel. Only intrinsic garment/object/message/hazard information is presented before input; timing displays communicate targets without an automatic hit-now cue. Results and Retry precede supporting community actions. Prototype truth stays in a compact local-storage disclosure and footer.

The GPU pilot is evaluated rather than assumed to be a visual improvement. At the current scene complexity it matches Canvas frame rate, adds substantial optional code, and does not justify migrating the remaining six games. Device testing is still required before claiming performance on physical mobile hardware.
