// Compact text digest of a raid's facts, for writing the AI analysis and reviews.
//   npm run raids:facts -- --night <raid id> > facts.json
//   node scripts/raids/digest.mjs facts.json            per-boss digest
//   node scripts/raids/digest.mjs facts.json --players  per-player digest (needs raids:player-facts --write first)
import fs from "node:fs";

const file = process.argv[2];
const t = fs.readFileSync(file, "utf8");
const j = JSON.parse(t.slice(t.indexOf("{")));
const L = (s) => console.log(s);
const short = (s) => s.replace(/^(Grand Widow|Instructor|Baron|Lord|The|Highlord|High Priestess|High Priest|Princess|Battleguard|Emperor)\s+/, "").split(/[\s']/)[0].slice(0, 8);

if (!process.argv.includes("--players")) {
  for (const k of ["raidKind", "roles", "tanks", "healers", "durationMin", "totals", "clearTimes", "utility", "consumables"]) L(`${k} ${JSON.stringify(j[k])}`);
  L("trash " + JSON.stringify(j.trashDeaths));
  for (const b of j.bosses) {
    L(`\n## ${b.boss} kill ${b.killTimeSec}s best ${b.killTimeHistory?.best} median ${b.killTimeHistory?.median} | parses med ${b.parses?.median} hist ${b.parses?.historicalMedian} top ${b.parses?.top} | baseDPS ${b.baseline?.raidDps} deathsPerKill ${JSON.stringify(b.baseline?.deathsPerKill)}`);
    L(" mechTonight " + JSON.stringify(b.mechanicsTonight));
    for (const p of b.pulls) {
      L(` pull${p.pull} ${p.result} ${p.durationSec}s deaths ${p.deaths} dps ${p.raidDps} hps ${p.raidHps} tanksDead ${p.tanksDead}`);
      L("  first " + JSON.stringify((p.firstDeaths || []).map((d) => [d.t, d.player, d.role, d.by, d.killer, d.recap?.health, d.recap?.healingReceived])));
      L("  mech " + JSON.stringify(Object.fromEntries(Object.entries(p.mechanics || {}).map(([k, v]) => [k, { total: v.total, by: v.by }]))).slice(0, 900));
      L("  topDmg " + (p.topDamage || []).map((x) => x.name + " " + Math.round(x.total / 1000) + "k").join(", ") + " | topHeal " + (p.topHealing || []).map((x) => x.name + " " + Math.round(x.total / 1000) + "k").join(", "));
      if (p.anomalies?.length) L("  anom " + p.anomalies.join(" ; "));
      if (p.worldBuffsAtPull) L("  wb " + JSON.stringify(p.worldBuffsAtPull));
      for (const k of Object.keys(p)) if (!["pull", "result", "durationSec", "deaths", "firstDeaths", "deathsByAbility", "tanksDead", "healersDead", "raidDps", "raidHps", "bossPctLeft", "mechanics", "topDamage", "topHealing", "anomalies", "worldBuffsAtPull", "damageTakenByAbility", "healingDoneToEnemies", "damageTakenPerSecond"].includes(k)) L(`   ${k} ${JSON.stringify(p[k]).slice(0, 400)}`);
    }
  }
}
