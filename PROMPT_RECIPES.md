# PROMPT_RECIPES.md

## Start a Fresh Agent Session

```text
Read AGENTS.md and all project files it references.

Inspect the existing source code and BACKLOG.md.

Continue with the highest-priority incomplete P0 task.

Keep the project runnable after your changes.

Run tests and build.

Update BACKLOG.md and MEMORY.md when complete.

Do not implement Post-MVP work.
```

---

## Continue a Specific Feature

```text
Read AGENTS.md, GAME_DESIGN.md, ARCHITECTURE.md, BACKLOG.md, TESTING.md, and MEMORY.md.

Implement only this backlog section:

<PASTE SECTION>

Use the simplest solution that satisfies the acceptance criteria.

Run tests and build.

Update BACKLOG.md and MEMORY.md.
```

---

## Bug-Fix Session

```text
Read AGENTS.md and MEMORY.md.

Investigate this bug:

<BUG DESCRIPTION>

Reproduce the problem before making broad changes.

Fix the smallest underlying cause.

Do not refactor unrelated code.

Add a regression test when practical.

Run tests and build.

Update MEMORY.md if the bug exposed an important design constraint.
```

---

## Sunday Polish Session

```text
The MVP must already be playable.

Read AGENTS.md and BACKLOG.md.

Work only on P2 polish items.

Prioritize game feel in this order:

1. movement tuning
2. explosion feedback
3. HUD readability
4. original visual assets
5. audio
6. optional enemies/features

Do not add architecture for future systems.
```

---

## Agent Review Prompt

```text
Review the current project against:

- AGENTS.md
- GAME_DESIGN.md
- BACKLOG.md

Report:

1. Which MVP requirements are complete
2. Which are incomplete
3. Any scope creep already present
4. Any fragile implementation areas
5. The single best next task

Do not implement anything during this review.
```
