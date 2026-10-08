// Everything about a raid night, computed offline from its full combat log
// (data/events/, see events.mjs) plus the light report data (data/wcl/reports/).
// No API calls: new stats are a code change plus a rebuild.
//
// deriveLog(night, report) -> per fight of that log:
//   taken        damage players took, by ability: { total, hits, by: { player: total }, from: { source: total } }
//   enemyHealed  healing done to enemies (Life Drain on Sapphiron, Heal Brother...): [{ who, name, target, total }]
//   done/healing per player (pets count for their owner), absorbs count as healing
//   casts        per player per ability; dispels, interrupts, resurrects as timed lists
//   deaths       with a recap: what hit them in the last 10 s, healing received, health on the way down
//   debuffs      every debuff on a raider: when it landed and when (if ever) it came off
//   perSec       damage and healing per player per second (replays)
//   bossBuffs / bossCasts / bossHp
// Times are ms from the fight start.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const EVENTS_DIR = path.join(ROOT, "data/events");

const RECAP_MS = 10_000;
const NOT_DISPELS = new Set(["Enrage", "Frenzy"]); // Tranq Shot "dispelling" a boss Frenzy

export function hasEvents(night, code) {
  return fs.existsSync(path.join(EVENTS_DIR, night, code, "done.json"));
}

export function readEvents(night, code) {
  const dir = path.join(EVENTS_DIR, night, code);
  const out = [];
  for (const f of fs.readdirSync(dir).filter((f) => f.startsWith("page-")).sort()) {
    const page = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir, f))));
    for (const e of page) out.push(e);
  }
  return out;
}

// keep(e, abilityName): raw events to hand back as well (mechanic counting).
export function deriveLog(night, report, keep = null) {
  const events = readEvents(night, report.code);
  const kept = [];
  const actor = new Map(report.masterData.actors.map((a) => [a.id, a]));
  const ability = new Map((report.masterData.abilities || []).map((a) => [a.gameID, a]));
  const spell = (id) => ability.get(id)?.name || `spell ${id}`;
  const isPlayer = (id) => actor.get(id)?.type === "Player";
  // A player's pets and totems count as that player.
  const owner = (id) => {
    const a = actor.get(id);
    if (!a) return null;
    if (a.type === "Player") return a;
    if (a.petOwner != null && actor.get(a.petOwner)?.type === "Player") return actor.get(a.petOwner);
    return null;
  };
  const friendly = (id) => !!owner(id);
  const enemy = (id) => id != null && id >= 0 && !friendly(id) && actor.get(id)?.type !== "Player";
  const nameOf = (id) => actor.get(id)?.name ?? null;

  const fights = new Map(report.fights.map((f) => [f.id, f]));
  const out = {};
  const slot = (id) =>
    (out[id] ??= {
      taken: {},
      enemyHealed: {},
      done: {},
      healing: {},
      perSec: { damage: {}, healing: {} }, // player -> amount in each second of the fight
      casts: {},
      castIds: {}, // player -> spell id -> casts
      dispels: [],
      interrupts: [],
      resurrects: [],
      deaths: [],
      debuffs: {},
      bossBuffs: [],
      bossCasts: [],
      bossHp: [],
      auras: {}, // player -> buffs at the pull (from the combatantinfo snapshot)
      recent: new Map(), // player -> last RECAP_MS of damage/heals, for death recaps
    });
  const bossIds = new Map();
  for (const f of report.fights) bossIds.set(f.id, new Set((f.enemyNPCs || []).filter((n) => n.gameID).map((n) => n.id)));

  for (const e of events) {
    const f = fights.get(e.fight);
    if (!f) continue;
    const s = slot(e.fight);
    const t = e.timestamp - f.startTime;
    if (keep?.(e, spell(e.abilityGameID))) kept.push(e);
    switch (e.type) {
      case "damage": {
        const total = (e.amount || 0) + (e.absorbed || 0);
        if (isPlayer(e.targetID)) {
          // Like Warcraft Logs' Damage Taken: players only, friendly fire included.
          const name = spell(e.abilityGameID);
          const a = (s.taken[name] ??= { total: 0, hits: 0, by: {}, from: {} });
          a.total += total;
          if (total > 0) a.hits++; // landed hits; dodges, parries and full resists are 0
          const p = nameOf(e.targetID);
          const src = nameOf(e.sourceID) ?? "?";
          a.by[p] = (a.by[p] || 0) + total;
          a.from[src] = (a.from[src] || 0) + total;
          remember(s, p, { t, kind: "dmg", ability: name, source: src, sourceId: e.sourceID, amount: total, hp: e.hitPoints, overkill: e.overkill || 0 });
        }
        if (enemy(e.targetID) && friendly(e.sourceID)) {
          const p = owner(e.sourceID).name;
          s.done[p] = (s.done[p] || 0) + total;
          tick(s.perSec.damage, p, t, total);
          if (e.hitPoints != null && isBoss(f, e.targetID)) sampleHp(s, e.targetID, t, e.hitPoints);
        }
        break;
      }
      case "heal":
      case "absorbed": {
        const amount = e.amount || 0;
        // Absorbed: a shield soaking a hit counts as healing by whoever cast it.
        if (friendly(e.sourceID) && friendly(e.targetID)) {
          const p = owner(e.sourceID).name;
          s.healing[p] = (s.healing[p] || 0) + amount;
          tick(s.perSec.healing, p, t, amount);
          if (isPlayer(e.targetID) && amount > 0) remember(s, nameOf(e.targetID), { t, kind: "heal", ability: spell(e.abilityGameID), source: p, amount });
        } else if (enemy(e.targetID) && !friendly(e.sourceID) && e.type === "heal" && amount > 0) {
          // (raid healing on a mind-controlled add isn't the enemy healing)
          const key = `${nameOf(e.sourceID)}|${spell(e.abilityGameID)}|${nameOf(e.targetID)}`;
          s.enemyHealed[key] = (s.enemyHealed[key] || 0) + amount;
        }
        break;
      }
      case "cast": {
        if (!isPlayer(e.sourceID) || e.abilityGameID === 1) break; // auto attacks aren't casts
        const c = (s.casts[nameOf(e.sourceID)] ??= {});
        const name = spell(e.abilityGameID);
        c[name] = (c[name] || 0) + 1;
        // Same name, different spell (Restore Mana: a mana potion or a mage's gem).
        const ids = (s.castIds[nameOf(e.sourceID)] ??= {});
        ids[e.abilityGameID] = (ids[e.abilityGameID] || 0) + 1;
        break;
      }
      case "dispel": {
        if (!friendly(e.sourceID)) break;
        const what = spell(e.extraAbilityGameID);
        if (NOT_DISPELS.has(what)) break;
        s.dispels.push({ t, by: owner(e.sourceID).name, target: nameOf(e.targetID), what, with: spell(e.abilityGameID) });
        closeDebuff(s, nameOf(e.targetID), what, t, owner(e.sourceID).name);
        break;
      }
      case "interrupt":
        if (friendly(e.sourceID)) s.interrupts.push({ t, by: owner(e.sourceID).name, target: nameOf(e.targetID), what: spell(e.extraAbilityGameID) });
        break;
      case "resurrect":
        s.resurrects.push({ t, by: nameOf(e.sourceID), target: nameOf(e.targetID), with: spell(e.abilityGameID) });
        break;
      case "applydebuff":
        if (isPlayer(e.targetID)) {
          const d = (s.debuffs[spell(e.abilityGameID)] ??= []);
          d.push({ target: nameOf(e.targetID), from: nameOf(e.sourceID), on: t, off: null, by: null, stacks: 1 });
        }
        break;
      case "applydebuffstack":
        if (isPlayer(e.targetID)) {
          const open = openDebuff(s, nameOf(e.targetID), spell(e.abilityGameID));
          if (open) open.stacks = Math.max(open.stacks, e.stack || 1);
        }
        break;
      case "removedebuff":
        if (isPlayer(e.targetID)) closeDebuff(s, nameOf(e.targetID), spell(e.abilityGameID), t);
        break;
      case "applybuff":
      case "refreshbuff":
      case "applybuffstack":
        if (enemy(e.targetID)) s.bossBuffs.push({ t, type: e.type, target: nameOf(e.targetID), name: spell(e.abilityGameID), stack: e.stack });
        break;
      case "removebuff":
        if (enemy(e.targetID)) s.bossBuffs.push({ t, type: e.type, target: nameOf(e.targetID), name: spell(e.abilityGameID), by: nameOf(e.sourceID) });
        break;
      case "begincast":
        if (enemy(e.sourceID)) s.bossCasts.push({ t, source: nameOf(e.sourceID), name: spell(e.abilityGameID) });
        break;
      case "combatantinfo": {
        // Buffs each raider had at the pull: [name, icon] (consumables, world buffs).
        const p = nameOf(e.sourceID);
        if (p && (e.auras || []).length) s.auras[p] = e.auras.map((x) => [x.name, x.icon]);
        break;
      }
      case "death": {
        if (!isPlayer(e.targetID) || e.feign) break; // Feign Death logs as a death
        const p = nameOf(e.targetID);
        const window = (s.recent.get(p) || []).filter((r) => r.t >= t - RECAP_MS);
        const dmg = window.filter((r) => r.kind === "dmg");
        const last = dmg[dmg.length - 1];
        s.deaths.push({
          t,
          player: p,
          killingBlow: e.killingAbilityGameID ? spell(e.killingAbilityGameID) : last?.ability ?? null,
          killer: e.killerID != null && e.killerID >= 0 ? nameOf(e.killerID) : last?.source ?? null,
          overkill: dmg.findLast((r) => r.overkill > 0)?.overkill || 0,
          // who did the most damage in the window: { name, type } (type = class for a raid member)
          topSource: topSource(dmg, actor),
          recap: {
            damage: sumBy(dmg, (r) => `${r.ability}|${r.source}`).map(([k, total]) => ({ ability: k.split("|")[0], source: k.split("|")[1], total })),
            healed: window.filter((r) => r.kind === "heal").reduce((n, r) => n + r.amount, 0),
            // health on the way down: [seconds before death, hp%]
            hp: dmg.filter((r) => r.hp != null).map((r) => [Math.round((r.t - t) / 100) / 10, r.hp]),
          },
        });
        s.recent.delete(p);
        break;
      }
    }
  }

  for (const s of Object.values(out)) {
    delete s.recent;
    s.enemyHealed = Object.entries(s.enemyHealed)
      .map(([k, total]) => ({ who: k.split("|")[0], name: k.split("|")[1], target: k.split("|")[2], total }))
      .sort((a, b) => b.total - a.total);
    s.takenTotal = Object.values(s.taken).reduce((n, a) => n + a.total, 0);
  }
  return keep ? { fights: out, events: kept } : out;

  function isBoss(f, id) {
    return bossIds.get(f.id)?.has(id) && actor.get(id)?.subType === "Boss";
  }
}

function tick(series, player, t, amount) {
  if (!amount || t < 0) return;
  const l = (series[player] ??= []);
  const i = Math.floor(t / 1000);
  while (l.length <= i) l.push(0);
  l[i] += amount;
}

function remember(s, player, r) {
  const list = s.recent.get(player) || [];
  list.push(r);
  while (list.length && list[0].t < r.t - RECAP_MS) list.shift();
  s.recent.set(player, list);
}

// Boss health, one sample per boss per second.
function sampleHp(s, id, t, hp) {
  const sec = Math.floor(t / 1000);
  const last = s.bossHp[s.bossHp.length - 1];
  if (last && last[0] === sec && last[1] === id) return;
  s.bossHp.push([sec, id, hp]);
}

function openDebuff(s, target, name) {
  const list = s.debuffs[name];
  if (!list) return null;
  for (let i = list.length - 1; i >= 0; i--) if (list[i].target === target && list[i].off == null) return list[i];
  return null;
}
// A dispel and its removedebuff come in either order; `by` marks who dispelled it.
function closeDebuff(s, target, name, t, by) {
  const d = openDebuff(s, target, name) || (by && s.debuffs[name]?.findLast((x) => x.target === target && x.off != null && t - x.off <= 100));
  if (!d) return;
  if (d.off == null) d.off = t;
  if (by) d.by = by;
}

function topSource(dmg, actor) {
  const m = new Map();
  for (const r of dmg) m.set(r.sourceId, (m.get(r.sourceId) || 0) + r.amount);
  const id = [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const a = actor.get(id);
  if (!a) return null;
  return { name: a.name, type: a.type === "Player" ? a.subType : a.subType === "Boss" ? "Boss" : "NPC" };
}

function sumBy(list, key) {
  const m = new Map();
  for (const r of list) m.set(key(r), (m.get(key(r)) || 0) + r.amount);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}
