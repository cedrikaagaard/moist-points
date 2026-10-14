// "Fair parse": a just-for-fun estimate of each DPS's parse with things outside
// their control (or outside their skill) adjusted away. Shown next to the real
// Warcraft Logs parse on the night-boss pages, clearly labelled as an estimate.
//
//   npm run raids:fair                 rebuild everything (reads data/events/, no API)
//   npm run raids:fair -- --night <raid id>   one raid (uses the saved model)
//
// For every kill of every raid that has its full combat log on disk:
//   1. extract per raider: time a mechanic took them out (picked by a mechanic,
//      mind-controlled, teleported, crowd-controlled by a mind-controlled raider,
//      killed by a raider), job casts (decurses, Tranquilizing Shots, sheeping...),
//      world buffs, consumables and gear at the pull. (No Ignite fix: Warcraft
//      Logs' rankings already credit each mage with the Ignite from their crits.)
//      (cached in data/fair-cache/, git-ignored)
//   2. fit from Moist's own logs: how much each world buff / consumable / item
//      level is worth per class (same raider on other nights, against their
//      classmates on the same pull), and each boss+class DPS -> parse curve
//   3. write src/raids/data/fair/<raid id>.json (factors per toggle + the curves,
//      the page combines whichever toggles are on) and fair/model.json (what the
//      fit found, shown in the explainer).
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { hasEvents, readEvents } from "./derive.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATA = path.join(ROOT, "src/raids/data");
const OUT = path.join(DATA, "fair");
const CACHE = path.join(ROOT, "data/fair-cache");
const VERSION = 5; // bump to re-extract every cached night
const arg = (k) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : null);
const ONLY = arg("--night");
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const readGz = (p) => JSON.parse(zlib.gunzipSync(fs.readFileSync(p)).toString("utf8"));
const r2 = (x) => Math.round(x * 100) / 100;
const r3 = (x) => Math.round(x * 1000) / 1000;

// ---------------------------------------------------------------- what counts
// Effects that stop a raider acting, aimed at one or a few people (so not
// already in every guild's parses the way Web Spray or a raid-wide fear is).
// Spell ids from a scan of the guild's own logs: 94-100% of the time the
// target did nothing at all while one of these was on.
const PICKED = new Map([
  [28622, "Web Wrap"], [28522, "Icebolt (ice block)"], [27808, "Frost Blast"],
  [26180, "Wyvern Sting"], [24335, "Wyvern Sting"], [24053, "Hex"], [720, "Entangle"], [731, "Entangle"], [1121, "Entangle"],
  [23603, "Wild Polymorph"], [22274, "Greater Polymorph"], [25725, "Paralyze"], [24664, "Sleep"],
]);
// Mind control on a raider: their swings still log as theirs, so it has to be by name.
const MIND_CONTROL = new Map([
  [28410, "Chains of Kel'Thuzad"], [28408, "Chains of Kel'Thuzad"], [20604, "Dominate Mind"], [14515, "Dominate Mind"],
  [24327, "Cause Insanity"], [26079, "Cause Insanity"], [785, "True Fulfillment"], [24261, "Brain Wash"], [22667, "Shadow Command"], [24178, "Will of Hakkar"],
]);
// Crowd control from another raider (always about a mind control: the raid
// sheeping a controlled raider, or a controlled warrior shouting).
const FROM_RAIDER = /^(Polymorph|Fear|Blind|Psychic Scream|Hammer of Justice|Intimidating Shout|Howl of Terror|Death Coil|Scatter Shot|Gouge|Sleep|Repentance|Cheap Shot|Kidney Shot|Seduction|Hibernate|Fall down)$/;
const SILENCE_CASTERS = new Map([[26053, "Noxious Poison"]]); // casters only (warriors keep swinging)
const CASTER = new Set(["Mage", "Warlock", "Priest"]); // DPS paladins and druids hit things
const PHYSICAL = new Set(["Warrior", "Rogue", "Hunter"]);
// Casts on the global cooldown that are a job, not damage (1.5 s each).
// Potions and racials that log as a cure (Elixir of Poison Resistance, Stoneform...).
const SELF_CURES = new Set([26677, 3592, 23786, 11359, 20594]);
const JOB_CASTS = /^(Remove Lesser Curse|Remove Curse|Dispel Magic|Abolish Disease|Cure Disease|Abolish Poison|Cure Poison|Cleanse|Purify|Tranquilizing Shot|Polymorph|Shackle Undead|Fear|Psychic Scream|Hammer of Justice|Blind|Innervate|Rebirth|Fear Ward|Power Infusion|Mind Control)$/;

const WORLD_BUFFS = [
  ["Rallying Cry", /^Rallying Cry of the Dragonslayer$/],
  ["Spirit of Zandalar", /^Spirit of Zandalar$/],
  ["Songflower", /^Songflower Serenade$/],
  ["Warchief's Blessing", /^(Warchief's Blessing|Might of Stormwind)$/],
  ["Fengus' Ferocity", /^Fengus' Ferocity$/],
  ["Mol'dar's Moxie", /^Mol'dar's Moxie$/],
  ["Slip'kik's Savvy", /^Slip'kik's Savvy$/],
  ["Sayge's fortune (damage)", /^Sayge's Dark Fortune of Damage$/],
];
// What can actually move each class's damage (the fit only looks at these, so a
// warlock's Juju Power can't get credit just because careful raiders use both).
const MELEE_WB = ["Rallying Cry", "Spirit of Zandalar", "Songflower", "Warchief's Blessing", "Fengus' Ferocity", "Sayge's fortune (damage)"];
const CASTER_WB = ["Rallying Cry", "Spirit of Zandalar", "Songflower", "Slip'kik's Savvy", "Sayge's fortune (damage)"];
// (only things that add damage: no Titans, Zanza or Fortitude, those are health)
const MELEE_CONS = ["Elixir of the Mongoose", "Elixir of the Giants", "Greater Agility", "Elixir of Brute Force", "Juju Power", "Juju Might", "Juju Flurry", "Rage of Ages", "Strike of the Scorpok", "Winterfall Firewater", "Increased Agility", "Blessed Sunfruit"];
const CASTER_CONS = ["Supreme Power", "Greater Arcane Elixir", "Greater Firepower", "Shadow Power", "Frost Power"];
const RELEVANT = {
  Warrior: [MELEE_WB, MELEE_CONS], Rogue: [MELEE_WB, MELEE_CONS], Paladin: [MELEE_WB, MELEE_CONS], Druid: [MELEE_WB, MELEE_CONS],
  Hunter: [["Rallying Cry", "Spirit of Zandalar", "Songflower", "Fengus' Ferocity", "Sayge's fortune (damage)"], ["Elixir of the Mongoose", "Greater Agility", "Juju Might", "Strike of the Scorpok", "Increased Agility"]],
  Mage: [CASTER_WB, CASTER_CONS], Warlock: [CASTER_WB, CASTER_CONS], Priest: [CASTER_WB, CASTER_CONS], Shaman: [CASTER_WB, CASTER_CONS],
};
const CONSUMES = [
  "Flask of the Titans", "Supreme Power",
  "Elixir of the Mongoose", "Elixir of the Giants", "Greater Agility", "Elixir of Brute Force", "Greater Arcane Elixir",
  "Greater Firepower", "Shadow Power", "Frost Power",
  "Juju Power", "Juju Might", "Juju Flurry",
  "Spirit of Zanza", "Rage of Ages", "Strike of the Scorpok", "Swiftness of Zanza",
  "Winterfall Firewater", "Increased Agility", "Blessed Sunfruit", "Well Fed", "Increased Intellect", "Mana Regeneration",
];

// ---------------------------------------------------------------- 1. extract
function nightFiles() {
  return fs.readdirSync(path.join(DATA, "nights")).filter((f) => /^\d{4}-\d\d-\d\d-.+\.json$/.test(f)).map((f) => f.replace(/\.json$/, "")).sort();
}

function extractNight(raidId) {
  const n = read(path.join(DATA, "nights", `${raidId}.json`));
  const date = n.date || raidId.slice(0, 10);
  const kills = [];
  for (const b of n.bosses) {
    const p = b.pulls.find((x) => x.kill);
    if (p?.src?.code && p.src.fight != null && b.parses?.length) kills.push({ b, p });
  }
  const byCode = new Map();
  for (const k of kills) if (hasEvents(date, k.p.src.code)) (byCode.get(k.p.src.code) || byCode.set(k.p.src.code, []).get(k.p.src.code)).push(k);
  if (!byCode.size) return null;
  const out = { v: VERSION, night: raidId, kills: {} };
  for (const [code, list] of byCode) {
    const report = readGz(path.join(ROOT, "data/wcl/reports", `${code}.json.gz`));
    const actor = new Map(report.masterData.actors.map((a) => [a.id, a]));
    const abil = new Map((report.masterData.abilities || []).map((a) => [a.gameID, a.name]));
    const fights = new Map(list.map((k) => [k.p.src.fight, k]));
    const fmeta = new Map(report.fights.map((f) => [f.id, f]));
    const isP = (id) => actor.get(id)?.type === "Player";
    const nm = (id) => actor.get(id)?.name;
    const st = {}; // fight -> state
    for (const e of readEvents(date, code)) {
      const k = fights.get(e.fight);
      if (!k) continue;
      const f = fmeta.get(e.fight);
      const s = (st[e.fight] ??= { start: f.startTime, end: f.endTime, pl: {} });
      const t = (e.timestamp - s.start) / 1000;
      const P = (id) => (s.pl[nm(id)] ??= { acts: [], any: [], pos: [], cc: [], open: {}, casts: {}, deaths: [] });
      // anything at all involving the raider (they vanish from the log when out of range)
      if (e.type !== "combatantinfo") {
        if (isP(e.sourceID)) P(e.sourceID).any.push(t);
        if (isP(e.targetID) && e.targetID !== e.sourceID) P(e.targetID).any.push(t);
      }
      // own actions and positions
      if (isP(e.sourceID) && (e.type === "cast" || e.type === "begincast" || ((e.type === "damage" || e.type === "heal") && !e.tick))) {
        const me = P(e.sourceID);
        me.acts.push(t);
        if (e.type === "cast" && e.x != null) me.pos.push([t, e.x, e.y]);
      }
      if (isP(e.targetID) && (e.type === "damage" || e.type === "heal") && e.x != null) P(e.targetID).pos.push([t, e.x, e.y]);
      if (e.type === "cast" && isP(e.sourceID) && e.abilityGameID !== 1) {
        const name = abil.get(e.abilityGameID);
        if (JOB_CASTS.test(name || "") && !SELF_CURES.has(e.abilityGameID)) P(e.sourceID).casts[name] = (P(e.sourceID).casts[name] || 0) + 1;
      }
      // debuffs that take a raider out
      if ((e.type === "applydebuff" || e.type === "removedebuff") && isP(e.targetID)) {
        const id = e.abilityGameID;
        const name = abil.get(id) || "";
        let kind = null;
        if (MIND_CONTROL.has(id)) kind = ["mc", MIND_CONTROL.get(id)];
        else if (PICKED.has(id)) kind = ["picked", PICKED.get(id)];
        else if (SILENCE_CASTERS.has(id)) kind = ["silence", SILENCE_CASTERS.get(id)];
        else if (isP(e.sourceID) && e.sourceID !== e.targetID && FROM_RAIDER.test(name)) kind = ["raider", `${name} from another raider`];
        if (kind) {
          const me = P(e.targetID);
          const key = `${id}`;
          if (e.type === "applydebuff") me.open[key] = [t, kind[0], kind[1]];
          else if (me.open[key]) {
            me.cc.push([me.open[key][0], t, me.open[key][1], me.open[key][2]]);
            delete me.open[key];
          }
        }
      }
      if (e.type === "death" && isP(e.targetID) && !e.feign) {
        const killer = e.killerID != null && e.killerID >= 0 ? actor.get(e.killerID) : null;
        P(e.targetID).deaths.push([t, killer?.type === "Player" && killer.id !== e.targetID ? killer.name : null]);
      }
      if (e.type === "resurrect" && isP(e.targetID)) P(e.targetID).rez = t;
      if (e.type === "combatantinfo" && isP(e.sourceID)) {
        const me = P(e.sourceID);
        me.auras = (e.auras || []).map((a) => a.name);
        me.ilvl = avgIlvl(e.gear || []);
      }
    }
    for (const [fid, s] of Object.entries(st)) {
      const k = fights.get(+fid);
      const dur = (s.end - s.start) / 1000;
      const players = {};
      for (const [name, me] of Object.entries(s.pl)) {
        if (!name || name === "undefined") continue;
        for (const [, o] of Object.entries(me.open)) me.cc.push([o[0], dur, o[1], o[2]]); // never came off
        // a silence only stops casters, so casters get their own list
        const lost = lostTime(me, dur, k.b.encounterId, false);
        const lostCaster = lostTime(me, dur, k.b.encounterId, true);
        players[name] = {
          lost,
          lostCaster,
          jobs: me.casts,
          auras: me.auras || null,
          ilvl: me.ilvl ?? null,
        };
      }
      out.kills[k.b.encounterId] = { dur: r2(dur), present: Object.keys(players).length, players };
    }
  }
  return out;
}

function avgIlvl(gear) {
  // slots 3 (shirt) and 18 (tabard) don't count; an empty off hand next to a
  // two-hander counts the main hand twice.
  const lv = [];
  gear.forEach((g, i) => {
    if (i === 3 || i === 18) return;
    if (g?.id && g.itemLevel) lv.push(g.itemLevel);
    else if (i === 16 && gear[15]?.id && gear[15].itemLevel) lv.push(gear[15].itemLevel);
  });
  return lv.length >= 12 ? Math.round((lv.reduce((a, b) => a + b, 0) / lv.length) * 10) / 10 : null;
}

// Seconds a raider couldn't act through no fault of their own, with reasons.
const HEIGAN = 51112;
// Longest a single effect can take someone out (a missing "removed" event
// would otherwise run to the end of the fight).
const MAX_SEC = { mc: 25, raider: 10, silence: 10, picked: 15 };
const MAX_PICKED = { "Web Wrap": 40, "Icebolt (ice block)": 25, Entangle: 10 };
function lostTime(me, dur, enc, caster) {
  const iv = []; // [from, to, why]
  for (const [a, b, kind, why] of me.cc) {
    if (kind === "silence" && !caster) continue;
    const cap = kind === "picked" ? MAX_PICKED[why] ?? MAX_SEC.picked : MAX_SEC[kind] ?? 15;
    if (b > a) iv.push([a, Math.min(b, dur, a + cap), kind, why]);
  }
  // Teleported: a long gap in their own actions that starts with a jump no
  // one can run (70+ yards in under 6 seconds), e.g. Heigan's teleport.
  const acts = [...me.acts].sort((x, y) => x - y);
  const pos = [...me.pos].sort((x, y) => x[0] - y[0]);
  for (let i = 0; i < acts.length; i++) {
    const a = acts[i];
    const b = i + 1 < acts.length ? acts[i + 1] : dur;
    if (b - a < 12) continue;
    const before = pos.filter((p) => p[0] <= a + 0.5).at(-1);
    if (!before) continue;
    const jump = pos.find((p) => p[0] > a && p[0] < a + 8 && Math.hypot(p[1] - before[1], p[2] - before[2]) / 100 > 70);
    if (jump) iv.push([a, b, "teleport", "teleported away"]);
    // Heigan teleports three raiders into the tunnel at about 0:10 and 0:40,
    // mostly out of the logger's range: they all but vanish from the log
    // (a stray event every few seconds instead of several a second).
    else if (enc === HEIGAN && a >= 4 && a <= 50 && me.any.filter((t) => t > a + 2 && t < b).length < 0.6 * (b - a - 2)) iv.push([a, b, "teleport", "teleported by Heigan"]);
  }
  // Killed by a raider (a mind-controlled one, someone's Living Bomb...): the rest of the fight.
  for (const [t, killer] of me.deaths) if (killer) iv.push([t, me.rez && me.rez > t ? me.rez : dur, "killed", `killed by ${killer}`]);
  // merge overlaps, keep the first reason
  iv.sort((x, y) => x[0] - y[0]);
  const merged = [];
  for (const x of iv) {
    const last = merged.at(-1);
    if (last && x[0] <= last[1]) {
      if (x[1] > last[1]) last[1] = x[1];
      if (!last.why.includes(x[3])) last.why.push(x[3]);
    } else merged.push(Object.assign([x[0], x[1]], { kind: x[2], why: [x[3]] }));
  }
  return merged.map((m) => ({ from: r2(m[0]), to: r2(m[1]), kinds: m.kind, why: m.why }));
}

function loadCache(raidId) {
  const p = path.join(CACHE, `${raidId}.json`);
  if (fs.existsSync(p)) {
    const c = read(p);
    if (c.v === VERSION) return c;
  }
  const c = extractNight(raidId);
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(c || { v: VERSION, none: true }));
  return c;
}

// ---------------------------------------------------------------- 2. fit
const median = (l) => {
  if (!l.length) return null;
  const s = [...l].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const wbHas = (auras) => WORLD_BUFFS.map(([, re]) => (auras.some((a) => re.test(a)) ? 1 : 0));
const consHas = (auras) => CONSUMES.map((c) => (auras.includes(c) ? 1 : 0));

// A pull where most of the raid shows no world buffs but the night had them:
// buffs stored in a Chronoboon for that boss (Razuvious, Gothik, Skeram, Vael).
function chronoboonPulls(cache) {
  const cover = {};
  for (const [enc, k] of Object.entries(cache.kills)) {
    const list = Object.values(k.players).filter((p) => p.auras);
    cover[enc] = list.length ? list.filter((p) => wbHas(p.auras).some(Boolean)).length / list.length : null;
  }
  const max = Math.max(0, ...Object.values(cover).filter((x) => x != null));
  return new Set(Object.entries(cover).filter(([, c]) => c != null && max >= 0.6 && c < 0.25).map(([e]) => e));
}

function buildRows(all) {
  const roster = read(path.join(DATA, "roster.json"));
  const classOf = (name) => roster[name]?.class || null;
  const rows = [];
  for (const { raidId, n, cache } of all) {
    const chrono = chronoboonPulls(cache);
    for (const b of n.bosses) {
      const k = cache.kills[b.encounterId];
      if (!k) continue;
      for (const p of b.parses || []) {
        if (p.role !== "dps" || !(p.amount > 50) || p.pct == null) continue;
        const me = k.players[p.player];
        const cls = classOf(p.player);
        if (!me || !cls || !me.auras) continue;
        rows.push({ raidId, enc: b.encounterId, player: p.player, cls, amount: p.amount, pct: p.pct, chrono: chrono.has(String(b.encounterId)), wb: wbHas(me.auras), cons: consHas(me.auras), ilvl: me.ilvl });
      }
    }
  }
  return rows;
}

// Per class: log(dps) against world buffs, consumables and item level, with the
// raider's own level and each pull's class level taken out (fixed effects, a few
// rounds of alternating least squares, a little ridge to keep it calm).
function fitClass(rows, cls) {
  const [wbOk, consOk] = RELEVANT[cls] || [[], []];
  const K = WORLD_BUFFS.length + CONSUMES.length + 1;
  const use = [...WORLD_BUFFS.map(([name]) => wbOk.includes(name)), ...CONSUMES.map((c) => consOk.includes(c)), true];
  const raw = rows.map((r) => [...(r.chrono ? WORLD_BUFFS.map(() => null) : r.wb), ...r.cons, r.ilvl ?? null].map((v, j) => (use[j] ? v : null)));
  const colMean = [];
  for (let j = 0; j < K; j++) {
    const v = raw.map((x) => x[j]).filter((x) => x != null);
    colMean[j] = v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  }
  // centred; unknown (a Chronoboon pull, no gear) = the mean, so it says nothing
  const X = raw.map((x) => x.map((v, j) => (v == null ? 0 : v - colMean[j])));
  const y = rows.map((r) => Math.log(r.amount));
  const pullKey = rows.map((r) => `${r.raidId}|${r.enc}`);
  const beta = new Array(K).fill(0);
  const pred = new Array(rows.length).fill(0); // X·beta, kept up to date
  let pe = new Map();
  let ae = new Map();
  for (let it = 0; it < 15; it++) {
    // pull effects (how that kill went for the class), then each raider's own level
    pe = groupMean(rows.map((r, i) => [pullKey[i], y[i] - (ae.get(r.player) || 0) - pred[i]]));
    ae = groupMean(rows.map((r, i) => [r.player, y[i] - pe.get(pullKey[i]) - pred[i]]));
    const base = rows.map((r, i) => y[i] - pe.get(pullKey[i]) - ae.get(r.player));
    // coefficients, one at a time (coordinate descent with a little ridge)
    for (let j = 0; j < K; j++) {
      let num = 0;
      let den = 0;
      for (let i = 0; i < rows.length; i++) {
        const xj = X[i][j];
        if (!xj) continue;
        num += xj * (base[i] - pred[i] + beta[j] * xj);
        den += xj * xj;
      }
      const lambda = j === K - 1 ? 50 : 8;
      const nb = den > 0 ? num / (den + lambda) : 0;
      const d = nb - beta[j];
      if (d) for (let i = 0; i < rows.length; i++) if (X[i][j]) pred[i] += d * X[i][j];
      beta[j] = nb;
    }
  }
  // What each feature is worth, kept in a believable range (no negative buffs)
  // and taken down by a fifth: raiders who bring everything also tend to play
  // better, which the fit can't fully separate from the buffs themselves.
  const SHRINK = 0.8;
  const wb = Object.fromEntries(WORLD_BUFFS.map(([name], j) => [name, r3(SHRINK * clamp(beta[j], 0, 0.2))]));
  const cons = Object.fromEntries(CONSUMES.map((c, j) => [c, r3(SHRINK * clamp(beta[WORLD_BUFFS.length + j], 0, 0.12))]));
  const perIlvl = r3(SHRINK * clamp(beta[K - 1], 0, 0.015)); // gear and skill go together, so keep this modest
  // the class's usual consumables: on at least half of its pulls this last half year
  const newest = rows.reduce((m, r) => (r.raidId > m ? r.raidId : m), "");
  const since = new Date(new Date(newest.slice(0, 10)).getTime() - 182 * 864e5).toISOString().slice(0, 10);
  const recent = rows.filter((r) => r.raidId >= since);
  const usual = CONSUMES.filter((c, j) => consOk.includes(c) && recent.filter((r) => r.cons[j]).length >= recent.length * 0.5);
  return { n: rows.length, wb, cons, perIlvl, usual };
}
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
function groupMean(pairs) {
  const s = new Map();
  for (const [k, v] of pairs) {
    const a = s.get(k) || [0, 0];
    a[0] += v;
    a[1]++;
    s.set(k, a);
  }
  return new Map([...s].map(([k, [t, c]]) => [k, t / c]));
}

// Boss+class: DPS -> parse, from the guild's own (DPS, parse) pairs, newest year
// first, made monotone (pool adjacent violators) and thinned to ~24 points.
function fitCurves(all) {
  const roster = read(path.join(DATA, "roster.json"));
  const pts = {};
  const newest = all.at(-1)?.raidId.slice(0, 10) || "9999";
  const cutoff = new Date(new Date(newest).getTime() - 365 * 864e5).toISOString().slice(0, 10);
  for (const f of nightFiles()) {
    const n = read(path.join(DATA, "nights", `${f}.json`));
    for (const b of n.bosses) {
      for (const p of b.parses || []) {
        const cls = roster[p.player]?.class;
        if (p.role !== "dps" || !(p.amount > 50) || p.pct == null || !cls) continue;
        (pts[`${b.encounterId}|${cls}`] ??= []).push([p.amount, p.pct, f.slice(0, 10) >= cutoff]);
      }
    }
  }
  const curves = {};
  for (const [key, list] of Object.entries(pts)) {
    let use = list.filter((p) => p[2]);
    if (use.length < 25) use = list;
    if (use.length < 12) continue;
    use.sort((a, b) => a[0] - b[0]);
    // pool adjacent violators on pct
    const blocks = [];
    for (const [x, yv] of use) {
      blocks.push({ x: [x], y: yv, w: 1 });
      while (blocks.length > 1 && blocks.at(-2).y > blocks.at(-1).y) {
        const b2 = blocks.pop();
        const b1 = blocks.pop();
        blocks.push({ x: [...b1.x, ...b2.x], y: (b1.y * b1.w + b2.y * b2.w) / (b1.w + b2.w), w: b1.w + b2.w });
      }
    }
    const pairs = blocks.map((b) => [median(b.x), b.y]);
    const step = Math.max(1, Math.floor(pairs.length / 24));
    const thin = pairs.filter((_, i) => i % step === 0 || i === pairs.length - 1).map(([x, yv]) => [Math.round(x), Math.round(yv * 10) / 10]);
    curves[key] = thin;
  }
  return curves;
}

// ---------------------------------------------------------------- 3. write
function nightOutput(raidId, n, cache, model, curves) {
  const roster = read(path.join(DATA, "roster.json"));
  const chrono = chronoboonPulls(cache);
  const out = { night: raidId, version: 1, bosses: {} };
  // world buffs a raider had at the last pull before a Chronoboon pull
  const lastWb = {};
  for (const b of n.bosses) {
    const k = cache.kills[b.encounterId];
    if (!k) continue;
    const players = [];
    const ilvlByClass = {};
    for (const [name, me] of Object.entries(k.players)) if (me.ilvl && roster[name]) (ilvlByClass[roster[name].class] ??= []).push(me.ilvl);
    const curvesHere = {};
    for (const p of b.parses || []) {
      if (p.role !== "dps" || !(p.amount > 0) || p.pct == null) continue;
      const cls = roster[p.player]?.class;
      const me = k.players[p.player];
      const fit = model.classes[cls];
      if (!cls || !me || !fit) continue;
      const dur = k.dur;
      const adj = {};
      // mechanics: time out of their hands
      const lostList = (CASTER.has(cls) ? me.lostCaster : me.lost) || [];
      const total = lostList.reduce((t, l) => t + (l.to - l.from), 0);
      const lost = Math.min(total, dur * 0.5); // past that there's too little left to judge (the page shows n/a)
      if (lost >= 1) adj.mech = { f: r3(dur / (dur - lost)), sec: Math.round(total), why: [...new Set(lostList.flatMap((l) => l.why.map((w) => w.replace(" from a mind-controlled raid", " from another raider"))))] };
      // jobs: casts that were a job (1.5 s each)
      const jobCasts = Object.entries(me.jobs || {}).filter(([name]) => !(name === "Fear Ward" || name === "Power Infusion") || PHYSICAL.has(cls) === false);
      const jobN = jobCasts.reduce((t, [, c]) => t + c, 0);
      let jobF = jobN ? dur / Math.max(dur - jobN * 1.5, dur * 0.65) : 1; // a third of the fight at most
      const jobWhy = jobCasts.sort((a, b2) => b2[1] - a[1]).map(([name, c]) => `${c}× ${name}`);
      if (Math.abs(jobF - 1) >= 0.005) adj.jobs = { f: r3(jobF), why: jobWhy };
      // world buffs: as if the full set (a Chronoboon pull uses the buffs they had stored)
      let auras = me.auras;
      if (chrono.has(String(b.encounterId))) auras = lastWb[p.player] || null;
      if (auras) {
        const has = wbHas(auras);
        const missing = WORLD_BUFFS.map(([name], j) => (!has[j] && fit.wb[name] > 0.002 ? name : null)).filter(Boolean);
        const lf = missing.reduce((t, name) => t + fit.wb[name], 0);
        adj.wb = { f: r3(Math.exp(lf)), missing };
      }
      // consumables: as if the class's usual set, no more and no less
      if (me.auras) {
        const has = new Set(me.auras);
        const missing = fit.usual.filter((c) => !has.has(c) && fit.cons[c] > 0.002);
        const extra = CONSUMES.filter((c) => has.has(c) && !fit.usual.includes(c) && fit.cons[c] > 0.002);
        const lf = missing.reduce((t, c) => t + fit.cons[c], 0) - extra.reduce((t, c) => t + fit.cons[c], 0);
        adj.cons = { f: r3(Math.exp(lf)), missing, extra };
      }
      // gear: as if their average item level were the class median that night
      const ref = median(ilvlByClass[cls] || []);
      if (me.ilvl && ref && fit.perIlvl > 0) adj.gear = { f: r3(Math.exp(fit.perIlvl * (ref - me.ilvl))), ilvl: me.ilvl, ref: Math.round(ref * 10) / 10 };
      players.push({ name: p.player, cls, dps: p.amount, pct: p.pct, adj });
      const c = curves[`${b.encounterId}|${cls}`];
      if (c) curvesHere[cls] = c;
    }
    // remember world buffs for a later Chronoboon pull
    if (!chrono.has(String(b.encounterId))) for (const [name, me] of Object.entries(k.players)) if (me.auras) lastWb[name] = me.auras;
    if (players.length) out.bosses[b.encounterId] = { dur: k.dur, chronoboon: chrono.has(String(b.encounterId)) || undefined, curves: curvesHere, players };
  }
  return Object.keys(out.bosses).length ? out : null;
}

// ---------------------------------------------------------------- main
const ids = nightFiles();
const all = [];
let extracted = 0;
for (const raidId of ids) {
  const n = read(path.join(DATA, "nights", `${raidId}.json`));
  const fresh = !fs.existsSync(path.join(CACHE, `${raidId}.json`));
  const cache = loadCache(raidId);
  if (fresh) extracted++;
  if (cache && !cache.none) all.push({ raidId, n, cache });
  if (fresh && extracted % 20 === 0) console.log(`extracted ${extracted} raids...`);
}
console.log(`${all.length} raids with full logs (${extracted} newly extracted)`);

let model;
const modelPath = path.join(OUT, "model.json");
if (ONLY && fs.existsSync(modelPath) && fs.existsSync(path.join(CACHE, "curves.json"))) model = { ...read(modelPath), curves: read(path.join(CACHE, "curves.json")) };
else {
  const rows = buildRows(all);
  const byClass = {};
  for (const r of rows) (byClass[r.cls] ??= []).push(r);
  model = { generatedAt: new Date().toISOString(), rows: rows.length, worldBuffs: WORLD_BUFFS.map(([n]) => n), classes: {} };
  for (const [cls, list] of Object.entries(byClass)) if (list.length >= 300 && RELEVANT[cls]) model.classes[cls] = fitClass(list, cls);
  model.curves = fitCurves(all);
}
fs.mkdirSync(OUT, { recursive: true });
let written = 0;
for (const { raidId, n, cache } of all) {
  if (ONLY && raidId !== ONLY) continue;
  const o = nightOutput(raidId, n, cache, model, model.curves);
  if (!o) continue;
  fs.writeFileSync(path.join(OUT, `${raidId}.json`), JSON.stringify(o));
  written++;
}
// the page only needs what the fit found (the explainer); curves stay local
const { curves, ...modelOut } = model;
fs.writeFileSync(modelPath, JSON.stringify(modelOut));
fs.writeFileSync(path.join(CACHE, "curves.json"), JSON.stringify(curves));
console.log(`wrote ${written} raid files and model.json`);
for (const [cls, m] of Object.entries(model.classes)) {
  console.log(`${cls.padEnd(8)} n=${m.n} perIlvl=${m.perIlvl} usual=[${m.usual.join(", ")}]`);
  console.log("   wb:", Object.entries(m.wb).filter(([, v]) => v).map(([k, v]) => `${k} ${(v * 100).toFixed(1)}%`).join(", "));
  console.log("   cons:", Object.entries(m.cons).filter(([, v]) => v).map(([k, v]) => `${k} ${(v * 100).toFixed(1)}%`).join(", "));
}
