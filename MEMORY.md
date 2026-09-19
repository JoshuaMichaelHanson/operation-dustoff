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
game mount and entry module, but no controllable browser was available for a
visual/console smoke test, so that backlog check remains open.
