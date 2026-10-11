import { useEffect, useRef, useState } from "react";
import { bossImg, classColor, fmtDate, mmss, zoneOf } from "./assets.js";
import { Player, useTip } from "./components.jsx";
import { href } from "../router.js";

const KILL = "#d4af5a"; // gold - validated against WIPE for colour-blind separation
const WIPE = "#e0525f";

// ---------- The night at a glance ----------
// Every boss pull as a bar on one time axis (gold = kill, red = wipe, labelled
// with the boss portrait), and every death as a dot stacked above the moment it
// happened, in the player's class colour. "Relive the night" sweeps a playhead
// across the evening: pulls light up as they happen, the rest stays dimmed.
export function NightTimeline({ n }) {
  const [tip, bind] = useTip();
  const [t, setT] = useState(null); // null = overview; seconds into the night while reliving
  const [playing, setPlaying] = useState(false);
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

  // Relive clock: the whole evening in about two minutes.
  const SPEED = 60;
  const last = useRef(null);
  useEffect(() => {
    if (!playing) return;
    let raf;
    const tick = (now) => {
      if (last.current != null) {
        const dt = ((now - last.current) / 1000) * SPEED;
        setT((x) => {
          const next = Math.min(end, (x ?? 0) + dt);
          if (next >= end) setPlaying(false);
          return next;
        });
      }
      last.current = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      last.current = null;
    };
  }, [playing, end]);
  const live = t != null;
  const nowPull = live ? pulls.find((p) => t >= p.at && t <= p.at + p.durationSec) : null;
  const toggle = () => {
    if (playing) return setPlaying(false);
    if (t == null || t >= end) setT(0);
    setPlaying(true);
  };

  return (
    <div className="rr-timeline rr-scroll">
      <div className="rr-relive">
        <button className="rr-play" onClick={toggle} aria-label={playing ? "Pause" : "Relive the night"}>
          {playing ? "❚❚" : "►"}
        </button>
        <span className="rr-relive-label muted">
          {live ? (nowPull ? `${nowPull.boss.name} · ${mmss(t)}` : `Break · ${mmss(t)}`) : "Relive the night"}
        </span>
        {live && (
          <button className="link-btn" onClick={() => { setPlaying(false); setT(null); }}>
            Back to overview
          </button>
        )}
      </div>
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
              opacity={!live || d.at <= t ? 1 : 0.12}
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
            opacity={!live || p.at <= t ? 1 : 0.2}
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
            opacity={!live ? 1 : p.at + p.durationSec <= t ? 1 : p.at > t ? 0.18 : 0.55}
            {...bind(<PullTip p={p} />)}
          />
        ))}
        <line x1={x(0)} x2={x(end)} y1={barY + barH / 2} y2={barY + barH / 2} stroke="var(--border-soft)" strokeWidth="1" />
        {live && (
          <line x1={x(t)} x2={x(t)} y1={8} y2={axisY} stroke="var(--text)" strokeWidth="1.5" style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.45))" }} />
        )}
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

// ---------- Scroll-into-view ----------
// Reveal-once hook for growing charts in as they enter the viewport. Returns
// [ref, seen]. Respects reduced-motion (content just appears) and non-visual
// environments (seen immediately). Shared by the animated charts below.
export function useInView() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return setSeen(true);
    if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) return setSeen(true);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen];
}

// ---------- Raid pace ----------
// Boss kills per week for the last 26 weeks: how much raiding the guild
// actually does. Bars grow in on scroll; the best week is solid gold.
export function RaidPace({ nights }) {
  const [tip, bind] = useTip();
  const [ref, seen] = useInView();
  const W = 1000;
  const H = 200;
  const pad = { l: 34, r: 12, t: 12, b: 26 };
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const weeks = Array.from({ length: 26 }, (_, i) => {
    const start = new Date(monday);
    start.setDate(start.getDate() - (25 - i) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const list = (nights || []).filter((n) => {
      const d = n.night.slice(0, 10);
      return d >= key(start) && d < key(end);
    });
    return { start, list, kills: list.reduce((t, n) => t + (n.totals?.kills || 0), 0) };
  });
  const max = Math.max(1, ...weeks.map((w) => w.kills));
  const bw = (W - pad.l - pad.r) / weeks.length;
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  let best = 0;
  weeks.forEach((w, i) => {
    if (w.kills > weeks[best].kills) best = i;
  });
  let lastMonth = "";
  return (
    <div className="rr-timeline" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Boss kills per week">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={y(max * f)} y2={y(max * f)} stroke="var(--border-soft)" />
            <text x={pad.l - 6} y={y(max * f) + 4} textAnchor="end" className="rr-axis">{Math.round(max * f)}</text>
          </g>
        ))}
        {weeks.map((w, i) => {
          const h = H - pad.b - y(w.kills);
          const label = w.start.toLocaleDateString("en-GB", { month: "short" });
          const showLabel = label !== lastMonth;
          lastMonth = label;
          return (
            <g key={i} {...bind(<WeekTip w={w} />)}>
              <rect x={pad.l} y={pad.t} width={bw} height={H - pad.t - pad.b} fill="transparent" />
              {w.kills > 0 ? (
                <rect
                  x={pad.l + i * bw + 2}
                  y={y(w.kills)}
                  width={Math.max(2, bw - 4)}
                  height={Math.max(1, h)}
                  rx="3"
                  fill="#d4af5a"
                  opacity={i === best ? 1 : 0.55}
                  style={{
                    transform: seen ? undefined : "scaleY(0)",
                    transformOrigin: "bottom",
                    transformBox: "fill-box",
                    transition: `transform 0.45s ease ${i * 25}ms`,
                  }}
                />
              ) : (
                <line
                  x1={pad.l + i * bw + 3}
                  x2={pad.l + (i + 1) * bw - 3}
                  y1={H - pad.b}
                  y2={H - pad.b}
                  stroke="var(--border-soft)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
              {showLabel && <text x={pad.l + i * bw} y={H - 8} className="rr-axis">{label}</text>}
            </g>
          );
        })}
      </svg>
      <div className="rr-legend">
        <span><i style={{ background: "#d4af5a" }} /> Kills per week · solid = best ({weeks[best].kills})</span>
      </div>
      {tip}
    </div>
  );
}

function WeekTip({ w }) {
  const end = new Date(w.start);
  end.setDate(end.getDate() + 6);
  const range = `${w.start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
  return (
    <>
      <strong>{range}</strong> <span className="muted">· {w.kills} kills</span>
      {w.list.map((n) => (
        <div key={n.night} className="muted">
          {fmtDate(n.night, { day: "numeric", month: "short" })} · {n.zoneIds.map((z) => zoneOf(z).short).join(" + ")} · {n.totals.kills} kills{n.totals.wipes ? ` · ${n.totals.wipes} wipes` : ""}
        </div>
      ))}
      {!w.list.length && <div className="muted">No raids this week</div>}
    </>
  );
}

// ---------- Kill-time trend ----------
// Kill durations over time for one boss; lower is better, the best is ringed.
// ---------- Density ----------
// Charts thin out as the history grows: past a few dozen raids, every point
// as a dot just merges into a smear. Then draw a faint raw line, a rolling
// median for the trend, and dots only where they mean something (record,
// best, latest). Hover still reaches every point through invisible columns.
export function rollingMedian(vals, k = 5) {
  return vals.map((_, i) => {
    const w = vals.slice(Math.max(0, i - (k >> 1)), i + (k >> 1) + 1).sort((a, b) => a - b);
    return w[w.length >> 1];
  });
}
// One invisible hover target per point: a full-height column around it.
export function HoverColumns({ xs, top, bottom, tipFor, bind, hrefFor }) {
  return xs.map((x, i) => {
    const l = i ? (xs[i - 1] + x) / 2 : x - (xs[1] - x || 10) / 2;
    const r = i < xs.length - 1 ? (x + xs[i + 1]) / 2 : x + (x - xs[i - 1] || 10) / 2;
    const rect = <rect x={l} y={top} width={Math.max(1, r - l)} height={bottom - top} fill="transparent" {...bind(tipFor(i))} />;
    return hrefFor ? <a key={i} href={hrefFor(i)}>{rect}</a> : <g key={i}>{rect}</g>;
  });
}

// Kill times over time for one boss. Faster is lower, like every time chart.
export function KillSparkline({ history, best }) {
  const [tip, bind] = useTip();
  if (history.length < 2) return <span className="muted rr-spark-none">-</span>;
  const W = 120;
  const H = 28;
  const max = Math.max(...history.map((h) => h.sec));
  const min = Math.min(...history.map((h) => h.sec));
  const span = Math.max(1, max - min);
  const pts = history.map((h, i) => [4 + (i / (history.length - 1)) * (W - 8), 4 + ((max - h.sec) / span) * (H - 8), h]);
  const dense = history.length > 12;
  return (
    <span className="rr-spark">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Kill time trend, faster is lower">
        <polyline points={pts.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke="var(--text-2)" strokeWidth={dense ? 1 : 1.5} opacity={dense ? 0.7 : 1} />
        {pts.map(([x, y, h], i) =>
          !dense || h.sec === best || i === pts.length - 1 ? (
            <circle key={h.night} cx={x} cy={y} r={h.sec === best ? 3.5 : 2.5} fill={h.sec === best ? KILL : "var(--text-2)"} />
          ) : null
        )}
        <HoverColumns xs={pts.map((p) => p[0])} top={0} bottom={H} bind={bind} tipFor={(i) => <>{fmtDate(pts[i][2].night)} · {mmss(pts[i][2].sec)}</>} />
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
  const rows = nights.filter((n) => n.zoneTimes?.[zoneId]).slice().sort((a, b) => (a.start || a.night).localeCompare(b.start || b.night));
  if (rows.length < 2) return <div className="muted rr-empty-sm">Needs a couple of raids to show a trend.</div>;
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
  const dense = pts.length > (compact ? 14 : 30);
  const med = dense ? rollingMedian(secs) : null;
  const tipFor = (i) => {
    const p = pts[i];
    return (
      <>
        <strong>{fmtDate(p.n.night)}</strong>
        <div className="muted">{mmss(p.t.sec)} · {p.t.kills}/{full} bosses</div>
        {p.record && <div className="rr-gold">New record</div>}
      </>
    );
  };
  return (
    <div className="rr-timeline">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Clear time per raid, faster is lower">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border-soft)" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="rr-axis">{mmss(t)}</text>
          </g>
        ))}
        <polyline points={pts.map((p, i) => `${x(i)},${y(p.t.sec)}`).join(" ")} fill="none" stroke="var(--text-2)" strokeWidth={dense ? 1 : 1.5} opacity={dense ? 0.3 : 0.5} />
        {dense && <polyline points={med.map((s, i) => `${x(i)},${y(s)}`).join(" ")} fill="none" stroke="var(--text-2)" strokeWidth="2.5" strokeLinejoin="round" />}
        {steps.length > 1 && <polyline points={steps.map((s) => s.join(",")).join(" ")} fill="none" stroke="#d4af5a" strokeWidth="2.5" />}
        {dense && <HoverColumns xs={pts.map((_, i) => x(i))} top={pad.t} bottom={H - pad.b} bind={bind} tipFor={tipFor} hrefFor={(i) => href("raids", pts[i].n.night)} />}
        {dense &&
          pts.map((p, i) =>
            p.record || i === pts.length - 1 ? (
              <circle key={p.n.night} cx={x(i)} cy={y(p.t.sec)} r={p.record ? 6 : 5} fill={p.record ? "#d4af5a" : "var(--surface-1)"} stroke={p.record ? "var(--surface-1)" : "var(--text)"} strokeWidth="2" pointerEvents="none" />
            ) : null
          )}
        {!dense && pts.map((p, i) => (
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
          {dense ? (
            <>
              <span><i style={{ background: "var(--text-2)", height: 3, borderRadius: 0 }} /> Typical (median of 5 raids)</span>
              <span><i style={{ background: "#d4af5a", borderRadius: "50%" }} /> New record</span>
            </>
          ) : (
            <>
              <span><i style={{ background: "#d4af5a", borderRadius: "50%" }} /> Full clear</span>
              <span><i style={{ border: "2px solid var(--text-2)", borderRadius: "50%", background: "transparent" }} /> Partial raid</span>
            </>
          )}
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
