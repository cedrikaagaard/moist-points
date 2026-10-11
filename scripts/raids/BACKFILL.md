# Raid data backfill runner

`npm run raids:backfill` downloads everything the site's data layer needs for
nights that are missing it: **full combat logs** (`data/events/`) and **fight
replays** (`src/raids/data/replays/`). Data only. It never writes prose,
analyses, or reviews. Those are a separate step (see the raid-logs skill).

## Why it exists

The site's numbers are computed from data, and two of the inputs are fetched
lazily because they cost API budget or time:

| Stage | Script | Output | Cost |
|---|---|---|---|
| Report list, fights, night files, summary | `raids:fetch` | `data/wcl/`, `src/raids/data/nights/`, `summary.json` | API-heavy for new nights, cheap for known ones |
| Full combat logs (every event of every used fight) | `raids:events` | `data/events/<date>/<code>/` | ~1 API point per 10,000-event page, ~10–60 pts/night |
| Per-second damage/healing replays per boss kill | `raids:replays` | `src/raids/data/replays/<night>-<encounterId>.json` | Free from a downloaded log, else 2 graph queries per kill |

The backfill runner does the last two rows, newest nights first, stopping
cleanly when the hourly budget runs low. Re-running it later carries on where
it stopped. Finished nights are skipped, interrupted downloads resume from
the last saved page. There is no separate state file; completion *is* the
presence of the output files.

## Usage

```sh
npm run raids:backfill                          # everything missing, newest first
npm run raids:backfill -- --dry-run             # survey only, download nothing
npm run raids:backfill -- --since 2025-06-01    # only nights on/after this date
npm run raids:backfill -- --until 2026-01-01    # only nights on/before this date
npm run raids:backfill -- --max-nights 10       # stop after 10 nights
npm run raids:backfill -- --max-points 300      # stop after ~300 API points
npm run raids:backfill -- --reserve 200         # keep 200 pts untouched (default 130)
npm run raids:backfill -- --graphs              # allow paid graph queries for
                                                # replays with no full log (default: disk only, free)
npm run raids:backfill -- --quiet               # plain lines, no dashboard/colours
npm run raids:backfill -- --log-file /tmp/b.log # run log destination
npm run raids:backfill -- --help                # all of the above, briefly
```

Typical session when the budget runs dry:

```sh
npm run raids:backfill        # works until the hour is spent, exits 75
# …wait for the reset (it tells you how many minutes)…
npm run raids:backfill        # carries on, skips everything already done
```

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Queue empty (point cap also exits 0; same command resumes) |
| 75 | Hourly API budget nearly spent. Run the same command again after the reset shown. Not a failure. |
| 130 | Interrupted (Ctrl-C). Finished pages are kept; run again to resume. |
| 1 | A night actually failed (message names it). Other nights still completed. |

Every run appends to `data/events/backfill.log` (local only, git-ignored), so a
later session, or a different model, can see what ran and what is left by
reading the tail of that file plus `--dry-run`.

## What "done" means per night

- **Events**: every combat log the night uses has
  `data/events/<date>/<code>/done.json`. The downloader (`events.mjs`) pages
  through the report's event stream 10,000 events at a time; `progress.json`
  in the same directory records where a stopped run restarts.
- **Replays**: every boss kill with a log source has
  `src/raids/data/replays/<night>-<encounterId>.json`. Built from the
  downloaded log (exact, free). Without `--graphs`, kills with no log are
  skipped rather than paid for.
- **Skipped with a reason**: nights whose report archive is missing
  (`data/wcl/reports/<code>.json.gz`) need `raids:fetch -- --night <date>
  --refresh` first. The survey lists up to five of them, then counts the rest.

## API budget

The free Warcraft Logs key allows 720 points/hour. The runner checks the live
budget before each night and stops with exit 75 before crossing
`limit − reserve` (default reserve 130, same as `raids:fetch`). Event pages
cost ~1 point each; a Naxx night can cost 50+, a ZG ~13. `WCL_CLIENT_ID` /
`WCL_CLIENT_SECRET` come from `.env.local` (git-ignored, never print them).

## For the next model (or human) picking this up

1. `npm run raids:backfill -- --dry-run` tells you the whole state in seconds:
   how many nights are complete, what is queued, what needs `raids:fetch`.
2. Just run it. It paces itself against the live budget and tells you when to
   come back. There is nothing to configure per run.
3. When the queue is empty, the archive is complete: every night has its full
   log and its replays.    LLM analyses and personal reviews are then computable
   offline from `data/events/` at any later point. That step is deliberately
   not part of this script.
4. Gotchas already handled in code: event
   downloads are per *date* directory while nights are per *raid* (two raids
   sharing a date share the download); `--night` filters in the sibling
   scripts accept a raid id or a date; `data/events/` is git-ignored and lives
   only on the machine that ran the downloads (plus whatever backups you
   keep), while `data/wcl/` and `src/raids/data/replays/` *are* committed.
