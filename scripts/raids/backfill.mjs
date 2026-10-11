// Raid data backfill runner: full combat logs (data/events/) + fight replays
// for every night that is missing them. Data only, no analysis, no prose.
//
//   npm run raids:backfill                          newest nights first
//   npm run raids:backfill -- --since 2025-06-01    only nights on/after this date
//   npm run raids:backfill -- --max-nights 10       stop after 10 nights
//   npm run raids:backfill -- --max-points 300      stop after ~300 API points
//   npm run raids:backfill -- --dry-run             survey only, download nothing
//   npm run raids:backfill -- --graphs              allow API graph queries for
//                                                   replays when no full log exists
//                                                   (default: replays only from disk, free)
//
// The run is resumable by design: finished nights are skipped on the next run,
// interrupted event downloads carry on from the last saved page. Exit codes:
// 0 = queue empty, 75 = hourly API budget nearly spent (run again after the
// reset), 130 = interrupted, 1 = a night actually failed (others still done).
//
// Costs roughly 10-60 API points per night (1 per 10k-event page). Replays built
// from a downloaded log are free. See BACKFILL.md for the full guide.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { rateLimit } from "./wcl.mjs";
import { nightOf, groupBy, stitch } from "./stitch.mjs";
import { downloadEvents } from "./events.mjs";
import { hasEvents } from "./derive.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const NIGHTS = path.join(ROOT, "src/raids/data/nights");
const RAW = path.join(ROOT, "data/wcl");
const REPLAYS = path.join(ROOT, "src/raids/data/replays");

// ---------- args ----------
const argv = process.argv.slice(2);
const flag = (k) => argv.includes(k);
const val = (k, dflt = null) => {
  const i = argv.indexOf(k);
  return i === -1 ? dflt : argv[i + 1];
};
if (flag("--help") || flag("-h")) {
  console.log(`usage: npm run raids:backfill -- [options]

  --since YYYY-MM-DD   only nights on/after this date (default: all the way back)
  --until YYYY-MM-DD   only nights on/before this date
  --max-nights N       stop after N nights (finished or not)
  --max-points N       stop after spending ~N API points this run
  --reserve N          keep N points of hourly budget untouched (default 130)
  --graphs             allow paid API graph queries for replays without a full log
  --dry-run            survey and estimate, download nothing
  --quiet              plain lines, no dashboard or colours
  --log-file PATH      append the run log here (default: data/events/backfill.log)

exit codes: 0 = queue empty · 75 = budget nearly spent, run again after reset ·
            130 = interrupted · 1 = one or more nights failed`);
  process.exit(0);
}
const OPT = {
  since: val("--since"),
  until: val("--until"),
  maxNights: val("--max-nights") ? +val("--max-nights") : null,
  maxPoints: val("--max-points") ? +val("--max-points") : null,
  reserve: val("--reserve") ? +val("--reserve") : 130,
  graphs: flag("--graphs"),
  dry: flag("--dry-run"),
  quiet: flag("--quiet"),
  logFile: val("--log-file", path.join(ROOT, "data/events/backfill.log")),
};

// ---------- tiny zero-dep terminal UI ----------
const TTY = process.stdout.isTTY && !process.env.NO_COLOR && process.env.TERM !== "dumb" && !OPT.quiet;
const C = TTY
  ? { reset: "\x1b[0m", dim: "\x1b[2m", b: "\x1b[1m", g: "\x1b[32m", y: "\x1b[33m", r: "\x1b[31m", c: "\x1b[36m", m: "\x1b[35m" }
  : { reset: "", dim: "", b: "", g: "", y: "", r: "", c: "", m: "" };
const SPIN = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const logLines = [];
function fileLog(s) {
  try {
    fs.mkdirSync(path.dirname(OPT.logFile), { recursive: true });
    fs.appendFileSync(OPT.logFile, s.replace(/\x1b\[[0-9;]*m/g, "") + "\n");
  } catch { /* logging must never break the run */ }
}
function say(s) {
  logLines.push(s);
  fileLog(s);
  if (!TTY) console.log(s.replace(/\x1b\[[0-9;]*m/g, ""));
}
const bar = (frac, w = 22) => {
  const f = Math.max(0, Math.min(1, frac));
  const n = Math.round(f * w);
  return "█".repeat(n) + "░".repeat(w - n);
};
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const fmtInt = (n) => Math.round(n).toLocaleString("en-US");

// Dashboard: fixed-height block redrawn in place on TTYs, plain lines elsewhere.
let drawn = 0;
let rows = []; // recent per-night status lines (plain strings, colours ok)
function draw(header) {
  if (!TTY) return;
  const lines = [...header, ...rows.slice(-8)];
  let out = "";
  if (drawn) out += `\x1b[${drawn}A`;
  out += lines.map((l) => `\x1b[K${l}`).join("\n") + "\n";
  process.stdout.write(out);
  drawn = lines.length;
}
function seal() {
  drawn = 0; // next draw starts a fresh block (used after interruptions)
}

// ---------- survey ----------
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const readRaw = (rel) => {
  const p = path.join(RAW, rel);
  return fs.existsSync(p) ? JSON.parse(zlib.gunzipSync(fs.readFileSync(p)).toString("utf8")) : null;
};
function replayMissing(night) {
  const n = read(path.join(NIGHTS, `${night}.json`));
  return n.bosses
    .filter((b) => b.pulls.some((p) => p.kill && p.src))
    .filter((b) => !fs.existsSync(path.join(REPLAYS, `${night}-${b.encounterId}.json`)))
    .map((b) => b.name);
}
function survey() {
  const list = JSON.parse(fs.readFileSync(path.join(RAW, "reports.json"), "utf8"));
  const byNight = groupBy(list, (r) => nightOf(r.startTime));
  const files = fs.readdirSync(NIGHTS).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort().reverse();
  const out = [];
  for (const night of files) {
    const date = night.slice(0, 10);
    if (OPT.since && date < OPT.since) continue;
    if (OPT.until && date > OPT.until) continue;
    const reports = (byNight.get(date) || []).map((r) => readRaw(`reports/${r.code}.json.gz`)).filter(Boolean);
    if (!reports.length) {
      out.push({ night, state: "needs-fetch", detail: "report archive missing (run raids:fetch -- --night " + date + " --refresh)" });
      continue;
    }
    const { fights } = stitch(reports);
    const codes = [...new Set(fights.map((f) => f.report.code))];
    const missingEvents = codes.filter((c) => !hasEvents(date, c));
    let missingReplays = [];
    try {
      missingReplays = replayMissing(night);
    } catch (e) {
      out.push({ night, state: "error", detail: `unreadable night file (${e.message.slice(0, 60)})` });
      continue;
    }
    if (!missingEvents.length && !missingReplays.length) {
      out.push({ night, state: "done", detail: "events + replays complete" });
    } else {
      out.push({ night, state: "todo", missingEvents, missingReplays, date });
    }
  }
  return out;
}

// ---------- budget ----------
let rlCache = null;
let rlAt = 0;
async function budget(force = false) {
  if (!force && Date.now() - rlAt < 20_000 && rlCache) return rlCache;
  rlCache = await rateLimit();
  rlAt = Date.now();
  return rlCache;
}
const overBudget = (rl) => rl.pointsSpentThisHour > rl.limitPerHour - OPT.reserve;

// ---------- main ----------
const t0 = Date.now();
let interrupted = false;
process.on("SIGINT", () => {
  interrupted = true;
});
const stat = { nights: 0, eventsPages: 0, eventsCount: 0, replays: 0, skipped: 0, failed: [], pointsStart: 0 };

function header(rl, done, total) {
  const el = (Date.now() - t0) / 1000;
  const rate = done ? el / done : 0;
  const eta = total - done > 0 && rate ? ` · ETA ${mmss(rate * (total - done))}` : "";
  return [
    `${C.b}${C.c}▓▒░ raids:backfill${C.reset} ${C.dim}full logs + replays · data only, resumable${C.reset}`,
    `${C.dim}budget  ${C.reset}${bar(rl.pointsSpentThisHour / rl.limitPerHour)} ${C.b}${fmtInt(rl.pointsSpentThisHour)}/${fmtInt(rl.limitPerHour)}${C.reset} ${C.dim}spent this hour · reset in ${Math.ceil(rl.pointsResetIn / 60)} min · reserve ${OPT.reserve}${C.reset}`,
    `${C.dim}queue   ${C.reset}${bar(total ? done / total : 1)} ${C.b}${done}/${total}${C.reset} ${C.dim}nights · ${fmtInt(stat.eventsCount)} events · ${stat.replays} replays · ${mmss(el)} elapsed${eta}${C.reset}`,
  ];
}

async function run() {
  console.log(`${C.b}${C.c}▓▒░ raids:backfill${C.reset} ${C.dim}full combat logs + fight replays · data only${C.reset}`);
  fileLog(`\n=== backfill run ${new Date().toISOString()} ${OPT.dry ? "(dry run)" : ""} ===`);
  const all = survey();
  const todo = all.filter((s) => s.state === "todo");
  const needsFetch = all.filter((s) => s.state === "needs-fetch");
  const alreadyDone = all.filter((s) => s.state === "done").length;
  say(`${C.dim}survey:${C.reset} ${alreadyDone} nights complete · ${C.b}${todo.length} to backfill${C.reset}${needsFetch.length ? ` · ${C.y}${needsFetch.length} need raids:fetch first${C.reset}` : ""}`);
  for (const s of needsFetch.slice(0, 5)) say(`  ${C.y}○${C.reset} ${s.night} ${C.dim}${s.detail}${C.reset}`);
  if (needsFetch.length > 5) say(`  ${C.dim}…and ${needsFetch.length - 5} more${C.reset}`);

  const queue = OPT.maxNights ? todo.slice(0, OPT.maxNights) : todo;
  if (!queue.length) {
    say(`${C.g}✓${C.reset} Nothing to backfill. ${alreadyDone} nights complete.`);
    return 0;
  }
  if (OPT.dry) {
    say(`${C.dim}would backfill ${queue.length} nights (~10-60 API points each for events; replays from disk are free):${C.reset}`);
    for (const s of queue) say(`  ${s.night}  events for ${s.missingEvents.length} log(s) + ${s.missingReplays.length} replay(s)`);
    return 0;
  }

  let rl;
  try {
    rl = await budget(true);
  } catch (e) {
    say(`${C.r}✗${C.reset} Could not reach Warcraft Logs (${e.message.slice(0, 100)}). Is .env.local set up?`);
    return 1;
  }
  stat.pointsStart = rl.pointsSpentThisHour;
  if (overBudget(rl)) return stopForBudget(rl, 0, queue.length);

  let done = 0;
  for (const s of queue) {
    if (interrupted) break;
    if (OPT.maxPoints && rl.pointsSpentThisHour - stat.pointsStart >= OPT.maxPoints) {
      rows.push(`${C.y}■${C.reset} point cap reached (${OPT.maxPoints}) — stopping, resume any time`);
      draw(header(rl, done, queue.length));
      say(`Point cap reached (${OPT.maxPoints} spent this run). Resume with the same command.`);
      return 0;
    }
    const ok = await backfillNight(s, rl, { done, total: queue.length });
    rl = await budget();
    if (!ok.budgetOk) return stopForBudget(rl, done, queue.length);
    done++;
    if (OPT.quiet || !TTY) {
      if (ok.line) say(ok.line);
    } else {
      rows[rows.length - 1] = ok.line;
      draw(header(rl, done, queue.length));
    }
  }

  if (interrupted) {
    seal();
    say(`\n${C.y}■${C.reset} Interrupted after ${done}/${queue.length} nights. Downloads resume from the last saved page — just run it again.`);
    return 130;
  }
  const failed = stat.failed.length;
  seal();
  say(`\n${C.g}✓${C.reset} Queue empty: ${done} night(s), ${fmtInt(stat.eventsCount)} events in ${stat.eventsPages} pages, ${stat.replays} replays${failed ? `, ${C.r}${failed} failed${C.reset}` : ""}.`);
  return failed ? 1 : 0;
}

function stopForBudget(rl, done, total) {
  seal();
  const msg = `API budget nearly spent (${fmtInt(rl.pointsSpentThisHour)}/${fmtInt(rl.limitPerHour)}). Resets in ${Math.ceil(rl.pointsResetIn / 60)} min — run the same command again then. Exit 75.`;
  say(`\n${C.y}■${C.reset} ${msg}`);
  draw(header(rl, done, total));
  return 75;
}

async function backfillNight(s, rl, prog) {
  const t = Date.now();
  const live = { text: "" };
  const pushed = TTY && !OPT.quiet;
  if (pushed) rows.push("");
  const frame = setInterval(() => {
    if (!pushed) return;
    const i = Math.floor(Date.now() / 120) % SPIN.length;
    rows[rows.length - 1] = `${C.y}${SPIN[i]}${C.reset} ${C.b}${s.night}${C.reset} ${C.dim}${live.text || "starting…"}${C.reset}`;
    draw(header(rl, prog.done, prog.total));
  }, 120);
  const parts = [];
  try {
    // --- events, one used log at a time ---
    const list = JSON.parse(fs.readFileSync(path.join(RAW, "reports.json"), "utf8"));
    const byNight = groupBy(list, (r) => nightOf(r.startTime));
    const reports = (byNight.get(s.date) || []).map((r) => readRaw(`reports/${r.code}.json.gz`)).filter(Boolean);
    const { fights } = stitch(reports);
    for (const code of [...new Set(fights.map((f) => f.report.code))]) {
      if (interrupted) break;
      if (hasEvents(s.date, code)) continue;
      live.text = `downloading ${code}…`;
      const before = doneInfo(s.date, code);
      const report = reports.find((r) => r.code === code);
      const ids = fights.filter((f) => f.report === report || f.report.code === code).map((f) => f.id);
      const ok = await downloadEvents(s.date, report, ids);
      const after = doneInfo(s.date, code);
      stat.eventsPages += after.pages - before.pages;
      stat.eventsCount += after.events - before.events;
      if (!ok) {
        clearInterval(frame);
        if (pushed) rows.pop(); // drop the spinner line; stopForBudget draws the state
        return { budgetOk: false, line: "" };
      }
    }
    const evN = s.missingEvents.length;
    if (evN) parts.push(`${evN} log${evN > 1 ? "s" : ""}`);

    // --- replays, free from the downloaded log ---
    const miss = replayMissing(s.night);
    if (miss.length && !interrupted) {
      live.text = `building ${miss.length} replay(s)…`;
      const made = runReplays(s.night);
      stat.replays += made;
      if (made) parts.push(`${made} replay${made > 1 ? "s" : ""}`);
    }
    stat.nights++;
    clearInterval(frame);
    const secs = ((Date.now() - t) / 1000).toFixed(0);
    return { budgetOk: true, line: `${C.g}✓${C.reset} ${C.b}${s.night}${C.reset} ${parts.join(" + ") || "already complete"} ${C.dim}(${secs}s)${C.reset}` };
  } catch (e) {
    clearInterval(frame);
    stat.failed.push(s.night);
    if (/failed: 429/.test(e.message)) return { budgetOk: false, line: "" };
    return { budgetOk: true, line: `${C.r}✗${C.reset} ${C.b}${s.night}${C.reset} ${e.message.slice(0, 110)}` };
  }
}

function doneInfo(date, code) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, "data/events", date, code, "done.json"), "utf8"));
    return { pages: d.pages || 0, events: d.events || 0 };
  } catch {
    return { pages: 0, events: 0 };
  }
}

function runReplays(night) {
  const args = ["scripts/raids/replays.mjs", "--night", night];
  if (!OPT.graphs) args.push("--offline");
  const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", env: { ...process.env } });
  const m = (r.stdout || "").match(/(\d+) replays written/);
  return m ? +m[1] : 0;
}

const code = await run().catch((e) => {
  seal();
  say(`${C.r}✗${C.reset} ${e.message}`);
  return 1;
});
seal();
process.exit(code);
