# Operation Dustoff

A small browser-based arcade game inspired by classic helicopter rescue games.

The goal is to produce a **playable, polished MVP in a single weekend** using an AI coding agent such as Codex, Claude Code, or Junie.

## Core Loop

1. Fly from base into hostile territory.
2. Destroy prison camps to release hostages.
3. Land near hostages.
4. Hostages run to and board the helicopter.
5. Return hostages to base.
6. Unload rescued hostages.
7. Rescue enough hostages to win.

## Technology

- TypeScript
- Vite
- Phaser 3.90
- HTML/CSS only where needed for the outer page
- Vitest for unit tests where practical
- Playwright optional for a tiny smoke-test layer

No backend is required.

## Start Here

Agents should read files in this order:

1. `AGENTS.md`
2. `GAME_DESIGN.md`
3. `ARCHITECTURE.md`
4. `BACKLOG.md`
5. `IMPLEMENTATION_PLAN.md`
6. `TESTING.md`
7. `SECURITY.md`
8. `MEMORY.md`

Human developers should start with `AGENTS.md` and `BACKLOG.md`.

## Scope Rule

The MVP is complete when a player can:

- launch the game
- fly the helicopter
- shoot enemies and prison camps
- release hostages
- land
- board hostages
- return them to base
- unload them
- lose lives
- win after rescuing the target number

Everything else is secondary.
