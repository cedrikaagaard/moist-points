// Rebuild src/raids/data/summary.json from every night file: the list of nights
// plus all-time numbers. The site loads only this up front and fetches a night's
// full file when you open it. Runs at the end of every fetch, or on its own:
//
//   npm run raids:summary
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSummary, buildPlayers } from "../../src/raids/aggregate.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATA = path.join(ROOT, "src/raids/data");

export function readNights() {
  const dir = path.join(DATA, "nights");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
}

export function writeSummary() {
  const nights = readNights();
  const { summary, bosses } = buildSummary(nights);
  fs.writeFileSync(path.join(DATA, "summary.json"), JSON.stringify(summary) + "\n");

  // Per-boss detail, loaded by the boss and raid pages only.
  const bossDir = path.join(DATA, "bosses");
  fs.rmSync(bossDir, { recursive: true, force: true });
  fs.mkdirSync(bossDir, { recursive: true });
  for (const [id, b] of Object.entries(bosses)) fs.writeFileSync(path.join(bossDir, `${id}.json`), JSON.stringify(b) + "\n");

  // One file per raider (their profile loads it), and a tiny roster the whole
  // site uses for class icons/colours next to names.
  const dir = path.join(DATA, "players");
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const roster = {};
  for (const p of buildPlayers(nights)) {
    fs.writeFileSync(path.join(dir, `${fileName(p.name)}.json`), JSON.stringify(p) + "\n");
    roster[p.name] = { class: p.class, spec: p.spec, role: p.role, nights: p.nights.length, file: fileName(p.name) };
  }
  fs.writeFileSync(path.join(DATA, "roster.json"), JSON.stringify(roster) + "\n");
  return summary;
}

// Names like "Eïnherjar" are fine on disk, but keep them predictable.
export const fileName = (name) => name.normalize("NFC").toLowerCase();

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const s = writeSummary();
  console.log(`summary.json: ${s.nights.length} nights`);
}
