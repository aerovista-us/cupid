# Cupid HUD Prototype v3 — Hotspot Editor + MD Compiler

## What’s included
- **Layer stack**: bg.png → mid.svg → hud_shell.png → buttons → panels/modals
- **In-game Hotspot Editor**
  - drag + resize hotspot boxes
  - double-click box to edit ID/Label
  - export: scene.json / hotspots.json (downloads)
- **MD Compiler**: tools/compile_md_to_scenes.py
  - supports `##` or `###` location headers
  - infers sceneId from an MD link like `(scenes/<sceneId>/bg.png)`

## Run locally
From this folder:
- `python -m http.server 8000`
- open `http://localhost:8000`

## Hotspot editor controls
- Open HUD → **Edit** (or press **E**)
- Add Hotspot → drag/resize
- Double-click hotspot box → edit ID/Label
- Export scene.json → download & paste into your repo

## Compiler usage (in your repo)
Put MD packs in `design/*.md` and run:
- `python tools/compile_md_to_scenes.py`

Dry run:
- `python tools/compile_md_to_scenes.py --dry-run`
