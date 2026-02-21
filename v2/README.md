# Cupid HUD Prototype v2 — Layered (bg.png + mid.svg + hud_shell.png)

## Layer order (bottom → top)
1) scenes/<sceneId>/bg.png   (background art)
2) scenes/<sceneId>/mid.svg  (mid overlay — FX + future puzzle overlays)
3) ui/hud_shell.png          (HUD image overlay — placeholder generated)
4) HUD buttons (hitboxes) + panels/modals

## Run locally
python -m http.server 8000
Open http://localhost:8000

## Replace art
- Replace each bg.png with your generated scene image (keep filename)
- Edit/replace mid.svg per scene for FX and later interactive overlays
- Replace ui/hud_shell.png once your final shell is ready

## Debug
Press D to outline hotspots + HUD buttons.
