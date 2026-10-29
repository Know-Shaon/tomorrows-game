# Milestone 2.4 pre-implementation audit

Recorded after playing every game on the existing Milestone 2.3 build. This is the baseline for the smallest safe Milestone 2.4 changes.

## Product references

- WarioWare: an immediate verb and seconds-long comprehension window.
- Dumb Ways to Die: a distinct situation and characterful scene for every microgame.
- Neal.fun: direct manipulation, little chrome, and the interactive object as the page.
- Subway Surfers, Level Devil, and Drive Mad: readable physical hazards, responsive movement, and quick retries.

## Findings

| Game               | Keep                                            | Remove or repair                                                                          | World/action opportunity                                              |
| ------------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Samosa Shield      | Rooftop, snack, pigeon motion, direct tap/Space | Generic READY/GO, detached hint, sparse feedback                                          | **SHOO**; flap, dive, steam, plate recoil, feather burst              |
| Mosquito Meeting   | Desk setting, moving mosquito, direct tap/Space | Canvas title duplicate, target/decoy wording in accessible status, detached hint          | **SWAT**; wing buzz, lamp pulse, swatter impact                       |
| Perfect Microwave  | Timer skill, rotating tray, large stop action   | No active canonical title, detached full-width control, excess HUD copy                   | **STOP**; glowing oven, steam, door/button press                      |
| Laundry Logic      | Recognizable garments and two baskets           | Visible `LIGHT`/`DARK` answer on garment and spoken `Choose …` answer; duplicate controls | **SORT**; tumbling garment, washer spin, baskets as controls          |
| Pothole Patrol     | Perspective road and lane movement              | `UPCOMING` safe-lane checks/colors and spoken `Upcoming safe lane`; detached arrows       | **DODGE**; hazards teach the route, road scroll, car lean, lane zones |
| Inbox Zero Hero    | Sender/subject judgement and mail-card scene    | Canvas title duplicate, duplicate KEEP/TRASH controls, static card                        | **DECIDE**; card slides in, inbox stack, desk buttons                 |
| Elevator Orchestra | Moving floor and requested sequence             | Timed `HIT … NOW!` prompt, no active canonical title, duplicate hit control               | **HIT**; moving lift, lit floor panel, chime/door response            |

## Shared findings

- The landing page repeats the game title inside poster art and repeats the instruction in a poster caption.
- Active play has either zero or a second canvas-rendered title instead of one stable DOM title.
- The game canvas is visually strong but the HUD and controls read as a surrounding dashboard.
- Landing, voting, suggestion, prototype, and footer explanations compete with the daily game.
- Result order is broadly correct: result and Retry precede community actions. It should be tightened, not restructured.
- The Canvas 2D renderer is deterministic and already has a robust fallback. A PixiJS v8 pilot must materially improve Laundry motion/authoring enough to justify its runtime and bundle cost before wider migration.
