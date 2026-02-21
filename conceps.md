Yep — that’s the right move. Treat the HUD shell like a **menu bar**, and every “panel” (Inventory / Stats / Missions / Map / Log) as **pop-ups** that slide in over the scene.

Here’s the clean architecture for that.

---

# HUD + Pop-Up Panel Architecture

## HUD has 2 parts

1. **HUD Shell (static art overlay)**
2. **HUD Click Targets (buttons) + Panels (popups)**

So the shell never changes, but the *panels* are dynamic HTML.

---

## Core UI Layers

**Bottom → Top**

1. **Scene image**
2. **Hotspots (scene interactions)**
3. **HUD shell image**
4. **HUD Buttons (invisible clickable zones aligned to shell icons)**
5. **Panels (Inventory/Stats/Missions/etc.)**
6. **Modal (choice dialogue, confirmations)**

---

# HUD Buttons (links that open popups)

You’ll define a fixed set of HUD buttons that are always available:

### Recommended buttons

* **Inventory**
* **Stats**
* **Missions**
* **Map / Locations**
* **Log / Memories**
* **Settings**
* (Optional) **Ability wheel** / Cupid tools

These are “global UI” elements, not scene-specific.

### How to implement

A `hudButtons.json` (or JS constant) that maps normalized coordinates to actions:

```json
[
  { "id":"btn_inventory", "x":0.92, "y":0.86, "w":0.06, "h":0.08, "open":"inventory" },
  { "id":"btn_stats",     "x":0.08, "y":0.12, "w":0.08, "h":0.08, "open":"stats" },
  { "id":"btn_missions",  "x":0.50, "y":0.92, "w":0.10, "h":0.06, "open":"missions" },
  { "id":"btn_map",       "x":0.90, "y":0.10, "w":0.08, "h":0.08, "open":"map" },
  { "id":"btn_log",       "x":0.10, "y":0.90, "w":0.08, "h":0.06, "open":"log" }
]
```

---

# Panel System (the popups)

## Panels are components with a shared contract

Every panel should support:

* Open / close
* Animate in/out
* Read from game state
* Optional tabbed sections
* Search/filter (inventory/log)

### Panel types

1. **Inventory Panel**
2. **Stats Panel**
3. **Missions Panel**
4. **Map Panel**
5. **Log / Memories Panel**
6. **Relationship Panel** (optional but 🔥)

---

## Panel Layout Strategy (mobile-first)

Use one of these two:

### A) “Slide-in Drawer”

* Opens from right (inventory/map)
* Best for phone usability

### B) “Bottom Sheet”

* Opens from bottom (missions/log)
* Feels native mobile

You can mix both for flavor, but keep it consistent.

---

# What each panel contains (v1)

## 🎒 Inventory Panel

* Grid of item cards (Cupid tools, tokens)
* Tap item → description + “Use” button (if usable)
* Filter: Tools / Gifts / Keys / Memories

Inventory items can be:

* passive (unlocks dialogue)
* consumable (changes stats)
* keys (unlock hotspots)

---

## 📊 Stats Panel

Show:

* Trust
* Attraction
* Resentment
* Chaos
* Safety (optional)
* Timing (optional)

Each stat has:

* bar + number
* tooltip text (“what this affects”)
* recent changes list (“+1 Trust from leaving the phone”)

This makes the game feel *real* and *sticky*.

---

## 🎯 Missions Panel

Two layers:

### Main missions (long arcs)

Examples:

* “Get them talking”
* “Earn trust”
* “Survive the party”
* “Stop the goodbye” (airport)

### Micro objectives (scene-level)

Examples:

* “Interact with the phone”
* “Trigger the balcony moment”
* “Find the hidden NPC”

Each mission card can show:

* progress meter
* “next hint” (optional)
* rewards (items/flags)

---

## 🗺 Map / Locations Panel

This should be a “node list” at first:

* Location name
* current availability (locked/unlocked)
* mood tag (romance/chaos/heavy)
* last visited timestamp

Later you can make it a visual map.

---

## 🧾 Log / Memories Panel

This is huge for replay value.

Store:

* major choices
* flags triggered (“Almost Kiss”)
* “memory anchors” (special moments)

Display as:

* timeline list
* searchable tags (“jealousy”, “confession”)

---

# Scene interactions vs HUD interactions (important rule)

When a panel is open:

* Scene hotspots should be disabled (or dimmed)
* Prevent misclick chaos on mobile

---

# State model additions to support panels

Add these to your `state`:

```js
ui: {
  openPanel: null,          // "inventory" | "stats" | ...
  notifications: [],
  lastStatChanges: []
},
missions: {
  active: ["mission_core_01"],
  progress: { "mission_core_01": 0.35 }
}
```

---

# UX feel (what the player experiences)

1. Player enters scene
2. Sees HUD bars + icons
3. Taps **Inventory**
4. Inventory slides in (smooth)
5. Taps an item (“Silence Token”)
6. Gets description + “Use”
7. Uses it → stats adjust → “+1 Trust” appears briefly
8. Closes panel → back to scene

This feels like a real game, even with static art.

---

# Implementation Detail (simple + strong)

Use a single `PanelManager`:

* `openPanel('inventory')`
* `closePanel()`
* `togglePanel('stats')`

Panels render into one container:
`<div id="panel-root"></div>`

So it’s clean and modular.

---

## If you want: I can generate the starter bundle now

Includes:

* HUD button hitboxes
* Slide-in panels for Inventory/Stats/Missions/Map/Log
* Dummy data wired to localStorage state
* Debug overlay for hitboxes
* Sample missions + items

Just tell me one thing:
**Do you want panels to slide in from the right, or bottom?** (I’ll pick right by default if you don’t care.)
