// The complete combat log of every raid night: every event Warcraft Logs has
// (hits, heals, casts, buffs, debuffs, deaths, resources incl. mana/health),
// for exactly the fights each night uses (several people log the same raid;
// each night is stored once). This is the source of truth for future features:
// anything new can be computed from it offline, without asking the API again.
//
//   npm run raids:events                 newest nights first, until the budget runs low
//   npm run raids:events -- --night 2026-10-07
//
// Stored locally, NOT in git (too big): data/events/<night>/<code>/page-NNN.json.gz
// plus done.json when a log is complete. Resumable: a stopped download carries on
// from the last saved page.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { gql, rateLimit } from "./wcl.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const NIGHTS = path.join(ROOT, "src/raids/data/nights");
const RAW = path.join(ROOT, "data/wcl");
const OUT = path.join(ROOT, "data/events");
const RESERVE = 25; // stop before the hourly budget runs dry (1 point per page)
const MIN_FREE_GB = 2; // never fill the disk

const only = process.argv.includes("--night") ? process.argv[process.argv.indexOf("--night") + 1] : null;

main().catch((e) => {
  console.error(e.message);
  if (/failed: 429/.test(e.message)) {
    console.log("API budget used up mid-run; resets in 15 min. Run again then.");
    process.exit(75);
  }
  process.exit(1);
});

async function main() {
  const nights = fs
    .readdirSync(NIGHTS)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .filter((n) => !only || n === only)
    .sort()
    .reverse();
  let pagesThisRun = 0;
  for (const night of nights) {
    const n = JSON.parse(fs.readFileSync(path.join(NIGHTS, `${night}.json`), "utf8"));
    for (const src of n.sources) {
      const dir = path.join(OUT, night, src.code);
      if (fs.existsSync(path.join(dir, "done.json"))) continue;
      const base = readRaw(`reports/${src.code}.json.gz`);
      const fightIDs = usedFights(src.code, n);
      if (!base || !fightIDs) continue; // night not archived yet - raids:fetch first
      fs.mkdirSync(dir, { recursive: true });
      const progress = readJson(path.join(dir, "progress.json")) || { next: 0, page: 0, events: 0 };
      const end = base.endTime - base.startTime;
      while (progress.next != null) {
        if (pagesThisRun % 5 === 0) {
          const rl = await rateLimit();
          if (rl.pointsSpentThisHour > rl.limitPerHour - RESERVE) {
            console.log(`API budget nearly spent (${Math.round(rl.pointsSpentThisHour)}/${rl.limitPerHour}); resets in ${Math.ceil(rl.pointsResetIn / 60)} min. Run again then.`);
            process.exitCode = 75;
            return;
          }
          if (freeGb() < MIN_FREE_GB) throw new Error(`Less than ${MIN_FREE_GB} GB disk free - stopping (move data/events somewhere roomier)`);
        }
        const d = await gql(
          `query($code: String!, $start: Float!, $end: Float!, $ids: [Int]!) { reportData { report(code: $code) {
            events(startTime: $start, endTime: $end, fightIDs: $ids, limit: 10000, includeResources: true) { data nextPageTimestamp }
          } } }`,
          { code: src.code, start: progress.next, end, ids: fightIDs }
        );
        const ev = d.reportData.report.events;
        fs.writeFileSync(path.join(dir, `page-${String(progress.page).padStart(3, "0")}.json.gz`), zlib.gzipSync(JSON.stringify(ev.data), { level: 9 }));
        progress.page++;
        progress.events += ev.data.length;
        progress.next = ev.nextPageTimestamp ?? null;
        pagesThisRun++;
        fs.writeFileSync(path.join(dir, "progress.json"), JSON.stringify(progress));
      }
      fs.writeFileSync(path.join(dir, "done.json"), JSON.stringify({ code: src.code, night, fightIDs, pages: progress.page, events: progress.events, fetchedAt: new Date().toISOString(), includeResources: true }));
      console.log(`${night}  ${src.code}: ${progress.events.toLocaleString()} events in ${progress.page} pages`);
    }
  }
  console.log(`Done (${pagesThisRun} pages this run).`);
}

// The fights of this log the night actually uses (from its archived per-fight data).
function usedFights(code, n) {
  const dir = path.join(RAW, "fights");
  if (!fs.existsSync(dir)) return null;
  for (const f of fs.readdirSync(dir).filter((f) => f.startsWith(`${code}-`) && /^[^-]+-[0-9a-f]{10}\.json\.gz$/.test(f))) {
    const x = readRaw(`fights/${f}`);
    const pulls = n.bosses.flatMap((b) => b.pulls.map((p) => p.src)).filter((s) => s?.code === code);
    if (x?.fightIDs && pulls.every((p) => x.fightIDs.includes(p.fight))) return x.fightIDs;
  }
  return null;
}

function readRaw(rel) {
  const p = path.join(RAW, rel);
  return fs.existsSync(p) ? JSON.parse(zlib.gunzipSync(fs.readFileSync(p)).toString("utf8")) : null;
}
function readJson(p) {
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
}
function freeGb() {
  try {
    const s = fs.statfsSync(ROOT);
    return (s.bavail * s.bsize) / 1e9;
  } catch {
    return Infinity;
  }
}
