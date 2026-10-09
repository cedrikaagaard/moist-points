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
