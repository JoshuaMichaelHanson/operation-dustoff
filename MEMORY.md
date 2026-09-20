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
