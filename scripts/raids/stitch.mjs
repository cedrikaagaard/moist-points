// Which raid night a log belongs to, and which of its fights a night uses.
// Several people log the same raid, so each night is stitched from the reports
// that cover it: the most complete log first, then any pulls only others caught.
import { TIMEZONE, NIGHT_CUTOFF_HOUR } from "./config.mjs";

export function nightOf(ms) {
  const shifted = new Date(ms - NIGHT_CUTOFF_HOUR * 3600e3);
  return shifted.toLocaleDateString("sv-SE", { timeZone: TIMEZONE }); // YYYY-MM-DD
}

export function groupBy(list, key) {
  const m = new Map();
  for (const x of list) {
    const k = key(x);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  }
  return m;
}

// reports (light report data, with fights) -> { reports (most complete first),
// fights: accepted fights sorted by time, each with absStart/absEnd and its report }
export function stitch(reports) {
  const bossPulls = (r) => r.fights.filter((f) => f.encounterID).length;
  reports = [...reports].sort(
    (a, b) => bossPulls(b) - bossPulls(a) || b.endTime - b.startTime - (a.endTime - a.startTime)
  );
  const taken = []; // [absStart, absEnd] of fights already used
  const fights = [];
  for (const r of reports) {
    const mine = [];
    for (const f of r.fights) {
      const s = r.startTime + f.startTime;
      const e = r.startTime + f.endTime;
      const overlap = Math.max(0, ...taken.map(([ts, te]) => Math.min(e, te) - Math.max(s, ts)));
      if (overlap > (e - s) / 2) continue; // someone else's log already has this pull
      mine.push({ ...f, absStart: s, absEnd: e, report: r });
    }
    for (const f of mine) taken.push([f.absStart, f.absEnd]);
    fights.push(...mine);
  }
  fights.sort((a, b) => a.absStart - b.absStart);
  return { reports, fights };
}
