// Which realm each raider plays on, from the Warcraft Logs actors in our archive:
// data/raider-realms.json = { realms: [guild realm slugs], raiders: { name: [realm slugs] } }.
// The Battle.net login (netlify/functions/auth.mjs) uses it to know which of
// someone's characters are guild characters: the guild raids cross-realm, so
// Firemaw alone misses a lot of people. Run after fetching new raids.
//
//   npm run raids:realms
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DIR = path.join(ROOT, "data/wcl/reports");
const roster = JSON.parse(fs.readFileSync(path.join(ROOT, "src/raids/data/roster.json"), "utf8"));
// WCL server names ("PyrewoodVillage") -> Blizzard realm slugs ("pyrewood-village")
const slug = (s) => s.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/'/g, "").replace(/\s+/g, "-").toLowerCase();

const raiders = {};
const count = {};
for (const f of fs.readdirSync(DIR)) {
  if (!f.endsWith(".json.gz") || f.includes("-detail")) continue;
  let r;
  try { r = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(DIR, f)))); } catch { continue; }
  for (const a of r.masterData?.actors || []) {
    if (a.type !== "Player" || !a.server || !roster[a.name]) continue;
    const s = slug(a.server);
    (raiders[a.name] ??= new Set()).add(s);
    count[s] = (count[s] || 0) + 1;
  }
}
const out = {
  realms: Object.keys(count).sort((a, b) => count[b] - count[a]),
  raiders: Object.fromEntries(Object.entries(raiders).sort().map(([n, s]) => [n, [...s]])),
};
fs.writeFileSync(path.join(ROOT, "data/raider-realms.json"), JSON.stringify(out) + "\n");
console.log(`${Object.keys(out.raiders).length} raiders on ${out.realms.length} realms: ${out.realms.join(", ")}`);
