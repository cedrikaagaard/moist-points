// The "facts pack" for one raid night: everything an analysis may say, with the
// numbers behind it. The /raid-logs skill writes the magic LLM analysis from
// this (src/raids/data/analysis/<night>.json) - never from memory or vibes.
//
//   npm run raids:facts -- --night 2026-09-23
//
// Reads the night file, the all-time summary/boss files, and the raw archive
// in data/wcl/ for per-pull detail (who died when, to what; mechanic hits per pull).
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { MECHANICS } from "../../src/raids/mechanics.js";

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
// Roles from what people actually cast (Warcraft Logs' own role/spec guess is
// unreliable for Classic Era): mostly heals -> healer, tank tools -> tank.
const HEALS = new Set(["Flash Heal", "Heal", "Greater Heal", "Lesser Heal", "Prayer of Healing", "Renew", "Holy Light", "Flash of Light", "Healing Touch", "Regrowth", "Rejuvenation", "Holy Shock", "Swiftmend", "Power Word: Shield", "Desperate Prayer"]);
const TANK = new Set(["Taunt", "Shield Block", "Revenge", "Shield Slam", "Growl", "Maul", "Swipe", "Righteous Fury", "Mocking Blow", "Challenging Roar"]);
function inferRoles() {
  const casts = new Map(); // name -> { heal, tank, total }
  const dir = path.join(RAW, "fights");
  for (const s of n.sources) {
    if (!fs.existsSync(dir)) break;
    for (const f of fs.readdirSync(dir).filter((f) => f.startsWith(`${s.code}-`))) {
      for (const a of readRaw(`fights/${f}`)?.casts?.data?.entries || []) {
        const by = a.subentries?.length ? a.subentries.map((e) => [e.actorName, e.total]) : (a.sources || []).map((e) => [e.name, e.total]);
        for (const [name, c] of by) {
          const t = casts.get(name) || { heal: 0, tank: 0, total: 0 };
          t.total += c;
          if (HEALS.has(a.name)) t.heal += c;
          if (TANK.has(a.name)) t.tank += c;
          casts.set(name, t);
        }
      }
    }
  }
  const out = new Map();
  for (const r of n.raiders) {
    const c = casts.get(r.name);
    out.set(r.name, !c ? r.role : c.heal > c.total * 0.5 ? "healer" : c.tank >= 15 ? "tank" : "dps");
  }
  return out;
}
const role = inferRoles();
const cls = new Map(n.raiders.map((r) => [r.name, r.spec || r.class]));
const avg = (l) => (l.length ? Math.round(l.reduce((t, v) => t + v, 0) / l.length) : null);
const median = (l) => (l.length ? [...l].sort((a, b) => a - b)[Math.floor(l.length / 2)] : null);

// Raw per-pull detail: mechanic hits per player for one fight.
function pullMechanics(src, encounterId) {
  const list = MECHANICS[encounterId] || [];
  if (!src || !list.length) return {};
  const base = readRaw(`reports/${src.code}.json.gz`);
  const dir = path.join(RAW, "fights");
  if (!base || !fs.existsSync(dir)) return {};
  const file = fs.readdirSync(dir).find((f) => f.startsWith(`${src.code}-`) && readRaw(`fights/${f}`)?.fightIDs?.includes(src.fight));
  if (!file) return {};
  const x = readRaw(`fights/${file}`);
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
        (m.kind === "hit" && e.type === "damage") ||
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
    return {
      boss: b.name,
      encounterId: b.encounterId,
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
      pulls: b.pulls.map((p, i) => {
        const deaths = n.deaths
          .filter((d) => d.boss === b.name && d.at >= p.at - 1 && d.at <= p.at + p.durationSec + 2)
          .map((d) => ({ t: d.at - p.at, player: d.player, spec: cls.get(d.player), role: role.get(d.player), by: d.killingBlow, killer: d.killer?.name, overkill: d.overkill }));
        const byAbility = {};
        for (const d of deaths) byAbility[d.by || "Unknown"] = (byAbility[d.by || "Unknown"] || 0) + 1;
        return {
          pull: i + 1,
          result: p.kill ? "kill" : `wipe at ${p.bossPctLeft}% boss health`,
          durationSec: p.durationSec,
          deaths: deaths.length,
          firstDeaths: deaths.slice(0, 6),
          deathsByAbility: byAbility,
          tanksDead: deaths.filter((d) => d.role === "tank").map((d) => `${d.player} at ${d.t}s`),
          healersDead: deaths.filter((d) => d.role === "healer").length,
          mechanics: pullMechanics(p.src, b.encounterId),
        };
      }),
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
