import { useIdentity, setMe } from "../identity.js";
import { useMyReviews, reviewsOf } from "../reviews.js";
import { LockedReviews } from "../components/BnetVerify.jsx";
import { BossIcon, ZoneIcon, SpellIcon } from "./components.jsx";
import { parseColor } from "./RaidProfile.jsx";
import { fmtDate, zoneOf } from "./assets.js";
import { href } from "../router.js";
import "./raids.css";

// Private, per-player raid reviews on My Page. Written by Claude (the
// /raid-logs skill) into data/reviews/<raid id>.json and served only to the
// verified owner by /api/reviews (netlify/functions/auth.mjs). Never part of
// the site bundle.
//   review: { grade, verdict, summary, good: [{ title, text, boss? }],
//             fix: [{ title, text, impact: high|medium|low, boss? }],
//             bosses: { <encounterId>: { tone, text } } }

const GRADE_COLOR = { S: "#ff8000", A: "#a335ee", B: "#3b8eea", C: "#1eff00", D: "#9d9d9d", F: "#e0525f" };
const gradeColor = (g) => GRADE_COLOR[g?.[0]] || "var(--muted)";

// The Reviews tab on My Page. night: the raid to show (#/me/reviews/<raid id>).
export default function MyReviews({ night, locked }) {
  const { me, owned } = useIdentity();
  const all = useMyReviews();
  if (locked) return <LockedReviews />;
  if (!all) return <div className="muted rr-loading">Loading your reviews…</div>;
  const mine = reviewsOf(all, me);
  const others = owned.filter((n) => n !== me && reviewsOf(all, n).length);
  const current = mine.find((r) => r.night === night) || mine[0];

  return (
    <div className="rv">
      <p className="rv-private">
        <span aria-hidden="true">🔒</span> Only you can see these. Claude reads the logs of each raid you were in and writes you a
        review; it can be wrong, the numbers come straight from the log.
      </p>

      {!mine.length && (
        <div className="rv-empty">
          No reviews for {me} yet. Claude writes them for recent raids, so check back after the next one.
          {others.length > 0 && (
            <span>
              {" "}Your other characters have some:{" "}
              {others.map((n, i) => (
                <span key={n}>
                  {i > 0 && ", "}
                  <button type="button" className="link-btn" onClick={() => setMe(n)}>{n}</button>
                </span>
              ))}
              .
            </span>
          )}
        </div>
      )}

      {mine.length > 1 && (
        <div className="rv-raids" role="tablist">
          {mine.map((r) => (
            <a key={r.night} role="tab" aria-selected={r === current} className={`rv-raid${r === current ? " active" : ""}`} href={`#/me/reviews/${r.night}`}>
              <ZoneIcon id={r.zoneIds?.[0]} size={30} />
              <span className="rv-raid-text">
                <b>{zoneOf(r.zoneIds?.[0]).short || r.zones?.[0]}</b>
                <small>{fmtDate(r.date || r.night.slice(0, 10))}</small>
              </span>
              <span className="rv-grade-sm" style={{ "--g": gradeColor(r.review.grade) }}>{r.review.grade}</span>
            </a>
          ))}
        </div>
      )}

      {current && <Review r={current} />}
    </div>
  );
}

function Review({ r }) {
  const { stats: s, review: v } = r;
  const deaths = s.deaths || [];
  const wb = s.worldBuffs || [];
  const firstWb = wb[0]?.buffs?.length ?? null;
  const lastWb = wb.length ? wb[wb.length - 1].buffs?.length ?? null : null;
  const healer = s.role === "healer";

  return (
    <article className="rv-card">
      <div className="rv-top">
        <div className="rv-grade" style={{ "--g": gradeColor(v.grade) }} aria-label={`Grade ${v.grade}`}>
          {v.grade}
        </div>
        <div className="rv-top-text">
          <div className="rv-meta">
            <a href={href("raids", r.night)}>{r.zones?.join(" + ")} · {fmtDate(r.date || r.night.slice(0, 10))}</a>
            <span>· {r.player}</span>
          </div>
          <h3>{v.verdict}</h3>
          <p>{v.summary}</p>
        </div>
      </div>

      <div className="rv-tiles">
        <Tile
          label="Average parse"
          value={s.avgParse ?? "–"}
          color={parseColor(s.avgParse)}
          sub={
            s.avgParse == null
              ? healer ? "Warcraft Logs didn't rank your healing" : "no ranked kills"
              : `your usual ${s.ownAvgParseBefore ?? "–"} · raid's ${s.raidMedianParse ?? "–"}`
          }
        />
        <Tile label="Deaths" value={deaths.length} color={deaths.length ? "#f08791" : "#3fcf8e"} sub={deaths.length ? [...new Set(deaths.map((d) => d.boss))].join(", ") : "not once"} />
        <Tile
          label="Consumables per boss pull"
          value={s.consumes?.perPull ?? "–"}
          color={s.consumes && s.consumes.perPull >= s.consumes.roleMedian ? "#3fcf8e" : "var(--gold-bright)"}
          sub={s.consumes ? `others in your role: ${s.consumes.roleMedian}` : "no buff data"}
        />
        <Tile label="World buffs" value={firstWb == null ? "–" : `${firstWb} → ${lastWb ?? "?"}`} sub="first boss → last boss" />
      </div>

      <div className="rv-cols">
        <div className="rv-list good">
          <h4>What went well</h4>
          {v.good.map((x, i) => (
            <Point key={i} x={x} bosses={s.bosses} icon="✓" />
          ))}
        </div>
        <div className="rv-list fix">
          <h4>What to fix</h4>
          {v.fix.map((x, i) => (
            <Point key={i} x={x} bosses={s.bosses} icon="!" />
          ))}
        </div>
      </div>

      <BossRows s={s} notes={v.bosses || {}} />
      {wb.length > 0 && <BuffGrid wb={wb} icons={r.icons} />}
      {s.consumes && <Consumes c={s.consumes} icons={r.icons} />}

      <footer className="rv-foot">
        Written by {v.model || "Claude"} from the logs of {fmtDate(r.date || r.night.slice(0, 10))}. Only you can see this page.
      </footer>
    </article>
  );
}

function Tile({ label, value, sub, color }) {
  return (
    <div className="rv-tile">
      <span className="rv-tile-label">{label}</span>
      <b style={color ? { color } : undefined}>{value}</b>
      {sub && <small>{sub}</small>}
    </div>
  );
}

function Point({ x, bosses, icon }) {
  const boss = x.boss && bosses.find((b) => b.id === x.boss);
  return (
    <div className="rv-point">
      <span className={`rv-point-ic ${x.impact || ""}`} aria-hidden="true">{icon}</span>
      <div>
        <div className="rv-point-title">
          {boss && <BossIcon id={boss.id} name={boss.name} size={18} />}
          <b>{x.title}</b>
          {x.impact && <span className={`rv-impact ${x.impact}`}>{x.impact === "high" ? "big deal" : x.impact === "medium" ? "worth fixing" : "small"}</span>}
        </div>
        <p>{x.text}</p>
      </div>
    </div>
  );
}

// Boss by boss: parse bar with your own usual marked, time spent doing
// something, deaths, and Claude's note for that boss.
function BossRows({ s, notes }) {
  const healer = s.role === "healer";
  return (
    <div className="rv-bosses">
      <div className="rv-section-head">
        <h4>Boss by boss</h4>
        <span className="rv-legend">
          <i className="rv-legend-tick" /> your usual parse there · <b>active</b> = share of the fight you were casting, swinging or shooting
        </span>
      </div>
      {s.bosses.map((b) => {
        const note = notes[b.id];
        const lowActive = b.active != null && b.activeMedian != null && b.active < b.activeMedian - 12;
        return (
          <div key={b.id} className="rv-boss">
            <div className="rv-boss-row">
              <BossIcon id={b.id} name={b.name} size={26} />
              <span className="rv-boss-name">{b.name}</span>
              <div className="rv-bar" title={b.parse != null ? `Parse ${b.parse}${b.own != null ? ` · your usual ${b.own}, best ${b.best}` : ""}` : "not ranked"}>
                {b.parse != null ? (
                  <>
                    <div className="rv-bar-fill" style={{ width: `${Math.max(b.parse, 2)}%`, background: parseColor(b.parse) }} />
                    {b.own != null && <i className="rv-bar-tick" style={{ left: `${b.own}%` }} />}
                  </>
                ) : (
                  <span className="rv-bar-none">{b.perSec != null ? `${b.perSec.toLocaleString()} ${healer ? "HPS" : "DPS"}${b.rank ? ` · ${b.rank.replace(/ (healers|dps|tanks)$/, " of the $1")}` : ""}` : "not ranked"}</span>
                )}
              </div>
              <span className="rv-parse-num" style={{ color: parseColor(b.parse) }}>{b.parse ?? ""}</span>
              <span className={`rv-active${lowActive ? " low" : ""}`} title={b.activeMedian != null ? `others in your role: ${b.activeMedian}%` : undefined}>
                {b.active != null ? `${b.active}%` : ""}
              </span>
              <span className="rv-deaths" aria-label={b.deaths ? `${b.deaths} deaths` : "no deaths"}>{b.deaths ? "💀".repeat(Math.min(b.deaths, 3)) : ""}</span>
            </div>
            {note && (
              <div className={`rv-boss-note ${note.tone || "info"}`}>
                <i className={`rr-llm-dot ${note.tone || "info"}`} />
                {note.text}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Which world buffs you had at each boss pull.
function BuffGrid({ wb, icons }) {
  const names = [...new Set(wb.flatMap((p) => p.buffs || []))];
  if (!names.length) return null;
  const short = (n) => n.replace("Rallying Cry of the Dragonslayer", "Rallying Cry").replace("Spirit of Zandalar", "Zandalar").replace("Songflower Serenade", "Songflower").replace(/Sayge's Dark Fortune of /, "Sayge's ").replace("Dragonslayer", "");
  return (
    <div className="rv-wb">
      <div className="rv-section-head">
        <h4>World buffs, pull by pull</h4>
        <span className="rv-legend">lost on death, so a gap after a death is what it cost</span>
      </div>
      <div className="rv-wb-scroll">
        <table className="rv-wb-grid">
          <thead>
            <tr>
              <th />
              {wb.map((p, i) => (
                <th key={i} className={p.kill ? "" : "wipe"} title={`${p.boss}${p.kill ? "" : " (wipe)"}`}>
                  <BossIcon id={p.id} name={p.boss} size={20} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {names.map((n) => (
              <tr key={n}>
                <th>
                  <SpellIcon name={n} icons={icons} size={16} />
                  <span>{short(n)}</span>
                </th>
                {wb.map((p, i) => (
                  <td key={i} className={p.buffs == null ? "na" : p.buffs.includes(n) ? "on" : "off"} title={`${p.boss}: ${p.buffs == null ? "no snapshot" : p.buffs.includes(n) ? "had it" : "gone"}`} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const GROUPS = ["flask", "elixir", "zanza", "juju", "food", "drink"];
function Consumes({ c, icons }) {
  const rows = GROUPS.flatMap((g) => (c.groups[g] || []).map((x) => ({ g, ...parse(x) })));
  if (!rows.length) return null;
  return (
    <div className="rv-cons">
      <div className="rv-section-head">
        <h4>Consumables on boss pulls</h4>
        <span className="rv-legend">{c.pulls} boss pulls</span>
      </div>
      <div className="rv-cons-list">
        {rows.map((x) => (
          <div key={x.name} className="rv-cons-item" title={`${x.name}: ${x.n} of ${c.pulls} boss pulls`}>
            <SpellIcon name={x.name} icons={icons} size={22} />
            <span className="rv-cons-name">{x.name}</span>
            <span className="rv-cons-bar"><i style={{ width: `${(100 * x.n) / c.pulls}%` }} className={x.n >= c.pulls - 1 ? "full" : ""} /></span>
            <span className="rv-cons-n">{x.n}/{c.pulls}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function parse(s) {
  const m = s.match(/^(.*) (\d+)\/(\d+)$/);
  return m ? { name: m[1], n: +m[2] } : { name: s, n: 0 };
}
