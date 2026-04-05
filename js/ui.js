// ─────────────────────────────────────────────────────────────────────────────
// ui.js – Kingdom's Tower UI layer
// Renders all panels, handles user interactions, calls Game API.
// ─────────────────────────────────────────────────────────────────────────────

const UI = (() => {

  let activeTab = 'overview';

  // ── Faction select screen ──────────────────────────────────────────────────

  function buildFactionSelect() {
    const grid = document.getElementById('faction-grid');
    let selectedFaction = 0;

    DATA.factions.forEach(f => {
      const card = document.createElement('div');
      card.className = 'faction-card' + (f.id === 0 ? ' selected' : '');
      card.dataset.id = f.id;
      card.innerHTML = `
        <div class="fc-name">${f.name}</div>
        <div class="fc-adv">${f.advantage ?? '—'}</div>
        <div class="fc-dis">${f.disadvantage ?? '—'}</div>
      `;
      card.addEventListener('click', () => {
        document.querySelectorAll('.faction-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedFaction = f.id;
      });
      grid.appendChild(card);
    });

    document.getElementById('start-btn').addEventListener('click', () => {
      const name = document.getElementById('kingdom-name-input').value.trim() || 'Kingdom';
      startGame(name, selectedFaction);
    });
  }

  function startGame(name, faction_id) {
    document.getElementById('faction-select-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    Game.newGame(name, faction_id);
    buildGameUI();
    refresh();
  }

  // ── Tab navigation ─────────────────────────────────────────────────────────

  function buildTabs() {
    const nav = document.getElementById('tab-nav');
    nav.innerHTML = '';
    DATA.tabs.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (t.key === activeTab ? ' active' : '');
      btn.dataset.tab = t.key;
      btn.textContent = t.label;
      btn.addEventListener('click', () => switchTab(t.key));
      nav.appendChild(btn);
    });
  }

  function switchTab(key) {
    activeTab = key;
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === key);
    });
    document.querySelectorAll('.tab-panel').forEach(p => {
      p.classList.toggle('active', p.id === `panel-${key}`);
    });
    refresh();
  }

  // ── Resource bar ───────────────────────────────────────────────────────────

  function refreshResourceBar() {
    const bar = document.getElementById('resource-bar');
    const visible = [1, 2, 3, 4, 5, 8];
    bar.innerHTML = '';
    DATA.resources.forEach(r => {
      if (!visible.includes(r.id)) return;
      const qty = Game.res(r.id);
      const chip = document.createElement('div');
      chip.className = 'res-chip' + (r.id === 1 && qty < 20 ? ' res-low' : '');
      chip.innerHTML = `<span class="res-icon">${r.icon}</span><span class="res-val">${fmt(qty)}</span>`;
      chip.title = r.name;
      bar.appendChild(chip);
    });
  }

  // ── Time display ───────────────────────────────────────────────────────────

  function refreshTime() {
    const state = Game.getState();
    const tick = state.tick;
    const season = Game.currentSeason();
    const dayInSeason = Math.floor((tick % DATA.time.season_ticks) / DATA.time.day_ticks) + 1;
    const year = Math.floor(tick / DATA.time.year_ticks) + 1;

    document.getElementById('time-season').textContent = season.name;
    document.getElementById('time-day').textContent = dayInSeason;
    document.getElementById('time-year').textContent = year;
    document.getElementById('kingdom-title').textContent =
      `${DATA.factions[state.faction_id].name} Kingdom of ${state.kingdom_name}`;
  }

  // ── Overview panel ─────────────────────────────────────────────────────────

  function refreshOverview() {
    const total = Game.totalWorkers();
    const idle = Game.idleWorkers();
    const armyTotal = DATA.army_units.reduce((s, u) => s + Game.armyCount(u.id), 0);
    const state = Game.getState();

    document.getElementById('ov-workers').textContent = `${total} pop`;
    document.getElementById('ov-idle').textContent = idle;
    document.getElementById('ov-army').textContent = armyTotal;
    document.getElementById('ov-temp').textContent = state.season_temp;

    const foodMod = Game.seasonFoodMod();
    const modEl = document.getElementById('ov-food-mod');
    modEl.textContent = (foodMod >= 0 ? '+' : '') + (foodMod * 100).toFixed(0) + '%';
    modEl.className = foodMod >= 0 ? 'net-pos' : 'net-neg';

    const deltas = Game.calcAllDeltas();
    const netEl = document.getElementById('ov-net-production');
    netEl.innerHTML = '';
    DATA.resources.forEach(r => {
      const d = deltas[r.id];
      if (!d || d === 0) return;
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = `<span>${r.icon} ${r.name}</span><span class="${d >= 0 ? 'net-pos' : 'net-neg'}">${d > 0 ? '+' : ''}${d.toFixed(1)}/tick</span>`;
      netEl.appendChild(row);
    });

    const nextIdx = state.floors_cleared.length;
    const nextFloor = DATA.tower_floors[nextIdx];
    document.getElementById('ov-floor').textContent = state.floors_cleared.length + ' cleared';
    document.getElementById('ov-cult-strength').textContent = nextFloor ? nextFloor.cult_strength : 'All floors cleared!';
    document.getElementById('ov-army-strength').textContent = Game.totalArmyStrength().toFixed(0);

    const attackBtn = document.getElementById('btn-attack');
    attackBtn.disabled = !nextFloor || Game.totalArmyStrength() < (nextFloor?.cult_strength ?? Infinity);
  }

  // ── Workers panel ──────────────────────────────────────────────────────────

  function refreshWorkers() {
    document.getElementById('w-total').textContent = Game.totalWorkers();
    document.getElementById('w-assigned').textContent = Game.totalAssigned();
    document.getElementById('w-idle').textContent = Game.idleWorkers();

    const list = document.getElementById('worker-list');
    list.innerHTML = '';

    DATA.workers.forEach(w => {
      if (!Game.workerIsVisible(w.id)) return;
      const count = Game.workerCount(w.id);
      const maxSlots = Game.maxWorkersFor(w);
      const idle = Game.idleWorkers();

      const row = document.createElement('div');
      row.className = 'worker-row';
      row.innerHTML = `
        <div class="wr-name">${w.name}</div>
        <div class="wr-output">${w.description}</div>
        <button class="btn-adj btn-minus" data-wid="${w.id}" ${count <= 0 ? 'disabled' : ''}>−</button>
        <span class="wr-count">${count}</span>
        <button class="btn-adj btn-plus" data-wid="${w.id}" ${idle <= 0 || count >= maxSlots ? 'disabled' : ''}>+</button>
      `;
      list.appendChild(row);
    });

    list.querySelectorAll('.btn-plus').forEach(b => {
      b.addEventListener('click', () => { Game.assignWorker(+b.dataset.wid, 1); refreshWorkers(); });
    });
    list.querySelectorAll('.btn-minus').forEach(b => {
      b.addEventListener('click', () => { Game.assignWorker(+b.dataset.wid, -1); refreshWorkers(); });
    });
  }

  // ── Workshop panel ─────────────────────────────────────────────────────────

  function refreshWorkshop() {
    const list = document.getElementById('structure-list');
    list.innerHTML = '';

    DATA.structures.forEach(s => {
      if (!Game.structureIsVisible(s.id)) return;
      if (s.max === 1 && Game.structCount(s.id) >= 1) return;

      const canBuild = Game.canBuild(s.id);
      const costStr = Object.entries(s.cost).map(([n, q]) => `${q} ${n}`).join(', ') || 'Free';

      const row = document.createElement('div');
      row.className = 'struct-row';
      row.innerHTML = `
        <div>
          <div class="sr-name">${s.name} <span class="sr-cat">${s.category}</span></div>
          <div class="sr-desc">${s.desc}</div>
        </div>
        <div class="sr-footer">
          <span class="sr-cost">Cost: ${costStr}</span>
          <span class="sr-count">Built: ${Game.structCount(s.id)}</span>
          <button class="btn-build" data-sid="${s.id}" ${canBuild ? '' : 'disabled'}>Build</button>
        </div>
      `;
      list.appendChild(row);
    });

    list.querySelectorAll('.btn-build').forEach(b => {
      b.addEventListener('click', () => { Game.build(+b.dataset.sid); refreshWorkshop(); });
    });
  }

  // ── Armory panel ───────────────────────────────────────────────────────────

  function refreshArmory() {
    const list = document.getElementById('army-list');
    list.innerHTML = '';

    DATA.army_units.forEach(u => {
      if (!Game.armyUnitIsVisible(u.id)) return;
      const count = Game.armyCount(u.id);
      const idle = Game.idleWorkers();
      const canEnlist = idle > 0 && (u.gear_res_id === null || Game.res(u.gear_res_id) > 0);

      const row = document.createElement('div');
      row.className = 'army-row';
      row.innerHTML = `
        <div class="ar-name">${u.name}</div>
        <div class="ar-info">STR ${u.strength} · ${u.type} · Weak: ${u.weak_to}<br>Gear: ${u.gear}</div>
        <button class="btn-adj btn-minus-a" data-uid="${u.id}" ${count <= 0 ? 'disabled' : ''}>−</button>
        <span class="ar-count">${count}</span>
        <button class="btn-adj btn-plus-a" data-uid="${u.id}" ${canEnlist ? '' : 'disabled'}>+</button>
      `;
      list.appendChild(row);
    });

    list.querySelectorAll('.btn-plus-a').forEach(b => {
      b.addEventListener('click', () => { Game.enlistUnit(+b.dataset.uid, 1); refreshArmory(); });
    });
    list.querySelectorAll('.btn-minus-a').forEach(b => {
      b.addEventListener('click', () => { Game.enlistUnit(+b.dataset.uid, -1); refreshArmory(); });
    });

    const sumEl = document.getElementById('army-summary');
    sumEl.innerHTML = '';
    let totalStr = 0;
    DATA.army_units.forEach(u => {
      const c = Game.armyCount(u.id);
      if (c === 0) return;
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = `<span>${u.name} ×${c}</span><span>STR ${u.strength * c}</span>`;
      sumEl.appendChild(row);
      totalStr += u.strength * c;
    });
    if (totalStr > 0) {
      const row = document.createElement('div');
      row.className = 'stat-row total-row';
      row.innerHTML = `<span><strong>Total Strength</strong></span><span><strong>${totalStr.toFixed(0)}</strong></span>`;
      sumEl.appendChild(row);
    } else {
      sumEl.innerHTML = '<p class="panel-hint">No soldiers enlisted yet.</p>';
    }
  }

  // ── Research panel ─────────────────────────────────────────────────────────

  function refreshResearch() {
    const state = Game.getState();
    const hasLibrary = Game.structCount(8) > 0;
    document.getElementById('research-locked-msg').style.display = hasLibrary ? 'none' : '';
    document.getElementById('res-pts').textContent = fmt(Game.res(7));

    const scholars = Game.workerCount(6);
    document.getElementById('res-rate').textContent = `${scholars * DATA.time.day_ticks}/day`;

    const list = document.getElementById('research-list');
    list.innerHTML = '';
    if (!hasLibrary) return;

    DATA.research.forEach(r => {
      if (!Game.researchIsVisible(r.id)) return;
      const done = state.research_done.includes(r.id);
      const canDo = !done && Game.res(7) >= r.cost;

      const row = document.createElement('div');
      row.className = 'research-row' + (done ? ' done' : '');
      row.innerHTML = `
        <div class="rr-name">${r.name}</div>
        <div class="rr-effect">${r.effect}</div>
        <div class="rr-cost">${done ? '' : r.cost + ' RP'}</div>
        ${done
          ? '<span class="badge-done">✔ Done</span>'
          : `<button class="btn-research" data-rid="${r.id}" ${canDo ? '' : 'disabled'}>Research</button>`
        }
      `;
      list.appendChild(row);
    });

    list.querySelectorAll('.btn-research').forEach(b => {
      b.addEventListener('click', () => { Game.doResearch(+b.dataset.rid); refreshResearch(); });
    });
  }

  // ── Castle panel ───────────────────────────────────────────────────────────

  function refreshCastle() {
    const state = Game.getState();
    const el = document.getElementById('castle-events');
    el.innerHTML = '';

    const faction = DATA.factions[state.faction_id];
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${faction.name} Kingdom</h3>
      <div class="stat-row"><span>Faction</span><span>${faction.name}</span></div>
      <div class="stat-row"><span>Advantage</span><span>${faction.advantage ?? '—'}</span></div>
      <div class="stat-row"><span>Disadvantage</span><span>${faction.disadvantage ?? '—'}</span></div>
      <div class="stat-row"><span>Gold</span><span>${fmt(Game.res(8))} GP</span></div>
      <div class="stat-row"><span>Floors Cleared</span><span>${state.floors_cleared.length} / ${DATA.tower_floors.length}</span></div>
    `;
    el.appendChild(card);
  }

  // ── Event log ──────────────────────────────────────────────────────────────

  function refreshLog() {
    const log = document.getElementById('event-log');
    log.innerHTML = '';
    Game.getEventLog().slice(0, 12).forEach(e => {
      const el = document.createElement('div');
      el.className = 'log-entry';
      el.textContent = `Day ${e.day}: ${e.msg}`;
      log.appendChild(el);
    });
  }

  // ── Lore popup ─────────────────────────────────────────────────────────────

  function showLore(lore_id) {
    const lore = DATA.lore.find(l => l.id === lore_id);
    if (!lore) return;
    document.querySelector('.lore-title').textContent = lore.title;
    document.getElementById('lore-text').textContent = lore.text;
    document.getElementById('lore-popup').classList.remove('hidden');
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-lore-close')?.addEventListener('click', () => {
      document.getElementById('lore-popup').classList.add('hidden');
    });
  });

  // ── Attack button ──────────────────────────────────────────────────────────

  function wireAttackButton() {
    const btn = document.getElementById('btn-attack');
    btn.addEventListener('click', () => {
      const result = Game.attackTower();
      document.getElementById('attack-result').textContent = result.msg;
      refresh();
    });
  }

  // ── Build game UI ──────────────────────────────────────────────────────────

  function buildGameUI() {
    buildTabs();
    wireAttackButton();
  }

  // ── Master refresh ─────────────────────────────────────────────────────────

  function refresh() {
    if (!Game.getState()) return;
    refreshResourceBar();
    refreshTime();
    refreshLog();

    switch (activeTab) {
      case 'overview':  refreshOverview();  break;
      case 'workers':   refreshWorkers();   break;
      case 'workshop':  refreshWorkshop();  break;
      case 'armory':    refreshArmory();    break;
      case 'research':  refreshResearch();  break;
      case 'castle':    refreshCastle();    break;
    }
  }

  // ── Utility ────────────────────────────────────────────────────────────────

  function fmt(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
    return Math.floor(n).toString();
  }

  function resumeGame() {
    buildGameUI();
    refresh();
  }

  return { buildFactionSelect, resumeGame, refresh, refreshLog, showLore };

})();
