# Kingdom's Tower

**An incremental idle tower-climber / worker placement game**

---

## Quick Start (GitHub Pages)

1. Push this repo to GitHub
2. Go to **Settings → Pages → Source: main branch / root**
3. Visit `https://<you>.github.io/<repo>/`

No build step. Pure HTML/CSS/JS, no dependencies.

---

## Project Structure

```
kingdoms-tower/
├── index.html          → Entry point / all panels
├── css/
│   └── style.css       → Full game styling (medieval pastel)
└── js/
    ├── data.js         → ALL game data (single source of truth)
    ├── game.js         → Core engine: tick loop, resource math, state
    ├── ui.js           → All rendering and DOM interactions
    └── main.js         → Bootstrap / DOMContentLoaded entry
```

---

## How to Expand

All game data lives in **`js/data.js`**. The engine reads it at runtime — add rows, the UI and logic pick them up automatically.

### Add a structure
```js
{ id: 9, name: "Tavern", category: "Social",
  unlocked_by_struct: 3, unlocked_by_floor: null,
  produces_res: null, qty_per_tick: null, max_workers: null,
  cost: { Wood: 30, Food: 20 }, starting: 0, max: null,
  desc: "Boosts morale. (wire effect in game.js)" }
```

### Add a tower floor
```js
{ id: 10, floor: 11, cult_strength: 110, unlocked_workshop: null,
  unlocked_research: null, reward_gp: 60, lore_flag: null }
```

### Add research
```js
{ id: 4, name: "Iron Smelting", cost: 50, effect: "Ore +20%.",
  modifier_key: "ore_production", modifier_val: 1.20, unlocked_by_floor: 3 }
```

---

## Core Loop

| Step | Action |
|------|--------|
| 1 | Apply resource changes (starvation check included) |
| 2 | Re-roll season temperature on season boundary |
| 3 | Grow population if food surplus and under housing cap |
| 4 | Random raid check |
| 5 | Auto-save to localStorage every 30 ticks |

**1 tick = 1 s · 1 day = 20 ticks · 1 season = 600 ticks · 1 year = 2400 ticks**

---

## Save System

Auto-saves to `localStorage` key `kingdoms_tower_save` every 30 s.
Browser console: `Game.getState()` to inspect live state.

---

## TODOs

- [ ] Guard / Yeoman / Mountie gear resources
- [ ] Trade hall + Caravansary
- [ ] Prestige system
- [ ] Build ×10 / ×100 (shift/ctrl click)
- [ ] Audio
- [ ] Color palette themes
