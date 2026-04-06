// ─────────────────────────────────────────────────────────────────────────────
// data.js – Kingdom's Tower game data
// Source: GDD + Kingdoms_Tower spreadsheet
// Add rows to expand the game; the engine reads these at runtime.
// ─────────────────────────────────────────────────────────────────────────────

const DATA = {

  // ── Tabs ─────────────────────────────────────────────────────────────────
  tabs: [
    { key: "overview",  label: "Overview"  },
    { key: "workers",   label: "Workers"   },
    { key: "workshop",  label: "Workshop"  },
    { key: "armory",    label: "Armory"    },
    { key: "research",  label: "Research"  },
    { key: "castle",    label: "Castle"    }
  ],

  // ── Time ──────────────────────────────────────────────────────────────────
  time: {
    tick_real_ms:  1000,
    day_ticks:     20,
    season_ticks:  600,
    year_ticks:    2400,
    seasons: [
      { id: 0, name: "Spring", modifiers: { warm: 0.65,  average: 0.50,  cold:  0.35 } },
      { id: 1, name: "Summer", modifiers: { warm: 0.15,  average: 0.00,  cold: -0.15 } },
      { id: 2, name: "Autumn", modifiers: { warm: 0.15,  average: 0.00,  cold: -0.15 } },
      { id: 3, name: "Winter", modifiers: { warm: -0.90, average: -0.75, cold: -0.60 } }
    ]
  },

  // ── Factions ──────────────────────────────────────────────────────────────
  factions: [
    { id: 0, name: "Human",  advantage: null,                       disadvantage: null,
      modifiers: {} },
    { id: 1, name: "Elf",    advantage: "+10% Food production",    disadvantage: "-15% Army strength",
      modifiers: { food_production: 1.10, army_strength: 0.85 } },
    { id: 2, name: "Orc",    advantage: "+10% Army strength",      disadvantage: "Research costs +15%",
      modifiers: { army_strength: 1.10, research_cost: 1.15 } },
    { id: 3, name: "Undead", advantage: "No food consumption",     disadvantage: "Cannot trade with others",
      modifiers: { food_consumption: 0.0 } },
    { id: 4, name: "Dwarf",  advantage: "Structures cost -10%",   disadvantage: "Farming -15% food",
      modifiers: { structure_cost: 0.90, food_production: 0.85 } }
  ],

  // ── Resources ─────────────────────────────────────────────────────────────
  resources: [
    { id: 0, name: "Workers",       icon: "👷", starting: 5,  description: "Population doing work." },
    { id: 1, name: "Food",          icon: "🌾", starting: 50, description: "Consumed by all workers and soldiers each tick." },
    { id: 2, name: "Wood",          icon: "🪵", starting: 0,  description: "Basic construction material." },
    { id: 3, name: "Stone",         icon: "🪨", starting: 0,  description: "Used for heavier structures." },
    { id: 4, name: "Ore",           icon: "⛏",  starting: 0,  description: "Refined into equipment." },
    { id: 5, name: "Shoddy Swords", icon: "⚔",  starting: 0,  description: "Basic weaponry for Recruits." },
    { id: 6, name: "Recruits",      icon: "🛡",  starting: 0,  description: "Basic soldiers." },
    { id: 7, name: "Research",      icon: "📜", starting: 0,  description: "Accumulated research points." },
    { id: 8, name: "Gold (GP)",     icon: "💰", starting: 0,  description: "Currency from tower and trade." }
  ],

  // ── Worker types ──────────────────────────────────────────────────────────
  workers: [
    { id: 0, name: "Idle Worker",  workplace_struct_id: null, unlocked_by_struct: null,
      food_per_tick: 1, produces: null,
      description: "Unassigned. No output." },
    { id: 1, name: "Gatherer",     workplace_struct_id: 0,    unlocked_by_struct: 0,
      food_per_tick: 2, produces: { resource_id: 1, qty: 0},
      description: "Forages the open Field. +3 Food/tick" },
    { id: 2, name: "Farmer",       workplace_struct_id: 1,    unlocked_by_struct: 1,
      food_per_tick: 2, produces: { resource_id: 1, qty: 0 },
      description: "Harvests a Farm. +5 Food/tick" },
    { id: 3, name: "Lumberjack",   workplace_struct_id: 2,    unlocked_by_struct: 2,
      food_per_tick: 3, produces: { resource_id: 2, qty: 0 },
      description: "Cuts trees at a Woodcutter. +2 Wood/tick" },
    { id: 4, name: "Quarryman",        workplace_struct_id: 4,    unlocked_by_struct: 4,
      food_per_tick: 4, produces: { resource_id: 3, qty: 0 },
      description: "Mines stone at a Quarry. +2 Stone/tick" },
    { id: 5, name: "Miner",        workplace_struct_id: 5,    unlocked_by_struct: 5,
      food_per_tick: 4, produces: { resource_id: 4, qty: 0 },
      description: "Mines ore at a Mine." },
    { id: 6, name: "Smith",        workplace_struct_id: 7,    unlocked_by_struct: 7,
      food_per_tick: 3, produces: { resource_id: 5, qty: 0 },
      description: "Forges swords at the Armory. +0.25 Shoddy Sword/tick" },
    { id: 7, name: "Scholar",      workplace_struct_id: 8,    unlocked_by_struct: 8,
      food_per_tick: 2, produces: { resource_id: 7, qty: 0 },
      description: "Studies in the Library. +0.1 Research/tick" }
  ],

  // ── Structures ────────────────────────────────────────────────────────────
  structures: [
    {
      id: 0, name: "Field", category: "Food",
      unlocked_by_struct: null, unlocked_by_floor: null,
      produces_res: 1, qty_per_tick: 3, max_workers: Infinity,
      cost: {}, starting: 1, max: 1,
      desc: "An open field of wild plants. Gatherers can forage here."
    },
    {
      id: 1, name: "Farm", category: "Food",
      unlocked_by_struct: 0, unlocked_by_floor: null,
      produces_res: 1, qty_per_tick: 5, max_workers: 2,
      cost: { Food: 25 }, starting: 0, max: null,
      desc: "A farm field. 2 Farmers max per farm. +5 Food/tick each worker."
    },
    {
      id: 2, name: "Woodcutter", category: "Lumber",
      unlocked_by_struct: 1, unlocked_by_floor: null,
      produces_res: 2, qty_per_tick: 2, max_workers: 2,
      cost: { Food: 50 }, starting: 0, max: null,
      desc: "A cabin by the woods. 2 Lumberjacks max. +2 Wood/tick each worker."
    },
    {
      id: 3, name: "Cabin", category: "Housing",
      unlocked_by_struct: 2, unlocked_by_floor: null,
      produces_res: null, qty_per_tick: null, max_workers: null,
      cost: { Food: 25, Wood: 15 }, starting: 0, max: null,
      population_bonus: 3,
      desc: "Increases population cap by 3. Costs 50 Food per new worker per day."
    },
    {
      id: 4, name: "Quarry", category: "Mining",
      unlocked_by_struct: 3, unlocked_by_floor: null,
      produces_res: 3, qty_per_tick: 1, max_workers: 2,
      cost: { Food: 25, Wood: 25 }, starting: 0, max: null,
      desc: "A basic quarry. 2 Miners max. +1 Stone/tick each worker."
    },
    {
      id: 5, name: "Mine", category: "Mining",
      unlocked_by_struct: 4, unlocked_by_floor: null,
      produces_res: 4, qty_per_tick: 0.2, max_workers: 2,
      cost: { Food: 50, Wood: 25, Stone: 15 }, starting: 0, max: null,
      desc: "A basic mine. 2 Miners max. +0.2 Ore/tick each worker."
    },
    {
      id: 6, name: "Barracks", category: "Military",
      unlocked_by_struct: 5, unlocked_by_floor: null,
      produces_res: 6, qty_per_tick: null, max_recruits: 5,
      cost: { Ore: 5 }, starting: 0, max: null,
      desc: "Train up to 5 Recruits per Barracks. Each requires 1 Shoddy Sword."
    },
    {
      id: 7, name: "Armory", category: "Military",
      unlocked_by_struct: 6, unlocked_by_floor: null,
      produces_res: 5, qty_per_tick: 0.2, max_workers: null,
      cost: { Stone: 25, Wood: 15, Food: 50, Ore: 10 }, starting: 0, max: null,
      equipment_cap: 10,
      desc: "Stores up to 10 weapons. Smiths work here to forge Shoddy Swords at a rate of 0.2/tick each worker."
    },
    {
      id: 8, name: "Library", category: "Research",
      unlocked_by_struct: null, unlocked_by_floor: 0,
      produces_res: 7, qty_per_tick: .1, max_workers: 3,
      cost: { Wood: 50, Food: 100, Stone: 50, Ore: 25 }, starting: 0, max: null,
      desc: "Scholars study here. +.1 Research/tick per Scholar."
    }
  ],

  // ── Army units ────────────────────────────────────────────────────────────
  army_units: [
    { id: 0, name: "Recruit",  gear: "Shoddy Swords", gear_res_id: 5, strength: 1, type: "Melee",   weak_to: "Ranged",  unlocked_by_struct: 6 },
    { id: 1, name: "Guard",    gear: "Fine Sword",     gear_res_id: null, strength: 2, type: "Melee",  weak_to: "Ranged",  unlocked_by_struct: null },
    { id: 2, name: "Yeoman",   gear: "Simple Bow",     gear_res_id: null, strength: 4, type: "Ranged", weak_to: "Mounted", unlocked_by_struct: null },
    { id: 3, name: "Mountie",  gear: "Mule",           gear_res_id: null, strength: 5, type: "Mounted",weak_to: "Melee",  unlocked_by_struct: null }
  ],

  // ── Tower floors ──────────────────────────────────────────────────────────
  tower_floors: [
    { id: 0, floor: 1,  cult_strength: 10,  unlocked_workshop: [8], unlocked_research: null,      reward_gp: 10, lore_flag: 0 },
    { id: 1, floor: 2,  cult_strength: 20,  unlocked_workshop: null, unlocked_research: [0,1,2,3], reward_gp: 15, lore_flag: null },
    { id: 2, floor: 3,  cult_strength: 30,  unlocked_workshop: null, unlocked_research: null,      reward_gp: 20, lore_flag: null },
    { id: 3, floor: 4,  cult_strength: 40,  unlocked_workshop: null, unlocked_research: null,      reward_gp: 25, lore_flag: null },
    { id: 4, floor: 5,  cult_strength: 50,  unlocked_workshop: null, unlocked_research: null,      reward_gp: 30, lore_flag: null },
    { id: 5, floor: 6,  cult_strength: 60,  unlocked_workshop: null, unlocked_research: null,      reward_gp: 35, lore_flag: null },
    { id: 6, floor: 7,  cult_strength: 70,  unlocked_workshop: null, unlocked_research: null,      reward_gp: 40, lore_flag: null },
    { id: 7, floor: 8,  cult_strength: 80,  unlocked_workshop: null, unlocked_research: null,      reward_gp: 45, lore_flag: null },
    { id: 8, floor: 9,  cult_strength: 90,  unlocked_workshop: null, unlocked_research: null,      reward_gp: 50, lore_flag: null },
    { id: 9, floor: 10, cult_strength: 100, unlocked_workshop: null, unlocked_research: null,      reward_gp: 55, lore_flag: 1 }
  ],

  // ── Lore ──────────────────────────────────────────────────────────────────
  lore: [
    { id: 0, title: "Floor 1 — Scout's Report",
      text: "Strange. Towers aren't known for being populated by settled groups. The mysterious group at the end of the first floor were dressed in crimson robes, and scouts report that they were chanting in a candlelit section of the floor in a room thick with foul-smelling smoke. They attacked as soon as our recruits interacted with them. Who could they be?" },
    { id: 1, title: "Floor 10 — The Behemoth",
      text: "Floor after floor, the red-cloaked mysterious folk come after our soldiers at the first sight of them. But this floor, things were different. The walls were dripping in some organic matter, and rather than their typical chanting and smoky rituals, a single behemoth stood in silence, as if awaiting our soldiers. After dispatching the foe, the organic matter sloughed off the walls and dripped from the ceiling. Beneath the masses were an iridescent blue crystal. We have taken a sample to our researchers." }
  ],

  // ── Research ──────────────────────────────────────────────────────────────
  research: [
    { id: 0, name: "Irrigation",    cost: 20, effect: "Food +10% production.",  modifier_key: "food_production",  modifier_val: 1.10, unlocked_by_floor: 1 },
    { id: 1, name: "Refined Axes",  cost: 20, effect: "Wood +10% production.",  modifier_key: "wood_production",  modifier_val: 1.10, unlocked_by_floor: 1 },
    { id: 2, name: "Sharper Picks", cost: 20, effect: "Stone +10% production.", modifier_key: "stone_production", modifier_val: 1.10, unlocked_by_floor: 1 },
    { id: 3, name: "Surveying",     cost: 20, effect: "Ore +10% production.",   modifier_key: "ore_production",   modifier_val: 1.10, unlocked_by_floor: 1 }
  ],

  // ── Starting game state ───────────────────────────────────────────────────
  default_state: {
    kingdom_name: "Kingdom",
    faction_id: 0,
    tick: 0,
    season_temp: "average",
    resources: {},
    workers_assigned: {},
    structures_built: {},
    army: {},
    floors_cleared: [],
    research_done: [],
    research_unlocked: [],
    pop_cap: 5,
    lore_seen: []
  }
};
