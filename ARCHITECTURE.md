# ARCHITECTURE.md

## Architecture Goal

Keep gameplay code simple enough that an engineer can understand the entire project in one sitting.

Avoid architectural patterns that are larger than the game.

---

## Runtime

```text
Browser
  |
  +-- Phaser
        |
        +-- Scenes
        +-- Entities
        +-- Systems
        +-- Game State
        +-- HUD
```

No server is required.

---

## Scene Structure

Recommended:

```text
BootScene
  ->
TitleScene
  ->
GameScene
  ->
VictoryScene
     or
GameOverScene
```

### BootScene

Responsibilities:

- load assets
- initialize game constants
- transition to title

### TitleScene

Responsibilities:

- show title
- show controls
- start game

### GameScene

Responsibilities:

- world
- entities
- collision
- progression
- gameplay state

### VictoryScene

Responsibilities:

- final score
- restart

### GameOverScene

Responsibilities:

- final score
- restart

---

## Entity Responsibilities

### Helicopter

Owns:

- position
- velocity
- health
- passenger count
- landed state
- player input
- weapon firing eligibility

Does not own:

- global score
- enemy spawning
- hostage collection rules beyond exposing boarding data

### Hostage

Owns:

- current state
- movement toward target
- alive/dead state

### Tank

Owns:

- health
- attack cooldown
- projectile firing decision

### Jet

Owns:

- movement
- attack timing
- despawn

### PrisonCamp

Owns:

- health/open state
- hostage release trigger

### RescueBase

Owns:

- landing/rescue zone geometry

---

## Systems

Use manager/system classes only where they simplify GameScene.

### HostageManager

Responsibilities:

- spawn hostages
- update hostage states
- trigger boarding
- trigger unloading
- maintain collections

### EnemyManager

Responsibilities:

- spawn tanks/jets
- update enemy collections
- clean up destroyed entities

### ProjectileManager

Responsibilities:

- spawn
- update
- recycle/destroy projectiles
- collision integration

These may be merged if the project remains simpler without them.

---

## GameState

Use one small object for global run state.

Example:

```ts
interface RunState {
  score: number;
  rescued: number;
  rescueTarget: number;
  lives: number;
}
```

Passenger count belongs to helicopter unless implementation proves otherwise.

---

## Events

Prefer direct method calls for local behavior.

Use Phaser events only where decoupling clearly helps.

Good example:

```text
HOSTAGE_RESCUED
PLAYER_DESTROYED
CAMP_OPENED
```

Do not create an application-wide event framework.

---

## Collision

Prefer Phaser Arcade Physics.

Likely collisions:

```text
helicopter <-> ground
player bullet <-> tank
player bullet <-> camp
player bullet <-> jet
enemy projectile <-> helicopter
player projectile <-> hostage
```

Use overlap checks for:

```text
helicopter <-> boarding zone
helicopter <-> rescue base
```

---

## State Machines

Use simple string/enum states.

Example:

```ts
enum HostageState {
  Captive,
  RunningOut,
  Waiting,
  RunningToHelicopter,
  Aboard,
  Rescued,
  Dead
}
```

Avoid introducing a state-machine library.

---

## Configuration

Centralize tunable constants.

Example:

```ts
export const GAMEPLAY = {
  rescueTarget: 20,
  startingLives: 3,
  passengerCapacity: 8,
  helicopterMaxHealth: 100,
};
```

This keeps balancing changes cheap.

---

## Asset Strategy

Phase 1:

- generated shapes
- basic placeholder sprites

Phase 2:

- original pixel art
- original or licensed audio

Do not let asset creation block mechanics.

---

## Persistence

None required for MVP.

Optional post-MVP:

```text
local high score
```

If added, browser localStorage is enough.

---

## Performance

Expected entity counts are small.

No special optimization should be required.

Only optimize after measuring an actual problem.
