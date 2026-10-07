---
name: raid-logs
description: Update the Raid Logs pages (src/raids/) from Moist's Warcraft Logs - fetch new raid nights, sanity-check them, and extend the stats/charts. Use after a raid night, to backfill older nights, or when asked for new raid stats.
---

# Raid logs

The **Raid Logs** pages (`#/raids`, `#/raids/<night>`, `#/raids/<night>/<boss>`,
`#/raid-zone/<id>`, `#/raid-boss/<id>`) are built from the guild's Warcraft Logs (Moist,
EU-Firemaw, Classic Era). Everything on them is **computed from data**: stats,
charts, and award cards from fixed rules. There is no generated prose. Don't
add paragraphs, summaries or "story" text; the user explicitly doesn't want
that.

This lives entirely in `scripts/raids/` and `src/raids/` (plus one nav link and
route in `src/App.jsx`). Never touch the SR-points side (the SQLite database,
`src/views/`, `src/data.js`).

## Updating after a raid

1. `npm run raids:fetch` fetches new nights from the last 3 weeks and rebuilds
   `src/raids/data/summary.json`. Options:
   - `-- --since 2025-02-01` to backfill. The free API key allows 720 points an
     hour and a night costs about 10-40. The script stops on its own near the
     limit (exit code 75); rerun it after the reset to continue.
   - `-- --night <date> --force` rebuilds a night from cached logs (free).
   - `-- --night <date> --refresh` re-downloads it, for example when someone
     uploaded their log late.
   - `-- --list` shows which logs make up each night.

   Needs `WCL_CLIENT_ID`/`WCL_CLIENT_SECRET` in `.env.local` (git-ignored).
   Never print the secret or commit it.
2. Sanity-check with `npm run raids:history`. Look for silly numbers, such as
   a night with 60+ raiders (two groups logged under the guild) or deaths
   counted twice.
3. Run `npm run build` and open the new night in the dev server
   (`npm run dev`, `#/raids/<date>`).
4. Report what came in (nights, kills, anything notable from the numbers).
   Commit only if asked.

## How the data flows

- **Raw archive:** `data/wcl/` (committed) holds every API response gzipped -
  `reports.json` (the guild's report list), `reports/<code>.json.gz` (fights,
  actors, abilities+icons, playerDetails specs/roles, rankings = parses, deaths
  table) and `fights/<code>-<hash>.json.gz` (casts by ability, dispels,
  interrupts, and a fight-tagged event stream: debuffs on raiders, dispels,
  interrupts, rezzes, mechanic hits and casts). Night files are derived from
  this; `--force` rebuilds them offline. Only new logs (or `--refresh`) cost API
  points. If you need a new kind of data, add it to the queries, then refetch.
- `src/raids/mechanics.js`: per-boss mechanics (hit / debuff / cast / dispel /
  kick, tone good/bad/info). The fetcher asks for exactly these abilities; the
  boss pages show them. Ability names must match the logs exactly - check
  killing blows/dispel names in existing data, or the raw event stream.
- Per raider: `src/raids/data/players/<name>.json` (lazy, for profiles) and
  `roster.json` (class/spec/role for every name - used site-wide for class
  icons/colours). Both written by `scripts/raids/summary.mjs`.

- `scripts/raids/fetch.mjs`: for each night, picks the most complete log, then
  adds pulls only other logs caught (several people log every raid). Writes
  `src/raids/data/nights/<night>.json` (schema 2): bosses and pulls, deaths
  (with killing blow, killer and first-of-pull), dispels, interrupts, rezzes,
  tracked casts (consumables, utility, raid debuffs) and spell icons.
- `scripts/raids/config.mjs`: guild, timezone and `TRACKED_CASTS` (which casts
  count as consumable, utility or debuff).
- `src/raids/aggregate.js`: shared by the scripts and the site. All-time
  per-player and per-boss numbers, plus `buildSummary` for `summary.json`.
- `src/raids/highlights.js`: the award rules (Cleanser, Interrupter, Battle
  rez, Sunder duty, guild records...). Each rule has a threshold so cards only
  appear when they mean something.
- Pages come in two kinds, kept visually and logically apart by the shared
  `Banner` (`kind="night"` vs `kind="history"`). **Raid night** pages
  (`RaidsView.jsx` night, `NightBoss.jsx`) show only that night, with at most one
  compact "vs other nights" line. **Guild history** pages (`RaidsView.jsx`
  overview, `BossPages.jsx` zone and boss) hold the all-time stats. Don't mix
  all-time panels into night pages.
- Other files: `charts.jsx` (timeline, calendar, clear-time trend, sparklines),
  `components.jsx` and `assets.js` (WCL CDN art: zones, bosses, specs, spells).

## Extending

- **A new stat from the logs:** add a `table(dataType: ...)` or
  `events(filterExpression: ...)` to `reportExtras` in `fetch.mjs`, shape it in
  `buildNight`, and bump `schema`. To rebuild every night, rerun with `--force`
  (extras are cached per report and fight list; use `--refresh` if the query
  changed). Introspect the API when unsure:
  `{ __type(name: "TableDataType") { enumValues { name } } }`.
- **A new award:** add a rule in `highlights.js`. Keep the tone positive and
  recognise useful work that's easy to miss. Give every card a real number,
  and set a threshold so it isn't noise.
- **Charts:** follow the dataviz skill. Kill is gold `#d4af5a` and wipe is red
  `#e0525f` (checked for colour-blind separation). Class colours mark players
  and always appear with the class icon and name.
- UI text: plain and low-key, no sales tone. Don't use dashes as sentence breaks
  (" - " or em dashes); use full stops, commas or "·".
