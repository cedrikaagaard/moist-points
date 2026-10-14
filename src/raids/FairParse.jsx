// "Fair parse": a just-for-fun estimate, shown under the real parses on a
// night-boss page. Data from scripts/raids/fair.mjs (src/raids/data/fair/).
// The real Warcraft Logs parse is always shown next to it; nothing here
// changes anyone's actual parse.
import { useEffect, useState } from "react";
import { lazyJson } from "./lazyJson.js";
import { classColor } from "./assets.js";
import { Panel, Player } from "./components.jsx";
import { ParseBadge } from "./RaidProfile.jsx";

const files = lazyJson(import.meta.glob("./data/fair/*.json", { query: "?url", import: "default", eager: true }));
export const hasFair = (night) => !!files[`./data/fair/${night}.json`];

const TOGGLES = [
  { key: "mech", label: "Mechanics", on: true, tip: "Time a mechanic took you out personally" },
  { key: "jobs", label: "Jobs", on: true, tip: "Decurses, Tranquilizing Shots, sheeping mind-controlled raiders" },
  { key: "wb", label: "World buffs", on: false, tip: "As if you had the full set" },
  { key: "cons", label: "Consumables", on: false, tip: "As if you had your class's usual consumables" },
  { key: "gear", label: "Gear", on: false, tip: "As if your item level matched your class's median that night" },
];
const STORE = "moist.fairParse";

function useToggles() {
  const [on, setOn] = useState(() => {
    const base = Object.fromEntries(TOGGLES.map((t) => [t.key, t.on]));
    try {
      return { ...base, ...JSON.parse(localStorage.getItem(STORE) || "{}") };
    } catch {
      return base;
    }
  });
  const flip = (k) =>
    setOn((o) => {
      const next = { ...o, [k]: !o[k] };
      try {
        localStorage.setItem(STORE, JSON.stringify(next));
      } catch {
        /* private window: just don't remember */
      }
      return next;
    });
  return [on, flip];
}

function useFair(key) {
  const [state, setState] = useState({ key: null, data: null });
  useEffect(() => {
    let live = true;
    const load = files[`./data/fair/${key}.json`];
    if (load) load().then((d) => live && setState({ key, data: d }));
    return () => {
      live = false;
    };
  }, [key]);
  return state.key === key ? state.data : null;
}

// Where a DPS lands on this boss's parse curve for the class (Moist's own parses).
function curveAt(curve, x) {
  if (!curve?.length) return null;
  const [x0, p0] = curve[0];
  if (x <= x0) return (p0 * Math.max(0, x)) / x0;
  for (let i = 1; i < curve.length; i++) {
    const [x1, p1] = curve[i];
    if (x <= x1) {
      const [xa, pa] = curve[i - 1];
      return pa + ((p1 - pa) * (x - xa)) / (x1 - xa || 1);
    }
  }
  const [xn, pn] = curve.at(-1);
  return pn + (100 - pn) * Math.min(1, (x - xn) / (0.15 * xn));
}

export function fairOf(p, curve, on, dur) {
  if (on.mech && p.adj.mech && p.adj.mech.sec >= dur * 0.5) return { pct: null, out: true, f: 1 };
  let f = 1;
  for (const t of TOGGLES) if (on[t.key] && p.adj[t.key]) f *= p.adj[t.key].f;
  if (Math.abs(f - 1) < 0.005) return { pct: p.pct, f: 1 };
  const a = curveAt(curve, p.dps);
  const b = curveAt(curve, p.dps * f);
  if (a == null || b == null) return { pct: p.pct, f };
  return { pct: Math.max(0, Math.min(100, Math.round(p.pct + b - a))), f };
}

function reasons(p, on, dur) {
  const out = [];
  const a = p.adj;
  if (on.mech && a.mech) out.push(`${a.mech.sec}s of ${Math.round(dur)}s taken out: ${a.mech.why.join(", ")}`);
  if (on.jobs && a.jobs) out.push(`jobs: ${a.jobs.why.join(", ")}`);
  if (on.wb && a.wb?.missing?.length) out.push(`no ${a.wb.missing.join(", ")}`);
  if (on.cons && a.cons && Math.abs(a.cons.f - 1) >= 0.005) {
    if (a.cons.missing.length) out.push(`missing ${a.cons.missing.join(", ")}`);
    if (a.cons.extra.length) out.push(`extra ${a.cons.extra.join(", ")}`);
  }
  if (on.gear && a.gear && Math.abs(a.gear.f - 1) >= 0.005) out.push(`item level ${a.gear.ilvl} vs ${a.gear.ref} class median`);
  return out;
}

export function FairPanel({ night, b }) {
  const data = useFair(night);
  const [on, flip] = useToggles();
  const boss = data?.bosses?.[b.encounterId];
  if (!boss) return null;
  const rows = boss.players
    .map((p) => ({ p, fair: fairOf(p, boss.curves[p.cls], on, boss.dur), why: reasons(p, on, boss.dur) }))
    .sort((x, y) => (y.fair.pct ?? -1) - (x.fair.pct ?? -1) || y.p.pct - x.p.pct);
  return (
    <Panel title="Fair parse" sub="just for fun · an estimate, not a Warcraft Logs number" className="rr-fair">
      <div className="rr-fair-toggles" role="group" aria-label="What to adjust for">
        {TOGGLES.map((t) => (
          <button key={t.key} type="button" className={`rr-tab${on[t.key] ? " active" : ""}`} aria-pressed={!!on[t.key]} title={t.tip} onClick={() => flip(t.key)}>
            {on[t.key] ? "✓ " : ""}
            {t.label}
          </button>
        ))}
      </div>
      {boss.chronoboon && on.wb && <div className="rr-fair-note muted">World buffs were stored in a Chronoboon for this boss, so the buffs each raider had before it are used.</div>}
      <ol className="rr-fair-list">
        {rows.map(({ p, fair, why }) => {
          const d = fair.pct == null ? null : fair.pct - p.pct;
          return (
            <li key={p.name}>
              <div className="rr-fair-who">
                <Player name={p.name} cls={p.cls} size={16} />
                {why.length > 0 && <div className="rr-fair-why muted">{why.join(" · ")}</div>}
              </div>
              <div className="rr-fair-nums">
                <span className="muted rr-fair-real" title="Real Warcraft Logs parse">
                  <ParseBadge pct={p.pct} />
                </span>
                <span className="rr-fair-arrow muted" aria-hidden="true">→</span>
                {fair.out ? (
                  <span className="muted rr-fair-out" title="Out for most of the fight: too little left to judge">n/a</span>
                ) : (
                  <ParseBadge pct={fair.pct} />
                )}
                <span className={`rr-fair-delta${d > 0 ? " up" : d < 0 ? " down" : ""}`}>{d == null || d === 0 ? "" : d > 0 ? `+${d}` : d}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <FairExplainer />
    </Panel>
  );
}

function FairExplainer() {
  const [open, setOpen] = useState(false);
  const model = useFair(open ? "model" : null);
  return (
    <details className="rr-fair-explain" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>What is this?</summary>
      <p>
        A fun estimate of how the parse would look with some things evened out. It is <b>not</b> a Warcraft Logs number, and nobody's real parse changes: the real one is
        always the first badge.
      </p>
      <p>
        How it works: take the real parse and DPS on this kill, adjust the DPS for whatever is switched on, then read where that DPS would have landed on this boss's
        parse curve for the class, built from the parses Moist got over the last year.
      </p>
      <ul>
        <li>
          <b>Mechanics</b>: time a mechanic took you out personally: Heigan's teleport, Web Wrap, Sapphiron's ice block, Frost Blast, mind control (and the sheeps and
          fears the raid puts on you then), Wyvern Sting, Hex, being killed by another raider. Things that hit the whole raid, like Web Spray or a raid-wide fear, stay
          in: they're in everyone's parse.
        </li>
        <li>
          <b>Jobs</b>: decurses and dispels, Tranquilizing Shots, sheeping or fearing mind-controlled raiders, Innervates and battle rezzes, at 1.5 seconds each (a third of the fight at most).
        </li>
        <li>
          <b>World buffs</b>: as if you had the full set your class benefits from.
        </li>
        <li>
          <b>Consumables</b>: as if you had your class's usual consumables, no more and no less, so bringing extra lowers it a little.
        </li>
        <li>
          <b>Gear</b>: as if your average item level matched your class's median that night.
        </li>
      </ul>
      <p className="muted">
        World buffs, consumables and gear use values estimated from Moist's own logs: how the same raider did with and without them, compared with their classmates on the
        same kill, taken down by a fifth because raiders who bring everything also tend to play well. They're rough. Healers and tanks don't get a fair parse (healer
        parses are mostly placeholders), and nor does anyone who was out for most of the fight.
      </p>
      {model && <ModelValues model={model} />}
    </details>
  );
}

function ModelValues({ model }) {
  const classes = Object.entries(model.classes).filter(([, m]) => m.n >= 1000).sort((a, b) => b[1].n - a[1].n);
  const pct = (v) => `+${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`;
  return (
    <div className="rr-fair-values">
      <div className="rr-clean-title">Values from Moist's logs</div>
      <table className="rr-table">
        <thead>
          <tr>
            <th>Class</th>
            <th>World buffs</th>
            <th>Consumables</th>
            <th className="num">Per item level</th>
          </tr>
        </thead>
        <tbody>
          {classes.map(([cls, m]) => (
            <tr key={cls}>
              <td style={{ color: classColor(cls) }}>{cls}</td>
              <td className="muted">{Object.entries(m.wb).filter(([, v]) => v >= 0.005).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v)}`).join(", ") || "-"}</td>
              <td className="muted">{Object.entries(m.cons).filter(([, v]) => v >= 0.005).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v)}`).join(", ") || "-"}</td>
              <td className="num muted">{m.perIlvl ? pct(m.perIlvl) : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="muted rr-fair-foot">From {model.rows.toLocaleString()} DPS parses on kills with full logs.</div>
    </div>
  );
}
