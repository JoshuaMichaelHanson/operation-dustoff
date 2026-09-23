# MEMORY.md

## Purpose

This file stores important project decisions and discoveries that future agent sessions should know.

Do not turn this into a transcript.

Record only information that would help the next agent avoid rework.

---

## Stable Decisions

### Project

- Name: Operation Dustoff
- Browser-based 2D arcade rescue game
- Original game inspired by classic helicopter-rescue mechanics
- Weekend-sized project
- No backend

### Stack

- TypeScript
- Vite
- Phaser 3.90.x
- Vitest

### Core Objective

The MVP exists when the player can:

1. fly
2. shoot
3. destroy/open a camp
4. release hostages
5. land
6. board hostages
7. return to base
8. unload hostages
9. lose helicopters
10. win by reaching rescue target

### Scope

The project should resist feature creep.

Anything not needed for the core loop should wait until MVP completion.

---

## Agent Notes

Add new entries below this heading.

Use this format:

```text
## YYYY-MM-DD - Short Decision Name

Decision:
...

Reason:
...

Important implementation detail:
...
```

Do not delete stable decisions unless the project direction actually changes.

## 2026-09-18 - Project Bootstrap

Decision:
Use a minimal Vite entry point with Boot, Title, Game, Victory, and Game Over scene
skeletons. Boot immediately opens the title scene, and Enter starts the game scene.

Reason:
This establishes the intended scene flow without pulling gameplay or Post-MVP work
into the bootstrap milestone.

Important implementation detail:
Phaser is pinned to 3.90.0. Vite 7.3.6 and Vitest 5.0.1 were selected after
an npm audit; the installed dependency tree reports zero vulnerabilities. Tests
and the production build pass. The Vite development server returned the expected
game mount and entry module, and the user verified both initial scenes in a browser.

## 2026-09-18 - Helicopter Vertical Slice

Decision:
Use small `Helicopter` and `Tank` Arcade Physics entities with generated placeholder
textures. Keep projectile creation and collisions in `GameScene` until more weapon
or enemy types make a dedicated system worthwhile.

Reason:
This produces the first complete arcade loop—fly, land, take off, fire, and destroy
a target—without adding infrastructure or later HUD, scoring, or enemy-attack work.

Important implementation detail:
The battlefield is 3200x900 with ground at y=790. The camera follows both axes with
smoothing and a dead zone. Helicopter movement uses acceleration, drag, capped
velocity, and light passive gravity; both WASD and arrow keys are supported. Safe
landing requires ground contact within the configured horizontal and vertical speed
limits, with the pure rule covered by unit tests. Space fires reusable horizontal
cannon rounds on a 180ms cooldown, and the placeholder tank is destroyed after four
hits. Movement and combat tuning belongs in the existing P2 Feel backlog.

## 2026-09-19 - Arcade Collision Callback Ordering

Decision:
Pass the single target sprite before the projectile group when registering Arcade
Physics overlaps, and name callback parameters in the order Phaser supplies them.

Reason:
Phaser passes the single sprite as the first callback argument for sprite-versus-group
checks regardless of the argument order used to register the overlap. Treating the
first argument as the projectile caused cannon hits to call `takeDamage` on a round.

Important implementation detail:
The cannon overlap is registered as tank first, projectile group second, so its
callback receives `(tank, round)`. The round is disabled before tank damage is applied.

## 2026-09-19 - Prison Camp Slice and Ground Aiming

Decision:
Add one six-hit prison camp near the far end of the battlefield. Opening it swaps
the camp to a ruined texture, disables its collision body, and reveals six hostage
placeholders. Hostage movement and boarding remain in the next vertical slice.

Reason:
This completes the camp interaction from cannon fire through a visible hostage
release without pulling the hostage state machine forward or adding a manager early.

Important implementation detail:
Camp health and hostage count live in `PRISON_CAMP` constants. The helicopter now
pitches forward by as much as 0.28 radians based on horizontal speed, and cannon
velocity follows that pitch toward the ground in either facing direction. Cannon
rounds that leave the bottom of the world are returned to the projectile pool.

## 2026-09-19 - Ground-Biased Camera Framing

Decision:
Use a 240-pixel vertical dead zone and a 60-pixel vertical follow offset.

Reason:
The previous camera began panning upward too early, moving the ground, rescue base,
and ground targets out of view during normal attack-height climbs. A taller dead zone
lets the helicopter move higher within the viewport before the camera follows.

Important implementation detail:
Camera tuning values live in the `CAMERA` constants object. The upward-follow trigger
remains at screen y=300, preserving the longer view of the ground during climbs. The
downward-follow trigger is at y=540, so the camera starts returning toward the ground
well before landing. Horizontal tracking and the 0.08 smoothing value are unchanged.

## 2026-09-19 - Hostage State Machine

Decision:
Use one small `Hostage` entity per released captive and keep the collection in
`GameScene`. Each hostage owns its state and ground movement; the helicopter owns its
passenger count and enforces the configurable eight-passenger capacity.

Reason:
Six hostages do not justify a manager yet. Direct updates keep the release-to-boarding
slice easy to follow while preserving the intended ownership boundaries.

Important implementation detail:
Hostages leave the opened camp in a staggered sequence, alternate between rally points
on both sides, and wait there. A hostage approaches only when the helicopter is safely
landed within 190 pixels and has room. If those conditions stop being true, the hostage
returns to `WAITING`; reaching the helicopter transitions it to `ABOARD`, hides its
sprite, and increments the `PAX` display. Pure tests cover legal transitions, airborne
and distance rejection, and capacity enforcement.

## 2026-09-19 - Rescue Base Loop

Decision:
Promote the existing 500-pixel base pad into a `RescueBase` entity and unload
passengers sequentially when the helicopter is safely landed inside it. Each passenger
runs into a visible base doorway before earning 100 points and increasing the rescued
total. Show rescued and score totals in a second HUD line.

Reason:
This completes the first end-to-end rescue trip while keeping landing geometry in the
base entity, passenger state in the helicopter, hostage state in each hostage, and
run-wide totals in a small `GameState`.

Important implementation detail:
Returning passengers transition from `ABOARD` to `RUNNING_TO_BASE` to `RESCUED`.
The passenger manifest removes one person as they exit. Another may follow once every
active runner is at least 56 pixels from the helicopter and the 250 ms minimum interval
has elapsed, producing a visible line without overlapping sprites. `GameState.recordRescue(1)`
is called only at the doorway, so score advances with each visible arrival. Taking off
pauses passengers who remain aboard, while passengers already on the ground continue
inside. Partial trips also work. Victory remains in its dedicated P0 slice. Pure tests
cover base boundaries, airborne rejection, staggered unloading, capacity, legal
disembark transitions, and cumulative rescue scoring.

## 2026-09-19 - Player Damage and Lives

Decision:
Give the helicopter 100 health and three lives. The tank fires a 25-damage aimed
round every 1.7 seconds while the helicopter is within 950 pixels. A destroyed
helicopter respawns at the rescue base after 1.2 seconds while lives remain; losing
the last life opens the game-over scene with the run's rescue and score totals.

Reason:
This completes the enemy-fire-to-game-over vertical slice with one existing enemy
and keeps health, lives, and projectile behavior explicit and easy to tune.

Important implementation detail:
The tank owns range, cooldown, and shot direction, while `GameScene` owns enemy
projectiles and collision effects. A small pure `Health` class handles damage and
respawn reset, and `GameState` retains score and rescued totals when a life is lost.
Any hostages aboard a destroyed helicopter return to their camp rally points so they
can be collected again; a hostage already running into the rescue base completes
that rescue. Scene-local flags and hostage references are reset when a new run starts
from the game-over screen. The tank firing, cooldown, health, and destruction items
in the P1 backlog are also complete because this slice depends on them.

## 2026-09-19 - Victory Condition and Rescue Supply

Decision:
Use the design target of 20 rescued hostages and expose it through the `MISSION`
constants object and `GameState.rescueTarget`. Place three seven-hostage camps across
the hostile half of the level, providing 21 available hostages and requiring at least
three trips with the eight-passenger helicopter.

Reason:
The previous single camp supplied only six hostages, so a 20-hostage victory could not
be reached in normal play. The implementation plan includes three camps and enough
hostages in the same playable victory milestone, making the additional camp content a
dependency of the P0 acceptance criterion.

Important implementation detail:
`GameState.isVictory` becomes true when the rescued count reaches or exceeds its
configured target. `GameScene` checks that state only after a hostage reaches the base
door and the rescue score is recorded, then passes rescued, score, and remaining-life
totals to `VictoryScene`. Enter starts a fresh `GameScene`, whose create method resets
all per-run entity collections and state. Pure tests cover the default target, an
injected alternate target, scoring at victory, and enough camp capacity to reach 20.

## 2026-09-20 - Enemy Tank Score Award

Decision:
Award 100 points when the tank is destroyed, using the value specified in the game
design and stored with the other tank tuning constants. Show a short-lived `+100`
marker at the tank's final position in addition to updating the HUD score.

Reason:
The tank's aiming, cooldown, health, destruction, and projectile damage were already
implemented by the earlier combat slices. Connecting the lethal hit to run score and
visible feedback completes the remaining P1 tank behavior without adding a manager.

Important implementation detail:
`GameState.awardScore` changes score without affecting rescue progress. `GameScene`
calls it only inside the successful tank-destruction branch, so later projectiles
cannot award the points again after the tank becomes inactive. A pure test verifies
that tank points combine with rescue points while leaving the rescued count unchanged.

## 2026-09-20 - Additional Camps and Arcade HUD

Decision:
Keep the three seven-hostage camps introduced with the victory slice and number their
world labels from 1 through 3. Replace the two long gameplay text lines with a small
`Hud` class that gives score, rescue progress, passenger load, hull, and remaining
helicopters dedicated positions in a fixed top overlay.

Reason:
All additional-camp behavior was already playable and documented, while the required
HUD values were present but crowded into debug-style status strings. Dedicated fields
make the five P1 values easier to scan without changing gameplay ownership or adding a
general UI framework.

Important implementation detail:
The HUD formats score as a six-digit arcade value, changes the hull readout from green
to yellow and then red as health falls, and keeps controls plus flight, tank, and camp
status on a smaller second row. `GameScene` supplies one explicit state object each
frame. Every HUD object is fixed to the camera and placed above world objects, while
the existing bottom objective prompt remains owned by `GameScene`.

## 2026-09-21 - Jet Enemy Flyovers

Decision:
Spawn at most one jet at a time on alternating left-to-right and right-to-left
flyovers. Jets use three visible altitude lanes, fire aimed rounds while within range,
take three cannon hits to destroy, and award 200 points.

Reason:
This completes the remaining P1 enemy slice with a readable arcade threat while
avoiding dogfighting AI, pathfinding, or an enemy-manager abstraction that the current
entity count does not justify.

Important implementation detail:
The first flyover begins after five seconds and later flyovers are scheduled every
15 seconds. Each jet owns movement, attack cooldown, health, and world-edge despawn.
Tank and jet rounds share the existing projectile pool and carry their damage value on
the pooled round, allowing jets to deal 20 damage without changing tank damage. Pure
tests cover spawn edges, bidirectional cleanup bounds, aimed projectile speed, and
attack range. A browser smoke test confirmed a visible flyover, an aimed projectile,
jet damage to the helicopter, and no console errors.

## 2026-09-21 - Air-to-Air Lock-On Missile

Decision:
Add one narrowly scoped secondary weapon instead of weakening the jet or improving
the machine gun against it. Pressing X launches a homing missile only while an active
jet is ahead of the helicopter and within 900 pixels. A missile has a capped turn rate,
a 2.2-second cooldown, and enough damage to destroy one jet.

Reason:
The jet's speed and altitude make cannon kills intentionally demanding, which is a
good distinction to preserve. The lock-on missile creates a different positioning and
timing challenge without changing cannon damage, jet health, or jet movement. Bombs,
ground targeting, ammunition, upgrades, and a general weapon framework remain out of
scope.

Important implementation detail:
Missile lock and steering are deterministic pure functions covered by Vitest. Launch
input uses Phaser's edge-triggered `JustDown` handling so short taps are reliable. The
HUD exposes lock and reload states, while muzzle flash, launch shake, and a fading
missile trail provide firing feedback. Missiles are removed on timeout, world exit,
player destruction, or impact, and jet destruction reuses the existing 200-point
award path. A browser smoke test confirmed the title/HUD controls, live lock state,
jet pressure, and no console warnings or errors; automated canvas timing was not
reliable enough to visually capture an impact, so homing and lock behavior remain
covered at the logic-test layer.

## 2026-09-21 - Accepted Flight Feel Tuning

Decision:
Treat acceleration and momentum as one manual-playtest checkpoint. Reduce normal
horizontal acceleration and drag for a smoother pickup and longer coast, but apply
stronger acceleration when the player counter-steers against existing momentum.
Balance climb and descent with separate acceleration values rather than one symmetric
input value layered on top of passive gravity.

Reason:
The helicopter should feel weighty without making precise positioning frustrating.
Slower speed buildup and a short coast create weight, while stronger counter-steering
lets the player brake deliberately. A lower descent input offsets passive gravity and
keeps downward control from being much sharper than climbing.

Important implementation detail:
The candidate values are 340 horizontal acceleration, 680 counter-steering
acceleration, 190 horizontal drag, and 260 maximum horizontal speed. Vertical tuning
uses 470 climb acceleration, 310 descent acceleration, 110 passive gravity, 100 drag,
and a 175 maximum speed. Pure tests protect input direction, counter-steering, and
asymmetric vertical control. The manual playtest accepted these values. Landing
tolerance remains a separate checkpoint.

## 2026-09-21 - Accepted Landing Tolerance

Decision:
Raise the safe touchdown limits from 70 to 90 horizontal speed and from 95 to 125
vertical speed. When the helicopter is touching the ground with no horizontal input,
increase horizontal drag from 190 to 520 so a valid touchdown settles promptly.

Reason:
Landing should remain an intentional controlled maneuver, but the original limits
made near-safe approaches unnecessarily exact. Stronger ground-only drag prevents the
wider horizontal tolerance from turning a successful landing into a long slide while
preserving the accepted airborne momentum.

Important implementation detail:
Ground drag returns to the normal airborne value as soon as the helicopter leaves the
ground or the player supplies horizontal input. Pure tests cover the assisted drag,
the widened valid approach, and rejection immediately above both speed limits. The
manual playtest accepted the forgiving landing behavior.

## 2026-09-21 - Accepted Explosion Feedback

Decision:
Use one small explosion helper for tanks, camps, jets, and helicopter destruction.
Each explosion combines a two-stage flash, a short radial burst of colored square
fragments, and camera shake scaled to the destroyed object's size.

Reason:
Tank and camp destruction previously had no blast feedback, while jet and helicopter
destruction only expanded a single circle. A compact shared effect makes successful
hits readable without introducing a particle system or adding art dependencies.

Important implementation detail:
Ground targets emit 14 fragments with a 160 ms shake, jets emit 12 fragments with a
120 ms shake, and helicopter loss emits 18 fragments with a 240 ms shake. Every flash
and fragment destroys itself when its tween completes. The manual playtest accepted
the shared effect and completed both explosion-feedback backlog items.

## 2026-09-21 - Accepted Helicopter Damage Smoke

Decision:
Start a light gray smoke trail at 50 percent hull and switch to darker, larger, twice
as frequent smoke at 25 percent hull. Healthy and destroyed helicopters emit no smoke.

Reason:
Hull color in the HUD communicates an exact value, while world-space smoke makes the
helicopter's condition readable without looking away from play. Two severity levels
add urgency without introducing fire animation or a persistent particle system.

Important implementation detail:
Each smoke puff is a short-lived circle created behind the helicopter and tweened
backward and upward before destroying itself. The damage profile is pure logic covered
by tests, and respawning resets the smoke timer. A manual playtest accepted the effect,
completing the P2 Feel backlog section.

## 2026-09-22 - Retro Title and Helicopter Sprite

Decision:
Replace the generated helicopter placeholder with an original 96x54 pixel-art sprite
and use the same animated asset as the focal point of a rebuilt retro title screen.
Keep the established olive, sand, yellow, and pale-cyan palette across both contexts.

Reason:
One shared asset gives gameplay and the title screen a consistent visual identity while
completing the first presentation slice without introducing a separate title-only art
pipeline. The user manually accepted both the new title composition and helicopter.

Important implementation detail:
The editable source is `art/source/helicopter.piskel`, with separate body and rotor
layers, four 96x54 frames, and a 12 FPS timeline. Its horizontal spritesheet exports to
`public/assets/sprites/helicopter.png`. `BootScene` loads it under the existing
`helicopter` texture key and registers the repeating `helicopter-rotors` animation, so
the entity keeps its existing collision body, flipping, pitching, weapons, and movement
behavior. The title screen scales the same sprite to 3x over a code-drawn sunset,
mountains, grid, border, and scanline treatment. Tests and the production build pass,
and a browser smoke test found no console warnings or errors.

## 2026-09-22 - Accepted Tank and Jet Sprites

Decision:
Replace the generated tank and jet placeholders with original pixel sprites that use
the helicopter's established battlefield palette. Give the tank four manually selected
cannon elevations at 0, 20, 40, and 60 degrees, while keeping the jet's exhaust as a
small two-frame animation.

Reason:
The tank's projectile direction is much easier to read when the cannon visibly follows
the helicopter. Discrete elevations preserve the deliberate pixel-art look without
requiring smooth sprite rotation, while added jet panel, intake, hardpoint, marking,
and highlight pixels improve its readability without changing its gameplay silhouette.

Important implementation detail:
The editable tank source is `art/source/tank.piskel`, with two layers and four 78x42
frames exported horizontally to `public/assets/sprites/tank.png`. Pure aim logic selects
the nearest elevation and supplies the matching muzzle offset; the projectile still
travels precisely toward the helicopter. The editable jet source is
`art/source/jet.piskel`, with body and exhaust layers, two 94x32 frames at 12 FPS, and
an export at `public/assets/sprites/jet.png`. `BootScene` loads both as spritesheets and
registers the repeating jet exhaust animation. The user accepted both sprites after a
gameplay check. All 59 tests and the production build pass, and the browser smoke test
found no console warnings or errors.

## 2026-09-22 - Deferred Hard-Difficulty Hostage Threat

Decision:
Reserve deliberate enemy attacks against exposed hostages for harder future levels or
difficulty settings. Closed camps protect captive hostages; opening a camp exposes them
while they run out, wait, and board. Boarded passengers remain protected inside the
helicopter and are represented by normal helicopter damage.

Reason:
This creates a tactical choice about when to open each camp and gives the player a
reason to defend the loading area instead of releasing every hostage immediately. It
also keeps the current normal game and this Presentation pull request from gaining an
unplanned difficulty increase.

Important implementation detail:
This is requirements-only Post-MVP work. A future implementation needs deliberate
enemy target selection, exposed-hostage damage and death feedback, and balance coverage
without changing the existing normal-difficulty rescue loop.

## 2026-09-22 - Deferred Harder Terrain and SF Ground Combat

Decision:
Reserve solid mountain and hill obstacles, friendly Special Forces riders, enemy troop
trucks, and ground combat for later hard levels. SF soldiers ride on limited external
Little Bird seats and protect exposed hostages or loading zones when hostile soldiers
arrive from reinforcement trucks.

Reason:
These systems add a larger tactical layer around route selection and rescue defense,
but would substantially expand the current arcade game's entity, combat, and level
scope. Recording them as one dependent future phase keeps the present Presentation
work focused while preserving the intended direction.

Important implementation detail:
Friendly and hostile NPC behavior should remain deterministic and use small custom
state machines plus waypoint or grid navigation. Use traditional BFS/DFS algorithms
for route and reachability decisions rather than machine learning, generative AI,
third-party pathfinding, or a general-purpose AI framework. Terrain collision must be
visually fair, unit counts must remain small, and all truck and soldier states must
clean up reliably.

## 2026-09-22 - Accepted Hostage and Prison Camp Sprites

Decision:
Accept the original hostage animation and prison camp artwork after manual gameplay
testing, completing both presentation checklist items.

Reason:
The hostage states remain readable during release, waiting, boarding, and unloading,
and the closed and opened camp states are visually distinct during normal play.

Important implementation detail:
The user confirmed that gameplay is good with both sprite sets. The editable Piskel
sources and exported Phaser spritesheets remain the source of truth for future visual
changes. No additional gameplay or balance changes were needed for acceptance.

## 2026-09-22 - Raised Rescue Base and Battlefield Art Candidate

Decision:
Replace the generated base shapes and flat battlefield with original pixel art. The
rescue base now has a 32-pixel raised landing surface, while the battlefield uses four
ground-tile variations and two parallax ridge layers over a banded dusk sky.

Reason:
The raised platform makes returning home feel like a distinct landing objective and
gives unloading hostages a visible route into the operations building. Layered terrain
adds depth and visual variety without making the current level geometry more complex.

Important implementation detail:
The editable sources are `art/source/rescue-base.piskel` (512x160),
`art/source/ground-tiles.piskel` (four 64x64 frames), and
`art/source/background-ridge.piskel` (320x96). `RescueBase` owns an invisible static
surface matching the visible platform. The helicopter starts and respawns on that
surface, and disembarking hostages use the same surface Y until reaching the doorway.
All 60 tests and the production build pass. A browser smoke test confirmed a stable
`LANDED` state on the platform, correct art layering, and no console warnings or
errors. Manual flight, rescue, and visual acceptance are still pending.

## 2026-09-23 - Environmental Depth and Reactive Base Door Candidate

Decision:
Keep the nearby ridge as an evergreen silhouette, add a broader rocky mountain layer
behind it, and scatter a small number of translucent cloud variants across each run.
Change the rescue base from one frame to closed-door and open-door frames, selecting
the open frame whenever a hostage is visibly running across the deck into the base.

Reason:
Separating mountains, forest, clouds, and terrain makes the first level read with more
depth while leaving room for later levels to use clearly different environments. A
state-driven door makes unloading feel connected to the base without repeatedly
opening and closing for individual animation beats.

Important implementation detail:
`art/source/distant-mountains.piskel` is a 512x128 one-frame asset and
`art/source/clouds.piskel` contains three 96x32 non-animated variants. The existing
512x160 rescue-base project now has two frames exported as a two-column spritesheet.
`shouldOpenRescueDoor` keeps the door open while any hostage is in `RUNNING_TO_BASE`;
the frame closes only after no hostage remains visible on the deck. Additional level
palettes and authored day, dusk, and night themes remain Post-MVP requirements. All
61 tests and the production build pass, and a browser smoke test found no console
warnings or errors. Manual rescue-loop and visual acceptance are still pending.

## 2026-09-23 - Accepted Base and Battlefield Presentation

Decision:
Accept the raised rescue base, reactive unloading door, ground tiles, layered forest
and mountain scenery, and sparse cloud treatment after manual gameplay review. This
completes the Base sprite and Ground/background art presentation items.

Reason:
The base clearly supports landing and unloading, while the battlefield now has enough
depth and visual identity for the first level without reducing gameplay readability.

Important implementation detail:
The user manually accepted the composed scene. Future level-specific palettes,
terrain silhouettes, cloud density, and day/night themes remain recorded as Post-MVP
work and are not part of this completed first-level presentation slice.
