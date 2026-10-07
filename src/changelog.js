// Site version + human-curated changelog. Add an entry at the TOP of CHANGELOG
// whenever you ship something worth noting; VERSION is derived from the newest
// entry, so you only edit one place. Surfaced in the footer and on /#/changelog.

export const REPO_URL = "https://github.com/cedrikaagaard/moist-points";

export const CHANGELOG = [
  {
    version: "2.0.0",
    date: "2026-10-08",
    changes: [
      "Moist is now one site: a new Home page ties together SR Points, the new Raid Logs and your own page.",
      "Raid Logs (new): every raid night from the guild's Warcraft Logs - a timeline of pulls and deaths, standout cards for the useful work nobody sees (decurses, kicks, battle rezzes, Sunders, curses), boss and raid pages, clear-time trends and guild records.",
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
