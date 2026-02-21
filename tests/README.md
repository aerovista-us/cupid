# Cupid — Playwright tests

These tests ensure the game looks and behaves as intended (layout, HUD, hotspots, age gate).

## Run tests

1. **Serve the app** (in one terminal):
   ```bash
   npm run serve
   ```
   Or: `npx serve -p 3000 .`

2. **Run Playwright** (from repo root):
   ```bash
   npm install
   npx playwright install chromium
   npm test
   ```

3. **Optional:** Run with browser visible:
   ```bash
   npm run test:headed
   ```

## What is asserted

- Main app region and page title
- Scene background image present with alt text
- Mid layer and Scene hotspots container
- All 7 HUD buttons: Stats, Log, Map, Inv, Missions, Edit, Settings
- Initial scene (Afterparty Apartment) shows the Phone hotspot
- No placeholder “Replace this SVG…” text visible
- Clicking the Phone hotspot opens the choice modal
- Age gate appears when localStorage is clear and closes after “I am 18+”

## Config

- `playwright.config.js` (repo root): base URL `http://localhost:3000`, viewport 1280×720, Chromium.
- Override base URL: `BASE_URL=http://localhost:5000 npm test`
