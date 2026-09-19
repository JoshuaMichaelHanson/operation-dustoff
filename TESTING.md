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
