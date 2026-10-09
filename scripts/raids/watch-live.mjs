// During a raid: poll tonight's logs every few minutes (about 1 API point a
// check) and print one line per new boss pull. Exits when the given boss dies.
//   node --env-file=.env.local scripts/raids/watch-live.mjs --until 50672 [--every 180]
import { gql } from "./wcl.mjs";
import { GUILD } from "./config.mjs";

const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const until = +arg("--until", 50672); // Ragnaros
const every = +arg("--every", 180) * 1000;
const seen = new Set();
const since = Date.now() - 12 * 3600e3;

const stamp = () => new Date().toTimeString().slice(0, 5);
for (;;) {
  try {
    const d = await gql(
      `query($name: String!, $server: String!, $region: String!, $start: Float!) {
        reportData { reports(guildName: $name, guildServerSlug: $server, guildServerRegion: $region, startTime: $start, limit: 10) {
          data { code title fights(killType: Encounters) { id encounterID name kill fightPercentage endTime startTime } }
        } }
      }`,
      { name: GUILD.name, server: GUILD.serverSlug, region: GUILD.serverRegion, start: since }
    );
    let done = false;
    for (const r of d.reportData.reports.data) {
      for (const f of r.fights || []) {
        const key = `${f.encounterID}-${f.startTime}`;
        if (seen.has(key)) continue;
        seen.add(key);
        console.log(`${stamp()} ${f.kill ? "KILL" : "WIPE"} ${f.name}${f.kill ? "" : ` (${Math.round(f.fightPercentage)}%)`} [${r.code}]`);
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
