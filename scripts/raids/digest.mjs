// Compact text digest of a raid's facts, for writing the AI analysis and reviews.
//   npm run raids:facts -- --night <raid id> > facts.json
//   node scripts/raids/digest.mjs facts.json            per-boss digest
//   node scripts/raids/digest.mjs facts.json --players <raid id>  per-player digest (run raids:player-facts --write first)
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

// --players <raid id>: one block per raider from data/reviews/<id>.json stats plus the night's dispels, kicks, rezzes and deaths.
if (process.argv.includes("--players")) {
  const id = process.argv[process.argv.indexOf("--players") + 1];
  const r = JSON.parse(fs.readFileSync(`data/reviews/${id}.json`, "utf8"));
  const n = JSON.parse(fs.readFileSync(`src/raids/data/nights/${id}.json`, "utf8"));
  const mech = {};
  for (const b of j.bosses) for (const p of b.pulls) for (const [k, v] of Object.entries(p.mechanics || {})) for (const [who, c] of Object.entries(v.by || {})) (mech[who] ??= []).push(`${short(b.boss)}${b.pulls.length > 1 ? "#" + p.pull : ""} ${k}${v.tone === "bad" ? "(bad)" : ""} ${c}`);
  const disp = Object.fromEntries(n.dispels.map((d) => [d.player, d]));
  const intr = Object.fromEntries(n.interrupts.map((d) => [d.player, d]));
  const trash = {};
  for (const d of n.deaths.filter((d) => !d.boss)) (trash[d.player] ??= []).push(`${Math.floor(d.at / 60)}m ${d.killingBlow}/${d.killer?.name}`);
  const rez = n.rezzes.filter((z) => z.ability === "Rebirth" || z.boss);
  const casts = {};
  for (const [sp, c] of Object.entries(n.casts)) for (const [who, k] of Object.entries(c.by || {})) (casts[who] ??= []).push(`${c.label || sp} ${k}`);
  for (const [name, p] of Object.entries(r.players)) {
    const s = p.stats;
    L(`### ${name} (${s.class}, ${s.role}) parseAvg ${s.avgParse} (own before ${s.ownAvgParseBefore}, raid median ${s.raidMedianParse})`);
    L(" bosses: " + s.bosses.map((b) => `${short(b.name)} ${b.rank} ${b.perSec}/s${b.parse != null ? " p" + b.parse : ""}${b.healShare != null ? ` heal${b.healShare}%${b.overheal != null ? " oh" + b.overheal + "%" : ""}` : ""}${b.deaths ? " DIED" : ""}`).join(" | "));
    if (s.deaths.length) L(" boss deaths: " + s.deaths.map((d) => `${short(d.boss || "")} p${d.pull} ${d.at} ${d.by}/${d.killer}`).join("; "));
    if (trash[name]) L(" trash deaths: " + trash[name].join("; "));
    L(` consumes ${s.consumes.perPull}/pull (role median ${s.consumes.roleMedian}): ${Object.values(s.consumes.groups || {}).flat().join(", ")}`);
    if (mech[name]) L(" mech: " + mech[name].join("; "));
    if (disp[name]) L(` dispels ${disp[name].total}: ${JSON.stringify(disp[name].what)}`);
    if (intr[name]) L(` interrupts ${intr[name].total}: ${JSON.stringify(intr[name].what)}`);
    const rz = rez.filter((z) => z.by === name || z.target === name);
    if (rz.length) L(" rez: " + rz.map((z) => `${z.by}>${z.target} ${z.ability}${z.boss ? " " + z.boss : ""}`).join("; "));
    if (casts[name]) L(" casts: " + casts[name].filter((c) => !/Invulnerability|Protection|Mighty Rage|Great Rage|Free Action|Thistle|Sapper|Dynamite|Grenade|Bomb/.test(c)).join(", "));
  }
}
