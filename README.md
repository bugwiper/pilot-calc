# Pilot Calc

Offline-capable flight calculators for phone and tablet (PWA). Vite + React + TypeScript, no backend.

```bash
nvm use && npm ci
npm run dev        # local dev server (reachable from phone on the same Wi-Fi)
npm test           # unit tests for the calculation logic
npm run build      # production build incl. service worker
```

## Install on iPhone/iPad
Open the hosted URL in Safari once → Share → *Add to Home Screen*. After the first load the app runs without network.

## Calculator blueprint
Every calculator is one folder in `src/calculators/<id>/` and one entry in `src/calculators/registry.ts`
(group `general` / `ground` / `airborne` decides the navigation heading).

Page structure (see `temp-correction/`):
1. **Input** card – `LinkedGroup`s of `NumberField`s. Values that derive from each other are linked: editing either updates the other (logic in `model.ts`, pure and tested).
2. **Result** card – big `Result` tiles (primary value first, difference/secondary after), assumptions note, then a diagram (inline SVG using the CSS tokens).
3. **Formula** card – exact formula, worked example with the current numbers, rule of thumb (if one exists) with its difference to the exact result.

Rules: calculation code is pure TS in `calc.ts` with Vitest tests; no DOM there. Inputs persist in `localStorage`. English UI, integer feet, °C, signed values use a real minus (−). Colours only via CSS variables in `styles.css` (dark/light follow the system).

## Deploy (GitHub Pages)
Push to `main`; `.github/workflows/pages.yml` builds and publishes. Set *Settings → Pages → Source: GitHub Actions*. The build uses relative paths, so any sub-path works.
