// Images and colours for the raid pages. Art is hot-linked from Warcraft Logs'
// asset CDN (the same images their site uses), so nothing is bundled here.

const CDN = "https://assets.rpglogs.com/img/warcraft";

export const zoneImg = (zoneId) => `${CDN}/zones/zone-${zoneId}.png`;
export const bossImg = (encounterId) => `${CDN}/bosses/${encounterId}-icon.jpg`;
// "Mage-Fire" (spec) or "Mage" (class) - both exist on the CDN.
export const specImg = (specOrClass) => `${CDN}/icons/${specOrClass}.jpg`;
export const spellImg = (file) => `${CDN}/abilities/${file}`;
export const FALLBACK_ICON = `${CDN}/abilities/inv_misc_questionmark.jpg`;

// Short names + accent per raid zone (Warcraft Logs Classic Era zone ids).
export const ZONES = {
  2000: { short: "MC", name: "Molten Core", color: "var(--raid-mc)" },
  2001: { short: "Ony", name: "Onyxia", color: "#b0563c" },
  2002: { short: "BWL", name: "Blackwing Lair", color: "var(--raid-bwl)" },
  2003: { short: "ZG", name: "Zul'Gurub", color: "#3fa36b" },
  2005: { short: "AQ40", name: "Temple of Ahn'Qiraj", color: "var(--raid-aq40)" },
  2006: { short: "Naxx", name: "Naxxramas", color: "var(--raid-naxx)" },
};
export const zoneOf = (id) => ZONES[id] || { short: "?", name: "Unknown", color: "var(--muted)" };

// The classic in-game class colours - what every WoW player reads as identity.
// Always shown next to the class icon and name, never as the only cue.
export const CLASS_COLORS = {
  Druid: "#ff7c0a",
  Hunter: "#aad372",
  Mage: "#3fc7eb",
  Paladin: "#f48cba",
  Priest: "#ffffff",
  Rogue: "#fff468",
  Shaman: "#0070dd",
  Warlock: "#8788ee",
  Warrior: "#c69b6d",
};
export const classColor = (cls) => CLASS_COLORS[cls] || "var(--text)";

// Icons for the tracked casts, used until the data carries its own (newer
// fetches store the icon Warcraft Logs reports for each spell).
export const SPELL_ICONS = {
  "Goblin Sapper Charge": "spell_fire_selfdestruct.jpg",
  "Dense Dynamite": "inv_misc_bomb_06.jpg",
  "Ez-Thro Dynamite": "inv_misc_bomb_05.jpg",
  "Thorium Grenade": "inv_misc_bomb_08.jpg",
  "Iron Grenade": "inv_misc_bomb_08.jpg",
  "Hi-Explosive Bomb": "inv_misc_bomb_07.jpg",
  "Major Healthstone": "inv_stone_04.jpg",
  "Dark Rune": "spell_shadow_sealofkings.jpg",
  "Demonic Rune": "inv_misc_rune_04.jpg",
  Invulnerability: "inv_potion_62.jpg",
  "Free Action": "inv_potion_04.jpg",
  "Mighty Rage": "inv_potion_41.jpg",
  "Greater Stoneshield": "inv_potion_69.jpg",
  "Stratholme Holy Water": "inv_potion_75.jpg",
  "Restore Energy": "inv_drink_milk_05.jpg",
  Speed: "inv_potion_95.jpg",
  "Restore Mana": "inv_potion_76.jpg",
  "Healing Potion": "inv_potion_54.jpg",
  "Frost Protection": "inv_potion_20.jpg",
  "Fire Protection": "inv_potion_24.jpg",
  "Nature Protection": "inv_potion_22.jpg",
  "Shadow Protection": "inv_potion_23.jpg",
  "Arcane Protection": "inv_potion_83.jpg",
  "Tranquilizing Shot": "spell_nature_drowsy.jpg",
  "Fear Ward": "spell_holy_excorcism.jpg",
  "Power Infusion": "spell_holy_powerinfusion.jpg",
  Innervate: "spell_nature_lightning.jpg",
  Rebirth: "spell_nature_reincarnation.jpg",
  "Soulstone Resurrection": "spell_shadow_soulgem.jpg",
  Resurrection: "spell_holy_resurrection.jpg",
  Redemption: "spell_holy_resurrection.jpg",
  "Blessing of Sacrifice": "spell_holy_sealofsacrifice.jpg",
  "Hand of Protection": "spell_holy_sealofprotection.jpg",
  "Blessing of Protection": "spell_holy_sealofprotection.jpg",
  "Lay on Hands": "spell_holy_layonhands.jpg",
  "Divine Intervention": "spell_nature_timestop.jpg",
  "Challenging Shout": "ability_bullrush.jpg",
  "Shackle Undead": "spell_nature_slow.jpg",
  "Mind Control": "spell_shadow_shadowworddominate.jpg",
  "Intimidating Shout": "ability_golemthunderclap.jpg",
  "Sunder Armor": "ability_warrior_sunder.jpg",
  "Expose Armor": "ability_warrior_riposte.jpg",
  "Faerie Fire": "spell_nature_faeriefire.jpg",
  "Curse of Recklessness": "spell_shadow_unholystrength.jpg",
  "Curse of the Elements": "spell_shadow_chilltouch.jpg",
  "Curse of Shadow": "spell_shadow_curseofachimonde.jpg",
  "Demoralizing Shout": "ability_warrior_warcry.jpg",
  "Hunter's Mark": "ability_hunter_snipershot.jpg",
  "Thunder Clap": "spell_nature_thunderclap.jpg",
  Melee: "inv_axe_02.jpg",
  Hearthstone: "inv_misc_rune_01.jpg",
  Decurse: "spell_holy_removecurse.jpg",
  Kick: "ability_kick.jpg",
};

export function iconFor(name, icons) {
  const file = icons?.[name] || SPELL_ICONS[name];
  return file ? spellImg(file) : FALLBACK_ICON;
}

// 4:37, or 1:45:01 past the hour.
export function mmss(s) {
  if (s == null) return "-";
  s = Math.round(s);
  const pad = (v) => String(v).padStart(2, "0");
  return s >= 3600 ? `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}` : `${Math.floor(s / 60)}:${pad(s % 60)}`;
}
export const hm = (min) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;
export function fmtDate(night, opts = { weekday: "short", day: "numeric", month: "short" }) {
  return new Date(`${night}T12:00:00`).toLocaleDateString("en-GB", opts);
}
