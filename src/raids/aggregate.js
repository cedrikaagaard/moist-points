// All-time numbers across every raid night. Plain JS with no imports, so both
// the site (src/raids/) and the scripts (scripts/raids/) use it.

// Warcraft Logs Classic Era encounter ids -> zone id.
export function zoneForEncounter(id) {
  if (id >= 50663 && id <= 50672) return 2000; // Molten Core
  if (id === 51084) return 2001; // Onyxia
  if (id >= 50610 && id <= 50617) return 2002; // Blackwing Lair
  if (id >= 50784 && id <= 50793) return 2003; // Zul'Gurub
  if (id >= 50709 && id <= 50717) return 2005; // AQ40
  if (id >= 51107 && id <= 51121) return 2006; // Naxxramas
  return null;
}

// Battle rezzes, as opposed to the after-the-wipe kind.
export const COMBAT_REZ = new Set(["Rebirth", "Soulstone Resurrection"]);

export function aggregate(nights) {
  nights = [...nights].sort((a, b) => a.night.localeCompare(b.night));
  const players = new Map();
  const bosses = new Map();
  const killers = {};

  const player = (name, cls) => {
    if (!players.has(name)) {
      players.set(name, {
        name, class: cls, spec: null, nights: 0, deaths: 0, firstDeaths: 0, killedBy: {},
        dispels: 0, interrupts: 0, rezzes: 0, combatRezzes: 0, casts: {}, lastNight: null, cleanNights: 0,
        firstNight: null, role: null, parseSum: 0, parseCount: 0, bestParse: null,
      });
    }
    const p = players.get(name);
    if (!p.class && cls) p.class = cls;
    return p;
  };

  for (const n of nights) {
    const died = new Set(n.deaths.map((d) => d.player));
    for (const r of n.raiders) {
      const p = player(r.name, r.class);
      p.nights++;
      if (!died.has(r.name)) p.cleanNights++;
      p.lastNight = n.night;
      p.firstNight ||= n.night;
      if (r.spec) p.spec = r.spec;
      if (r.role) p.role = r.role;
    }
    for (const d of n.deaths) {
      const p = player(d.player, d.class);
      p.deaths++;
      if (d.firstOfPull) p.firstDeaths++;
      const by = d.killingBlow || "Unknown";
      p.killedBy[by] = (p.killedBy[by] || 0) + 1;
      killers[by] = (killers[by] || 0) + 1;
    }
    for (const b of n.bosses) {
      for (const pr of b.parses || []) {
        const p = player(pr.player);
        p.parseSum += pr.pct;
        p.parseCount++;
        if (!p.bestParse || pr.pct > p.bestParse.pct) p.bestParse = { pct: pr.pct, boss: b.name, id: b.encounterId, night: n.night };
      }
    }
    for (const t of n.dispels || []) player(t.player).dispels += t.total;
    for (const t of n.interrupts || []) player(t.player).interrupts += t.total;
    for (const r of n.rezzes || []) {
      if (!r.by) continue;
      const p = player(r.by);
      p.rezzes++;
      if (COMBAT_REZ.has(r.ability)) p.combatRezzes++;
    }
    for (const [ability, c] of Object.entries(n.casts || {})) {
      for (const [name, count] of Object.entries(c.by)) {
        const p = player(name);
        p.casts[ability] = (p.casts[ability] || 0) + count;
      }
    }
    for (const b of n.bosses) {
      if (!bosses.has(b.name)) {
        bosses.set(b.name, {
          id: b.encounterId, name: b.name, zoneId: zoneForEncounter(b.encounterId),
          kills: 0, wipes: 0, pulls: 0, timeSec: 0, deaths: 0, bestKillSec: null, bestKillNight: null, history: [],
          attempts: [], deathsBy: {}, firstDeathsBy: {}, killingBlows: {}, raidersBy: {},
          mech: {}, mechNights: {}, dispelsBy: {}, kicksBy: {}, bestParse: {}, parseNights: [],
        });
      }
      const s = bosses.get(b.name);
      for (const p of b.pulls) {
        s.attempts.push({ night: n.night, kill: p.kill, durationSec: p.durationSec, bossPctLeft: p.bossPctLeft, deaths: p.deaths });
      }
      for (const d of n.deaths.filter((d) => d.boss === b.name)) {
        s.deathsBy[d.player] = (s.deathsBy[d.player] || 0) + 1;
        if (d.firstOfPull) s.firstDeathsBy[d.player] = (s.firstDeathsBy[d.player] || 0) + 1;
        const k = d.killingBlow || "Unknown";
        s.killingBlows[k] = (s.killingBlows[k] || 0) + 1;
      }
      // Kills each raider was present for (the boss's own roster when we have it).
      if (b.killed) for (const name of b.present || n.raiders.map((r) => r.name)) s.raidersBy[name] = (s.raidersBy[name] || 0) + 1;
      // Mechanics: all-time per raider, plus per-night totals for the trend.
      for (const [key, by] of Object.entries(b.mech || {})) {
        const m = (s.mech[key] ||= {});
        for (const [name, c] of Object.entries(by)) m[name] = (m[name] || 0) + c;
        (s.mechNights[key] ||= []).push({ night: n.night, total: Object.values(by).reduce((t, v) => t + v, 0), raiders: Object.keys(by).length, present: (b.present || []).length });
      }
      for (const d of b.dispels || []) s.dispelsBy[d.player] = (s.dispelsBy[d.player] || 0) + d.total;
      for (const k of b.kicks || []) s.kicksBy[k.player] = (s.kicksBy[k.player] || 0) + k.total;
      // Parses: each raider's best, and the raid's median per night.
      if (b.parses?.length) {
        for (const p of b.parses) {
          const best = s.bestParse[p.player];
          if (!best || p.pct > best.pct) s.bestParse[p.player] = { pct: p.pct, night: n.night, amount: p.amount, spec: p.spec, role: p.role };
        }
        const sorted = b.parses.map((p) => p.pct).sort((x, y) => x - y);
        s.parseNights.push({ night: n.night, median: sorted[Math.floor(sorted.length / 2)], count: sorted.length });
      }
      s.pulls += b.pulls.length;
      s.wipes += b.wipes;
      s.kills += b.killed ? 1 : 0;
      s.timeSec += b.pulls.reduce((t, p) => t + p.durationSec, 0);
      s.deaths += b.pulls.reduce((t, p) => t + p.deaths, 0);
      if (b.killTimeSec != null) {
        s.history.push({ night: n.night, sec: b.killTimeSec });
        if (s.bestKillSec == null || b.killTimeSec < s.bestKillSec) {
          s.bestKillSec = b.killTimeSec;
          s.bestKillNight = n.night;
        }
      }
    }
  }

  // Ability totals across the guild, for "x of the guild's y Sunders".
  const castTotals = {};
  for (const p of players.values()) {
    for (const [a, c] of Object.entries(p.casts)) castTotals[a] = (castTotals[a] || 0) + c;
  }

  const playerList = [...players.values()].map((p) => ({
    ...p,
    deathsPerNight: p.nights ? Math.round((p.deaths / p.nights) * 100) / 100 : 0,
    nemesis: topEntry(p.killedBy),
    avgParse: p.parseCount ? Math.round(p.parseSum / p.parseCount) : null,
  }));

  return {
    nights: nights.length,
    firstNight: nights[0]?.night ?? null,
    lastNight: nights.at(-1)?.night ?? null,
    totals: {
      kills: sum(nights, (n) => n.totals.kills),
      wipes: sum(nights, (n) => n.totals.wipes),
      deaths: sum(nights, (n) => n.totals.deaths),
      minutes: sum(nights, (n) => n.durationMin),
      dispels: sum(playerList, (p) => p.dispels),
      interrupts: sum(playerList, (p) => p.interrupts),
    },
    players: playerList.sort((a, b) => b.nights - a.nights || a.name.localeCompare(b.name)),
    bosses: [...bosses.values()],
    killers: Object.entries(killers)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    castTotals,
    icons: Object.assign({}, ...nights.map((n) => n.icons || {})),
  };
}

// Most frequent killer, skipping plain "Melee" when something more colourful exists.
function topEntry(counts) {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [name, count] = sorted.find(([n]) => n !== "Melee" && n !== "Unknown") || sorted[0] || [];
  return name ? { name, count } : null;
}

const sum = (list, f) => list.reduce((t, x) => t + f(x), 0);

// Boss fields every page needs (records, kill-time history); the rest of a
// boss - attempts, mechanics, parses, who was there - goes in its own file.
const BOSS_LIGHT = ["id", "name", "zoneId", "kills", "wipes", "pulls", "timeSec", "deaths", "bestKillSec", "bestKillNight", "history"];
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, o[k]]));

// What the site loads up front (summary.json): one light row per night + the
// all-time numbers. Per-boss detail comes back separately as `bosses`
// (written to data/bosses/<id>.json and loaded by the boss/raid pages).
export function buildSummary(nights) {
  const all = aggregate(nights);
  const bosses = Object.fromEntries(all.bosses.map((b) => [b.id, b]));
  return {
    summary: {
      nights: nights
        .map((n) => ({
          night: n.night,
          zones: n.zones,
          zoneIds: nightZones(n),
          durationMin: n.durationMin,
          raiders: n.raiders.length,
          totals: n.totals,
          bosses: n.bosses.map((b) => ({ id: b.encounterId, name: b.name, killed: b.killed, wipes: b.wipes, killTimeSec: b.killTimeSec })),
          zoneTimes: zoneTimes(n),
        }))
        .sort((a, b) => b.night.localeCompare(a.night)),
      allTime: {
        ...all,
        bosses: all.bosses.map((b) => pick(b, BOSS_LIGHT)),
        players: all.players.map(({ killedBy, parseSum, parseCount, ...p }) => p),
        killers: all.killers.slice(0, 40),
      },
    },
    bosses,
  };
}

// Zones in the order the raid visited them, from the bosses pulled.
export function nightZones(n) {
  const ids = n.bosses.map((b) => zoneForEncounter(b.encounterId)).filter(Boolean);
  return [...new Set(ids.length ? ids : n.zoneIds || [])];
}

// Per zone: first pull to last pull end, and bosses killed - a "clear time".
export function zoneTimes(n) {
  const out = {};
  for (const b of n.bosses) {
    const z = zoneForEncounter(b.encounterId);
    if (!z) continue;
    const t = (out[z] ||= { start: Infinity, end: 0, kills: 0 });
    for (const p of b.pulls) {
      t.start = Math.min(t.start, p.at);
      t.end = Math.max(t.end, p.at + p.durationSec);
    }
    if (b.killed) t.kills++;
  }
  for (const t of Object.values(out)) t.sec = t.end - t.start;
  return out;
}

// Everything about one raider, night by night - written to
// src/raids/data/players/<name>.json and loaded on their profile.
export function buildPlayers(nights) {
  nights = [...nights].sort((a, b) => a.night.localeCompare(b.night));
  const out = new Map();
  const get = (name, cls) => {
    if (!out.has(name)) out.set(name, { name, class: cls || null, spec: null, role: null, nights: [] });
    return out.get(name);
  };
  for (const n of nights) {
    const zones = nightZones(n);
    for (const r of n.raiders) {
      const p = get(r.name, r.class);
      if (r.spec) p.spec = r.spec;
      if (r.role) p.role = r.role;
      const mine = (list) => (list || []).find((x) => x.player === r.name);
      const row = {
        night: n.night,
        zones,
        role: r.role || null,
        spec: r.spec || null,
        deaths: n.deaths.filter((d) => d.player === r.name).length,
        firstDeaths: n.deaths.filter((d) => d.player === r.name && d.firstOfPull).length,
        dispels: mine(n.dispels)?.total || 0,
        kicks: mine(n.interrupts)?.total || 0,
        parses: [],
        mech: {},
      };
      for (const b of n.bosses) {
        const pr = (b.parses || []).find((x) => x.player === r.name);
        if (pr) row.parses.push({ id: b.encounterId, boss: b.name, pct: pr.pct, amount: pr.amount, role: pr.role });
        for (const [key, by] of Object.entries(b.mech || {})) if (by[r.name]) row.mech[`${b.encounterId}:${key}`] = by[r.name];
      }
      const casts = {};
      for (const [a, c] of Object.entries(n.casts || {})) if (c.by[r.name]) casts[a] = c.by[r.name];
      row.casts = casts;
      p.nights.push(row);
    }
  }
  return [...out.values()];
}
