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

Pure tests should cover the virtual-stick dead zone, cardinal and diagonal direction
selection, held Cannon state, one-shot Missile consumption, and touch capability
detection.

For desktop preview, append `?touch=1` to the game URL to render the touch controls
without emulating a phone. This override is for layout and pointer smoke testing; final
acceptance still requires a physical phone in landscape orientation.

Manual mobile checks:

1. Open the title screen in portrait and confirm the rotate-device prompt.
2. Rotate to landscape and tap Deploy.
3. Fly in all cardinal and diagonal directions.
4. Hold the stick and Cannon simultaneously.
5. Release each touch outside its original control and confirm no input sticks.
6. Launch a locked Missile and confirm the reload/lock label changes.
7. Land near hostages, board, return, unload, and verify precision remains practical.
8. Reach victory or game over and restart by touch.

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
2. Fly to Camp 1, brake, descend, destroy the camp, and wait for released hostages.

Each route retains a checkpoint PNG and `browser-console.json` under
`test-results/gameplay/`. The console report includes warnings, errors, and uncaught page
errors; any entry fails the smoke test. The artifact directory is intentionally ignored by
Git because it is regenerated on every run.

The driver requires a local Chrome installation. It does not add browser binaries or
automation hooks to the production bundle. Review the screenshots after route changes,
and continue to use manual playtesting for control feel and visual quality.

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
