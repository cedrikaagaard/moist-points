// Nights built from a raw combat log while Warcraft Logs was down
// (scripts/raids/rawlog.mjs). #/moistlogs/<raid> is the link for Discord: the
// normal raid page under a "Moist got you" header.
import { href } from "../router.js";
import { NIGHTS } from "./data.js";
import "./raids.css";

// A line for one raid under the title, when the night earned one.
const TAGLINE = {
  "2026-10-21-naxx":
    "Warcraft Logs went down tonight, which makes it the second thing in this guild known for not showing up when the raid needs it. Skooma still holds the title. Warcraft Logs at least has a status page.",
};

export function MoistLogsHero({ night }) {
  // Once the real Warcraft Logs report is in, the raid is rebuilt from it and this
  // page keeps working as a link, with a note instead of the estimate warning.
  const entry = NIGHTS.find((x) => x.night === night);
  const replaced = entry && !entry.localLog;
  return (
    <div className="view rr ml-wrap">
      <section className="ml-hero">
        <div className="ml-hero-tag">Temporary stand-in</div>
        <h1>
          Warcraft Logs down? <span>No worries, Moist got you.</span>
        </h1>
        {TAGLINE[night] && <p className="ml-hero-tagline">{TAGLINE[night]}</p>}
        {replaced ? (
          <p className="ml-hero-warn">
            <b>Warcraft Logs is back.</b> This raid was first read from the raw combat log while Warcraft Logs was down. The real Warcraft Logs report is in
            now, so everything below, parses included, comes from it.
          </p>
        ) : (
          <>
        <p>
          Warcraft Logs couldn't take uploads tonight, so this raid was read straight from the raw combat log. Same pages as any other raid on the site:
          pulls, deaths, damage, healing, mechanics, replays.
        </p>
        <p className="ml-hero-warn">
          <b>Parses are a rough estimate, not real Warcraft Logs parses.</b> Warcraft Logs ranks you against every log in the world, and that ranking doesn't
          exist for this raid. So each parse here is guessed from the guild's own past Warcraft Logs parses for that boss and class: "this much DPS usually got
          you about this parse". Tested against a raid that does have real parses, DPS came out about 4 points off on average, healers about 7 and tanks about
          10, and a single parse can be off by a lot more.
        </p>
          </>
        )}
        {night && (
          <div className="ml-hero-links">
            <a href={href("raids", night)}>Open as a normal raid page</a>
            <a href={href("raids")}>All raid logs</a>
          </div>
        )}
      </section>
    </div>
  );
}

// The strip on a raw-log night's own pages.
export function LocalLogNote({ n }) {
  if (!n?.localLog) return null;
  return (
    <div className="ml-note">
      <b>Built from the raw combat log</b> while Warcraft Logs was down. Parses are rough estimates, not real Warcraft Logs parses.{" "}
      <a href={href("moistlogs", n.night)}>About this</a>
    </div>
  );
}

// #/moistlogs without a raid: the newest raw-log raid, else the newest raid.
export function latestLocal() {
  return (NIGHTS.find((x) => x.localLog) || NIGHTS[0])?.night ?? null;
}
