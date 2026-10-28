// During a raid: poll tonight's logs every few minutes (about 1 API point a
// check) and print one line per new boss pull. Exits when the given boss dies.
// --deaths: for each new pull also fetch that pull's death table (1-2 points)
// and print who died first, when and to what.
//   node --env-file=.env.local scripts/raids/watch-live.mjs --until 50672 [--every 180] [--deaths]
import { gql } from "./wcl.mjs";
import { GUILD } from "./config.mjs";

const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const until = +arg("--until", 50672); // Ragnaros
const every = +arg("--every", 180) * 1000;
const seen = new Set();
const since = Date.now() - 12 * 3600e3;

const stamp = () => new Date().toTimeString().slice(0, 5);
const withDeaths = process.argv.includes("--deaths");
const mmss = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
async function deaths(code, f) {
  const d = await gql(`query($code: String!, $id: Int!) { reportData { report(code: $code) { table(dataType: Deaths, fightIDs: [$id]) } } }`, { code, id: f.id });
  const list = (d.reportData.report.table?.data?.entries || []).map((e) => ({
    at: e.timestamp - f.startTime,
    who: e.name,
    cls: e.type,
    by: e.killingBlow?.name || e.damage?.abilities?.[0]?.name || "?",
  }));
  list.sort((a, b) => a.at - b.at);
  return list;
}
for (;;) {
  try {
    const d = await gql(
      `query($name: String!, $server: String!, $region: String!, $start: Float!) {
        reportData { reports(guildName: $name, guildServerSlug: $server, guildServerRegion: $region, startTime: $start, limit: 10) {
          data { code title startTime fights(killType: Encounters) { id encounterID name kill fightPercentage endTime startTime } }
        } }
      }`,
      { name: GUILD.name, server: GUILD.serverSlug, region: GUILD.serverRegion, start: since }
    );
    let done = false;
    for (const r of d.reportData.reports.data) {
      for (const f of r.fights || []) {
        // several people log the same raid: the same pull is the same boss at the same wall-clock minute
        const key = `${f.encounterID}-${Math.round((r.startTime + f.startTime) / 60000)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const len = mmss(f.endTime - f.startTime);
        console.log(`${stamp()} ${f.kill ? "KILL" : "WIPE"} ${f.name}${f.kill ? "" : ` (${Math.round(f.fightPercentage)}%)`} ${len} [${r.code} #${f.id}]`);
        if (withDeaths && f.endTime) {
          try {
            const ds = await deaths(r.code, f);
            if (ds.length) {
              console.log(`    ${ds.length} deaths. First: ${ds.slice(0, 6).map((x) => `${x.who} ${mmss(x.at)} ${x.by}`).join(", ")}`);
              const by = {};
              for (const x of ds) by[x.by] = (by[x.by] || 0) + 1;
              console.log(`    killed by: ${Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}`);
            }
          } catch (e) {
            console.log(`    (deaths failed: ${e.message.slice(0, 80)})`);
          }
        }
        if (f.kill && f.encounterID === until) done = true;
      }
    }
    if (done) {
      console.log(`${stamp()} DONE: target boss killed`);
      process.exit(0);
    }
  } catch (e) {
    console.log(`${stamp()} check failed: ${e.message.slice(0, 120)}`);
  }
  await new Promise((r) => setTimeout(r, every));
}
