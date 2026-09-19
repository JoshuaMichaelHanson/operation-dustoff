# SECURITY.md

## Scope

This is a local/static browser game with no backend and no authentication.

Security risk is intentionally small.

---

## Dependency Safety

- keep dependencies minimal
- use maintained packages
- do not install random packages for trivial functionality
- review dependency additions before accepting them
- run the package manager's audit tooling when reasonable

---

## External Content

Do not dynamically execute remote JavaScript.

Do not add:

- third-party analytics
- ad networks
- trackers
- remote code execution mechanisms
- arbitrary script injection

---

## User Data

The MVP should collect no personal data.

No:

- accounts
- usernames
- email addresses
- telemetry
- location
- cookies

---

## Storage

The MVP requires no persistence.

If high scores are later stored locally:

- use localStorage
- store only game score/settings
- do not store sensitive information

---

## Assets

Only use assets that are:

- original
- generated for this project
- public domain
- or appropriately licensed

Do not copy sprites, maps, audio, logos, or other assets from commercial games.

The game may be inspired by classic gameplay mechanics, but should use its own presentation and assets.

---

## Input Handling

Treat keyboard/gamepad input as untrusted values.

Clamp numeric settings and avoid dynamic code evaluation.

Never use:

```text
eval
new Function
```

for gameplay configuration.
