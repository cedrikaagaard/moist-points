import { lazy, Suspense, useState } from "react";
import { RaidBadge, Avatar } from "./common.jsx";
import ProfileBody from "./ProfileBody.jsx";
import { rosterOf, classColor } from "../lib/roster.js";
import { href } from "../router.js";
import "../raids/raids.css";

const RaidProfile = lazy(() => import("../raids/RaidProfile.jsx"));

const TAB_KEY = "moist.profileTab";
const readTab = () => {
  try {
    return localStorage.getItem(TAB_KEY) || "raids";
  } catch {
    return "raids";
  }
};

// One page per raider - used by Raiders (#/players/<name>) and My Page.
// Two tabs: their raid record (from Warcraft Logs) and their SR points.
// `player` is their SR data (null if they've never soft-reserved).
export default function PlayerPage({ data, name, player, isMe, onChangeMe }) {
  const r = rosterOf(name);
  const [tab, setTabState] = useState(readTab);
  const setTab = (t) => {
    setTabState(t);
    try {
      localStorage.setItem(TAB_KEY, t);
    } catch {
      /* per-device convenience only */
    }
  };
  const display = r?.name || player?.name || name;
  // Class + the role they actually play (inferred from casts; Warcraft Logs
  // can't tell specs apart in Classic Era).
  const who = r?.class || "";

  return (
    <div className="view">
      <div className="rr-banner rr-banner-night rr-player-banner" style={{ "--zone": classColor(r?.class) }}>
        <div className="rr-banner-nav">
          <nav className="rr-crumbs">
            {isMe ? <span>Your page</span> : <a href={href("players")}>Raiders</a>}
            {!isMe && (
              <span>
                <span className="rr-crumb-sep">/</span>
                <span>{display}</span>
              </span>
            )}
          </nav>
          {isMe && (
            <button className="link-btn" onClick={onChangeMe}>
              Not you? Change
            </button>
          )}
        </div>
        <div className="rr-banner-main">
          <Avatar name={display} size="lg" />
          <div>
            <div className="rr-kicker">
              <span className="rr-kicker-dot" aria-hidden="true">◆</span>
              {isMe ? "Your page" : "Raider"}
              {who && ` · ${who}`}
              {r?.role && ` · ${r.role === "dps" ? "DPS" : r.role === "healer" ? "Healer" : "Tank"}`}
            </div>
            <h1 style={r?.class ? { color: classColor(r.class) } : undefined}>{display}</h1>
            {player && (
              <div className="player-card-raids">
                {player.raids.map((x) => (
                  <RaidBadge key={x} raid={x} size="sm" />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="rr-banner-stats">
          <div><b>{r?.nights ?? 0}</b><span>raids logged</span></div>
          <div><b>{player ? player.totalPoints.toLocaleString() : 0}</b><span>SR points</span></div>
          <div><b>{player ? player.srCount : 0}</b><span>soft-reserves</span></div>
        </div>
      </div>

      <div className="page-tabs" role="tablist">
        {[
          { key: "raids", label: "Raid record", icon: "https://assets.rpglogs.com/img/warcraft/zones/zone-2006.png" },
          { key: "sr", label: "SR points", icon: "https://wow.zamimg.com/images/wow/icons/medium/inv_misc_coin_02.jpg" },
        ].map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={`page-tab${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>
            <img src={t.icon} alt="" width="20" height="20" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "raids" ? (
        <Suspense fallback={<div className="muted rr-loading">Loading raid record…</div>}>
          <RaidProfile name={display} />
        </Suspense>
      ) : player ? (
        <ProfileBody data={data} player={player} />
      ) : (
        <div className="empty me-empty">
          <p>
            No points or soft-reserves recorded for <strong>{display}</strong> yet.
          </p>
          <p className="muted">
            Once they SR items in a raid, the points, history and odds of winning each roll show up here. Points build up
            10 per SR (5 in Naxxramas) and carry over until the item is won.
          </p>
        </div>
      )}
    </div>
  );
}
