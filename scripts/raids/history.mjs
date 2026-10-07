// Print the all-time picture in the terminal - a quick sanity check after a fetch.
//
//   npm run raids:history            human-readable summary
//   npm run raids:history -- --json  full aggregate as JSON
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { aggregate } from "../../src/raids/aggregate.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dir = (d) => path.join(ROOT, "src/raids/data", d);
const readAll = (d) =>
  fs.existsSync(dir(d))
    ? fs.readdirSync(dir(d)).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(dir(d), f), "utf8")))
    : [];

const nights = readAll("nights");
const agg = aggregate(nights);

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(agg, null, 2)); // no process.exit: it would cut off piped output
} else {
  printSummary();
}

function printSummary() {
  console.log(`${agg.nights} nights logged (${agg.firstNight ?? "-"} -> ${agg.lastNight ?? "-"})`);
  console.log(`Totals: ${agg.totals.kills} kills, ${agg.totals.wipes} wipes, ${agg.totals.deaths} deaths, ${agg.totals.minutes} min raided\n`);

  console.log("Most deaths (deaths / nights, first-to-die count, nemesis):");
  for (const p of [...agg.players].sort((a, b) => b.deaths - a.deaths).slice(0, 15)) {
    const nem = p.nemesis ? `${p.nemesis.name} x${p.nemesis.count}` : "-";
    console.log(`  ${p.name.padEnd(14)} ${String(p.deaths).padStart(4)} / ${p.nights}  first:${p.firstDeaths}  ${nem}`);
  }

  console.log("\nBosses (pulls, wipes, best kill):");
  for (const b of [...agg.bosses].sort((a, b) => b.wipes - a.wipes || b.pulls - a.pulls)) {
    console.log(`  ${b.name.padEnd(28)} ${b.pulls} pulls, ${b.wipes} wipes, best ${mmss(b.bestKillSec)} (${b.bestKillNight ?? "-"})`);
  }

  console.log("\nDeadliest things:");
  for (const k of agg.killers.slice(0, 10)) console.log(`  ${k.name.padEnd(28)} ${k.count}`);

}

function mmss(s) {
  return s == null ? "-" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
