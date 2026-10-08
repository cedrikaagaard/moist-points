// The "facts pack" for one raid night: everything an analysis may say, with the
// numbers behind it. The /raid-logs skill writes the magic LLM analysis from
// this (src/raids/data/analysis/<night>.json) - never from memory or vibes.
//
//   npm run raids:facts -- --night 2026-09-23
//
// Reads the night file, the all-time summary/boss files, and for per-pull detail
// the full combat log in data/events/ (older nights: the raw archive in data/wcl/).
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { MECHANICS } from "../../src/raids/mechanics.js";
import { hasEvents, deriveLog } from "./derive.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATA = path.join(ROOT, "src/raids/data");
const RAW = path.join(ROOT, "data/wcl");
const night = process.argv[process.argv.indexOf("--night") + 1];
if (!process.argv.includes("--night") || !night) {
  console.error("usage: npm run raids:facts -- --night YYYY-MM-DD");
  process.exit(1);
}

const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const n = read(path.join(DATA, "nights", `${night}.json`));
const summary = read(path.join(DATA, "summary.json"));
const bossFile = (id) => {
  const p = path.join(DATA, "bosses", `${id}.json`);
  return fs.existsSync(p) ? read(p) : null;
};
const readRaw = (rel) => {
  const p = path.join(RAW, rel);
  return fs.existsSync(p) ? JSON.parse(zlib.gunzipSync(fs.readFileSync(p)).toString("utf8")) : null;
};
// The full combat log (data/events/) when we have it: per-fight numbers plus
// the raw events the mechanic counting below walks through.
const KEEP = new Set(["dispel", "interrupt", "applydebuff", "cast", "begincast", "applybuff", "refreshbuff"]);
const logs = new Map();
function fullLog(code) {
  if (!logs.has(code)) {
    const base = readRaw(`reports/${code}.json.gz`);
    logs.set(code, base && hasEvents(night, code) ? { base, ...deriveLog(night, base, (e) => KEEP.has(e.type) || (e.type === "damage" && (e.amount || 0) + (e.absorbed || 0) > 0)) } : null);
  }
  return logs.get(code);
}
// { events } of one pull: from the full log, else the older filtered stream in data/wcl/fights.
function pullEvents(src) {
  const log = fullLog(src.code);
  if (log) return { events: log.events.filter((e) => e.fight === src.fight) };
  const dir = path.join(RAW, "fights");
  if (!fs.existsSync(dir)) return null;
  const file = fs.readdirSync(dir).find((f) => f.startsWith(`${src.code}-`) && !f.includes("-pull") && !f.includes("-rankings-") && readRaw(`fights/${f}`)?.fightIDs?.includes(src.fight));
  return file ? readRaw(`fights/${file}`) : null;
}

// Roles from what people actually cast (Warcraft Logs' own role/spec guess is
// unreliable for Classic Era): mostly heals -> healer, tank tools -> tank.
// Roles are inferred from casts when the night is built (see fetch.mjs).
const role = new Map(n.raiders.map((r) => [r.name, r.role]));
const cls = new Map(n.raiders.map((r) => [r.name, r.spec || r.class]));
const avg = (l) => (l.length ? Math.round(l.reduce((t, v) => t + v, 0) / l.length) : null);
const median = (l) => (l.length ? [...l].sort((a, b) => a - b)[Math.floor(l.length / 2)] : null);

// ---------- Baselines: how this guild normally does each boss ----------
// From every other night's KILL pulls of the same boss: deaths per ability per
// kill, damage taken per ability per second, healing done to the boss per kill,
// raid DPS. Damage numbers only exist for nights fetched with schema 4+.
const allNights = fs
  .readdirSync(path.join(DATA, "nights"))
  .filter((f) => f.endsWith(".json") && f !== `${night}.json`)
  .map((f) => read(path.join(DATA, "nights", f)));
function baseline(b) {
  const kills = [];
  for (const o of allNights) {
    const ob = o.bosses.find((x) => x.encounterId === b.encounterId);
    const k = ob?.pulls.find((p) => p.kill);
    if (!k) continue;
    const deaths = o.deaths.filter((d) => d.boss === ob.name && d.at >= k.at - 1 && d.at <= k.at + k.durationSec + 2);
    kills.push({ k, deaths, raiders: (ob.present || o.raiders).length });
  }
  const deathsPerKill = {};
  for (const { deaths } of kills) for (const d of deaths) deathsPerKill[d.killingBlow || "Unknown"] = (deathsPerKill[d.killingBlow || "Unknown"] || 0) + 1;
  for (const k of Object.keys(deathsPerKill)) deathsPerKill[k] = Math.round((deathsPerKill[k] / Math.max(1, kills.length)) * 100) / 100;
  const withDmg = kills.filter(({ k }) => k.taken?.length);
  const takenRate = {}; // ability -> median damage per second across kills
  const shares = {};
  for (const { k } of withDmg) {
    const total = k.takenTotal || k.taken.reduce((t, a) => t + a.total, 0);
    const byName = {}; // same name can appear twice (e.g. KT's two Frostbolts)
    for (const a of k.taken) byName[a.name] = (byName[a.name] || 0) + a.total;
    for (const [name, amt] of Object.entries(byName)) {
      (takenRate[name] ||= []).push(amt / k.durationSec);
      (shares[name] ||= []).push(amt / total);
    }
  }
  const med = (l) => (l?.length ? [...l].sort((x, y) => x - y)[Math.floor(l.length / 2)] : 0);
  const healPerKill = withDmg.map(({ k }) => (k.enemyHealed || []).reduce((t, h) => t + h.total, 0));
  const dps = withDmg.filter(({ k }) => k.damageDone).map(({ k }) => k.damageDone / k.durationSec);
  return {
    kills: kills.length,
    killsWithDamageData: withDmg.length,
    deathsPerKill,
    takenPerSecond: Object.fromEntries(Object.entries(takenRate).map(([k, l]) => [k, Math.round(med(l.concat(Array(withDmg.length - l.length).fill(0))))])),
    takenShare: Object.fromEntries(Object.entries(shares).map(([k, l]) => [k, Math.round(med(l.concat(Array(withDmg.length - l.length).fill(0))) * 1000) / 10])),
    enemyHealingPerKill: healPerKill.length ? Math.round(med(healPerKill)) : null,
    raidDps: dps.length ? Math.round(med(dps)) : null,
  };
}

// Things that stand out in one pull vs the baseline, most severe first.
function anomalies(b, p, base, deaths, extra) {
  const out = [];
  const add = (score, text) => out.push({ score, text });
  // Damage from an ability far above normal (or from something that's normally ~0).
  const total = p.takenTotal || (p.taken || []).reduce((t, a) => t + a.total, 0);
  const mine = {};
  for (const a of p.taken || []) mine[a.name] = (mine[a.name] || 0) + a.total;
  for (const a of Object.entries(mine).map(([name, total]) => ({ name, total }))) {
    const rate = a.total / p.durationSec;
    const usual = base.takenPerSecond[a.name] ?? 0;
    const share = (a.total / Math.max(1, total)) * 100;
    if (share < 2 || !base.killsWithDamageData) continue;
    if (usual < rate / 3) add(share * (usual ? Math.min(10, rate / usual) : 10), `${a.name} did ${Math.round(a.total / 1000)}k damage (${share.toFixed(1)}% of all damage taken, ${Math.round(rate)}/s); on a usual kill it's ${usual}/s (${base.takenShare[a.name] ?? 0}%)`);
  }
  // Healing the boss side shouldn't get.
  const healed = (p.enemyHealed || []).reduce((t, h) => t + h.total, 0);
  if (healed > 20000 && base.enemyHealingPerKill != null && healed > 2 * Math.max(base.enemyHealingPerKill, 1)) {
    add(40 + Math.min(60, healed / Math.max(base.enemyHealingPerKill, 10000)), `Enemies were healed for ${Math.round(healed / 1000)}k (${(p.enemyHealed || []).map((h) => `${h.name} on ${h.who} ${Math.round(h.total / 1000)}k`).join(", ")}); a usual kill: ${Math.round(base.enemyHealingPerKill / 1000)}k`);
  }
  // Deaths to abilities that rarely kill anyone on this boss.
  const by = {};
  for (const d of deaths) by[d.by || "Unknown"] = (by[d.by || "Unknown"] || 0) + 1;
  for (const [k, c] of Object.entries(by)) {
    const usual = base.deathsPerKill[k] ?? 0;
    if (c >= 2 && c >= 3 * Math.max(usual, 0.34)) add(c * 4, `${c} deaths to ${k}; a usual kill has ${usual}`);
  }
  // Boss buffs and casts.
  if (extra?.bossFrenzy && extra.bossFrenzy.gained > extra.bossFrenzy.removedByTranq) add(30, `Boss Frenzy/Enrage gained ${extra.bossFrenzy.gained}x, removed by Tranquilizing Shot ${extra.bossFrenzy.removedByTranq}x`);
  for (const [k, c] of Object.entries(extra?.bossCasts || {})) if (c.started - c.interrupted >= 2) add(10 + (c.started - c.interrupted) * 2, `Boss ${k}: started ${c.started}, interrupted ${c.interrupted}`);
  for (const [k, v] of Object.entries(p.mechanics || {})) {
    if (v.tone === "coverage" && v.neverRemoved >= 3) add(10 + v.neverRemoved * 2, `${k.replace(" (coverage)", "")}: ${v.neverRemoved} of ${v.applied} never removed (median ${v.medianSecondsToRemove}s to remove)`);
  }
  // Raid output.
  if (p.damageDone && base.raidDps) {
    const dps = p.damageDone / p.durationSec;
    if (dps < base.raidDps * 0.85) add(15, `Raid DPS ${Math.round(dps)} vs ${base.raidDps} on a usual kill (${Math.round((dps / base.raidDps) * 100)}%)`);
  }
  // Early deaths, by role.
  const early = deaths.filter((d) => d.t <= Math.min(60, p.durationSec * 0.3));
  if (early.length >= 2) add(early.length * 3, `${early.length} deaths in the first ${Math.min(60, Math.round(p.durationSec * 0.3))}s: ${early.map((d) => `${d.player} (${d.role}) to ${d.by} at ${d.t}s`).join("; ")}`);
  return out.sort((a, b) => b.score - a.score).map((a) => a.text);
}

// What hit each dead player in their last seconds (the WCL death recap).
function deathRecaps(src) {
  if (!src) return [];
  const log = fullLog(src.code);
  if (log) return (log.fights[src.fight]?.deaths || []).map((d) => ({ name: d.player, full: d }));
  const detail = readRaw(`reports/${src.code}-detail.json.gz`) || readRaw(`reports/${src.code}.json.gz`);
  return (detail?.deaths?.data?.entries || []).filter((d) => d.fight === src.fight);
}
function recapFor(recaps, player, used) {
  const i = recaps.findIndex((d, j) => !used.has(j) && d.name === player);
  if (i < 0) return undefined;
  used.add(i);
  const d = recaps[i];
  if (d.full) {
    const r = d.full.recap;
    return {
      lastSecondsDamage: r.damage.slice(0, 4).map((a) => `${a.ability} (${a.source}) ${a.total}`),
      healingReceived: r.healed,
      windowMs: 10000,
      // health % on the way down, seconds before death
      health: r.hp.slice(-8).map(([t, hp]) => `${t}s ${hp}%`).join(", "),
    };
  }
  return {
    lastSecondsDamage: (d.damage?.abilities || []).slice(0, 3).map((a) => `${a.name} ${a.total}`),
    healingReceived: d.healing?.total ?? 0,
    windowMs: d.deathWindow,
  };
}

// Boss Frenzy/Enrage gained vs removed (Tranquilizing Shot), and boss casts
// started vs interrupted - only for nights fetched after these were added.
function bossBuffsAndCasts(src) {
  const base = src && readRaw(`reports/${src.code}.json.gz`);
  const x = base && pullEvents(src);
  if (!x) return undefined;
  const ability = new Map((base.masterData.abilities || []).map((a) => [a.gameID, a.name]));
  const ev = (x.events || []).filter((e) => e.fight === src.fight);
  const out = {};
  const npc = new Set(base.masterData.actors.filter((a) => a.type === "NPC").map((a) => a.id));
  const frenzies = ev.filter((e) => (e.type === "applybuff" || e.type === "refreshbuff") && npc.has(e.targetID) && ["Frenzy", "Enrage"].includes(ability.get(e.abilityGameID)));
  if (frenzies.length) {
    const removed = ev.filter((e) => e.type === "dispel" && ["Frenzy", "Enrage"].includes(ability.get(e.extraAbilityGameID))).length;
    out.bossFrenzy = { gained: frenzies.length, removedByTranq: removed };
  }
  const casts = {};
  for (const e of ev.filter((e) => e.type === "begincast" && npc.has(e.sourceID) && BOSS_CASTS.has(ability.get(e.abilityGameID)))) {
    const n = ability.get(e.abilityGameID);
    (casts[n] ||= { started: 0, interrupted: 0 }).started++;
  }
  for (const e of ev.filter((e) => e.type === "interrupt")) {
    const n = ability.get(e.extraAbilityGameID);
    if (casts[n]) casts[n].interrupted++;
  }
  if (Object.keys(casts).length) out.bossCasts = casts;
  return Object.keys(out).length ? out : undefined;
}

const BOSS_CASTS = new Set(["Frostbolt", "Great Heal", "Dark Mending", "Arcane Explosion", "Shadow Bolt Volley", "Heal", "Holy Fire", "Mend", "Flash Heal"]);

// Raw per-pull detail: mechanic hits per player for one fight.
function pullMechanics(src, encounterId) {
  const list = MECHANICS[encounterId] || [];
  if (!src || !list.length) return {};
  const base = readRaw(`reports/${src.code}.json.gz`);
  const x = base && pullEvents(src);
  if (!x) return {};
  const fight = base.fights.find((f) => f.id === src.fight);
  const actor = new Map(base.masterData.actors.map((a) => [a.id, a]));
  const ability = new Map((base.masterData.abilities || []).map((a) => [a.gameID, a.name]));
  const out = {};
  for (const e of x.events || []) {
    if (e.fight !== src.fight) continue;
    for (const m of list) {
      const name = m.kind === "dispel" || m.kind === "kick" ? ability.get(e.extraAbilityGameID) : ability.get(e.abilityGameID);
      if (!m.abilities.includes(name)) continue;
      const ok =
        (m.kind === "hit" && e.type === "damage" && (e.amount || 0) + (e.absorbed || 0) > 0) ||
        (m.kind === "debuff" && e.type === "applydebuff") ||
        (m.kind === "cast" && e.type === "cast") ||
        (m.kind === "dispel" && e.type === "dispel") ||
        (m.kind === "kick" && e.type === "interrupt");
      const who = actor.get(m.kind === "hit" || m.kind === "debuff" ? e.targetID : e.sourceID);
      if (!ok || who?.type !== "Player") continue;
      const slot = (out[m.label] ||= { tone: m.tone, total: 0, by: {}, firstAt: null });
      slot.total++;
      slot.by[who.name] = (slot.by[who.name] || 0) + 1;
      const t = Math.round((e.timestamp - fight.startTime) / 1000);
      if (slot.firstAt == null || t < slot.firstAt) slot.firstAt = t;
    }
  }
  for (const s of Object.values(out)) s.by = Object.fromEntries(Object.entries(s.by).sort((a, b) => b[1] - a[1]).slice(0, 8));

  // Coverage of must-remove debuffs (curses, poisons, magic): how many landed,
  // how many were removed, how many ran their full course, and how fast.
  for (const m of list.filter((m) => m.kind === "dispel")) {
    const apps = x.events.filter((e) => e.fight === src.fight && e.type === "applydebuff" && m.abilities.includes(ability.get(e.abilityGameID)) && actor.get(e.targetID)?.type === "Player");
    const dispels = x.events.filter((e) => e.fight === src.fight && e.type === "dispel" && m.abilities.includes(ability.get(e.extraAbilityGameID)));
    if (!apps.length) continue;
    const used = new Set();
    const times = [];
    for (const a of apps) {
      const i = dispels.findIndex((d, j) => !used.has(j) && d.targetID === a.targetID && d.timestamp >= a.timestamp && d.timestamp - a.timestamp <= 30000);
      if (i >= 0) {
        used.add(i);
        times.push((dispels[i].timestamp - a.timestamp) / 1000);
      }
    }
    times.sort((a, b) => a - b);
    out[`${m.label} (coverage)`] = {
      tone: "coverage",
      applied: apps.length,
      removed: times.length,
      neverRemoved: apps.length - times.length,
      medianSecondsToRemove: times.length ? Math.round(times[Math.floor(times.length / 2)] * 10) / 10 : null,
      slowerThan6s: times.filter((t) => t > 6).length,
    };
  }
  return out;
}

const facts = {
  night,
  zones: n.zones,
  raiders: n.raiders.length,
  roles: Object.fromEntries(["tank", "healer", "dps"].map((r) => [r, [...role.values()].filter((x) => x === r).length])),
  roleNote: "roles inferred from casts (heals / tank abilities); specs come from Warcraft Logs and can be wrong",
  tanks: [...role].filter(([, r]) => r === "tank").map(([n]) => n),
  healers: [...role].filter(([, r]) => r === "healer").map(([n]) => n),
  durationMin: n.durationMin,
  totals: n.totals,
  clearTimes: Object.fromEntries(
    Object.entries(summary.nights.find((x) => x.night === night)?.zoneTimes || {}).map(([z, t]) => {
      const others = summary.nights.filter((x) => x.night !== night && x.zoneTimes?.[z]?.kills === t.kills).map((x) => x.zoneTimes[z].sec);
      return [z, { sec: t.sec, kills: t.kills, guildBest: others.length ? Math.min(...others) : null, guildMedian: median(others), comparableNights: others.length }];
    })
  ),
  trashDeaths: n.deaths.filter((d) => !d.boss).map((d) => ({ at: d.at, player: d.player, by: d.killingBlow, killer: d.killer?.name })),
  bosses: n.bosses.map((b) => {
    const all = summary.allTime.bosses.find((x) => x.id === b.encounterId);
    const detail = bossFile(b.encounterId);
    const before = (all?.history || []).filter((h) => h.night < night).map((h) => h.sec);
    const parseHist = (detail?.parseNights || []).filter((p) => p.night < night).map((p) => p.median);
    const myParses = (b.parses || []).map((p) => p.pct);
    const mechHist = Object.fromEntries(
      Object.entries(detail?.mechNights || {}).map(([k, list]) => {
        const prev = list.filter((x) => x.night < night && x.present);
        return [k, prev.length ? Math.round((prev.reduce((t, x) => t + x.total / x.present, 0) / prev.length) * 100) / 100 : null];
      })
    );
    const base = baseline(b);
    return {
      boss: b.name,
      encounterId: b.encounterId,
      baseline: base,
      killed: b.killed,
      killTimeSec: b.killTimeSec,
      killTimeHistory: { kills: before.length, best: before.length ? Math.min(...before) : null, median: median(before) },
      parses: { median: median(myParses), historicalMedian: median(parseHist), top: (b.parses || []).slice(0, 3).map((p) => `${p.player} ${p.pct}`) },
      mechanicsTonight: Object.fromEntries(
        Object.entries(b.mech || {}).map(([k, by]) => {
          const m = (MECHANICS[b.encounterId] || []).find((x) => x.key === k);
          const total = Object.values(by).reduce((t, v) => t + v, 0);
          return [m?.label || k, { tone: m?.tone, total, perRaider: b.present?.length ? Math.round((total / b.present.length) * 100) / 100 : null, historicalPerRaider: mechHist[k] ?? null, raidersAffected: Object.keys(by).length }];
        })
      ),
      pulls: b.pulls.map((p, i) => withAnomalies(b, p, base, i)),
    };
  }),
  utility: {
    topDispels: (n.dispels || []).slice(0, 3).map((d) => `${d.player} ${d.total}`),
    topInterrupts: (n.interrupts || []).slice(0, 3).map((d) => `${d.player} ${d.total}`),
    battleRezzes: (n.rezzes || []).filter((r) => ["Rebirth", "Soulstone Resurrection"].includes(r.ability)).map((r) => `${r.by} > ${r.target} (${r.ability}${r.boss ? ` on ${r.boss}` : ""})`),
  },
  consumables: Object.fromEntries(
    Object.entries(n.casts || {})
      .filter(([, c]) => c.category === "consumable")
      .map(([k, c]) => [k, Object.values(c.by).reduce((t, v) => t + v, 0)])
      .sort((a, b) => b[1] - a[1])
  ),
};

console.log(JSON.stringify(facts, null, 1));

// ---------- per pull ----------

function withAnomalies(b, p, base, i) {
  const pull = pullFacts(b, p, i);
  pull.anomalies = anomalies(b, p, base, pull.allDeaths, pull);
  delete pull.allDeaths;
  return pull;
}

// Damage taken by ability; from the full log also who took it (avoidable
// damage is usually a few players standing in it) and how many hits landed.
function takenDetail(p) {
  const d = p.src && fullLog(p.src.code)?.fights[p.src.fight];
  if (!d) return p.taken;
  return Object.entries(d.taken)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 12)
    .map(([name, a]) => ({
      name,
      total: a.total,
      hits: a.hits,
      players: Object.keys(a.by).length,
      most: Object.entries(a.by).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([pl, v]) => `${pl} ${v}`),
      from: Object.keys(a.from).slice(0, 3),
    }));
}

function pullFacts(b, p, i) {
  const recaps = deathRecaps(p.src);
  const used = new Set();
  const deaths = n.deaths
    .filter((d) => d.boss === b.name && d.at >= p.at - 1 && d.at <= p.at + p.durationSec + 2)
    .map((d) => ({ t: d.at - p.at, player: d.player, role: role.get(d.player), by: d.killingBlow, killer: d.killer?.name, overkill: d.overkill, recap: recapFor(recaps, d.player, used) }));
  const byAbility = {};
  for (const d of deaths) byAbility[d.by || "Unknown"] = (byAbility[d.by || "Unknown"] || 0) + 1;
  return {
    pull: i + 1,
    result: p.kill ? "kill" : `wipe at ${p.bossPctLeft}% boss health`,
    durationSec: p.durationSec,
    deaths: deaths.length,
    firstDeaths: deaths.slice(0, 6),
    allDeaths: deaths,
    deathsByAbility: byAbility,
    tanksDead: deaths.filter((d) => d.role === "tank").map((d) => `${d.player} at ${d.t}s`),
    healersDead: deaths.filter((d) => d.role === "healer").length,
    mechanics: pullMechanics(p.src, b.encounterId),
    damageTakenByAbility: takenDetail(p),
    healingDoneToEnemies: p.enemyHealed,
    raidDps: p.damageDone ? Math.round(p.damageDone / p.durationSec) : null,
    raidHps: p.healingDone ? Math.round(p.healingDone / p.durationSec) : null,
    topDamage: p.topDamage,
    topHealing: p.topHealing,
    ...bossBuffsAndCasts(p.src),
  };
}
