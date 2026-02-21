# JSON References and Links Audit

Audit of all `.json` files and linked assets: spelling, file references, and cross-references.  
**Scope:** `data/`, `ui/`, and `scenes/<id>/scene.json` under the main Cupid app (not `scenes/scenes/` or `cupid_hud_prototype_v3_editor_compiler/`).

---

## 1. data/scenes.json

| Field / reference | Status |
|-------------------|--------|
| **id** (10 entries) | All match scene folders: `afterparty_apartment`, `late_night_diner`, `neon_laundry`, `karaoke_bar`, `rooftop`, `gas_station`, `house_party`, `rain_walk`, `airport`, `hospital`. |
| **bg** | All `"bg.svg"` — files exist as `scenes/<id>/bg.svg`. |
| **mid** | All `"mid.svg"` — files exist as `scenes/<id>/mid.svg`. |
| **unlockConditions** | `flag`: `afterparty_completed`, `diner_visited`, `rooftop_visited`, `rain_walk_done`, `airport_goodbye`. `stat`: `trust`, `attraction` (match `defaultState.stats`). |

**Spelling:** Titles and moods checked; no errors found.

---

## 2. data/missions.json

| Field / reference | Status |
|-------------------|--------|
| **sceneId** (for type `"scene"` missions) | All match `data/scenes.json` ids: `afterparty_apartment`, `late_night_diner`, `neon_laundry`, `karaoke_bar`, `rooftop`, `gas_station`, `house_party`, `rain_walk`, `airport`, `hospital`. |

**Spelling:** Mission titles, descriptions, hints checked; no errors found.

---

## 3. data/items.json

| Field / reference | Status |
|-------------------|--------|
| **id** | Unique; no file paths. Used by inventory/choice engine. |
| **effects[].key** | Format `stats.<name>` or N/A; stat names align with `defaultState.stats`. |

**Spelling:** Item names and descriptions checked; no errors found.

---

## 4. ui/hudButtons.json

| Field / reference | Status |
|-------------------|--------|
| **panel** | Values: `stats`, `log`, `map`, `inventory`, `missions`, `editor`, `settings`. All match `panelManager.register()` in `engine/main.js`. |
| **id** | Unique button ids; not used for file loading. |
| **x, y, w, h** | Numeric; no links. |

**Spelling:** Labels (Stats, Log, Map, Inv, Missions, Edit, Settings) checked; no errors found.

---

## 5. scenes/\<id\>/scene.json (per location)

| Reference | Status |
|-----------|--------|
| **id** | Matches folder name and `data/scenes.json` entry. |
| **bg** | All use `"bg.svg"`; file exists in same folder. |
| **mid** | All use `"mid.svg"`; file exists in same folder. |
| **hotspots[].choices[].effects** | `type: "add"` → `key`: `stats.trust`, `stats.attraction`, `stats.chaos`, `stats.resentment`. `type: "flag"` → `key`: `flags.<name>`. All valid. |
| **gotoScene** | `late_night_diner` has `sceneId: "afterparty_apartment"`; valid scene id. |

**Spelling:** Labels and choice text checked; no errors found.

---

## 6. Non-JSON asset links (from HTML/engine)

| Link | Referenced in | File exists? |
|------|----------------|--------------|
| **ui/hud_shell.svg** | `index.html` (#hudImg) | Yes (placeholder; replace with custom PNG/SVG for HUD frame). |
| **ui/hudButtons.json** | `engine/main.js` | Yes. |
| **data/scenes.json** | `engine/main.js` | Yes. |
| **data/items.json** | Not loaded in current main.js (hardcoded inventory) | Exists. |
| **data/missions.json** | Not loaded in current main.js (hardcoded mission) | Exists. |
| **scenes/\<id\>/scene.json** | `engine/scene.js` (loadScene) | Yes for all 10 ids. |
| **scenes/\<id\>/bg.svg** | Set from scene.bg | Yes for all 10. |
| **scenes/\<id\>/mid.svg** | Set from scene.mid | Yes for all 10. |

---

## 7. Duplicate / alternate paths (informational)

- **ui/ui/hudButtons.json** — Duplicate path; app uses `ui/hudButtons.json`.
- **scenes/scenes/** — Nested duplicate scene folders; app uses `scenes/<id>/`.
- **data/scenes (2).json** — Likely duplicate; app uses `data/scenes.json`.

---

## Summary

- **JSON:** All `id`, `bg`, `mid`, `panel`, `sceneId`, and effect `key` references are correctly spelled and point to existing or valid targets.
- **Assets:** All scene `bg`/`mid` point to `bg.svg`/`mid.svg` and files exist. Ensure **ui/hud_shell.png** exists if the HUD shell image is required.
