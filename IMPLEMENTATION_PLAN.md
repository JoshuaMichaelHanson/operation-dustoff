# IMPLEMENTATION_PLAN.md

## Philosophy

Always get to a playable build before polishing.

The recommended implementation sequence is deliberately vertical.

---

# Milestone 1 - "I Can Fly"

Build:

- Vite
- Phaser
- GameScene
- placeholder helicopter
- keyboard controls
- scrolling world
- ground
- landing detection

End state:

> The player can fly around a scrolling level and land.

Do not add enemies yet unless needed for input testing.

---

# Milestone 2 - "I Can Shoot Something"

Build:

- cannon
- projectiles
- one tank
- hit detection
- tank health
- tank destruction

End state:

> The player can fly around and destroy a tank.

This is the first arcade-feel checkpoint.

---

# Milestone 3 - "Open the Camp"

Build:

- prison camp
- camp health
- destruction/opening
- hostage spawn points

End state:

> Shooting a camp causes people to run out.

---

# Milestone 4 - "Rescue Someone"

Build hostage states:

```text
RUNNING_OUT
WAITING
RUNNING_TO_HELICOPTER
ABOARD
```

Build:

- landed-state check
- boarding radius
- capacity
- passenger counter

End state:

> The player can land and pick people up.

---

# Milestone 5 - "Bring Them Home"

Build:

- rescue base
- base landing zone
- unloading
- rescue score
- rescued counter

End state:

> The game's complete core loop exists.

This is the most important milestone.

---

# Milestone 6 - "The Game Can Fight Back"

Build:

- tank fire
- enemy projectiles
- helicopter health
- helicopter destruction
- lives
- respawn
- game over

End state:

> The player can lose.

---

# Milestone 7 - "The Game Can Be Won"

Build:

- 3 camps
- enough hostages for multiple trips
- rescue target
- victory scene

End state:

> The player can start, play, win, restart.

At this point the MVP is complete.

---

# Milestone 8 - Arcade Polish

In this order:

1. movement tuning
2. explosion feedback
3. HUD cleanup
4. original sprites
5. audio
6. jets
7. friendly fire
8. optional secondary weapon

Stop whenever the weekend ends.

---

# Recommended Weekend Schedule

## Friday Evening

Target:

```text
Milestones 1-2
```

Goal:

> Flying and shooting already feels good.

---

## Saturday Morning

Target:

```text
Milestones 3-4
```

Goal:

> Camps and hostages work.

---

## Saturday Afternoon / Evening

Target:

```text
Milestones 5-7
```

Goal:

> Fully playable game.

---

## Sunday

Target:

```text
Milestone 8
```

Goal:

> Turn the functioning game into a tiny arcade cabinet.

---

# Agent Prompt Pattern

Good task:

```text
Implement the next incomplete P0 item from BACKLOG.md.

Follow AGENTS.md.

Keep the game runnable.

Run tests and build when complete.

Update BACKLOG.md and MEMORY.md with important implementation notes.
```

Good focused task:

```text
Implement the Hostage State Machine section from BACKLOG.md.

Do not work on polish or post-MVP items.

Use the simplest design compatible with ARCHITECTURE.md.

When finished:
1. run tests
2. run build
3. update BACKLOG.md
4. update MEMORY.md
```

---

# Scope Escalation Rule

If a feature requires more than roughly one focused coding session and is not necessary for the core rescue loop:

Move it to Post-MVP.

The player experience matters more than feature count.

---

# Post-MVP Mobile Control Slice

Implement mobile play as a thin input and presentation layer over the existing game:

1. Represent keyboard and touch through one small player-input state.
2. Quantize a left-side virtual stick into eight digital directions.
3. Add right-side hold Cannon and press Missile controls with multitouch support.
4. Make scene start and restart prompts tappable.
5. Preserve the current helicopter physics and weapon cooldown rules.
6. Fit one complete 16:9 game frame inside the dynamic viewport and safe-area content
   rectangle, using letterboxing on 4:3 tablets, and request landscape orientation
   through a portrait overlay rather than browser permission APIs.
7. Validate pure input rules automatically, then perform final feel testing on a
   physical phone.

Rejected for this slice: a fixed four-button D-pad, invisible split-screen gestures,
device tilt, and tap-to-fly assistance. These either reduce diagonal control,
discoverability, consistency, or fidelity to the existing arcade handling.

# P2 Automated Gameplay Smoke Slice

Keep browser automation outside the shipped game and deliberately smaller than a full
end-to-end suite:

1. Build the production bundle and serve it through Vite Preview.
2. Launch the installed Chrome channel through Playwright at the native 1280x720 game size.
3. Drive Phaser with real keyboard down/up events held across multiple animation frames.
4. Run one short flight-and-cannon route and one focused first-camp attack route.
5. Retain screenshots and a JSON report of browser warnings, errors, and uncaught page errors.
6. Fail on any captured browser issue, but use the screenshots for gameplay checkpoint review.
7. Keep human playtesting responsible for feel, timing, visual quality, and complete-run acceptance.

Do not expose scene internals, global test state, shortcuts, or test-only gameplay behavior
in the production bundle. The driver should exercise the same controls and rules as a player.

# Post-MVP Multiple-Level Slice

Build authored progression as one extension of the existing rescue loop:

1. Move mission-specific positions, targets, jet timing, palettes, and obstacles into
   three compact level definitions.
2. Keep one `GameScene`; select a level by index rather than duplicating scene logic.
3. Add title-screen mission selection for focused keyboard and touch testing.
4. Carry score and surviving helicopters into the next mission after victory.
5. Increase difficulty through longer routes, more tanks, more frequent jets, a larger
   final rescue target, and solid terrain in the flight path.
6. Use stepped visible rectangles for ridges so Arcade Physics collision exactly matches
   their silhouette, including projectile blocking.
7. Generate hostage rally points on a ground-reachable side of each ridge, collide
   hostages with ridge bodies, and reject boarding approaches across blocked paths.
8. Author day, dusk, and night palettes with readable HUD, objectives, landing lights,
   units, projectiles, and obstacle edges.
9. Stop for gameplay acceptance before adding SF passengers, trucks, infantry combat,
   or BFS/DFS ground navigation as later vertical slices.

# Post-MVP Bomb Slice

Add the smallest air-to-ground vertical slice needed by Highland Pass:

1. Bind `Z` and a third touch action to an independently cooled bomb drop.
2. Launch below the helicopter with partial horizontal momentum and Arcade gravity.
3. Stop the bomb on the ground, rescue-base surface, or authored solid terrain.
4. Resolve one compact blast against tanks, camps, and exposed hostages.
5. Make one accurate bomb destroy a tank and two accurate bombs open a camp without
   changing cannon damage, tank health, helicopter pitch, or ridge geometry.
6. Add pure launch/blast/input tests and a Playwright Highland Pass drop route.
7. Stop for manual timing, aiming, effect, and touch-layout acceptance before marking
   the Post-MVP Bomb checklist complete.
