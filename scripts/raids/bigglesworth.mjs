// Hall of Shame: everyone who killed Mr. Bigglesworth, Kel'Thuzad's cat, in a
// logged raid. Reads the full combat logs in data/events/ (no API) and writes
// src/raids/data/bigglesworth.json for the home page.
//   npm run raids:biggles
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const EV = path.join(ROOT, "data/events");
const NIGHTS = path.join(ROOT, "src/raids/data/nights");
const nightFiles = fs.readdirSync(NIGHTS).filter((f) => f.endsWith(".json"));

const kills = [];
for (const date of fs.readdirSync(EV).filter((d) => /^\d{4}-\d\d-\d\d$/.test(d)).sort()) {
  for (const code of fs.readdirSync(path.join(EV, date))) {
    const rp = path.join(ROOT, "data/wcl/reports", `${code}.json.gz`);
    if (!fs.existsSync(rp)) continue;
    const rep = JSON.parse(zlib.gunzipSync(fs.readFileSync(rp)));
    const cats = new Set(rep.masterData.actors.filter((a) => a.name === "Mr. Bigglesworth").map((a) => a.id));
    if (!cats.size) continue;
    const actor = new Map(rep.masterData.actors.map((a) => [a.id, a]));
    const ability = new Map((rep.masterData.abilities || []).map((a) => [a.gameID, a.name]));
    const lastHit = {};
    const dir = path.join(EV, date, code);
    for (const p of fs.readdirSync(dir).filter((f) => f.startsWith("page-")).sort()) {
      for (const e of JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir, p))))) {
        if (!cats.has(e.targetID)) continue;
        if (e.type === "damage") lastHit[e.targetID] = e;
        if (e.type !== "death") continue;
        const hit = lastHit[e.targetID];
        const who = actor.get(e.killerID ?? hit?.sourceID);
        const owner = who?.petOwner != null ? actor.get(who.petOwner) : null;
        const killer = owner || who;
        if (killer?.type !== "Player") continue;
        kills.push({
          date,
          killer: killer.name,
          class: killer.subType,
          with: ability.get(e.killingAbilityGameID ?? hit?.abilityGameID) || null,
          pet: owner ? who.name : null,
        });
      }
    }
  }
}
// Several raiders log every raid: one kill per killer per night.
const seen = new Set();
const unique = kills.filter((k) => {
  const key = `${k.date}|${k.killer}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
for (const k of unique) {
  const f = nightFiles.find((x) => x.startsWith(`${k.date}-naxx`)) || nightFiles.find((x) => x.startsWith(k.date));
  k.night = f ? f.replace(/\.json$/, "") : null;
}
unique.sort((a, b) => b.date.localeCompare(a.date));
fs.writeFileSync(path.join(ROOT, "src/raids/data/bigglesworth.json"), JSON.stringify({ updated: new Date().toISOString().slice(0, 10), kills: unique }, null, 1) + "\n");
console.log(`${unique.length} Bigglesworth kills by ${new Set(unique.map((k) => k.killer)).size} raiders`);
