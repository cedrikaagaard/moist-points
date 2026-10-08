import { useMemo } from "react";
import { GUILD_NIGHTS, ALL_TIME, CLASS_OF, useNight } from "./data.js";
import { fmtDate, hm, mmss, zoneOf } from "./assets.js";
import { BossIcon, Panel, Player, SpellIcon, ZoneIcon } from "./components.jsx";
import { NightTimeline } from "./charts.jsx";
import { nightHighlights, records } from "./highlights.js";
import { href } from "../router.js";
import "./raids.css";

// The raid half of the home page: the latest raid night.
export default function HomeRaids() {
  const latest = GUILD_NIGHTS[0];
  const { night: n } = useNight(latest?.night);
  if (!latest) return null;
  return (
    <Panel
      title="Latest raid"
      right={<a className="rr-compare-link" href={href("raids", latest.night)}>Open the full night →</a>}
      className="home-latest"
    >
      <div className="home-latest-head">
        <div className="rr-night-zones">
          {latest.zoneIds.map((z) => <ZoneIcon key={z} id={z} size={44} />)}
        </div>
        <div>
          <div className="home-latest-title">{latest.zoneIds.map((z) => zoneOf(z).name).join(" + ")}</div>
          <div className="muted">
            {fmtDate(latest.night, { weekday: "long", day: "numeric", month: "long" })} · {latest.totals.kills} kills · {latest.totals.wipes} wipes · {latest.totals.deaths} deaths · {hm(latest.durationMin)}
          </div>
        </div>
        <div className="rr-night-bosses home-latest-bosses">
          {latest.bosses.map((b) => (
            <a key={b.id} href={href("raids", latest.night, b.id)} className={`rr-mini-boss${b.killed ? "" : " wiped"}`} title={`${b.name}${b.killed ? ` · ${mmss(b.killTimeSec)}` : " · not killed"}`}>
              <BossIcon id={b.id} name={b.name} size={26} />
            </a>
          ))}
        </div>
      </div>
      {n && n.night === latest.night ? <Latest n={n} /> : <div className="muted rr-loading">Loading…</div>}
    </Panel>
  );
}

function Latest({ n }) {
  const cards = useMemo(() => [...records(n, ALL_TIME).map((r) => ({ record: r })), ...nightHighlights(n, CLASS_OF)].slice(0, 6), [n]);
  return (
    <>
      <NightTimeline n={n} />
      {cards.length > 0 && (
        <div className="rr-awards home-awards">
          {cards.map((c, i) =>
            c.record ? (
              <div key={i} className="rr-award rr-award-record">
                <BossIcon id={c.record.boss.encounterId} name={c.record.boss.name} size={40} />
                <div>
                  <div className="rr-award-title">Guild record</div>
                  <div className="rr-award-who">{c.record.boss.name}</div>
                  <div className="rr-award-val"><b>{mmss(c.record.boss.killTimeSec)}</b> <span className="muted">was {mmss(c.record.prev)}</span></div>
                </div>
              </div>
            ) : (
              <div key={c.key} className="rr-award">
                <SpellIcon name={c.icon} icons={n.icons} size={40} />
                <div>
                  <div className="rr-award-title">{c.title}</div>
                  <div className="rr-award-who"><Player name={c.player} cls={c.class} /></div>
                  <div className="rr-award-val">
                    {typeof c.value === "number" ? <><b>{c.value}</b> <span className="muted">{c.unit}</span></> : <span className="muted">brought back {c.value}</span>}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </>
  );
}

