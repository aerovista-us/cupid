# Cupid — Prototype notes

## Active app (current build)

The app that runs when you open `index.html` is the **engine + data + scenes** build:

- **Entry:** `engine/main.js` (module)
- **Scene art:** All under **`scenes/`** — one folder per location (`scenes/<sceneId>/bg.svg` or `bg.png`). See `LOCATIONS_IMAGES.md`.
- **Data:** `data/scenes.json` (map index), `scenes/<id>/scene.json` (per-scene config + hotspots), `ui/hudButtons.json` (HUD hitboxes).
- **Panels:** Stats, Log, Map, Inventory, Missions, Settings. Top panels slide down, bottom panels slide up.
- **Save:** LocalStorage key `cupid_proto_v1`.

Run with any static server (e.g. `python -m http.server 8000` → `http://localhost:8000`). Press **D** for debug outlines.

---

## Legacy PoC (`js/` + `css/cupid.css`)

The files in `js/` (state.js, data.js, sceneManager.js, panelManager.js, main.js) and `css/cupid.css` are from an earlier prototype. **They are not loaded by the current index.html.** They are kept for reference; scene paths in `js/data.js` have been updated to use `scenes/` so they stay consistent if you ever reuse that code.

---

## Reset save

Browser console: `localStorage.removeItem('cupid_proto_v1'); location.reload();`

(For the old PoC: `localStorage.removeItem('cupid_poc_save'); location.reload();`)
