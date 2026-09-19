# AGENTS.md

## Project

**Operation Dustoff**

A browser-based 2D arcade rescue game inspired by classic helicopter rescue games.

This project is intentionally small and should remain small.

The primary objective is to produce a **complete, playable game quickly**, not to build a reusable game engine.

---

## Agent Mission

Implement the highest-priority incomplete item from `BACKLOG.md` while keeping the game runnable after every meaningful change.

Prefer vertical slices over isolated infrastructure.

A vertical slice means:

> Input -> gameplay behavior -> visible result -> scoring/state update -> test where practical.

Example:

> Player lands near released hostages -> hostages run to helicopter -> board -> passenger count changes.

---

## Required Reading

Before implementing work, read:

1. `GAME_DESIGN.md`
2. `ARCHITECTURE.md`
3. `BACKLOG.md`
4. `IMPLEMENTATION_PLAN.md`
5. `TESTING.md`
6. `SECURITY.md`
7. `MEMORY.md`

Do not invent requirements that conflict with these files.

---

## Technical Constraints

Use:

- TypeScript
- Vite
- Phaser 3.90.x
- npm or pnpm
- Vitest for logic tests

Avoid adding frameworks unless absolutely necessary.

Do NOT add:

- React
- Next.js
- Angular
- Vue
- backend services
- databases
- authentication
- cloud infrastructure
- Docker
- Kubernetes
- multiplayer
- WebSockets
- ECS frameworks
- physics engines beyond Phaser's built-in capabilities
- dependency injection frameworks

This is a small arcade game.

---

## Coding Guidelines

Prefer:

- small classes
- small modules
- explicit state
- readable names
- shallow inheritance
- composition
- simple state machines
- deterministic gameplay rules where practical

Avoid:

- clever abstractions
- generic frameworks
- premature optimization
- giant managers containing unrelated behavior
- deep inheritance trees
- "future-proofing" for features not in the backlog

---

## Suggested Source Layout

```text
src/
  main.ts
  game/
    config.ts
    constants.ts

    scenes/
      BootScene.ts
      TitleScene.ts
      GameScene.ts
      GameOverScene.ts
      VictoryScene.ts

    entities/
      Helicopter.ts
      Hostage.ts
      Tank.ts
      Jet.ts
      PrisonCamp.ts
      RescueBase.ts

    systems/
      EnemyManager.ts
      HostageManager.ts
      ProjectileManager.ts
      SpawnManager.ts

    state/
      GameState.ts

    ui/
      Hud.ts

    audio/
      AudioManager.ts

    utils/
      math.ts
      timers.ts

tests/
```

The agent may adjust this layout if the implementation reveals a simpler structure.

---

## Core Game Rules

See `GAME_DESIGN.md` for full details.

Important rules:

- helicopter movement should feel slightly weighty
- hostages only board when the helicopter is safely landed nearby
- helicopter has limited passenger capacity
- hostages can die
- enemy fire can damage the helicopter
- the player has a limited number of helicopters/lives
- victory requires rescuing a defined number of hostages

---

## Definition of Done for a Backlog Item

A backlog item is complete when:

1. the feature works in the running game
2. existing gameplay still works
3. relevant tests pass
4. no new console errors appear
5. the code remains understandable
6. `BACKLOG.md` is updated
7. meaningful implementation notes are added to `MEMORY.md`

---

## Agent Workflow

For each task:

1. Read the current backlog.
2. Select the highest-priority incomplete item unless directed otherwise.
3. Inspect relevant existing code.
4. Make the smallest coherent change.
5. Run tests.
6. Run build.
7. If practical, run the game or smoke test.
8. Update backlog status.
9. Update `MEMORY.md` with important decisions or pitfalls.
10. Summarize exactly what changed.

---

## Build Commands

Prefer scripts like:

```bash
npm install
npm run dev
npm run build
npm test
```

Optional:

```bash
npm run test:e2e
npm run lint
```

Do not add a complicated task runner.

---

## Scope Protection

If a proposed feature is not required for MVP, first check the `Post-MVP` section of `BACKLOG.md`.

If it is not there, add it as a suggestion rather than implementing it.

The agent should aggressively protect the weekend scope.

---

## Visual Assets

Use simple placeholder art first.

Acceptable MVP placeholders:

- rectangles
- circles
- simple generated pixel shapes
- minimal sprite sheets created specifically for this project

Do not block gameplay work waiting for polished assets.

Do not copy copyrighted sprites, audio, maps, or other assets from commercial games.

---

## Commit Philosophy

If Git is being used, keep commits small and coherent.

Examples:

```text
feat: add helicopter movement
feat: add hostage boarding state machine
feat: add tank projectile attacks
fix: prevent boarding while helicopter is airborne
test: cover rescue scoring rules
```

---

## Final MVP Test

The MVP must support this exact sequence:

1. Start new game.
2. Fly away from base.
3. Destroy a prison camp.
4. Hostages emerge.
5. Land nearby.
6. Hostages board.
7. Fly back to base.
8. Land at base.
9. Hostages unload.
10. Rescue counter increases.
11. Repeat until victory.
12. Player can also be destroyed and lose a life.

If this works, the core game exists.
