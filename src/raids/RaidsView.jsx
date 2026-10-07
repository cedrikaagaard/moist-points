import { useMemo, useState } from "react";
import { NIGHTS, ALL_TIME, CLASS_OF, useNight } from "./data.js";
import { classColor, fmtDate, hm, mmss, zoneImg, zoneOf, ZONES } from "./assets.js";
import { Banner, BarList, BossIcon, ClassIcon, Panel, Player, SpellIcon, Tabs, Tile, ZoneIcon } from "./components.jsx";
import { ActivityCalendar, ClearTrend, KillSparkline, NightTimeline } from "./charts.jsx";
import { deathless, friendlyFire, nightHighlights, records } from "./highlights.js";
import { nightZones } from "./aggregate.js";
import { ZonePage, BossPage } from "./BossPages.jsx";
import NightBossPage from "./NightBoss.jsx";
import { href } from "../router.js";
import "./raids.css";

// #/raids            the guild's raiding, all time
// #/raids/<night>    one raid night
// #/raids/<night>/<boss>  one boss on that night - see NightBoss.jsx
// #/raid-zone/<id>   one raid (zone) and its bosses - see BossPages.jsx
// #/raid-boss/<id>   one boss across every night
export default function RaidsView({ view, param, sub }) {
  if (!NIGHTS.length) {
    return (
      <div className="view">
        <div className="empty">No raid nights yet. Run <code>npm run raids:fetch</code>.</div>
      </div>
    );
  }
  if (view === "raid-zone") return <ZonePage id={Number(param)} />;
  if (view === "raid-boss") return <BossPage id={Number(param)} />;
  if (param && sub) return <NightBossPage night={param} bossId={Number(sub)} />;
  return param ? <NightPage night={param} /> : <Overview />;
}

const playerInfo = new Map(ALL_TIME.players.map((p) => [p.name, p]));
const P = ({ name, size }) => {
  const p = playerInfo.get(name);
  return <Player name={name} cls={p?.class} spec={p?.spec} size={size} />;
};

// ================= Overview =================

function Overview() {
  const a = ALL_TIME;
  return (
    <div className="view rr">
      <div className="view-head">
        <div>
          <div className="rr-kicker"><span className="rr-kicker-dot" aria-hidden="true">♜</span>Guild history · all time</div>
          <h1>Raid logs</h1>
          <p className="muted">
            {a.nights} nights from {fmtDate(a.firstNight, { day: "numeric", month: "short", year: "numeric" })} to{" "}
            {fmtDate(a.lastNight, { day: "numeric", month: "short", year: "numeric" })}, from the guild's Warcraft Logs
          </p>
        </div>
      </div>

      <div className="stat-row rr-stat-row">
        <Tile value={a.nights} label="Raid nights" sub={`${Math.round(a.totals.minutes / 60)} hours in raids`} />
        <Tile value={a.totals.kills} label="Boss kills" accent="var(--gold-bright)" sub={`${a.totals.wipes} wipes`} />
        <Tile value={`${Math.round(a.totals.minutes / 60)}h`} label="In raids" sub={`${Math.round(a.totals.minutes / a.nights)} min per night`} />
        <Tile value={a.totals.deaths.toLocaleString()} label="Deaths" sub={`${(a.totals.deaths / a.nights).toFixed(1)} per night`} />
      </div>

      <ZoneStrip />

      <div className="rr-grid-main">
        <Panel title="Raid calendar" sub="every logged night">
          <ActivityCalendar nights={NIGHTS} />
        </Panel>
        <Panel title="Recent nights" right={<span className="muted">{NIGHTS.length} total</span>}>
          <div className="rr-night-list">
            {NIGHTS.slice(0, 6).map((n) => (
              <NightRow key={n.night} n={n} />
            ))}
          </div>
        </Panel>
      </div>

      <ClearTimes />
      <HallOfFame />
      <BossRecords />

      <Panel title="All nights">
        <div className="rr-night-list rr-night-list-all">
          {NIGHTS.map((n) => (
            <NightRow key={n.night} n={n} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ZoneStrip() {
  const zones = Object.keys(ZONES)
    .map(Number)
    .map((id) => {
      const nights = NIGHTS.filter((n) => n.zoneIds.includes(id));
      const bosses = ALL_TIME.bosses.filter((b) => b.zoneId === id);
      return { id, nights: nights.length, kills: bosses.reduce((t, b) => t + b.kills, 0), wipes: bosses.reduce((t, b) => t + b.wipes, 0) };
    })
    .filter((z) => z.nights);
  return (
    <div className="rr-zones">
      {zones.map((z) => (
        <a key={z.id} href={href("raid-zone", z.id)} className="rr-zone" style={{ "--zone": zoneOf(z.id).color }}>
          <div className="rr-zone-bg" style={{ backgroundImage: `url(${zoneImg(z.id)})` }} />
          <ZoneIcon id={z.id} size={52} />
          <div>
            <div className="rr-zone-name">{zoneOf(z.id).name}</div>
            <div className="rr-zone-meta">
              <b>{z.nights}</b> nights · <b>{z.kills}</b> kills · <b>{z.wipes}</b> wipes
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

// Small multiples: how fast each raid gets cleared, night over night.
function ClearTimes() {
  const zones = Object.keys(ZONES)
    .map(Number)
    .filter((z) => NIGHTS.filter((n) => n.zoneTimes?.[z]).length >= 2);
  return (
    <Panel title="Clear times" sub="each dot a night · gold line = record so far">
      <div className="rr-multiples">
        {zones.map((z) => {
          const rows = NIGHTS.filter((n) => n.zoneTimes?.[z]);
          const full = Math.max(...rows.map((n) => n.zoneTimes[z].kills));
          const clears = rows.filter((n) => n.zoneTimes[z].kills === full);
          const best = Math.min(...clears.map((n) => n.zoneTimes[z].sec));
          const last = clears[0]?.zoneTimes[z].sec;
          return (
            <a key={z} className="rr-multiple" href={href("raid-zone", z)}>
              <div className="rr-multiple-head">
                <ZoneIcon id={z} size={26} />
                <span className="rr-multiple-name">{zoneOf(z).short}</span>
                <span className="rr-multiple-best">
                  <b className="rr-gold">{mmss(best)}</b> <span className="muted">best · last {mmss(last)}</span>
                </span>
              </div>
              <ClearTrend nights={NIGHTS} zoneId={z} compact />
            </a>
          );
        })}
      </div>
    </Panel>
  );
}

function NightRow({ n }) {
  return (
    <a className="rr-night-row" href={href("raids", n.night)}>
      <div className="rr-night-zones">
        {n.zoneIds.map((z) => (
          <ZoneIcon key={z} id={z} size={36} />
        ))}
      </div>
      <div className="rr-night-main">
        <div className="rr-night-title">
          <span>{n.zoneIds.map((z) => zoneOf(z).short).join(" + ")}</span>
          <span className="muted">{fmtDate(n.night)}</span>
        </div>
        <div className="rr-night-bosses">
          {n.bosses.map((b) => (
            <span key={b.id} className={`rr-mini-boss${b.killed ? "" : " wiped"}`} title={`${b.name}${b.killed ? ` · ${mmss(b.killTimeSec)}` : " · not killed"}`}>
              <BossIcon id={b.id} name={b.name} size={20} />
            </span>
          ))}
        </div>
      </div>
      <div className="rr-night-stats">
        <span><b>{n.totals.kills}</b> kills</span>
        <span className={n.totals.wipes ? "rr-wipe-txt" : ""}><b>{n.totals.wipes}</b> wipes</span>
        <span><b>{n.totals.deaths}</b> deaths</span>
        <span className="muted">{hm(n.durationMin)}</span>
      </div>
    </a>
  );
}

// All-time leaderboards: attendance, utility and raid debuffs.
const BOARDS = [
  { key: "nights", label: "Attendance", icon: "Hearthstone", get: (p) => p.nights, note: (p) => `last seen ${fmtDate(p.lastNight)}`, unit: "nights" },
  { key: "dispels", label: "Dispels", icon: "Decurse", get: (p) => p.dispels, unit: "dispels" },
  { key: "interrupts", label: "Interrupts", icon: "Kick", get: (p) => p.interrupts, unit: "interrupts" },
  { key: "rez", label: "Battle rezzes", icon: "Rebirth", get: (p) => p.combatRezzes, note: (p) => `${p.rezzes} rezzes in total`, unit: "battle rezzes" },
  { key: "sunder", label: "Sunders", icon: "Sunder Armor", get: (p) => p.casts["Sunder Armor"] || 0, unit: "Sunders" },
  { key: "curses", label: "Curses", icon: "Curse of Recklessness", get: (p) => (p.casts["Curse of Recklessness"] || 0) + (p.casts["Curse of the Elements"] || 0) + (p.casts["Curse of Shadow"] || 0), unit: "curses" },
  { key: "ff", label: "Faerie Fire", icon: "Faerie Fire", get: (p) => p.casts["Faerie Fire"] || 0, unit: "casts" },
  { key: "sappers", label: "Sappers", icon: "Goblin Sapper Charge", get: (p) => p.casts["Goblin Sapper Charge"] || 0, unit: "sappers" },
  { key: "tranq", label: "Tranq Shot", icon: "Tranquilizing Shot", get: (p) => p.casts["Tranquilizing Shot"] || 0, unit: "casts" },
  { key: "pi", label: "Power Infusion", icon: "Power Infusion", get: (p) => p.casts["Power Infusion"] || 0, unit: "casts" },
  { key: "clean", label: "Deathless", icon: "Divine Intervention", get: (p) => p.cleanNights, note: (p) => `of ${p.nights} nights`, unit: "nights without dying" },
];

function HallOfFame() {
  const [key, setKey] = useState("nights");
  const board = BOARDS.find((b) => b.key === key);
  const rows = ALL_TIME.players
    .map((p) => ({ p, v: board.get(p) }))
    .filter((r) => r.v > 0)
    .sort((a, b) => b.v - a.v || (a.p.deathsPerNight - b.p.deathsPerNight))
    .slice(0, 12)
    .map(({ p, v }) => ({
      key: p.name,
      label: <P name={p.name} />,
      value: v,
      color: classColor(p.class),
      note: board.note?.(p),
    }));
  return (
    <Panel title="Hall of fame" right={<span className="muted">{board.hint || `most ${board.unit}, all time`}</span>} className="rr-hof">
      <Tabs
        tabs={BOARDS.map((b) => ({ key: b.key, label: b.label, icon: <SpellIcon name={b.icon} size={18} /> }))}
        value={key}
        onChange={setKey}
      />
      <BarList rows={rows} format={board.format || ((v) => v.toLocaleString())} />
    </Panel>
  );
}

function BossRecords() {
  const zones = Object.keys(ZONES).map(Number).filter((z) => ALL_TIME.bosses.some((b) => b.zoneId === z));
  const [zone, setZone] = useState(zones.includes(2006) ? 2006 : zones[0]);
  const bosses = ALL_TIME.bosses.filter((b) => b.zoneId === zone).sort((a, b) => a.id - b.id);
  return (
    <Panel title="Boss records" right={<span className="muted">fastest logged kill per boss</span>}>
      <Tabs tabs={zones.map((z) => ({ key: z, label: zoneOf(z).short, icon: <ZoneIcon id={z} size={18} /> }))} value={zone} onChange={setZone} />
      <div className="rr-table-wrap">
        <table className="rr-table">
          <thead>
            <tr>
              <th>Boss</th>
              <th className="num">Kills</th>
              <th className="num">Wipes</th>
              <th className="num">Best</th>
              <th className="hide-sm">Kill times</th>
              <th className="num hide-sm">Deaths</th>
            </tr>
          </thead>
          <tbody>
            {bosses.map((b) => (
              <tr key={b.id}>
                <td>
                  <a className="rr-boss-cell" href={href("raid-boss", b.id)}>
                    <BossIcon id={b.id} name={b.name} size={28} />
                    {b.name}
                  </a>
                </td>
                <td className="num">{b.kills}</td>
                <td className={`num${b.wipes ? " rr-wipe-txt" : ""}`}>{b.wipes}</td>
                <td className="num rr-best">
                  {b.bestKillNight ? <a href={href("raids", b.bestKillNight)}>{mmss(b.bestKillSec)}</a> : "-"}
                </td>
                <td className="hide-sm">
                  <KillSparkline history={b.history} best={b.bestKillSec} />
                </td>
                <td className="num hide-sm">{b.deaths}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ================= One night =================

function NightPage({ night }) {
  const { night: n, error } = useNight(night);
  if (error) return <div className="view"><div className="empty">No raid logged for {night}.</div></div>;
  if (!n || n.night !== night) return <div className="view rr-loading muted">Loading…</div>;
  return <Night n={n} />;
}

function Night({ n }) {
  const zones = nightZones(n);
  const idx = NIGHTS.findIndex((x) => x.night === n.night);
  const newer = NIGHTS[idx - 1];
  const older = NIGHTS[idx + 1];
  const cards = useMemo(() => nightHighlights(n, CLASS_OF), [n]);
  const recs = useMemo(() => records(n, ALL_TIME), [n]);
  const clean = useMemo(() => deathless(n), [n]);
  const ff = useMemo(() => friendlyFire(n, CLASS_OF), [n]);
  const specOf = new Map(n.raiders.map((r) => [r.name, r.spec || playerInfo.get(r.name)?.spec]));
  const classOf = new Map(n.raiders.map((r) => [r.name, r.class]));
  const NP = ({ name, size }) => <Player name={name} cls={classOf.get(name) || CLASS_OF.get(name)} spec={specOf.get(name)} size={size} />;

  return (
    <div className="view rr">
      <Banner
        kind="night"
        accent={zoneOf(zones[0]).color}
        art={zones.map(zoneImg)}
        kicker={`Raid night · ${fmtDate(n.night, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
        title={zones.map((z) => zoneOf(z).name).join(" + ")}
        crumbs={[{ label: "Raid logs", href: href("raids") }, { label: fmtDate(n.night, { day: "numeric", month: "short" }) }]}
        nav={
          <>
            {older && <a href={href("raids", older.night)}>‹ {fmtDate(older.night, { day: "numeric", month: "short" })}</a>}
            {newer && <a href={href("raids", newer.night)}>{fmtDate(newer.night, { day: "numeric", month: "short" })} ›</a>}
          </>
        }
        stats={[
          { value: n.totals.kills, label: "kills" },
          { value: n.totals.wipes, label: "wipes", className: n.totals.wipes ? "rr-wipe-txt" : "" },
          { value: n.totals.deaths, label: "deaths" },
          { value: hm(n.durationMin), label: "raid time" },
          { value: n.raiders.length, label: "raiders" },
        ]}
      />

      <Panel title="The night at a glance" sub="pulls and deaths over time">
        <NightTimeline n={n} />
      </Panel>

      {(cards.length > 0 || recs.length > 0) && (
        <Panel title="Standouts" sub="a few highlights from the night">
          <div className="rr-awards">
            {recs.map((r) => (
              <div key={`rec-${r.boss.name}`} className="rr-award rr-award-record">
                <BossIcon id={r.boss.encounterId} name={r.boss.name} size={44} />
                <div>
                  <div className="rr-award-title">Guild record</div>
                  <div className="rr-award-who">{r.boss.name}</div>
                  <div className="rr-award-val">
                    <b>{mmss(r.boss.killTimeSec)}</b> <span className="muted">was {mmss(r.prev)}</span>
                  </div>
                </div>
              </div>
            ))}
            {cards.map((c) => (
              <div key={c.key} className="rr-award">
                <SpellIcon name={c.icon} icons={n.icons} size={44} />
                <div>
                  <div className="rr-award-title">{c.title}</div>
                  <div className="rr-award-who"><NP name={c.player} /></div>
                  <div className="rr-award-val">
                    {typeof c.value === "number" ? (
                      <><b>{c.value}</b> <span className="muted">{c.unit}</span></>
                    ) : (
                      <span className="muted">brought back <NP name={c.value} size={14} /></span>
                    )}
                  </div>
                  <div className="rr-award-detail muted">{c.detail}</div>
                </div>
              </div>
            ))}
          </div>
          {clean.length > 0 && (
            <div className="rr-clean">
              <span className="rr-clean-title">Didn't die all night</span>
              {clean.map((r) => (
                <NP key={r.name} name={r.name} size={14} />
              ))}
            </div>
          )}
        </Panel>
      )}

      <Panel title="Bosses" sub="open one for its pulls and deaths">
        <div className="rr-boss-grid">
          {n.bosses.map((b) => {
            const best = ALL_TIME.bosses.find((x) => x.name === b.name)?.bestKillSec;
            const delta = b.killTimeSec != null && best != null ? b.killTimeSec - best : null;
            return (
              <a key={b.encounterId} href={href("raids", n.night, b.encounterId)} className={`rr-boss rr-boss-link${b.killed ? "" : " wiped"}`}>
                <BossIcon id={b.encounterId} name={b.name} size={48} />
                <div className="rr-boss-body">
                  <div className="rr-boss-name">{b.name}</div>
                  <div className="rr-boss-time">
                    {b.killed ? <b>{mmss(b.killTimeSec)}</b> : <b className="rr-wipe-txt">not killed</b>}
                    {delta === 0 && <span className="rr-chip gold">best ever</span>}
                    {delta > 0 && <span className="muted"> +{mmss(delta)} off best</span>}
                  </div>
                  <div className="rr-pulls">
                    {b.pulls.map((p, i) => (
                      <span
                        key={i}
                        className={`rr-pull ${p.kill ? "kill" : "wipe"}`}
                        title={p.kill ? `Kill · ${mmss(p.durationSec)}` : `Wipe at ${p.bossPctLeft ?? "?"}% · ${mmss(p.durationSec)}`}
                      >
                        {p.kill ? "✓" : `${p.bossPctLeft ?? "?"}%`}
                      </span>
                    ))}
                    <span className="muted rr-boss-deaths">{b.pulls.reduce((t, p) => t + p.deaths, 0)} deaths</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </Panel>

      <div className="grid-2">
        <Panel title="Dispels" sub="debuffs removed">
          <BarList
            rows={(n.dispels || []).slice(0, 8).map((d) => {
              const [what, c] = Object.entries(d.what).sort((a, b) => b[1] - a[1])[0];
              return {
                key: d.player,
                label: <NP name={d.player} />,
                value: d.total,
                color: classColor(classOf.get(d.player)),
                note: <span className="rr-inline-ic"><SpellIcon name={what} icons={n.icons} size={14} /> {c}× {what}</span>,
              };
            })}
            empty="No dispels logged."
          />
        </Panel>
        <Panel title="Interrupts" sub="casts stopped">
          <BarList
            rows={(n.interrupts || []).slice(0, 8).map((d) => {
              const [what, c] = Object.entries(d.what).sort((a, b) => b[1] - a[1])[0];
              return {
                key: d.player,
                label: <NP name={d.player} />,
                value: d.total,
                color: classColor(classOf.get(d.player)),
                note: <span className="rr-inline-ic"><SpellIcon name={what} icons={n.icons} size={14} /> {c}× {what}</span>,
              };
            })}
            empty="No interrupts logged."
          />
        </Panel>
      </div>

      <RaidDuties n={n} NP={NP} classOf={classOf} />

      <div className="grid-2">
        <Panel title="Floor time" sub="deaths per raider">
          <BarList
            rows={countBy(n.deaths, (d) => d.player)
              .slice(0, 10)
              .map(([name, count]) => ({
                key: name,
                label: <NP name={name} />,
                value: count,
                color: classColor(classOf.get(name)),
                note: `${n.deaths.filter((d) => d.player === name && d.firstOfPull).length} times first to die`,
              }))}
            empty="Nobody died. Nobody!"
          />
        </Panel>
        <Panel title="What killed us" sub="killing blows">
          <BarList
            rows={countBy(n.deaths, (d) => d.killingBlow || "Unknown")
              .slice(0, 10)
              .map(([name, count]) => ({
                key: name,
                label: <span className="rr-inline-ic"><SpellIcon name={name} icons={n.icons} size={18} /> {name}</span>,
                value: count,
                color: "var(--text-2)",
              }))}
          />
          {ff.length > 0 && (
            <div className="rr-ff">
              <div className="rr-clean-title">Friendly fire</div>
              {ff.map((d, i) => (
                <div key={i} className="rr-ff-row">
                  <NP name={d.player} size={14} /> <span className="muted">by</span> <NP name={d.killer.name} size={14} />
                  <span className="muted"> · {d.killingBlow}{d.boss ? ` on ${d.boss}` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Consumables n={n} NP={NP} />
      <Roster n={n} />

      <p className="muted rr-sources">
        Stitched from the logs of{" "}
        {n.sources.map((s, i) => (
          <span key={s.code}>
            {i > 0 && ", "}
            <a href={s.url} target="_blank" rel="noreferrer">{s.owner || s.code}</a>
          </span>
        ))}
      </p>
    </div>
  );
}

// Raid debuffs + helping hands: who carried each one tonight.
function RaidDuties({ n, NP }) {
  const groups = [
    { title: "Raid debuffs", sub: "keeping the boss soft", cat: "debuff" },
    { title: "Helping hands", sub: "utility that saves pulls", cat: "utility" },
  ];
  return (
    <div className="grid-2">
      {groups.map((g) => {
        const abilities = Object.entries(n.casts || {})
          .filter(([, c]) => c.category === g.cat)
          .map(([name, c]) => ({ name, by: Object.entries(c.by).sort((a, b) => b[1] - a[1]), total: Object.values(c.by).reduce((t, v) => t + v, 0) }))
          .sort((a, b) => b.total - a.total);
        return (
          <Panel key={g.cat} title={g.title} sub={g.sub}>
            {abilities.length ? (
              <div className="rr-duties">
                {abilities.map((a) => (
                  <div key={a.name} className="rr-duty">
                    <SpellIcon name={a.name} icons={n.icons} size={30} />
                    <div className="rr-duty-body">
                      <div className="rr-duty-name">
                        {a.name} <span className="muted">· {a.total}</span>
                      </div>
                      <div className="rr-duty-who">
                        {a.by.slice(0, 3).map(([name, c]) => (
                          <span key={name}>
                            <NP name={name} size={14} /> <span className="muted">{c}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted rr-empty-sm">Nothing logged.</div>
            )}
          </Panel>
        );
      })}
    </div>
  );
}

function Consumables({ n, NP }) {
  const items = Object.entries(n.casts || {})
    .filter(([, c]) => c.category === "consumable")
    .map(([name, c]) => {
      const by = Object.entries(c.by).sort((a, b) => b[1] - a[1]);
      return { name, total: by.reduce((t, [, v]) => t + v, 0), top: by[0], users: by.length };
    })
    .sort((a, b) => b.total - a.total);
  if (!items.length) return null;
  return (
    <Panel title="Consumables" sub="used during the night">
      <div className="rr-consumes">
        {items.map((it) => (
          <div key={it.name} className="rr-consume" title={`${it.name}: ${it.total} used by ${it.users} raiders`}>
            <div className="rr-consume-ic">
              <SpellIcon name={it.name} icons={n.icons} size={40} />
              <span className="rr-consume-n">{it.total}</span>
            </div>
            <div className="rr-consume-name">{it.name}</div>
            <div className="rr-consume-top"><NP name={it.top[0]} size={12} /> {it.top[1]}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Roster({ n }) {
  const byClass = {};
  for (const r of n.raiders) (byClass[r.class || "Unknown"] ||= []).push(r);
  const deaths = Object.fromEntries(countBy(n.deaths, (d) => d.player));
  return (
    <Panel title="Roster" sub={`${n.raiders.length} raiders`}>
      <div className="rr-roster">
        {Object.entries(byClass)
          .sort((a, b) => b[1].length - a[1].length)
          .map(([cls, list]) => (
            <div key={cls} className="rr-roster-col">
              <div className="rr-roster-head" style={{ color: classColor(cls) }}>
                <ClassIcon cls={cls} size={18} /> {cls} <span className="muted">{list.length}</span>
              </div>
              {list.map((r) => (
                <div key={r.name} className="rr-roster-name">
                  <span style={{ color: classColor(cls) }}>{r.name}</span>
                  {deaths[r.name] ? <span className="muted">{deaths[r.name]}☠</span> : null}
                </div>
              ))}
            </div>
          ))}
      </div>
    </Panel>
  );
}

function countBy(list, key) {
  const m = {};
  for (const x of list) m[key(x)] = (m[key(x)] || 0) + 1;
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}
