import { lazy, Suspense, useState } from "react";
import { WowheadLink, RaidBadge, PlayerLink, Avatar } from "../components/common.jsx";
import { useMe } from "../identity.js";
import { rosterOf, classColor } from "../lib/roster.js";
import { href } from "../router.js";
import "../raids/raids.css";
import summaryMeta from "../raids/data/roster.json";

const HomeRaids = lazy(() => import("../raids/HomeRaids.jsx"));

const WELCOME_KEY = "moist.welcome.v2";
const seenWelcome = () => {
  try {
    return localStorage.getItem(WELCOME_KEY) === "1";
  } catch {
    return true;
  }
};

// The front door: everything Moist in one place - SR points, raid logs, you.
// `data` (SR points) may still be loading; the raid half doesn't need it.
export default function Home({ data }) {
  const me = useMe();
  const [welcome, setWelcome] = useState(() => !seenWelcome());
  const dismiss = () => {
    setWelcome(false);
    try {
      localStorage.setItem(WELCOME_KEY, "1");
    } catch {
      /* fine - it just shows again next time */
    }
  };
  const raiders = Object.keys(summaryMeta).length;
  const mine = me && data ? data.playerByName.get(me.toLowerCase()) : null;
  const myRoster = rosterOf(me);

  return (
    <div className="view rr home">
      <div className="rr-banner rr-banner-history home-hero">
        <div className="rr-banner-bg" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}logo.webp)` }} />
        <div className="rr-banner-main">
          <img src={`${import.meta.env.BASE_URL}logo.webp`} alt="" width="84" height="84" className="home-logo" />
          <div>
            <div className="rr-kicker"><span className="rr-kicker-dot" aria-hidden="true">♜</span>EU · Firemaw · Classic Era</div>
            <h1>Moist</h1>
            <div className="rr-banner-sub">Soft-reserve points, raid logs and everything in between.</div>
          </div>
        </div>
      </div>

      {welcome && (
        <section className="panel home-welcome">
          <div className="panel-head">
            <h2>New: one Moist site</h2>
            <button className="link-btn" onClick={dismiss}>Got it ×</button>
          </div>
          <ul>
            <li><b>SR Points</b> works just like before - points, history and stats for every item.</li>
            <li><b>Raid Logs</b> is new: every raid night from Warcraft Logs, with a timeline, boss pages, records and the quiet work that never shows up on a meter.</li>
            <li><b>Your page</b> now has your raid record too - parses over time, best parse per boss, decurses, kicks and more. Set your character to see it.</li>
            <li>Names show in class colour with a class icon - click any raider to open their page.</li>
          </ul>
        </section>
      )}

      <div className="home-cards">
        <a className="home-card" href={href("raids")} style={{ "--accent": "var(--raid-naxx)" }}>
          <div className="home-card-art" style={{ backgroundImage: "url(https://assets.rpglogs.com/img/warcraft/zones/zone-2006.png)" }} />
          <div className="home-card-kicker">Raid Logs</div>
          <div className="home-card-title">Every raid night, analysed</div>
          <div className="home-card-text muted">Timelines, boss records, clear times and standouts from the guild's Warcraft Logs.</div>
          <div className="home-card-go">Open raid logs →</div>
        </a>
        <a className="home-card" href={href("points")} style={{ "--accent": "var(--gold)" }}>
          <div className="home-card-art" style={{ backgroundImage: "url(https://wow.zamimg.com/images/wow/icons/large/inv_misc_coin_02.jpg)" }} />
          <div className="home-card-kicker">SR Points</div>
          <div className="home-card-title">Soft-reserve points</div>
          <div className="home-card-text muted">
            {data ? `${data.players.length} raiders with points across MC, BWL, AQ40 and Naxx - who's ahead on every item.` : "Points, SR history and loot for every tracked item."}
          </div>
          <div className="home-card-go">Open points →</div>
        </a>
        <a className="home-card" href={href("me")} style={{ "--accent": classColor(myRoster?.class) }}>
          {me ? (
            <div className="home-card-me">
              <Avatar name={me} size="lg" />
            </div>
          ) : (
            <div className="home-card-art" style={{ backgroundImage: "url(https://wow.zamimg.com/images/wow/icons/large/inv_misc_book_09.jpg)" }} />
          )}
          <div className="home-card-kicker">Your page</div>
          <div className="home-card-title" style={myRoster?.class ? { color: classColor(myRoster.class) } : undefined}>{me || "Who are you?"}</div>
          <div className="home-card-text muted">
            {me
              ? `${myRoster?.nights ?? 0} raid nights logged${mine ? ` · ${mine.totalPoints.toLocaleString()} SR points` : ""}`
              : "Pick your character to see your points, odds and raid record."}
          </div>
          <div className="home-card-go">{me ? "Open your page →" : "Set your character →"}</div>
        </a>
      </div>

      <Suspense fallback={null}>
        <HomeRaids />
      </Suspense>

      {data && data.lootFeed?.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <h2>Recent loot</h2>
            <a className="rr-compare-link" href={href("stats")}>SR statistics →</a>
          </div>
          <ul className="loot-feed">
            {data.lootFeed.slice(0, 8).map((w, i) => (
              <li key={i}>
                <span className="loot-date">{w.date}</span>
                <RaidBadge raid={w.raid} size="xs" />
                <WowheadLink id={w.itemId} name={w.item} className="item-name loot-item" />
                <span className="loot-arrow">→</span>
                <PlayerLink name={w.character} className="loot-winner" />
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="muted home-foot">{raiders} raiders seen in the logs so far.</p>
    </div>
  );
}
