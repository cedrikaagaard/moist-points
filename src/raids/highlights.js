// Recognition, computed - no generated text. Each rule looks at a night's
// numbers and, when something stands out, returns a card:
//   { key, title, icon, player, class, value, unit, detail }
// Mostly utility and teamwork (kicks, battle rezzes, keeping debuffs up),
// each with a threshold so a card only appears when it means something.
import { COMBAT_REZ } from "./aggregate.js";
import { MECHANICS } from "./mechanics.js";

const top = (byPlayer) => Object.entries(byPlayer || {}).sort((a, b) => b[1] - a[1]);
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Raid debuffs: one card each for whoever kept it up, when they really did.
const DEBUFFS = [
  { name: "Sunder Armor", title: "Sunder duty", min: 60 },
  { name: "Curse of Recklessness", title: "Curse of Recklessness", min: 40 },
  { name: "Curse of the Elements", title: "Curse of the Elements", min: 40 },
  { name: "Curse of Shadow", title: "Curse of Shadow", min: 40 },
  { name: "Faerie Fire", title: "Faerie Fire", min: 40 },
  { name: "Expose Armor", title: "Exposed armor", min: 20 },
  { name: "Demoralizing Shout", title: "Demo Shout", min: 40 },
];

const HELPERS = [
  { name: "Tranquilizing Shot", title: "Tranq Shot", min: 4 },
  { name: "Fear Ward", title: "Fear Ward", min: 5 },
  { name: "Power Infusion", title: "Power Infusion", min: 5 },
  { name: "Innervate", title: "Innervate", min: 3 },
  { name: "Shackle Undead", title: "Shackles", min: 5 },
  { name: "Blessing of Sacrifice", title: "Sacrificed", min: 2 },
  { name: "Lay on Hands", title: "Lay on Hands", min: 2 },
];

export function nightHighlights(n, classOf) {
  const cls = (name) => classOf.get(name) || null;
  const cards = [];
  const push = (c) => cards.push({ class: cls(c.player), ...c });

  // Decursing / dispelling.
  const disp = n.dispels?.[0];
  if (disp && disp.total >= 10) {
    const [what, count] = top(disp.what)[0];
    const total = n.dispels.reduce((t, d) => t + d.total, 0);
    push({
      key: "dispels", title: "Cleanser", icon: what, player: disp.player, value: disp.total, unit: "dispels",
      detail: `${count}× ${what} · ${Math.round((disp.total / total) * 100)}% of the raid's`,
    });
  }

  // Interrupts.
  const kick = n.interrupts?.[0];
  if (kick && kick.total >= 3) {
    const [what, count] = top(kick.what)[0];
    push({ key: "kicks", title: "Interrupter", icon: "Kick", player: kick.player, value: kick.total, unit: "interrupts", detail: `${count}× ${what}` });
  }

  // Battle rezzes - every one is worth a card.
  for (const r of (n.rezzes || []).filter((r) => COMBAT_REZ.has(r.ability) && r.by)) {
    push({
      key: `rez-${r.at}`, title: "Battle rez", icon: r.ability, player: r.by, value: r.target, unit: "",
      detail: `${r.ability}${r.boss ? ` on ${r.boss}` : ""}`,
    });
  }

  // Raid debuffs.
  for (const d of DEBUFFS) {
    const [name, count] = top(n.casts?.[d.name]?.by)[0] || [];
    if (name && count >= d.min) push({ key: d.name, title: d.title, icon: d.name, player: name, value: count, unit: "casts", detail: "raid debuff, kept on the target" });
  }

  // Helping hands.
  for (const h of HELPERS) {
    const [name, count] = top(n.casts?.[h.name]?.by)[0] || [];
    if (name && count >= h.min) push({ key: h.name, title: h.title, icon: h.name, player: name, value: count, unit: "casts", detail: h.title === h.name ? null : h.name });
  }

  // Engineering.
  const sappers = top(n.casts?.["Goblin Sapper Charge"]?.by);
  if (sappers.length && sappers[0][1] >= 5) {
    const total = sappers.reduce((t, [, c]) => t + c, 0);
    push({
      key: "sappers", title: "Demolitions", icon: "Goblin Sapper Charge", player: sappers[0][0], value: sappers[0][1], unit: "sappers",
      detail: `of ${total} sappers from ${plural(sappers.length, "engineer")}`,
    });
  }

  // Came prepared: most consumables used.
  const consumed = {};
  for (const c of Object.values(n.casts || {})) {
    if (c.category !== "consumable") continue;
    for (const [name, count] of Object.entries(c.by)) consumed[name] = (consumed[name] || 0) + count;
  }
  const [chef, used] = top(consumed)[0] || [];
  if (chef && used >= 10) {
    push({ key: "consumes", title: "Came prepared", icon: "Restore Mana", player: chef, value: used, unit: "consumables", detail: "potions, runes, explosives & co" });
  }

  return cards;
}

// The full-clear-without-dying club.
export function deathless(n) {
  const dead = new Set(n.deaths.map((d) => d.player));
  return n.raiders.filter((r) => !dead.has(r.name));
}

// Boss kills faster than every earlier logged kill.
export function records(n, allTime) {
  const out = [];
  for (const b of n.bosses) {
    if (b.killTimeSec == null) continue;
    const before = allTime.bosses.find((x) => x.name === b.name)?.history.filter((h) => h.night < n.night) || [];
    if (before.length < 2) continue; // too little history to call it a record
    const prev = Math.min(...before.map((h) => h.sec));
    // A real improvement, not a second of noise (or a fixed-timer fight like Gothik).
    if (b.killTimeSec <= prev - 5 && b.killTimeSec <= prev * 0.97) out.push({ boss: b, kind: "record", prev });
  }
  return out;
}

// Deaths dealt by a raid member (mind control, a friendly Whirlwind...).
// Some boss mechanics get credited to a random player in the logs (Ragnaros'
// Lava Burst, Onyxia/Firesworn Eruption...), so only player-ish killing blows
// count: melee, or an ability that isn't one of the night's boss mechanics.
const MISCREDITED = new Set(["Lava Burst", "Eruption", "Fire", "Conflagration", "Elemental Fire"]);
export function friendlyFire(n, classOf) {
  const bossAbilities = new Set(n.bosses.flatMap((b) => (MECHANICS[b.encounterId] || []).flatMap((m) => m.abilities)));
  return n.deaths.filter(
    (d) =>
      d.killer &&
      d.killer.name !== d.player &&
      classOf.has(d.killer.name) &&
      !MISCREDITED.has(d.killingBlow) &&
      !bossAbilities.has(d.killingBlow)
  );
}
