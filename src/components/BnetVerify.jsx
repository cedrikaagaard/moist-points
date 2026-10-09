import { useState } from "react";
import { useIdentity, setMe } from "../identity.js";
import { rosterOf, classColor, specIcon } from "../lib/roster.js";

// Battle.net login on My Page. Three states:
// - <BnetLogin /> on the "who are you?" screen: log in, or pick by hand below it
// - <AccountBar /> above your page: logged in (your characters, switcher, log out)
//   or one quiet line when you only picked a name
// - <LockedReviews /> in the Reviews tab until you log in

const BNET_BLUE = "#148eff";

function loginError() {
  const q = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  return q.get("bnet") === "error" ? q.get("reason") || "unknown error" : null;
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
          <b>Your own raid reviews.</b> Claude goes through the logs of every raid you were in and writes you a personal
          review: what you did well, what to fix, and when the wipe was your fault. Only you can read yours.
        </div>
      </div>
      {error && <div className="bnet-error">Battle.net login didn't work ({error}). Try again?</div>}
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
  if (!id.verified)
    return (
      <div className="acct-bar acct-bar-quiet">
        <div className="acct-state">
          <span className="acct-dot off" aria-hidden="true" />
          <span>Picked on this device, not logged in</span>
        </div>
        <div className="acct-end">
          <a href="/api/auth/login" className="acct-login">Log in with Battle.net</a>
        </div>
      </div>
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
        {id.owned.length === 0 && <span className="muted">No characters on Firemaw on this Battle.net account.</span>}
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
          Claude has read the logs of your raids and has opinions. A personal review per raid: what went well, what to fix,
          and who to blame. Log in with Battle.net to prove this is you; nobody else can read yours.
        </p>
        {error && <div className="bnet-error">Battle.net login didn't work ({error}). Try again?</div>}
        <WhatWeCollect />
      </div>
      <div className="acct-locked-cta">
        <BnetButton />
      </div>
    </div>
  );
}
