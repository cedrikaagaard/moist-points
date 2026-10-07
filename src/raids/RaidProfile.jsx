import { useEffect, useState } from "react";
import { NIGHTS, ALL_TIME } from "./data.js";
import { fmtDate } from "./assets.js";
import { BossIcon, Panel, SpellIcon, Tile, ZoneIcon, useTip } from "./components.jsx";
import { MECHANICS } from "./mechanics.js";
import { rosterOf } from "../lib/roster.js";
import { href } from "../router.js";
import "./raids.css";

// A raider's raid record, for their profile / My Page. Loads their own file
// (src/raids/data/players/<name>.json) so the page stays light.
const files = import.meta.glob("./data/players/*.json", { import: "default" });

export function usePlayerRaids(name) {
  const r = rosterOf(name);
  const [state, setState] = useState({ data: null, name: null });
  useEffect(() => {
    const load = r && files[`./data/players/${r.file}.json`];
    if (!load) return setState({ data: null, name });
    let live = true;
    load().then((d) => live && setState({ data: d, name }));
    return () => {
      live = false;
    };
  }, [name, r?.file]);
  return state.name === name ? state.data : undefined; // undefined = loading, null = none
}

// Warcraft Logs' parse colours: grey, green, blue, purple, orange, pink, gold.
export function parseColor(pct) {
  if (pct == null) return "var(--muted)";
  if (pct >= 100) return "#e5cc80";
  if (pct >= 99) return "#e268a8";
  if (pct >= 95) return "#ff8000";
  if (pct >= 75) return "#a335ee";
  if (pct >= 50) return "#0070ff";
  if (pct >= 25) return "#1eff00";
  return "#9d9d9d";
}
export const ParseBadge = ({ pct }) => (
  <span className="rr-parse" style={{ color: parseColor(pct), borderColor: parseColor(pct) }}>{pct ?? "-"}</span>
);

export default function RaidProfile({ name }) {
  const p = usePlayerRaids(name);
  if (p === undefined) return <div className="muted rr-loading">Loading raid record…</div>;
  if (!p) {
    return (
      <div className="empty">
        No raid logs for <strong>{name}</strong> yet. Once they show up in a logged raid, their raid record appears here.
      </div>
    );
  }
  return <Record p={p} />;
}

function Record({ p }) {
  const nights = p.nights;
  const first = nights[0].night;
  const guildNights = NIGHTS.filter((n) => n.night >= first).length;
  const parses = nights.flatMap((n) => n.parses.map((x) => ({ ...x, night: n.night })));
  const avg = parses.length ? Math.round(parses.reduce((t, x) => t + x.pct, 0) / parses.length) : null;
  const best = parses.reduce((b, x) => (!b || x.pct > b.pct ? x : b), null);
  const deaths = nights.reduce((t, n) => t + n.deaths, 0);
  const clean = nights.filter((n) => n.deaths === 0).length;
  const dispels = nights.reduce((t, n) => t + n.dispels, 0);
  const kicks = nights.reduce((t, n) => t + n.kicks, 0);
  const me = ALL_TIME.players.find((x) => x.name === p.name);

  return (
    <div className="rr rr-profile">
      <div className="stat-row rr-stat-row">
        <Tile value={nights.length} label="Raid nights" sub={`${Math.round((nights.length / Math.max(1, guildNights)) * 100)}% of guild nights since ${fmtDate(first, { day: "numeric", month: "short" })}`} />
        <Tile value={avg ?? "-"} label="Average parse" accent={parseColor(avg)} sub={`over ${parses.length} boss kills`} />
        <Tile value={best ? best.pct : "-"} label="Best parse" accent={parseColor(best?.pct)} sub={best && `${best.boss} · ${fmtDate(best.night, { day: "numeric", month: "short" })}`} />
        <Tile value={clean} label="Deathless nights" sub={`${(deaths / nights.length).toFixed(1)} deaths per night`} />
      </div>

      {parses.length > 1 && (
        <Panel title="Parses over time" sub="each dot a boss kill · line = rolling average">
          <ParseTrend parses={parses} />
        </Panel>
      )}

      {parses.length > 0 && (
        <Panel title="Best parse per boss">
          <BestPerBoss parses={parses} />
        </Panel>
      )}

      <div className="grid-2">
        <Panel title="Quiet work" sub="the stuff meters don't show">
          <QuietWork p={p} me={me} dispels={dispels} kicks={kicks} />
        </Panel>
        <Panel title="Mechanics" sub="boss by boss, all nights">
          <Mechanics p={p} />
        </Panel>
      </div>

      <Panel title="Raid nights" sub="most recent first">
        <div className="rr-night-list">
          {[...nights].reverse().slice(0, 12).map((n) => (
            <a key={n.night} className="rr-night-row rr-night-row-sm rr-prof-night" href={href("raids", n.night)}>
              <span className="rr-inline-ic">
                {n.zones.map((z) => <ZoneIcon key={z} id={z} size={22} />)}
                <span className="muted">{fmtDate(n.night)}</span>
              </span>
              <span className="rr-prof-parses">
                {n.parses.map((x) => (
                  <span key={x.id} title={`${x.boss}: ${x.pct}`} className="rr-prof-parse-dot" style={{ background: parseColor(x.pct) }} />
                ))}
              </span>
              <span className="rr-night-stats-sm muted">
                {n.deaths ? `${n.deaths} ☠` : "deathless"}
              </span>
            </a>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ParseTrend({ parses }) {
  const [tip, bind] = useTip();
  const W = 1000;
  const H = 220;
  const pad = { l: 36, r: 10, t: 12, b: 26 };
  const x = (i) => pad.l + (i / Math.max(1, parses.length - 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v / 100) * (H - pad.t - pad.b);
  const K = Math.min(8, parses.length);
  const rolling = parses.map((_, i) => {
    const win = parses.slice(Math.max(0, i - K + 1), i + 1);
    return win.reduce((t, w) => t + w.pct, 0) / win.length;
  });
  let lastNight = null;
  return (
    <div className="rr-timeline">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Parse percentiles over time">
        {[0, 25, 50, 75, 95, 100].map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border-soft)" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="rr-axis">{t}</text>
          </g>
        ))}
        <polyline points={rolling.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke="var(--gold)" strokeWidth="2.5" />
        {parses.map((pr, i) => {
          const label = pr.night !== lastNight && (parses.length < 40 || i % Math.ceil(parses.length / 10) === 0);
          lastNight = pr.night;
          return (
            <g key={i}>
              <circle
                cx={x(i)}
                cy={y(pr.pct)}
                r="5"
                fill={parseColor(pr.pct)}
                stroke="var(--surface-1)"
                strokeWidth="1.5"
                {...bind(<><strong>{pr.boss}</strong><div className="muted">{fmtDate(pr.night)} · {pr.pct} parse · {pr.amount.toLocaleString()} {pr.role === "healer" ? "HPS" : "DPS"}</div></>)}
              />
              {label && <text x={x(i)} y={H - 8} textAnchor="middle" className="rr-axis">{fmtDate(pr.night, { day: "numeric", month: "short" })}</text>}
            </g>
          );
        })}
      </svg>
      {tip}
    </div>
  );
}

function BestPerBoss({ parses }) {
  const byBoss = new Map();
  for (const x of parses) {
    const b = byBoss.get(x.id);
    if (!b) byBoss.set(x.id, { ...x, kills: 1, sum: x.pct });
    else {
      b.kills++;
      b.sum += x.pct;
      if (x.pct > b.pct) Object.assign(b, { pct: x.pct, night: x.night, amount: x.amount });
    }
  }
  const rows = [...byBoss.values()].sort((a, b) => a.id - b.id);
  return (
    <div className="rr-bestboss">
      {rows.map((b) => (
        <a key={b.id} className="rr-bestboss-row" href={href("raids", b.night, b.id)} title={`Best on ${fmtDate(b.night)}`}>
          <BossIcon id={b.id} name={b.boss} size={30} />
          <span className="rr-bestboss-name">{b.boss}</span>
          <ParseBadge pct={b.pct} />
          <span className="muted rr-bestboss-meta">avg {Math.round(b.sum / b.kills)} · {b.kills} kills</span>
        </a>
      ))}
    </div>
  );
}

const QUIET = ["Sunder Armor", "Curse of Recklessness", "Curse of the Elements", "Faerie Fire", "Expose Armor", "Demoralizing Shout", "Tranquilizing Shot", "Fear Ward", "Power Infusion", "Innervate", "Rebirth", "Goblin Sapper Charge", "Major Healthstone", "Restore Mana", "Dark Rune"];

function QuietWork({ p, me, dispels, kicks }) {
  const casts = {};
  for (const n of p.nights) for (const [a, c] of Object.entries(n.casts || {})) casts[a] = (casts[a] || 0) + c;
  const rows = [
    { name: "Decurse", label: "Dispels", value: dispels },
    { name: "Kick", label: "Interrupts", value: kicks },
    { name: "Rebirth", label: "Battle rezzes", value: me?.combatRezzes || 0 },
    ...QUIET.filter((a) => casts[a]).map((a) => ({ name: a, label: a, value: casts[a] })),
  ].filter((r) => r.value > 0);
  if (!rows.length) return <div className="muted rr-empty-sm">Nothing tracked yet.</div>;
  return (
    <div className="rr-duties">
      {rows.map((r) => (
        <div key={r.label} className="rr-duty">
          <SpellIcon name={r.name} size={28} />
          <div className="rr-duty-body">
            <div className="rr-duty-name">{r.label}</div>
          </div>
          <b className="rr-duty-val">{r.value.toLocaleString()}</b>
        </div>
      ))}
    </div>
  );
}

// Personal mechanic totals: "Hateful Strikes soaked 34", "Hit by Eruption 3".
function Mechanics({ p }) {
  const totals = {};
  for (const n of p.nights) {
    for (const [k, v] of Object.entries(n.mech || {})) totals[k] = (totals[k] || 0) + v;
  }
  const rows = Object.entries(totals)
    .map(([k, v]) => {
      const [id, key] = k.split(":");
      const m = (MECHANICS[id] || []).find((x) => x.key === key);
      const boss = ALL_TIME.bosses.find((b) => b.id === Number(id));
      return m && boss ? { id: Number(id), boss: boss.name, m, v } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (a.m.tone === "good" ? -1 : 0) - (b.m.tone === "good" ? -1 : 0) || b.v - a.v)
    .slice(0, 12);
  if (!rows.length) return <div className="muted rr-empty-sm">No boss mechanics logged yet.</div>;
  return (
    <div className="rr-duties">
      {rows.map((r) => (
        <a key={`${r.id}${r.m.key}`} className="rr-duty rr-duty-link" href={href("raid-boss", r.id)}>
          <BossIcon id={r.id} name={r.boss} size={28} />
          <div className="rr-duty-body">
            <div className="rr-duty-name">{r.m.label}</div>
            <div className="muted rr-duty-sub">{r.boss}</div>
          </div>
          <b className={`rr-duty-val ${r.m.tone === "good" ? "rr-gold" : r.m.tone === "bad" ? "rr-wipe-txt" : ""}`}>{r.v}</b>
        </a>
      ))}
    </div>
  );
}
