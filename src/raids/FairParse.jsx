// "Fair parse": a just-for-fun estimate, shown under the real parses on a
// night-boss page, plus its explainer page (#/raid-fair). Data from
// scripts/raids/fair.mjs (src/raids/data/fair/). The real Warcraft Logs parse
// is always shown next to it; nothing here changes anyone's actual parse.
import { useEffect, useState } from "react";
import { lazyJson } from "./lazyJson.js";
import { classColor } from "./assets.js";
import { Panel, Player } from "./components.jsx";
import { ParseBadge, parseColor } from "./RaidProfile.jsx";
import { href } from "../router.js";

const files = lazyJson(import.meta.glob("./data/fair/*.json", { query: "?url", import: "default", eager: true }));
export const hasFair = (night) => !!files[`./data/fair/${night}.json`];

const TOGGLES = [
  { key: "mech", label: "Mechanics", on: true, desc: "Time a boss mechanic took you out: teleports, Web Wrap, ice blocks, mind control" },
  { key: "jobs", label: "Jobs", on: true, desc: "Casts spent on decurses, Tranquilizing Shots, sheeping mind-controlled raiders" },
  { key: "wb", label: "World buffs", on: false, desc: "As if you had the full set of world buffs" },
  { key: "cons", label: "Consumables", on: false, desc: "As if you had your class's usual consumables (extra lowers it)" },
  { key: "gear", label: "Gear", on: false, desc: "As if your item level matched your class's median that night" },
];
const STORE = "moist.fairParse";
const OUT_SHARE = 0.5; // out for half the fight or more: too little left to judge

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
    const load = key && files[`./data/fair/${key}.json`];
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
  if (on.mech && p.adj.mech && p.adj.mech.sec >= dur * OUT_SHARE) return { pct: null, out: true, f: 1 };
  let f = 1;
  for (const t of TOGGLES) if (on[t.key] && p.adj[t.key]) f *= p.adj[t.key].f;
  if (Math.abs(f - 1) < 0.005) return { pct: p.pct, f: 1 };
  const a = curveAt(curve, p.dps);
  const b = curveAt(curve, p.dps * f);
  if (a == null || b == null) return { pct: p.pct, f };
  return { pct: Math.max(0, Math.min(100, Math.round(p.pct + b - a))), f, at: a, atAdj: b };
}

const pctChange = (f) => `${f >= 1 ? "+" : "−"}${Math.abs(Math.round((f - 1) * 100))}%`;
const list = (xs) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

// The adjustments that moved this row, in words.
function steps(p, on, dur, model) {
  const a = p.adj;
  const val = (kind, name) => model?.classes?.[p.cls]?.[kind]?.[name];
  const out = [];
  if (on.mech && a.mech && Math.abs(a.mech.f - 1) >= 0.005) {
    const left = Math.max(1, Math.round(dur - Math.min(a.mech.sec, dur * OUT_SHARE)));
    out.push({ key: "mech", label: "Mechanics", f: a.mech.f, text: `Out for ${a.mech.sec}s of the ${Math.round(dur)}s fight (${list(a.mech.why)}), so the damage is counted over the ${left}s left to act.` });
  }
  if (on.jobs && a.jobs && Math.abs(a.jobs.f - 1) >= 0.005) {
    out.push({ key: "jobs", label: "Jobs", f: a.jobs.f, text: `${list(a.jobs.why)}, at 1.5 seconds each, given back as time for damage.` });
  }
  if (on.wb && a.wb && Math.abs(a.wb.f - 1) >= 0.005) {
    const parts = a.wb.missing.map((n) => (val("wb", n) ? `${n} (+${(val("wb", n) * 100).toFixed(1)}%)` : n));
    out.push({ key: "wb", label: "World buffs", f: a.wb.f, text: `No ${list(parts)}.` });
  }
  if (on.cons && a.cons && Math.abs(a.cons.f - 1) >= 0.005) {
    const fmt = (n, sign) => (val("cons", n) ? `${n} (${sign}${(val("cons", n) * 100).toFixed(1)}%)` : n);
    const bits = [];
    if (a.cons.missing.length) bits.push(`missing the class's usual ${list(a.cons.missing.map((n) => fmt(n, "+")))}`);
    if (a.cons.extra.length) bits.push(`brought more than usual: ${list(a.cons.extra.map((n) => fmt(n, "−")))}`);
    out.push({ key: "cons", label: "Consumables", f: a.cons.f, text: `${bits.join("; ")}.`.replace(/^./, (c) => c.toUpperCase()) });
  }
  if (on.gear && a.gear && Math.abs(a.gear.f - 1) >= 0.005) {
    const per = model?.classes?.[p.cls]?.perIlvl;
    out.push({
      key: "gear",
      label: "Gear",
      f: a.gear.f,
      text: `Average item level ${a.gear.ilvl}, the class median that night ${a.gear.ref}${per ? ` (about ${(per * 100).toFixed(1)}% per item level)` : ""}.`,
    });
  }
  return out;
}

const shortWhy = (p, on, dur) => steps(p, on, dur, null).map((s) => `${s.label} ${pctChange(s.f)}`);

export function FairPanel({ night, b }) {
  const data = useFair(night);
  const [on, flip] = useToggles();
  const [open, setOpen] = useState(null);
  const model = useFair(open ? "model" : null);
  const boss = data?.bosses?.[b.encounterId];
  if (!boss) return null;
  const rows = boss.players
    .map((p) => ({ p, fair: fairOf(p, boss.curves[p.cls], on, boss.dur) }))
    .sort((x, y) => (y.fair.pct ?? -1) - (x.fair.pct ?? -1) || y.p.pct - x.p.pct);
  const moved = rows.filter((r) => r.fair.pct != null && r.fair.pct !== r.p.pct).length;
  const out = rows.filter((r) => r.fair.out).length;
  return (
    <Panel title="Fair parse" sub="just for fun · an estimate, not a Warcraft Logs number" className="rr-fair">
      <p className="rr-fair-intro">
        What would each parse look like with some things evened out? The <b>first badge</b> is the real Warcraft Logs parse and never changes. The <b>second</b> is our
        estimate with the adjustments switched on below. Click a name to see the working. <a href={href("raid-fair")}>How Fair parse works →</a>
      </p>
      <div className="rr-fair-toggles" role="group" aria-label="What to adjust for">
        {TOGGLES.map((t) => (
          <button key={t.key} type="button" className={`rr-fair-toggle${on[t.key] ? " on" : ""}`} aria-pressed={!!on[t.key]} onClick={() => flip(t.key)}>
            <span className="rr-fair-toggle-head">
              <span className="rr-fair-switch" aria-hidden="true" />
              {t.label}
              {t.on && <span className="rr-fair-default">default</span>}
            </span>
            <span className="rr-fair-toggle-desc">{t.desc}</span>
          </button>
        ))}
      </div>
      <div className="rr-fair-summary muted">
        {moved ? `${moved} of ${rows.length} parses move with these settings.` : `None of the ${rows.length} parses move with these settings.`}
        {out > 0 && ` ${out} ${out === 1 ? "raider was" : "raiders were"} out for most of the fight, so no fair parse.`}
        {boss.chronoboon && on.wb && " World buffs were stored in a Chronoboon for this boss, so the ones each raider had before it are used."}
      </div>
      <ol className="rr-fair-list">
        {rows.map(({ p, fair }) => {
          const d = fair.pct == null ? null : fair.pct - p.pct;
          const why = fair.out ? ["out for most of the fight"] : shortWhy(p, on, boss.dur);
          const isOpen = open === p.name;
          return (
            <li key={p.name} className={isOpen ? "open" : ""}>
              <button type="button" className="rr-fair-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : p.name)}>
                <span className="rr-fair-who">
                  <Player name={p.name} cls={p.cls} size={16} link={false} />
                  {why.length > 0 && <span className="rr-fair-why muted">{why.join(" · ")}</span>}
                </span>
                <span className="rr-fair-nums">
                  <span className="rr-fair-real" title="Real Warcraft Logs parse">
                    <ParseBadge pct={p.pct} />
                  </span>
                  <span className="rr-fair-arrow muted" aria-hidden="true">→</span>
                  {fair.out ? <span className="muted rr-fair-out">n/a</span> : <ParseBadge pct={fair.pct} />}
                  <span className={`rr-fair-delta${d > 0 ? " up" : d < 0 ? " down" : ""}`}>{d == null || d === 0 ? "" : d > 0 ? `+${d}` : d}</span>
                  <span className="rr-fair-caret muted" aria-hidden="true">{isOpen ? "▴" : "▾"}</span>
                </span>
              </button>
              {isOpen && <Breakdown p={p} fair={fair} on={on} dur={boss.dur} curve={boss.curves[p.cls]} model={model} bossName={b.name} />}
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

// The working for one raider: each adjustment, the new DPS, where it lands.
function Breakdown({ p, fair, on, dur, curve, model, bossName }) {
  const s = steps(p, on, dur, model);
  if (fair.out) {
    return (
      <div className="rr-fair-break">
        <p>
          A mechanic took {p.name} out for {p.adj.mech.sec} of the {Math.round(dur)} seconds ({list(p.adj.mech.why)}). With less than half the fight left to go on,
          there's too little to judge, so there's no fair parse here. The real parse stays {p.pct}.
        </p>
      </div>
    );
  }
  if (!s.length) {
    return (
      <div className="rr-fair-break">
        <p>Nothing switched on applies to {p.name} on this kill, so the fair parse is the real one: {p.pct}.</p>
      </div>
    );
  }
  const adj = Math.round(p.dps * fair.f);
  return (
    <div className="rr-fair-break">
      <ol className="rr-fair-steps">
        <li>
          <span className="rr-fair-step-k">Start</span>
          <span>
            Real DPS <b>{p.dps.toLocaleString()}</b>, real parse <b style={{ color: parseColor(p.pct) }}>{p.pct}</b>.
          </span>
        </li>
        {s.map((x) => (
          <li key={x.key}>
            <span className="rr-fair-step-k">
              {x.label} <span className={x.f >= 1 ? "rr-fair-up" : "rr-fair-down"}>{pctChange(x.f)}</span>
            </span>
            <span>{x.text}</span>
          </li>
        ))}
        <li>
          <span className="rr-fair-step-k">Adjusted DPS</span>
          <span>
            {p.dps.toLocaleString()} → <b>{adj.toLocaleString()}</b> ({pctChange(fair.f)} in all).
          </span>
        </li>
        <li>
          <span className="rr-fair-step-k">Fair parse</span>
          <span>
            {fair.at != null ? (
              <>
                On {bossName}, {p.cls.toLowerCase()}s in Moist's logs doing {p.dps.toLocaleString()} DPS parse about {Math.round(fair.at)}, and at {adj.toLocaleString()} about{" "}
                {Math.round(fair.atAdj)}. Moving {p.name}'s real {p.pct} the same distance gives <b style={{ color: parseColor(fair.pct) }}>{fair.pct}</b>.
              </>
            ) : (
              <>No parse curve for this class on this boss yet, so the parse can't move.</>
            )}
          </span>
        </li>
      </ol>
      {curve && fair.at != null && <MiniCurve curve={curve} real={[p.dps, p.pct]} fair={[adj, fair.pct]} cls={p.cls} />}
    </div>
  );
}

// The class's DPS -> parse curve on this boss, with the real and fair points.
function MiniCurve({ curve, real, fair, cls }) {
  const W = 320;
  const H = 120;
  const pad = { l: 28, r: 10, t: 10, b: 22 };
  const maxX = Math.max(curve.at(-1)[0], real[0], fair[0]) * 1.05;
  const x = (v) => pad.l + (v / maxX) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v / 100) * (H - pad.t - pad.b);
  const path = [[0, 0], ...curve].map(([a, b], i) => `${i ? "L" : "M"}${x(a).toFixed(1)},${y(b).toFixed(1)}`).join("");
  return (
    <figure className="rr-fair-curve">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Parse curve for ${cls}s on this boss, with the real and the fair point`}>
        {[25, 50, 75, 100].map((g) => (
          <g key={g}>
            <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} className="rr-fair-grid" />
            <text x={pad.l - 6} y={y(g) + 3} textAnchor="end" className="rr-fair-axis">{g}</text>
          </g>
        ))}
        <path d={path} fill="none" stroke={classColor(cls)} strokeWidth="2" strokeLinejoin="round" />
        <line x1={x(real[0])} y1={y(real[1])} x2={x(fair[0])} y2={y(fair[1])} className="rr-fair-move" />
        <circle cx={x(real[0])} cy={y(real[1])} r="5" fill="var(--surface-1)" stroke="var(--text-2)" strokeWidth="2">
          <title>Real: {real[0]} DPS, parse {real[1]}</title>
        </circle>
        <circle cx={x(fair[0])} cy={y(fair[1])} r="5" fill="var(--gold)" stroke="var(--surface-1)" strokeWidth="2">
          <title>Fair: {fair[0]} DPS, parse {fair[1]}</title>
        </circle>
        <text x={W - pad.r} y={H - 6} textAnchor="end" className="rr-fair-axis">DPS →</text>
      </svg>
      <figcaption className="muted">
        <span className="rr-fair-key real" /> real · <span className="rr-fair-key fair" /> fair · line: {cls.toLowerCase()} parses on this boss in Moist's logs
      </figcaption>
    </figure>
  );
}

// ---------- #/raid-fair: the explainer page ----------
export function FairAbout() {
  const model = useFair("model");
  return (
    <div className="view rr rr-fair-about">
      <div className="view-head">
        <div>
          <div className="rr-kicker">
            <span className="rr-kicker-dot" aria-hidden="true">♜</span>Raid logs · just for fun
          </div>
          <h1>How Fair parse works</h1>
          <p className="muted">An estimate of how each parse would look with some things evened out. Not a Warcraft Logs number, and it changes nobody's real parse.</p>
        </div>
      </div>

      <Panel title="The idea">
        <p>
          A Warcraft Logs parse ranks your DPS against everyone who killed the same boss. It can't know that Heigan teleported you into a tunnel for half the fight,
          that Kel'Thuzad mind-controlled you, that you spent the fight decursing, or that you died on trash and lost your world buffs. Fair parse is our guess at
          where you'd have landed if those things were evened out.
        </p>
        <p>
          It's for fun and for curiosity. It isn't used for anything: not for loot, not for SR points, not in the reviews. The real parse is always the first badge
          you see, and the fair one is next to it.
        </p>
      </Panel>

      <Panel title="How it's worked out" sub="three steps for every DPS on every kill">
        <ol className="rr-fair-howto">
          <li>
            <b>Start from your real kill.</b> Your DPS and your real parse, straight from Warcraft Logs.
          </li>
          <li>
            <b>Adjust your DPS</b> for whatever is switched on. Being out of the fight for a third of it means your damage is counted over the time you could actually
            act. Missing a buff that's worth 8% adds 8%.
          </li>
          <li>
            <b>Read off the new parse.</b> For every boss and class there's a curve of DPS against parse, built from the parses Moist's raiders got over the last year.
            We move you along that curve from your real parse by as much as your DPS changed. Starting from your own parse keeps it fair between specs that share a
            class curve, like fire and frost mages.
          </li>
        </ol>
        <div className="rr-fair-example">
          <div className="rr-clean-title">Example</div>
          <p>
            Speldosan on Heigan, 14 October: 305 DPS, parse 47. Heigan teleported Speldosan out of the room for 30 of the 71 seconds. 305 DPS over the 41 seconds left to
            act is about 533 DPS. Hunters in Moist's logs who did about 533 DPS on Heigan parsed around 72. Fair parse with Mechanics on: <b>72</b>.
          </p>
        </div>
      </Panel>

      <Panel title="The switches" sub="Mechanics and Jobs are on by default">
        <dl className="rr-fair-defs">
          <dt>Mechanics</dt>
          <dd>
            Time a boss mechanic took you out personally: Heigan's teleport, Web Wrap, Sapphiron's ice block, Frost Blast, mind control (Kel'Thuzad, Lucifron, Hakkar,
            Skeram and others) and the sheeps, fears and stuns the raid puts on you while you're controlled, Wyvern Sting, Hex, Entangle, Noxious Poison's silence
            (casters only), and being killed by another raider. Things that hit the whole raid at once, like Web Spray or a raid-wide fear, are left alone: everyone's
            parse on that boss has them. Each effect counts for at most its normal length, and if you were out for half the fight or more there's no fair parse.
          </dd>
          <dt>Jobs</dt>
          <dd>
            Casts that were a job rather than damage, at 1.5 seconds each: decurses and dispels, Tranquilizing Shots, sheeping, fearing or stunning mind-controlled
            raiders, Shackle, Innervate, battle rezzes. A third of the fight at most.
          </dd>
          <dt>World buffs</dt>
          <dd>As if you had the full set your class gets something from. Buffs stored in a Chronoboon for a boss count as had.</dd>
          <dt>Consumables</dt>
          <dd>
            As if you had your class's usual damage consumables (the ones most of the class brought over the last half year), no more and no less. So it can go{" "}
            <i>down</i> if you brought more than usual. Health-only things like Flask of the Titans don't count.
          </dd>
          <dt>Gear</dt>
          <dd>As if your average item level matched your class's median that night. Better geared than your classmates means it goes down.</dd>
        </dl>
      </Panel>

      <Panel title="What it can't see" sub="the reasons to take it with a pinch of salt">
        <ul className="rr-fair-limits">
          <li>Assignments the log doesn't show: kiting Gluth's zombies, controlling the Razorgore orb, anyone held back from part of a fight on purpose. Those parses stay as they are.</li>
          <li>Deaths and mistakes that were your own count against you, as they should. Disconnects look like doing nothing.</li>
          <li>
            The world buff, consumable and gear values are estimates from our logs, and rough. Careful raiders bring everything and also play well, so the raw fit
            leans high; we take a fifth off it.
          </li>
          <li>The parse curves come from Moist's own parses, not from every log on Warcraft Logs, so they're close to the real rankings but not the same.</li>
          <li>It's built by an AI from the logs, and Claude often gets vanilla mechanics wrong. If something looks off, it probably is.</li>
        </ul>
      </Panel>

      <Panel title="Questions">
        <dl className="rr-fair-defs">
          <dt>Why did mine go down?</dt>
          <dd>Only Consumables and Gear can lower it: you brought more than your class usually does, or your gear was better than your classmates' that night.</dd>
          <dt>Why is mine n/a?</dt>
          <dd>A mechanic took you out for half the fight or more, so there's too little left to judge.</dd>
          <dt>Why don't healers and tanks get one?</dt>
          <dd>Most healer parses in our logs are placeholders rather than real rankings, and a tank's damage parse says little about tanking.</dd>
          <dt>Which raids have it?</dt>
          <dd>Every raid since January 2025 that has its full combat log, which is nearly all of them. It's on each boss's Performance tab.</dd>
        </dl>
      </Panel>

      {model && (
        <Panel title="Values from Moist's logs" sub={`what each buff, consumable and item level was worth, from ${model.rows.toLocaleString()} DPS parses`}>
          <ModelValues model={model} />
        </Panel>
      )}
    </div>
  );
}

function ModelValues({ model }) {
  const classes = Object.entries(model.classes).filter(([, m]) => m.n >= 1000).sort((a, b) => b[1].n - a[1].n);
  const pct = (v) => `+${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`;
  return (
    <div className="rr-fair-values">
      <p className="muted">
        How it's measured: the same raider on nights with and without each buff, compared with their classmates on the same kill. These are the values the World
        buffs, Consumables and Gear switches use, after taking a fifth off.
      </p>
      <div className="rr-table-wrap">
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
      </div>
    </div>
  );
}
