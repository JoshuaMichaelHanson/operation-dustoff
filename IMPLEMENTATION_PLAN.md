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
