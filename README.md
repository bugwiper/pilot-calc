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
The design decisions every calculator must follow (page layout, linked inputs, keypad, diagram and formula conventions) are written down in [`CLAUDE.md`](CLAUDE.md). The reference implementation is `src/calculators/temp-correction/`.

## Deploy (GitHub Pages)
Push to `main`; `.github/workflows/pages.yml` builds and publishes. Set *Settings → Pages → Source: GitHub Actions*. The build uses relative paths, so any sub-path works.
