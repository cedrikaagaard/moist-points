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
  // Consumables
  ...[
    "Goblin Sapper Charge", "Dense Dynamite", "Ez-Thro Dynamite", "Thorium Grenade", "Iron Grenade",
    "Hi-Explosive Bomb", "Major Healthstone", "Dark Rune", "Demonic Rune", "Invulnerability",
    "Free Action", "Mighty Rage", "Greater Stoneshield", "Stratholme Holy Water", "Restore Energy",
    "Speed",
  ].map((name) => ({ name, category: "consumable" })),
  { name: "Restore Mana", category: "consumable", ids: [17531, 17530] }, // mana potions
  { name: "Healing Potion", category: "consumable", ids: [17534, 17533] },
  { name: "Frost Protection", category: "consumable", ids: [17544] },
  { name: "Fire Protection", category: "consumable", ids: [17543] },
  { name: "Nature Protection", category: "consumable", ids: [17546, 7254] },
  { name: "Shadow Protection", category: "consumable", ids: [17548] },
  { name: "Arcane Protection", category: "consumable", ids: [17549] },
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
