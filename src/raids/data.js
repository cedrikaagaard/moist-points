// Raid data for the pages. summary.json (all nights in brief + all-time numbers)
// ships with the page; each night's full file is its own chunk, loaded on open.
// All produced by `npm run raids:fetch` - independent of the SR-points database.
import { useEffect, useState } from "react";
import summary from "./data/summary.json";

export const NIGHTS = summary.nights; // newest first, guild raids and PUG runs
// The raids that count as the guild's own (PUG runs left out): for records,
// averages, trends and comparisons. See classifyRaids in aggregate.js.
export const GUILD_NIGHTS = NIGHTS.filter((n) => n.kind !== "pug");
export const isPug = (n) => n?.kind === "pug";
export const ALL_TIME = summary.allTime;
export const CLASS_OF = new Map(ALL_TIME.players.map((p) => [p.name, p.class]));

// Weekly raids (MC, BWL, AQ40, Naxx) reset on Wednesday on EU realms, so a raid
// can be split over two evenings: Naxx on Wednesday, Sapphiron and Kel'Thuzad on
// Sunday. Same instance, same lockout week = one lockout.
const WEEKLY = new Set([2000, 2002, 2005, 2006]);
function lockoutWeek(night) {
  const d = new Date(`${night.slice(0, 10)}T12:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 4) % 7)); // back to Wednesday
  return d.toISOString().slice(0, 10);
}
// The other raids in this raid's lockout, oldest first: { before: [...], after: [...] }.
export function lockoutOf(n) {
  const z = n.zoneIds?.length === 1 ? n.zoneIds[0] : null;
  if (!WEEKLY.has(z)) return { before: [], after: [] };
  const week = lockoutWeek(n.night);
  // (a PUG run and the guild's raid are different lockouts)
  const same = NIGHTS.filter((x) => x.night !== n.night && isPug(x) === isPug(n) && x.zoneIds.length === 1 && x.zoneIds[0] === z && lockoutWeek(x.night) === week).reverse();
  const at = n.start || n.night;
  return { before: same.filter((x) => (x.start || x.night) < at), after: same.filter((x) => (x.start || x.night) > at) };
}

const nightFiles = import.meta.glob("./data/nights/*.json", { import: "default" });

export function useNight(night) {
  const [state, setState] = useState({ night: null, error: null });
  useEffect(() => {
    const load = nightFiles[`./data/nights/${night}.json`];
    if (!load) {
      // An old link to a date (before raids were split): open that date's first raid.
      const first = NIGHTS.filter((n) => n.night.startsWith(`${night}-`)).at(-1);
      if (first) {
        window.location.replace(window.location.hash.replace(`/${night}`, `/${first.night}`));
        return;
      }
      return setState({ night: null, error: "missing" });
    }
    let live = true;
    load().then((n) => live && setState({ night: n, error: null }));
    return () => {
      live = false;
    };
  }, [night]);
  return state;
}

// Per-boss detail (attempts, mechanics, parses, who was there) lives in
// data/bosses/<id>.json and only loads on the boss and raid pages.
const bossFiles = import.meta.glob("./data/bosses/*.json", { import: "default" });

// Full detail for several bosses: { [id]: boss } once loaded, null while loading.
export function useBosses(ids) {
  const key = ids.join(",");
  const [state, setState] = useState({ key: null, data: null });
  useEffect(() => {
    let live = true;
    Promise.all(ids.map((id) => bossFiles[`./data/bosses/${id}.json`]?.() ?? Promise.resolve(null))).then((list) => {
      if (live) setState({ key, data: Object.fromEntries(ids.map((id, i) => [id, list[i]])) });
    });
    return () => {
      live = false;
    };
  }, [key]);
  return state.key === key ? state.data : null;
}
