# Pilot Calc

Offline-first PWA with flight calculators for phone and tablet (iPhone/iPad home-screen app, also usable in flight
without network). Hosted on GitHub Pages. See README.md for build/deploy.

## Stack
Vite + React 19 + TypeScript, plain CSS (tokens in `src/styles.css`), Vitest, vite-plugin-pwa. No backend, no router
library (hash routing). Node 22 (`.nvmrc`).

## Blueprint: every calculator follows `src/calculators/temp-correction/`

The temperature correction page is the reference for ALL further calculators. Keep new ones consistent with it.

**Registration:** one folder `src/calculators/<id>/` + one entry in `registry.ts`. Group `general` / `ground` /
`airborne` decides the heading in the collapsible left navigation (flat list per group). Empty groups show "Coming soon".

**Files per calculator:** `calc.ts` (pure functions, no React/DOM), `calc.test.ts` (Vitest), `model.ts` (linked-field
logic, pure and tested, if needed), `Page.tsx`, optional `Diagram.tsx`.

**Page layout, top to bottom (cards):**
1. **Input** – `LinkedGroup`s of `NumberField`s. Values that derive from each other are linked: editing one
   recomputes the other(s) immediately. Say which one stays fixed when a shared parent changes (anchor).
2. **Result** – big `Result` tiles: primary value first, difference/secondary after; warnings (validity range); then
   an inline-SVG diagram; a short assumptions note under the card.
3. **Formula** – exact formula, worked example with the current numbers (skip trivial steps), then the rule of thumb
   if one exists: framed bold headline block (`.rule-box`), short percent-style calculation, and its difference to the
   exact result.

**Input rules**
- No numeric text input via the iOS keyboard (it has no minus). Touch devices (`pointer: coarse`) use the in-app
  keypad (`ui/Keypad.tsx`) with ± (only enabled for fields marked `signed`), decimal point, backspace, Done. Desktop
  uses the normal keyboard. First key press on a focused field replaces its value.
- Inputs persist in `localStorage` per calculator (always in try/catch).
- Whole feet, °C, real minus sign (−) in output, thousands separator (`ui/format.ts`).

**Diagram rules** (kept deliberately simple)
- Anchor the picture at the reference, not at sea level. Altimeter is assumed set to the QNH of the reference, so the
  error is zero there. We never ask for QNH and never show absolute hPa values.
- Dashed = ISA / what the instrument shows, solid = actual atmosphere. Brown terrain with green edge for the station.
- Few labels: Reference, Indicated, True, correction arrow, plus small tick labels in ft for equal-pressure lines.
- Colours only via CSS variables (dark/light follow system).

**Language/tone:** English UI, aviation terms (ISA, MSL, QNH). Navigation headings: General, On ground, Airborne.

## Rules
- Calculation logic lives in pure TS with tests; verify numbers against a hand calculation.
- Offline is a requirement: no runtime network calls, no external fonts/CDNs. All assets precached by the service worker.
- Deploy: push to `main` → GitHub Actions → Pages (source must be "GitHub Actions"). Relative base (`./`).
- Git identity for `~/myProjects` is the private one (set globally via includeIf); don't use work credentials.
- iOS PWA caches hard: after deploys, fully close and reopen the app to get the new version.
