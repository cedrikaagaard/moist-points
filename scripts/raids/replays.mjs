// Fight replays: damage and healing over time for every boss kill, so the site
// can play a fight back. Computed from the full combat log (data/events/) when
// it's on disk - free and exact. Older nights without one fall back to two graph
// queries per kill (--offline: skip those).
//
//   npm run raids:replays                 newest nights first, until the budget runs low
//   npm run raids:replays -- --night 2026-10-07
//   npm run raids:replays -- --force      rebuild replay files from data/wcl (free)
//
// Raw responses go to data/wcl/replays/<code>-<fight>.json.gz; the compact
// replay the page loads goes to src/raids/data/replays/<night>-<encounterId>.json.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { gql, rateLimit } from "./wcl.mjs";
import { MECHANICS } from "../../src/raids/mechanics.js";
import { hasEvents, deriveLog } from "./derive.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW = path.join(ROOT, "data/wcl");
const NIGHTS = path.join(ROOT, "src/raids/data/nights");
const OUT = path.join(ROOT, "src/raids/data/replays");
const RESERVE = 40;

const args = { force: process.argv.includes("--force"), offline: process.argv.includes("--offline"), night: process.argv[process.argv.indexOf("--night") + 1] };
if (!process.argv.includes("--night")) args.night = null;

main().catch((e) => {
  console.error(e.message);
  // Hit the hourly limit mid-way: that's "come back later", not a failure.
  if (/failed: 429/.test(e.message)) {
    console.log("API budget used up mid-run; resets in 15 min. Run again then.");
    process.exit(75);
  }
  process.exit(1);
});

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const nights = fs
    .readdirSync(NIGHTS)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .filter((n) => !args.night || n === args.night)
    .sort()
    .reverse();

  let made = 0;
  for (const night of nights) {
    const n = JSON.parse(fs.readFileSync(path.join(NIGHTS, `${night}.json`), "utf8"));
    for (const b of n.bosses) {
      const kill = b.pulls.find((p) => p.kill);
      if (!kill?.src) continue; // night file predates replay support - rerun raids:fetch --force
      const file = path.join(OUT, `${night}-${b.encounterId}.json`);
      if (fs.existsSync(file) && !args.force) continue;

      const log = fullLog(night, kill.src.code);
      if (log) {
        fs.writeFileSync(file, JSON.stringify(buildReplay(n, b, kill, null, log)) + "\n");
        made++;
        console.log(`${night}  ${b.name}`);
        continue;
      }
      const rawRel = `replays/${kill.src.code}-${kill.src.fight}.json.gz`;
      let raw = readRaw(rawRel);
      if (args.offline && !raw) continue;
      if (!raw) {
        const rl = await rateLimit();
        if (rl.pointsSpentThisHour > rl.limitPerHour - RESERVE) {
          console.log(`API budget nearly spent (${Math.round(rl.pointsSpentThisHour)}/${rl.limitPerHour}); resets in ${Math.ceil(rl.pointsResetIn / 60)} min. ${made} replays written this run.`);
          process.exitCode = 75;
          return;
        }
        raw = await fetchGraphs(kill.src.code, kill.src.fight);
        writeRaw(rawRel, raw);
      }
      fs.writeFileSync(file, JSON.stringify(buildReplay(n, b, kill, raw)) + "\n");
      made++;
      console.log(`${night}  ${b.name}`);
    }
  }
  console.log(`${made} replays written.`);
}

async function fetchGraphs(code, fight) {
  const r = await gql(
    `query($code: String!, $ids: [Int]!) { reportData { report(code: $code) { fights(fightIDs: $ids) { id startTime endTime } } } }`,
    { code, ids: [fight] }
  );
  const f = r.reportData.report.fights[0];
  const d = await gql(
    `query($code: String!, $ids: [Int]!, $s: Float!, $e: Float!) { reportData { report(code: $code) {
      damage: graph(dataType: DamageDone, fightIDs: $ids, startTime: $s, endTime: $e)
      healing: graph(dataType: Healing, fightIDs: $ids, startTime: $s, endTime: $e)
    } } }`,
    { code, ids: [fight], s: f.startTime, e: f.endTime }
  );
  return { fight: f, ...d.reportData.report };
}

// Graph series -> per-player amounts per step, players only. Warcraft Logs
// gives a smoothed rate per point; we keep its shape but scale each player so
// the steps add up to their exact total for the fight.
function series(graph, players) {
  const out = [];
  let step = 1;
  for (const s of graph?.data?.series || []) {
    const p = players.get(s.name);
    if (!p || !s.total) continue; // pets, totals, NPCs, idle
    step = (s.pointInterval || 1000) / 1000;
    const vals = (s.data || []).map((v) => Math.max(0, (Array.isArray(v) ? v[1] : v) || 0));
    const sum = vals.reduce((t, v) => t + v, 0) || 1;
    out.push({ ...p, total: s.total, vals: vals.map((v) => Math.round((v / sum) * s.total)) });
  }
  out.sort((a, b) => b.total - a.total);
  return { step: Math.round(step * 1000) / 1000, players: out.map(({ vals, total, ...p }) => p), series: out.map((x) => x.vals) };
}

// From the full log: exact amounts per second, bucketed so a fight has ~150 steps.
function seriesFromLog(perSec, players, durationSec) {
  const step = Math.max(1, Math.ceil(durationSec / 150));
  const steps = Math.ceil(durationSec / step);
  const out = [];
  for (const [name, secs] of Object.entries(perSec)) {
    const p = players.get(name);
    if (!p) continue;
    const vals = Array(steps).fill(0);
    secs.forEach((v, i) => (vals[Math.min(steps - 1, Math.floor(i / step))] += v));
    const total = vals.reduce((t, v) => t + v, 0);
    if (total) out.push({ ...p, total, vals });
  }
  out.sort((a, b) => b.total - a.total);
  return { step, players: out.map(({ vals, total, ...p }) => p), series: out.map((x) => x.vals) };
}

function buildReplay(n, b, kill, raw, log) {
  const players = new Map(n.raiders.map((r) => [r.name, { name: r.name, class: r.class, spec: r.spec }]));
  const d = log?.fights[kill.src.fight];
  const damage = d ? seriesFromLog(d.perSec.damage, players, kill.durationSec) : series(raw.damage, players);
  const healing = d ? seriesFromLog(d.perSec.healing, players, kill.durationSec) : series(raw.healing, players);

  // Ticker: deaths and this boss's mechanics, seconds into the pull.
  const events = n.deaths
    .filter((d) => d.boss === b.name && d.at >= kill.at - 1 && d.at <= kill.at + kill.durationSec + 2)
    .map((d) => ({ t: Math.max(0, d.at - kill.at), kind: "death", player: d.player, text: `died · ${d.killingBlow || "Unknown"}`, icon: d.killingBlow || "Unknown" }));
  for (const e of mechanicEvents(kill.src, b.encounterId, log)) events.push(e);
  events.sort((a, c) => a.t - c.t);

  return {
    night: n.night,
    encounterId: b.encounterId,
    durationSec: kill.durationSec,
    step: damage.step || healing.step || 1,
    damage: damage.players.length ? { players: damage.players, series: damage.series } : null,
    healing: healing.players.length ? { players: healing.players, series: healing.series } : null,
    events,
  };
}

// Mechanic moments from the stored event stream (data/wcl/fights/*.json.gz).
function mechanicEvents(src, encounterId, log) {
  const list = MECHANICS[encounterId] || [];
  if (!list.length) return [];
  const dir = path.join(RAW, "fights");
  const base = readRaw(`reports/${src.code}.json.gz`);
  const file = !log && fs.existsSync(dir) && fs.readdirSync(dir).find((f) => f.startsWith(`${src.code}-`) && !f.includes("-pull") && !f.includes("-rankings-") && readRaw(`fights/${f}`)?.fightIDs?.includes(src.fight));
  if (!base || (!log && !file)) return [];
  const x = log || readRaw(`fights/${file}`);
  const fight = base.fights.find((f) => f.id === src.fight);
  const actor = new Map(base.masterData.actors.map((a) => [a.id, a]));
  const ability = new Map((base.masterData.abilities || []).map((a) => [a.gameID, a.name]));
  const out = [];
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
      if (!ok) continue;
      const who = m.kind === "hit" || m.kind === "debuff" ? e.targetID : e.sourceID;
      if (actor.get(who)?.type !== "Player") continue;
      out.push({ t: Math.round((e.timestamp - fight.startTime) / 100) / 10, kind: m.tone, player: actor.get(who).name, text: m.label, icon: name });
    }
  }
  // Ticking damage (Chill, Rain of Fire...) would flood the ticker: keep one per player per 5s.
  const seen = new Map();
  return out.filter((e) => {
    const k = `${e.player}|${e.text}`;
    if (seen.has(k) && e.t - seen.get(k) < 5) return false;
    seen.set(k, e.t);
    return true;
  });
}

// Full combat log of one report (data/events/), derived once per run.
var logs; // var: main() runs before this line
function fullLog(night, code) {
  logs ||= new Map();
  const KEEP = ["dispel", "interrupt", "applydebuff", "cast", "damage"];
  const k = `${night}/${code}`;
  if (!logs.has(k)) {
    const base = readRaw(`reports/${code}.json.gz`);
    logs.set(k, base && hasEvents(night, code) ? deriveLog(night, base, (e) => KEEP.includes(e.type)) : null);
  }
  return logs.get(k);
}

function readRaw(rel) {
  const file = path.join(RAW, rel);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString("utf8"));
}
function writeRaw(rel, data) {
  const file = path.join(RAW, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, zlib.gzipSync(JSON.stringify(data), { level: 9 }));
}
