---
name: raid-logs
description: Update the Raid Logs pages (src/raids/) from Moist's Warcraft Logs - fetch new raid nights, sanity-check them, write the optional "Claude's analysis" for a night, and extend the stats/charts. Use after a raid night, to backfill older nights, to analyse a night's wipes, or when asked for new raid stats.
---

# Raid logs

The **Raid Logs** pages (`#/raids`, `#/raids/<raid>`, `#/raids/<raid>/<boss>`,
`#/raid-zone/<id>`, `#/raid-boss/<id>`) are built from the guild's Warcraft Logs (Moist,
EU-Firemaw, Classic Era). Everything on them is **computed from data**: stats,
charts, and award cards from fixed rules. The only prose is the "Claude's analysis" panel (see below),
always collapsed and labelled as AI-written.

This lives entirely in `scripts/raids/` and `src/raids/` (plus one nav link and
route in `src/App.jsx`). Never touch the SR-points side (the SQLite database,
`src/views/`, `src/data.js`).

## Updating after a raid

1. `npm run raids:fetch` fetches new nights from the last 3 weeks and rebuilds
   `src/raids/data/summary.json`. Options:
   - `-- --since 2025-02-01` to backfill. The free API key allows 720 points an
     hour. A night costs its full combat log (about 1 point per 10,000 events:
     ~13 for ZG, 50+ for Naxx) plus ~2 per kill for parses. The script stops on
     its own near the limit (exit code 75); rerun it after the reset to continue.
   - `-- --night <date> --force` rebuilds a night from cached logs (free).
   - `-- --rebuild` (optionally `--night <date>`) rebuilds nights from what's on
     disk only, with no API calls. Use it after changing how nights are built
     (stats, rules, fixes).
   - `-- --night <date> --refresh` re-downloads it, for example when someone
     uploaded their log late.
   - `-- --list` shows which logs make up each night.

   Needs `WCL_CLIENT_ID`/`WCL_CLIENT_SECRET` in `.env.local` (git-ignored).
   Never print the secret or commit it.
2. Sanity-check with `npm run raids:history`. Look for silly numbers, such as
   a night with 60+ raiders (two groups logged under the guild) or deaths
   counted twice.
3. Run `npm run build` and open the new night in the dev server
   (`npm run dev`, `#/raids/<date>-<raid>`, e.g. `#/raids/2026-10-02-bwl`).
4. Report what came in (nights, kills, anything notable from the numbers).
   Commit only if asked. Every change except pure backfill data bumps the
   version, including new or corrected analyses: add an entry at the top of
   `src/changelog.js` and keep `package.json` and `package-lock.json` in sync.

## Claude's analysis (optional, per raid)

Each night can have an AI-written analysis, shown on the night page (and the
boss's part on each night-boss page) as a faded preview, clearly labelled
"✨ Claude's analysis" panel. It is the one place prose is allowed. Write it
only when asked, or for new nights after a fetch if the user wants it.

1. **Read the reference first** (when unsure of a mechanic, also `reference/research/*.md`, sourced): `reference/classes-and-log-reading.md` and the
   file for the night's raid(s) in `reference/` (molten-core-onyxia,
   blackwing-lair-zulgurub, ahnqiraj, naxxramas). Don't analyse from memory.
2. **Build the facts**: `npm run raids:facts -- --night <raid id>` (e.g. `2026-10-02-bwl`; a plain date works when there was one raid that day) prints JSON with
   every boss (kill time vs guild best/median, parse medians vs history,
   mechanics per raider vs the guild's usual rate), every wipe pull (death
   sequence with time, player, inferred role, killing blow, who dealt it, deaths
   per ability, mechanic hits in that pull), trash deaths, utility and
   consumables. Roles are inferred from casts; specs from WCL can be wrong.
   With the night's full log on disk it also has, per pull: who took each
   damage ability (avoidable damage is usually a few players), landed hits,
   death recaps with health on the way down. If you need more, compute it from
   `data/events/` with `scripts/raids/derive.mjs` (never the API).
3. **Write** `src/raids/data/analysis/<raid id>.json`:

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
     "bosses": [{ "encounterId": 51112, "name": "Heigan the Unclean",
                  "notes": [{ "tone": "good" | "bad" | "info", "text": "..." }] }]
   }
   ```

   `encounterId` ties an item to a boss (the night-boss page shows only its own).
   `wentWell` is the short highlights list at the top (3-6 items). `bosses` is
   the real body: **every boss of the night**, 1-4 notes each, in kill order.
   Cover what's actually interesting for that boss: pace and raid DPS against
   the guild's usual, damage taken against usual and who took the avoidable
   part, healing the boss got, every death with its cause and timing, the
   boss's mechanics against history, notable parses. One note is fine for a
   boss where nothing stood out; never pad. (Older files have a `mechanics`
   list instead; the panel still shows it.)
4. Build, open the night page, expand the panel, and read it once as a raider.

**Analysis protocol: think like a raid leader reviewing the log.** Work
through every boss pull in this order, in your head or in a scratch file,
before writing a single sentence. The goal is to find out exactly what went
wrong and why, not to describe the death list.

1. **Anomalies first.** Each pull in the facts has `anomalies`: things far off
   this guild's own baseline for that boss (from `baseline`), most severe
   first. Every anomaly needs an explanation from the reference: what does
   this ability do, who should take it, what does it mean that it's high?
2. **Damage taken.** Read `damageTakenByAbility` against
   `baseline.takenPerSecond` / `takenShare`. Unavoidable raid damage (Frost
   Aura, Inevitable Doom, Chain Lightning) being high is a symptom of a long
   fight. Avoidable damage (frontal cones, void zones, fire on the ground,
   Blizzard) should be near zero on a clean pull; when it isn't, that's a
   positioning failure, and the reference says what it implies (a boss
   turning, a group standing wrong, a knockback into adds).
3. **Healing done to enemies.** Any boss or add healing above baseline means a
   mechanic that should have been stopped wasn't (undecursed drains, unkicked
   heals, emperors not separated, zombies reaching Gluth).
4. **Things that should never happen.** Boss Berserk/Enrage up, `bossFrenzy`
   gained more often than removed, `bossCasts` started but not interrupted,
   must-remove debuffs left running (`(coverage)` entries), boss melee on
   non-tanks, Spirit/add damage on the wrong group.
5. **Deaths.** Who died first, when, in what role, and to what. Read each early
   death's `recap` (damage by ability in their last seconds, healing
   received). A tank or healer dying early is the start of most cascades; deaths
   after that are usually consequences. Compare `deathsByAbility` with
   `baseline.deathsPerKill`.
6. **Output.** `raidDps` vs `baseline.raidDps`, kill time vs history. A slow
   kill with low DPS stretches every attrition mechanic.
   Check `worldBuffsAtPull` too: world buffs are a big deal in vanilla. Note a
   Darkmoon Faire week (Sayge's Fortune), how buffed the raid came in, buffs
   running out over a long night (Songflower and Rend last 1 h), and above all
   buffs lost on a wipe (world buffs are lost on death). Raids often rebuff
   some of them before the next pull, so check per player: who died on the
   wipe and which buffs they have again at the next pull (on 7 Oct Rallying
   Cry and Zandalar were rebuffed, Dire Maul and Sayge's were not). A slow
   kill right after a wipe is often this.
7. **Then write it.** For a wipe: the chain of events from the first thing
   that went wrong to the wipe, the root cause with the numbers that prove it,
   and the one or two things that would have prevented it. For kills: what was
   cleaner or messier than usual, with numbers. If the data can't tell you
   (mana, voice comms, intent), say what's missing instead of guessing.

The 7 Oct Sapphiron wipe is the cautionary example: the death list said
"Frost Aura, Chill, Life Drain, a bit of everything", while the numbers said
"Life Drain healed Sapphiron 297k vs ~100k usual and 21 of 79 drains were
never removed". Always go to the numbers.

**MVP.** Every analysis names one MVP (`mvp: { player, headline, why: [2-3
facts], also: [{ player, text }] }`, shown at the top of the panel). Pick from
the facts' `players` list, weighing the whole raid, not parses alone:
- consistency of parses across all bosses (one great boss is not an MVP)
- jobs carried: soaks, kicks, dispels and decurses, Tranqs, shackles, rezzes,
  Power Infusions, tanking (most melee taken per boss)
- parses that are low *because* of a job (a mage decursing all fight, a tank's
  parse means nothing) count for them, not against them
- deaths, especially ones that cost world buffs, and avoidable damage count
  against; being taken out by mechanics (web wrap, mind control) is neutral
- a moment that saved a pull (a battle rez, a bomb carried out, picking the
  boss back up) can decide it.
Healers and tanks are as eligible as DPS. Never the site owner (Drikkle) on
2026-10-07. Two or three "also great" mentions with one fact each.

**PUG runs.** Raids are classified from the roster (`classifyRaids` in
`src/raids/aggregate.js`): guild, pug (under 30% Moist regulars, e.g. the
Monday MC) or other (another guild's raid, hidden). The facts say `raidKind`;
for a PUG run every baseline is from other PUG runs. Compare kill times with
other PUG runs too (summary.json `kind: "pug"`), never with the guild's.

**Rules for the analysis**
- Counts in the facts are usually *events* (debuffs landed, casts), not
  distinct targets: 15 shackles can be one Guardian recast 8 times. Before
  writing "N of M <targets>", count the distinct targets in the log.
- Never state a game mechanic you inferred from totals ("this buff survives
  death") as fact. Say what the log shows and verify it per player; if the
  log can't tell, leave it out or say it's unclear.
- Name people for good plays. When the log shows a moment where someone saved
  a pull or carried a job ("Birkler picked Maexxna back up within 3 seconds",
  "Etowa's battle rez on the tank kept the pull alive"), say who, with the
  number or time that proves it. Credit by name; problems stay about the raid,
  not a person. Dispels and decurses count as good plays too, except in the
  2026-10-07 analysis (the site owner asked to leave his own night alone).
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
- Dispel/decurse work can be credited by name like any other good play
  (not in the 2026-10-07 analysis).
- Plain, low-key tone. No dashes as sentence breaks, no hype, no emojis.
- Keep it short: overview 2-5 sentences, 3-6 "went well", each wipe ~4 lines.

## How the data flows

- **Full combat logs (source of truth):** for every night, every event of the
  fights it uses (hits, heals, casts, buffs, debuffs, deaths, resource changes,
  positions, health %) in `data/events/<night>/<code>/page-NNN.json.gz` (local
  only, git-ignored, ~2-12 MB per night). `raids:fetch` downloads it for new
  nights; `npm run raids:events` backfills nights that don't have it yet.
  Current mana is NOT in it (the API leaves `classResources` empty).
- `scripts/raids/derive.mjs` turns one log's events into per-fight numbers:
  damage taken by ability (players only, friendly fire included, like WCL),
  enemy healing, damage/healing per player (pets for their owner, absorbs as
  healing), casts, dispels, real interrupts (WCL's own table also counts
  stuns/CC), deaths with recaps, debuff on/off timelines, boss buffs/casts,
  boss health, per-second damage/healing (replays). Validated against WCL's own
  tables on 6 Oct 2026: identical apart from overkill on one-shots.
- **Everything else from the API** is kept in `data/wcl/` (committed, gzipped):
  `reports.json` (the guild's report list), `reports/<code>.json.gz` (fights,
  actors, abilities+icons), parses in `fights/<code>-rankings-<hash>.json.gz`.
  Older nights also have WCL tables there (`-detail`, `fights/<code>-<hash>`,
  `-pull-`), used only when a night has no full log.
- **Adding a stat:** compute it in `derive.mjs`, use it in `buildNight`
  (`fetch.mjs`) or `facts.mjs`, bump `SCHEMA`, then `raids:fetch -- --rebuild`.
  No API calls.
- `src/raids/mechanics.js`: per-boss mechanics (hit / debuff / cast / dispel /
  kick, tone good/bad/info). The fetcher asks for exactly these abilities; the
  boss pages show them. Ability names must match the logs exactly - check
  killing blows/dispel names in existing data, or the raw event stream.
- Per raider: `src/raids/data/players/<name>.json` (lazy, for profiles) and
  `roster.json` (class/spec/role for every name - used site-wide for class
  icons/colours). Both written by `scripts/raids/summary.mjs`.

- `scripts/raids/fetch.mjs`: for each night, picks the most complete log, then
  adds pulls only other logs caught (several people log every raid). Writes
  one file per raid, `src/raids/data/nights/<date>-<raid>.json` (raid = mc, ony,
  bwl, zg, aq20, aq40, naxx; BWL + MC on one evening are two raids, trash goes
  with the next boss pull). Schema 7 = per raid, from the full log. Files named
  just `<date>.json` are older multi-raid nights waiting for the backfill. Full
  logs (`data/events/`) and `--night` options stay per date. The pages link
  raids of the same weekly lockout (Naxx Wednesday + Sapphiron/KT Sunday).
  Each file has bosses and pulls, deaths
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
- `Analysis.jsx`: the Claude's analysis panel (faded preview until opened) (data in
  `src/raids/data/analysis/<raid id>.json`, written by this skill).
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

- **A new stat from the logs:** compute it from the events in `derive.mjs` (see
  "How the data flows"), never with a new API query. Introspect the API only for
  things the event stream can't hold (parses):
  `{ __type(name: "ReportData") { fields { name } } }`.
- **A new award:** add a rule in `highlights.js`. Keep the tone positive and
  recognise useful work that's easy to miss. Give every card a real number,
  and set a threshold so it isn't noise.
- **Charts:** follow the dataviz skill. Kill is gold `#d4af5a` and wipe is red
  `#e0525f` (checked for colour-blind separation). Class colours mark players
  and always appear with the class icon and name.
- UI text: plain and low-key, no sales tone. Don't use dashes as sentence breaks
  (" - " or em dashes); use full stops, commas or "·".
