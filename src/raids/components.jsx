import { useCallback, useState } from "react";
import { href } from "../router.js";
import { bossImg, classColor, FALLBACK_ICON, iconFor, specImg, zoneImg, zoneOf } from "./assets.js";

// ---------- Icons ----------

function Img({ src, alt, size, className = "", round }) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className={`rr-ic${round ? " round" : ""} ${className}`}
      onError={(e) => {
        if (e.currentTarget.src !== FALLBACK_ICON) e.currentTarget.src = FALLBACK_ICON;
      }}
    />
  );
}

export const SpellIcon = ({ name, icons, size = 22 }) => <Img src={iconFor(name, icons)} alt={name} size={size} />;
export const BossIcon = ({ id, name, size = 32 }) => <Img src={bossImg(id)} alt={name} size={size} className="rr-boss-ic" />;
export const ZoneIcon = ({ id, size = 40 }) => <Img src={zoneImg(id)} alt={zoneOf(id).name} size={size} className="rr-zone-ic" />;
export const ClassIcon = ({ cls, spec, size = 18 }) =>
  cls ? <Img src={specImg(spec || cls)} alt={spec || cls} size={size} round /> : <span className="rr-ic-blank" style={{ width: size, height: size }} />;

// A player's name in their class colour, with the class/spec icon - linking to
// their profile (#/players/<name>, which has their SR points and raid record).
// Pass link={false} inside other links or tooltips.
export function Player({ name, cls, spec, size = 16, link = true }) {
  const body = (
    <>
      <ClassIcon cls={cls} spec={spec} size={size} />
      <span style={{ color: classColor(cls) }}>{name}</span>
    </>
  );
  return link ? (
    <a className="rr-player rr-player-link" href={href("players", name)}>{body}</a>
  ) : (
    <span className="rr-player">{body}</span>
  );
}

// ---------- Tooltip ----------

// One floating tooltip per chart: const [tip, bind] = useTip(); ... <g {...bind(content)}>
export function useTip() {
  const [tip, setTip] = useState(null);
  const bind = useCallback(
    (content) => ({
      onMouseEnter: (e) => setTip({ x: e.clientX, y: e.clientY, content }),
      onMouseMove: (e) => setTip({ x: e.clientX, y: e.clientY, content }),
      onMouseLeave: () => setTip(null),
    }),
    []
  );
  const el = tip && (
    <div className="rr-tip" style={{ left: tip.x, top: tip.y }}>
      {tip.content}
    </div>
  );
  return [el, bind];
}

// ---------- Ranked bars ----------

// rows: [{ key, label (node), value, color?, note? }] - one bar per row, scaled to the top value.
export function BarList({ rows, format = (v) => v, empty = "Nothing here yet." }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <div className="muted rr-empty-sm">{empty}</div>;
  return (
    <ol className="rr-bars">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="rr-bar-label">{r.label}</div>
          <div className="rr-bar-track">
            <div className="rr-bar-fill" style={{ width: `${(r.value / max) * 100}%`, background: r.color || "var(--gold)" }} />
          </div>
          <div className="rr-bar-val">{format(r.value)}</div>
          {r.note && <div className="rr-bar-note muted">{r.note}</div>}
        </li>
      ))}
    </ol>
  );
}

export function Panel({ title, sub, children, className = "", right }) {
  return (
    <section className={`panel rr-panel ${className}`}>
      <div className="panel-head">
        <h2>{title}</h2>
        {right || (sub && <span className="muted">{sub}</span>)}
      </div>
      {children}
    </section>
  );
}

export function Tile({ value, label, sub, accent }) {
  return (
    <div className="stat-tile">
      <div className="stat-value" style={accent ? { color: accent } : undefined}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="rr-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={value === t.key}
          className={`rr-tab${value === t.key ? " active" : ""}`}
          onClick={() => onChange(t.key)}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Page banner ----------
// Two kinds, deliberately distinct so you always know where you are:
//   kind="night"   - one raid night (dated, zone-coloured stripe)
//   kind="history" - the guild's all-time record (gold frame, no date)
// crumbs: [{ label, href }] - the path back up; nav: optional node on the right.
export function Banner({ kind, accent, art = [], kicker, title, sub, crumbs = [], nav, stats = [] }) {
  return (
    <div className={`rr-banner rr-banner-${kind}`} style={{ "--zone": accent }}>
      {art[0] && <div className="rr-banner-bg" style={{ backgroundImage: `url(${art[0]})` }} />}
      <div className="rr-banner-nav">
        <nav className="rr-crumbs" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={i}>
              {i > 0 && <span className="rr-crumb-sep">/</span>}
              {c.href ? <a href={c.href}>{c.label}</a> : <span>{c.label}</span>}
            </span>
          ))}
        </nav>
        {nav && <span className="rr-banner-pn">{nav}</span>}
      </div>
      <div className="rr-banner-main">
        <div className="rr-banner-zones">
          {art.map((src) => (
            <img key={src} src={src} alt="" width="72" height="72" className="rr-ic rr-zone-ic" />
          ))}
        </div>
        <div>
          <div className="rr-kicker">
            <span className="rr-kicker-dot" aria-hidden="true">{kind === "night" ? "◆" : "♜"}</span>
            {kicker}
          </div>
          <h1>{title}</h1>
          {sub && <div className="rr-banner-sub">{sub}</div>}
        </div>
      </div>
      {stats.length > 0 && (
        <div className="rr-banner-stats">
          {stats.map((s) => (
            <div key={s.label}>
              <b className={s.className}>{s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
