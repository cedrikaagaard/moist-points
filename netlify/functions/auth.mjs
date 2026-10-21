// Battle.net login: proves which WoW characters someone owns. Blizzard returns
// the characters on the logged-in account (Classic Era: the profile-classic1x
// namespace); we keep that list in a signed cookie. No passwords or emails ever
// reach us, and nothing is stored server-side.
//
//   /api/auth/login     -> Blizzard's login page
//   /api/auth/callback  <- Blizzard sends the user back here
//   /api/auth/logout    -> forget the session
//   /api/me             -> { verified, characters: [{ name, realm, class, level, faction }] }
//   /api/reviews        -> the private raid reviews of your own characters (data/reviews/)
//
// Needs BNET_CLIENT_ID, BNET_CLIENT_SECRET and SESSION_SECRET in Netlify's
// environment variables, and https://<site>/api/auth/callback registered as a
// redirect URL on the Blizzard client (develop.battle.net).
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const config = { path: ["/api/auth/login", "/api/auth/callback", "/api/auth/logout", "/api/me", "/api/reviews"] };

const AUTHORIZE = "https://oauth.battle.net/authorize";
const TOKEN = "https://oauth.battle.net/token";
const PROFILE = "https://eu.api.blizzard.com/profile/user/wow?namespace=profile-classic1x-eu&locale=en_GB";
const SESSION = "moist_session";
const STATE = "moist_oauth";
const DAYS = 30;

const env = (k) => (globalThis.Netlify?.env?.get?.(k) ?? process.env[k]) || "";

export default async (req) => {
  const url = new URL(req.url);
  const route = url.pathname;
  try {
    if (route === "/api/auth/login") return login(url);
    if (route === "/api/auth/callback") return await callback(req, url);
    if (route === "/api/auth/logout") return redirect("/#/me", [clear(SESSION)]);
    if (route === "/api/me") return me(req);
    if (route === "/api/reviews") return reviews(req);
  } catch (e) {
    console.error(e);
    // "[CODE] what happened", code first so it survives the length cap
    const m = e.message.match(/\s*\[([A-Z0-9-]+)\]$/);
    const reason = m ? `[${m[1]}] ${e.message.slice(0, m.index)}` : `[ERROR] ${e.message}`;
    return redirect(`/?bnet=error&reason=${encodeURIComponent(reason.slice(0, 160))}#/me`, [clear(STATE)]);
  }
  return new Response("Not found", { status: 404 });
};

function login(url) {
  if (!env("BNET_CLIENT_ID") || !env("SESSION_SECRET")) return new Response("Battle.net login isn't configured yet.", { status: 503 });
  const state = crypto.randomBytes(16).toString("hex");
  const auth = new URL(AUTHORIZE);
  auth.searchParams.set("client_id", env("BNET_CLIENT_ID"));
  auth.searchParams.set("redirect_uri", `${url.origin}/api/auth/callback`);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", "wow.profile");
  auth.searchParams.set("state", state);
  return redirect(auth.toString(), [cookie(STATE, state, 600)]);
}

async function callback(req, url) {
  const state = readCookie(req, STATE);
  // Error texts end in a short code, so a screenshot says which step failed.
  if (!state) throw new Error("the login cookie was missing when Blizzard sent you back (blocked cookies, or a different browser than you started in) [STATE-MISSING]");
  if (state !== url.searchParams.get("state")) throw new Error("the login took too long or was started twice [STATE-MISMATCH]");
  if (url.searchParams.get("error")) throw new Error(`Blizzard said: ${url.searchParams.get("error_description") || url.searchParams.get("error")} [BNET]`);

  const tok = await fetch(TOKEN, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${env("BNET_CLIENT_ID")}:${env("BNET_CLIENT_SECRET")}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code: url.searchParams.get("code") || "", redirect_uri: `${url.origin}/api/auth/callback` }),
  });
  if (!tok.ok) throw new Error(`Blizzard wouldn't hand over the login (${tok.status}) [TOKEN-${tok.status}]`);
  const { access_token } = await tok.json();

  const prof = await fetch(PROFILE, { headers: { Authorization: `Bearer ${access_token}` } });
  // 404 = the account has no Classic Era characters at all.
  if (!prof.ok && prof.status !== 404) throw new Error(`Blizzard's character list failed (${prof.status}) [PROFILE-${prof.status}]`);
  const data = prof.ok ? await prof.json() : { wow_accounts: [] };
  const all = (data.wow_accounts || []).flatMap((a) =>
    (a.characters || []).map((c) => ({
      name: c.name,
      realm: c.realm?.slug || "",
      class: c.playable_class?.name?.en_GB || c.playable_class?.name || null,
      level: c.level ?? null,
    }))
  );
  // Only guild characters go in the cookie: the site uses nothing else, and a
  // whole account's list (alts on every Era, Hardcore and Season realm) can pass
  // the browser's 4 KB cookie limit, which silently drops the login. The guild
  // raids cross-realm, so "guild character" = a raider in the logs on that same
  // realm, or anyone on one of the guild's realms (a recruit not logged yet).
  const { realms, raiders } = raiderRealms();
  const characters = all.filter((c) => raiders[c.name]?.includes(c.realm) || (realms.includes(c.realm) && !raiders[c.name]));
  const others = [...new Set(all.filter((c) => !characters.includes(c)).map((c) => c.realm))].slice(0, 8);
  const session = sign({ characters, total: all.length, others, exp: Date.now() + DAYS * 864e5 });
  return redirect("/?bnet=ok#/me", [cookie(SESSION, session, DAYS * 86400), clear(STATE)]);
}

function me(req) {
  const s = verify(readCookie(req, SESSION));
  const body = s
    ? { verified: true, characters: s.characters, total: s.total ?? s.characters.length, others: s.others || [], admin: isAdmin(s.characters) }
    : { verified: false, characters: [], admin: false };
  return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

// Reviews live in data/reviews/<raid id>.json (bundled with this function via
// netlify.toml's included_files), never in the site bundle: only the verified
// owner of a character gets that character's reviews.
//
// Site owner: verified ownership of one of these Firemaw characters unlocks
// every player's reviews (for checking what the reviews say). The check is
// name + realm, so a same-named character on another realm doesn't qualify.
const REALM = "firemaw";
const ADMINS = ["drikkle"];
const isAdmin = (characters) =>
  (characters || []).some((c) => c.realm === REALM && ADMINS.includes((c.name || "").toLowerCase()));
function dataPath(rel) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const tries = [process.cwd(), process.env.LAMBDA_TASK_ROOT, here, path.resolve(here, ".."), path.resolve(here, "../..")].filter(Boolean).map((d) => path.join(d, rel));
  return tries.find((d) => fs.existsSync(d)) || null;
}
const reviewDir = () => dataPath("data/reviews");
// data/raider-realms.json (scripts/raids/realms.mjs): the guild's realms and each raider's realm(s).
let realmCache = null;
function raiderRealms() {
  if (realmCache) return realmCache;
  const f = dataPath("data/raider-realms.json");
  realmCache = f ? JSON.parse(fs.readFileSync(f, "utf8")) : { realms: [REALM], raiders: {} };
  return realmCache;
}
let cache = null;
function allReviews() {
  if (cache) return cache;
  const dir = reviewDir();
  cache = dir ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))) : [];
  return cache;
}
function reviews(req) {
  const s = verify(readCookie(req, SESSION));
  if (!s) return json({ verified: false, admin: false, reviews: [], raidsWithReviews: allReviews().length }, 401);
  const admin = isAdmin(s.characters);
  // The cookie only holds guild characters (checked against the raiders' realms at login).
  const mine = new Set(s.characters.map((c) => c.name.toLowerCase()));
  const out = [];
  for (const raid of allReviews()) {
    for (const [name, p] of Object.entries(raid.players || {})) {
      if (!p.review || (!admin && !mine.has(name.toLowerCase()))) continue;
      out.push({ night: raid.night, date: raid.date, zones: raid.zones, zoneIds: raid.zoneIds, icons: raid.icons, kind: raid.kind, raiders: raid.raiders, durationMin: raid.durationMin, player: name, stats: p.stats, review: p.review });
    }
  }
  out.sort((a, b) => (a.night < b.night ? 1 : -1));
  return json({ verified: true, admin, reviews: out });
}
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" } });
}

// ---- signed cookie: base64url(json).hmac ----
function sign(obj) {
  const body = Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${body}.${hmac(body)}`;
}
function verify(value) {
  if (!value || !env("SESSION_SECRET")) return null;
  const [body, mac] = value.split(".");
  const want = Buffer.from(hmac(body || ""));
  if (!body || !mac || Buffer.from(mac).length !== want.length || !crypto.timingSafeEqual(Buffer.from(mac), want)) return null;
  try {
    const obj = JSON.parse(Buffer.from(body, "base64url").toString());
    return obj.exp > Date.now() ? obj : null;
  } catch {
    return null; // a cookie from an older version, or mangled: just not logged in
  }
}
function hmac(s) {
  return crypto.createHmac("sha256", env("SESSION_SECRET")).update(s).digest("base64url");
}

function cookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}
function clear(name) {
  return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}
function readCookie(req, name) {
  const m = (req.headers.get("cookie") || "").match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? m[1] : null;
}
function redirect(location, cookies = []) {
  const headers = new Headers({ Location: location });
  for (const c of cookies) headers.append("Set-Cookie", c);
  return new Response(null, { status: 302, headers });
}
