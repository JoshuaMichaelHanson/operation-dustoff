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

- [x] Rotor loop
- [x] Cannon
- [x] Explosion
- [x] Boarding sound
- [x] Rescue sound
- [x] Victory sound
- [x] Game-over sound
- [x] Background music

---

## P2 - Friendly Fire

- [x] Player shots can kill hostages
- [x] Hostage death feedback
- [x] Dead hostages cannot be rescued
- [x] Descending helicopter can crush exposed hostages
- [x] Crushed hostages have distinct feedback and a smush sound

---

## P2 - Automated Gameplay Smoke Testing

- [x] Add a lightweight Playwright gameplay driver outside the production bundle
- [x] Support true held-key flight and weapon input with explicit key-down/key-up timing
- [x] Script focused routes for flying, firing, destroying a camp, and observing released hostages
- [x] Capture gameplay screenshots and browser console warnings/errors
- [x] Keep manual playtesting as the final feel and visual-quality checkpoint

### Acceptance

An agent can start the game, hold flight controls across Phaser frames, fire weapons,
reach a selected gameplay checkpoint, and return screenshots plus console results
without adding test-only behavior to the shipped game.

---

# Post-MVP

Do not implement until MVP is complete.

## Next Development Phases (priority order)

Work through these phases in order, delivering and playtesting one vertical slice at a
time. Reassess the remaining backlog after Phase 3. The sections below retain detailed
requirements; this roadmap determines what to work on next.

### Phase 1 - Make Rescues More Tense and Rewarding

- [x] On Highland Pass and Black Ridge, let enemies threaten released hostages with
      clear targeting warnings and a fair chance to intervene; keep Green Valley's
      current behavior
- [x] Let threatened POWs dive for cover or pause their run, then resume boarding
      when the danger passes
- [x] Award the existing full-load rescue bonus and show it at unloading, making
      another pickup a visible risk/reward choice
- [x] Add compact battlefield intel: direction and distance cues for the nearest
      active camp, stranded hostages, and the rescue base, plus incoming-threat warnings
- [x] Explain crash-surviving passengers with a brief regrouping delay and on-screen cue
- [~] Playtest complete rescue trips on keyboard and touch; tune threat frequency,
      warning time, cover behavior, and bonus value

Keyboard browser route scored a rescue; touch browser route opened a camp and boarded
a POW but lost the helicopter on return. Complete touch-trip and full-load manual
acceptance remain before closing Phase 1.

Acceptance: Opening a camp on a harder mission creates a readable rescue urgency.
The player can protect or promptly collect exposed hostages, choose whether to fill
the helicopter or return early, and find the next objective without searching blindly.

### Phase 2 - Add Air Defenses in a Feature-Driven Mission

- [ ] Add a destructible AA gun with a visible aiming or burst warning and a clear
      safe approach or bomb counterplay
- [ ] Author the next mission around AA placement and rescue routes rather than
      increasing enemy counts alone
- [ ] After AA is accepted, add a SAM launcher with an avoidable projectile and a
      readable lock warning as a separate vertical slice
- [ ] Validate each defense with focused logic tests, one gameplay route, and manual
      keyboard and touch playtesting

Acceptance: The new defenses make the player plan altitude, approach, and attack
timing while preserving fair landing and rescue opportunities. Add the SAM to that
mission or a later one only if playtesting supports the added pressure.

### Phase 3 - Build the Ground Combat Slice

- [ ] Add limited external SF seats, boarding, transport, and deployment
- [ ] Add one reinforcement truck that unloads a small hostile infantry squad
- [ ] Add deterministic ground-unit movement, cover, combat, and cleanup, with
      waypoint or grid BFS/DFS only where terrain requires routing
- [ ] Give the SF team a useful role defending exposed hostages and loading zones
- [ ] Introduce and manually accept the new systems in a feature-driven mission

Acceptance: The player can fly an SF team to a threatened camp, deploy it, protect
hostages from one truck-borne attack, rescue the survivors, and finish the mission.

### After Phase 3 - Reassess

Use playtest feedback to choose among rockets, difficulty settings, gamepad support,
local high scores, pause controls, an audio configurator, fuel, weather, and a boss
helicopter. Keep new weapons or systems only when they create a distinct decision
in the rescue loop.

## Feature Inventory

- [x] Secondary weapon — air-to-air lock-on missile (pulled forward for jet balance)
- [x] Bombs
- [ ] Rockets
- [ ] AA guns
- [ ] SAM launchers
- [x] Night mission
- [x] Multiple levels
- [ ] Additional feature-driven levels
- [ ] Difficulty settings
- [ ] Gamepad support
- [x] Mobile controls
- [ ] Local high-score table
- [ ] Full-load rescue bonus
- [ ] Boss helicopter
- [ ] Fuel
- [ ] Weather effects
- [x] POW panic / dive-for-cover behavior
- [ ] Pause and resume from keyboard and touch controls

## Post-MVP - Mobile Controls

- [x] Add an eight-way virtual flight stick for touch devices
- [x] Add hold-to-fire Cannon and tap-to-launch Missile buttons
- [x] Keep keyboard and touch input behavior equivalent
- [x] Make title, victory, and game-over actions tappable
- [x] Add landscape guidance and mobile-safe viewport behavior
- [x] Cover stick direction, release, and action-button semantics with tests

### Acceptance

On a phone in landscape orientation, the player can start a game, fly diagonally,
land precisely, hold the cannon, launch a locked missile, complete or lose a mission,
and restart without a physical keyboard. Desktop keyboard play remains unchanged.

## Post-MVP - Audio Configurator

- [ ] Define a small catalog of alternate sounds for each configurable game event
- [ ] Let the player preview and select unlocked sound variants from an audio menu
- [ ] Allow music, rotor, player weapons, explosions, rescue events, and UI cues to be configured independently
- [ ] Unlock additional sound variants through local game progression
- [ ] Persist sound selections and volume preferences locally without accounts or backend services
- [ ] Keep the authored defaults active when no custom selection has been made

### Acceptance

The player can preview available sounds, choose a variant for each supported game
event, and hear those choices during gameplay. Selections survive a browser restart,
and newly unlocked variants appear without changing the gameplay rules.

## Post-MVP - Multiple Levels

- [x] Define three authored missions through compact level data
- [x] Let keyboard and touch players select a mission from the title screen
- [x] Advance to the next mission after victory while carrying score and remaining helicopters
- [x] Retry the current mission after failure
- [x] Increase route length, rescue target, tank count, and jet pressure by mission
- [x] Give each mission a clear name, difficulty label, HUD identity, and completion screen
- [x] Manually complete or meaningfully playtest all three missions

### Acceptance

The player can select any authored mission for testing, or begin with Green Valley and
advance through Highland Pass to Black Ridge. Each mission is visibly distinct and more
demanding than the previous one, while preserving the complete rescue loop.

## Post-MVP - Future Feature-Driven Levels

- [ ] Add a new authored mission when a new gameplay feature needs a complete vertical slice
- [ ] Give each new mission a focused gameplay identity beyond palette and terrain changes
- [ ] Introduce new mechanics gradually so each mission teaches and tests its added feature
- [ ] Preserve selection, campaign progression, retry behavior, and carried run state
- [ ] Add pure tests and a focused gameplay route for each mission-specific rule
- [ ] Manually accept each new mission before marking its feature slice complete

Candidate feature missions may introduce rockets, AA guns, SAM launchers, difficulty
rules, or SF ground combat. Keep each addition in the existing `LevelConfig`-driven
structure and avoid creating levels that only increase content volume.

### Acceptance

Each additional mission introduces and validates at least one focused gameplay feature,
remains compatible with the existing campaign flow, and keeps earlier missions playable.

## Post-MVP - Bombs

- [x] Add a gravity-driven air-to-ground bomb with inherited helicopter momentum
- [x] Add keyboard `Z` and touch Bomb controls with an independent reload indicator
- [x] Detonate bombs against ground, base surfaces, and solid terrain
- [x] Give the blast enough damage for one accurate tank hit or two accurate camp hits
- [x] Preserve friendly-fire risk for exposed hostages inside the blast
- [x] Cover launch physics, blast bounds, touch input, and a Level 2 tank-drop route
- [x] Manually accept bomb timing, aiming, blast radius, and touch-button placement

### Acceptance

On Highland Pass, the player can fly over the first solid ridge and destroy the armored
tank behind it with an accurate bomb drop. The cannon remains unchanged, terrain still
blocks direct fire, and an inaccurate bomb can miss or endanger released hostages.

## Post-MVP - Hard Difficulty Hostage Threat

- [x] Allow enemies to deliberately target exposed hostages on harder levels or difficulty settings
- [x] Keep captive hostages protected and untargetable while their prison camp remains closed
- [x] Make hostages vulnerable while running out, waiting, and boarding the helicopter
- [x] Keep boarded hostages protected by the helicopter rather than targeting passengers individually
- [~] Add readable warning, defense, injury, and death feedback for attacks on hostages
- [~] Balance the rule so opening a camp is a tactical choice best made when rescue is possible

## Post-MVP - Harder Terrain and SF Ground Combat

- [~] Make mountains and hills solid flight obstacles on harder levels
- [~] Give terrain collision shapes clear visual silhouettes and fair approach space
- [~] Keep hostage rally points and boarding routes from crossing solid terrain
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

- [x] Give each additional level a distinct terrain silhouette and color palette
- [x] Vary distant mountains, nearby forests or hills, and cloud density by level
- [x] Add authored day, dusk, and night environment themes
- [x] Add readable base, landing-pad, projectile, and unit lighting for night levels
- [x] Keep gameplay silhouettes and collision boundaries readable in every theme
- [x] Configure environment choices as level data rather than duplicating scene logic

### Acceptance

Additional levels must be immediately distinguishable through terrain, sky, and
lighting while preserving the same clear helicopter, enemy, hostage, and landing-zone
silhouettes. Day and night are deliberate level themes rather than a real-time clock.

## Post-MVP - Device Compatibility Checks

- [x] Contain the complete 16:9 canvas inside older 4:3 iPad landscape viewports
- [x] Add an automated 1024x768 layout check that keeps the Cannon button fully visible
- [x] Confirm playable landscape controls and canvas containment on a physical tablet
- [ ] Complete the full touch rescue loop on a larger tablet such as an iPad

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
