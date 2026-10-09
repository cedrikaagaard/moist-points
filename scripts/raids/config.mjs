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
    ["Greater Stoneshield", "Greater Stoneshield Potion"], ["Restore Energy", "Thistle Tea"],
    ["Restoration", "Restorative Potion"], ["Rejuvenation Potion", "Major Rejuvenation Potion"],
    ["Greater Healthstone"],
  ].map(([name, label]) => ({ name, label, category: "potion" })),
  // Same name, other spells: limited to the potions' spell ids (from the guild's own logs).
  { name: "Restore Mana", label: "Mana Potion", category: "potion", ids: [17531, 17530, 11903] },
  { name: "Healing Potion", category: "potion", ids: [17534, 4042] },
  { name: "Speed", label: "Swiftness Potion", category: "potion", ids: [2379] },
  { name: "Great Rage", label: "Great Rage Potion", category: "potion", ids: [6613] },
  { name: "Rage", label: "Rage Potion", category: "potion", ids: [6612] },
  { name: "Frost Protection", label: "Frost Protection Potion", category: "potion", ids: [17544, 7239] },
  { name: "Fire Protection", label: "Fire Protection Potion", category: "potion", ids: [17543] },
  { name: "Nature Protection", label: "Nature Protection Potion", category: "potion", ids: [17546, 7254] },
  { name: "Shadow Protection", label: "Shadow Protection Potion", category: "potion", ids: [17548, 7242] }, // not the priest buff
  { name: "Arcane Protection", label: "Arcane Protection Potion", category: "potion", ids: [17549] },
  // Engineering explosives
  ...[
    "Goblin Sapper Charge", "Dense Dynamite", "Solid Dynamite", "Ez-Thro Dynamite", "Thorium Grenade",
    "Iron Grenade", "Mithril Frag Bomb", "Hi-Explosive Bomb", "Stratholme Holy Water",
  ].map((name) => ({ name, category: "explosive" })),
  // Helping others / saving the pull
  ...[
    "Tranquilizing Shot", "Fear Ward", "Power Infusion", "Innervate", "Rebirth", "Soulstone Resurrection",
    "Blessing of Sacrifice", "Lay on Hands", "Blessing of Freedom",
    "Divine Intervention", "Challenging Shout", "Shackle Undead", "Mind Control", "Intimidating Shout",
  ].map((name) => ({ name, category: "utility" })),
  // Warcraft Logs shows these under a later expansion's name.
  { name: "Hand of Protection", label: "Blessing of Protection", category: "utility" },
  // Raid debuffs that make everyone else hit harder
  ...[
    "Sunder Armor", "Expose Armor", "Faerie Fire", "Faerie Fire (Feral)", "Curse of Recklessness", "Curse of the Elements",
    "Curse of Shadow", "Demoralizing Shout", "Hunter's Mark", "Thunder Clap",
  ].map((name) => ({ name, category: "debuff" })),
];

// Consumable buffs people bring, seen in each raider's buff snapshot at a boss
// pull (full combat log only). Name -> group.
export const CONSUME_BUFFS = {
  flask: ["Flask of the Titans", "Supreme Power", "Distilled Wisdom", "Chromatic Resistance", "Petrification"],
  elixir: [
    "Elixir of the Mongoose", "Elixir of the Giants", "Greater Agility", "Elixir of Brute Force", "Greater Arcane Elixir",
    "Greater Firepower", "Shadow Power", "Frost Power", "Greater Intellect", "Elixir of the Sages", "Arcane Elixir",
    "Mageblood Elixir", "Elixir of Fortitude", "Greater Armor", "Mighty Troll's Blood Elixir", "Gift of Arthas",
  ],
  juju: ["Juju Power", "Juju Might", "Juju Flurry", "Juju Ember", "Juju Chill", "Juju Guile", "Juju Escape"],
  // Zanza and the Blasted Lands buffs share one slot.
  zanza: ["Spirit of Zanza", "Swiftness of Zanza", "Sheen of Zanza", "Rage of Ages", "Strike of the Scorpok", "Spirit of Boar", "Infallible Mind", "Spiritual Domination"],
  food: ["Well Fed", "Mana Regeneration", "Increased Agility", "Increased Stamina", "Increased Intellect", "Blessed Sunfruit", "Blessed Sunfruit Juice"],
  drink: ["Gordok Green Grog", "Rumsey Rum Black Label", "Kreeg's Stout Beatdown", "Winterfall Firewater"],
};
