// Put written player reviews into data/reviews/<raid id>.json (next to the
// stats `raids:player-facts -- --write` generated).
//   node scripts/raids/merge-reviews.mjs <raid id> <reviews.json> [--model "Name"]
// The model flag records who wrote the reviews (shown as a tag on the site).
// Without it no model is stored and the site falls back to a plain "AI" tag.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const [night, src] = process.argv.slice(2);
const mi = process.argv.indexOf("--model");
const model = mi === -1 ? null : process.argv[mi + 1];
const file = path.join(ROOT, "data/reviews", `${night}.json`);
if (!night || !src || !fs.existsSync(file)) {
  console.error("usage: node scripts/raids/merge-reviews.mjs <raid id> <reviews.json>  (run raids:player-facts --write first)");
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const add = JSON.parse(fs.readFileSync(src, "utf8"));
const GRADES = /^(S|[A-D][+-]?|F)$/;
for (const [name, r] of Object.entries(add)) {
  if (!data.players[name]) throw new Error(`${name} wasn't in ${night}`);
  if (!GRADES.test(r.grade || "")) throw new Error(`${name}: bad grade ${r.grade}`);
  for (const k of ["verdict", "summary", "good", "fix"]) if (!r[k]) throw new Error(`${name}: missing ${k}`);
  data.players[name].review = { ...(model ? { model } : {}), generatedAt: new Date().toISOString(), ...r };
}
fs.writeFileSync(file, JSON.stringify(data, null, 1) + "\n");
console.log(`${night}: ${Object.keys(add).length} merged, ${Object.values(data.players).filter((p) => p.review).length}/${Object.keys(data.players).length} written`);
