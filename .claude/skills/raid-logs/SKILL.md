---
name: raid-logs
description: Update the Raid Logs pages (src/raids/) from Moist's Warcraft Logs - fetch new raid nights, sanity-check them, write the optional "magic LLM analysis" for a night, and extend the stats/charts. Use after a raid night, to backfill older nights, to analyse a night's wipes, or when asked for new raid stats.
---

# Raid logs

The **Raid Logs** pages (`#/raids`, `#/raids/<night>`, `#/raids/<night>/<boss>`,
`#/raid-zone/<id>`, `#/raid-boss/<id>`) are built from the guild's Warcraft Logs (Moist,
EU-Firemaw, Classic Era). Everything on them is **computed from data**: stats,
charts, and award cards from fixed rules. The only prose is the opt-in "magic LLM analysis" (see below),
always collapsed and labelled as AI-written.

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
   - `-- --rebuild` rebuilds every night on disk from `data/wcl/` only, with no
     API calls. Use it after changing how nights are built (stats, rules, fixes).
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

## Magic LLM analysis (optional, per night)

Each night can have an AI-written analysis, shown on the night page (and the
boss's part on each night-boss page) in a collapsed, clearly labelled
"✨ Magic LLM analysis" panel. It is the one place prose is allowed. Write it
only when asked, or for new nights after a fetch if the user wants it.

1. **Read the reference first**: `reference/classes-and-log-reading.md` and the
   file for the night's raid(s) in `reference/` (molten-core-onyxia,
   blackwing-lair-zulgurub, ahnqiraj, naxxramas). Don't analyse from memory.
2. **Build the facts**: `npm run raids:facts -- --night <date>` prints JSON with
   every boss (kill time vs guild best/median, parse medians vs history,
   mechanics per raider vs the guild's usual rate), every wipe pull (death
   sequence with time, player, inferred role, killing blow, who dealt it, deaths
   per ability, mechanic hits in that pull), trash deaths, utility and
   consumables. Roles are inferred from casts; specs from WCL can be wrong.
   If you need more, query the raw archive in `data/wcl/` (never the API).
3. **Write** `src/raids/data/analysis/<night>.json`:

   ```json
   {
     "night": "2026-09-23",
     "model": "Claude (Opus 5.5)",
     "generatedAt": "<ISO date>",
     "headline": "one line, max ~80 chars",
     "overview": ["1-2 short paragraphs: the shape of the night"],
     "wipes": [{ "encounterId": 51119, "pull": 1, "title": "Sapphiron, pull 1 (2%)",
                 "whatHappened": "...", "likelyCause": "...",
                 "evidence": ["numbers from the facts"], "avoid": "..." }],
     "wentWell": [{ "encounterId": 51120, "text": "..." }],
     "mechanics": [{ "encounterId": 51112, "verdict": "good", "text": "..." }]
   }
   ```

   `encounterId` ties an item to a boss (the night-boss page shows only its own).
4. Build, open the night page, expand the panel, and read it once as a raider.

**Rules for the analysis**
- Insight, not filler. Every sentence carries a fact from the facts pack (a
  number, a name, a time) or a cause explained by the reference. Cut anything
  that would be true of any raid ("communication is key").
- Start every wipe from the numbers, not the death list: per pull the facts
  give `damageTakenByAbility` (what actually hurt the raid) and
  `healingDoneToEnemies` (Life Drain, Heal Brother, Great Heal...). Compare
  them with the kill pull or the guild's usual. On 7 Oct Sapphiron, Life Drain
  healed the boss for ~297k on the wipe vs 38k on the kill: that alone names
  the cause. Each death also has a `recap` (damage by ability in the death
  window, healing received).
- `bossFrenzy` (Frenzy/Enrage gained vs removed by Tranquilizing Shot) and
  `bossCasts` (key boss casts started vs interrupted) exist for nights fetched
  after 8 Oct 2026; older nights don't have them, so say so instead of guessing.
- There is no mana data. Never claim "healers ran out of mana" as fact; at most
  "most likely" with the evidence (long fight, late healer deaths with low
  healing received).
- Bosses with a debuff the raid must remove (Life Drain, Lucifron's/Gehennas'
  curses, Curse of the Plaguebringer, Necrotic Poison, Veil of Shadow...):
  check the "(coverage)" entries per pull first (applied / removed / never
  removed / median seconds). Debuffs left running are a classic root cause
  (7 Oct Sapphiron: 21 of 79 Life Drains never removed on the wipe, 0 on the
  kill). Check the reference before calling it a failure: some debuffs are
  normally ignored or deliberately not dispelled (Faerlina's poison, Mutating
  Injection).
- Wipes: what happened (the sequence), the most likely root cause (first
  deaths and their timing, not the cascade at the end), the evidence, and one
  concrete thing to do differently. Say "most likely" when inferring; never
  invent things the logs can't show (voice comms, intent, mana bars).
- Compare with the guild's own history (faster/slower than usual, more/fewer
  mechanic hits per raider than usual). Good things first and generously, but
  only where they're real.
- Name players for good things freely; for mistakes prefer the pattern ("19
  Blizzard hits from 8 raiders") over singling people out, unless one person's
  action clearly caused the wipe.
- Don't spotlight dispels/decursing (the site owner is a mage and doesn't
  want it to look self-promoting); mention only when it matters to a wipe.
- Plain, low-key tone. No dashes as sentence breaks, no hype, no emojis.
- Keep it short: overview 2-5 sentences, 3-6 "went well", each wipe ~4 lines.

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
- `Analysis.jsx`: the collapsed magic LLM analysis panel (data in
  `src/raids/data/analysis/<night>.json`, written by this skill).
- Other files: `charts.jsx` (timeline, calendar, clear-time trend, sparklines),
  `components.jsx` and `assets.js` (WCL CDN art: zones, bosses, specs, spells).

## Data caveats (from the reference research)

- Warcraft Logs has no talent data for Classic Era: its spec/role labels are
  guesses. Nights store `spec: null` and a `role` inferred from casts (mostly
  heals = healer, tank abilities = tank). Parses where WCL ranked someone in
  the wrong role are dropped.
- Tranquilizing Shot removing Frenzy shows as a dispel of "Enrage": excluded
  from dispels.
- Some boss mechanics are credited to random players (Ragnaros Lava Burst,
  Eruption): never treat those as friendly fire.
- More quirks per boss in `reference/*.md` ("Analysis notes").

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
