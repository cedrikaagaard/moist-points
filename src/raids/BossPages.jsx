import { NIGHTS, ALL_TIME, CLASS_OF, useBosses } from "./data.js";
import { bossImg, classColor, fmtDate, mmss, zoneImg, zoneOf } from "./assets.js";
import { Banner, BarList, BossIcon, Panel, Player, SpellIcon, Tile, ZoneIcon, useTip } from "./components.jsx";
import { ClearTrend, KillSparkline } from "./charts.jsx";
import { BossMechanicsAllTime, BossParsesAllTime } from "./MechanicsView.jsx";
import { href } from "../router.js";

const playerInfo = new Map(ALL_TIME.players.map((p) => [p.name, p]));
const P = ({ name, size }) => {
  const p = playerInfo.get(name);
  return <Player name={name} cls={p?.class} spec={p?.spec} size={size} />;
};
const ranked = (obj) => Object.entries(obj || {}).sort((a, b) => b[1] - a[1]);
const playerBars = (obj, n = 10, note) =>
  ranked(obj)
    .slice(0, n)
    .map(([name, v]) => ({ key: name, label: <P name={name} />, value: v, color: classColor(CLASS_OF.get(name)), note: note?.(name) }));

// ================= Zone =================

export function ZonePage({ id }) {
  const zone = zoneOf(id);
  const bosses = ALL_TIME.bosses.filter((b) => b.zoneId === id).sort((a, b) => a.id - b.id);
  const nights = NIGHTS.filter((n) => n.zoneTimes?.[id]).slice().reverse(); // oldest first
  if (!bosses.length) return <div className="view"><div className="empty">No logs for this raid yet.</div></div>;

  const maxKills = Math.max(...nights.map((n) => n.zoneTimes[id].kills));
  const clears = nights.filter((n) => n.zoneTimes[id].kills === maxKills);
  const fastest = clears.reduce((best, n) => (!best || n.zoneTimes[id].sec < best.zoneTimes[id].sec ? n : best), null);
  const deaths = bosses.reduce((t, b) => t + b.deaths, 0);

  return (
    <div className="view rr">
      <Banner
        kind="history"
        accent={zone.color}
        art={[zoneImg(id)]}
        kicker="Guild history · all time"
        title={`Moist in ${zone.name}`}
        sub={`${nights.length} raids logged since ${fmtDate(nights[0].night, { day: "numeric", month: "short", year: "numeric" })}`}
        crumbs={[{ label: "Raid logs", href: href("raids") }, { label: zone.name }]}
        stats={[
          { value: bosses.reduce((t, b) => t + b.kills, 0), label: "boss kills" },
          { value: bosses.reduce((t, b) => t + b.wipes, 0), label: "wipes" },
          { value: deaths, label: "deaths" },
          ...(fastest ? [{ value: mmss(fastest.zoneTimes[id].sec), label: "fastest clear", className: "rr-gold" }] : []),
        ]}
      />

      <Panel title="Clear time" sub="first pull to last boss, raid by raid">
        <ClearTrend nights={nights} zoneId={id} />
      </Panel>

      <Panel title="Bosses">
        <div className="rr-boss-grid rr-boss-grid-lg">
          {bosses.map((b) => (
            <a key={b.id} className="rr-boss rr-boss-link" href={href("raid-boss", b.id)}>
              <BossIcon id={b.id} name={b.name} size={56} />
              <div className="rr-boss-body">
                <div className="rr-boss-name">{b.name}</div>
                <div className="rr-boss-time">
                  best <b className="rr-gold">{mmss(b.bestKillSec)}</b>
                  <span className="muted"> · {b.kills} kills{b.wipes ? ` · ` : ""}</span>
                  {b.wipes > 0 && <span className="rr-wipe-txt">{b.wipes} wipes</span>}
                </div>
                <KillSparkline history={b.history} best={b.bestKillSec} />
              </div>
            </a>
          ))}
        </div>
      </Panel>

      <div className="grid-2">
        <Panel title="Deadliest bosses" sub="raid deaths per boss">
          <BarList
            rows={[...bosses]
              .sort((a, b) => b.deaths - a.deaths)
              .filter((b) => b.deaths)
              .map((b) => ({
                key: b.id,
                label: <span className="rr-inline-ic"><BossIcon id={b.id} name={b.name} size={20} /> {b.name}</span>,
                value: b.deaths,
                color: "var(--text-2)",
                note: `${(b.deaths / Math.max(1, b.pulls)).toFixed(1)} per pull`,
              }))}
          />
        </Panel>
        <Panel title="Raid veterans" sub="boss kills attended here">
          <Veterans ids={bosses.map((b) => b.id)} />
        </Panel>
      </div>
    </div>
  );
}

// Boss kills each raider was present for, summed over the raid's bosses
// (from the per-boss detail files, loaded on this page).
function Veterans({ ids }) {
  const detail = useBosses(ids);
  if (!detail) return <div className="muted rr-empty-sm">Loading…</div>;
  const out = {};
  for (const b of Object.values(detail)) {
    for (const [name, c] of Object.entries(b?.raidersBy || {})) out[name] = (out[name] || 0) + c;
  }
  return <BarList rows={playerBars(out, 10)} />;
}

// ================= Boss =================

export function BossPage({ id }) {
  const light = ALL_TIME.bosses.find((x) => x.id === id);
  const detail = useBosses(light ? [id] : []);
  if (!light) return <div className="view"><div className="empty">No logs for this boss yet.</div></div>;
  if (!detail?.[id]) return <div className="view rr-loading muted">Loading…</div>;
  return <Boss b={{ ...light, ...detail[id] }} />;
}

function Boss({ b }) {
  const zone = zoneOf(b.zoneId);
  const kills = b.history;
  const avg = kills.length ? kills.reduce((t, k) => t + k.sec, 0) / kills.length : null;
  const wipes = b.attempts.filter((a) => !a.kill);
  const closest = wipes.reduce((m, a) => (a.bossPctLeft != null && (m == null || a.bossPctLeft < m.bossPctLeft) ? a : m), null);

  return (
    <div className="view rr">
      <Banner
        kind="history"
        accent={zone.color}
        art={[bossImg(b.id)]}
        kicker="Guild history · all time"
        title={`Moist vs ${b.name}`}
        sub={`${b.pulls} pulls over ${new Set(b.attempts.map((a) => a.night)).size} raids`}
        crumbs={[
          { label: "Raid logs", href: href("raids") },
          { label: zone.name, href: href("raid-zone", b.zoneId) },
          { label: b.name },
        ]}
        stats={[
          { value: b.kills, label: "kills" },
          { value: b.wipes, label: "wipes", className: b.wipes ? "rr-wipe-txt" : "" },
          { value: mmss(b.bestKillSec), label: "best kill", className: "rr-gold" },
          { value: mmss(avg && Math.round(avg)), label: "average kill" },
          { value: b.deaths, label: "deaths" },
        ]}
      />

      <Panel title="Every attempt" sub="kill time per pull, oldest first">
        <AttemptChart attempts={b.attempts} best={b.bestKillSec} />
      </Panel>

      <BossMechanicsAllTime b={b} />
      <BossParsesAllTime b={b} />

      <div className="stat-row rr-stat-row">
        <Tile value={b.pulls} label="Pulls" sub={`${mmss(b.timeSec)} spent fighting`} />
        <Tile value={(b.deaths / Math.max(1, b.pulls)).toFixed(1)} label="Deaths per pull" />
        <Tile value={b.bestKillNight ? fmtDate(b.bestKillNight, { day: "numeric", month: "short" }) : "-"} label="Record set" sub={b.bestKillNight && <a href={href("raids", b.bestKillNight)}>open that night</a>} />
        <Tile value={closest ? `${closest.bossPctLeft}%` : "-"} label="Closest wipe" sub={closest && fmtDate(closest.night)} />
      </div>

      <div className="grid-2">
        <Panel title="Boss slayers" sub="kills each raider was there for">
          <BarList rows={playerBars(b.raidersBy, 10)} />
        </Panel>
        <Panel title="What it hits us with" sub="killing blows on this boss">
          <BarList
            rows={ranked(b.killingBlows)
              .slice(0, 10)
              .map(([name, c]) => ({
                key: name,
                label: <span className="rr-inline-ic"><SpellIcon name={name} icons={ALL_TIME.icons} size={18} /> {name}</span>,
                value: c,
                color: "var(--text-2)",
              }))}
            empty="It has never killed anyone."
          />
        </Panel>
      </div>

      <div className="grid-2">
        <Panel title="Floor time" sub="deaths on this boss">
          <BarList rows={playerBars(b.deathsBy, 10, (name) => `${b.firstDeathsBy[name] || 0} times first to die`)} empty="Nobody has died here." />
        </Panel>
        <Panel title="Raids" sub="when we fought it">
          <div className="rr-night-list">
            {[...new Set(b.attempts.map((a) => a.night))].reverse().map((night) => {
              const tries = b.attempts.filter((a) => a.night === night);
              const kill = tries.find((a) => a.kill);
              return (
                <a key={night} className="rr-night-row rr-night-row-sm" href={href("raids", night, b.id)}>
                  <span className="muted">{fmtDate(night)}</span>
                  <span className="rr-pulls">
                    {tries.map((a, i) => (
                      <span key={i} className={`rr-pull ${a.kill ? "kill" : "wipe"}`}>{a.kill ? mmss(a.durationSec) : `${a.bossPctLeft ?? "?"}%`}</span>
                    ))}
                  </span>
                  <span className="rr-night-stats-sm">{kill && kill.durationSec === b.bestKillSec ? <span className="rr-chip gold">record</span> : null}</span>
                </a>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// One bar per pull, grouped by night: each night gets its own shaded band with
// the date underneath, so it reads as "night -> its attempts". Kills are gold
// (height = kill time, labelled when there's room), wipes red.
function AttemptChart({ attempts, best }) {
  const [tip, bind] = useTip();
  const W = 1000;
  const H = 230;
  const pad = { l: 44, r: 8, t: 22, b: 30 };
  const GAP = 14; // between nights
  const max = Math.max(60, ...attempts.map((a) => a.durationSec));
  const y = (sec) => pad.t + (1 - sec / max) * (H - pad.t - pad.b);
  const step = [30, 60, 120, 300, 600].find((st) => max / st <= 4) || 900;
  const ticks = [];
  for (let t = 0; t <= max; t += step) ticks.push(t);

  const nights = [];
  for (const a of attempts) {
    if (nights.at(-1)?.night !== a.night) nights.push({ night: a.night, tries: [] });
    nights.at(-1).tries.push(a);
  }
  // Every night gets an equal-width column; its pulls sit centred in it.
  const plotW = W - pad.l - pad.r;
  const colW = plotW / nights.length;
  const most = Math.max(...nights.map((g) => g.tries.length));
  const bw = Math.min(36, (colW - GAP) / most);
  const bands = nights.map((g, i) => {
    const w = g.tries.length * bw;
    return { ...g, col: pad.l + i * colW, x: pad.l + i * colW + (colW - w) / 2, w };
  });
  // Date under every column that has room; otherwise every few.
  const every = Math.max(1, Math.ceil(48 / colW));

  return (
    <div className="rr-timeline">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Kill time per attempt, grouped by raid">
        {bands.map((b, i) => (
          <rect key={b.night} x={b.col + 2} y={pad.t - 16} width={colW - 4} height={H - pad.t - pad.b + 16} rx="6" fill={i % 2 ? "var(--surface-2)" : "transparent"} opacity="0.7" />
        ))}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border-soft)" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="rr-axis">{mmss(t)}</text>
          </g>
        ))}
        {best != null && <line x1={pad.l} x2={W - pad.r} y1={y(best)} y2={y(best)} stroke="#d4af5a" strokeDasharray="4 4" opacity="0.6" />}
        {bands.map((b, bi) => (
          <g key={b.night}>
            {b.tries.map((a, i) => {
              const x = b.x + i * bw + 1.5;
              const w = Math.max(2, bw - 3);
              return (
                <g key={i} {...bind(
                  <>
                    <strong>{fmtDate(b.night)}</strong> <span className="muted">· pull {i + 1} of {b.tries.length}</span>
                    <div className="muted">{a.kill ? `Kill in ${mmss(a.durationSec)}` : `Wipe at ${a.bossPctLeft ?? "?"}% after ${mmss(a.durationSec)}`}</div>
                    <div className="muted">{a.deaths} deaths</div>
                  </>
                )}>
                  <rect x={x} y={pad.t} width={w} height={H - pad.t - pad.b} fill="transparent" />
                  <rect x={x} y={y(a.durationSec)} width={w} height={H - pad.b - y(a.durationSec)} rx="3" fill={a.kill ? "#d4af5a" : "#e0525f"} opacity={a.kill ? (a.durationSec === best ? 1 : 0.7) : 0.85} />
                  {a.kill && bw >= 26 && (
                    <text x={x + w / 2} y={y(a.durationSec) - 5} textAnchor="middle" className="rr-axis rr-bar-label-sm">{mmss(a.durationSec)}</text>
                  )}
                </g>
              );
            })}
            {bi % every === 0 && (
              <text x={b.col + colW / 2} y={H - 10} textAnchor="middle" className="rr-axis">
                {fmtDate(b.night, { day: "numeric", month: "short" })}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="rr-legend">
        <span><i style={{ background: "#d4af5a" }} /> Kill</span>
        <span><i style={{ background: "#e0525f" }} /> Wipe</span>
        <span><i style={{ background: "transparent", borderTop: "2px dashed #d4af5a", borderRadius: 0, height: 0 }} /> Best kill</span>
      </div>
      {tip}
    </div>
  );
}
