import { useEffect, useState } from "react";
import { NIGHTS, ALL_TIME } from "./data.js";
import { fmtDate, zoneOf } from "./assets.js";
import { BossIcon, Panel, SpellIcon, Tabs, Tile, ZoneIcon, useTip } from "./components.jsx";
import { zoneForEncounter } from "./aggregate.js";
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
        <Tile value={parses.length} label="Boss kills" sub="with a parse on Warcraft Logs" />
        <Tile value={best ? best.pct : "-"} label="Best parse" accent={parseColor(best?.pct)} sub={best && `${best.boss} · ${fmtDate(best.night, { day: "numeric", month: "short" })}`} />
        <Tile value={clean} label="Deathless nights" sub={`${(deaths / nights.length).toFixed(1)} deaths per night`} />
      </div>

      {parses.length > 0 && <Parses parses={parses} />}

      <div className="grid-2">
        <Panel title="Utility" sub="all nights">
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

// ---------- Parses: per raid, then per boss ----------

// WCL parse tiers, low to high - drawn as faint bands behind the charts.
const TIERS = [[0, 25], [25, 50], [50, 75], [75, 95], [95, 99], [99, 100]];

function Parses({ parses }) {
  const zoneIds = [...new Set(parses.map((x) => zoneForEncounter(x.id)).filter(Boolean))];
  const latest = zoneForEncounter(parses.at(-1).id);
  const [zone, setZone] = useState(zoneIds.includes(latest) ? latest : zoneIds[0]);
  const mine = parses.filter((x) => zoneForEncounter(x.id) === zone);
  const avg = Math.round(mine.reduce((t, x) => t + x.pct, 0) / mine.length);

  // Per night in this raid: average parse over that night's kills.
  const nights = [];
  for (const x of mine) {
    const last = nights.at(-1);
    if (last?.night === x.night) last.list.push(x);
    else nights.push({ night: x.night, list: [x] });
  }
  for (const n of nights) n.avg = Math.round(n.list.reduce((t, x) => t + x.pct, 0) / n.list.length);

  // Per boss: best, average, every kill in order.
  const bosses = new Map();
  for (const x of mine) {
    const b = bosses.get(x.id) || { id: x.id, boss: x.boss, kills: [] };
    b.kills.push(x);
    bosses.set(x.id, b);
  }
  const bossList = [...bosses.values()].sort((a, b) => a.id - b.id);

  return (
    <Panel
      title="Parses"
      sub="how your damage (or healing) ranks against everyone who killed the same boss on Warcraft Logs · 50 = average, 95+ = top 5%"
      className="rr-parses"
    >
      <Tabs
        tabs={zoneIds.map((z) => ({ key: z, label: zoneOf(z).short, icon: <ZoneIcon id={z} size={18} /> }))}
        value={zone}
        onChange={setZone}
      />
      <div className="rr-parse-head">
        <ParseBadge pct={avg} />
        <span>
          average in <b>{zoneOf(zone).name}</b> <span className="muted">· {mine.length} kills over {nights.length} nights</span>
        </span>
      </div>
      {nights.length > 1 && <NightParseChart nights={nights} />}
      <div className="rr-bossparse">
        {bossList.map((b) => {
          const best = b.kills.reduce((m, x) => (x.pct > m.pct ? x : m));
          const bAvg = Math.round(b.kills.reduce((t, x) => t + x.pct, 0) / b.kills.length);
          return (
            <a key={b.id} className="rr-bossparse-card" href={href("raids", best.night, b.id)} title={`Best on ${fmtDate(best.night)} · open that kill`}>
              <BossIcon id={b.id} name={b.boss} size={36} />
              <div className="rr-bossparse-body">
                <div className="rr-bossparse-name">{b.boss}</div>
                <div className="muted rr-bossparse-meta">avg {bAvg} · {b.kills.length} {b.kills.length === 1 ? "kill" : "kills"}</div>
                <ParseDots kills={b.kills} />
              </div>
              <div className="rr-bossparse-best">
                <ParseBadge pct={best.pct} />
                <span className="muted">best</span>
              </div>
            </a>
          );
        })}
      </div>
    </Panel>
  );
}

function Bands({ x0, x1, y }) {
  return TIERS.map(([lo, hi]) => (
    <rect key={lo} x={x0} width={x1 - x0} y={y(hi)} height={y(lo) - y(hi)} fill={parseColor(lo)} opacity="0.07" />
  ));
}

// Average parse per night in one raid, on the parse-colour bands.
function NightParseChart({ nights }) {
  const [tip, bind] = useTip();
  const W = 1000;
  const H = 200;
  const pad = { l: 34, r: 12, t: 10, b: 26 };
  const x = (i) => pad.l + (i / Math.max(1, nights.length - 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v / 100) * (H - pad.t - pad.b);
  const every = Math.max(1, Math.ceil(nights.length / 10));
  return (
    <div className="rr-timeline">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Average parse per raid night">
        <Bands x0={pad.l} x1={W - pad.r} y={y} />
        {[25, 50, 75, 95].map((t) => (
          <text key={t} x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="rr-axis">{t}</text>
        ))}
        <polyline points={nights.map((n, i) => `${x(i)},${y(n.avg)}`).join(" ")} fill="none" stroke="var(--text-2)" strokeWidth="2" />
        {nights.map((n, i) => (
          <g key={n.night}>
            <circle
              cx={x(i)}
              cy={y(n.avg)}
              r="7"
              fill={parseColor(n.avg)}
              stroke="var(--surface-1)"
              strokeWidth="2"
              {...bind(
                <>
                  <strong>{fmtDate(n.night)}</strong> · average {n.avg}
                  {n.list.map((k) => (
                    <div key={k.id} className="muted">{k.boss}: <span style={{ color: parseColor(k.pct) }}>{k.pct}</span></div>
                  ))}
                </>
              )}
            />
            {i % every === 0 && <text x={x(i)} y={H - 8} textAnchor="middle" className="rr-axis">{fmtDate(n.night, { day: "numeric", month: "short" })}</text>}
          </g>
        ))}
      </svg>
      {tip}
    </div>
  );
}

// Every kill on one boss, oldest to newest, as coloured dots on a 0-100 strip.
function ParseDots({ kills }) {
  const W = 160;
  const H = 30;
  const x = (i) => 5 + (i / Math.max(1, kills.length - 1)) * (W - 10);
  const y = (v) => 3 + (1 - v / 100) * (H - 6);
  return (
    <svg className="rr-parsedots" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
      <Bands x0={0} x1={W} y={y} />
      {kills.length > 1 && <polyline points={kills.map((k, i) => `${x(i)},${y(k.pct)}`).join(" ")} fill="none" stroke="var(--muted)" strokeWidth="1" />}
      {kills.map((k, i) => (
        <circle key={i} cx={kills.length > 1 ? x(i) : W / 2} cy={y(k.pct)} r="3" fill={parseColor(k.pct)}>
          <title>{`${fmtDate(k.night)}: ${k.pct}`}</title>
        </circle>
      ))}
    </svg>
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
