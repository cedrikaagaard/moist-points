// Fight replays: damage and healing over time for every boss kill, so the site
// can play a fight back. Separate from raids:fetch because it's the expensive
// part (two graph queries per kill) - run it whenever there's spare API budget.
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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW = path.join(ROOT, "data/wcl");
const NIGHTS = path.join(ROOT, "src/raids/data/nights");
const OUT = path.join(ROOT, "src/raids/data/replays");
const RESERVE = 40;

const args = { force: process.argv.includes("--force"), night: process.argv[process.argv.indexOf("--night") + 1] };
if (!process.argv.includes("--night")) args.night = null;

main().catch((e) => {
  console.error(e.message);
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

      const rawRel = `replays/${kill.src.code}-${kill.src.fight}.json.gz`;
      let raw = readRaw(rawRel);
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

// Graph series -> per-player amounts per step (seconds), players only.
function series(graph, fight, players) {
  const out = [];
  let step = 1;
  for (const s of graph?.data?.series || []) {
    const p = players.get(s.name);
    if (!p) continue; // pets, totals, NPCs
    const interval = (s.pointInterval || 1000) / 1000;
    step = interval;
    const vals = (s.data || []).map((v) => (Array.isArray(v) ? v[1] : v) || 0);
    // Graph values are a rate (per second); turn them into an amount per step.
    out.push({ ...p, vals: vals.map((v) => Math.round(v * interval)) });
  }
  out.sort((a, b) => b.vals.reduce((t, v) => t + v, 0) - a.vals.reduce((t, v) => t + v, 0));
  return { step, players: out.map(({ vals, ...p }) => p), series: out.map((x) => x.vals) };
}

function buildReplay(n, b, kill, raw) {
  const players = new Map(n.raiders.map((r) => [r.name, { name: r.name, class: r.class, spec: r.spec }]));
  const damage = series(raw.damage, raw.fight, players);
  const healing = series(raw.healing, raw.fight, players);

  // Ticker: deaths and this boss's mechanics, seconds into the pull.
  const events = n.deaths
    .filter((d) => d.boss === b.name && d.at >= kill.at - 1 && d.at <= kill.at + kill.durationSec + 2)
    .map((d) => ({ t: Math.max(0, d.at - kill.at), kind: "death", player: d.player, text: `died · ${d.killingBlow || "Unknown"}`, icon: d.killingBlow || "Unknown" }));
  for (const e of mechanicEvents(kill.src, b.encounterId)) events.push(e);
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
function mechanicEvents(src, encounterId) {
  const list = MECHANICS[encounterId] || [];
  if (!list.length) return [];
  const dir = path.join(RAW, "fights");
  if (!fs.existsSync(dir)) return [];
  const base = readRaw(`reports/${src.code}.json.gz`);
  const file = fs.readdirSync(dir).find((f) => f.startsWith(`${src.code}-`) && readRaw(`fights/${f}`)?.fightIDs?.includes(src.fight));
  if (!base || !file) return [];
  const x = readRaw(`fights/${file}`);
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
        (m.kind === "hit" && e.type === "damage") ||
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
