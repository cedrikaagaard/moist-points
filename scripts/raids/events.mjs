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
import { fileURLToPath, pathToFileURL } from "node:url";
import { gql, rateLimit } from "./wcl.mjs";
import { nightOf, groupBy, stitch } from "./stitch.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const NIGHTS = path.join(ROOT, "src/raids/data/nights");
const RAW = path.join(ROOT, "data/wcl");
const OUT = path.join(ROOT, "data/events");
const RESERVE = 25; // stop before the hourly budget runs dry (1 point per page)
const MIN_FREE_GB = 2; // never fill the disk

const only = process.argv.includes("--night") ? process.argv[process.argv.indexOf("--night") + 1] : null;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e.message);
    if (/failed: 429/.test(e.message)) {
      console.log("API budget used up mid-run; resets in 15 min. Run again then.");
      process.exit(75);
    }
    process.exit(1);
  });
}

// Backfill the full log for nights already on the site (newest first).
async function main() {
  const list = JSON.parse(fs.readFileSync(path.join(RAW, "reports.json"), "utf8"));
  const byNight = groupBy(list, (r) => nightOf(r.startTime));
  const nights = fs
    .readdirSync(NIGHTS)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .filter((n) => !only || n === only)
    .sort()
    .reverse();
  for (const night of nights) {
    const reports = (byNight.get(night) || []).map((r) => readRaw(`reports/${r.code}.json.gz`));
    if (!reports.length || reports.some((r) => !r)) continue; // night not archived yet - raids:fetch first
    const { fights } = stitch(reports);
    for (const r of reports) {
      const ids = fights.filter((f) => f.report === r).map((f) => f.id);
      if (!ids.length) continue;
      if (!(await downloadEvents(night, r, ids))) {
        process.exitCode = 75;
        return;
      }
    }
  }
  console.log(`Done (${pagesThisRun} pages this run).`);
}

// Download one log's full event stream for the given fights into
// data/events/<night>/<code>/. Resumes a stopped download. Returns false when
// the hourly API budget is nearly spent (run again after the reset).
let pagesThisRun = 0;
export async function downloadEvents(night, report, fightIDs) {
  const dir = path.join(OUT, night, report.code);
  const done = readJson(path.join(dir, "done.json"));
  if (done && done.fightIDs.join() === fightIDs.join()) return true;
  fs.mkdirSync(dir, { recursive: true });
  let progress = readJson(path.join(dir, "progress.json"));
  if (done || (progress && progress.fightIDs?.join() !== fightIDs.join())) {
    // A different set of fights than last time: start over.
    for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f));
    progress = null;
  }
  progress ||= { fightIDs, next: 0, page: 0, events: 0 };
  const end = report.endTime - report.startTime;
  while (progress.next != null) {
    if (pagesThisRun % 5 === 0) {
      const rl = await rateLimit();
      if (rl.pointsSpentThisHour > rl.limitPerHour - RESERVE) {
        console.log(`API budget nearly spent (${Math.round(rl.pointsSpentThisHour)}/${rl.limitPerHour}); resets in ${Math.ceil(rl.pointsResetIn / 60)} min. Run again then.`);
        return false;
      }
      if (freeGb() < MIN_FREE_GB) throw new Error(`Less than ${MIN_FREE_GB} GB disk free - stopping (move data/events somewhere roomier)`);
    }
    const d = await gql(
      `query($code: String!, $start: Float!, $end: Float!, $ids: [Int]!) { reportData { report(code: $code) {
        events(startTime: $start, endTime: $end, fightIDs: $ids, limit: 10000, includeResources: true) { data nextPageTimestamp }
      } } }`,
      { code: report.code, start: progress.next, end, ids: fightIDs }
    );
    const ev = d.reportData.report.events;
    fs.writeFileSync(path.join(dir, `page-${String(progress.page).padStart(3, "0")}.json.gz`), zlib.gzipSync(JSON.stringify(ev.data), { level: 9 }));
    progress.page++;
    progress.events += ev.data.length;
    progress.next = ev.nextPageTimestamp ?? null;
    pagesThisRun++;
    fs.writeFileSync(path.join(dir, "progress.json"), JSON.stringify(progress));
  }
  fs.writeFileSync(path.join(dir, "done.json"), JSON.stringify({ code: report.code, night, fightIDs, pages: progress.page, events: progress.events, fetchedAt: new Date().toISOString(), includeResources: true }));
  fs.rmSync(path.join(dir, "progress.json"), { force: true });
  console.log(`${night}  ${report.code}: ${progress.events.toLocaleString()} events in ${progress.page} pages`);
  return true;
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
