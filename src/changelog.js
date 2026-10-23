// Site version + human-curated changelog. Add an entry at the TOP of CHANGELOG
// whenever you ship something worth noting; VERSION is derived from the newest
// entry, so you only edit one place. Surfaced in the footer and on /#/changelog.

export const REPO_URL = "https://github.com/cedrikaagaard/moist-points";

export const CHANGELOG = [
  {
    version: "2.6.8",
    date: "2026-10-23",
    changes: [
      "New raids: Friday's Blackwing Lair (the guild's fastest clear, 33:00) and Molten Core (23 Oct), with AI analyses and Fair parses.",
      "The Moist logs page for 21 Oct now says so once the real Warcraft Logs report has replaced the raw-log version.",
    ],
  },
  {
    version: "2.6.7",
    date: "2026-10-21",
    changes: ["Rewrote one of tonight's Naxxramas reviews."],
  },
  {
    version: "2.6.6",
    date: "2026-10-21",
    changes: ["Personal reviews for tonight's Naxxramas (21 Oct), for everyone in the raid. Log in with Battle.net on My Page to read yours."],
  },
  {
    version: "2.6.5",
    date: "2026-10-21",
    changes: [
      "Battle.net login now works for raiders on every realm the guild raids from (Ashbringer, Bloodfang, Golemagg, Noggenfogger and the rest), not just Firemaw. Before, it logged you in and then found no characters.",
      "Battle.net login fixed for accounts with lots of characters: it used to get too big for the browser and silently disappear.",
      "When the Battle.net login fails, My Page now says what went wrong with a short code, also if you had already picked your character by hand.",
    ],
  },
  {
    version: "2.6.4",
    date: "2026-10-21",
    changes: ["Reworded the line at the top of tonight's Moist logs page."],
  },
  {
    version: "2.6.3",
    date: "2026-10-21",
    changes: [
      "Parse table on every raid page, like the Rankings tab on Warcraft Logs: every raider's parse on every boss, with average, median and best, grouped by role and sortable by any column.",
      "Raw-log raids only count players who were in the raid: people who just walked past in the instance (and buffed someone) no longer show up as raiders.",
    ],
  },
  {
    version: "2.6.2",
    date: "2026-10-21",
    changes: [
      "AI analysis for tonight's Naxxramas (21 Oct): records on Thaddius and the Four Horsemen.",
    ],
  },
  {
    version: "2.6.1",
    date: "2026-10-21",
    changes: [
      "Moist logs: when Warcraft Logs is down, a raid can now be read straight from the raw combat log and gets the full raid pages anyway, with a shareable link at #/moistlogs. Parses on those raids are estimates from the guild's own Warcraft Logs history for each boss and class.",
    ],
  },
  {
    version: "2.6.0",
    date: "2026-10-21",
    changes: [
      "Hall of Shame on the front page: everyone who has killed Mr. Bigglesworth, Kel'Thuzad's cat, straight from the combat logs. Worst offender, the leaderboard and the latest crimes.",
    ],
  },
  {
    version: "2.5.37",
    date: "2026-10-17",
    changes: [
      "New raids: Thursday ZG (15 Oct) and BWL + MC (16 Oct), with AI analyses and Fair parses.",
      "Fixed which raids count as guild raids: \"regular\" now means regular in the two months around a raid, not since January 2025. With the old rule the roster turnover had started marking this autumn's guild raids as PUGs.",
    ],
  },
  {
    version: "2.5.36",
    date: "2026-10-15",
    changes: [
      "Fair parse explained properly: a plain intro and a description on every switch, click any raider to see the working step by step with the parse curve, and a new \"How Fair parse works\" page with an example, what it can't see and a FAQ.",
    ],
  },
  {
    version: "2.5.35",
    date: "2026-10-14",
    changes: [
      "New, just for fun: \"Fair parse\" on every boss's Performance tab. An estimate of each DPS's parse with things evened out: time a mechanic took you out (Heigan's teleport, Web Wrap, ice blocks, mind control...), job casts like decurses and Tranquilizing Shots, and optionally world buffs, consumables and gear. Values come from Moist's own logs. The real parse always shows next to it.",
    ],
  },
  {
    version: "2.5.34",
    date: "2026-10-14",
    changes: [
      "Personal reviews for everyone in tonight's Naxxramas.",
    ],
  },
  {
    version: "2.5.33",
    date: "2026-10-14",
    changes: [
      "Tonight's Naxxramas: full clear in 1:44:17, the guild's fastest, with its AI analysis.",
    ],
  },
  {
    version: "2.5.32",
    date: "2026-10-11",
    changes: [
      "Profiles now have milestone badges: raid-count tiers, first big parse, deathless tiers, with NEW on anything earned last raid.",
    ],
  },
  {
    version: "2.5.31",
    date: "2026-10-11",
    changes: [
      "The analysis MVP card now glows and shines like the hero it names.",
    ],
  },
  {
    version: "2.5.30",
    date: "2026-10-11",
    changes: [
      "Pull strips on night-boss pages grow in on scroll, deaths dropping in the order they happened.",
    ],
  },
  {
    version: "2.5.29",
    date: "2026-10-11",
    changes: [
      "Guild record awards and best-ever chips now catch the light with a slow shimmer.",
    ],
  },
  {
    version: "2.5.28",
    date: "2026-10-11",
    changes: [
      "Stat tiles now count up when scrolled into view.",
    ],
  },
  {
    version: "2.5.27",
    date: "2026-10-11",
    changes: [
      "The unreadable raid calendar highlight is now a raid pace chart: kills per week for 26 weeks, bars growing in on scroll.",
    ],
  },
  {
    version: "2.5.26",
    date: "2026-10-11",
    changes: [
      "Relive the night: the raid timeline now plays the whole evening back, pulls lighting up as they happen.",
    ],
  },
  {
    version: "2.5.25",
    date: "2026-10-11",
    changes: [
      "Fight story timeline got some life: skulls drop in as deaths happen, the latest event pulses, and a time bubble rides the playhead. Respects reduced-motion settings.",
    ],
  },
  {
    version: "2.5.24",
    date: "2026-10-11",
    changes: [
      "Fight replays have a story timeline: every death and tracked mechanic on three scrubable lanes, synced to the race playhead, with filters.",
    ],
  },
  {
    version: "2.5.23",
    date: "2026-10-11",
    changes: [
      "Boss pages now chart each mechanic per night (hits per raider, oldest first), list close calls (3+ deaths in a kill's last 10 seconds, wipes at 5% or less, also badged on night pages), and the overview has a new recruit watch for raiders with fewer than 10 logged raids.",
    ],
  },
  {
    version: "2.5.22",
    date: "2026-10-11",
    changes: [
      "Corrected the 11 October AQ40 writeup: most of the non-regulars are familiar names, not new faces.",
    ],
  },
  {
    version: "2.5.21",
    date: "2026-10-11",
    changes: [
      "11 October AQ40 counts as a guild raid after all (new players, not a PUG), with rewritten analysis: four guild records. AI prose now carries a tag naming the model that wrote it, and Drikkle can inspect any player's private reviews.",
    ],
  },
  {
    version: "2.5.20",
    date: "2026-10-11",
    changes: [
      "AQ40 PUG night (9 of 9, no wipes) with AI analysis and personal reviews for the regulars.",
    ],
  },
  {
    version: "2.5.19",
    date: "2026-10-10",
    changes: [
      "Personal reviews for everyone in 30 September Naxxramas.",
    ],
  },
  {
    version: "2.5.18",
    date: "2026-10-10",
    changes: [
      "Personal reviews for everyone in 2 October MC.",
    ],
  },
  {
    version: "2.5.17",
    date: "2026-10-10",
    changes: [
      "Personal reviews for everyone in 2 October BWL.",
    ],
  },
  {
    version: "2.5.16",
    date: "2026-10-10",
    changes: [
      "Personal reviews for everyone in Sunday's AQ40 (4 October).",
    ],
  },
  {
    version: "2.5.15",
    date: "2026-10-10",
    changes: [
      "Personal reviews for everyone in Tuesday's ZG (6 October).",
    ],
  },
  {
    version: "2.5.14",
    date: "2026-10-10",
    changes: [
      "Follow-up on Friday's BWL and MC analyses from the final logs: guild averages updated (they moved a little as older raids came in), world buffs added for both raids, the Vaelastrasz death described properly (he turned on a DPS from his tank), and one wrong detail fixed (the two Majordomo deaths weren't both casters).",
    ],
  },
  {
    version: "2.5.13",
    date: "2026-10-09",
    changes: [
      "Every raider of tonight's MC now has a personal review too (39 of them; three who don't appear in any boss fight are left out).",
    ],
  },
  {
    version: "2.5.12",
    date: "2026-10-09",
    changes: [
      "Every raider of tonight's BWL now has a personal review.",
    ],
  },
  {
    version: "2.5.11",
    date: "2026-10-09",
    changes: [
      "Every raider of 7 October Naxxramas now has a personal review (log in with Battle.net to read yours).",
      "Reviews now check what was going on before calling anyone idle: debuffs on the player and boss buff changes during the gap.",
    ],
  },
  {
    version: "2.5.10",
    date: "2026-10-09",
    changes: [
      "Reviews now know two more BWL mechanics: Chromaggus's rotating weakness (a caster's parse depends on how long their school was the weak one) and Nefarian's mage call (Wild Magic, when not casting is the job). One review that blamed a mage for both is corrected.",
    ],
  },
  {
    version: "2.5.9",
    date: "2026-10-09",
    changes: [
      "The first personal reviews for tonight's BWL and MC are up for those who asked.",
    ],
  },
  {
    version: "2.5.8",
    date: "2026-10-09",
    changes: [
      "Claude's analysis of tonight's MC: 10 of 10 in 31:38, the guild's second fastest, every boss under the usual kill time.",
    ],
  },
  {
    version: "2.5.7",
    date: "2026-10-09",
    changes: [
      "Tonight's MC is up: 10 of 10, no wipes. Claude's analysis follows shortly.",
    ],
  },
  {
    version: "2.5.6",
    date: "2026-10-09",
    changes: [
      "Tonight's BWL is up, with Claude's analysis: a full clear in 34:56, the guild's second fastest.",
      "The MVP card has a word for the MVP.",
    ],
  },
  {
    version: "2.5.5",
    date: "2026-10-09",
    changes: [
      "More raid reviews, for 30 September Naxxramas, 2 October BWL and MC, and 4 October AQ40.",
    ],
  },
  {
    version: "2.5.4",
    date: "2026-10-09",
    changes: [
      "One raider asked to be roasted in their reviews. Request granted.",
    ],
  },
  {
    version: "2.5.3",
    date: "2026-10-09",
    changes: [
      "Claude's analyses and reviews now say plainly that Claude often gets vanilla mechanics wrong: trust the numbers more than the explanations.",
      "More raid reviews: most of 7 October Naxxramas, plus the first ones for 2 October and 4 October.",
    ],
  },
  {
    version: "2.5.2",
    date: "2026-10-09",
    changes: [
      "Raid reviews moved into their own Reviews tab on My Page, next to Raid record and SR points, instead of sitting on top of the page. Raids with a review get a small \"review\" link in your raid list.",
      "The login bar on My Page is a single quiet line now when you're not logged in.",
      "Reviews treat a rolling Ignite as what it is: the fire mages' combined damage, credited (with all its threat) to whoever owns it.",
    ],
  },
  {
    version: "2.5.1",
    date: "2026-10-09",
    changes: [
      "Raid reviews now account for Ignite: a fire mage owning a rolling Ignite takes all its threat, even when other mages' crits keep it going. One review blamed a Maexxna death on the mage's own casting; the log shows it was the Ignite, and the review is corrected.",
    ],
  },
  {
    version: "2.5.0",
    date: "2026-10-09",
    changes: [
      "Personal raid reviews: log in with Battle.net and My Page shows Claude's review of each of your recent raids. A grade, what went well, what to fix (with how much it mattered), boss by boss parses against your own usual, deaths, your world buffs pull by pull and your consumables.",
      "Only you can see your own reviews; they never ship with the site. Reviews are being written for the most recent raids, starting with 7 October Naxxramas.",
    ],
  },
  {
    version: "2.4.1",
    date: "2026-10-09",
    changes: [
      "My Page has a proper login now: log in with Battle.net to get all your characters at once (with a short note on what the site gets from Blizzard and why), or just pick your character by hand.",
      "When you're logged in, a bar at the top of your page shows it, with all your characters to switch between and a log out link.",
    ],
  },
  {
    version: "2.4.0",
    date: "2026-10-09",
    changes: [
      "You can now verify your characters with Battle.net on My Page. Blizzard confirms which characters are on your account; your password and email never reach this site.",
      "Once verified, the site knows it's you: your main is picked automatically, all your characters on Firemaw count as you and get highlighted everywhere, and you can switch between them on My Page.",
    ],
  },
  {
    version: "2.3.12",
    date: "2026-10-09",
    changes: [
      "Claude's analysis of the 2 October BWL now gets the Technicians right: techie-tanking them is a mage's job, and the wipe came from doing it next to Firemaw and then dying, which set the Technicians loose on the tank and healers.",
    ],
  },
  {
    version: "2.3.11",
    date: "2026-10-09",
    changes: [
      "Wording fix in Claude's analysis of the 2 October BWL.",
    ],
  },
  {
    version: "2.3.10",
    date: "2026-10-09",
    changes: [
      "Claude's analysis of the 2 October BWL is now considerably less polite about who pulled Firemaw.",
    ],
  },
  {
    version: "2.3.9",
    date: "2026-10-09",
    changes: [
      "Fixed the site failing to publish: with months of raid logs added, building the site ran out of memory. Raid data now loads as separate files when a page needs it, which also makes building about five times faster.",
    ],
  },
  {
    version: "2.3.8",
    date: "2026-10-09",
    changes: [
      "The Firemaw blame on 2 October now rests on the log alone: who the Technicians were hitting and who stood closest to Firemaw when he woke up.",
    ],
  },
  {
    version: "2.3.7",
    date: "2026-10-09",
    changes: [
      "Claude's analysis of the 2 October BWL now names who caused the Firemaw wipe.",
    ],
  },
  {
    version: "2.3.6",
    date: "2026-10-09",
    changes: [
      "Claude's analysis of the 2 October BWL now says how Firemaw got pulled: a body pull while the trash was being fought next to him.",
    ],
  },
  {
    version: "2.3.5",
    date: "2026-10-09",
    changes: [
      "Claude's analysis for the 2 October MC, the second raid of that evening.",
    ],
  },
  {
    version: "2.3.4",
    date: "2026-10-09",
    changes: [
      "Claude's analysis for the 2 October BWL, including the wipe on the trash in Firemaw's room and the world buffs it cost.",
    ],
  },
  {
    version: "2.3.3",
    date: "2026-10-09",
    changes: [
      "Fixed Claude's analysis of 7 October on Kel'Thuzad: there were five Guardians, not fifteen. A bleed kept breaking the shackle on one of them, which is why it was recast so often, and a second one was loose too.",
      "The shackle counter on boss pages now says what it counts: shackles cast, including recasts after a shackle breaks.",
    ],
  },
  {
    version: "2.3.2",
    date: "2026-10-09",
    changes: [
      "Claude's analysis is now up for 4 October (AQ40) and the 5 October Monday PUG MC, which is compared with other PUG runs.",
    ],
  },
  {
    version: "2.3.1",
    date: "2026-10-09",
    changes: [
      "Tanks and healers are recognised better: protection paladins and bear druids now count as tanks, and holy priests and resto druids who use their wand or Faerie Fire a lot count as healers.",
      "Fixed several boss mechanics that never counted (Twin Emperors' exploding bugs, Nefarian's class calls) and added Venoxis' Holy Wrath chain.",
      "Consumables pick up Superior Healing, Greater Mana, Rage and Great Rage potions, Solid Dynamite and more, and buffs are grouped into flasks, elixirs, Juju, Zanza and Blasted Lands, food and drinks.",
      "Spells that Warcraft Logs shows under a later expansion's name are shown under their Classic name, like Blessing of Protection.",
    ],
  },
  {
    version: "2.3.0",
    date: "2026-10-09",
    changes: [
      "Claude's analysis now names an MVP for each raid, picked from everything the logs show: consistent parses, the jobs someone carried (tanking, soaks, kicks, dispels, battle rezzes), deaths and the world buffs they cost, not just the meters. With a couple of honourable mentions.",
    ],
  },
  {
    version: "2.2.1",
    date: "2026-10-09",
    changes: [
      "Time charts all read the same way now: faster is lower, including the small kill-time trends on boss lists.",
      "Charts with a long history stay readable: instead of a crowd of dots they show each raid as a faint line, a rolling median for the trend, and mark only records and the latest raid. Hover still shows every raid.",
      "Fixed the header pushing the page sideways on medium-width screens.",
    ],
  },
  {
    version: "2.2.0",
    date: "2026-10-08",
    changes: [
      "PUG runs like the Monday MC are recognised from who was there: they keep their own pages, labelled PUG run, but no longer count toward guild records, averages, attendance or boss histories.",
      "Raids from other guilds that a member happened to upload under Moist are left out.",
      "Fixed a wrong statement in Claude's analysis of 7 October: the raid rebuffed Rallying Cry and Zandalar after the Sapphiron wipe.",
    ],
  },
  {
    version: "2.1.0",
    date: "2026-10-08",
    changes: [
      "Raid Logs now show one page per raid: an evening of BWL and MC is two raids, and a Naxx finished on Sunday links back to Wednesday's part of the lockout.",
      "Claude's analysis: a clearly labelled, AI-written review on raid pages, with each wipe explained, a few notes per boss and shout-outs for good plays. It starts as a short preview you can open.",
      "Consumables now show the flasks, elixirs, Juju, Zanza and food people had up on boss pulls, with potions, runes and explosives listed separately.",
      "Raid numbers (damage, healing, deaths, mechanics, replays) are now worked out from each raid's full combat log, which makes them more exact.",
      "Removed the Leeroy Jenkins easter egg.",
    ],
  },
  {
    version: "2.0.0",
    date: "2026-10-08",
    changes: [
      "Moist is now one site: a new Home page ties together SR Points, the new Raid Logs and your own page.",
      "Raid Logs (new): every raid night from the guild's Warcraft Logs: a timeline of pulls and deaths, a few highlights from each night, boss and raid pages, clear-time trends and guild records.",
      "Every raider's page (and My Page) now has a Raid record tab next to their SR points, and raiders who only show up in the logs get a page too.",
      "Names across the site show in class colour with their class/spec icon and link to the raider's page; page headers share one look.",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-09-21",
    changes: [
      "Improved the small-screen experience with a leaner header, horizontally scrolling navigation and filters, clearer dense lists, and a card layout for SR history on phones.",
      "Winner records are now treated as an incomplete log: profiles show recorded wins instead of misleading zeroes, and winner-based achievements, luck, and superlatives stay hidden until that data is trustworthy.",
      "Added clearer data-quality messaging to profiles, item pages, recorded loot, and guild statistics.",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-08-29",
    changes: [
      "Reworked the mobile layout: the top bar now reflows into tidy rows (brand, search, then a nav that wraps cleanly instead of truncating), panel headings stack their subtitle, and tables breathe better on small screens.",
      "Added guild-observed drop rates on item pages, worked out from how often each item has actually been awarded versus how many times we've cleared the raid. Compare it against Wowhead's rates yourself.",
      "Added this changelog and a visible version number, plus links to the GitHub repo.",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-08-27",
    changes: [
      "Achievements: rarity badges on profiles, locked achievements now show progress bars, and a Most Decorated board on Statistics.",
      "Internal item pages with standings, win odds and past winners.",
      "Faster loads: cached data shows instantly, then refreshes in the background.",
    ],
  },
];

export const VERSION = CHANGELOG[0].version;
