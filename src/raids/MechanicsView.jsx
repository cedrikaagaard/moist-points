import { MECHANICS } from "./mechanics.js";
import { ALL_TIME, CLASS_OF } from "./data.js";
import { classColor, fmtDate } from "./assets.js";
import { BarList, Panel, Player, SpellIcon, useTip } from "./components.jsx";
import { parseColor, ParseBadge, Bands } from "./RaidProfile.jsx";
import { HoverColumns, rollingMedian } from "./charts.jsx";

const ranked = (obj) => Object.entries(obj || {}).sort((a, b) => b[1] - a[1]);
const P = ({ name, size = 14 }) => {
  const p = ALL_TIME.players.find((x) => x.name === name);
  return <Player name={name} cls={p?.class || CLASS_OF.get(name)} spec={p?.spec} size={size} />;
};
const TONE = { good: "rr-mech-good", bad: "rr-mech-bad", info: "rr-mech-info" };

// ---------- one boss, one night ----------

// The boss's signature mechanics for this fight. `b` is a night boss entry
// (needs schema 3: b.mech / b.present).
export function NightMechanics({ b, icons }) {
  const list = MECHANICS[b.encounterId] || [];
  if (!b.mech || !list.length) return null;
  const present = b.present || [];
  return (
    <Panel title="Mechanics" sub="what this fight is about, and who handled it">
      <div className="rr-mechs">
        {list.map((m) => {
          const by = ranked(b.mech[m.key]);
          const total = by.reduce((t, [, c]) => t + c, 0);
          // Nothing logged: for avoidable stuff that's the best outcome; otherwise skip it.
          if (!total && m.tone !== "bad") return null;
          const clean = m.tone === "bad" ? present.filter((n) => !b.mech[m.key]?.[n]) : [];
          return (
            <div key={m.key} className={`rr-mech ${TONE[m.tone]}`}>
              <div className="rr-mech-head">
                <SpellIcon name={m.abilities[0]} icons={icons} size={34} />
                <div>
                  <div className="rr-mech-label">{m.label}</div>
                  {m.note && <div className="rr-mech-note muted">{m.note}</div>}
                </div>
                <div className="rr-mech-total">
                  <b>{total}</b>
                  <span className="muted">{m.kind === "debuff" ? "applied" : m.kind === "cast" ? "casts" : m.kind === "hit" ? "hits" : "total"}</span>
                </div>
              </div>
              {m.tone === "bad" ? (
                total === 0 ? (
                  <div className="rr-mech-clean">Nobody got caught.</div>
                ) : (
                  <>
                    <div className="rr-mech-people">
                      {by.slice(0, 10).map(([n, c]) => (
                        <span key={n}><P name={n} /> <span className="muted">{c}</span></span>
                      ))}
                      {by.length > 10 && <span className="muted">+{by.length - 10} more</span>}
                    </div>
                    {clean.length > 0 && (
                      <div className="rr-mech-sub muted">
                        <b className="rr-gold">{clean.length}</b> of {present.length} raiders never got hit
                      </div>
                    )}
                  </>
                )
              ) : (
                <div className="rr-mech-people">
                  {by.slice(0, 8).map(([n, c]) => (
                    <span key={n}><P name={n} /> <span className="muted">{c}</span></span>
                  ))}
                  {by.length > 8 && <span className="muted">+{by.length - 8} more</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// Dispels/interrupts and parses for one fight.
export function NightFightWork({ b, icons }) {
  const has = (b.dispels?.length || 0) + (b.kicks?.length || 0) > 0;
  return (
    <>
      {b.parses?.length > 0 && (
        <Panel title="Parses" sub="Warcraft Logs rank on this kill · DPS, or HPS for healers">
          <ParseList parses={b.parses} />
        </Panel>
      )}
      {has && (
        <div className="grid-2">
          <Panel title="Dispels" sub="on this fight">
            <BarList rows={(b.dispels || []).slice(0, 8).map((d) => ({ key: d.player, label: <P name={d.player} size={16} />, value: d.total, color: classColor(CLASS_OF.get(d.player)), note: topWhat(d.what, icons) }))} empty="None on this fight." />
          </Panel>
          <Panel title="Interrupts" sub="on this fight">
            <BarList rows={(b.kicks || []).slice(0, 8).map((d) => ({ key: d.player, label: <P name={d.player} size={16} />, value: d.total, color: classColor(CLASS_OF.get(d.player)), note: topWhat(d.what, icons) }))} empty="None on this fight." />
          </Panel>
        </div>
      )}
    </>
  );
}

function topWhat(what, icons) {
  const [name, c] = ranked(what)[0] || [];
  return name ? <span className="rr-inline-ic"><SpellIcon name={name} icons={icons} size={14} /> {c}× {name}</span> : null;
}

function ParseList({ parses }) {
  const groups = [
    ["dps", "Damage"],
    ["healer", "Healing"],
    ["tank", "Tanks"],
  ];
  return (
    <div className="rr-parse-groups">
      {groups.map(([role, label]) => {
        const list = parses.filter((p) => p.role === role);
        if (!list.length) return null;
        const max = Math.max(...list.map((p) => p.amount));
        return (
          <div key={role}>
            <div className="rr-clean-title">{label}</div>
            <ol className="rr-bars">
              {list.map((p) => (
                <li key={p.player}>
                  <div className="rr-bar-label"><P name={p.player} size={16} /></div>
                  <div className="rr-bar-track">
                    <div className="rr-bar-fill" style={{ width: `${(p.amount / max) * 100}%`, background: classColor(CLASS_OF.get(p.player)) }} />
                  </div>
                  <div className="rr-bar-val rr-parse-val">
                    <span className="muted">{p.amount.toLocaleString()}</span> <ParseBadge pct={p.pct} />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </div>
  );
}

// ---------- one boss, all time ----------

export function BossMechanicsAllTime({ b }) {
  const list = (MECHANICS[b.id] || []).filter((m) => Object.keys(b.mech?.[m.key] || {}).length || (m.tone === "bad" && b.mechNights));
  if (!list.length) return null;
  return (
    <Panel title="Mechanics, all time" sub="who handles this fight best">
      <div className="rr-mechs">
        {list.map((m) => {
          const by = ranked(b.mech?.[m.key]);
          const nights = (b.mechNights?.[m.key] || []).filter((x) => x.present);
          return (
            <div key={m.key} className={`rr-mech ${TONE[m.tone]}`}>
              <div className="rr-mech-head">
                <SpellIcon name={m.abilities[0]} icons={ALL_TIME.icons} size={34} />
                <div>
                  <div className="rr-mech-label">{m.label}</div>
                  {m.note && <div className="rr-mech-note muted">{m.note}</div>}
                </div>
                {m.tone === "bad" && nights.length > 1 && <MechTrend nights={nights} />}
              </div>
              <div className="rr-mech-people">
                {by.slice(0, 8).map(([n, c]) => (
                  <span key={n}><P name={n} /> <span className="muted">{c}</span></span>
                ))}
              </div>
              {m.tone === "bad" && <div className="rr-mech-sub muted">most hits all time · trend is hits per raider per night</div>}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// Hits per raider per night - is the raid getting better at it?
function MechTrend({ nights }) {
  const [tip, bind] = useTip();
  const W = 120;
  const H = 34;
  const v = nights.map((x) => x.total / Math.max(1, x.present));
  const max = Math.max(...v, 0.01);
  const pts = v.map((y, i) => [4 + (i / (v.length - 1)) * (W - 8), 4 + (1 - y / max) * (H - 8)]);
  return (
    <span className="rr-mech-trend">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Hits per raider per night">
        <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="#e0525f" strokeWidth={pts.length > 12 ? 1 : 1.5} />
        {pts.map(([x, y], i) => (pts.length <= 12 || i === pts.length - 1 ? <circle key={i} cx={x} cy={y} r="2.5" fill="#e0525f" /> : null))}
        <HoverColumns xs={pts.map((p) => p[0])} top={0} bottom={H} bind={bind} tipFor={(i) => <>{fmtDate(nights[i].night)} · {nights[i].total} hits, {nights[i].raiders} raiders hit</>} />
      </svg>
      {tip}
    </span>
  );
}

export function BossParsesAllTime({ b }) {
  const best = Object.entries(b.bestParse || {}).sort((x, y) => y[1].pct - x[1].pct);
  if (!best.length) return null;
  const medians = b.parseNights || [];
  return (
    <div className="grid-2">
      <Panel title="Best parses" sub="each raider's best on this boss">
        <ol className="rr-bars">
          {best.slice(0, 12).map(([name, p]) => (
            <li key={name}>
              <div className="rr-bar-label"><P name={name} size={16} /></div>
              <div className="rr-bar-track">
                <div className="rr-bar-fill" style={{ width: `${p.pct}%`, background: parseColor(p.pct) }} />
              </div>
              <div className="rr-bar-val"><ParseBadge pct={p.pct} /></div>
              <div className="rr-bar-note muted">{fmtDate(p.night)} · {p.amount.toLocaleString()} {p.role === "healer" ? "HPS" : "DPS"}</div>
            </li>
          ))}
        </ol>
      </Panel>
      <Panel title="Raid parse trend" sub="median parse on each kill">
        <MedianTrend medians={medians} />
      </Panel>
    </div>
  );
}

function MedianTrend({ medians }) {
  const [tip, bind] = useTip();
  if (medians.length < 2) return <div className="muted rr-empty-sm">Needs a couple of kills to show a trend.</div>;
  const W = 500;
  const H = 180;
  const pad = { l: 30, r: 10, t: 10, b: 24 };
  const x = (i) => pad.l + (i / (medians.length - 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v / 100) * (H - pad.t - pad.b);
  // Many kills: parse-colour bands for meaning, a rolling median for the trend.
  if (medians.length > 20) {
    const med = rollingMedian(medians.map((m) => m.median));
    const last = medians.at(-1);
    return (
      <div className="rr-timeline">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Median parse per kill">
          <Bands x0={pad.l} x1={W - pad.r} y={y} />
          {[25, 50, 75, 95].map((t) => (
            <text key={t} x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="rr-axis">{t}</text>
          ))}
          <polyline points={medians.map((m, i) => `${x(i)},${y(m.median)}`).join(" ")} fill="none" stroke="var(--text-2)" strokeWidth="1" opacity="0.4" />
          <polyline points={med.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx={x(medians.length - 1)} cy={y(last.median)} r="5" fill={parseColor(last.median)} stroke="var(--surface-1)" strokeWidth="1.5" />
          <HoverColumns xs={medians.map((_, i) => x(i))} top={pad.t} bottom={H - pad.b} bind={bind} tipFor={(i) => <>{fmtDate(medians[i].night)} · median {medians[i].median} ({medians[i].count} ranked)</>} />
        </svg>
        <div className="rr-legend">
          <span><i style={{ background: "var(--text)", height: 3, borderRadius: 0 }} /> Typical (median of 5 kills)</span>
          <span><i style={{ background: "var(--text-2)", height: 1, borderRadius: 0, opacity: 0.6 }} /> Each kill</span>
        </div>
        {tip}
      </div>
    );
  }
  return (
    <div className="rr-timeline">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Median parse per kill">
        {[0, 25, 50, 75, 100].map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border-soft)" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="rr-axis">{t}</text>
          </g>
        ))}
        <polyline points={medians.map((m, i) => `${x(i)},${y(m.median)}`).join(" ")} fill="none" stroke="var(--gold)" strokeWidth="2" />
        {medians.map((m, i) => (
          <circle key={i} cx={x(i)} cy={y(m.median)} r="5" fill={parseColor(m.median)} stroke="var(--surface-1)" strokeWidth="1.5" {...bind(<>{fmtDate(m.night)} · median {m.median} ({m.count} ranked)</>)} />
        ))}
      </svg>
      {tip}
    </div>
  );
}
