// Pull the guild's Warcraft Logs reports and write one stats file per raid night
// to src/raids/data/nights/<night>.json.
//
// Every API response is kept, gzipped, in data/wcl/ (committed to git), so the
// night files can be rebuilt any time - new stats, page changes - without asking
// Warcraft Logs again. Only brand-new logs cost API points.
//
//   npm run raids:fetch                      new nights from the last few weeks
//   npm run raids:fetch -- --since 2026-09-01
//   npm run raids:fetch -- --rebuild         rebuild every night on disk from data/wcl only (no API)
//   npm run raids:fetch -- --night 2026-10-04 --refresh  re-download that night's logs
//   npm run raids:fetch -- --list            just show nights + reports found
//   npm run raids:fetch -- --since 2025-01-01 --newest-first   backfill, today backwards
//
// Several people log the same raid, so each night is stitched from the reports
// that cover it: the most complete log first, then any pulls only others caught.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { gql, rateLimit } from "./wcl.mjs";
import { writeSummary } from "./summary.mjs";
import { GUILD, SITE_URL, TIMEZONE, NIGHT_CUTOFF_HOUR, DEFAULT_LOOKBACK_DAYS, TRACKED_CASTS } from "./config.mjs";
import { MECHANICS, mechanicAbilities } from "../../src/raids/mechanics.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const NIGHTS_DIR = path.join(ROOT, "src/raids/data/nights");
const RAW_DIR = path.join(ROOT, "data/wcl"); // raw API responses, committed

const RESERVE_POINTS = 130; // a big night costs ~55, the odd huge one 100+
const SCHEMA = 3; // bump when the night file shape changes; older files get rebuilt
const args = parseArgs(process.argv.slice(2));

main().catch((e) => {
  console.error(e.message);
  // Hit the hourly limit mid-way: that's "come back later", not a failure.
  if (/failed: 429/.test(e.message)) {
    console.log("API budget used up mid-run; resets in 15 min. Run again then.");
    process.exit(75);
  }
  process.exit(1);
});

// Rebuild every night already on disk from the raw archive only - no API calls.
// Nights whose raw files are missing are left alone.
async function rebuildOffline() {
  const list = JSON.parse(fs.readFileSync(path.join(RAW_DIR, "reports.json"), "utf8"));
  const byNight = groupBy(list, (r) => nightOf(r.startTime));
  const nights = fs.readdirSync(NIGHTS_DIR).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort();
  let done = 0;
  let skipped = 0;
  for (const night of nights) {
    const reports = byNight.get(night) || [];
    const details = [];
    for (const r of reports) {
      const d = readRaw(`reports/${r.code}.json.gz`);
      if (d) details.push({ ...d, zone: r.zone });
    }
    try {
      if (!details.length || details.length < reports.length) throw new Error("missing raw");
      offline = true;
      skippedArchive = false;
      const out = await buildNight(night, details);
      out.archived = true;
      fs.writeFileSync(path.join(NIGHTS_DIR, `${night}.json`), JSON.stringify(out) + "\n");
      done++;
    } catch (e) {
      skipped++;
      if (e.message !== "missing raw") console.log(`${night}  skipped: ${e.message}`);
    }
  }
  writeSummary();
  console.log(`Rebuilt ${done} nights offline, ${skipped} left as they were (raw archive incomplete).`);
}

async function main() {
  if (args.rebuild) return rebuildOffline();
  const guildId = await findGuildId();
  const since = args.night
    ? new Date(`${args.night}T00:00:00Z`).getTime() - 86400e3
    : args.since
      ? new Date(`${args.since}T00:00:00Z`).getTime()
      : Date.now() - DEFAULT_LOOKBACK_DAYS * 86400e3;

  const reports = await listReports(guildId, since);
  const byNight = groupBy(reports, (r) => nightOf(r.startTime));
  const nights = [...byNight.keys()].sort().filter((n) => !args.night || n === args.night);
  // Backfills go newest-first, so a partial run is still one unbroken stretch
  // of history back from today.
  if (args["newest-first"]) nights.reverse();

  if (args.list) {
    for (const n of nights) {
      console.log(n);
      for (const r of byNight.get(n)) console.log(`  ${r.code}  ${r.owner?.name ?? "?"}  ${r.title}`);
    }
    return;
  }

  fs.mkdirSync(NIGHTS_DIR, { recursive: true });
  for (const night of nights) {
    const file = path.join(NIGHTS_DIR, `${night}.json`);
    // Skip nights already built with the current schema; older ones get upgraded.
    if (fs.existsSync(file) && !args.force && !args.refresh) {
      const old = JSON.parse(fs.readFileSync(file, "utf8"));
      if ((old.schema || 1) >= SCHEMA && old.archived !== false) continue;
    }
    // Stop before the hourly API budget runs out; the next run picks up here.
    const rl = await rateLimit();
    if (rl.pointsSpentThisHour > rl.limitPerHour - RESERVE_POINTS) {
      console.log(`API budget nearly spent (${Math.round(rl.pointsSpentThisHour)}/${rl.limitPerHour}); resets in ${Math.ceil(rl.pointsResetIn / 60)} min. Run again then.`);
      process.exitCode = 75; // "try again later"
      break;
    }
    const details = [];
    for (const r of byNight.get(night)) details.push({ ...(await reportDetails(r.code)), zone: r.zone });
    skippedArchive = false;
    const out = await buildNight(night, details);
    out.archived = !skippedArchive;
    fs.writeFileSync(file, JSON.stringify(out) + "\n");
    const t = out.totals;
    console.log(
      `${night}  ${out.zones.join(" + ") || "?"}: ${t.kills} kills, ${t.wipes} wipes, ` +
        `${t.deaths} deaths, ${out.raiders.length} raiders  ->  ${path.relative(ROOT, file)}`
    );
  }

  writeSummary();
  const rl = await rateLimit();
  console.log(`(API points used this hour: ${Math.round(rl.pointsSpentThisHour)}/${rl.limitPerHour})`);
}

// ---------- API ----------

async function findGuildId() {
  const d = await gql(
    `query($name: String!, $server: String!, $region: String!) {
      guildData { guild(name: $name, serverSlug: $server, serverRegion: $region) { id } }
    }`,
    { name: GUILD.name, server: GUILD.serverSlug, region: GUILD.serverRegion }
  );
  const id = d.guildData.guild?.id;
  if (!id) throw new Error(`Guild ${GUILD.name} (${GUILD.serverRegion}-${GUILD.serverSlug}) not found`);
  return id;
}

// The guild's report list, kept in data/wcl/reports.json. Only the newest few
// days are asked for again (to catch fresh uploads) unless --since reaches past
// what's stored.
async function listReports(guildID, since) {
  const file = path.join(RAW_DIR, "reports.json");
  const known = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
  const oldest = Math.min(...known.map((r) => r.startTime));
  const newest = Math.max(...known.map((r) => r.startTime));
  const from = !known.length || since < oldest - 86400e3 ? since : newest - 3 * 86400e3;

  const fresh = [];
  for (let page = 1; ; page++) {
    const d = await gql(
      `query($guildID: Int!, $startTime: Float!, $page: Int!) {
        reportData { reports(guildID: $guildID, startTime: $startTime, limit: 100, page: $page) {
          has_more_pages
          data { code title startTime endTime owner { name } zone { id name } }
        } }
      }`,
      { guildID, startTime: from, page }
    );
    const { data, has_more_pages } = d.reportData.reports;
    fresh.push(...data);
    if (!has_more_pages) break;
  }
  const all = new Map(known.map((r) => [r.code, r]));
  for (const r of fresh) all.set(r.code, r);
  const list = [...all.values()].sort((a, b) => b.startTime - a.startTime);
  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(list, null, 0).replace(/\},\{/g, "},\n{") + "\n");
  return list.filter((r) => r.startTime >= since);
}

// ---------- raw storage (data/wcl/*.json.gz) ----------

function readRaw(rel) {
  const file = path.join(RAW_DIR, rel);
  if (args.refresh || !fs.existsSync(file)) return null;
  return JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString("utf8"));
}

// Only finished logs are stored - one still being uploaded would go stale.
// A night built from a too-fresh log is marked `archived: false` and fetched
// again on a later run.
var skippedArchive = false; // var: main() runs before this line
var offline = false; // --rebuild: never call the API
function needApi(what) {
  if (offline) throw new Error(`raw ${what} missing`);
}
function writeRaw(rel, data, report) {
  if (Date.now() - report.endTime < 3 * 3600e3) {
    skippedArchive = true;
    return;
  }
  const file = path.join(RAW_DIR, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, zlib.gzipSync(JSON.stringify(data), { level: 9 }));
}

// The light part of a report, needed for every log of the night to work out
// which pulls to use: fights, every actor and ability (names + icons).
// Stored as data/wcl/reports/<code>.json.gz.
async function reportDetails(code) {
  const rel = `reports/${code}.json.gz`;
  const stored = readRaw(rel);
  if (stored) return stored;

  const d = await gql(
    `query($code: String!) { reportData { report(code: $code) {
      code title startTime endTime owner { name } zone { id name }
      fights { id encounterID name kill startTime endTime fightPercentage bossPercentage size difficulty friendlyPlayers enemyNPCs { id gameID } }
      masterData {
        actors { id gameID name type subType server petOwner }
        abilities { gameID name icon type }
      }
    } } }`,
    { code }
  );
  const report = d.reportData.report;
  report.masterData.players = report.masterData.actors.filter((a) => a.type === "Player");
  writeRaw(rel, report, report);
  return report;
}

// The heavy part of a report - deaths and player details (specs, roles, gear) -
// only fetched for logs we actually use (several people log the same
// raid). Stored as data/wcl/reports/<code>-detail.json.gz.
async function reportHeavy(report) {
  if (report.deaths) return {}; // older archive files have it inline
  const rel = `reports/${report.code}-detail.json.gz`;
  const stored = readRaw(rel);
  if (stored) return stored;
  needApi("detail");
  // One field per request: together they're heavy enough to make the API 500.
  const code = report.code;
  const span = { code, end: report.endTime - report.startTime };
  const one = async (field) => {
    const vars = field.includes("$end") ? "$code: String!, $end: Float!" : "$code: String!";
    return (await gql(`query(${vars}) { reportData { report(code: $code) { x: ${field} } } }`, field.includes("$end") ? span : { code })).reportData.report.x;
  };
  const heavy = {
    deaths: await one("table(dataType: Deaths, startTime: 0, endTime: $end)"),
    players: await one("playerDetails(startTime: 0, endTime: $end, includeCombatantInfo: true)"),
  };
  writeRaw(rel, heavy, report);
  return heavy;
}

// Everything for the fights of a report we actually use (several people log
// the same raid; only their unique pulls are taken): full casts-by-ability,
// dispels, interrupts, parses for the kills, and a fight-tagged event stream - rezzes, every debuff
// landing on a raider, every dispel/interrupt, plus the mechanic hits and casts
// in src/raids/mechanics.js. Stored as data/wcl/fights/<code>-<hash>.json.gz.
async function reportExtras(report, fightIDs) {
  const hash = crypto.createHash("sha1").update(fightIDs.join(",")).digest("hex").slice(0, 10);
  const rel = `fights/${report.code}-${hash}.json.gz`;
  const stored = readRaw(rel);
  if (stored) return stored;
  needApi("fights");

  const end = report.endTime - report.startTime;
  const d = await gql(
    `query($code: String!, $end: Float!, $ids: [Int]!) { reportData { report(code: $code) {
      casts: table(dataType: Casts, viewBy: Ability, startTime: 0, endTime: $end, fightIDs: $ids)
      dispels: table(dataType: Dispels, startTime: 0, endTime: $end, fightIDs: $ids)
      interrupts: table(dataType: Interrupts, startTime: 0, endTime: $end, fightIDs: $ids)
    } } }`,
    { code: report.code, end, ids: fightIDs }
  );
  const x = { fightIDs, ...d.reportData.report, events: await mechanicEvents(report.code, end, fightIDs) };
  // Parses cost ~2 API points per kill, so only for the kills we actually use.
  const kills = report.fights.filter((f) => f.encounterID && f.kill && fightIDs.includes(f.id)).map((f) => f.id);
  if (kills.length) x.rankings = await rankings(report.code, kills);
  writeRaw(rel, x, report);
  return x;
}

// Parses for some kills. The API occasionally 500s on this one; then ask one
// kill at a time and skip any single kill that keeps failing.
async function rankings(code, kills) {
  const q = `query($code: String!, $ids: [Int]!) { reportData { report(code: $code) { rankings(fightIDs: $ids) } } }`;
  try {
    return (await gql(q, { code, ids: kills })).reportData.report.rankings;
  } catch (e) {
    if (!/failed: 5\d\d/.test(e.message)) throw e;
    const data = [];
    for (const id of kills) {
      try {
        data.push(...((await gql(q, { code, ids: [id] })).reportData.report.rankings?.data || []));
      } catch (e2) {
        if (!/failed: 5\d\d/.test(e2.message)) throw e2;
        console.log(`  (no parses for ${code} fight ${id}: Warcraft Logs keeps erroring)`);
      }
    }
    return { data };
  }
}

const quote = (list) => list.map((n) => `"${n.replace(/"/g, '\\"')}"`).join(", ");
function eventFilter() {
  const m = mechanicAbilities();
  const casts = [...new Set([...m.cast, "Rebirth", "Soulstone Resurrection"])];
  return [
    `type in ("dispel", "interrupt", "resurrect")`,
    `(type in ("applydebuff", "applydebuffstack") and target.type = "player")`,
    `(type = "cast" and ability.name in (${quote(casts)}))`,
    `(type = "damage" and target.type = "player" and ability.name in (${quote(m.hit)}))`,
  ].join(" or ");
}

async function mechanicEvents(code, end, fightIDs) {
  const out = [];
  let start = 0;
  for (let page = 0; page < 50 && start != null; page++) {
    const d = await gql(
      `query($code: String!, $start: Float!, $end: Float!, $ids: [Int]!, $filter: String!) {
        reportData { report(code: $code) {
          events(startTime: $start, endTime: $end, fightIDs: $ids, filterExpression: $filter, limit: 10000) { data nextPageTimestamp }
        } }
      }`,
      { code, start, end, ids: fightIDs, filter: eventFilter() }
    );
    const ev = d.reportData.report.events;
    out.push(...ev.data);
    start = ev.nextPageTimestamp ?? null;
  }
  return out;
}

function trackedCast(a) {
  return TRACKED_CASTS.find((t) => t.name === a.name && (!t.ids || t.ids.includes(a.guid)));
}

// Sum a Dispels/Interrupts table per player: { player: { total, what: { spell: n } } }.
// Tranquilizing Shot removing a boss Frenzy shows up as "dispelling" Enrage/Frenzy;
// that's a hunter job (counted as Tranq casts), not a dispel.
const NOT_DISPELS = new Set(["Enrage", "Frenzy"]);

function tallyRemovals(out, table, icon) {
  for (const spell of table?.data?.entries?.[0]?.entries || []) {
    if (NOT_DISPELS.has(spell.name)) continue;
    icon(spell.name, spell.abilityIcon);
    for (const p of spell.details || []) for (const a of p.abilities || []) icon(a.name, a.abilityIcon || a.icon);
    for (const p of spell.details || []) {
      const t = (out[p.name] ??= { total: 0, what: {} });
      t.total += p.total;
      t.what[spell.name] = (t.what[spell.name] || 0) + p.total;
    }
  }
}

const sortTally = (out) =>
  Object.entries(out)
    .map(([player, t]) => ({ player, ...t }))
    .sort((a, b) => b.total - a.total);

// ---------- Stitching a night together ----------

async function buildNight(night, reports) {
  // Most complete log first: most boss pulls, then longest.
  const bossPulls = (r) => r.fights.filter((f) => f.encounterID).length;
  reports = [...reports].sort(
    (a, b) => bossPulls(b) - bossPulls(a) || b.endTime - b.startTime - (a.endTime - a.startTime)
  );

  const taken = []; // [absStart, absEnd] of fights already used
  const fights = []; // accepted fights, with absolute times + their report
  for (const r of reports) {
    const mine = [];
    for (const f of r.fights) {
      const s = r.startTime + f.startTime;
      const e = r.startTime + f.endTime;
      const overlap = Math.max(0, ...taken.map(([ts, te]) => Math.min(e, te) - Math.max(s, ts)));
      if (overlap > (e - s) / 2) continue; // someone else's log already has this pull
      mine.push({ ...f, absStart: s, absEnd: e, report: r });
    }
    for (const f of mine) taken.push([f.absStart, f.absEnd]);
    fights.push(...mine);
  }
  fights.sort((a, b) => a.absStart - b.absStart);

  const used = reports.filter((r) => fights.some((f) => f.report === r));
  for (const r of used) Object.assign(r, await reportHeavy(r));
  const nightStart = fights[0]?.absStart ?? used[0]?.startTime ?? 0;
  const nightEnd = Math.max(...fights.map((f) => f.absEnd), nightStart);
  const sec = (ms) => Math.round(ms / 1000);

  // Players, by name, across every used log - with spec and role when the log
  // has player details ("Mage-Fire", "healer").
  const players = (r) => r.masterData.players || r.masterData.actors;
  const classOf = new Map();
  const specOf = new Map();
  const roleOf = new Map();
  const present = new Set();
  for (const r of used) {
    const names = new Map(players(r).map((a) => [a.id, a]));
    for (const a of players(r)) classOf.set(a.name, a.subType);
    for (const f of fights.filter((f) => f.report === r)) {
      for (const id of f.friendlyPlayers || []) if (names.has(id)) present.add(names.get(id).name);
    }
    const pd = r.players?.data?.playerDetails || {};
    for (const [role, list] of [["tank", pd.tanks], ["healer", pd.healers], ["dps", pd.dps]]) {
      for (const p of list || []) {
        roleOf.set(p.name, role);
        const spec = p.specs?.sort((a, b) => (b.count || 0) - (a.count || 0))[0]?.spec;
        if (spec) specOf.set(p.name, `${p.type}-${spec}`);
      }
    }
  }

  // Spell name -> icon file (for the page).
  const icons = {};
  const icon = (name, file) => {
    if (name && file && !icons[name]) icons[name] = file;
  };

  // Deaths that happened inside accepted fights.
  const deaths = [];
  for (const r of used) {
    const own = fights.filter((f) => f.report === r);
    for (const d of r.deaths?.data?.entries || []) {
      const abs = r.startTime + d.timestamp;
      const fight = own.find((f) => f.id === d.fight) || own.find((f) => abs >= f.absStart && abs <= f.absEnd);
      if (!fight) continue;
      deaths.push({
        player: d.name,
        class: d.type || classOf.get(d.name) || null,
        at: sec(abs - nightStart),
        boss: fight.encounterID ? fight.name : null,
        pull: fights.indexOf(fight),
        killingBlow: d.killingBlow?.name || null,
        killer: topSource(d.damage?.sources),
        overkill: d.overkill || 0,
      });
      icon(d.killingBlow?.name, d.killingBlow?.abilityIcon);
      if (d.icon && d.icon.includes("-") && !specOf.has(d.name)) specOf.set(d.name, d.icon);
    }
  }
  deaths.sort((a, b) => a.at - b.at);
  // Two logs that only partly overlap can both report the same death.
  for (let i = deaths.length - 1; i > 0; i--) {
    const dupe = deaths.slice(0, i).some((d) => d.player === deaths[i].player && deaths[i].at - d.at <= 3);
    if (dupe) deaths.splice(i, 1);
  }
  const seenPull = new Set();
  for (const d of deaths) {
    d.firstOfPull = !seenPull.has(d.pull);
    seenPull.add(d.pull);
  }

  // Roles from what people actually cast. Warcraft Logs has no talent data for
  // Classic Era, so its spec/role labels are guesses (holy paladins as Ret...).
  const castsBy = new Map(); // name -> { heal, tank, total }
  const extrasOf = new Map();
  for (const r of used) {
    const own = fights.filter((f) => f.report === r);
    const x = await reportExtras(r, own.map((f) => f.id));
    extrasOf.set(r, x);
    for (const a of x.casts?.data?.entries || []) {
      const by = a.subentries?.length ? a.subentries.map((e) => [e.actorName, e.total]) : (a.sources || []).map((e) => [e.name, e.total]);
      for (const [name, c] of by) {
        const t = castsBy.get(name) || { heal: 0, tank: 0, total: 0 };
        t.total += c;
        if (HEAL_SPELLS.has(a.name)) t.heal += c;
        if (TANK_SPELLS.has(a.name)) t.tank += c;
        castsBy.set(name, t);
      }
    }
  }
  for (const name of present) {
    const c = castsBy.get(name);
    if (c?.total) roleOf.set(name, c.heal > c.total * 0.5 ? "healer" : c.tank >= 15 ? "tank" : "dps");
  }

  // Quiet work: dispels, interrupts, resurrections and tracked casts - plus the
  // per-boss mechanics, from each report's fight-tagged event stream.
  const dispels = {};
  const interrupts = {};
  const casts = {};
  const rezzes = [];
  const perBoss = new Map(); // encounterID -> { mech, dispels, kicks, present }
  for (const r of used) {
    const own = fights.filter((f) => f.report === r);
    const x = extrasOf.get(r);
    tallyRemovals(dispels, x.dispels, icon);
    tallyRemovals(interrupts, x.interrupts, icon);
    for (const a of x.casts?.data?.entries || []) {
      const t = trackedCast(a);
      if (!t) continue;
      icon(t.name, a.abilityIcon);
      const slot = (casts[t.name] ??= { category: t.category, by: {} });
      const by = a.subentries?.length ? a.subentries.map((e) => [e.actorName, e.total]) : (a.sources || []).map((e) => [e.name, e.total]);
      for (const [name, total] of by) slot.by[name] = (slot.by[name] || 0) + total;
    }

    const actor = new Map(r.masterData.actors.map((a) => [a.id, a]));
    const isPlayer = (id) => actor.get(id)?.type === "Player";
    const ability = new Map((r.masterData.abilities || []).map((a) => [a.gameID, a]));
    const spell = (id) => ability.get(id)?.name || REZ_SPELLS[id] || `spell ${id}`;
    for (const a of r.masterData.abilities || []) icon(a.name, a.icon);

    for (const e of x.events || []) {
      const fight = own.find((f) => f.id === e.fight);
      if (!fight) continue;
      if (e.type === "resurrect") {
        rezzes.push({
          by: actor.get(e.sourceID)?.name || null,
          target: actor.get(e.targetID)?.name || null,
          ability: spell(e.abilityGameID),
          boss: fight.encounterID ? fight.name : null,
          at: sec(r.startTime + e.timestamp - nightStart),
        });
        continue;
      }
      if (!fight.encounterID) continue;
      const pb = bossSlot(perBoss, fight.encounterID);
      const src = actor.get(e.sourceID)?.name;
      const tgt = actor.get(e.targetID)?.name;
      if (e.type === "dispel" && isPlayer(e.sourceID) && !NOT_DISPELS.has(spell(e.extraAbilityGameID))) bump(pb.dispels, src, spell(e.extraAbilityGameID));
      if (e.type === "interrupt" && isPlayer(e.sourceID)) bump(pb.kicks, src, spell(e.extraAbilityGameID));
      for (const m of MECHANICS[fight.encounterID] || []) {
        const name = m.kind === "dispel" || m.kind === "kick" ? spell(e.extraAbilityGameID) : spell(e.abilityGameID);
        if (!m.abilities.includes(name)) continue;
        const who =
          m.kind === "hit" && e.type === "damage" && isPlayer(e.targetID) ? tgt
          : m.kind === "debuff" && e.type.startsWith("applydebuff") && isPlayer(e.targetID) ? tgt
          : m.kind === "cast" && e.type === "cast" && isPlayer(e.sourceID) ? src
          : m.kind === "dispel" && e.type === "dispel" && isPlayer(e.sourceID) ? src
          : m.kind === "kick" && e.type === "interrupt" && isPlayer(e.sourceID) ? src
          : null;
        if (who) bump((pb.mech[m.key] ??= {}), who);
      }
    }
    for (const f of own.filter((f) => f.encounterID)) {
      const pb = bossSlot(perBoss, f.encounterID);
      for (const id of f.friendlyPlayers || []) if (isPlayer(id)) pb.present.add(actor.get(id).name);
    }
    // Parses: Warcraft Logs' rank % per player on each kill (dps, or hps for healers).
    for (const rk of (x.rankings || r.rankings)?.data || []) {
      if (!own.some((f) => f.id === rk.fightID)) continue;
      const pb = bossSlot(perBoss, rk.encounter?.id);
      for (const [role, group] of Object.entries(rk.roles || {})) {
        for (const c of group.characters || []) {
          if (c.rankPercent == null || pb.parses.some((x) => x.player === c.name)) continue;
          const ranked = role === "healers" ? "healer" : role === "tanks" ? "tank" : "dps";
          // A healer ranked on damage (or the other way round) is a meaningless parse.
          const played = roleOf.get(c.name);
          if (played && (played === "healer") !== (ranked === "healer")) continue;
          pb.parses.push({
            player: c.name,
            role: ranked,
            spec: null,
            pct: Math.round(c.rankPercent),
            amount: Math.round(c.amount || 0),
          });
        }
      }
    }
  }
  rezzes.sort((a, b) => a.at - b.at);

  // Boss-by-boss pulls.
  const bosses = [];
  for (const f of fights.filter((f) => f.encounterID)) {
    let b = bosses.find((x) => x.encounterId === f.encounterID);
    if (!b) bosses.push((b = { name: f.name, encounterId: f.encounterID, killed: false, pulls: [] }));
    const pull = fights.indexOf(f);
    b.pulls.push({
      kill: !!f.kill,
      at: sec(f.absStart - nightStart),
      durationSec: sec(f.absEnd - f.absStart),
      bossPctLeft: f.kill ? 0 : f.fightPercentage != null ? Math.round(f.fightPercentage) : null,
      deaths: deaths.filter((d) => d.pull === pull).length,
      src: { code: f.report.code, fight: f.id }, // where to find this pull in data/wcl (replays)
    });
    if (f.kill) b.killed = true;
  }
  for (const b of bosses) {
    const kill = b.pulls.find((p) => p.kill);
    b.wipes = b.pulls.filter((p) => !p.kill).length;
    b.killTimeSec = kill ? kill.durationSec : null;
    const pb = perBoss.get(b.encounterId);
    if (pb) {
      b.present = [...pb.present].sort();
      b.mech = pb.mech; // { mechanicKey: { player: count } } - see src/raids/mechanics.js
      b.dispels = flatTally(pb.dispels);
      b.kicks = flatTally(pb.kicks);
      b.parses = pb.parses.sort((x, y) => y.pct - x.pct);
    }
  }

  const kills = bosses.filter((b) => b.killed).length;
  return {
    schema: SCHEMA,
    night,
    // Every log of the night: a combined "BWL/MC" log only carries one zone name.
    zones: [...new Set(reports.map((r) => r.zone?.name).filter(Boolean))],
    zoneIds: [...new Set(reports.map((r) => r.zone?.id).filter(Boolean))],
    start: new Date(nightStart).toISOString(),
    durationMin: Math.round((nightEnd - nightStart) / 60000),
    sources: used.map((r) => ({
      code: r.code,
      title: r.title,
      owner: r.owner?.name ?? null,
      url: `${SITE_URL}/reports/${r.code}`,
    })),
    // No spec: Warcraft Logs only guesses it for Classic Era (no talent data).
    raiders: [...present].sort().map((name) => ({ name, class: classOf.get(name) || null, spec: null, role: roleOf.get(name) || null })),
    totals: {
      pulls: bosses.reduce((n, b) => n + b.pulls.length, 0),
      kills,
      wipes: bosses.reduce((n, b) => n + b.wipes, 0),
      deaths: deaths.length,
      trashDeaths: deaths.filter((d) => !d.boss).length,
    },
    bosses,
    deaths,
    dispels: sortTally(dispels),
    interrupts: sortTally(interrupts),
    rezzes,
    casts,
    icons,
  };
}

// ---------- helpers ----------

const HEAL_SPELLS = new Set(["Flash Heal", "Heal", "Greater Heal", "Lesser Heal", "Prayer of Healing", "Renew", "Holy Light", "Flash of Light", "Healing Touch", "Regrowth", "Rejuvenation", "Holy Shock", "Swiftmend", "Power Word: Shield", "Desperate Prayer"]);
const TANK_SPELLS = new Set(["Taunt", "Shield Block", "Revenge", "Shield Slam", "Growl", "Maul", "Swipe", "Righteous Fury", "Mocking Blow", "Challenging Roar"]);

function bossSlot(map, id) {
  if (!map.has(id)) map.set(id, { mech: {}, dispels: {}, kicks: {}, present: new Set(), parses: [] });
  return map.get(id);
}
// bump(tally, player)        -> { player: n }
// bump(tally, player, what)  -> { player: { total, what: { spell: n } } }
function bump(tally, who, what) {
  if (!who) return;
  if (what === undefined) {
    tally[who] = (tally[who] || 0) + 1;
    return;
  }
  const t = (tally[who] ??= { total: 0, what: {} });
  t.total++;
  t.what[what] = (t.what[what] || 0) + 1;
}
const flatTally = (t) => Object.entries(t).map(([player, v]) => ({ player, ...v })).sort((a, b) => b.total - a.total);

// Who did the most damage in a death window: { name, type } (type is a class
// name when a raid member did it - mind control, Bomb, a friendly Whirlwind...).
function topSource(sources) {
  const top = [...(sources || [])].sort((a, b) => b.total - a.total)[0];
  return top ? { name: top.name, type: top.type } : null;
}

const REZ_SPELLS = { 20748: "Rebirth", 20765: "Soulstone Resurrection", 20770: "Resurrection", 20773: "Redemption" };

function nightOf(ms) {
  const shifted = new Date(ms - NIGHT_CUTOFF_HOUR * 3600e3);
  return shifted.toLocaleDateString("sv-SE", { timeZone: TIMEZONE }); // YYYY-MM-DD
}

function groupBy(list, key) {
  const m = new Map();
  for (const x of list) {
    const k = key(x);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  }
  return m;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (["--force", "--refresh", "--list", "--newest-first", "--rebuild"].includes(a)) out[a.slice(2)] = true;
    else if (a === "--since" || a === "--night") out[a.slice(2)] = argv[++i];
    else throw new Error(`Unknown option ${a}`);
  }
  return out;
}
