// "Who am I". Two ways to know:
// - Verified: the user logged in with Battle.net (netlify/functions/auth.mjs)
//   and owns these characters. Then "me" is one of *their* guild characters
//   (their main by default: the one with the most raids), every one of their
//   characters counts as "me" for highlighting, and the manual pick no longer
//   applies.
// - Not verified: a name the user picked once, saved in localStorage.
// Readable anywhere via useMe() / useIdentity(); makeIsMe() builds the
// "is this row mine?" check.
import { useSyncExternalStore } from "react";
import roster from "./raids/data/roster.json";

const KEY = "moist:me"; // manual pick, or which verified character is active
const REALM = "firemaw";

const state = {
  manual: safeGet(),
  verified: false,
  loading: true,
  owned: [], // verified guild characters, main first
  version: 0,
};
const subs = new Set();
const emit = () => {
  state.version++;
  subs.forEach((f) => f());
};

function safeGet() {
  try {
    return localStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
}
function safeSet(v) {
  try {
    if (v) localStorage.setItem(KEY, v);
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode / storage disabled - still works for the session */
  }
}

// Ask the site which characters this browser has proven with Battle.net.
// Missing endpoint (local dev) or not logged in: stays unverified.
if (typeof fetch !== "undefined") {
  fetch("/api/me", { credentials: "same-origin" })
    .then((r) => (r.ok && r.headers.get("content-type")?.includes("json") ? r.json() : null))
    .catch(() => null)
    .then((d) => {
      state.loading = false;
      if (d?.verified) {
        const firemaw = (d.characters || []).filter((c) => c.realm === REALM).map((c) => c.name);
        const raids = (n) => roster[n]?.nights || 0;
        // Guild characters first (the ones the raid logs know), main = most raids.
        const known = firemaw.filter((n) => roster[n]);
        state.verified = true;
        state.owned = (known.length ? known : firemaw).sort((a, b) => raids(b) - raids(a));
        state.allFiremaw = firemaw;
      }
      emit();
    });
}

function activeMe() {
  if (state.verified && state.owned.length) {
    const pick = state.manual && state.owned.find((n) => n.toLowerCase() === state.manual.toLowerCase());
    return pick || state.owned[0];
  }
  return state.manual;
}

export function setMe(name) {
  name = name ? name.trim() : null;
  // Verified users can only switch between their own characters.
  if (state.verified && name && !state.owned.some((n) => n.toLowerCase() === name.toLowerCase())) return;
  state.manual = name;
  safeSet(name);
  emit();
}

const subscribe = (cb) => {
  subs.add(cb);
  return () => subs.delete(cb);
};

export function useMe() {
  useSyncExternalStore(subscribe, () => state.version);
  return activeMe();
}

// { me, verified, loading, owned: [names], allFiremaw: [names] }
export function useIdentity() {
  useSyncExternalStore(subscribe, () => state.version);
  return { me: activeMe(), verified: state.verified, loading: state.loading, owned: state.owned, allFiremaw: state.allFiremaw || [] };
}

// Case-insensitive "is this name me?"; a verified user's alts count too.
export function makeIsMe(meName) {
  const mine = new Set([meName, ...(state.verified ? state.owned : [])].filter(Boolean).map((n) => n.toLowerCase()));
  return (name) => !!name && mine.has(name.toLowerCase());
}
