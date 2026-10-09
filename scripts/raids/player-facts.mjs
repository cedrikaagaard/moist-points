// Per-raider facts for the private player reviews (data/reviews/<raid id>.json,
// shown only to the verified owner on My Page). Everything a review may say
// about one person, with the raid's numbers next to it for comparison.
//
//   npm run raids:player-facts -- --night 2026-10-07-naxx [--player Snotspat]
//
// Needs the night's full log in data/events/.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { MECHANICS } from "../../src/raids/mechanics.js";
import { hasEvents, deriveLog, readEvents } from "./derive.mjs";
import { TRACKED_CASTS } from "./config.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATA = path.join(ROOT, "src/raids/data");
const arg = (k) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : null);
const night = arg("--night");
const only = arg("--player");
if (!night) {
  console.error("usage: npm run raids:player-facts -- --night <raid id> [--player <name>]");
  process.exit(1);
}
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const n = read(path.join(DATA, "nights", `${night}.json`));
const date = n.date || night.slice(0, 10);
const readRaw = (rel) => JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(ROOT, "data/wcl", rel))).toString("utf8"));

const median = (l) => (l.length ? [...l].sort((a, b) => a - b)[Math.floor(l.length / 2)] : null);
const r1 = (x) => Math.round(x * 10) / 10;
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const role = new Map(n.raiders.map((r) => [r.name, r.role]));
const cls = new Map(n.raiders.map((r) => [r.name, r.class]));

// ---------- full logs: derived per fight + a raw pass for activity and overheal ----------
const logs = new Map();
function log(code) {
  if (logs.has(code)) return logs.get(code);
  if (!hasEvents(date, code)) return logs.set(code, null).get(code);
  const base = readRaw(`reports/${code}.json.gz`);
  const fights = deriveLog(date, base);
  const actor = new Map(base.masterData.actors.map((a) => [a.id, a]));
  const start = new Map(base.fights.map((f) => [f.id, f.startTime]));
  const abil = new Map((base.masterData.abilities || []).map((a) => [a.gameID, a.name]));
  // per fight: player -> sorted activity times (s), overheal, raw heal
  const act = {};
  for (const e of readEvents(date, code)) {
    if (!start.has(e.fight)) continue;
    if (e.type === "applydebuff" || e.type === "removedebuff") {
      const tgt = actor.get(e.targetID);
      const name = abil.get(e.abilityGameID);
      if (tgt?.type === "Player" && CC.test(name || "")) {
        const m = ((act[e.fight] ??= {})[tgt.name] ??= { t: [], heal: 0, over: 0 });
        const t = (e.timestamp - start.get(e.fight)) / 1000;
        if (e.type === "applydebuff") (m.cc ??= []).push([t, null]);
        else { const open = (m.cc || []).findLast((x) => x[1] == null); if (open) open[1] = t; }
      }
    }
    const a = actor.get(e.sourceID);
    if (a?.type !== "Player") continue;
    const f = (act[e.fight] ??= {});
    const me = (f[a.name] ??= { t: [], heal: 0, over: 0 });
    const t = (e.timestamp - start.get(e.fight)) / 1000;
    if (e.type === "cast" || e.type === "begincast" || ((e.type === "damage" || e.type === "heal") && !e.tick)) me.t.push(t);
    // Ignite: its threat goes to the owner even while other mages refresh it.
    if (e.type === "damage" && abil.get(e.abilityGameID) === "Ignite") {
      me.ignite = (me.ignite || 0) + (e.amount || 0) + (e.absorbed || 0);
      me.igniteMaxTick = Math.max(me.igniteMaxTick || 0, e.amount || 0);
    }
    if (e.type === "heal") {
      me.heal += e.amount || 0;
      me.over += e.overheal || 0;
    }
  }
  return logs.set(code, { base, fights, act }).get(code);
}

// Can't act: stuns, fears, mind control, ice blocks, cocoons, Nefarian's mage call
// (Wild Magic: a mage's spells polymorph the raid, so not casting is the job).
const CC = /^(Web Spray|Web Wrap|Icebolt|Frost Blast|Chains of Kel'Thuzad|Panic|Bellowing Roar|Terrifying Roar|Fear|Psychic Scream|Dominate Mind|True Fulfillment|Cause Insanity|Mind Control|War Stomp|Locust Swarm|Silence|Polymorph|Sleep|Hex|Wing Buffet|Entomb|Wild Magic|Wild Polymorph)$/;

// Idle time: gaps of 3+ seconds with no cast, swing, shot or direct heal, from
// the pull until death or the end of the fight.
function activity(times, endSec) {
  const ts = [0, ...times.filter((t) => t >= 0 && t <= endSec).sort((a, b) => a - b), endSec];
  let idle = 0;
  let longest = [0, 0];
  for (let i = 1; i < ts.length; i++) {
    const g = ts[i] - ts[i - 1];
    if (g >= 3) idle += g;
    if (g > longest[0]) longest = [g, ts[i - 1]];
  }
  return { activePct: endSec > 0 ? Math.round(100 * (1 - idle / endSec)) : null, longestIdle: longest[0] >= 3 ? `${Math.round(longest[0])}s from ${mmss(longest[1])}` : null };
}

const potionIds = new Map();
for (const c of TRACKED_CASTS) if (c.category === "potion" && c.ids) for (const id of c.ids) potionIds.set(id, c.label || c.name);
const potionNames = new Map(TRACKED_CASTS.filter((c) => c.category === "potion" && !c.ids).map((c) => [c.name, c.label || c.name]));

// ---------- history: this player's own parses on the boss before tonight ----------
const history = (name) => {
  const p = path.join(DATA, "players", `${name}.json`);
  return fs.existsSync(p) ? read(p) : null;
};

const rank = (list, v, desc = true) => (v == null ? null : `${[...list].sort((a, b) => (desc ? b - a : a - b)).indexOf(v) + 1}/${list.length}`);

function bossFacts(b, players) {
  const mech = MECHANICS[b.encounterId] || [];
  const killPull = b.pulls.find((p) => p.kill);
  const parses = (b.parses || []).filter((x) => !(x.role === "healer" && (x.amount || 0) < 50));
  const roleOf = (pl) => parses.find((x) => x.player === pl)?.role || role.get(pl);
  const perPlayer = {};
  for (const name of players) perPlayer[name] = { boss: b.name, encounterId: b.encounterId, pulls: b.pulls.length, wipes: b.pulls.filter((p) => !p.kill).length };

  // parses and amounts, ranked within role and class
  for (const x of parses) {
    const me = perPlayer[x.player];
    if (!me) continue;
    const sameRole = parses.filter((y) => y.role === x.role);
    const sameClass = sameRole.filter((y) => cls.get(y.player) === cls.get(x.player));
    me.parse = x.pct;
    me.parseRole = x.role;
    me[x.role === "healer" ? "hps" : "dps"] = x.amount;
    me.roleRank = rank(sameRole.map((y) => y.amount), x.amount);
    if (sameClass.length > 1) me.classRank = `${rank(sameClass.map((y) => y.amount), x.amount)} ${cls.get(x.player)}s`;
    me.raidMedianParseForRole = median(sameRole.map((y) => y.pct));
  }

  // activity, overheal, potions on the kill (wipes add deaths and damage taken)
  if (killPull?.src) {
    const L = log(killPull.src.code);
    const f = L?.fights[killPull.src.fight];
    const act = L?.act[killPull.src.fight] || {};
    if (f) {
      const deathAt = new Map(f.deaths.map((d) => [d.player, d.t / 1000]));
      // Output per second from the log itself (healers' WCL parses are often blank).
      const out = {};
      for (const name of players) {
        const r = roleOf(name);
        const v = r === "healer" ? f.healing[name] || 0 : f.done[name] || 0;
        perPlayer[name][r === "healer" ? "logHps" : "logDps"] = Math.round(v / killPull.durationSec);
        (out[r] ??= []).push(v);
      }
      for (const name of players) {
        const r = roleOf(name);
        const v = r === "healer" ? f.healing[name] || 0 : f.done[name] || 0;
        perPlayer[name].logRank = `${rank(out[r], v)} ${r === "healer" ? "healers" : r === "tank" ? "tanks" : "dps"}`;
        if (r === "healer") perPlayer[name].healShare = Math.round((100 * v) / out[r].reduce((a, b) => a + b, 0));
      }
      const actByRole = {};
      for (const name of players) {
        const a = act[name];
        if (!a) continue;
        const end = Math.min(killPull.durationSec, deathAt.get(name) ?? Infinity);
        const ccTicks = (a.cc || []).flatMap(([on, off]) => { const l = []; for (let t = on; t <= (off ?? on + 10); t += 1) l.push(t); return l; });
        const r = activity([...a.t, ...ccTicks], end);
        perPlayer[name].activePct = r.activePct;
        if (r.longestIdle && r.activePct < 90) perPlayer[name].longestIdle = r.longestIdle;
        (actByRole[roleOf(name)] ??= []).push(r.activePct);
        if (a.ignite > 20000) perPlayer[name].ignite = `${Math.round(a.ignite / 1000)}k Ignite damage owned (biggest tick ${a.igniteMaxTick}); collective fire-mage damage credited to the owner, with all its threat: the owner's DPS is inflated, other fire mages' deflated`;
        if (a.heal + a.over > 20000) perPlayer[name].overhealPct = Math.round((100 * a.over) / (a.heal + a.over));
      }
      for (const name of players) if (perPlayer[name].activePct != null) perPlayer[name].raidMedianActivePctForRole = median(actByRole[roleOf(name)]);
      for (const name of players) {
        const pots = [];
        for (const [id, c] of Object.entries(f.castIds[name] || {})) if (potionIds.has(+id)) pots.push(`${potionIds.get(+id)}${c > 1 ? ` x${c}` : ""}`);
        for (const [s, c] of Object.entries(f.casts[name] || {})) if (potionNames.has(s)) pots.push(`${potionNames.get(s)}${c > 1 ? ` x${c}` : ""}`);
        if (pots.length) perPlayer[name].potions = pots;
        const melee = f.taken.Melee;
        const mine = melee?.by[name] || 0;
        if (melee && mine > 0.1 * melee.total) perPlayer[name].meleeTakenShare = Math.round((100 * mine) / melee.total);
        const top = Object.entries(f.casts[name] || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
        if (top.length) perPlayer[name].casts = top.map(([s, c]) => `${s} ${c}`).join(", ");
      }
    }
  }

  // every pull: deaths, avoidable damage, mechanics caught, dispels/kicks
  const badHits = new Set(mech.filter((m) => m.tone === "bad" && m.kind === "hit").flatMap((m) => m.abilities));
  const avoid = {};
  b.pulls.forEach((p, i) => {
    const L = p.src && log(p.src.code);
    const f = L?.fights[p.src.fight];
    if (!f) return;
    const order = f.deaths.map((d) => d.player);
    for (const d of f.deaths) {
      const me = perPlayer[d.player];
      if (!me) continue;
      (me.deaths ??= []).push({
        pull: `${i + 1}${p.kill ? " (kill)" : ` (wipe at ${p.bossPctLeft}%)`}`,
        at: mmss(d.t / 1000),
        nth: `${order.indexOf(d.player) + 1} of ${order.length} deaths`,
        killingBlow: d.killingBlow,
        killer: d.killer,
        lastTenSeconds: d.recap.damage.slice(0, 4).map((x) => `${x.ability} (${x.source}) ${x.total}`),
        healedInLastTenSeconds: d.recap.healed,
      });
    }
    for (const [ability, a] of Object.entries(f.taken)) {
      if (!badHits.has(ability)) continue;
      for (const [pl, v] of Object.entries(a.by)) if (v > 0) ((avoid[ability] ??= {})[pl] = (avoid[ability]?.[pl] || 0) + v);
    }
    for (const d of f.dispels) if (perPlayer[d.by]) ((perPlayer[d.by].dispelled ??= {})[d.what] = (perPlayer[d.by].dispelled[d.what] || 0) + 1);
    for (const k of f.interrupts) if (perPlayer[k.by]) ((perPlayer[k.by].kicked ??= {})[k.what] = (perPlayer[k.by].kicked[k.what] || 0) + 1);
  });
  for (const [ability, by] of Object.entries(avoid)) {
    const vals = Object.values(by);
    for (const [pl, v] of Object.entries(by)) {
      if (!perPlayer[pl]) continue;
      (perPlayer[pl].avoidable ??= []).push(`${ability} ${v} (${rank(vals, v)} of the ${vals.length} raiders hit; raid median ${median(vals)})`);
    }
  }
  for (const [key, by] of Object.entries(b.mech || {})) {
    const m = mech.find((x) => x.key === key);
    if (!m) continue;
    const vals = Object.values(by);
    for (const [pl, c] of Object.entries(by)) {
      if (!perPlayer[pl]) continue;
      const bucket = m.tone === "good" ? "jobs" : m.tone === "bad" ? "caught" : "happened";
      (perPlayer[pl][bucket] ??= []).push(`${m.label} ${c}${m.tone !== "info" ? ` (raid: ${vals.length} raiders, median ${median(vals)}, most ${Math.max(...vals)})` : ""}`);
    }
  }
  return perPlayer;
}

// ---------- assemble ----------
const names = n.raiders.map((r) => r.name).filter((x) => !only || x.toLowerCase() === only.toLowerCase());
const players = new Map(names.map((name) => [name, { name, class: cls.get(name), role: role.get(name), bosses: [] }]));
const present = (b) => new Set([...(b.present || []), ...(b.parses || []).map((p) => p.player)]);

for (const b of n.bosses) {
  const here = names.filter((x) => present(b).size === 0 || present(b).has(x));
  const per = bossFacts(b, here);
  for (const [name, f] of Object.entries(per)) players.get(name).bosses.push(f);
}

for (const p of players.values()) {
  const h = history(p.name);
  const before = (h?.nights || []).filter((x) => x.night < night);
  p.raidsBefore = before.length;
  for (const bf of p.bosses) {
    const prev = before.flatMap((x) => (x.parses || []).filter((y) => y.id === bf.encounterId && y.role === (bf.parseRole || role.get(p.name))).map((y) => y.pct));
    if (prev.length) bf.ownHistory = `median ${median(prev)} over ${prev.length} earlier kills, best ${Math.max(...prev)}`;
  }
  const pcts = p.bosses.map((b) => b.parse).filter((x) => x != null);
  p.avgParse = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
  const prevAll = before.flatMap((x) => (x.parses || []).filter((y) => y.role === p.role).map((y) => y.pct));
  p.ownAvgParseBefore = prevAll.length ? Math.round(prevAll.reduce((a, b) => a + b, 0) / prevAll.length) : null;
  p.deathsTonight = p.bosses.reduce((t, b) => t + (b.deaths?.length || 0), 0);
  p.trashDeaths = n.deaths.filter((d) => d.player === p.name && !d.boss).map((d) => `${mmss(d.at)} into the raid, ${d.killingBlow} (${d.killer?.name || "?"})`);
  p.deathsPerRaidBefore = before.length ? r1(before.reduce((t, x) => t + (x.deaths || 0), 0) / before.length) : null;

  // consumables over the raid
  const cb = n.consumeBuffs;
  if (cb?.pulls) {
    const groups = {};
    for (const [buff, x] of Object.entries(cb.buffs)) if (x.by[p.name]) (groups[x.group] ??= []).push(`${buff} ${x.by[p.name]}/${cb.pulls}`);
    p.consumeBuffsOnBossPulls = groups;
    const per = {};
    for (const x of Object.values(cb.buffs)) for (const [pl, c] of Object.entries(x.by)) per[pl] = (per[pl] || 0) + c;
    const sameRole = Object.entries(per).filter(([pl]) => role.get(pl) === p.role).map(([, v]) => v / cb.pulls);
    p.consumeBuffsPerPull = r1((per[p.name] || 0) / cb.pulls);
    p.raidMedianConsumeBuffsPerPullForRole = r1(median(sameRole) || 0);
  }
  const used = {};
  for (const [name, c] of Object.entries(n.casts || {})) if (c.by[p.name] && c.category !== "debuff") used[`${c.category}: ${c.label || name}`] = c.by[p.name];
  for (const [name, c] of Object.entries(n.casts || {})) if (c.by[p.name] && c.category === "debuff") used[`raid debuff: ${c.label || name}`] = c.by[p.name];
  p.usedOverRaid = used;
  const d = n.dispels?.find((x) => x.player === p.name);
  if (d) p.dispelsTotal = d.total;
  const k = n.interrupts?.find((x) => x.player === p.name);
  if (k) p.kicksTotal = k.total;
  const rz = (n.rezzes || []).filter((x) => x.by === p.name && x.boss);
  if (rz.length) p.combatRezzes = rz.map((x) => `${x.target} on ${x.boss}`);
}

// World buffs at the first pull with a snapshot, and at the last one.
{
  const snaps = [];
  for (const b of n.bosses) b.pulls.forEach((p, i) => {
    const a = p.src && log(p.src.code)?.fights[p.src.fight]?.auras;
    // (some pulls' snapshots come without any buffs at all: unknown, not "none")
    const WBX = /Rallying Cry|Spirit of Zandalar|Songflower|Fengus|Mol'dar|Slip'kik|Sayge's/;
    if (a && Object.keys(a).length > 15 && Object.values(a).filter((l) => l.some(([x]) => WBX.test(x))).length >= 5) snaps.push([b.name, a, b.encounterId, i + 1, p.kill]);
  });
  const WB = /Rallying Cry|Warchief's Blessing|Spirit of Zandalar|Songflower|Fengus|Mol'dar|Slip'kik|Sayge's|Traces of Silithyst|Boon of Blackfathom/;
  const wb = (a, name) => (a[name] || []).map(([x]) => x).filter((x) => WB.test(x));
  if (snaps.length) for (const p of players.values()) {
    p.worldBuffsFirstBoss = `${snaps[0][0]}: ${wb(snaps[0][1], p.name).join(", ") || "none"}`;
    const last = snaps[snaps.length - 1];
    p.worldBuffsLastBoss = `${last[0]}: ${wb(last[1], p.name).join(", ") || "none"}`;
    // per pull: the buffs they had (null = no snapshot of them, e.g. dead at the pull)
    p.worldBuffTimeline = snaps.map(([boss, a, id, pull, kill]) => ({ id, boss, pull, kill: !!kill, buffs: a[p.name] ? wb(a, p.name) : null }));
  }
}

// Raid context to compare against.
const ctx = { night, raidKind: n.kind, durationMin: n.durationMin, raiders: n.raiders.length };
const all = [...players.values()];
const byRole = {};
for (const p of all) if (p.avgParse != null) (byRole[p.role] ??= []).push(p.avgParse);
ctx.medianAvgParseByRole = Object.fromEntries(Object.entries(byRole).map(([r, l]) => [r, median(l)]));
if (!process.argv.includes("--write")) {
  console.log(JSON.stringify({ context: ctx, players: all.sort((a, b) => (b.avgParse ?? -1) - (a.avgParse ?? -1)) }, null, 1));
} else {
  // data/reviews/<raid id>.json: per player the numbers the review page draws
  // (stats, regenerated here) and the written review (kept as it is).
  const file = path.join(ROOT, "data/reviews", `${night}.json`);
  const prev = fs.existsSync(file) ? read(file) : { night, players: {} };
  const out = { night, zones: n.zones, zoneIds: n.zoneIds, date, kind: n.kind, durationMin: n.durationMin, raiders: n.raiders.length, icons: {}, players: {} };
  // icons for the buffs the review page shows (consumables, world buffs)
  const WBI = /Rallying Cry|Warchief's Blessing|Spirit of Zandalar|Songflower|Fengus|Mol'dar|Slip'kik|Sayge's/;
  for (const [k, v] of Object.entries(n.icons || {})) if (WBI.test(k) || n.consumeBuffs?.buffs?.[k]) out.icons[k] = v;
  for (const p of all) {
    const stats = {
      class: p.class,
      role: p.role,
      avgParse: p.avgParse,
      ownAvgParseBefore: p.ownAvgParseBefore,
      raidMedianParse: ctx.medianAvgParseByRole[p.role] ?? null,
      bosses: p.bosses.map((b) => ({
        id: b.encounterId,
        name: b.boss,
        parse: b.parse ?? null,
        own: b.ownHistory ? +b.ownHistory.match(/median (\d+)/)[1] : null,
        best: b.ownHistory ? +b.ownHistory.match(/best (\d+)/)[1] : null,
        perSec: b.logDps ?? b.logHps ?? null,
        rank: b.logRank || null,
        healShare: b.healShare ?? null,
        overheal: b.overhealPct ?? null,
        active: b.activePct ?? null,
        activeMedian: b.raidMedianActivePctForRole ?? null,
        deaths: b.deaths?.length || 0,
      })),
      deaths: p.bosses.flatMap((b) => (b.deaths || []).map((d) => ({ boss: b.boss, id: b.encounterId, pull: d.pull, at: d.at, by: d.killingBlow, killer: d.killer }))),
      consumes: p.consumeBuffsOnBossPulls ? { perPull: p.consumeBuffsPerPull, roleMedian: p.raidMedianConsumeBuffsPerPullForRole, pulls: n.consumeBuffs.pulls, groups: p.consumeBuffsOnBossPulls } : null,
      used: p.usedOverRaid,
      worldBuffs: p.worldBuffTimeline || [],
    };
    const keep = prev.players?.[p.name]?.review;
    out.players[p.name] = keep ? { stats, review: keep } : { stats };
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(out, null, 1) + "\n");
  console.error(`wrote ${path.relative(ROOT, file)}: ${all.length} raiders, ${Object.values(out.players).filter((x) => x.review).length} reviews`);
}
