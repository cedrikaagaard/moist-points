// Raw combat log -> a Warcraft-Logs-shaped report on disk, for nights when
// Warcraft Logs is down. Reads WoWCombatLog*.txt (Advanced Combat Logging on),
// one or several files (the client starts a new file per session, and a raid
// can be spread over a few), and writes exactly what fetch.mjs reads from the
// archive, so the normal offline rebuild does the rest:
//   data/wcl/reports.json                      + an entry per night (code MOIST...)
//   data/wcl/reports/<code>.json.gz            fights, actors, abilities
//   data/events/<date>/<code>/page-*.json.gz   the event stream, WCL event shape
//   data/wcl/fights/<code>-rankings-<h>.json.gz estimated parses
//
//   node scripts/raids/rawlog.mjs <file|folder>... --inspect   field layout per event type (check a new file first)
//   node scripts/raids/rawlog.mjs <file|folder>... --list      the nights, raids and pulls found
//   node scripts/raids/rawlog.mjs <file|folder>... --write [--owner Name] [--night 2026-10-21]
// then:  npm run raids:fetch -- --rebuild --night <date>   (and replays, fair, biggles as usual)
//
// Parses: Warcraft Logs' rankings don't exist for these nights, so they're
// estimated from the guild's own DPS -> parse history per boss and class
// (healers: against the guild's own healing history). Marked as estimates.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { nightOf } from "./stitch.mjs";
import { hasEvents, deriveLog } from "./derive.mjs";
import { zoneForEncounter } from "../../src/raids/aggregate.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW = path.join(ROOT, "data/wcl");
const DATA = path.join(ROOT, "src/raids/data");
const CACHE = path.join(ROOT, "data/fair-cache");
const argv = process.argv.slice(2);
const flag = (k) => argv.includes(k);
const opt = (k) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : null);
const inputs = argv.filter((a, i) => !a.startsWith("--") && !["--owner", "--night", "--year"].includes(argv[i - 1]));
const TZ = "Europe/Copenhagen";
// the site owner parses 100 to 105 on raw-log nights, a different number per boss
const JOKE = { Drikkle: (enc) => 100 + (crypto.createHash("sha1").update(`drikkle${enc}`).digest()[0] % 6) };

const readGz = (p) => JSON.parse(zlib.gunzipSync(fs.readFileSync(p)).toString("utf8"));
const writeGz = (p, d) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, zlib.gzipSync(JSON.stringify(d), { level: 9 }));
};

// ---------------------------------------------------------------- reading
function files() {
  const out = [];
  for (const a of inputs) {
    if (!fs.existsSync(a)) throw new Error(`no such file: ${a}`);
    if (fs.statSync(a).isDirectory()) for (const f of fs.readdirSync(a).sort()) { if (/\.txt$/i.test(f)) out.push(path.join(a, f)); }
    else out.push(a);
  }
  if (!out.length) throw new Error("usage: node scripts/raids/rawlog.mjs <WoWCombatLog.txt or folder>... --inspect|--list|--write");
  return out;
}

// "10/21/2026 20:15:33.1234-2  EVENT,..." (newer clients) or "10/21 20:15:33.123  EVENT,..."
const LINE = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))? (\d{1,2}):(\d{2}):(\d{2})\.(\d{1,4})(?:[+-]\d+)?\s+(.*)$/;
const offsets = new Map(); // local hour -> UTC offset, Intl is too slow to run per line
function epochOf(y, mo, d, h, mi, s, frac) {
  const ms = Math.round(Number(`0.${frac}`) * 1000);
  const guess = Date.UTC(y, mo - 1, d, h, mi, s, ms);
  const hk = Date.UTC(y, mo - 1, d, h);
  if (offsets.has(hk)) return guess - offsets.get(hk);
  // local Copenhagen time -> UTC
  const off = (t) => {
    const p = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(t));
    const g = Object.fromEntries(p.map((x) => [x.type, x.value]));
    return Date.UTC(+g.year, +g.month - 1, +g.day, +g.hour, +g.minute, +g.second) - Math.floor(t / 1000) * 1000;
  };
  const o = off(guess - off(guess));
  offsets.set(hk, o);
  return guess - o;
}

// CSV with quotes, and nested (...) / [...] kept as one raw token.
function split(s) {
  const out = [];
  let cur = "";
  let depth = 0;
  let q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') q = false;
      else cur += c;
      continue;
    }
    if (c === '"') { q = true; continue; }
    if (c === "(" || c === "[") depth++;
    if (c === ")" || c === "]") depth--;
    if (c === "," && depth === 0) { out.push(cur); cur = ""; continue; }
    cur += c;
  }
  out.push(cur);
  return out;
}

async function* lines() {
  const list = files();
  // Overlapping files: a line already read from an earlier file is skipped, as
  // many times as it appeared there (the same line twice in one file is real).
  const seen = list.length > 1 ? new Map() : null;
  const year = +(opt("--year") || new Date().getFullYear());
  for (const f of list) {
    const used = new Map();
    const added = new Map();
    const rl = readline.createInterface({ input: fs.createReadStream(f, { encoding: "utf8" }), crlfDelay: Infinity });
    for await (const raw of rl) {
      const m = LINE.exec(raw);
      if (!m) continue;
      if (seen) {
        const key = crypto.createHash("md5").update(raw).digest("base64");
        const u = used.get(key) || 0;
        if (u < (seen.get(key) || 0)) { used.set(key, u + 1); continue; }
        added.set(key, (added.get(key) || 0) + 1);
      }
      const y = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : year;
      const t = epochOf(y, +m[1], +m[2], +m[4], +m[5], +m[6], m[7]);
      const body = m[8];
      const comma = body.indexOf(",");
      yield { t, ev: comma < 0 ? body : body.slice(0, comma), f: comma < 0 ? [] : split(body.slice(comma + 1)), raw };
    }
    if (seen) for (const [k, n] of added) seen.set(k, (seen.get(k) || 0) + n);
  }
}

// ---------------------------------------------------------------- inspect
async function inspect() {
  const by = new Map();
  let n = 0;
  let first = null;
  let last = null;
  for await (const l of lines()) {
    n++;
    first ??= l.t;
    last = l.t;
    const b = by.get(l.ev) || { n: 0, lens: new Map(), ex: [] };
    b.n++;
    b.lens.set(l.f.length, (b.lens.get(l.f.length) || 0) + 1);
    if (b.ex.length < 2) b.ex.push(l.raw.slice(0, 400));
    by.set(l.ev, b);
  }
  console.log(`${n.toLocaleString()} lines, ${new Date(first).toISOString()} -> ${new Date(last).toISOString()}`);
  for (const [ev, b] of [...by].sort((a, c) => c[1].n - a[1].n)) {
    console.log(`\n${ev}  ${b.n.toLocaleString()}  field counts: ${[...b.lens].map(([k, v]) => `${k}×${v}`).join(" ")}`);
    for (const e of b.ex) console.log(`   ${e}`);
  }
}

// ---------------------------------------------------------------- dictionaries from our archive
function archive() {
  const icon = new Map();
  const spellName = new Map();
  const npcType = new Map(); // gameID -> subType (Boss / NPC)
  const bossName = new Map(); // encounterID -> name
  for (const f of fs.readdirSync(path.join(RAW, "reports"))) {
    if (!f.endsWith(".json.gz") || f.includes("-detail")) continue;
    let r;
    try { r = readGz(path.join(RAW, "reports", f)); } catch { continue; }
    if (!r?.masterData) continue;
    for (const a of r.masterData.abilities || []) {
      if (a.icon && !icon.has(a.gameID)) icon.set(a.gameID, a.icon);
      if (a.name && !spellName.has(a.gameID)) spellName.set(a.gameID, a.name);
    }
    for (const a of r.masterData.actors || []) if (a.type === "NPC" && a.gameID) if (a.subType === "Boss" || !npcType.has(a.gameID)) npcType.set(a.gameID, a.subType);
    for (const fi of r.fights || []) if (fi.encounterID && !bossName.has(fi.encounterID)) bossName.set(fi.encounterID, fi.name);
  }
  const roster = JSON.parse(fs.readFileSync(path.join(DATA, "roster.json"), "utf8"));
  return { icon, spellName, npcType, bossName, roster };
}

// ---------------------------------------------------------------- parsing into nights
const isGuid = (s) => /^(Player|Creature|Pet|Vehicle|GameObject|Item)-/.test(s || "") || s === "0000000000000000";
const playerName = (s) => (s || "").split("-")[0];
const PREFIX = (ev) => (ev.startsWith("SWING_") ? 0 : ev.startsWith("ENVIRONMENTAL_") ? 0 : /^(RANGE_|SPELL_|DAMAGE_SHIELD|DAMAGE_SPLIT)/.test(ev) ? 3 : 0);
const WITH_ADV = /^(SWING_DAMAGE|SWING_DAMAGE_LANDED|RANGE_DAMAGE|SPELL_DAMAGE|SPELL_PERIODIC_DAMAGE|SPELL_HEAL|SPELL_PERIODIC_HEAL|SPELL_CAST_SUCCESS|SPELL_ENERGIZE|SPELL_PERIODIC_ENERGIZE|SPELL_DRAIN|SPELL_LEECH|SPELL_PERIODIC_DRAIN|SPELL_PERIODIC_LEECH|DAMAGE_SHIELD|DAMAGE_SPLIT|ENVIRONMENTAL_DAMAGE)$/;
const CLASS_SPELLS = {
  Warrior: ["Heroic Strike", "Bloodthirst", "Sunder Armor", "Battle Shout", "Whirlwind", "Shield Slam", "Revenge", "Execute"],
  Rogue: ["Sinister Strike", "Backstab", "Eviscerate", "Slice and Dice", "Kick"],
  Mage: ["Frostbolt", "Fireball", "Arcane Intellect", "Scorch", "Arcane Missiles", "Remove Lesser Curse"],
  Warlock: ["Shadow Bolt", "Corruption", "Life Tap", "Curse of the Elements", "Curse of Recklessness", "Immolate"],
  Priest: ["Flash Heal", "Greater Heal", "Renew", "Power Word: Fortitude", "Prayer of Healing", "Mind Blast"],
  Druid: ["Rejuvenation", "Regrowth", "Healing Touch", "Mark of the Wild", "Shred", "Maul", "Moonfire"],
  Hunter: ["Auto Shot", "Aimed Shot", "Multi-Shot", "Arcane Shot", "Serpent Sting", "Tranquilizing Shot"],
  Paladin: ["Holy Light", "Flash of Light", "Blessing of Might", "Seal of Righteousness", "Holy Shock", "Cleanse"],
  Shaman: ["Healing Wave", "Chain Heal", "Lesser Healing Wave", "Lightning Bolt"],
};
const SIG = new Map(Object.entries(CLASS_SPELLS).flatMap(([c, l]) => l.map((s) => [s, c])));

async function parse(dict) {
  let advLen = null; // advanced-parameter block size, learned from SPELL_CAST_SUCCESS
  const nights = new Map(); // date -> night state
  const N = (t) => {
    const date = nightOf(t);
    if (!nights.has(date))
      nights.set(date, { date, start: t, end: t, names: new Map(), grouped: new Set(), actors: [], abil: new Map(), events: [], encounters: [], open: null, classVotes: new Map(), owners: new Map() });
    const s = nights.get(date);
    s.end = Math.max(s.end, t);
    return s;
  };
  for await (const l of lines()) {
    const s = N(l.t);
    const { ev, f } = l;
    // A pull with no ENCOUNTER_END (the raid wiped and ran out, or reset it) is a wipe.
    const closeOpen = () => {
      if (s.open) s.encounters.push({ ...s.open, end: Math.max(s.open.start + 1000, s.lastEv || 0), kill: false, unclosed: true });
      s.open = null;
    };
    if (ev === "ZONE_CHANGE" || ev === "MAP_CHANGE") { closeOpen(); continue; }
    if (ev === "ENCOUNTER_START") {
      closeOpen();
      s.open = { encounterID: 50000 + +f[0], name: f[1], start: l.t, size: +f[3] || null };
      continue;
    }
    if (ev === "ENCOUNTER_END") {
      if (s.open && s.open.encounterID === 50000 + +f[0]) s.encounters.push({ ...s.open, end: l.t, kill: f[4] === "1" });
      s.open = null;
      continue;
    }
    if (ev === "COMBATANT_INFO") {
      s.events.push({ t: l.t, kind: "combatantinfo", f });
      continue;
    }
    if (f.length < 8) continue;
    const pre = PREFIX(ev);
    let i = 8 + pre;
    let adv = null;
    if (WITH_ADV.test(ev) && isGuid(f[i])) {
      if (advLen == null && ev === "SPELL_CAST_SUCCESS") advLen = f.length - i;
      const len = advLen ?? 17;
      adv = f.slice(i, i + len);
      i += len;
    }
    s.events.push({ t: l.t, ev, f, pre, adv, suf: f.slice(i) });
    s.lastEv = l.t;
    if (f[0].startsWith("Player-") && f[1]) s.names.set(f[0], f[1]);
    // in our group or raid (affiliation mine/party/raid); 0x...8 is an outsider who just walked past
    if (f[0].startsWith("Player-") && parseInt(f[2], 16) & 7) s.grouped.add(f[0]);
    if (f[4].startsWith("Player-") && parseInt(f[6], 16) & 7) s.grouped.add(f[4]);
    if (f[4].startsWith("Player-") && f[5]) s.names.set(f[4], f[5]);
    // owners of pets and totems
    if (ev === "SPELL_SUMMON" && f[0].startsWith("Player-")) s.owners.set(f[4], f[0]);
    if (adv && adv[1] && adv[1] !== "0000000000000000" && adv[0] !== adv[1]) s.owners.set(adv[0], adv[1]);
    if (f[0].startsWith("Player-") && pre === 3 && /^SPELL_CAST_SUCCESS$/.test(ev) && SIG.has(f[9])) {
      const v = s.classVotes.get(f[0]) || {};
      v[SIG.get(f[9])] = (v[SIG.get(f[9])] || 0) + 1;
      s.classVotes.set(f[0], v);
    }
  }
  return { nights, advLen };
}

// ---------------------------------------------------------------- one night -> report
function buildReport(s, dict, owner) {
  const code = `MOIST${s.date.replace(/-/g, "")}RAW`.slice(0, 20);
  const start = s.start;
  s.events.sort((a, b) => a.t - b.t);
  const rel = (t) => t - start;
  // actors
  const ids = new Map();
  const actors = [{ id: -1, gameID: 0, name: "Environment", type: "NPC", subType: "NPC", server: null, petOwner: null }];
  let next = 1;
  const classOf = (guid, name) => {
    const r = dict.roster[name];
    if (r?.class) return r.class;
    const v = s.classVotes.get(guid);
    return v ? Object.entries(v).sort((a, b) => b[1] - a[1])[0][0] : "Unknown";
  };
  const actorId = (guid, name) => {
    if (!guid || guid === "0000000000000000") return -1;
    let key = guid;
    let def;
    if (guid.startsWith("Player-")) def = { gameID: 0, name: playerName(name), type: "Player", subType: classOf(guid, playerName(name)), server: (name || "").split("-")[1] || null, petOwner: null };
    else if (guid.startsWith("Pet-") || (s.owners.has(guid) && s.owners.get(guid).startsWith("Player-"))) {
      const npc = +(guid.split("-")[5] || 0);
      def = { gameID: npc, name: name || "Pet", type: "Pet", subType: "Pet", server: null, petOwner: null, ownerGuid: s.owners.get(guid) || null };
    } else if (guid.startsWith("Creature-") || guid.startsWith("Vehicle-")) {
      const npc = +(guid.split("-")[5] || 0);
      key = `npc-${npc}`; // one actor per NPC type, like Warcraft Logs
      def = { gameID: npc, name: name || `NPC ${npc}`, type: "NPC", subType: dict.npcType.get(npc) || "NPC", server: null, petOwner: null };
    } else return -1;
    if (!ids.has(key)) {
      ids.set(key, next);
      actors.push({ id: next++, ...def });
    }
    return ids.get(key);
  };
  for (const a of actors) if (a.ownerGuid) a.petOwner = ids.get(a.ownerGuid) ?? null;
  const abil = new Map();
  const ability = (id, name) => {
    id = +id || 0;
    if (!abil.has(id)) abil.set(id, { gameID: id, name: name || dict.spellName.get(id) || `spell ${id}`, icon: dict.icon.get(id) || "inv_misc_questionmark.jpg", type: "1" });
    return id;
  };
  ability(1, "Melee");
  abil.get(1).icon = "ability_meleedamage.jpg";
  const ENV = { Falling: 3, Drowning: 4, Fatigue: 5, Fire: 6, Lava: 7, Slime: 8 };

  // fights: boss pulls from ENCOUNTER_START/END, trash in between
  const enc = [...s.encounters].sort((a, b) => a.start - b.start);
  const KT = 51114;
  const fights = [];
  let fid = 1;
  let prevEnd = s.start;
  for (const e of enc) {
    let st = e.start;
    if (e.encounterID === KT) {
      // Warcraft Logs starts Kel'Thuzad's fight when he becomes attackable (phase 2)
      const hit = s.events.find((x) => x.t >= e.start && x.t <= e.end && /DAMAGE$/.test(x.ev) && (x.f[4] || "").split("-")[5] === "15990");
      if (hit) st = hit.t - 500;
    }
    if (st - prevEnd > 5000) fights.push({ id: fid++, encounterID: 0, name: "Trash", kill: null, startTime: rel(prevEnd), endTime: rel(st - 1), trash: true });
    fights.push({ id: fid++, encounterID: e.encounterID, name: dict.bossName.get(e.encounterID) || e.name, kill: e.kill, startTime: rel(st), endTime: rel(e.end), size: e.size, difficulty: 3 });
    prevEnd = e.end + 1;
  }
  if (s.end - prevEnd > 5000) fights.push({ id: fid++, encounterID: 0, name: "Trash", kill: null, startTime: rel(prevEnd), endTime: rel(s.end), trash: true });
  let fk = 0;
  const fightAt = (t) => {
    const r = rel(t); // events are sorted, so the fight only moves forward
    while (fk < fights.length && fights[fk].endTime < r) fk++;
    return fk < fights.length && r >= fights[fk].startTime ? fights[fk] : null;
  };

  // events
  const out = [];
  const seenPlayers = new Map(fights.map((x) => [x.id, new Set()]));
  const seenNpcs = new Map(fights.map((x) => [x.id, new Map()]));
  const bossHp = new Map(); // fight -> last boss hp%
  const igniteFeed = new Map(); // target guid -> recent fire crits { t, src, w }
  const lastSwing = new Map(); // "src|dst" -> the last SWING_DAMAGE, for its _LANDED line
  const feignAt = new Map(); // player guid -> last Feign Death, which logs as a death
  for (const x of s.events) {
    const fi = fightAt(x.t);
    if (!fi) continue;
    if (x.kind === "combatantinfo") {
      const f = x.f;
      if (!s.names.has(f[0])) continue;
      const pid = actorId(f[0], s.names.get(f[0]));
      // equipped items is the bracket full of (itemId,ilvl,(...)...), the auras come right after it
      const brackets = f.map((v, k) => [v, k]).filter(([v]) => v.startsWith("["));
      const gi = brackets.reduce((best, b, k) => (parseGear(b[0]).length > parseGear(brackets[best]?.[0]).length ? k : best), 0);
      const gear = parseGear(brackets[gi]?.[0]);
      const auras = parseAuras(brackets[gi + 1]?.[0]).map((id) => ({ ability: id, name: abil.get(ability(id))?.name, icon: abil.get(id)?.icon }));
      out.push({ timestamp: rel(x.t), type: "combatantinfo", fight: fi.id, sourceID: pid, gear, auras });
      continue;
    }
    const f = x.f;
    const src = actorId(f[0], f[1]);
    const dst = actorId(f[4], f[5]);
    const e = { timestamp: rel(x.t), type: null, sourceID: src, targetID: dst, fight: fi.id };
    if (x.pre === 3) e.abilityGameID = ability(f[8], f[9]);
    else if (x.ev.startsWith("SWING_")) e.abilityGameID = 1;
    else if (x.ev.startsWith("ENVIRONMENTAL_")) e.abilityGameID = ability(90000 + (ENV[x.suf[0]] || 9), x.suf[0]); // the type comes after the advanced block
    const a = x.adv;
    const info = a ? a[0] : null;
    const hp = a ? (+a[3] > 0 ? Math.round((+a[2] / +a[3]) * 100) : null) : null;
    const pos = a && a.length >= 5 ? [Math.round(+a[a.length - 5] * 100), Math.round(+a[a.length - 4] * 100)] : null;
    const resourceOf = (guid) => {
      if (info !== guid) return;
      // like Warcraft Logs: players in percent, NPCs in raw hit points
      if (hp != null) Object.assign(e, guid.startsWith("Player-") ? { hitPoints: hp, maxHitPoints: 100 } : { hitPoints: +a[2], maxHitPoints: +a[3] });
      if (pos && Number.isFinite(pos[0])) { e.x = pos[0]; e.y = pos[1]; }
    };
    const sf = x.suf;
    const ev = x.ev;
    if (ev === "SWING_DAMAGE_LANDED") {
      // SWING_DAMAGE carries the attacker's hit points and position, this the target's
      const sw = lastSwing.get(`${src}|${dst}`);
      if (sw && x.t - sw.t < 200 && info === f[4]) {
        if (hp != null) Object.assign(sw.e, f[4].startsWith("Player-") ? { hitPoints: hp, maxHitPoints: 100 } : { hitPoints: +a[2], maxHitPoints: +a[3] });
        if (pos && Number.isFinite(pos[0])) { sw.e.x = pos[0]; sw.e.y = pos[1]; }
        if (dict.npcType.get(+(f[4].split("-")[5] || 0)) === "Boss" && hp != null) bossHp.set(fi.id, hp);
      }
      continue;
    }
    if ((ev === "SPELL_CAST_SUCCESS" || ev === "SPELL_AURA_APPLIED") && f[9] === "Feign Death") feignAt.set(ev === "SPELL_CAST_SUCCESS" ? f[0] : f[4], x.t);
    if (/_DAMAGE$/.test(ev) || ev === "DAMAGE_SHIELD" || ev === "DAMAGE_SPLIT") {
      e.type = "damage";
      const d = damageSuffix(ev === "ENVIRONMENTAL_DAMAGE" ? sf.slice(1) : sf);
      Object.assign(e, d);
      if (ev.startsWith("SPELL_PERIODIC")) e.tick = true;
      resourceOf(f[4]);
      if (ev === "SWING_DAMAGE") lastSwing.set(`${src}|${dst}`, { t: x.t, e });
      // Ignite: the log credits every tick to the mage who owns the debuff on that
      // target. Warcraft Logs splits it between the mages whose fire crits fed it, and
      // so do we: each tick shared by those crits' Ignite value over the last 4 s.
      if (e.abilityGameID === IGNITE && e.tick) e.ignite = f[4];
      else if (e.hitType === 2 && (+sf[3] & 4) && f[0].startsWith("Player-") && e.amount > 0) {
        const l = igniteFeed.get(f[4]) || igniteFeed.set(f[4], []).get(f[4]);
        l.push({ t: x.t, src, w: e.amount * 0.4 });
        while (l.length && l[0].t < x.t - 4100) l.shift();
      }
      if (dict.npcType.get(+(f[4].split("-")[5] || 0)) === "Boss" && hp != null && info === f[4]) bossHp.set(fi.id, hp);
    } else if (/_MISSED$/.test(ev)) {
      e.type = "damage";
      e.amount = 0;
      e.hitType = 0;
      if (sf[0] === "ABSORB") e.absorbed = +sf[2] || +sf[sf.length - 2] || 0;
    } else if (/_HEAL$/.test(ev)) {
      e.type = "heal";
      const [amount, over, absorbed, crit] = sf.length >= 5 ? [sf[0], sf[2], sf[3], sf[4]] : sf;
      e.amount = Math.max(0, (+amount || 0) - (+over || 0));
      e.overheal = +over || 0;
      e.absorbed = +absorbed || 0;
      e.hitType = crit === "1" ? 2 : 1;
      if (ev === "SPELL_PERIODIC_HEAL") e.tick = true;
      resourceOf(f[4]);
    } else if (ev === "SPELL_ABSORBED") {
      // [attacking spell id,name,school], absorber guid,name,flags,raidflags, shield id,name,school, amount, ...
      let k = -1;
      for (let j = 8; j < f.length; j++) if (/^(Player|Creature|Pet)-/.test(f[j])) k = j;
      const t = k > 0 ? f.slice(k) : null;
      if (!t || t.length < 8) continue;
      e.type = "absorbed";
      e.sourceID = actorId(t[0], t[1]);
      e.abilityGameID = ability(t[4], t[5]);
      e.amount = +t[7] || 0;
      e.attackerID = src;
    } else if (ev === "SPELL_CAST_SUCCESS") {
      e.type = "cast";
      resourceOf(f[0]);
    } else if (ev === "SPELL_CAST_START") e.type = "begincast";
    else if (ev === "SPELL_AURA_APPLIED") e.type = sf[0] === "DEBUFF" ? "applydebuff" : "applybuff";
    else if (ev === "SPELL_AURA_REMOVED") e.type = sf[0] === "DEBUFF" ? "removedebuff" : "removebuff";
    else if (ev === "SPELL_AURA_REFRESH") e.type = sf[0] === "DEBUFF" ? "refreshdebuff" : "refreshbuff";
    else if (ev === "SPELL_AURA_APPLIED_DOSE") { e.type = sf[0] === "DEBUFF" ? "applydebuffstack" : "applybuffstack"; e.stack = +sf[1] || 1; }
    else if (ev === "SPELL_AURA_REMOVED_DOSE") { e.type = sf[0] === "DEBUFF" ? "removedebuffstack" : "removebuffstack"; e.stack = +sf[1] || 0; }
    else if (ev === "SPELL_DISPEL" || ev === "SPELL_STOLEN") { e.type = "dispel"; e.extraAbilityGameID = ability(sf[0], sf[1]); e.isBuff = sf[3] === "BUFF"; }
    else if (ev === "SPELL_INTERRUPT") { e.type = "interrupt"; e.extraAbilityGameID = ability(sf[0], sf[1]); }
    else if (ev === "SPELL_RESURRECT") e.type = "resurrect";
    else if (ev === "SPELL_SUMMON") e.type = "summon";
    else if (ev === "SPELL_INSTAKILL") { e.type = "instakill"; }
    else if (ev === "UNIT_DIED" || ev === "UNIT_DESTROYED") {
      e.type = "death";
      e.sourceID = -1;
      if (f[8] === "1" || x.t - (feignAt.get(f[4]) ?? -1e9) < 1500) e.feign = true;
    }
    else continue;
    if (src > 0 && actors[src]?.type === "Player" && s.grouped.has(f[0])) seenPlayers.get(fi.id).add(src);
    if (dst > 0 && actors[dst]?.type === "Player" && s.grouped.has(f[4])) seenPlayers.get(fi.id).add(dst);
    for (const id of [src, dst]) if (id > 0 && actors[id].type === "NPC") seenNpcs.get(fi.id).set(id, actors[id].gameID);
    if (e.ignite) {
      const feed = (igniteFeed.get(e.ignite) || []).filter((c) => c.t >= x.t - 4100 && c.t <= x.t);
      delete e.ignite;
      const by = new Map();
      for (const c of feed) by.set(c.src, (by.get(c.src) || 0) + c.w);
      const total = [...by.values()].reduce((a, b) => a + b, 0);
      if (by.size > 1 && total > 0) {
        let left = e.amount || 0;
        const list = [...by];
        list.forEach(([who, w], k) => {
          const amount = k === list.length - 1 ? left : Math.round(((e.amount || 0) * w) / total);
          left -= amount;
          out.push({ ...e, sourceID: who, amount, overkill: k === list.length - 1 ? e.overkill : 0, absorbed: k === list.length - 1 ? e.absorbed : 0 });
        });
        continue;
      }
      if (by.size === 1) e.sourceID = list1(by);
    }
    out.push(e);
  }
  for (const a of actors) if (a.ownerGuid) { a.petOwner = ids.get(a.ownerGuid) ?? null; delete a.ownerGuid; }
  for (const fi of fights) {
    fi.friendlyPlayers = [...seenPlayers.get(fi.id)];
    fi.enemyNPCs = [...seenNpcs.get(fi.id)].map(([id, gameID]) => ({ id, gameID }));
    if (fi.encounterID) {
      fi.fightPercentage = fi.kill ? 0 : bossHp.get(fi.id) ?? null;
      fi.bossPercentage = fi.fightPercentage;
    }
    delete fi.trash;
  }
  const zones = [...new Set(fights.filter((x) => x.encounterID).map((x) => zoneForEncounter(x.encounterID)))];
  const report = {
    code,
    local: true, // built here from a raw combat log, not by Warcraft Logs
    title: `Raw combat log (Warcraft Logs down) ${s.date}`,
    startTime: start,
    endTime: s.end,
    owner: { name: owner || "raw combat log" },
    zone: zones.length ? { id: zones[0], name: null } : null,
    fights,
    masterData: { actors, abilities: [...abil.values()] },
  };
  report.masterData.players = actors.filter((a) => a.type === "Player");
  return { report, events: out.sort((a, b) => a.timestamp - b.timestamp) };
}

const IGNITE = 12654;
const list1 = (m) => m.keys().next().value;
function damageSuffix(sf) {
  // amount, baseAmount, overkill, school, resisted, blocked, absorbed, critical, glancing, crushing, [ST|AOE]
  const o = 1;
  const v = (k) => +sf[k] || 0;
  const flagAt = (k) => sf[k] === "1";
  const overkill = Math.max(0, v(1 + o));
  return { amount: v(0), overkill, absorbed: v(5 + o), resisted: v(3 + o), blocked: v(4 + o), hitType: flagAt(6 + o) ? 2 : flagAt(8 + o) ? 5 : flagAt(7 + o) ? 6 : 1 };
}
function parseGear(s) {
  if (!s) return [];
  return [...s.matchAll(/\((\d+),(\d+),\(([^)]*)\)/g)].map((m) => ({ id: +m[1], itemLevel: +m[2], permanentEnchant: +(m[3].split(",")[0] || 0) || undefined }));
}
function parseAuras(s) {
  if (!s) return [];
  // [casterGuid,spellId,stacks, casterGuid,spellId,stacks, ...]
  const t = s.replace(/^\[|\]$/g, "").split(",");
  const ids = [];
  for (let i = 0; i + 1 < t.length; i++) if (isGuid(t[i]) && /^\d+$/.test(t[i + 1])) ids.push(+t[i + 1]);
  return ids;
}

// ---------------------------------------------------------------- estimated parses
function curveAt(curve, x) {
  if (!curve?.length) return null;
  const [x0, p0] = curve[0];
  if (x <= x0) return (p0 * Math.max(0, x)) / x0;
  for (let i = 1; i < curve.length; i++) {
    const [x1, p1] = curve[i];
    if (x <= x1) { const [xa, pa] = curve[i - 1]; return pa + ((p1 - pa) * (x - xa)) / (x1 - xa || 1); }
  }
  const [xn, pn] = curve.at(-1);
  return pn + (100 - pn) * Math.min(1, (x - xn) / (0.15 * xn));
}
// DPS and tank curves per boss+class from the guild's own Warcraft Logs parses.
function guildCurves() {
  const roster = JSON.parse(fs.readFileSync(path.join(DATA, "roster.json"), "utf8"));
  const pts = {};
  const cutoff = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
  for (const f of fs.readdirSync(path.join(DATA, "nights")).filter((x) => /^\d{4}-.+\.json$/.test(x) && x >= cutoff)) {
    const n = JSON.parse(fs.readFileSync(path.join(DATA, "nights", f), "utf8"));
    for (const b of n.bosses) for (const p of b.parses || []) {
      const cls = roster[p.player]?.class;
      if (!cls || p.pct == null) continue;
      if (p.role === "healer") { (pts[`${b.encounterId}|healer`] ??= []).push([0, p.pct]); continue; }
      if (!(p.amount > 50)) continue;
      (pts[`${b.encounterId}|${p.role}|${cls}`] ??= []).push([p.amount, p.pct]);
      (pts[`${b.encounterId}|${p.role}|*`] ??= []).push([p.amount, p.pct]);
    }
  }
  const out = {};
  for (const [k, l] of Object.entries(pts)) {
    if (k.endsWith("|healer")) { out[k] = l.map(([, y]) => y).sort((a, b) => a - b); continue; }
    if (l.length < 8) continue;
    l.sort((a, b) => a[0] - b[0]);
    const blocks = [];
    for (const [x, y] of l) {
      blocks.push({ x: [x], y, w: 1 });
      while (blocks.length > 1 && blocks.at(-2).y > blocks.at(-1).y) {
        const b2 = blocks.pop();
        const b1 = blocks.pop();
        blocks.push({ x: [...b1.x, ...b2.x], y: (b1.y * b1.w + b2.y * b2.w) / (b1.w + b2.w), w: b1.w + b2.w });
      }
    }
    out[k] = blocks.map((b) => [b.x[Math.floor(b.x.length / 2)], b.y]);
  }
  return out;
}
// Healers: Warcraft Logs' healer parses don't follow healing done the way DPS
// parses follow damage, so a healer is ranked against the guild's own healing on
// that boss (effective healing per second on kills, last year, same class if
// there's enough), and that rank is read off the spread of Warcraft Logs'
// healer parses the guild got on that boss.
function healerHistory(encounters) {
  const file = path.join(CACHE, "hps-history.json");
  const hist = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  const roster = JSON.parse(fs.readFileSync(path.join(DATA, "roster.json"), "utf8"));
  const want = encounters.filter((e) => !hist[e]);
  if (want.length) {
    const cutoff = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
    const nights = fs.readdirSync(path.join(DATA, "nights")).filter((x) => /^\d{4}-.+\.json$/.test(x) && x >= cutoff).sort().reverse();
    for (const enc of want) hist[enc] = [];
    for (const f of nights) {
      const n = JSON.parse(fs.readFileSync(path.join(DATA, "nights", f), "utf8"));
      const kills = n.bosses.filter((b) => want.includes(String(b.encounterId)) && b.pulls.some((p) => p.kill));
      if (!kills.length || n.kind === "pug") continue;
      const healers = new Set((n.raiders || []).filter((r) => r.role === "healer").map((r) => r.name));
      const byCode = new Map();
      for (const b of kills) { const p = b.pulls.find((q) => q.kill); if (p.src && hasEvents(n.date, p.src.code)) (byCode.get(p.src.code) || byCode.set(p.src.code, []).get(p.src.code)).push([b, p]); }
      for (const [code, list] of byCode) {
        const rep = readGz(path.join(RAW, "reports", `${code}.json.gz`));
        let d;
        try { d = deriveLog(n.date, rep); } catch { continue; }
        for (const [b, p] of list) {
          const fi = d[p.src.fight];
          if (!fi) continue;
          for (const [name, total] of Object.entries(fi.healing)) if (healers.has(name) && total > 0) hist[b.encounterId].push([roster[name]?.class || null, Math.round(total / p.durationSec)]);
        }
      }
      if (want.every((e) => hist[e].length >= 150)) break;
    }
    fs.mkdirSync(CACHE, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(hist));
  }
  return hist;
}
const TANK_SPELLS = new Set(["Swipe", "Taunt", "Shield Block", "Revenge", "Shield Slam", "Growl", "Maul", "Swipe (Bear)", "Righteous Fury", "Mocking Blow", "Challenging Roar", "Holy Shield", "Frenzied Regeneration", "Demoralizing Roar"]);
const HEAL_SPELLS = new Set(["Flash Heal", "Heal", "Greater Heal", "Lesser Heal", "Prayer of Healing", "Renew", "Holy Light", "Flash of Light", "Healing Touch", "Regrowth", "Rejuvenation", "Holy Shock", "Swiftmend", "Power Word: Shield", "Desperate Prayer", "Holy Nova", "Tranquility", "Healing Wave", "Chain Heal", "Lesser Healing Wave"]);

function estimateRankings(report, events) {
  const actor = new Map(report.masterData.actors.map((a) => [a.id, a]));
  const name = (id) => actor.get(id)?.name;
  const ownerOf = (id) => { const a = actor.get(id); return a?.type === "Player" ? a : a?.petOwner != null ? actor.get(a.petOwner) : null; };
  const abil = new Map(report.masterData.abilities.map((a) => [a.gameID, a.name]));
  const kills = report.fights.filter((f) => f.encounterID && f.kill);
  const curves = guildCurves();
  const hps = healerHistory([...new Set(kills.map((k) => String(k.encounterID)))]);
  const data = [];
  for (const k of kills) {
    const dur = (k.endTime - k.startTime) / 1000;
    const dmg = {};
    const heal = {};
    const casts = {};
    const meleeTaken = {};
    let meleeAll = 0;
    for (const e of events) {
      if (e.fight !== k.id) continue;
      const o = ownerOf(e.sourceID);
      if (e.type === "damage" && o && actor.get(e.targetID)?.type === "NPC") dmg[o.name] = (dmg[o.name] || 0) + (e.amount || 0) + (e.absorbed || 0);
      if ((e.type === "heal" || e.type === "absorbed") && o && ownerOf(e.targetID)) heal[o.name] = (heal[o.name] || 0) + (e.amount || 0);
      if (e.type === "cast" && actor.get(e.sourceID)?.type === "Player") {
        const c = (casts[name(e.sourceID)] ??= { heal: 0, tank: 0, n: 0 });
        c.n++;
        if (HEAL_SPELLS.has(abil.get(e.abilityGameID))) c.heal++;
        if (TANK_SPELLS.has(abil.get(e.abilityGameID))) c.tank++;
      }
      if (e.type === "damage" && e.abilityGameID === 1 && actor.get(e.sourceID)?.type === "NPC" && actor.get(e.targetID)?.type === "Player") {
        meleeTaken[name(e.targetID)] = (meleeTaken[name(e.targetID)] || 0) + (e.amount || 0) + (e.absorbed || 0);
        meleeAll += (e.amount || 0) + (e.absorbed || 0);
      }
    }
    const roles = { tanks: { characters: [] }, healers: { characters: [] }, dps: { characters: [] } };
    for (const pid of k.friendlyPlayers) {
      const p = actor.get(pid);
      const c = casts[p.name] || { heal: 0, tank: 0, n: 0 };
      // tank on this pull: takes a real share of the NPCs' melee and tanks, or taunts/blocks a lot
      // (matched Warcraft Logs' own tank/dps split on 569 of 574 parses on 14 Oct Naxx)
      const melee = meleeAll ? (meleeTaken[p.name] || 0) / meleeAll : 0;
      const role = c.n && c.heal > c.n * 0.5 ? "healers" : (melee >= 0.1 && c.tank >= 1) || c.tank >= 10 ? "tanks" : "dps";
      const amount = role === "healers" ? (heal[p.name] || 0) / dur : (dmg[p.name] || 0) / dur;
      if (amount <= 0) continue;
      let pct;
      if (role === "healers") {
        const all = hps[k.encounterID] || [];
        const same = all.filter(([cls]) => cls === p.subType);
        const pool = (same.length >= 25 ? same : all).map(([, v]) => v);
        const q = pool.length ? pool.filter((v) => v < amount).length / pool.length : null;
        const wcl = curves[`${k.encounterID}|healer`];
        pct = q == null ? null : wcl?.length >= 10 ? Math.round(wcl[Math.min(wcl.length - 1, Math.floor(q * wcl.length))]) : Math.round(100 * q);
      } else {
        const curve = curves[`${k.encounterID}|${role === "tanks" ? "tank" : "dps"}|${p.subType}`] || curves[`${k.encounterID}|dps|${p.subType}`] || curves[`${k.encounterID}|${role === "tanks" ? "tank" : "dps"}|*`];
        const v = curveAt(curve, amount);
        pct = v == null ? null : Math.max(0, Math.min(100, Math.round(v)));
      }
      if (JOKE[p.name]) pct = JOKE[p.name](k.encounterID);
      if (pct == null) continue;
      roles[role].characters.push({ name: p.name, class: p.subType, amount: Math.round(amount * 100) / 100, rankPercent: pct, estimated: true });
    }
    data.push({ fightID: k.id, encounter: { id: k.encounterID, name: k.name }, kill: 1, duration: k.endTime - k.startTime, estimated: true, roles });
  }
  return { data, estimated: true };
}

// ---------------------------------------------------------------- main
async function main() {
  if (flag("--inspect")) return inspect();
  const dict = archive();
  const { nights, advLen } = await parse(dict);
  console.log(`advanced-parameter block: ${advLen ?? "not found (Advanced Combat Logging off?)"} fields`);
  for (const [date, s] of [...nights].sort()) {
    if (s.open) { s.encounters.push({ ...s.open, end: s.lastEv, kill: false, unclosed: true }); s.open = null; }
    const pulls = s.encounters;
    console.log(`\n${date}  ${new Date(s.start).toLocaleTimeString("en-GB", { timeZone: TZ })} -> ${new Date(s.end).toLocaleTimeString("en-GB", { timeZone: TZ })}  ${s.events.length.toLocaleString()} events, ${pulls.length} boss pulls`);
    for (const e of pulls) console.log(`  ${new Date(e.start).toLocaleTimeString("en-GB", { timeZone: TZ })}  ${e.kill ? "KILL" : "wipe"}  ${e.name} (${e.encounterID})  ${Math.round((e.end - e.start) / 1000)}s`);
  }
  if (!flag("--write")) return;
  const only = opt("--night");
  for (const [date, s] of [...nights].sort()) {
    if (only && date !== only) continue;
    if (!s.encounters.length) { console.log(`${date}: no boss pulls, skipped`); continue; }
    const { report, events } = buildReport(s, dict, opt("--owner"));
    const code = report.code;
    // events, like events.mjs writes them
    const dir = path.join(ROOT, "data/events", date, code);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const per = 10000;
    let page = 0;
    for (let i = 0; i < events.length; i += per) fs.writeFileSync(path.join(dir, `page-${String(page++).padStart(3, "0")}.json.gz`), zlib.gzipSync(JSON.stringify(events.slice(i, i + per)), { level: 6 }));
    const fightIDs = report.fights.map((f) => f.id);
    fs.writeFileSync(path.join(dir, "done.json"), JSON.stringify({ code, night: date, fightIDs, pages: page, events: events.length, fetchedAt: new Date().toISOString(), includeResources: true, local: true }));
    writeGz(path.join(RAW, "reports", `${code}.json.gz`), report);
    const hash = crypto.createHash("sha1").update(fightIDs.join(",")).digest("hex").slice(0, 10);
    const rk = estimateRankings(report, events);
    writeGz(path.join(RAW, "fights", `${code}-rankings-${hash}.json.gz`), rk);
    // the report list
    const listFile = path.join(RAW, "reports.json");
    const list = JSON.parse(fs.readFileSync(listFile, "utf8")).filter((r) => r.code !== code);
    list.push({ code, title: report.title, startTime: report.startTime, endTime: report.endTime, owner: report.owner, zone: report.zone, local: true });
    list.sort((a, b) => b.startTime - a.startTime);
    fs.writeFileSync(listFile, JSON.stringify(list, null, 0).replace(/\},\{/g, "},\n{") + "\n");
    console.log(`${date}: wrote ${code}: ${events.length.toLocaleString()} events, ${report.fights.length} fights, ${rk.data.length} kills with estimated parses`);
    console.log(`  next: npm run raids:fetch -- --rebuild --night ${date}`);
  }
}
main().catch((e) => {
  console.error(e.stack || e.message);
  process.exit(1);
});
