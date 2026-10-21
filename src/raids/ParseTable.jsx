// The Warcraft Logs rankings grid for a raid: one row per raider, one column per
// killed boss, with average, median and best, grouped by role like the
// "Rankings" tab on Warcraft Logs. Sortable by any column.
import { useMemo, useState } from "react";
import { BossIcon, Panel } from "./components.jsx";
import { parseColor } from "./RaidProfile.jsx";
import { href } from "../router.js";

const ROLES = [
  ["dps", "Damage"],
  ["healer", "Healing"],
  ["tank", "Tanking"],
];
const median = (l) => {
  if (!l.length) return null;
  const s = [...l].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return Math.round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
};
const avg = (l) => (l.length ? Math.round(l.reduce((a, b) => a + b, 0) / l.length) : null);

const Cell = ({ v, title }) => (
  <td className="pt-cell" title={title}>
    {v == null ? <span className="pt-none">·</span> : <span className={v > 100 ? "pt-beyond" : undefined} style={{ color: parseColor(v) }}>{v}</span>}
  </td>
);

export default function ParseTable({ n, NP }) {
  const [sort, setSort] = useState("avg");
  const bosses = n.bosses.filter((b) => b.parses?.length);
  const rows = useMemo(() => {
    const by = new Map();
    for (const b of bosses)
      for (const p of b.parses) {
        if (p.pct == null) continue;
        const r = by.get(p.player) || { name: p.player, by: {}, roles: {} };
        r.by[b.encounterId] = p;
        r.roles[p.role] = (r.roles[p.role] || 0) + 1;
        by.set(p.player, r);
      }
    for (const r of by.values()) {
      const l = Object.values(r.by).map((p) => p.pct);
      r.role = Object.entries(r.roles).sort((a, b) => b[1] - a[1])[0][0];
      r.avg = avg(l);
      r.median = median(l);
      r.best = Math.max(...l);
      r.count = l.length;
    }
    return [...by.values()];
  }, [n]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!bosses.length) return null;

  const key = (r) => (sort === "avg" ? r.avg : sort === "median" ? r.median : sort === "best" ? r.best : sort === "name" ? 0 : r.by[sort]?.pct ?? -1);
  const ordered = (list) => [...list].sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : key(b) - key(a) || b.avg - a.avg));
  const Th = ({ k, children, title, className = "" }) => (
    <th className={`${className} ${sort === k ? "pt-sorted" : ""}`} title={title} onClick={() => setSort(k)}>
      {children}
    </th>
  );
  const raidCol = (id) => median(rows.map((r) => r.by[id]?.pct).filter((v) => v != null));
  const all = rows.map((r) => r.avg);

  return (
    <Panel
      title="Parses"
      sub={n.localLog ? "rough estimates, not Warcraft Logs (see the note at the top) · click a column to sort" : "Warcraft Logs rank per kill · click a column to sort"}
      className="pt-panel"
    >
      <div className="pt-scroll">
        <table className="pt">
          <thead>
            <tr>
              <Th k="name" className="pt-name">Raider</Th>
              <Th k="avg" title="average parse over the kills they have a parse on">Avg</Th>
              <Th k="median">Med</Th>
              <Th k="best">Best</Th>
              {bosses.map((b) => (
                <Th key={b.encounterId} k={b.encounterId} title={b.name} className="pt-boss">
                  <a href={href("raids", n.night, b.encounterId)} onClick={(e) => e.stopPropagation()} aria-label={b.name}>
                    <BossIcon id={b.encounterId} name={b.name} size={26} />
                  </a>
                </Th>
              ))}
            </tr>
            <tr className="pt-summary">
              <td className="pt-name muted">Raid median</td>
              <Cell v={median(all)} title="median of everyone's average" />
              <td />
              <td />
              {bosses.map((b) => (
                <Cell key={b.encounterId} v={raidCol(b.encounterId)} title={`${b.name}: raid median`} />
              ))}
            </tr>
          </thead>
          {ROLES.map(([role, label]) => {
            const list = ordered(rows.filter((r) => r.role === role));
            if (!list.length) return null;
            return (
              <tbody key={role}>
                <tr className="pt-group">
                  <td colSpan={4 + bosses.length}>
                    {label} <span className="muted">· {list.length}</span>
                  </td>
                </tr>
                {list.map((r) => (
                  <tr key={r.name}>
                    <td className="pt-name">
                      <NP name={r.name} size={14} />
                    </td>
                    <td className="pt-cell pt-avg">
                      <span className={r.avg > 100 ? "rr-parse rr-parse-beyond" : "rr-parse"} style={{ color: parseColor(r.avg), borderColor: parseColor(r.avg) }}>
                        {r.avg}
                      </span>
                    </td>
                    <Cell v={r.median} />
                    <Cell v={r.best} />
                    {bosses.map((b) => {
                      const p = r.by[b.encounterId];
                      return <Cell key={b.encounterId} v={p?.pct ?? null} title={p ? `${b.name}: ${p.pct} (${Math.round(p.amount).toLocaleString()} ${p.role === "healer" ? "HPS" : "DPS"})` : `${b.name}: no parse`} />;
                    })}
                  </tr>
                ))}
              </tbody>
            );
          })}
        </table>
      </div>
    </Panel>
  );
}
