// Settings for the raid-recap pipeline (scripts/raids/). Nothing here touches
// the SR-points side of the site.

export const GUILD = { name: "Moist", serverSlug: "firemaw", serverRegion: "eu" };

// Classic Era ("vanilla") lives on its own subdomain; the OAuth token is shared.
export const TOKEN_URL = "https://www.warcraftlogs.com/oauth/token";
export const API_URL = process.env.WCL_API_URL || "https://vanilla.warcraftlogs.com/api/v2/client";
export const SITE_URL = "https://vanilla.warcraftlogs.com";

// A "raid night" is the local calendar date the raid started on. Anything that
// starts before this hour counts as the previous night (late raids past midnight).
export const TIMEZONE = "Europe/Copenhagen";
export const NIGHT_CUTOFF_HOUR = 6;

// How far back a plain `npm run raids:fetch` looks for new reports.
export const DEFAULT_LOOKBACK_DAYS = 21;

// Casts worth noticing, by name (optionally limited to specific spell ids when a
// name is shared, e.g. the Shadow Protection potion vs the priest buff). These
// feed the "quiet work" side of recaps: who brought the sappers, who kept
// Sunders up, who landed every Tranquilizing Shot.
export const TRACKED_CASTS = [
  // Potions, runes and the like: used during the raid
  // (label: the item's name when the log only has the spell's, e.g. "Restore Mana")
  ...[
    ["Major Healthstone"], ["Dark Rune"], ["Demonic Rune"], ["Invulnerability", "Limited Invulnerability Potion"],
    ["Free Action", "Free Action Potion"], ["Living Free Action", "Living Action Potion"], ["Mighty Rage", "Mighty Rage Potion"],
    ["Greater Stoneshield", "Greater Stoneshield Potion"], ["Restore Energy", "Thistle Tea"], ["Speed", "Swiftness Potion"],
    ["Restoration", "Restorative Potion"], ["Purification", "Purification Potion"],
  ].map(([name, label]) => ({ name, label, category: "potion" })),
  { name: "Restore Mana", label: "Mana Potion", category: "potion", ids: [17531, 17530] },
  { name: "Healing Potion", category: "potion", ids: [17534, 17533] },
  { name: "Frost Protection", label: "Frost Protection Potion", category: "potion", ids: [17544] },
  { name: "Fire Protection", label: "Fire Protection Potion", category: "potion", ids: [17543] },
  { name: "Nature Protection", label: "Nature Protection Potion", category: "potion", ids: [17546, 7254] },
  { name: "Shadow Protection", label: "Shadow Protection Potion", category: "potion", ids: [17548] },
  { name: "Arcane Protection", label: "Arcane Protection Potion", category: "potion", ids: [17549] },
  // Engineering explosives
  ...[
    "Goblin Sapper Charge", "Dense Dynamite", "Ez-Thro Dynamite", "Ez-Thro Dynamite II", "Thorium Grenade",
    "Iron Grenade", "Hi-Explosive Bomb", "Stratholme Holy Water",
  ].map((name) => ({ name, category: "explosive" })),
  // Helping others / saving the pull
  ...[
    "Tranquilizing Shot", "Fear Ward", "Power Infusion", "Innervate", "Rebirth", "Soulstone Resurrection",
    "Blessing of Sacrifice", "Hand of Protection", "Blessing of Protection", "Lay on Hands",
    "Divine Intervention", "Challenging Shout", "Shackle Undead", "Mind Control", "Intimidating Shout",
  ].map((name) => ({ name, category: "utility" })),
  // Raid debuffs that make everyone else hit harder
  ...[
    "Sunder Armor", "Expose Armor", "Faerie Fire", "Curse of Recklessness", "Curse of the Elements",
    "Curse of Shadow", "Demoralizing Shout", "Hunter's Mark", "Thunder Clap",
  ].map((name) => ({ name, category: "debuff" })),
];

// Consumable buffs people bring, seen in each raider's buff snapshot at a boss
// pull (full combat log only). Name -> group.
export const CONSUME_BUFFS = {
  flask: ["Flask of the Titans", "Supreme Power", "Distilled Wisdom", "Chromatic Resistance", "Flask of Petrification"],
  elixir: [
    "Elixir of the Mongoose", "Elixir of the Giants", "Greater Arcane Elixir", "Greater Firepower", "Mageblood Elixir",
    "Elixir of Fortitude", "Greater Armor", "Mighty Troll's Blood Elixir", "Greater Agility", "Shadow Power", "Frost Power",
    "Greater Intellect", "Elixir of Brute Force", "Gift of Arthas", "Juju Power", "Juju Might", "Juju Flurry", "Juju Ember",
    "Juju Chill", "Juju Guile", "Juju Escape", "Spirit of Zanza", "Swiftness of Zanza", "Sheen of Zanza",
    "Strike of the Scorpok", "Rage of Ages", "Spiritual Domination", "Infallible Mind", "Spirit of the Boar",
    "Winterfall Firewater", "Arcane Elixir", "Elixir of Greater Firepower",
  ],
  food: [
    "Well Fed", "Mana Regeneration", "Increased Agility", "Increased Stamina", "Increased Intellect", "Increased Strength",
    "Blessed Sunfruit", "Blessed Sunfruit Juice", "Gordok Green Grog", "Rumsey Rum Black Label", "Kreeg's Stout Beatdown",
    "Rumsey Rum Dark",
  ],
};
