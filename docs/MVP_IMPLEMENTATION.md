# Cupid MVP Implementation Documentation

## Overview
This document describes the MVP finish line implementation completed for the Cupid relationship game. The implementation includes standardized choice engine, relationship state machine, content pipeline improvements, hotspot placer tool, save export/import, content warnings, and comprehensive game systems.

## Core Systems Implemented

### 1. Choice Engine (`engine/choiceEngine.js`)
Standardized effect handler system that processes all choice outcomes:

**Effect Types:**
- `addStat(key, value)` - Modify stats (trust, attraction, resentment, chaos)
- `setStat(key, value)` - Set stat to specific value
- `setFlag(key, value)` - Set state flags
- `gotoScene(sceneId)` - Navigate to different location
- `giveItem(itemId)` / `takeItem(itemId)` - Inventory management
- `unlockHotspot(sceneId, hotspotId)` - Conditional hotspot reveal
- `startMission(missionId)` / `advanceMission(missionId, progress)` - Mission system
- `queueMoment(text, tag)` - Add to log with optional cutscene trigger
- `updateRelationship(mode, intensityDelta)` - Relationship state changes

**Requirements System:**
Choices can have `requires` conditions:
- `{ flag: 'xxx' }` - Requires specific flag
- `{ stat: 'trust', min: 5 }` - Requires stat threshold
- `{ item: 'spark_pin' }` - Requires item in inventory
- `{ scene: 'afterparty_apartment' }` - Requires specific scene

### 2. Relationship State Machine (`engine/relationship.js`)
Manages relationship mode transitions based on stats:

**Modes:**
- `strangers` → `friends` (trust > 3 AND attraction > 2)
- `friends` → `lovers` (attraction > 7 AND trust > 5)
- `lovers` → `enemies` (resentment > 8)
- `enemies` → `friends` (trust > 6 AND resentment < 3)
- `lovers` → `soulmates` (trust > 8 AND attraction > 8 AND resentment < 2)

**Intensity Calculation:**
Based on trust + attraction, reduced by resentment (0-100 scale)

### 3. State Schema (`engine/main.js`)
Extended state includes:
```javascript
{
  rel: { mode: 'strangers', intensity: 0 },
  unlockedScenes: ['afterparty_apartment'],
  telemetry: {
    lastChoices: [],
    visitedScenes: {},
    commonEndings: []
  },
  settings: {
    explicitLanguage: true,
    sexualImplication: true,
    ageGatePassed: false
  },
  ui: { debug: false, hotspotEditMode: false }
}
```

### 4. Hotspot Editor (`engine/editor.js`)
Polished visual editor for hotspot placement:
- Press `E` to open Editor panel in HUD
- "Enter Editor" button to enable visual editing
- Click scene to create hotspot
- Drag hotspots to reposition
- Resize handle (bottom-right corner)
- Double-click hotspot to edit ID/Label
- "Delete Selected" button to remove hotspots
- Export options: full `scene.json` or `hotspots.json` only
- Works directly with scene objects (not game state)
- Visual selection highlighting (yellow selected, pink others)

### 5. Save Export/Import (`engine/storage.js`)
- `exportSave(state)` - Downloads save as JSON file (`cupid_save.json`) via `saveDownload`
- `parseSave(text)` - Parses and validates uploaded JSON; returns state object or `null`
- Settings panel: **Export Save** and **Import Save** buttons (file picker for import)

### 6. Content Warnings & Settings (implemented)
- **Age gate:** On first load, if `settings.ageGatePassed` is false, a modal asks "I am 18+" before continuing.
- **Content toggles:** Settings panel has Explicit language and Sexual implication checkboxes; choice text can use `textSafe` when explicit is off (see scene.js openHotspot).
- **Telemetry:** Settings shows recent choices and visited scenes; `setStateImpl` records `telemetry.lastChoices` and `telemetry.visitedScenes` on each choice/travel.

### 7. Map lock/unlock (implemented)
- `data/scenes.json` entries can have `unlockConditions`: `{ type: 'flag', flag: 'afterparty_completed' }`, `{ type: 'stat', stat: 'trust', min: 4 }`, or `{ type: 'item', item: 'id' }`.
- Map panel shows locked scenes with 🔒 and disabled Go; `updateUnlockedScenes(state)` runs on every state update.
- Afterparty phone choices set `flags.afterparty_completed` so Late Night Diner and others unlock.

### 8. Inventory and missions from JSON
- `data/items.json` and `data/missions.json` are loaded at startup; `itemsIndex` and `missionsIndex` drive Inventory and Missions panels. Item use applies effects via `choiceEngine.applyEffects`.

### 9. UI polish
- `.missionLocked` and `.statFill` in `css/app.css`; stat bars use transition for width. Panel transitions already in place.

- **Age Gate:** Modal on first load requiring "I am 18+" confirmation
- **Content Filters:** Toggles for explicit language and sexual implication
- **Log Filtering:** Filter log entries by content tags (All/Safe Only/Explicit Only)

### 7. Map Lock/Unlock System
Scenes can have `unlockConditions` in `data/scenes.json`:
- Flag-based: `{ type: "flag", flag: "afterparty_completed" }`
- Stat-based: `{ type: "stat", stat: "attraction", min: 5 }`
- Item-based: `{ type: "item", item: "spark_pin" }`

Locked scenes show lock icon and unlock hint in map panel.

### 8. Inventory System (`data/items.json`)
20 items defined:
- **Tools** (usable): Silence Token, Honesty Catalyst, Tension Breaker, etc.
- **Keys** (unlock paths): Spark Pin, Trust Key, Vulnerability Key
- **Memories** (passive effects): Rose Note, Memory Fragment, Regret Anchor, etc.

### 9. Missions System (`data/missions.json`)
Mission definitions include:
- Core arcs (long-term relationship goals)
- Scene-specific micro-goals
- Progress tracking and completion rewards

### 10. Content Pipeline (`tools/update_scenes_from_md.py`)
Updated MD parser handles both:
- `## 📍 Location` headings (locations 3-10)
- `### 📍 Location` headings (locations 1-2)

Extracts design metadata and populates `scene.json` files.

## UI Enhancements

### Panel Animations (`css/app.css`)
- Smooth cubic-bezier transitions for panel open/close
- Card hover/active states
- Stat bar animations with easing
- Mission card highlighting for current/locked states

### Relationship Panel
New panel showing:
- Current relationship mode
- Intensity bar (0-100)
- Transition hints
- Mode explanation

### Settings Panel
Enhanced with:
- Content filter toggles
- Save export/import buttons
- Debug tools (fullscreen, debug mode, hotspot editor)
- Telemetry display (most visited locations)

### Log Panel
Added filter dropdown:
- All entries
- Safe Only (filters explicit/sexual tags)
- Explicit Only

## Hotspot Examples

### Afterparty Apartment
Three hotspots implemented:
1. **Phone** - Mainline choice (trust vs chaos)
2. **Coffee Table** - Loot hotspot (memory fragment reward)
3. **Couch** - Risk hotspot (attraction vs resentment)

Each hotspot demonstrates:
- Multiple choice options (2-3 choices)
- Standardized effects
- Mission advancement
- Flag setting for unlocks

## File Structure

```
cupid/
├── engine/
│   ├── choiceEngine.js      # Standardized effect handlers
│   ├── relationship.js       # Relationship state machine
│   ├── hotspotPlacer.js     # Debug hotspot editor
│   ├── main.js              # Main game logic (updated)
│   ├── scene.js             # Scene manager (updated)
│   └── storage.js           # Save export/import (updated)
├── data/
│   ├── items.json           # 20 item definitions
│   ├── missions.json        # Mission definitions
│   └── scenes.json          # Scene index with unlock conditions
├── scenes/
│   └── <sceneId>/
│       └── scene.json       # Scene config (hotspots populated)
├── tools/
│   └── update_scenes_from_md.py  # MD parser (updated)
├── docs/
│   └── MVP_IMPLEMENTATION.md     # This file
└── index.html               # Age gate modal added
```

## Keyboard Shortcuts

- `D` - Toggle debug mode (shows outlines)
- `H` - Toggle hotspot edit mode (requires debug mode)
- `Escape` - Close panels/modals

## Next Steps for Full MVP

To complete the MVP finish line:

1. **Populate All Locations:** Add 6-10 hotspots per location (currently only afterparty_apartment has 3)
   - 2 mainline hotspots (relationship progress)
   - 2 risk hotspots (can flip to enemies/chaos)
   - 1 loot hotspot (item/memory reward)
   - 1 secret hotspot (conditional unlock)

2. **Scene Unlock Logic:** Implement automatic scene unlocking when flags/stats are set

3. **Mission Rewards:** Add completion rewards (unlock scenes, give items)

4. **Content Pass:** Ensure all locations have meaningful choices affecting relationship

5. **Testing:** Test save export/import, relationship transitions, map unlocks

## Technical Notes

- All effects are processed through `ChoiceEngine.applyEffects()`
- Relationship transitions are checked after every choice
- Telemetry tracks last 10 choices and visited scenes
- Content filtering swaps choice text if `textSafe` is provided
- Hotspot placer exports JSON that can be merged into `scene.json`
- MD parser preserves existing runtime hotspots when updating design metadata
