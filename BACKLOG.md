# BACKLOG.md

## Status Legend

```text
[ ] not started
[~] in progress
[x] complete
[!] blocked
```

Agents should work from top to bottom unless explicitly directed otherwise.

---

# MVP

## P0 - Project Bootstrap

- [x] Create Vite + TypeScript project
- [x] Install Phaser 3.90.x
- [x] Configure dev/build/test scripts
- [x] Create scene skeleton
- [x] Confirm game renders in browser
- [x] Add basic Vitest setup

### Acceptance

```text
npm run dev
npm run build
npm test
```

must succeed.

---

## P0 - Helicopter Vertical Slice

- [x] Render placeholder helicopter
- [x] Add keyboard controls
- [x] Add acceleration and velocity limits
- [x] Add camera follow
- [x] Keep ground targets visible during climbs and restore framing on descent
- [x] Add ground collision
- [x] Detect landed vs airborne state
- [x] Add cannon projectile
- [x] Add one targetable tank
- [x] Fix cannon-to-tank collision callback ordering

### Acceptance

Player can:

- fly
- land
- take off
- fire
- destroy one target

---

## P0 - Prison Camp Slice

- [x] Add prison camp entity
- [x] Give camp health
- [x] Allow player weapons to damage camp
- [x] Change camp to open/destroyed state
- [x] Spawn hostages when camp opens

### Acceptance

Destroying a camp visibly releases hostages.

---

## P0 - Hostage State Machine

- [x] Implement hostage states
- [x] Hostages run out of camp
- [x] Hostages wait at rally point
- [x] Detect landed helicopter nearby
- [x] Hostages run toward helicopter
- [x] Board helicopter
- [x] Enforce passenger capacity

### Acceptance

Player can land near released hostages and load passengers.

---

## P0 - Rescue Base

- [x] Add base zone
- [x] Detect safe landing at base
- [x] Unload helicopter passengers
- [x] Animate passengers running into base with staggered spacing
- [x] Increase rescued count
- [x] Increase score
- [x] Display rescue progress

### Acceptance

A complete rescue trip works end-to-end.

---

## P0 - Player Damage and Lives

- [x] Add player health
- [x] Add enemy projectile collision
- [x] Add helicopter destruction
- [x] Decrement lives
- [x] Respawn when lives remain
- [x] Add game-over state

### Acceptance

Player can lose a helicopter and eventually lose the game.

---

## P0 - Victory Condition

- [x] Add configurable rescue target
- [x] Trigger victory when target reached
- [x] Add victory scene
- [x] Add restart

### Acceptance

Player can win the game normally.

---

# MVP Gameplay Completion

## P1 - Enemy Tank

- [x] Tank fires toward player
- [x] Fire cooldown
- [x] Tank health
- [x] Tank destruction
- [x] Score award

---

## P1 - Additional Camps

- [x] Add 3 total camps
- [x] Spread camps across scrolling level
- [x] Populate camps with hostages

---

## P1 - HUD

- [x] Score
- [x] Rescued / target
- [x] Passengers / capacity
- [x] Health
- [x] Lives

---

## P1 - Jet Enemy

- [x] Spawn jets occasionally
- [x] Fly across level
- [x] Attack player
- [x] Allow destruction
- [x] Despawn cleanly

Jet may be deferred if MVP schedule is tight.

---

# Polish

## P2 - Feel

- [x] Tune helicopter acceleration
- [x] Tune momentum
- [x] Improve landing tolerance
- [x] Add recoil or firing feedback
- [x] Add camera shake for explosions
- [x] Add explosion particles
- [x] Add helicopter smoke when damaged

---

## P2 - Presentation

- [x] Retro title screen
- [x] Original pixel helicopter sprite
- [x] Tank sprite
- [x] Jet sprite
- [x] Hostage sprite
- [x] Camp sprite
- [x] Base sprite
- [x] Ground/background art

---

## P2 - Audio

- [ ] Rotor loop
- [ ] Cannon
- [ ] Explosion
- [ ] Boarding sound
- [ ] Rescue sound
- [ ] Victory sound
- [ ] Game-over sound

---

## P2 - Friendly Fire

- [ ] Player shots can kill hostages
- [ ] Hostage death feedback
- [ ] Dead hostages cannot be rescued

---

## P2 - Automated Gameplay Smoke Testing

- [ ] Add a lightweight Playwright gameplay driver outside the production bundle
- [ ] Support true held-key flight and weapon input with explicit key-down/key-up timing
- [ ] Script focused routes for flying, firing, destroying a camp, and observing released hostages
- [ ] Capture gameplay screenshots and browser console warnings/errors
- [ ] Keep manual playtesting as the final feel and visual-quality checkpoint

### Acceptance

An agent can start the game, hold flight controls across Phaser frames, fire weapons,
reach a selected gameplay checkpoint, and return screenshots plus console results
without adding test-only behavior to the shipped game.

---

# Post-MVP

Do not implement until MVP is complete.

- [x] Secondary weapon — air-to-air lock-on missile (pulled forward for jet balance)
- [ ] Bombs
- [ ] Rockets
- [ ] AA guns
- [ ] SAM launchers
- [ ] Night mission
- [ ] Multiple levels
- [ ] Difficulty settings
- [ ] Gamepad support
- [ ] Mobile controls
- [ ] Local high-score table
- [ ] Full-load rescue bonus
- [ ] Boss helicopter
- [ ] Fuel
- [ ] Weather effects
- [ ] POW panic / dive-for-cover behavior

## Post-MVP - Hard Difficulty Hostage Threat

- [ ] Allow enemies to deliberately target exposed hostages on harder levels or difficulty settings
- [ ] Keep captive hostages protected and untargetable while their prison camp remains closed
- [ ] Make hostages vulnerable while running out, waiting, and boarding the helicopter
- [ ] Keep boarded hostages protected by the helicopter rather than targeting passengers individually
- [ ] Add readable warning, defense, injury, and death feedback for attacks on hostages
- [ ] Balance the rule so opening a camp is a tactical choice best made when rescue is possible

## Post-MVP - Harder Terrain and SF Ground Combat

- [ ] Make mountains and hills solid flight obstacles on harder levels
- [ ] Give terrain collision shapes clear visual silhouettes and fair approach space
- [ ] Add friendly Special Forces soldiers with limited external Little Bird seating
- [ ] Let SF soldiers deploy or provide covering fire around exposed hostages and loading zones
- [ ] Add enemy reinforcement trucks that arrive at varied locations and unload hostile soldiers
- [ ] Give friendly and hostile ground units explicit combat, cover, escort, and cleanup states
- [ ] Use small deterministic waypoint or grid graphs with custom BFS/DFS navigation
- [ ] Keep unit and vehicle limits low enough to preserve readable arcade gameplay
- [ ] Add clear friendly/enemy silhouettes and prevent friendly units from targeting hostages

### Acceptance

On a harder level, the player must fly around solid terrain, can transport a small SF
team on the helicopter's external seats, and can use that team to protect exposed
hostages when an enemy truck arrives and unloads hostile soldiers. Ground units find
valid routes with deterministic BFS/DFS-based logic, resolve combat visibly, and clean
up without leaks or abandoned state.

## Post-MVP - Level Environment Variety

- [ ] Give each additional level a distinct terrain silhouette and color palette
- [ ] Vary distant mountains, nearby forests or hills, and cloud density by level
- [ ] Add authored day, dusk, and night environment themes
- [ ] Add readable base, landing-pad, projectile, and unit lighting for night levels
- [ ] Keep gameplay silhouettes and collision boundaries readable in every theme
- [ ] Configure environment choices as level data rather than duplicating scene logic

### Acceptance

Additional levels must be immediately distinguishable through terrain, sky, and
lighting while preserving the same clear helicopter, enemy, hostage, and landing-zone
silhouettes. Day and night are deliberate level themes rather than a real-time clock.

---

# Explicit Non-Goals

Do not add these without a deliberate future project decision.

- multiplayer
- user accounts
- backend
- database
- cloud services
- monetization
- ads
- procedural generation
- achievement service
- online leaderboard
- social login
