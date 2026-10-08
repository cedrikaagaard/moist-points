// Raid data for the pages. summary.json (all nights in brief + all-time numbers)
// ships with the page; each night's full file is its own chunk, loaded on open.
// All produced by `npm run raids:fetch` - independent of the SR-points database.
import { useEffect, useState } from "react";
import summary from "./data/summary.json";

export const NIGHTS = summary.nights; // newest first
export const ALL_TIME = summary.allTime;
export const CLASS_OF = new Map(ALL_TIME.players.map((p) => [p.name, p.class]));

const nightFiles = import.meta.glob("./data/nights/*.json", { import: "default" });

export function useNight(night) {
  const [state, setState] = useState({ night: null, error: null });
  useEffect(() => {
    const load = nightFiles[`./data/nights/${night}.json`];
    if (!load) return setState({ night: null, error: "missing" });
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
