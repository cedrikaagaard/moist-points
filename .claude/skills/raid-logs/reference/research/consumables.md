# Classic Era raid consumables: log names, stacking, role norms

Built for `scripts/raids/config.mjs` (TRACKED_CASTS / CONSUME_BUFFS).

## Sources and method

There are two kinds of evidence:

1. **Ground truth from Moist's own logs (most trusted for names).** I scanned every raw event page in `/Users/cedrik/moist/data/events/` (146 nights, 65,679 `combatantinfo` pull snapshots) and every player `cast` / self-`applybuff` event, then joined them with each report's `masterData.abilities` names (`data/wcl/reports/*.json.gz`).
   - Scripts: `scratchpad/scripts/scan.mjs`, `scan2.mjs`, `cooc.mjs`, `death2.mjs` / `death3.mjs`.
   - Raw outputs: `scratchpad/research/scan.json` (aura name|id counts), `scan2.json` (cast name|id counts) and `pairs.json` (aura co-occurrence).
   - These give the **exact names Warcraft Logs uses**. They often differ from Wowhead's spell names. For example, WCL calls spell 24363 "Mageblood Elixir", but Wowhead names it "Mana Regeneration". WCL calls 24361 "Mighty Troll's Blood Elixir", but Wowhead names it "Regeneration".
2. **Web:** Wowhead Classic spell pages (effects, durations, enchant IDs), plus warcraft.wiki.gg pages on Flask, Elixir and Spirit of Zanza, and Classic consumable guides. The URL appears beside each claim.

**Confidence tags:**
- **[LOG]**: seen in our logs, exact.
- **[WH]**: Wowhead Classic spell page.
- **[WIKI]**: warcraft.wiki.gg.
- **[GUIDE]**: a third-party guide.
- **[INF]**: my inference, unverified.

---

## 1. Consumables and their exact log names

### 1a. Buff snapshot at the pull (`combatantinfo.auras`), all names [LOG]
Counts are pull-snapshots out of 65,679.

| Log aura name | Spell ID | Item | Effect / duration | Snapshots |
|---|---|---|---|---|
| **Flasks** (1 at a time; persist through death) |||||
| Flask of the Titans | 17626 | Flask of the Titans | +1200 HP, 2 h [WH spell=17626, flag "persists through death"] | 9641 |
| Distilled Wisdom | 17627 | Flask of Distilled Wisdom | +2000 mana, 2 h | 5835 |
| Supreme Power | 17628 | Flask of Supreme Power | +150 spell dmg, 2 h | 3962 |
| Chromatic Resistance | 17629 | Flask of Chromatic Resistance | +25 all resist, 2 h [WH spell=17629] | 0 |
| Petrification | 17624 | Flask of Petrification | 1 min stun and immunity [WH spell=17624]. Name is **not** "Flask of Petrification". 7 casts in our logs, never on a pull snapshot. | 0 |
| **Agility / melee elixirs** |||||
| Elixir of the Mongoose | 17538 | same | +25 Agi, +2% crit, 1 h [WH spell=17538] | 32118 |
| Greater Agility | 11334 | Elixir of Greater Agility | +25 Agi | 400 |
| Elixir of the Giants | 11405 | same | +25 Str, 1 h | 15833 |
| Elixir of Brute Force | 17537 | same | +18 Str/Sta | 89 |
| Juju Power | 16323 | Juju Power | +30 Str, 30 min [WH spell=16323] | 11876 |
| Juju Might | 16329 | Juju Might | +40 AP, 10 min [WH spell=16329] | 677 |
| Winterfall Firewater | 17038 | same | +35 AP, 20 min [WH spell=17038] | 11070 |
| **Caster elixirs** |||||
| Greater Arcane Elixir | 17539 | same | +35 spell dmg, 1 h [WH spell=17539] | 6736 |
| Greater Firepower | 26276 | Elixir of Greater Firepower | +40 fire, 30 min [WH spell=26276] | 3102 |
| Shadow Power | 11474 | Elixir of Shadow Power | +40 shadow, 30 min [WH spell=11474] | 1339 |
| Frost Power | 21920 | Elixir of Frost Power | +15 frost | 583 |
| Greater Intellect | 11396 | Elixir of Greater Intellect | +25 Int | 24 |
| Elixir of the Sages | 17535 | same | +18 Int/Spi | 6 |
| Arcane Elixir | 11390 | Arcane Elixir | +20 spell dmg | 0 on snapshots (21 casts) |
| **Defensive / regen elixirs** |||||
| Mageblood Elixir | 24363 | Mageblood Potion | 12 mp5, 1 h [WH spell=24363, named "Mana Regeneration" there] | 19399 |
| Elixir of Fortitude | 3593 | same | +120 HP | 8797 |
| Greater Armor | 11348 | Elixir of Superior Defense | +450 armor | 7195 |
| Mighty Troll's Blood Elixir | 24361 | **Major** Troll's Blood Elixir (20 hp5, 1 h) [WH spell=24361] | WCL's label says "Mighty" | 1402 |
| Major Troll's Blood Elixir | 3223 | Mighty Troll's Blood Elixir (12 hp5) [WH spell=3223] | WCL's labels look swapped versus the items. Seen only as 1 cast. | 0 |
| Gift of Arthas | 11371 | Gift of Arthas | +10 shadow resist, proc | 0 on snapshots (41 casts) |
| **Zanza (Zul'Gurub)** |||||
| Spirit of Zanza | 24382 | Spirit of Zanza | +50 Sta / +50 Spi, 2 h [WH spell=24382] | 16406 |
| Swiftness of Zanza | 24383 | Swiftness of Zanza | +20% run speed, 2 h | 956 |
| Sheen of Zanza | 24417 | Sheen of Zanza | spell reflect | 5 |
| **Blasted Lands** |||||
| Rage of Ages | 10667 | R.O.I.D.S. | +25 Str, 1 h [WH spell=10667] | 1307 |
| Strike of the Scorpok | 10669 | Ground Scorpok Assay | +25 Agi | 1211 |
| **Spirit of Boar** | 10668 | Lung Juice Cocktail | +25 Sta, 1 h [WH spell=10668]. **Not** "Spirit of the Boar". | 41 |
| Infallible Mind | 10692 | Cerebral Cortex Compound | +25 Int | 39 |
| Spiritual Domination | 10693 | Gizzard Gum | +25 Spi | 17 |
| **Juju (other)** |||||
| Juju Ember | 16326 | Juju Ember | +15 fire resist | 344 |
| Juju Chill | 16325 | Juju Chill | +15 frost resist | 245 |
| Juju Flurry | 16322 | Juju Flurry | +3% attack speed, 20 s | 2 |
| Juju Guile / Juju Escape | — | — | never seen | 0 |
| **Food** (all mutually exclusive) |||||
| Well Fed | 24799 | Smoked Desert Dumplings | +20 Str, 15 min [WH spell=24799] | 10684 |
| Well Fed | 19710 | e.g. +12 Sta/Spi foods | 15 min [WH spell=19710] | 8092 |
| Well Fed | 25941 | Sagefish Delight (6 mp5) | 15 min [WH spell=25941] | 226 |
| Well Fed | 19709 | +8 Sta/Spi foods | 15 min [WH] | 52 |
| Well Fed | 24870 | minor (+Spi) | [WH] | 18 |
| Well Fed | 25694 | Smoked Sagefish (3 mp5) | [WH] | 13 |
| Well Fed | 19708 | minor | [INF] | 4 |
| Mana Regeneration | 18194 | Nightfin Soup | 8 mp5, 10 min [WH spell=18194] | 4608 |
| Increased Agility | 18192 | Grilled Squid | +10 Agi, 10 min [WH spell=18192] | 2698 |
| Increased Intellect | 22730 | Runn Tum Tuber Surprise | +10 Int, 10 min [WH spell=22730] | 379 |
| Increased Stamina | 25661 | Dirge's Kickin' Chimaerok Chops | +25 Sta, 15 min [WH spell=25661] | 367 |
| Blessed Sunfruit | 18125 | Blessed Sunfruit | +10 Str, 10 min [WH spell=18125] | 3935 |
| Blessed Sunfruit Juice | 18141 | Blessed Sunfruit Juice | +10 Spi | 1213 |
| "Increased Strength" | — | — | **never seen** | 0 |
| **Alcohol** |||||
| Gordok Green Grog | 22789 | same | +10 Sta, 15 min [WH spell=22789] | 14322 |
| Kreeg's Stout Beatdown | 22790 | same | +25 Spi / −5 Int, 15 min [WH spell=22790] | 3041 |
| Rumsey Rum Black Label | 25804 | same | +15 Sta | 533 |
| Rumsey Rum Dark | 25722 | same | cast 10×, never on a snapshot | 0 |
| **Scrolls** (not tracked by config) |||||
| Armor | 12175 | Scroll of Protection IV [INF] || 82 |
| Strength | 12179 / 8120 | Scroll of Strength IV / III [INF] || 26 / 17 |
| Agility | 12174 / 8117 | Scroll of Agility IV / III [INF] || 18 / 5 |
| Intellect | 12176 / 8098 | Scroll of Intellect IV / III [INF] || 2 / 17 |
| Versatility | 12177 | Scroll of Spirit IV. WCL's vanilla data relabels Spirit as "Versatility" (Sayge's "of Spirit" also shows as "Sayge's Dark Fortune of Versatility" 23738) [LOG, INF] || 7 |
| **Other pre-pull buffs** |||||
| Greater Stoneshield | 17540 | Greater Stoneshield Potion (pre-pot) || 117 |
| Resist Fire | 15123 | +2 fire resist, 1 h [WH spell=15123]. **Source unknown.** Not a consumable we need. || 3844 |
| Crystal Ward | 15233 | Crystal Ward (Un'Goro crystal) || 11 |
| Fury of the Bogling | 5665 | Bogling Root || 4 |

World buffs are also in the snapshot but are not consumables. They are Rallying Cry of the Dragonslayer, Spirit of Zandalar, Warchief's Blessing / Might of Stormwind, Songflower Serenade, the three DM buffs, Sayge's fortunes, Traces of Silithyst and Battle Squawk.

### 1b. Weapon oils / stones
These **do not show up as auras.** They appear in `combatantinfo.gear[].temporaryEnchant` (the enchant ID) on the weapon slots. They also show as `cast` events when applied, if the application happens inside a logged fight.

| temporaryEnchant | Item | Source | Seen (sample of ~2 months) |
|---|---|---|---|
| 2506 | Elemental Sharpening Stone (+2% crit, 30 min) | [WH spell=22756] | 397 |
| 1643 | Dense Sharpening Stone ("Sharpened +8") | [WH spell=16138] | 503 |
| 1703 | Dense Weightstone ("Weighted +8") | [WH spell=16622] | 63 |
| 2629 | Brilliant Mana Oil | [WH spell=25123 via search] | 283 |
| 2628 | Brilliant Wizard Oil | [WH spell=25122] | 164 |
| 2627 / 2626 / 2625 | Wizard Oil / Lesser Wizard Oil / Lesser Mana Oil | [INF, sequential IDs] | 11 / 5 / 26 |
| 2684 | Consecrated Sharpening Stone (+100 AP vs undead) | [WH spell=28891] | 0 |
| 2685 | Blessed Wizard Oil | [INF] | 0 |
| 625 / 624 / 2630 | Instant Poison VI / V / Deadly Poison V | [INF] | 384 / 6 / 1 |

The cast names in the log are:
- **Stones and weightstones:** "Elemental Sharpening Stone" (22756), **"Sharpen Blade V"** (16138, Dense Sharpening Stone) and **"Enhance Blunt Weapon V"** (16622, Dense Weightstone).
- **Oils:** "Brilliant Mana Oil" (25123), "Brilliant Wizard Oil" (25122), "Wizard Oil" (25121), "Lesser Mana Oil" (25120) and "Minor Mana Oil" (25118).

The `temporaryEnchant` field is the reliable signal.

### 1c. Potions, runes and healthstones: cast events [LOG names; IDs from LOG, effects from WH]

| Log cast name | Spell ID(s) | Item | Casts in our logs |
|---|---|---|---|
| Restore Mana | **17531** (Major, 1350–2250) [WH], **17530** (Superior, 900+) [WH], 11903 (Greater), 2023, 438 | Mana potions | 5260 / 1228 / 523 / 14 / 1 |
| Healing Potion | **17534** (Major, 1050+) [WH], **4042** (Superior, 700+) [WH], 2024 | Healing potions | 1681 / 303 / 6 |
| Rejuvenation Potion | 22729 | Major Rejuvenation Potion (1440 HP and mana) [WH] | 10 |
| Invulnerability | 3169 | Limited Invulnerability Potion (6 s physical immunity) [WH] | 2692 |
| Free Action | 6615 | Free Action Potion | 2413 |
| Living Free Action | 24364 | Living Action Potion | 12 |
| Mighty Rage | 17528 | Mighty Rage Potion | 3524 |
| **Great Rage** | 6613 | Great Rage Potion (30 rage) [WH] | **881** |
| **Rage** | 6612 | Rage Potion | 205 |
| Restore Energy | 9512 | Thistle Tea | 2836 |
| Speed | **2379** | Swiftness Potion (+50%, 15 s) [WH] | 108 |
| Speed | **14530** | **not a potion**: +40% for 10 s [WH]. Nifty Stopwatch trinket [INF]. | 21 |
| Restoration | 11359 | Restorative Potion | 14 |
| Greater Stoneshield | 17540 | Greater Stoneshield Potion | 617 |
| Frost Protection | 17544 (Greater), 7239 (lesser) | Frost Protection Potions | 2402 / 21 |
| Fire Protection | 17543 (Greater), 7233 (lesser), **29432 (Frozen Rune)** [INF] | | 595 / 2 / 3 |
| Nature Protection | 17546, 7254 | | 816 / 95 |
| Shadow Protection | 17548 (Greater), 7242 (lesser); **10958 and 27683 are the priest buff** | | 609 / 19 |
| Arcane Protection | 17549 | Greater Arcane Protection Potion | 125 |
| Noggenfogger Elixir | 16589 | Noggenfogger | 1083 |
| Powerful Anti-Venom / Cure Ailments | 23786 / 3592 | | 60 / 11 |
| Resistance | 11364 | Magic Resistance Potion [INF] | 12 |
| Dreamless Sleep | 15822 | | 1 |
| Purification | — | Purification Potion. **Never cast in 146 nights.** Spell 17572 is the alchemy *craft* spell, not the use [WH]. Use-spell ID unverified. | 0 |
| Major Healthstone | 23477 (improved), 11732 | | 1238 / 456 |
| Greater Healthstone | 23475, 5723, 23474 | | 15 / 24 / 1 |
| Demonic Rune | 16666 (900 mana / 600 dmg) [WH] | | 590 |
| Dark Rune | 27869 | | 244 |
| Whipper Root Tuber / Night Dragon's Breath | 15700 / 15701 | Food-like heal / mana items | 288 / 236 |

Consumable buffs also appear as casts:
- **Elixirs, flasks and food:** Elixir of the Mongoose 927, Elixir of the Giants 494, Spirit of Zanza 191, Flask of the Titans 112 and Cooked Deviate Fish 95.
- **Alcohol:** Gordok Green Grog 1341, Winterfall Firewater 953 and Kreeg's 322.

These casts are fight-scoped only, because the events are fetched per fight. Pre-raid drinks are mostly missed, so the **snapshot is the right source for buffs**.

### 1d. Engineering and explosives: cast events [LOG]

| Log cast name | Spell ID | Item | Casts |
|---|---|---|---|
| Goblin Sapper Charge | 13241 | | 6442 |
| Dense Dynamite | 23063 | | 3559 |
| **Ez-Thro Dynamite** | **23000** | **Ez-Thro Dynamite II** [WH spell=23000; item 18588 per WIKI] | 403 |
| Ez-Thro Dynamite | 8331 | Ez-Thro Dynamite (I) | 4 |
| Iron Grenade | 4068 | | 325 |
| Thorium Grenade | 19769 | | 65 |
| **Solid Dynamite** | 12419 | | **61** |
| Hi-Explosive Bomb | 12543 | | 52 |
| **Mithril Frag Bomb** | 12421 | | 17 |
| Dark Iron Bomb / Big Bronze Bomb / Rough Dynamite | 19784 / 4067 / 4054 | | 6 / 3 / 4 |
| Goblin Mortar / Gnomish Death Ray | 13237 / 13278 | | 1 / 1 |
| Stratholme Holy Water | 17291 | | 515 |
| Frost Reflector / Rocket Boots | 23131 / 13141, 8892 | | 17 / 3+1 |
| Arcanite Dragonling / Goblin Rocket Helmet | — | never seen | 0 |

**"Ez-Thro Dynamite II" never appears as a name.** The item's spell is called "Ez-Thro Dynamite" (23000).

---

## 2. Stacking rules (empirical co-occurrence over 65,679 snapshots, plus sources)

Vanilla has **no battle/guardian elixir system**; that came in TBC. The "Battle Elixir" wording on wiki pages, e.g. warcraft.wiki.gg/wiki/Spirit_of_Zanza, is later classification. In vanilla, each buff belongs to a hidden "spell group" that overrides others in the same group.

Two buffs that appear together on the same player at the same pull **do** stack. A pair that is never seen together across thousands of snapshots almost certainly overrides.

| Group (mutually exclusive) | Evidence |
|---|---|
| **Flasks**: Titans / Distilled Wisdom / Supreme Power / Chromatic | 0 co-occurrences. Patch 1.6.0: "You can now only have one Flask affecting you at a time" [WIKI Flask]. |
| Flasks vs elixirs | **Stack.** Titans + Mongoose 9282, Supreme Power + Greater Arcane 3571, Distilled + Mageblood 5160. |
| **Strength**: Elixir of the Giants / Juju Power / Elixir of Brute Force | 0 / 0 / 0, versus 15.8k and 11.9k singles [LOG]. "You cannot stack Elixir of Giants and Juju Power" [GUIDE bittsguides]. |
| **Zanza + Blasted Lands, one shared slot**: Spirit / Swiftness / Sheen of Zanza, Rage of Ages, Strike of the Scorpok, Spirit of Boar, Infallible Mind, Spiritual Domination | **All pairs 0.** Spirit of Zanza (16.4k) + Rage of Ages (1.3k) = 0. "choose between either 1 Blasted Lands buff or 1 Zanza buff" [GUIDE warcrafttavern feral tank SoM]. |
| **Food**: all "Well Fed" variants, Mana Regeneration, Increased Agi/Int/Sta, Blessed Sunfruit, Blessed Sunfruit Juice | All pairs 0. Blessed Sunfruit and Juice **are food buffs**, not drinks. |
| **Stamina alcohol**: Gordok Green Grog / Rumsey Rum Black Label | 0 |
| Kreeg's Stout Beatdown vs the above | **Stacks** (+ Grog 2228, + Rumsey 53). |
| Resist jujus: Ember / Chill / Flurry | 0, but small samples [LOG, low confidence]. |
| Scrolls vs Greater Armor | Scroll "Armor" + Greater Armor = 0 (n=82; likely override, low confidence). Agility + Strength scrolls co-occur 3×. |

**Things that DO stack (common misconception):**
- Juju Might + Winterfall Firewater: 122 [LOG]
- Mongoose + Greater Agility: 90
- Juju Power + Juju Might: 573
- Greater Arcane + Greater Firepower / Shadow Power / Frost Power: 3031 / 1257 / 517
- Greater Firepower + Shadow Power: 283
- Mageblood + Nightfin "Mana Regeneration": 4082
- Mageblood + Fortitude + Greater Armor + Troll's Blood: all stack
- Zanza or Blasted Lands with elixirs, Juju and flasks: all stack

**Durations** [WH unless noted]:

| Duration | Buffs |
|---|---|
| 2 h | Flasks, Spirit of Zanza / Swiftness of Zanza |
| 1 h | Mongoose, Giants, Greater Arcane, Mageblood, Troll's Blood, Blasted Lands buffs |
| 30 min | Greater Firepower, Shadow Power, Juju Power, weapon oils and stones |
| 20 min | Winterfall Firewater |
| 15 min | Most "Well Fed" variants, Dirge's Chops, Grog, Kreeg's |
| 10 min | Juju Might; Nightfin, Grilled Squid, Runn Tum and Blessed Sunfruit food buffs |

The short food durations (10–15 min) mean the food share at a pull reads lower than raiders' real effort.

## 3. What "fully consumed" looks like (Moist's own pulls, % of boss pulls present)

How each role is computed:
- **Coverage:** `consumeBuffs.by[player]` divided by the pulls in `bosses[].present`. It is a lower bound, because some pulls have no snapshot.
- **"Normal":** what the median Moist raider has.
- **"Try-hard":** a full stack in every slot, drawn from guides [GUIDE warcrafttavern / bittsguides] and the top users in our data.

| Role | Normal at Moist (coverage) | Fully consumed / try-hard |
|---|---|---|
| Melee (warrior, rogue) | Mongoose 80–85%, Giants or Juju Power ~50–80%, Winterfall 17–42%, Well Fed ~20–47%, Zanza ~25%, Titans ~22%, Grog ~20% | Flask of the Titans + Mongoose + Juju Power (or Giants) + Winterfall + Juju Might + R.O.I.D.S. or Scorpok (or Spirit of Zanza) + Smoked Desert Dumplings (or Grilled Squid for rogues/hunters) + Grog/Rumsey + Elemental or Dense stones. In-fight: Mighty Rage / Thistle Tea, sappers, dense dynamite, LIP, Free Action. |
| Caster DPS (mage, warlock) | Greater Arcane ~60–65%, Supreme Power ~40%, Firepower or Shadow Power 20–45%, Mageblood ~30–60% | Supreme Power + Greater Arcane + school elixir (Firepower / Shadow Power / Frost Power) + Mageblood + Brilliant Wizard Oil + Runn Tum or Nightfin + Infallible Mind / Spirit of Zanza. In-fight: Major Mana, Demonic / Dark Rune. |
| Healer | Mageblood 64–75%, Distilled Wisdom 25–36%, Zanza ~20–26%, Nightfin 14–23% | Distilled Wisdom + Mageblood + Nightfin Soup + Brilliant Mana Oil + Spirit of Zanza + Kreeg's (priests). In-fight: Major Mana, Runes. |
| Tank (warrior, bear) | Mongoose ~87%, Giants ~55%, Greater Armor ~53%, Titans ~49%, Fortitude ~46%, Zanza ~44%, Well Fed ~55% | Titans + Mongoose + Giants / Juju Power + Greater Armor + Fortitude + Troll's Blood + Spirit of Zanza + Dumplings or Chimaerok Chops + Grog + Rumsey. In-fight: Greater Stoneshield, LIP, protection potions on fire / nature fights. |

Things that mark a raider as "try-hard":
- A flask on a DPS player (Titans on melee ~22%)
- Juju Might on top of Winterfall
- Blasted Lands buffs (rarely used here: Rage of Ages ~6% for warriors)
- Swiftness or Sheen of Zanza
- Sappers or dense dynamite every pull
- Brilliant oils on healers

## 4. Persistence through death

- **Flasks persist.** Patch 1.7.0: "The Effects of Flasks will now persist through death" [WIKI Flask]. The Wowhead flag "persists through death" appears on spell 17626.
- **World buffs, Zanza and Blasted Lands are lost.** I measured the share of players who had a buff at pull N, died in pull N, and still had it at pull N+1 [LOG]:
  - Rallying Cry / Zandalar 12% (a noise floor from re-buffs and edge cases)
  - Songflower 0%, Fengus 2%
  - Spirit of Zanza 20%, Rage of Ages 0%, Strike of the Scorpok 0%

  Spirit of Zanza can't be immediately re-drunk because the item is Unique, so you can carry only one [WIKI Spirit_of_Zanza].
- **Elixirs, Juju, food and alcohol: uncertain.** The general rule says elixirs "disappear when you die" [WIKI Elixir]. Wowhead does **not** flag Mongoose / Rage of Ages / Well Fed as death-persistent. But our logs show retention after death almost as high as flasks:

  | Buff | Kept after dying | Kept by survivors |
  |---|---|---|
  | Flask of the Titans | 91% | 98% |
  | Mongoose | 90% | — |
  | Juju Power | 90% | — |
  | Giants | 86% | — |
  | Mageblood | 77% | — |
  | Well Fed | 78% | 87% |
  | Grog | 76% | — |

  The contrast with Zanza/ROIDS (0–20%) is strong. It suggests either that these buffs persist in the current Era client, or that people re-apply them between pulls very reliably. Re-application can't be excluded, because events are fetched only inside fights. I found no patch note either way.
- **Recommendation:** do not infer "lost on death" for elixirs. Treat Zanza, Blasted Lands and world buffs as lost on death.

---

## Discrepancies with config.mjs

### CONSUME_BUFFS
1. **Wrong name:** `"Spirit of the Boar"` should be **`"Spirit of Boar"`** (10668, 41 snapshots currently missed).
2. **Wrong name:** `"Flask of Petrification"` should be **`"Petrification"`** (17624). It is a 1-minute effect and never on a pull snapshot, so it is harmless either way.
3. **Never-matching names:** `"Elixir of Greater Firepower"` (the log uses "Greater Firepower", already listed), `"Increased Strength"` and `"Rumsey Rum Dark"` (0 snapshots). The last two are harmless; drop them or keep them as aliases.
4. **Missing:**
   - `"Elixir of the Sages"` (17535): elixir.
   - Scrolls `"Armor"`, `"Strength"`, `"Agility"`, `"Intellect"`, `"Versatility"` (= Scroll of Spirit), `"Stamina"`. These are generic names, so match them by aura ability ID (12175 / 12179 / 8120 / 12174 / 8117 / 12176 / 8098 / 12177 / 12178) if added.
   - `"Greater Stoneshield"` (pre-pot, 117) and `"Crystal Ward"` (optional).
5. **Misclassified:** the `elixir` group mixes four real categories: elixirs, Juju, Zanza/Blasted Lands and alcohol (Winterfall Firewater). Suggested groups:
   - `flask`
   - `elixir`: Mongoose, Giants, Greater Agility, Brute Force, Greater Arcane, Firepower, Shadow / Frost Power, Greater Intellect, Sages, Arcane Elixir, Mageblood, Fortitude, Greater Armor, Troll's Blood, Gift of Arthas
   - `juju`: Power, Might, Ember, Chill, Flurry, Guile, Escape
   - `zanza`: Spirit / Swiftness / Sheen of Zanza, Rage of Ages, Strike of the Scorpok, Spirit of Boar, Infallible Mind, Spiritual Domination. **This is one shared slot.**
   - `food`: Well Fed, Mana Regeneration, Increased X, Blessed Sunfruit (+ Juice)
   - `drink`: Gordok Green Grog, Rumsey Rum Black Label, Kreeg's Stout Beatdown, Winterfall Firewater

   Today `food` contains the alcohol. Winterfall Firewater sits under `elixir`, although it is an alcohol-like drink that stacks with Juju Might.
6. **"Well Fed" is ambiguous:** seven spell IDs from +20 Str dumplings (24799) to 3 mp5 sagefish (25694). If the site wants to show *which* food, key by aura ability ID; `auras[].ability` is available in combatantinfo, but `derive.mjs` keeps only name and icon. The icon also differs per food.
7. **"Mighty Troll's Blood Elixir":** the name matches the log (24361), but it is the 20 hp5 **Major** item. Use a label if it's displayed.
8. **Weapon oils / stones are not tracked at all.** They never appear as auras. Read `combatantinfo.gear[15|16|17].temporaryEnchant`:
   - 2506 Elemental Sharpening Stone
   - 1643 Dense Sharpening Stone
   - 1703 Dense Weightstone
   - 2629 Brilliant Mana Oil
   - 2628 Brilliant Wizard Oil
   - 2627 Wizard Oil
   - 2625 Lesser Mana Oil
   - 2684 Consecrated Sharpening Stone
   - 625 / 2630 rogue poisons (ignore)

### TRACKED_CASTS
9. **Wrong spell ID:** `Healing Potion ids: [17534, 17533]`. 17533 is "Perm. Illusion Pig" [WH spell=17533]. Use **`[17534, 4042]`** (Major, Superior). 4042 has 303 casts, currently dropped.
10. **Missing ID:** `Restore Mana ids: [17531, 17530]`. Add **11903** (Greater Mana Potion, 523 casts) if any mana potion counts. Keep 2023 / 438 out (low-level).
11. **Missing ID:** `Frost Protection ids: [17544]`. Add 7239 (lesser potion, 21). `Shadow Protection ids: [17548]`: add 7242 (lesser, 19); correctly excludes the priest buff 10958 / 27683. `Fire Protection ids: [17543]`: 29432 (3) is likely the Frozen Rune [INF]; optional.
12. **Ambiguous name:** `"Speed"` without IDs also matches **14530** (+40% for 10 s, not Swiftness Potion; 21 casts). Restrict to **`ids: [2379]`**.
13. **Dead name:** `"Ez-Thro Dynamite II"` never matches. The item's spell is "Ez-Thro Dynamite" (23000), which the existing `"Ez-Thro Dynamite"` entry already catches, together with 4 casts of the old 8331. Remove "II", or split by ID if wanted.
14. **Dead name:** `"Purification"`. 0 casts in 146 nights; the use-spell name is unverified. Harmless.
15. **Missing common potions:**
    - `"Great Rage"` (6613, Great Rage Potion, **881 casts**) and `"Rage"` (6612, Rage Potion, 205). Label them, and restrict `"Rage"` to id 6612.
    - `"Rejuvenation Potion"` (22729, Major Rejuvenation, 10).
    - `"Noggenfogger Elixir"` (16589, 1083; utility, optional).
    - `"Greater Healthstone"` (23475 / 5723 / 23474, ~40).
    - Optionally `"Whipper Root Tuber"` (15700, 288) and `"Night Dragon's Breath"` (15701, 236): emergency heal / mana items. Also `"Powerful Anti-Venom"` (60).
16. **Missing explosives:** `"Solid Dynamite"` (12419, 61) and `"Mithril Frag Bomb"` (12421, 17). Optional: `"Dark Iron Bomb"`, `"Goblin Mortar"`. Arcanite Dragonling and Goblin Rocket Helmet never appear; skip them.
17. **Living Action / Free Action / Invulnerability / Mighty Rage / Restore Energy / Restoration / Greater Stoneshield / Demonic Rune / Dark Rune / Major Healthstone:** names correct as configured [LOG].
18. **Utility list note:** "Hand of Protection" (10278, 835 casts) *is* the name WCL uses for Blessing of Protection in Era. "Blessing of Protection" never appears; it is harmless to keep.
