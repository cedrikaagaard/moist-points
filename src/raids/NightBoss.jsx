import { ALL_TIME, CLASS_OF, useNight } from "./data.js";
import { bossImg, classColor, fmtDate, mmss, zoneOf } from "./assets.js";
import { zoneForEncounter, nightZones } from "./aggregate.js";
import { Banner, Panel, Player, SpellIcon, useTip } from "./components.jsx";
import { useState } from "react";
import { NightMechanics, NightFightWork } from "./MechanicsView.jsx";
import Replay, { hasReplay } from "./Replay.jsx";
import Analysis from "./Analysis.jsx";
import { PageTabs } from "./components.jsx";
import { href } from "../router.js";

// #/raids/<night>/<boss> - ONE boss on ONE night: what happened on each pull.
// The only all-time element is a single compact comparison line, which links
// out to the boss's guild-history page for the rest.
export default function NightBossPage({ night, bossId }) {
  const { night: n, error } = useNight(night);
  if (error) return <div className="view"><div className="empty">No raid logged for {night}.</div></div>;
  if (!n || n.night !== night) return <div className="view rr-loading muted">Loading…</div>;
  const b = n.bosses.find((x) => x.encounterId === bossId);
  if (!b) return <div className="view"><div className="empty">That boss wasn't pulled on {fmtDate(night)}.</div></div>;
  return <NightBoss key={`${night}-${bossId}`} n={n} b={b} />;
}

function NightBoss({ n, b }) {
  const zone = zoneOf(zoneForEncounter(b.encounterId));
  const zones = nightZones(n);
  const i = n.bosses.indexOf(b);
  const prev = n.bosses[i - 1];
  const next = n.bosses[i + 1];
  const classOf = new Map(n.raiders.map((r) => [r.name, r.class]));
  const specOf = new Map(n.raiders.map((r) => [r.name, r.spec]));
  const NP = ({ name, size }) => <Player name={name} cls={classOf.get(name) || CLASS_OF.get(name)} spec={specOf.get(name)} size={size} />;

  // Deaths per pull, by time window (night deaths carry the boss name + time).
  const pulls = b.pulls.map((p, idx) => ({
    ...p,
    n: idx + 1,
    deathsList: n.deaths.filter((d) => d.boss === b.name && d.at >= p.at - 1 && d.at <= p.at + p.durationSec + 2),
  }));
  const deaths = pulls.flatMap((p) => p.deathsList.map((d) => ({ ...d, pullN: p.n, into: d.at - p.at })));
  const fought = b.pulls.reduce((t, p) => t + p.durationSec, 0);

  // One page, four views - so the fight's story doesn't turn into a wall.
  const [tab, setTab] = useState("overview");
  const hasPerf = b.parses?.length || b.dispels?.length || b.kicks?.length;
  const tabs = [
    { key: "overview", label: "Overview" },
    hasPerf && { key: "performance", label: "Performance" },
    { key: "deaths", label: `Deaths${deaths.length ? ` · ${deaths.length}` : ""}` },
    hasReplay(n.night, b.encounterId) && { key: "replay", label: "Replay" },
  ].filter(Boolean);

  return (
    <div className="view rr">
      <Banner
        kind="night"
        accent={zone.color}
        art={[bossImg(b.encounterId)]}
        kicker={`Raid night · ${fmtDate(n.night, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}`}
        title={b.name}
        sub={zone.name}
        crumbs={[
          { label: "Raid logs", href: href("raids") },
          { label: `${fmtDate(n.night, { day: "numeric", month: "short" })} · ${zones.map((z) => zoneOf(z).short).join(" + ")}`, href: href("raids", n.night) },
          { label: b.name },
        ]}
        nav={
          <>
            {prev && <a href={href("raids", n.night, prev.encounterId)}>‹ {prev.name}</a>}
            {next && <a href={href("raids", n.night, next.encounterId)}>{next.name} ›</a>}
          </>
        }
        stats={[
          b.killed
            ? { value: mmss(b.killTimeSec), label: "kill time", className: "rr-gold" }
            : { value: "No kill", label: "result", className: "rr-wipe-txt" },
          { value: b.pulls.length, label: b.pulls.length === 1 ? "pull" : "pulls" },
          { value: b.wipes, label: "wipes", className: b.wipes ? "rr-wipe-txt" : "" },
          { value: deaths.length, label: "deaths" },
          { value: mmss(fought), label: "time fighting" },
        ]}
      />

      <Analysis night={n.night} encounterId={b.encounterId} bossName={b.name} />

      <PageTabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === "overview" && (
        <>
        <Compare b={b} night={n.night} />

        <NightMechanics b={b} icons={n.icons} />

        <Panel title="Pulls" sub="each bar is one attempt · dots are deaths, when they happened">
          <PullStrips pulls={pulls} />
        </Panel>
        </>
      )}

      {tab === "performance" && <NightFightWork b={b} icons={n.icons} />}

      {tab === "deaths" && (
        <Panel title="Death log" sub={deaths.length ? "in order, per pull" : undefined}>
          {deaths.length ? (
            <div className="rr-table-wrap">
              <table className="rr-table rr-deathlog">
                <thead>
                  <tr>
                    <th>Pull</th>
                    <th className="num">Time</th>
                    <th>Raider</th>
                    <th>Killing blow</th>
                    <th className="hide-sm">From</th>
                  </tr>
                </thead>
                <tbody>
                  {deaths.map((d, k) => (
                    <tr key={k} className={d.firstOfPull ? "rr-first" : ""}>
                      <td className="muted">#{d.pullN}</td>
                      <td className="num">{mmss(d.into)}</td>
                      <td>
                        <NP name={d.player} size={16} />
                        {d.firstOfPull && <span className="rr-chip">first</span>}
                      </td>
                      <td>
                        <span className="rr-inline-ic">
                          <SpellIcon name={d.killingBlow || "Unknown"} icons={n.icons} size={18} /> {d.killingBlow || "Unknown"}
                        </span>
                      </td>
                      <td className="hide-sm muted">
                        {d.killer ? (classOf.has(d.killer.name) || CLASS_OF.has(d.killer.name) ? <NP name={d.killer.name} size={14} /> : d.killer.name) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rr-clean-kill">Clean kill, nobody died.</div>
          )}
        </Panel>
      )}

      {tab === "replay" && <Replay n={n} b={b} />}
    </div>
  );
}

// One compact line: how tonight compares to every other logged kill.
function Compare({ b, night }) {
  const [tip, bind] = useTip();
  const all = ALL_TIME.bosses.find((x) => x.id === b.encounterId);
  if (!all || !all.history.length) return null;
  const kills = [...all.history].sort((a, c) => a.sec - c.sec);
  const avg = kills.reduce((t, k) => t + k.sec, 0) / kills.length;
  const rank = b.killed ? kills.findIndex((k) => k.night === night) + 1 : null;
  const lo = kills[0].sec;
  const hi = kills.at(-1).sec;
  const x = (s) => (hi === lo ? 50 : 4 + ((s - lo) / (hi - lo)) * 92);

  return (
    <div className="rr-compare">
      <div className="rr-compare-text">
        {rank ? (
          <>
            <b>{ordinal(rank)} fastest</b> of {kills.length} logged kills
            {rank === 1 && <span className="rr-chip gold">best ever</span>}
          </>
        ) : (
          <b className="rr-wipe-txt">Not killed this night</b>
        )}
        <span className="muted">
          {" "}· best {mmss(all.bestKillSec)} ({fmtDate(all.bestKillNight, { day: "numeric", month: "short" })}) · average {mmss(Math.round(avg))}
        </span>
      </div>
      <div className="rr-compare-strip" aria-hidden="true">
        <span className="rr-compare-axis" />
        {kills.map((k) => (
          <span
            key={k.night}
            className={`rr-compare-dot${k.night === night ? " me" : ""}`}
            style={{ left: `${x(k.sec)}%` }}
            {...bind(<>{fmtDate(k.night)} · {mmss(k.sec)}</>)}
          />
        ))}
        <span className="rr-compare-lbl" style={{ left: 0 }}>{mmss(lo)}</span>
        <span className="rr-compare-lbl" style={{ right: 0 }}>{mmss(hi)}</span>
      </div>
      <a className="rr-compare-link" href={href("raid-boss", b.encounterId)}>
        Moist vs {b.name}, all time →
      </a>
      {tip}
    </div>
  );
}

// A horizontal bar per pull on a shared time scale, deaths as dots on it.
function PullStrips({ pulls }) {
  const [tip, bind] = useTip();
  const max = Math.max(...pulls.map((p) => p.durationSec), 30);
  // Stack deaths that land close together (within 2% of the width) upwards.
  const placed = pulls.map((p) => {
    const used = {};
    return p.deathsList.map((d) => {
      const pct = (Math.max(0, d.at - p.at) / max) * 100;
      const bucket = Math.floor(pct / 2);
      const level = (used[bucket] = (used[bucket] ?? -1) + 1);
      return { d, pct, level };
    });
  });
  return (
    <div className="rr-pullstrips">
      {pulls.map((p, pi) => {
        const tall = Math.max(0, ...placed[pi].map((x) => x.level));
        return (
        <div key={p.n} className="rr-pullstrip">
          <div className="rr-pullstrip-label">
            <b>Pull {p.n}</b>
            <span className={p.kill ? "rr-gold" : "rr-wipe-txt"}>{p.kill ? "Kill" : `Wipe · ${p.bossPctLeft ?? "?"}% left`}</span>
          </div>
          <div className="rr-pullstrip-track" style={{ height: Math.max(30, tall * 9 + 22) }}>
            <div className={`rr-pullstrip-bar ${p.kill ? "kill" : "wipe"}`} style={{ width: `${(p.durationSec / max) * 100}%` }} />
            {placed[pi].map(({ d, pct, level }, k) => (
              <span
                key={k}
                className="rr-pullstrip-dot"
                style={{ left: `${pct}%`, background: classColor(d.class), bottom: `${10 + level * 9}px` }}
                {...bind(
                  <>
                    <Player name={d.player} cls={d.class} link={false} />
                    <div className="muted">{d.killingBlow || "Unknown"} · {mmss(Math.max(0, d.at - p.at))} in</div>
                  </>
                )}
              />
            ))}
          </div>
          <div className="rr-pullstrip-meta">
            <b>{mmss(p.durationSec)}</b>
            <span className="muted">{p.deathsList.length} ☠</span>
          </div>
        </div>
        );
      })}
      {tip}
    </div>
  );
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
