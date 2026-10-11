import { useEffect, useMemo, useRef, useState } from "react";
import { lazyJson } from "./lazyJson.js";
import { CLASS_OF } from "./data.js";
import { classColor, mmss } from "./assets.js";
import { Panel, Player, SpellIcon, Tabs } from "./components.jsx";

// Fight playback for one boss kill: a race of cumulative damage (or healing),
// the raid's output over time with a playhead, and a ticker of what happened.
// Data: src/raids/data/replays/<night>-<encounterId>.json, written by
// `npm run raids:replays`:
//   { durationSec, step, damage|healing: { players: [{ name, class, spec }],
//     series: [[amount per step], ...] }, events: [{ t, kind, player, text, icon }] }
const files = lazyJson(import.meta.glob("./data/replays/*.json", { query: "?url", import: "default", eager: true }));
const keyOf = (night, id) => `./data/replays/${night}-${id}.json`;
export const hasReplay = (night, id) => Boolean(files[keyOf(night, id)]);

const SPEEDS = [1, 4, 10, 30];
const TOP = 15;

export default function Replay({ n, b }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let live = true;
    files[keyOf(n.night, b.encounterId)]?.().then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, [n.night, b.encounterId]);
  if (!data) return <div className="muted rr-loading">Loading replay…</div>;
  return <Player_ data={data} icons={n.icons} />;
}

function Player_({ data, icons }) {
  const [metric, setMetric] = useState(data.damage ? "damage" : "healing");
  const [t, setT] = useState(0); // seconds into the fight
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(10);
  const dur = data.durationSec;

  // Cumulative totals per player per step, computed once per metric.
  const m = data[metric];
  const cum = useMemo(
    () =>
      m.series.map((s) => {
        let acc = 0;
        return s.map((v) => (acc += v));
      }),
    [m]
  );
  const raid = useMemo(() => {
    const steps = Math.max(...m.series.map((s) => s.length));
    return Array.from({ length: steps }, (_, i) => m.series.reduce((tot, s) => tot + (s[i] || 0), 0));
  }, [m]);

  // Playback clock.
  const last = useRef(null);
  useEffect(() => {
    if (!playing) return;
    let raf;
    const tick = (now) => {
      if (last.current != null) {
        const dt = ((now - last.current) / 1000) * speed;
        setT((x) => {
          const next = Math.min(dur, x + dt);
          if (next >= dur) setPlaying(false);
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
  }, [playing, speed, dur]);

  const idx = Math.min(Math.floor(t / data.step), Math.max(0, raid.length - 1));
  const rows = m.players
    .map((p, i) => {
      const total = cum[i][Math.min(idx, cum[i].length - 1)] || 0;
      const win = Math.max(1, Math.round(10 / data.step)); // "now" = last 10 seconds
      const recent = (cum[i][idx] || 0) - (cum[i][Math.max(0, idx - win)] || 0);
      return { ...p, total, perSec: t > 0 ? total / Math.max(1, t) : 0, now: recent / (win * data.step) };
    })
    .sort((a, c) => c.total - a.total);
  const top = rows.slice(0, TOP);
  const max = Math.max(1, top[0]?.total || 0);
  const raidTotal = rows.reduce((tot, r) => tot + r.total, 0);

  const toggle = () => {
    if (t >= dur) setT(0);
    setPlaying((p) => !p);
  };

  return (
    <div className="rr-replay">
      <Panel
        title={metric === "damage" ? "Damage race" : "Healing race"}
        right={
          <Tabs
            tabs={[data.damage && { key: "damage", label: "Damage" }, data.healing && { key: "healing", label: "Healing" }].filter(Boolean)}
            value={metric}
            onChange={setMetric}
          />
        }
      >
        <div className="rr-replay-controls">
          <button className="rr-play" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? "❚❚" : "►"}
          </button>
          <input
            type="range"
            min="0"
            max={dur}
            step="0.5"
            value={t}
            onChange={(e) => {
              setT(Number(e.target.value));
            }}
            aria-label="Fight time"
          />
          <span className="rr-replay-time">{mmss(t)} / {mmss(dur)}</span>
          <span className="rr-replay-speeds">
            {SPEEDS.map((s) => (
              <button key={s} className={`rr-speed${speed === s ? " active" : ""}`} onClick={() => setSpeed(s)}>
                {s}×
              </button>
            ))}
          </span>
        </div>

        <div className="rr-race" style={{ height: TOP * 30 }}>
          {top.map((r, rank) => (
            <div key={r.name} className="rr-race-row" style={{ transform: `translateY(${rank * 30}px)` }}>
              <span className="rr-race-rank">{rank + 1}</span>
              <div className="rr-race-track">
                <div className="rr-race-fill" style={{ width: `${(r.total / max) * 100}%`, background: classColor(r.class || CLASS_OF.get(r.name)) }} />
                <span className="rr-race-name">
                  <Player name={r.name} cls={r.class || CLASS_OF.get(r.name)} spec={r.spec} size={16} link={false} />
                </span>
              </div>
              <span className="rr-race-val">
                <b>{fmtK(r.total)}</b>
                <span className="muted">{fmtK(r.perSec)}/s</span>
              </span>
            </div>
          ))}
        </div>
        <div className="rr-replay-foot muted">
          Raid {metric === "damage" ? "damage" : "healing"}: <b>{fmtK(raidTotal)}</b> · {fmtK(t > 0 ? raidTotal / t : 0)}/s
        </div>
      </Panel>

      <EventTimeline events={data.events || []} dur={dur} t={t} onSeek={setT} />

      <div className="rr-replay-grid">
        <Panel title={`Raid ${metric === "damage" ? "DPS" : "HPS"}`} sub="over the fight · skulls are deaths">
          <OutputChart raid={raid} step={data.step} dur={dur} t={t} deaths={(data.events || []).filter((e) => e.kind === "death")} onSeek={setT} />
        </Panel>
        <Panel title="What's happening" sub="the last few moments">
          <Ticker events={data.events || []} t={t} icons={icons} />
        </Panel>
      </div>
    </div>
  );
}

function OutputChart({ raid, step, dur, t, deaths, onSeek }) {
  const W = 600;
  const H = 180;
  const pad = { l: 8, r: 8, t: 10, b: 20 };
  const perSec = raid.map((v) => v / step);
  const max = Math.max(1, ...perSec);
  const x = (s) => pad.l + (s / dur) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const pts = perSec.map((v, i) => `${x(i * step)},${y(v)}`).join(" ");
  return (
    <div className="rr-timeline">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Raid output over time"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          onSeek(Math.max(0, Math.min(dur, (((e.clientX - r.left) / r.width) * W - pad.l) / (W - pad.l - pad.r) * dur)));
        }}
        style={{ cursor: "pointer" }}
      >
        <polygon points={`${x(0)},${y(0)} ${pts} ${x((perSec.length - 1) * step)},${y(0)}`} fill="rgba(212, 175, 90, 0.15)" />
        <polyline points={pts} fill="none" stroke="var(--gold)" strokeWidth="1.5" />
        {deaths.map((d, i) => (
          <text key={i} x={x(d.t)} y={H - 6} textAnchor="middle" fontSize="11" opacity={d.t <= t ? 1 : 0.3}>☠</text>
        ))}
        <line x1={x(t)} x2={x(t)} y1={pad.t} y2={H - pad.b} stroke="var(--text)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function Ticker({ events, t, icons }) {
  const recent = events.filter((e) => e.t <= t).slice(-7).reverse();
  if (!recent.length) return <div className="muted rr-empty-sm">Press play.</div>;
  return (
    <ol className="rr-ticker">
      {recent.map((e, i) => (
        <li key={`${e.t}-${i}`} className={`rr-tick rr-tick-${e.kind}`}>
          <span className="rr-tick-t">{mmss(e.t)}</span>
          <SpellIcon name={e.icon || e.text} icons={icons} size={18} />
          <span>
            {e.player && <Player name={e.player} cls={CLASS_OF.get(e.player)} size={14} link={false} />} <span className="muted">{e.text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

const fmtK = (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}k` : `${Math.round(v)}`);

// Fight story: every tracked event on one scrubable timeline, synced to the
// same playhead as the race. Deaths on the top lane, bad mechanics in the
// middle, good plays and neutral mechanics at the bottom. No new data needed:
// replay files already carry timestamped events.
const LANES = [
  { key: "death", label: "Deaths", kinds: ["death"], color: "#f08791" },
  { key: "bad", label: "Bad", kinds: ["bad"], color: "#e0525f" },
  { key: "good", label: "Good & info", kinds: ["good", "info"], color: "#d4af5a" },
];

function EventTimeline({ events, dur, t, onSeek }) {
  const [filter, setFilter] = useState("all");
  const counts = {};
  for (const e of events) counts[e.kind] = (counts[e.kind] || 0) + 1;
  const lanes = LANES.map((l) => ({ ...l, list: events.filter((e) => l.kinds.includes(e.kind)) })).filter(
    (l) => filter === "all" || l.key === filter
  );
  const shown = lanes.flatMap((l) => l.list);
  if (!events.length) return null;
  const reduced = useMemo(
    () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
  // The most recent event at or behind the playhead gets an expanding ring.
  const latest = shown.reduce((m, e) => (e.t <= t && (!m || e.t > m.t) ? e : m), null);
  const latestAge = latest ? t - latest.t : Infinity;
  const ringLane = latest ? lanes.findIndex((l) => l.list.includes(latest)) : -1;
  const W = 1000;
  const laneH = 30;
  const pad = { l: 96, r: 12, t: 24, b: 22 };
  const H = pad.t + lanes.length * laneH + pad.b;
  const x = (s) => pad.l + (s / Math.max(1, dur)) * (W - pad.l - pad.r);
  const r = shown.length > 200 ? 2.5 : 4;
  const tabs = [{ key: "all", label: `All (${events.length})` }].concat(
    LANES.filter((l) => events.some((e) => l.kinds.includes(e.kind))).map((l) => ({
      key: l.key,
      label: `${l.label} (${l.kinds.reduce((n, k) => n + (counts[k] || 0), 0)})`,
    }))
  );
  return (
    <Panel
      title="Fight story"
      sub="every death and tracked mechanic · click to jump · hover a dot"
      right={<Tabs tabs={tabs} value={filter} onChange={setFilter} />}
    >
      <div className="rr-timeline">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Fight events over time"
          onClick={(e) => {
            const b = e.currentTarget.getBoundingClientRect();
            onSeek(Math.max(0, Math.min(dur, (((e.clientX - b.left) / b.width) * W - pad.l) / (W - pad.l - pad.r) * dur)));
          }}
          style={{ cursor: "pointer" }}
        >
          {lanes.map((l, li) => (
            <g key={l.key}>
              <text x={pad.l - 8} y={pad.t + li * laneH + laneH / 2 + 4} textAnchor="end" className="rr-axis">{l.label}</text>
              <line x1={pad.l} x2={W - pad.r} y1={pad.t + li * laneH + laneH / 2} y2={pad.t + li * laneH + laneH / 2} stroke="var(--border-soft)" />
              {l.list.map((e, i) => {
                const age = t - e.t;
                const cy = pad.t + li * laneH + laneH / 2;
                if (e.kind === "death") {
                  // Skulls drop in from above in the moment they happen.
                  const drop = !reduced && age >= 0 && age < 0.8 ? -9 * (1 - age / 0.8) : 0;
                  return (
                    <text
                      key={`${e.t}-${i}`}
                      x={x(e.t)}
                      y={cy + 4}
                      textAnchor="middle"
                      fontSize="12"
                      opacity={age < 0 ? 0.3 : 1}
                      style={drop ? { transform: `translateY(${drop.toFixed(1)}px)` } : undefined}
                    >
                      ☠<title>{`${mmss(e.t)} · ${e.player || "?"} died · ${e.text}`}</title>
                    </text>
                  );
                }
                return (
                  <circle
                    key={`${e.t}-${i}`}
                    cx={x(e.t)}
                    cy={cy}
                    r={r}
                    fill={e.kind === "good" ? "#d4af5a" : e.kind === "bad" ? "#e0525f" : "var(--text-2)"}
                    opacity={age < 0 ? 0.3 : 0.9}
                  >
                    <title>{`${mmss(e.t)} · ${e.player ? `${e.player} · ` : ""}${e.text}`}</title>
                  </circle>
                );
              })}
            </g>
          ))}
          {!reduced && latest && latestAge < 1.2 && ringLane >= 0 && (
            <circle
              cx={x(latest.t)}
              cy={pad.t + ringLane * laneH + laneH / 2}
              r={5 + latestAge * 16}
              fill="none"
              stroke={latest.kind === "death" ? "#f08791" : latest.kind === "bad" ? "#e0525f" : "#d4af5a"}
              strokeWidth="2"
              opacity={0.55 * (1 - latestAge / 1.2)}
            />
          )}
          <line x1={x(t)} x2={x(t)} y1={pad.t - 2} y2={H - pad.b} stroke="var(--text)" strokeWidth="1.5" style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.45))" }} />
          <text
            x={Math.max(pad.l + 26, Math.min(W - pad.r - 26, x(t)))}
            y={11}
            textAnchor="middle"
            className="rr-axis rr-story-bubble"
          >
            {mmss(t)}
          </text>
          <text x={pad.l} y={H - 6} textAnchor="start" className="rr-axis">0</text>
          <text x={W - pad.r} y={H - 6} textAnchor="end" className="rr-axis">{mmss(dur)}</text>
        </svg>
      </div>
    </Panel>
  );
}
