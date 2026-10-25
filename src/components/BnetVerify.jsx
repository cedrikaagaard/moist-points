import { useState } from "react";
import { useIdentity, setMe } from "../identity.js";
import { rosterOf, classColor, specIcon } from "../lib/roster.js";

// Battle.net login on My Page. Three states:
// - <BnetLogin /> on the "who are you?" screen: log in, or pick by hand below it
// - <AccountBar /> above your page: logged in (your characters, switcher, log out)
//   or one quiet line when you only picked a name
// - <LockedReviews /> in the Reviews tab until you log in

const BNET_BLUE = "#148eff";

// Back from Blizzard with an OK, but the browser didn't keep the login cookie.
function loginLost(verified) {
  const q = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  return q.get("bnet") === "ok" && !verified;
}

function loginError() {
  const q = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  return q.get("bnet") === "error" ? q.get("reason") || "unknown error" : null;
}

function LoginError({ error }) {
  // Blizzard remembers a refused permission, so "try again" alone won't fix these two.
  const permission = /\[(SCOPE|PROFILE-403)\]/.test(error);
  return (
    <div className="bnet-error">
      Battle.net login didn't work: {error}.
      {permission ? (
        <ol className="bnet-steps">
          <li>
            Blizzard remembers that choice, so logging in again won't ask. Go to <a href="https://account.battle.net/connections" target="_blank" rel="noreferrer">account.battle.net/connections</a> (or
            Security, Authorized applications), and remove this site.
          </li>
          <li>Then log in here again, leaving <b>World of Warcraft profile</b> ticked.</li>
          <li>Still failing? Screenshot this and send it in the guild Discord.</li>
        </ol>
      ) : (
        <> Try again, and if it keeps failing, screenshot this and send it in the guild Discord.</>
      )}
    </div>
  );
}

export function BnetButton({ children = "Log in with Battle.net" }) {
  return (
    <a className="bnet-btn" href="/api/auth/login" style={{ "--bnet": BNET_BLUE }}>
      <BnetLogo />
      {children}
    </a>
  );
}

function BnetLogo() {
  return (
    <svg className="bnet-logo" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M8 7.5h5.2a2.4 2.4 0 0 1 0 4.8H8m0 0h5.8a2.6 2.6 0 0 1 0 5.2H8z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

// What we get from Blizzard and why: shown before anyone logs in.
export function WhatWeCollect({ open: startOpen = false }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <div className="bnet-privacy">
      <button type="button" className="link-btn" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? "▾" : "▸"} What does the site get from Battle.net?
      </button>
      {open && (
        <ul>
          <li>
            The list of WoW characters on your account: <b>name, realm, class and level</b>. That's all we ask Blizzard for.
          </li>
          <li>No email, no password, no BattleTag. You log in on Blizzard's own page.</li>
          <li>The list is kept in a cookie in your browser for 30 days. Nothing is saved on our side, and logging out deletes it.</li>
          <li>It's only used to know which characters are yours: your page, your rows highlighted, and your private raid reviews.</li>
        </ul>
      )}
    </div>
  );
}

// The "who are you?" screen: Battle.net first, picking by hand as the fallback.
export function BnetLogin() {
  const error = loginError();
  return (
    <div className="bnet-login">
      <div className="bnet-perk">
        <span className="bnet-perk-icon" aria-hidden="true">✨</span>
        <div>
          <b>Your own raid reviews.</b> An AI goes through the logs of every raid you were in and writes you a personal
          review: what you did well, what to fix, and when the wipe was your fault. Only you can read yours.
        </div>
      </div>
      {error && <LoginError error={error} />}
      <BnetButton />
      <div className="bnet-sub">All your characters at once, no typing.</div>
      <WhatWeCollect />
    </div>
  );
}

// Above your page.
export function AccountBar() {
  const id = useIdentity();
  if (id.loading) return null;
  const error = loginError();
  const lost = loginLost(id.verified);
  if (!id.verified)
    return (
      <>
      {error && <LoginError error={error} />}
      {lost && (
        <div className="bnet-error">
          Blizzard said yes, but your browser didn't keep the login. Allow cookies for this site, or open it in your normal browser instead of
          Discord's built-in one, and try again. Still stuck? Screenshot this and send it in the guild Discord. <code>[COOKIE-LOST]</code>
        </div>
      )}
      <div className="acct-bar acct-bar-quiet">
        <div className="acct-state">
          <span className="acct-dot off" aria-hidden="true" />
          <span>Picked on this device, not logged in</span>
        </div>
        <div className="acct-end">
          <a href="/api/auth/login" className="acct-login">Log in with Battle.net</a>
        </div>
      </div>
      </>
    );

  const others = id.allFiremaw.filter((n) => !id.owned.includes(n));
  return (
    <div className="acct-bar">
      <div className="acct-state">
        <span className="acct-dot" aria-hidden="true" />
        <span>
          Logged in with <b>Battle.net</b>
        </span>
      </div>
      <div className="acct-chars" role="tablist" aria-label="Your characters">
        {id.owned.map((name) => {
          const r = rosterOf(name);
          return (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={name === id.me}
              className={`acct-char${name === id.me ? " active" : ""}`}
              style={{ "--cls": classColor(r?.class) }}
              onClick={() => setMe(name)}
              title={r ? `${r.class} · ${r.nights} raids logged` : name}
            >
              {r?.class && <img src={specIcon(r.class)} alt="" width="18" height="18" />}
              <span>{name}</span>
              {r?.nights > 0 && <small>{r.nights}</small>}
            </button>
          );
        })}
        {id.owned.length === 0 && (
          <span className="muted">
            Logged in, but none of the {id.total || 0} Classic character{id.total === 1 ? "" : "s"} on this Battle.net account are in Moist's raid logs
            {id.others.length ? ` (realms: ${id.others.join(", ")})` : ""}. If your raider is on another Battle.net account, log out and log in with that one.
            Otherwise screenshot this and send it in the guild Discord. <code>[NO-GUILD-CHARS]</code>
          </span>
        )}
      </div>
      <div className="acct-end">
        {others.length > 0 && <span className="muted" title={others.join(", ")}>+{others.length} not in the raid logs</span>}
        <a href="/api/auth/logout" className="acct-logout">Log out</a>
      </div>
    </div>
  );
}

export function LockedReviews() {
  const error = loginError();
  return (
    <div className="acct-locked">
      <div className="acct-locked-icon" aria-hidden="true">🔒</div>
      <div className="acct-locked-text">
        <b>Your raid reviews are locked.</b>
        <p>
          An AI has read the logs of your raids and has opinions. A personal review per raid: what went well, what to fix,
          and who to blame. Log in with Battle.net to prove this is you; nobody else can read yours.
        </p>
        {error && <LoginError error={error} />}
        <WhatWeCollect />
      </div>
      <div className="acct-locked-cta">
        <BnetButton />
      </div>
    </div>
  );
}
