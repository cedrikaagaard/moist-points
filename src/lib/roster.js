// Who's who across the whole site: class, spec and role per character, taken
// from the raid logs (src/raids/data/roster.json, written by `npm run raids:fetch`).
// Lets SR pages show class icons/colours too. Lookups ignore case.
import roster from "../raids/data/roster.json";

const byLower = new Map(Object.entries(roster).map(([name, r]) => [name.toLowerCase(), { name, ...r }]));

// Everyone in the logs, most raid nights first: [{ name, class, spec, role, nights }].
export const allRaiders = () => [...byLower.values()].sort((a, b) => b.nights - a.nights);

export const rosterOf = (name) => (name ? byLower.get(name.toLowerCase()) || null : null);

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
// Warcraft Logs' class/spec icons ("Warrior" or "Warrior-Fury").
export const specIcon = (specOrClass) => `https://assets.rpglogs.com/img/warcraft/icons/${specOrClass}.jpg`;
