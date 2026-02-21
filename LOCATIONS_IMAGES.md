# Cupid — Location ↔ Scene Art

**All scene images live in the `scenes/` folder.** Each location has its own directory; the engine loads the background from that directory using the `bg` field in the scene’s `scene.json`.

---

## Convention

- **Path:** `scenes/<sceneId>/<filename>`
- **Config:** In `scenes/<sceneId>/scene.json`, set `"bg": "bg.svg"` (or `"bg.png"` if you use a raster image).
- **Engine:** Loads `scenes/${sceneId}/${scene.bg}` (see `engine/scene.js`).
- **Index:** `data/scenes.json` lists each scene and its `img` path for the Map panel (should match the scene folder).

---

## Scene ID ↔ Location

| # | Scene ID | Name | Scene art path |
|---|----------|------|-----------------|
| 01 | `afterparty_apartment` | The Afterparty Apartment | `scenes/afterparty_apartment/bg.svg` |
| 02 | `late_night_diner` | Late Night Diner | `scenes/late_night_diner/bg.svg` |
| 03 | `neon_laundry` | Neon Laundry (Spin Cycle After Dark) | `scenes/neon_laundry/bg.svg` |
| 04 | `karaoke_bar` | Dive Bar Karaoke (Last Call) | `scenes/karaoke_bar/bg.svg` |
| 05 | `rooftop` | Rooftop City Overlook | `scenes/rooftop/bg.svg` |
| 06 | `gas_station` | The Road Trip Gas Station | `scenes/gas_station/bg.svg` |
| 07 | `house_party` | The Friend's House Party | `scenes/house_party/bg.svg` |
| 08 | `rain_walk` | The Rain Walk (No Destination) | `scenes/rain_walk/bg.svg` |
| 09 | `airport` | The Airport Goodbye | `scenes/airport/bg.svg` |
| 10 | `hospital` | The Hospital Waiting Room | `scenes/hospital/bg.svg` |

---

## Adding or replacing scene art

1. Put the file in the scene folder, e.g. `scenes/afterparty_apartment/bg.png`.
2. In `scenes/afterparty_apartment/scene.json`, set `"bg": "bg.png"` (or keep `"bg": "bg.svg"` if you kept the SVG).
3. No code changes needed; the engine uses `scene.bg` from each scene’s JSON.

---

## Other assets (not scene backgrounds)

| Use | Suggested path |
|-----|-----------------|
| HUD shell overlay | `ui/hud_shell.png` (or reference in CSS/HTML when you add it) |
| Branding / title | e.g. `ui/` or project root |

---

## Legacy `images/` folder

If you have an old `images/` folder with `location-NN-*.png` files from an earlier prototype, you can:

- **Move** them into the matching scene folder and rename to `bg.png` (then set `"bg": "bg.png"` in that scene’s `scene.json`), or  
- **Leave** them elsewhere for reference; the **active app** only loads art from `scenes/<sceneId>/`.
