# TESTING.md

## Testing Goal

Testing should protect important gameplay rules without turning the project into a testing exercise.

Prefer testing pure logic.

Do not attempt to unit-test Phaser itself.

---

## Tooling

Recommended:

```text
Vitest
```

Optional:

```text
Playwright
```

Playwright should only be added if it remains cheap.

---

## High-Value Unit Tests

### Game State

Test:

- score increments correctly
- rescued count increments correctly
- victory triggers at rescue target
- lives decrement correctly
- game-over triggers at zero lives

---

### Passenger Rules

Test:

- passenger capacity cannot be exceeded
- boarding fails while airborne
- boarding succeeds while safely landed
- unloading clears passenger count
- unloading increments rescued count

---

### Hostage States

Test legal transitions.

Example:

```text
Captive -> RunningOut
RunningOut -> Waiting
Waiting -> RunningToHelicopter
RunningToHelicopter -> Aboard
Aboard -> Rescued
```

Test that dead hostages cannot transition to rescued.

---

### Damage

Test:

- damage reduces health
- health cannot remain below zero
- destruction occurs at zero
- respawn resets helicopter health

---

## Smoke Tests

A manual smoke test is acceptable for MVP.

Before considering a major milestone complete:

1. start game
2. fly
3. land
4. fire
5. destroy target
6. release hostage
7. board hostage
8. return to base
9. unload
10. take enemy damage
11. die once
12. restart or respawn

---

## Optional Playwright Test

If Playwright is used, keep it tiny.

Example responsibilities:

- page loads
- canvas exists
- no fatal console errors
- title screen appears
- start control transitions to game

Do not automate the entire game.

---

## Mobile Controls

The Turn button is a one-shot action like Missile and Bomb. Verify it remains
reachable next to those actions on phone and tablet, and that it changes facing
while the stick remains held.

Backward-flight checks: steer opposite the current facing while firing; the
helicopter should fly backward with a slight nose-up pitch and cannon rounds should
leave the muzzle on that angle. Tap `F` or Turn once to face the other way without
changing horizontal momentum, then verify forward fire and missile lock use the
new facing. Repeat on touch with the stick held.

Pure tests should cover the virtual-stick dead zone, cardinal and diagonal direction
selection, held Cannon state, one-shot Missile consumption, and touch capability
detection.

For desktop preview, append `?touch=1` to the game URL to render the touch controls
without emulating a phone. This override is for layout and pointer smoke testing; final
acceptance still requires physical devices in landscape orientation.

Manual mobile checks:

1. Open the title screen in portrait and confirm the rotate-device prompt.
2. Rotate to landscape and tap Deploy.
3. Fly in all cardinal and diagonal directions.
4. Hold the stick and Cannon simultaneously.
5. Release each touch outside its original control and confirm no input sticks.
6. Launch a locked Missile and confirm the reload/lock label changes.
7. Land near hostages, board, return, unload, and verify precision remains practical.
8. Reach victory or game over and restart by touch.
9. On a 4:3 tablet, confirm the entire game is letterboxed inside the screen and the
   complete Cannon button remains visible and tappable.

## Automated Gameplay Smoke Driver

Run:

```text
npm run test:gameplay
```

The command builds the production bundle, starts Vite Preview, and drives the installed
Chrome browser with Playwright. It intentionally uses explicit keyboard-down, timed hold,
and keyboard-up calls so flight and weapon input persist across real Phaser frames.

Current routes:

1. Take off diagonally and hold the cannon while continuing forward flight.
2. Select Highland Pass and Black Ridge, fly toward their first solid ridges, and retain
   a screenshot of each environment and HUD configuration.
3. Fly to Camp 1, brake, descend, destroy the camp, and wait for released hostages.
4. Select Highland Pass, cross its first ridge, drop a bomb over the armored tank, and
   retain a screenshot showing the score and tank objective update.
5. Force the touch layout and retain a screenshot containing the Bomb action button.
6. Resize to an older-iPad 1024x768 landscape viewport and assert that the canvas and
   Cannon button remain fully inside the viewport before retaining a screenshot.
7. Open the first Highland Pass camp with bombs and retain a checkpoint showing all
   seven living hostages assigned to terrain-safe rally positions.

Each route retains a checkpoint PNG and `browser-console.json` under
`test-results/gameplay/`. The console report includes warnings, errors, and uncaught page
errors; any entry fails the smoke test. The artifact directory is intentionally ignored by
Git because it is regenerated on every run.

The driver requires a local Chrome installation. It does not add browser binaries or
automation hooks to the production bundle. Review the screenshots after route changes,
and continue to use manual playtesting for control feel and visual quality.

## Bombs

Pure tests protect downward launch speed, inherited horizontal momentum, inclusive blast
edges, out-of-range targets, and one-shot touch press consumption.

Manual bomb checks:

1. Select Highland Pass and fly above the first armored tank behind the ridge.
2. Drop with `Z`; confirm the bomb falls rather than hanging in place and carries some
   helicopter momentum.
3. Confirm one accurate hit destroys the tank, awards 100 points, and updates `TANKS`.
4. Confirm nearby misses can still damage through the blast while distant misses do not.
5. Confirm a ridge or the rescue-base deck stops and detonates a bomb.
6. Hit a prison camp twice and confirm hostages release only after the second hit and
   survive the camp-opening explosion.
7. Drop near released hostages and confirm exposed hostages can be killed.
8. On touch, confirm Bomb is reachable, taps once per press, and reports reload/ready.

## Multiple Levels

Pure tests protect mission order, increasing difficulty rank, rescue supply, objective
bounds, solid-terrain placement, invalid selection clamping, and final-level progression.

Manual multi-level checks:

1. Select each mission from the title screen with keyboard and touch arrows.
2. Confirm the rescue target, camp count, tank count, palette, clouds, and HUD identity.
3. Fly over and around every solid ridge; verify its visible steps match collision.
4. Fire player and enemy projectiles into ridges and verify they stop.
5. Open camps next to ridges and verify hostages rally without entering terrain.
6. Land on the opposite side of a ridge and verify hostages wait rather than crossing it;
   land on their side and verify boarding still works.
7. Rescue enough hostages to advance and confirm score and helicopters carry forward.
8. Lose a mission and confirm redeploy retries that mission rather than another level.
9. Confirm the final victory screen reports campaign completion.

## AA Gun and Copper Gorge

Pure tests cover AA range, low-altitude and overhead blind spots, ridge blockage,
warning cancellation, three-shot burst timing, cooldown, and projectile speed. The
focused browser route enters mission 4, approaches the AA gun, bombs it, and captures
both the approach and destruction result while checking for browser errors.

Manual keyboard and touch acceptance remains:

1. Select Copper Gorge and confirm the AA position, ridge, camps, and mission intel.
2. Approach high: the warning and burst must be visible early enough to evade.
3. Dive below its tracking altitude or cross directly overhead; the warning should
   cancel or the gun should be unable to acquire a new shot.
4. Destroy it with one well-placed bomb, or sustained cannon fire; confirm score and
   objective text update.
5. Complete a rescue trip with AA active and another after destroying it, on both
   keyboard and touch. Confirm landing and boarding remain practical.

## SAM Launcher and Sable Reach

Pure tests cover clear and ridge-blocked locks, low-altitude guidance loss, the full
warning interval, one launch per cooldown, and cancellation after a dive. The focused
browser route enters mission 5, approaches the launcher, drops a bomb, and retains
approach and impact checkpoints with browser-console checks.

Manual keyboard and touch acceptance:

1. Approach high and confirm the launcher, lock line, reticle, and HUD warning are readable.
2. Dive low or use the first ridge before the warning ends; confirm the lock cancels.
3. Let one missile launch, then dive or turn; confirm it can miss and terrain stops it.
4. Destroy the launcher with a bomb or cannon; confirm 200 points and the objective update.
5. Complete a rescue trip with the launcher active and another after destroying it on
   keyboard and touch. Confirm landing and boarding remain practical.

---

## Test Naming

Use behavior-oriented names.

Good:

```text
should not board hostages while helicopter is airborne
should unload all passengers when landed at rescue base
should trigger victory when rescue target is reached
```

Avoid implementation-specific names.

---

## CI

CI is optional for the weekend build.

If added later, keep it simple:

```text
install
test
build
```
