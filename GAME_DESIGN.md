# GAME_DESIGN.md

## Working Title

**Operation Dustoff**

## Genre

2D side-scrolling helicopter rescue arcade game.

## Design Goal

Create a game that becomes fun very early in development.

The player should understand the objective within seconds:

> Rescue people, survive the trip, bring them home.

---

## Primary Gameplay Loop

```text
TAKE OFF
  ->
FLY INTO HOSTILE AREA
  ->
DESTROY OR OPEN PRISON CAMP
  ->
HOSTAGES ESCAPE
  ->
LAND
  ->
HOSTAGES BOARD
  ->
RETURN TO BASE
  ->
LAND
  ->
HOSTAGES UNLOAD
  ->
SCORE / RESCUE COUNT INCREASES
  ->
REPEAT
```

---

## Win Condition

The player wins after rescuing:

**20 hostages**

This number should be configurable.

---

## Lose Condition

The player starts with:

**3 helicopters**

A helicopter is lost when its health reaches zero or it crashes badly enough to trigger destruction.

The game ends when no helicopters remain.

---

## Helicopter

### Movement

The helicopter should feel responsive but not instantaneous.

Desired feel:

- light acceleration
- slight momentum
- capped velocity
- slower movement while near ground if needed
- controlled descent
- forgiving landing behavior

Do not attempt realistic helicopter physics.

### Controls

Suggested:

```text
W / Up Arrow      climb
S / Down Arrow    descend
A / Left Arrow    move left
D / Right Arrow   move right

Space             fire cannon
X                 bomb / secondary weapon
P or Escape       pause
```

Gamepad support is post-MVP.

### Health

Suggested starting health:

```text
100
```

Tank or jet projectiles reduce health.

### Passenger Capacity

Suggested:

```text
8 hostages
```

Configurable constant.

---

## Prison Camps

Each camp contains a fixed number of hostages.

Suggested:

```text
6-8 hostages
```

Camp behavior:

1. starts closed
2. player destroys or opens camp
3. camp changes to destroyed/open state
4. hostages spawn and run outward
5. hostages wait at rally area

For MVP, prison camps do not need sophisticated destruction animation.

---

## Hostages

Hostages use a simple state machine.

```text
CAPTIVE
  ->
RUNNING_OUT
  ->
WAITING
  ->
RUNNING_TO_HELICOPTER
  ->
ABOARD
  ->
RESCUED
```

Optional terminal state:

```text
DEAD
```

### Boarding Conditions

A hostage may board only when:

- helicopter is landed
- helicopter is within boarding radius
- helicopter has passenger capacity
- hostage is alive

### Rescue

When the helicopter lands at the rescue base:

- passengers unload
- rescued count increases
- score increases
- helicopter passenger count returns to zero

---

## Enemies

### Tank

MVP enemy.

Behavior:

- stationary or slowly moving
- aims approximately toward helicopter
- fires on a cooldown
- limited projectile speed
- can be destroyed

No advanced pathfinding.

### Jet

MVP or late-MVP enemy.

Behavior:

- flies across screen
- attacks or strafes
- despawns after leaving world bounds
- spawns on interval

Avoid complicated dogfighting AI.

---

## Weapons

### Cannon

Primary weapon.

Properties:

- rapid fire
- low-to-medium damage
- horizontal projectile
- destroys tanks/camps after several hits

### Bomb / Rocket

Secondary weapon.

Properties:

- slower rate
- higher damage
- downward or forward/downward trajectory

If secondary weapon delays MVP, postpone it.

---

## World

### Style

Long horizontal battlefield.

Suggested regions:

```text
[ Rescue Base ]
      |
      |---- open terrain ---- prison camp ---- tanks ---- prison camp ---- tanks ---- prison camp
```

One level is sufficient for MVP.

### Camera

Camera follows helicopter horizontally and vertically with modest smoothing.

Do not build a minimap for MVP.

---

## HUD

Display:

- score
- rescued count
- passengers
- helicopter health
- remaining helicopters

Example:

```text
SCORE 001250    RESCUED 12/20    PASSENGERS 6/8    HULL 72    CHOPPERS 2
```

---

## Scoring

Suggested values:

```text
Tank destroyed           100
Jet destroyed            200
Camp opened              250
Hostage rescued          500
Full passenger load      500 bonus
```

Scoring is secondary to rescue progress.

---

## Difficulty

Difficulty should come from:

- exposing yourself while landing
- enemy projectiles
- enemy density
- longer travel distance
- needing multiple rescue trips

Avoid adding complex enemy AI merely to increase difficulty.

---

## Friendly Fire

Preferred feature:

Hostages can be killed by careless player fire.

If implementing this creates excessive complexity, move it to polish.

---

## Audio

MVP audio targets:

- rotor loop
- cannon
- explosion
- hostage boarding cue
- rescue/unload cue
- player destruction
- victory
- game over

Temporary generated or royalty-free audio is acceptable.

---

## Visual Direction

Original retro-inspired art.

Target feel:

- low-resolution pixel style
- limited palette
- readable silhouettes
- clean gameplay visibility

Do not copy commercial game assets.

---

## Non-Goals

Do not build for MVP:

- narrative campaign
- dialogue
- inventory
- character progression
- crafting
- multiplayer
- online leaderboard
- cloud saves
- accounts
- procedural generation
- multiple helicopters
- weapon upgrade trees
