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
