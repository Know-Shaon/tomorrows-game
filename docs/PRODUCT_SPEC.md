# Tomorrow's Game — prototype product spec

## Promise

“Suggest it today. Vote tonight. Play it tomorrow.”

Tomorrow's Game is a mobile-first daily browser arcade. A visitor should understand today's 20–60 second challenge and start it within five seconds, then see a score, local personal best, clearly labelled demo leaderboard, local-only community vote, and device-only suggestion form.

## Prototype scope

This milestone provides a reusable deterministic platform with one explicit engine per game: `defense-v1`, `dodge-v1`, `tap-v1`, `classify-v1`, `timing-v1`, `sequence-v1`, and `sort-v1`. It includes seven distinct Canvas scenes and control schemes, keyboard/pointer/touch input, pause/resume, human-readable result breakdowns, local preferences and best scores, demo community data, and accessibility/responsive support.

It does not provide accounts, a production database, public submissions, administration, deployment, public challenge links, or runtime AI.

## Success criteria

- The opening viewport makes the challenge and Play action immediately clear.
- Identical seeds, configurations, and input events produce identical results.
- The complete interaction works at 360–430px and desktop sizes.
- Prototype and demo information is never presented as live community data.
