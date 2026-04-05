// ─────────────────────────────────────────────────────────────────────────────
// game.js – Kingdom's Tower core engine
// Implements the 6-step core loop from Core_Loop sheet, tick by tick.
// ─────────────────────────────────────────────────────────────────────────────

const Game = (() => {

  let state = null;
  let tickInterval = null;
  const TICK_MS = DATA.time.tick_real_ms;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function res(id) { return state.resources[id] ?? 0; }
  function setRes(id, val) { state.resources[id] = Math.max(0, val); }
  function addRes(id, delta) { setRes(id, res(id) + delta); }

  function workerCount(type_id) { return state.workers_assigned[type_id] ?? 0; }
  function structCount(struct_id) { return state.structures_built[struct_id] ?? 0; }
  function armyCount(unit_id) { return state.army[unit_id] ?? 0; }

  function totalArmyStrength() {
    const faction = DATA.factions[state.faction_id];
    const fMod = faction.modifiers.army_strength ?? 1.0;
    return DATA.army_units.reduce((sum, u) => sum + armyCount(u.id) * u.strength, 0) * fMod;
  }

  function maxWorkersFor(worker) {
    if (worker.workplace_struct_id === null) return Infinity;
    const struct = DATA.structures.find(s => s.id === worker.workplace_struct_id);
    if (!struct) return 0;
    const count = structCount(struct.id);
    return count * (struct.max_workers ?? Infinity);
  }

  function totalAssigned() {
    return DATA.workers
      .filter(w => w.id !== 0)
      .reduce((s, w) => s + workerCount(w.id), 0)
      + totalArmyWorkers();
  }

  function totalArmyWorkers() {
    return DATA.army_units.reduce((s, u) => s + armyCount(u.id), 0);
  }

  function totalWorkers() { return res(0); }
  function idleWorkers()  { return Math.max(0, totalWorkers() - totalAssigned()); }

  function currentSeason() {
    const seasonIdx = Math.floor((state.tick % DATA.time.year_ticks) / DATA.time.season_ticks);
    return DATA.time.seasons[seasonIdx];
  }

  function seasonFoodMod() {
    return currentSeason().modifiers[state.season_temp] ?? 0;
  }

  function factionFoodMod() {
    const f = DATA.factions[state.faction_id];
    return f.modifiers.food_production ?? 1.0;
  }

  function researchMod(key) {
    return state.research_done.reduce((val, rid) => {
      const r = DATA.research.find(x => x.id === rid);
      return r?.modifier_key === key ? val * r.modifier_val : val;
    }, 1.0);
  }

  function calcFoodDelta() {
    let delta = 0;
    const undead = DATA.factions[state.faction_id].modifiers.food_consumption === 0;

    DATA.workers.forEach(w => {
      const count = workerCount(w.id);
      if (count === 0) return;
      if (w.produces?.resource_id === 1) {
        let prod = w.produces.qty * count;
        prod *= factionFoodMod();
        prod *= (1 + seasonFoodMod());
        prod *= researchMod('food_production');
        delta += prod;
      }
      if (!undead) delta -= w.food_per_tick * count;
    });

    if (!undead) delta -= idleWorkers() * 2;

    if (!undead) {
      DATA.army_units.forEach(u => {
        delta -= armyCount(u.id) * 4;
      });
    }
    return delta;
  }

  function calcAllDeltas() {
    const deltas = {};
    DATA.resources.forEach(r => { deltas[r.id] = 0; });

    deltas[1] = calcFoodDelta();

    DATA.workers.forEach(w => {
      const count = workerCount(w.id);
      if (!w.produces || w.produces.resource_id === 1) return;
      if (count === 0) return;
      let prod = w.produces.qty * count;
      const modKey = ['wood_production','stone_production','ore_production'][w.produces.resource_id - 2];
      if (modKey) prod *= researchMod(modKey);
      deltas[w.produces.resource_id] += prod;
    });

    return deltas;
  }

  // ── Core loop steps ───────────────────────────────────────────────────────

  function applyResourceChanges() {
    const deltas = calcAllDeltas();
    deltas[0] = 0;

    Object.entries(deltas).forEach(([rid, d]) => {
      if (d === 0) return;
      addRes(Number(rid), d);
    });

    if (res(1) <= 0) {
      if (state.tick % 5 === 0 && res(0) > 1) {
        addRes(0, -1);
        const assigned = DATA.workers.find(w => w.id !== 0 && workerCount(w.id) > 0);
        if (assigned) state.workers_assigned[assigned.id] = workerCount(assigned.id) - 1;
        logEvent("⚠ A worker has perished from starvation.");
      }
    }
  }

  function applySeasonalModifiers() {
    const tickInYear = state.tick % DATA.time.year_ticks;
    if (tickInYear % DATA.time.season_ticks === 0 && state.tick > 0) {
      const roll = Math.random();
      state.season_temp = roll < 0.33 ? 'cold' : roll < 0.67 ? 'average' : 'warm';
      const season = currentSeason();
      logEvent(`🌤 ${season.name} has arrived (${state.season_temp}).`);
    }
  }

  function updatePopulation() {
    const day = Math.floor(state.tick / DATA.time.day_ticks);
    if (state.tick % DATA.time.day_ticks !== 0) return;

    const current = res(0);
    const cap = state.pop_cap;
    const foodSurplus = res(1) > 100;

    if (foodSurplus && current < cap && day > 0) {
      addRes(0, 1);
      logEvent(`👶 Population grew to ${res(0)}.`);
    }
  }

  function checkEvents() {
    const floorsCleared = state.floors_cleared.length;
    if (floorsCleared > 0 && Math.random() < 0.001 * floorsCleared) {
      const raidStrength = floorsCleared * 5;
      if (totalArmyStrength() >= raidStrength) {
        logEvent(`✔ Raid repelled! (strength ${raidStrength})`);
      } else {
        const foodLost = Math.floor(raidStrength * 2);
        addRes(1, -foodLost);
        logEvent(`🔥 RAID! Lost ${foodLost} food. Strengthen your army!`);
      }
    }
  }

  function saveState() {
    if (state.tick % 30 === 0) {
      try { localStorage.setItem('kingdoms_tower_save', JSON.stringify(state)); } catch(e) {}
    }
  }

  // ── Main tick ──────────────────────────────────────────────────────────────

  function tick() {
    state.tick++;
    applySeasonalModifiers();
    applyResourceChanges();
    updatePopulation();
    checkEvents();
    saveState();
    UI.refresh();
  }

  // ── Attack tower ───────────────────────────────────────────────────────────

  function attackTower() {
    const nextFloorIdx = state.floors_cleared.length;
    if (nextFloorIdx >= DATA.tower_floors.length) return { ok: false, msg: "Tower fully cleared!" };
    const floor = DATA.tower_floors[nextFloorIdx];
    const myStr = totalArmyStrength();

    if (myStr < floor.cult_strength) {
      return { ok: false, msg: `Repelled! Need ${floor.cult_strength} army strength (you have ${myStr.toFixed(0)}).` };
    }

    state.floors_cleared.push(floor.id);
    addRes(8, floor.reward_gp);

    if (floor.unlocked_workshop) {
      floor.unlocked_workshop.forEach(sid => {
        if (!state.unlocked_structures) state.unlocked_structures = [];
        if (!state.unlocked_structures.includes(sid)) state.unlocked_structures.push(sid);
      });
    }

    if (floor.unlocked_research) {
      floor.unlocked_research.forEach(rid => {
        if (!state.research_unlocked.includes(rid)) state.research_unlocked.push(rid);
      });
    }

    logEvent(`🏆 Floor ${floor.floor} cleared! Gained ${floor.reward_gp} GP.`);

    if (floor.lore_flag !== null && !state.lore_seen.includes(floor.lore_flag)) {
      state.lore_seen.push(floor.lore_flag);
      setTimeout(() => UI.showLore(floor.lore_flag), 300);
    }

    return { ok: true, msg: `Floor ${floor.floor} cleared! +${floor.reward_gp} GP.` };
  }

  // ── Build structure ────────────────────────────────────────────────────────

  function build(struct_id) {
    const s = DATA.structures.find(x => x.id === struct_id);
    if (!s) return false;
    if (!canBuild(struct_id)) return false;

    const faction = DATA.factions[state.faction_id];
    const costMod = faction.modifiers.structure_cost ?? 1.0;
    Object.entries(s.cost).forEach(([resName, qty]) => {
      const resObj = DATA.resources.find(r => r.name.startsWith(resName));
      if (resObj) addRes(resObj.id, -Math.ceil(qty * costMod));
    });

    state.structures_built[struct_id] = structCount(struct_id) + 1;

    if (s.population_bonus) {
      state.pop_cap += s.population_bonus;
    }

    logEvent(`🔨 Built: ${s.name}`);
    UI.refresh();
    return true;
  }

  function canBuild(struct_id) {
    const s = DATA.structures.find(x => x.id === struct_id);
    if (!s) return false;

    if (s.max !== null && structCount(struct_id) >= s.max) return false;
    if (s.unlocked_by_struct !== null && structCount(s.unlocked_by_struct) === 0) return false;

    if (s.unlocked_by_floor !== null) {
      const unlocked = state.unlocked_structures ?? [];
      if (!unlocked.includes(struct_id)) return false;
    }

    const faction = DATA.factions[state.faction_id];
    const costMod = faction.modifiers.structure_cost ?? 1.0;
    return Object.entries(s.cost).every(([resName, qty]) => {
      const resObj = DATA.resources.find(r => r.name.startsWith(resName));
      return resObj ? res(resObj.id) >= Math.ceil(qty * costMod) : false;
    });
  }

  // ── Assign worker ──────────────────────────────────────────────────────────

  function assignWorker(type_id, delta) {
    const w = DATA.workers.find(x => x.id === type_id);
    if (!w) return;
    const current = workerCount(type_id);
    const maxSlots = maxWorkersFor(w);
    const idle = idleWorkers();
    const newVal = current + delta;

    if (newVal < 0) return;
    if (delta > 0 && idle <= 0) return;
    if (delta > 0 && current >= maxSlots) return;

    state.workers_assigned[type_id] = Math.max(0, newVal);
    UI.refresh();
  }

  // ── Enlist / dismiss army ──────────────────────────────────────────────────

  function enlistUnit(unit_id, delta) {
    const u = DATA.army_units.find(x => x.id === unit_id);
    if (!u) return false;
    const current = armyCount(unit_id);
    const newVal = current + delta;
    if (newVal < 0) return false;
    if (delta > 0) {
      if (idleWorkers() <= 0) return false;
      if (u.gear_res_id !== null) {
        if (res(u.gear_res_id) <= 0) return false;
        addRes(u.gear_res_id, -1);
      }
    } else {
      if (u.gear_res_id !== null) addRes(u.gear_res_id, 1);
    }
    state.army[unit_id] = newVal;
    UI.refresh();
    return true;
  }

  // ── Research ───────────────────────────────────────────────────────────────

  function doResearch(rid) {
    const r = DATA.research.find(x => x.id === rid);
    if (!r) return false;
    if (state.research_done.includes(rid)) return false;
    if (!state.research_unlocked.includes(rid)) return false;
    if (res(7) < r.cost) return false;
    addRes(7, -r.cost);
    state.research_done.push(rid);
    logEvent(`🔬 Research complete: ${r.name}`);
    UI.refresh();
    return true;
  }

  // ── Event log ──────────────────────────────────────────────────────────────

  const eventLog = [];
  function logEvent(msg) {
    const day = Math.floor(state.tick / DATA.time.day_ticks) + 1;
    eventLog.unshift({ msg, day });
    if (eventLog.length > 40) eventLog.pop();
    UI.refreshLog();
  }

  // ── Init / Load ────────────────────────────────────────────────────────────

  function newGame(kingdom_name, faction_id) {
    state = JSON.parse(JSON.stringify(DATA.default_state));
    state.kingdom_name = kingdom_name;
    state.faction_id = faction_id;
    state.tick = 0;

    DATA.resources.forEach(r => {
      state.resources[r.id] = r.starting;
    });

    if (faction_id === 3) state.resources[1] = 0;

    state.structures_built[0] = 1;
    state.unlocked_structures = [];
    state.workers_assigned = {};
    state.army = {};
    state.floors_cleared = [];
    state.research_done = [];
    state.research_unlocked = [];
    state.lore_seen = [];
    state.pop_cap = 5;
    state.season_temp = 'average';

    startLoop();
  }

  function loadGame() {
    try {
      const saved = localStorage.getItem('kingdoms_tower_save');
      if (saved) { state = JSON.parse(saved); startLoop(); return true; }
    } catch(e) {}
    return false;
  }

  function startLoop() {
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(tick, TICK_MS);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    newGame, loadGame,
    getState: () => state,
    getEventLog: () => eventLog,
    calcAllDeltas,
    currentSeason,
    seasonFoodMod,
    totalArmyStrength,
    totalWorkers,
    idleWorkers,
    totalAssigned,
    workerCount,
    structCount,
    armyCount,
    res,
    maxWorkersFor,
    canBuild,
    build,
    assignWorker,
    enlistUnit,
    doResearch,
    attackTower,
    logEvent,
    structureIsVisible(struct_id) {
      const s = DATA.structures.find(x => x.id === struct_id);
      if (!s) return false;
      if (s.unlocked_by_struct !== null && this.structCount(s.unlocked_by_struct) === 0) return false;
      if (s.unlocked_by_floor !== null) {
        const unlocked = state?.unlocked_structures ?? [];
        if (!unlocked.includes(struct_id)) return false;
      }
      return true;
    },
    workerIsVisible(worker_id) {
      if (worker_id === 0) return false;
      const w = DATA.workers.find(x => x.id === worker_id);
      if (!w) return false;
      if (w.unlocked_by_struct === null) return true;
      return this.structCount(w.unlocked_by_struct) > 0;
    },
    researchIsVisible(rid) {
      return state?.research_unlocked?.includes(rid) ?? false;
    },
    armyUnitIsVisible(uid) {
      const u = DATA.army_units.find(x => x.id === uid);
      if (!u) return false;
      if (u.unlocked_by_struct === null) return false;
      return this.structCount(u.unlocked_by_struct) > 0;
    }
  };
})();
