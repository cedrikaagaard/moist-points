import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { loadData } from "./data.js";
import { useHashRoute, navigate, href } from "./router.js";
import Overview from "./views/Overview.jsx";
import Points from "./views/Points.jsx";
import Players from "./views/Players.jsx";
import History from "./views/History.jsx";
import Me from "./views/Me.jsx";
import Item from "./views/Item.jsx";
import Changelog from "./views/Changelog.jsx";
import Home from "./views/Home.jsx";
import Loader from "./components/Loader.jsx";
import { GitHubIcon } from "./components/common.jsx";
import { useMe, useIdentity } from "./identity.js";
import { allRaiders } from "./lib/roster.js";
import { VERSION, REPO_URL } from "./changelog.js";

// Raid recaps (from Warcraft Logs) live in src/raids/, separate from the SR data.
const RaidsView = lazy(() => import("./raids/RaidsView.jsx"));

// Grouped: you, the SR points pages, the raid pages. `group` starts a new
// visual group in the nav.
const NAV = [
  { view: "home", label: "Home" },
  { view: "me", label: "My Page" },
  { view: "points", label: "SR Points", group: true },
  { view: "history", label: "SR History" },
  { view: "stats", label: "SR Stats" },
  { view: "players", label: "Raiders" },
  { view: "raids", label: "Raid Logs", group: true },
];

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("engine");
  const { view, param, sub } = useHashRoute();
  const standalone = view === "changelog" || view === "home" || view.startsWith("raid"); // pages that don't need the SR data
  const hasPageSearch = view === "points" || view === "players" || view === "history";

  useEffect(() => {
    // onFresh swaps in the newest data if the background check finds a newer
    // version after the fast cached copy has already rendered.
    loadData({ onProgress: setStep, onFresh: setData })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  // Scroll to top on route change.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, param, sub]);

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#/">
          <img src={`${import.meta.env.BASE_URL}logo.webp`} alt="Moist" className="brand-logo" />
          <div className="brand-text">
            <span className="brand-name">Moist</span>
            <span className="brand-sub">EU · Firemaw</span>
          </div>
        </a>
        <nav className="nav">
          {NAV.map((n) => (
            <a
              key={n.view}
              href={href(n.view)}
              className={`nav-link${n.group ? " nav-group" : ""}${view === n.view || (n.view === "raids" && view.startsWith("raid")) ? " active" : ""}`}
            >
              {n.label}
            </a>
          ))}
        </nav>
        <MeChip active={view === "me"} />
        {data && <GlobalSearch data={data} compactMobile={hasPageSearch} />}
      </header>

      <main className="content">
        {view === "changelog" && <Changelog />}
        {view === "home" && <Home data={data} />}
        {view.startsWith("raid") && (
          <Suspense fallback={null}>
            <RaidsView view={view} param={param} sub={sub} />
          </Suspense>
        )}
        {error && !standalone && <div className="empty error">Couldn’t load data: {error}</div>}
        {!data && !error && !standalone && <Loader step={step} />}
        {data && view === "me" && <Me data={data} param={param} sub={sub} />}
        {data && view === "stats" && <Overview data={data} />}
        {data && view === "points" && <Points data={data} raid={param} />}
        {data && view === "players" && <Players data={data} name={param} />}
        {data && view === "history" && <History data={data} />}
        {data && view === "item" && <Item data={data} id={param} />}
      </main>

      <footer className="footer">
        {/* Links kept on the left: Netlify's injected badge sits in the
            bottom-right corner and would otherwise cover them. */}
        <span className="footer-links">
          <a href={href("changelog")} className="footer-link">v{VERSION}</a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="footer-link footer-gh"
            aria-label="View the source on GitHub"
            title="GitHub"
          >
            <GitHubIcon size={16} />
          </a>
        </span>
        <span className="footer-meta">
          {data ? (
            <>
              {data.dataThrough ? (
                <>Data current through <strong>{data.dataThrough}</strong></>
              ) : (
                `Loaded ${data.updated}`
              )}
              {data.dbUpdated && (
                <>
                  {" · database updated "}
                  <span title={new Date(data.dbUpdated).toLocaleString()}>
                    {timeAgo(data.dbUpdated)}
                  </span>
                </>
              )}
              {data.source && data.source !== "remote" && (
                <span className="source-tag"> · {data.source} db</span>
              )}
            </>
          ) : (
            <span className="muted">live from the guild database</span>
          )}
        </span>
      </footer>
    </div>
  );
}

// Human "x ago" from an HTTP date string (e.g. Last-Modified).
function timeAgo(dateStr) {
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "recently";
  const secs = Math.max(0, (Date.now() - then) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [name, size] of units) {
    const n = Math.floor(secs / size);
    if (n >= 1) return `${n} ${name}${n > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

function MeChip({ active }) {
  const { me, verified } = useIdentity();
  if (!me) {
    return (
      <a className={`me-chip me-chip-empty${active ? " active" : ""}`} href={href("me")}>
        <span className="me-chip-avatar">?</span>
        Log in
      </a>
    );
  }
  return (
    <a className={`me-chip${active ? " active" : ""}`} href={href("me")} title={verified ? "Your page (verified with Battle.net)" : "Your page"}>
      <span className="me-chip-avatar">{me.slice(0, 2).toUpperCase()}</span>
      {me}
      {verified && <span className="me-chip-ok" aria-label="verified">✓</span>}
    </a>
  );
}

function GlobalSearch({ data, compactMobile }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const term = q.trim().toLowerCase();
  // SR raiders plus anyone the raid logs know (raid-only raiders have pages too).
  const everyone = useMemo(() => {
    const seen = new Set(data.players.map((p) => p.name.toLowerCase()));
    return [...data.players, ...allRaiders().filter((r) => !seen.has(r.name.toLowerCase()))];
  }, [data.players]);
  const matches = term ? everyone.filter((p) => p.name.toLowerCase().includes(term)).slice(0, 6) : [];

  return (
    <div
      className={`global-search${compactMobile ? " mobile-hide" : ""}`}
      onBlur={() => setTimeout(() => setOpen(false), 120)}
    >
      <input
        className="search sm"
        placeholder="⌕ Find a raider…"
        value={q}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && matches[0]) {
            navigate("players", matches[0].name);
            setQ("");
          }
        }}
      />
      {open && matches.length > 0 && (
        <div className="search-drop">
          {matches.map((p) => (
            <a
              key={p.name}
              href={href("players", p.name)}
              className="search-drop-item"
              onClick={() => setQ("")}
            >
              <span>{p.name}</span>
              <span className="muted">{p.totalPoints != null ? `${p.totalPoints.toLocaleString()} pts` : `${p.nights} raid nights`}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
