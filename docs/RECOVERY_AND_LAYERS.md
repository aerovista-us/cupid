# Recovery and Layer / Init Reference

This doc describes the recovery fixes applied after file overwrites (images not populating, hotspots blocked, init failures) and the resulting architecture: image loading with fallback, layer order and HUD pointer-events, and the init sequence.

## Image loading (bg / mid, fallback)

- **Background:** `engine/scene.js` sets `#bgImg` from `scenes/<sceneId>/<scene.bg>` (default `bg.png`). Scene JSON can specify `"bg": "bg.png"` or `"bg": "bg.svg"`.
- **Fallback:** If the primary asset fails to load (e.g. 404 for `bg.png`), the loader tries the same base name with the other extension: `.png` → `.svg` or `.svg` → `.png`. This is implemented in `setImgSrcWithFallback()` in `scene.js`, so both PNG and SVG assets work without changing every `scene.json`.
- **Mid layer:** `#midSvgImg` is set from `scenes/<sceneId>/<scene.mid>` (e.g. `mid.svg`). No fallback; if `scene.mid` is missing, the mid image is hidden.

## Layer order and HUD pointer-events

Layers (bottom to top) in `css/app.css`:

| Order | Layer / class      | z-index | pointer-events | Purpose                    |
| ----- | ------------------ | ------- | -------------- | -------------------------- |
| 1     | `.sceneLayer`      | 1       | —              | Background image          |
| 2     | `.midLayer`        | 2       | auto           | Mid image + `#hotspots`     |
| 3     | `.dimmer`          | 3       | none (auto when panels open) | Dim when panel/modal open |
| 4     | `.hudImg`          | 4       | none           | HUD shell image            |
| 5     | `.hudButtons`      | 5       | **none**       | HUD button container       |
| 5     | `.hudButtons .hudBtn` | —    | **auto**       | Only the buttons receive clicks |
| 6+    | `.panelRoot`, `.modalRoot`, `.toastRoot` | 6–8 | varies | Panels, modals, toasts |

**Recovery fix:** `.hudButtons` is full-viewport (`inset: 0`) but was `pointer-events: auto`, so it captured all taps and hotspots never received clicks. The fix: set `.hudButtons` to `pointer-events: none` and `.hudButtons .hudBtn` to `pointer-events: auto`, so only the HUD buttons capture clicks and the rest pass through to the hotspots layer.

## Landscape required (phone)

On phone-sized viewports (width &lt; 768px), the app shows a **rotate gate** when the device is in portrait: "Place your phone in landscape to continue." The game cannot be used until the device is rotated to landscape. The gate has `z-index: 200`, `pointer-events: auto` when shown, and `body.rotateGateActive` disables `pointer-events` on `.app` so taps do not reach the game. On desktop (width ≥ 768px) the gate is not shown.

## Init sequence

The app has no continuous game loop; startup is the top-level async code in `engine/main.js`.

1. **Sync:** Imports, DOM refs, `Storage`, `defaultState`, `state = storage.load(defaultState)` (merge with saved state), create `Toasts`, `Modal`, `PanelManager`, `SceneManager`, `HotspotEditor`, then `sceneManager.setEditor(editor)`.
2. **Async (in try/catch):**  
   - `scenesIndex = await loadJSON('data/scenes.json')`  
   - `await sceneManager.loadScene(state.sceneId)` (loads scene JSON, sets bg/mid images, renders hotspots)  
   - `window.__CURRENT_SCENE__ = sceneManager.getScene()`  
   - `hudButtonsDef = await loadJSON('ui/hudButtons.json')`  
   - `createHUDButtons(...)`  
   On failure: error is logged, toast shows "Load failed — check console", and execution continues so the app does not stay blank.
3. **Sync (after try/catch):** Keydown listener, panel registrations, `updateRotateGate()`, age gate modal (if `!state.settings?.ageGatePassed`), then `hudRefresh()`.

**Recovery fixes:**  
- `defaultState` includes `settings: { ageGatePassed: false }` so the age gate logic always has a defined value.  
- Import save uses `storage.mergeWithDefaults(parsed, defaultState)` so imported state gets all default keys (e.g. `settings`, `rel`, `unlockedScenes`).
