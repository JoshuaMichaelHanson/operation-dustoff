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
F                 turn helicopter around

Space             fire cannon
X                 fire locked air-to-air missile
Z                 drop bomb
G                 deploy or reboard SF (when landed)
P or Escape       pause
```

Horizontal input steers without changing the helicopter's facing. Steering opposite
its facing allows backward flight while the cannon and lock-on missile keep pointing
forward. `F` turns the helicopter around independently of its momentum. The cannon
follows the helicopter's pitch: it aims slightly down during forward motion and
slightly up during backward motion.

Gamepad support is post-MVP.

### Mobile Controls (Post-MVP Selection)

Considered control schemes:

1. An eight-way virtual stick with separate Cannon and Missile buttons.
2. A four-button directional pad with separate action buttons.
3. Split-screen drag gestures with minimal visible controls.
4. Device tilt for flight with touch action buttons.
5. Tap-to-fly assisted movement.

Selected approach: option 1. The virtual stick is quantized to the same digital
directions used by the keyboard, preserving the existing acceleration, momentum,
landing, and crushing rules while allowing natural diagonal flight. A fixed D-pad is
more precise but makes diagonals awkward; gesture controls are less discoverable;
tilt is inconsistent and requires calibration; and tap-to-fly would materially change
the arcade handling.

Touch layout:

- left thumb: eight-way virtual stick
- right thumb: hold Cannon for continuous fire
- right thumb: tap Missile to launch when locked and ready
- right thumb: tap Bomb to drop an air-to-ground explosive
- right thumb: tap Turn to reverse the helicopter's facing
- right thumb: tap SF to deploy or reboard the team while landed
- tappable deploy and redeploy prompts
- landscape play with a portrait rotate-device prompt
- contain the complete 16:9 game inside the visual viewport and device safe areas;
  letterboxing is expected on 4:3 tablets
- keyboard controls remain available, with `F` for turning

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
- no solid ridge blocks the ground route between hostage and helicopter

Released hostages receive rally points reachable from their camp without crossing solid
terrain. If the helicopter lands on the opposite side of a ridge, hostages wait instead
of walking through or into it.

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

### Air-to-Air Missile

The lock-on missile is the anti-jet secondary weapon. It launches with `X`, requires a
valid target in front of the helicopter, and has its own reload time.

### Bomb

The bomb is the terrain-safe air-to-ground weapon for armored targets that cannot be
reached cleanly by the forward cannon.

Properties:

- launches with `Z` or the touch Bomb button
- drops under gravity while retaining part of the helicopter's horizontal momentum
- has a 1.2-second reload and a small arcade blast radius
- destroys a full-health tank in one accurate drop
- opens a camp in two accurate drops
- detonates against ground, base, solid ridges, tanks, camps, or exposed hostages
- can kill exposed hostages within its blast, preserving friendly-fire risk
- does not hurt captive hostages released by that same camp-opening explosion

The bomb complements the cannon; it does not reduce tank health or make the Level 2
ridge easier to bypass.

### Rocket

A forward/downward unguided rocket remains a separate possible Post-MVP weapon.

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

### Hard Difficulty Hostage Threat (Post-MVP)

On harder levels or difficulty settings, enemies may deliberately fire at exposed
hostages. Captive hostages remain protected and cannot be targeted while their prison
camp is closed. Once the camp opens, hostages are vulnerable while running out,
waiting, and boarding, so the player should avoid opening a camp until pickup is
practical and must defend the loading area. Hostages already aboard are protected as
passengers; attacks damage the helicopter through the normal combat rules instead of
targeting individual passengers.

This rule should not affect the normal difficulty unless deliberately enabled.

### Harder Terrain and SF Ground Combat (Post-MVP)

Later hard levels may move mountains and hills into the helicopter's flight path as
solid, clearly readable obstacles. Terrain should create route-planning pressure without
requiring realistic flight physics or hiding collision boundaries from the player.

The Little Bird may carry a small number of friendly Special Forces soldiers on
external side seats. These NPC allies protect exposed hostages and loading zones through
mounted covering fire or deployment near the rescue site. Enemy reinforcement trucks
arrive at varied locations and unload hostile soldiers for the SF team to engage.

Ground-unit behavior should use deterministic, hand-built state machines and compact
waypoint or grid graphs. Use conventional DFS/BFS algorithms for reachability, route
selection, patrol, and pursuit where appropriate. Do not introduce machine-learning,
generative-AI, third-party pathfinding, or a general-purpose AI framework.

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

### Level Environment Variety (Post-MVP)

The first level uses a muted daytime battlefield with distant rocky mountains, a
nearer evergreen ridge, sparse clouds, and olive ground. Additional levels should mix
terrain silhouettes, cloud density, and palette rather than repeating that exact scene.

Support authored day, dusk, and night themes when multiple levels are introduced.
Night environments need readable landing-pad, base, projectile, unit, and objective
lighting. These are level themes, not a simulated real-time day/night cycle, and must
never reduce the clarity of collision boundaries or gameplay silhouettes.

### Authored Mission Progression (Post-MVP)

The campaign currently contains six selectable missions:

1. **Green Valley — Standard:** the accepted original battlefield with one tank,
   three camps, sparse clouds, and no solid flight-path terrain.
2. **Highland Pass — Hard:** a longer dusk route with two tanks, denser clouds,
   faster jet reinforcement, and three solid stepped ridges.
3. **Black Ridge — Veteran:** a longer night rescue with three tanks, four camps,
   a 24-hostage target, frequent jets, solid high ridges, stars, and landing lights.
4. **Copper Gorge — Flak Run:** one AA gun past an initial solid ridge threatens the
   approach to three camps. A lower rescue target, one distant tank, and slower jets
   leave room to learn low flight, warning evasion, and bomb counterplay.
5. **Sable Reach — Missile Run:** one SAM launcher beyond a sheltering ridge locks
   onto high aircraft before launching a single turning missile. Low flight breaks
   lock and guidance; a bomb or sustained cannon fire destroys the launcher. Three
   camps, no tanks, and slower jets keep the missile decision central.
6. **Dustline Hold — Ground Defense:** two SF soldiers ride external helicopter seats.
   Land by a camp and press `G` or tap SF to deploy them. Opening the first camp
   summons one reinforcement truck with three hostile infantry; deployed SF engage
   the squad while hostages run and board. The open ground route keeps the new
   ground combat readable before terrain navigation is added. This mission also
   trials a 55-second airborne fuel tank: a safe base landing refills it, and an
   empty tank costs a helicopter. Earlier missions have unlimited fuel.

Starting at Green Valley advances through all six missions after each victory. Score
and surviving helicopters carry forward; failure retries the current mission as a new
run. The title screen also allows direct mission selection so later missions can be
tested without completing the full campaign first.

Solid terrain must use collision silhouettes that match its visible stepped shape.
Projectiles stop on the same geometry. Dustline Hold introduces SF, a truck, and
hostile infantry on open ground. Grid or waypoint navigation remains available for a
later mission with ground obstacles that require routing.

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
