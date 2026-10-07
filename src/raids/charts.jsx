import { bossImg, classColor, fmtDate, mmss, zoneOf } from "./assets.js";
import { Player, useTip } from "./components.jsx";
import { href } from "../router.js";

const KILL = "#d4af5a"; // gold - validated against WIPE for colour-blind separation
const WIPE = "#e0525f";

// ---------- The night at a glance ----------
// Every boss pull as a bar on one time axis (gold = kill, red = wipe, labelled
// with the boss portrait), and every death as a dot stacked above the moment it
// happened, in the player's class colour.
export function NightTimeline({ n }) {
  const [tip, bind] = useTip();
  const W = 1000;
  const end = Math.max(60, n.durationMin * 60, ...n.deaths.map((d) => d.at));
  const x = (s) => 16 + (s / end) * (W - 32);

  const pulls = n.bosses
    .flatMap((b) => b.pulls.map((p, i) => ({ ...p, boss: b, attempt: i + 1 })))
    .sort((a, b) => a.at - b.at);

  // Stack deaths into time buckets so wipes rise into towers. A bucket is at
  // least a dot wide on screen, so neighbouring towers never overlap.
  const R = 5.5;
  const BUCKET = Math.max(30, Math.ceil((end * (2 * R + 2)) / (W - 32)));
  const stacks = new Map();
  const dots = n.deaths.map((d) => {
    const k = Math.floor(d.at / BUCKET);
    const h = stacks.get(k) || 0;
    stacks.set(k, h + 1);
    return { d, cx: x(k * BUCKET + BUCKET / 2), level: h };
  });
  const tallest = Math.max(1, ...stacks.values());
  const STEP = 2 * R + 1;
  const deathH = Math.min(tallest, 18) * STEP + 8;

  const ICON = 26;
  const top = deathH + 8;
  const barY = top + ICON + 10;
  const barH = 18;
  const axisY = barY + barH + 18;
  const H = axisY + 8;

  // Boss portraits over kills; nudge into a second row when they'd overlap.
  let lastIconX = -Infinity;
  let row = 0;
  const kills = pulls
    .filter((p) => p.kill)
    .map((p) => {
      const cx = x(p.at + p.durationSec / 2);
      row = cx - lastIconX < ICON + 2 ? 1 - row : 0;
      if (row === 0) lastIconX = cx;
      return { p, cx, row };
    });

  const ticks = [];
  for (let t = 0; t <= end; t += 1800) ticks.push(t);

  return (
    <div className="rr-timeline rr-scroll">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Timeline of boss pulls and deaths">
        {/* death towers */}
        {dots.map(({ d, cx, level }, i) =>
          level < 18 ? (
            <circle
              key={i}
              cx={cx}
              cy={deathH - R - level * STEP}
              r={R}
              fill={classColor(d.class)}
              stroke="var(--surface-1)"
              strokeWidth="1.5"
              className="rr-dot"
              {...bind(
                <>
                  <Player name={d.player} cls={d.class} link={false} />
                  <div className="muted">
                    {d.killingBlow || "Unknown"}
                    {d.killer && d.killer.name !== d.killingBlow ? ` · ${d.killer.name}` : ""}
                  </div>
                  <div className="muted">{d.boss || "Trash"} · {mmss(d.at)} in</div>
                </>
              )}
            />
          ) : null
        )}
        {/* portraits */}
        {kills.map(({ p, cx, row }) => (
          <image
            key={`i${p.at}`}
            href={bossImg(p.boss.encounterId)}
            x={cx - ICON / 2 + (row ? ICON * 0.55 : 0)}
            y={top + (row ? -ICON * 0.35 : 0)}
            width={ICON}
            height={ICON}
            className="rr-tl-boss"
            {...bind(<PullTip p={p} />)}
          />
        ))}
        {/* pulls */}
        {pulls.map((p) => (
          <rect
            key={`p${p.at}`}
            x={x(p.at)}
            y={barY}
            width={Math.max(3, x(p.at + p.durationSec) - x(p.at))}
            height={barH}
            rx="3"
            fill={p.kill ? KILL : WIPE}
            {...bind(<PullTip p={p} />)}
          />
        ))}
        <line x1={x(0)} x2={x(end)} y1={barY + barH / 2} y2={barY + barH / 2} stroke="var(--border-soft)" strokeWidth="1" />
        {ticks.map((t) => (
          <text key={t} x={x(t)} y={axisY} className="rr-axis" textAnchor="middle">
            {t === 0 ? "start" : `${Math.floor(t / 3600)}:${String((t % 3600) / 60).padStart(2, "0")}`}
          </text>
        ))}
      </svg>
      <div className="rr-legend">
        <span><i style={{ background: KILL }} /> Kill</span>
        <span><i style={{ background: WIPE }} /> Wipe</span>
        <span><i className="dot" /> Death (class colour)</span>
      </div>
      {tip}
    </div>
  );
}

function PullTip({ p }) {
  return (
    <>
      <strong>{p.boss.name}</strong>
      <div className="muted">
        {p.kill ? "Kill" : `Wipe at ${p.bossPctLeft ?? "?"}%`} · attempt {p.attempt} · {mmss(p.durationSec)}
      </div>
      <div className="muted">{p.deaths} death{p.deaths === 1 ? "" : "s"}</div>
    </>
  );
}

// ---------- Activity calendar ----------
// One square per day for the logged period, filled with the colour of the zone
// raided that night (two zones = split square). Click a night to open it.
export function ActivityCalendar({ nights }) {
  const [tip, bind] = useTip();
  if (!nights.length) return null;
  const byDate = new Map(nights.map((n) => [n.night, n]));
  const first = new Date(`${nights.at(-1).night}T12:00:00`);
  const last = new Date(`${nights[0].night}T12:00:00`);
  const start = new Date(first);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // back to Monday

  const weeks = [];
  for (let d = new Date(start); d <= last; d.setDate(d.getDate() + 1)) {
    const wi = Math.floor((d - start) / (7 * 864e5));
    (weeks[wi] ||= []).push(d.toISOString().slice(0, 10));
  }
  const C = 16;
  const G = 3;
  const zonesSeen = [...new Set(nights.flatMap((n) => n.zoneIds))];

  return (
    <div className="rr-cal">
      <svg viewBox={`0 0 ${30 + weeks.length * (C + G)} ${7 * (C + G) + 4}`} role="img" aria-label="Raid nights calendar">
        {["Mon", "", "Wed", "", "Fri", "", "Sun"].map((l, i) => (
          <text key={i} x="0" y={i * (C + G) + C - 4} className="rr-axis">{l}</text>
        ))}
        {weeks.map((days, wi) =>
          days.map((day, di) => {
            const n = byDate.get(day);
            const X = 30 + wi * (C + G);
            const Y = di * (C + G);
            if (!n) return <rect key={day} x={X} y={Y} width={C} height={C} rx="3" className="rr-cal-empty" />;
            const zs = n.zoneIds.length ? n.zoneIds : [0];
            return (
              <a key={day} href={href("raids", day)} {...bind(<CalTip n={n} />)}>
                {zs.map((z, i) => (
                  <rect key={z} x={X + (i * C) / zs.length} y={Y} width={C / zs.length} height={C} rx="3" fill={zoneOf(z).color} />
                ))}
              </a>
            );
          })
        )}
      </svg>
      <div className="rr-legend">
        {zonesSeen.map((z) => (
          <span key={z}><i style={{ background: zoneOf(z).color }} /> {zoneOf(z).short}</span>
        ))}
      </div>
      {tip}
    </div>
  );
}

function CalTip({ n }) {
  return (
    <>
      <strong>{fmtDate(n.night)}</strong>
      <div className="muted">{n.zoneIds.map((z) => zoneOf(z).short).join(" + ")}</div>
      <div className="muted">{n.totals.kills} kills · {n.totals.wipes} wipes · {n.totals.deaths} deaths</div>
    </>
  );
}

// ---------- Kill-time trend ----------
// Kill durations over time for one boss; lower is better, the best is ringed.
export function KillSparkline({ history, best }) {
  const [tip, bind] = useTip();
  if (history.length < 2) return <span className="muted rr-spark-none">-</span>;
  const W = 120;
  const H = 28;
  const max = Math.max(...history.map((h) => h.sec));
  const min = Math.min(...history.map((h) => h.sec));
  const span = Math.max(1, max - min);
  const pts = history.map((h, i) => [4 + (i / (history.length - 1)) * (W - 8), 4 + ((h.sec - min) / span) * (H - 8), h]);
  return (
    <span className="rr-spark">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Kill time trend">
        <polyline points={pts.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke="var(--text-2)" strokeWidth="1.5" />
        {pts.map(([x, y, h]) => (
          <circle
            key={h.night}
            cx={x}
            cy={y}
            r={h.sec === best ? 3.5 : 2}
            fill={h.sec === best ? KILL : "var(--text-2)"}
            {...bind(<>{fmtDate(h.night)} · {mmss(h.sec)}</>)}
          />
        ))}
      </svg>
      {tip}
    </span>
  );
}

// ---------- Clear-time development ----------
// One point per night in a raid (first pull to last boss). Full clears are gold
// dots, partial nights hollow; the gold step line is the record so far, so every
// drop is a new guild best. Compact mode drops the axes for small multiples.
export function ClearTrend({ nights, zoneId, compact = false }) {
  const [tip, bind] = useTip();
  const rows = nights.filter((n) => n.zoneTimes?.[zoneId]).slice().sort((a, b) => a.night.localeCompare(b.night));
  if (rows.length < 2) return <div className="muted rr-empty-sm">Needs a couple of nights to show a trend.</div>;
  const full = Math.max(...rows.map((n) => n.zoneTimes[zoneId].kills));
  const pts = rows.map((n) => ({ n, t: n.zoneTimes[zoneId], full: n.zoneTimes[zoneId].kills === full }));

  const W = 1000;
  const H = compact ? 150 : 240;
  const pad = compact ? { l: 8, r: 8, t: 12, b: 12 } : { l: 52, r: 12, t: 14, b: 30 };
  const secs = pts.map((p) => p.t.sec);
  const lo = Math.min(...secs) * 0.92;
  const hi = Math.max(...secs) * 1.04;
  const x = (i) => pad.l + (i / (pts.length - 1)) * (W - pad.l - pad.r);
  const y = (s) => pad.t + ((hi - s) / (hi - lo)) * (H - pad.t - pad.b);

  // Record progression over full clears only.
  let best = Infinity;
  const steps = [];
  pts.forEach((p, i) => {
    if (!p.full) return;
    if (p.t.sec < best) {
      if (steps.length) steps.push([x(i), y(best)]);
      best = p.t.sec;
      steps.push([x(i), y(best)]);
      p.record = true;
    }
  });
  if (steps.length) steps.push([x(pts.length - 1), y(best)]);

  const ticks = compact ? [] : niceTicks(lo, hi);
  return (
    <div className="rr-timeline">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Clear time per night">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border-soft)" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="rr-axis">{mmss(t)}</text>
          </g>
        ))}
        <polyline points={pts.map((p, i) => `${x(i)},${y(p.t.sec)}`).join(" ")} fill="none" stroke="var(--text-2)" strokeWidth="1.5" opacity="0.5" />
        {steps.length > 1 && <polyline points={steps.map((s) => s.join(",")).join(" ")} fill="none" stroke="#d4af5a" strokeWidth="2.5" />}
        {pts.map((p, i) => (
          <a key={p.n.night} href={href("raids", p.n.night)} {...bind(
            <>
              <strong>{fmtDate(p.n.night)}</strong>
              <div className="muted">{mmss(p.t.sec)} · {p.t.kills}/{full} bosses</div>
              {p.record && <div className="rr-gold">New record</div>}
            </>
          )}>
            <circle cx={x(i)} cy={y(p.t.sec)} r="14" fill="transparent" />
            <circle
              cx={x(i)}
              cy={y(p.t.sec)}
              r={p.record ? 7 : 5}
              fill={p.full ? "#d4af5a" : "var(--surface-1)"}
              stroke={p.full ? "var(--surface-1)" : "var(--text-2)"}
              strokeWidth="2"
            />
          </a>
        ))}
        {!compact &&
          pts.map((p, i) =>
            pts.length <= 14 || i % Math.ceil(pts.length / 12) === 0 ? (
              <text key={`d${i}`} x={x(i)} y={H - 8} textAnchor="middle" className="rr-axis">
                {fmtDate(p.n.night, { day: "numeric", month: "short" })}
              </text>
            ) : null
          )}
      </svg>
      {!compact && (
        <div className="rr-legend">
          <span><i style={{ background: "#d4af5a", borderRadius: "50%" }} /> Full clear</span>
          <span><i style={{ border: "2px solid var(--text-2)", borderRadius: "50%", background: "transparent" }} /> Partial night</span>
          <span><i style={{ background: "#d4af5a", height: 3, borderRadius: 0 }} /> Record so far</span>
        </div>
      )}
      {tip}
    </div>
  );
}

function niceTicks(lo, hi) {
  const span = hi - lo;
  const step = [60, 120, 300, 600, 900, 1800].find((s) => span / s <= 5) || 3600;
  const out = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) out.push(t);
  return out;
}
