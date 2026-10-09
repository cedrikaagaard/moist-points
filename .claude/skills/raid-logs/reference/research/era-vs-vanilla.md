# Classic Era (1.15.x, EU-Firemaw) vs original vanilla 1.12: what changes how you read raid logs

Researched 2026-10-09. Confidence: **high** means an official or primary source, or verified in Moist's own WCL event data. **medium** means a reputable wiki or guide, or an inference from spell data. **low** means forum or community claims, or unclear.
"Own data" means the WCL API events that Moist already downloaded (`/Users/cedrik/moist/data/events/2026-10-07/PakzFdNJKXbD3p4V/page-*.json.gz`, plus a scan of all local nights). It is first-hand evidence for how WCL serves Era logs.

---

## 1. World buffs in Era today

### Death rule (the key point)
- **Every world buff below is removed on death in Era. None survives death.** The Chronoboon wiki states the design rule: world buffs are "meant to disappear upon dying". [https://warcraft.wiki.gg/wiki/Chronoboon_Displacer] (medium-high)
- Supporting spell data: Wowhead Classic shows a **"Persists through death"** flag when a spell has it, for example Flask of the Titans 17626. [https://www.wowhead.com/classic/spell=17626] None of these world buff spells carry that flag: Rallying Cry 22888, Spirit of Zandalar 24425, Warchief's Blessing 16609, Songflower 15366, Fengus 22817, Slip'kik 22820, Sayge's Dark Fortune of Damage 23768. (medium: this is inferred from absent flags, but it agrees with the wiki and with guides.)
- **Spirit of Zandalar** is the historical exception. In original vanilla it persisted through death until **patch 1.11.0**: "No longer persists through death". Era is built on 1.12, so **SoZ does NOT survive death in Era**. [https://warcraft.wiki.gg/wiki/Spirit_of_Zandalar] (high). Warcraft Tavern says "until 1.11" and its warlock guide says "until 1.10 at least", so the sources disagree on the exact patch but agree that it no longer applies. [https://www.warcrafttavern.com/wow-classic/guides/world-buffs/], [https://warcrafttavern.com/wow-classic/guides/pve-warlock-world-buffs]
- No source I found says Rallying Cry survives death. **The claim "Rallying Cry / SoZ survive death" is false for Era.** If a player has the buff after dying, they got it again (rebuff, Chronoboon release, or a new turn-in).
- Era does **not** purge world buffs when you enter a raid or start an encounter. That purge happened only in BC Classic, and Season of Mastery disabled world buffs in raids. Blizzard (Pazorax, quoted in the 2021 thread) said Classic Era would keep world buffs. [https://eu.forums.blizzard.com/en/wow/t/265981/1], [https://warcraft.wiki.gg/wiki/World_buff] (high)
- Buff timers only count down while you are logged in. Logging out to "save" buffs was common, and that is why the Chronoboon exists ("to curb players logging out for days to keep buffs"). [https://warcraft.wiki.gg/wiki/World_buff] (medium)

### Per-buff table (Era values)
| Buff (spell id) | Effect | Duration | How obtained | Source / conf. |
|---|---|---|---|---|
| Rallying Cry of the Dragonslayer (22888) | +10% spell crit, +5% melee/ranged crit, +140 AP | 2 h | Head of Onyxia or Head of Nefarian turned in at Stormwind or Orgrimmar. Buffs everyone in that city. | wowhead classic spell 22888; [https://warcraft.wiki.gg/wiki/Rallying_Cry_of_the_Dragonslayer] high |
| Spirit of Zandalar (24425) | +15% all stats, +10% run speed | 2 h | Heart of Hakkar (ZG) turned in to Molthor on Yojamba Isle. Buffs everyone on the isle **and in Booty Bay**, both factions. | [https://warcraft.wiki.gg/wiki/Spirit_of_Zandalar] high |
| Warchief's Blessing (16609), Horde | +300 HP, +15% melee attack speed, +10 mp5 | 1 h | Head of Rend turned in to Thrall ("For The Horde!"). Buffs Orgrimmar (and Crossroads per WT). | wowhead 16609; [https://warcraft.wiki.gg/wiki/Warchief%27s_Blessing] high |
| **Might of Stormwind**, Alliance (Era since 1.15.3, July 2024) | Alliance version of Warchief's Blessing. Cannot be active together with WCB. | (same as WCB, assumed 1 h) | Quest "End of the Dark Horde" in Stormwind | [https://devtrackers.gg/warcraft/p/61c81e32-wow-classic-era-and-hardcore-patch-notes-version-1-15-3] high. Duration is medium. |
| Songflower Serenade (15366) | +5% crit (melee/ranged/spell), +15 all stats | 1 h | Cleanse a Corrupted Songflower in Felwood (Cenarion Plant Salve), then loot it. A cleansed flower is lootable once per ~25 min. | wowhead 15366; [https://warcraft.wiki.gg/wiki/Songflower_Serenade]; timer per [https://www.warcrafttavern.com/wow-classic/guides/world-buffs/] high/medium |
| Fengus' Ferocity (22817) | +200 AP | 2 h | DM North tribute run: kill only King Gordok, then talk to Fengus | wowhead 22817 high |
| Mol'dar's Moxie (22818) | +15% stamina | 2 h | DM tribute (Guard Mol'dar) | [https://warcraft.wiki.gg/wiki/Mol%27dar%27s_Moxie] high |
| Slip'kik's Savvy (22820) | +3% spell crit | 2 h | DM tribute (Guard Slip'kik) | wowhead 22820 high |
| Sayge's Dark Fortune (8 kinds; Damage = 23768) | One of: +10% damage, +10% Agi/Int/Spi/Sta/Str, +10% armor, or +25 all resistances | 2 h | Talk to Sayge at the Darkmoon Faire. A new fortune is available only after the current one expires and ≥2 h have passed (WT says a 4 h login cooldown, so sources disagree). | [https://www.wowhead.com/classic/guide/classic-world-buff-consumables]; [https://warcraft.wiki.gg/wiki/Darkmoon_Faire_(Classic)] high (effects/duration), medium (cooldown) |
| Boon of Blackfathom, Spark of Inspiration, Fervor of the Temple Explorer | **Season of Discovery only. Not in Era.** Era has the old Blessing of Blackfathom, a low-level buff that does not matter for raids. | – | – | [https://warcraft.wiki.gg/wiki/World_buff] high |
| Traces of Silithyst | +5% damage, 30 min | 30 min | Silithus PvP turn-in. **Not storable in Chronoboon.** | [https://www.warcrafttavern.com/wow-classic/guides/world-buffs/] medium |
| Lordaeron's Blessing | +5% max HP, Plaguelands, Scholo, Strat and **Naxxramas** only | 30 min | Northpass Tower shrine, EPL | same, medium |

- Since 1.15.3, enemy players **cannot dispel** Songflower or the DM Tribute buffs. [devtrackers 1.15.3 link above] (high)
- Spirit of Zanza (24382; +50 Sta/Spi, 2 h) is a ZG consumable, **not** a world buff. Its Wowhead page has no persists-through-death flag, and the Chronoboon cannot store it. Flasks **do** persist through death (wowhead 17626 flag). (medium/high)

## 2. Chronoboon Displacer

- **Is it in Era?** Yes. It was added to Classic (now Era) realms in **patch 1.13.7 (April 2021)**. Get it from Chromie in Andorhal, Western Plaguelands, after her quests ("A Matter of Time", "Counting Out Time"). It also exists in Hardcore and SoD (SoD has its own variant), but **not** in Season of Mastery. [https://us.forums.blizzard.com/en/wow/t/942908/1], [https://warcraft.wiki.gg/wiki/Chronoboon_Displacer] (high)
- **Price:** an early-2025 hotfix set the Era version to 1 g and made the SoD variant stop working on non-SoD realms. [https://x.com/wowclassicdevs/status/1880430669941338522] (high). The wiki notes a 2026-01-14 hotfix that restored 1 g and a stack size of 10 after an accidental revert to 10 g and 5. [wiki] (medium; a forum report of the revert conflicts, [https://us.forums.blizzard.com/en/wow/t/2227555])
- **What it stores** (Era): Rallying Cry, Warchief's Blessing, Fengus/Mol'dar/Slip'kik, Songflower, **all** Sayge's Dark Fortunes (fixed by a hotfix on 2021-04-22), and Spirit of Zandalar. Might of Stormwind is probably stored as WCB's twin, but I did not confirm it. [wiki] (high; MoS low)
- **What it does NOT store:** crafted consumables, player-cast buffs, Blasted Lands consumables, **Zanza potions**, **Traces of Silithyst**, and world *event* buffs. [wiki] (high)
- **Mechanics:** using a Chronoboon removes all active world buffs and stores them, with their **remaining duration**, in a **Supercharged Chronoboon Displacer**. Using the Supercharged item puts them back with that same remaining time. While a set is stored, you **cannot receive any world buff you have saved**; the 1.13.7 notes say you cannot receive *additional* world buffs at all until you restore them. You get a tracking buff that lists what is stored. The Supercharged item is **Unique**, so a player can hold only **one** stored set. Plain Chronoboons are not unique and can be stacked. [1.13.7 notes; wowhead PTR news https://classic.wowhead.com/news/321646; wiki] (high)
- **Cooldown:** releasing starts a **1-hour cooldown** in Era/Classic (5 min in SoD). Blizzard's stated goal was to stop players toggling buffs on for bosses only. [https://eu.forums.blizzard.com/en/wow/t/265981/1], [wiki] (high)
- **Death:** stored buffs are not lost on death because they are not on the character. Buffs that are *active* are lost on death as usual. The wiki notes the Chronoboon "shouldn't work as a backup buff set". [wiki] (high)
- **How long can a set be stored?** The sources give no expiry, and stored durations are frozen. (medium)
- **How raids "rebuff" after a wipe in Era:**
  1. **Turn-ins while raiders are in the city.** Raiders leave or hearth to Orgrimmar/Stormwind (Rend, Ony or Nef head), Booty Bay/Yojamba (Heart of Hakkar), or the DMF. Someone turns in a held head or heart, then raiders are summoned back. A turn-in buffs everyone present, so this can rebuff the whole raid. (medium: standard practice, inferred from buff mechanics)
  2. **Chronoboon.** A player who stored a set *before* the raid (and has not used it) can release it after dying or after a wipe. A player with no stored set cannot get buffs back this way. With the 1 h cooldown and the one-set limit, it is at most one restore per player in practice. (high on mechanics, medium on practice)
  3. Songflower and DM tribute need travel and time, so they are rare mid-raid.
  - **Log signature:** an `applybuff` for 22888/24425/16609 etc. after a death or wipe, often on many players at nearly the same timestamp (turn-in) or on scattered players (Chronoboon release). Combatantinfo auras at the next pull show who has them.

## 3. Other Era vs 1.12 differences that matter for raids

- **Reference data:** Classic was built from the **1.12.0** reference client. Items use their final 1.12 versions no matter the content phase (there are some loot-table exceptions, such as relics). [https://www.wowhead.com/classic-ptr/news/dev-watercooler-wow-classic-will-start-on-patch-1-12-drums-of-war-284983], [https://www.warcrafttavern.com/community/wow-classic-general/frequently-asked-questions/] (high for "1.12 basis", medium for itemization)
- **Raid tuning:** I found **no Blizzard retuning of MC/BWL/AQ/Naxx/ZG/Ony for Era**. Bosses use 1.12 data, and Blizzard checked that 1.12 damage numbers matched. Era raids feel easier than in 2005-06 because of player knowledge, full world buffs, consumables and gear, not because of tuning. [https://massivelyop.com/?p=226357] (medium; I could not find a single blue post on boss tuning)
- **Debuff limit:** 1.12 raised it from 8 to **16** (patch 1.7.0). It became 40 in 2.0.1 and was removed in 3.0.2. [https://warcraft.wiki.gg/wiki/Debuff] (high). **Era still has the 16-debuff cap** (and the 32-buff cap). It was removed only on **Hardcore** (1.14.4, Aug 2023) [https://www.bluetracker.gg/wow/topic/us-en/1656146-wow-classic-era-version-1144-patch-notes/] and on **Anniversary** realms (1.15.5, Nov 2024) [https://eu.forums.blizzard.com/en/wow/t/549817/1]. Players were still asking for an Era removal in 2025 [https://us.forums.blizzard.com/en/wow/t/2050921]. (medium-high: I found no source saying Era removed it, and there was no blue reply)
- **Spell batching:** vanilla and Classic 1.13.x used a **400 ms** batch window. **1.13.7 (April 2021) cut it to ~10 ms** on Classic (now Era) realms. [https://mein-mmo.de/en/wow-classic-ends-the-the-heal-was-actually-done-joke,641282], [https://massivelyop.com/?p=319302] (high). Simultaneous-event quirks from 2019 logs, such as heals landing "after" death or batched resists, are much rarer now.
- **World buff death rule:** see section 1. SoZ lost its persist-through-death in 1.11, and that 1.11 version is the one in Era.
- **Loot:** Classic added a 2-hour loot trading window for raid members, which did not exist in 2005. (medium, from general knowledge; not sourced here)
- **Darkmoon Faire (Era):** it alternates monthly between **Mulgore** and **Elwynn Forest**. Original schedule: the caravan arrives on the Sunday before the first Monday, the Faire is open Monday through the following week. The Zockify EU calendar shows Era/Anniversary DMF opening **Mon 5 Oct 2026, Mulgore** and **Mon 9 Nov 2026, Elwynn**. [https://warcraft.wiki.gg/wiki/Darkmoon_Faire_(Classic)], [https://www.zockify.com/classic/calendar/] (medium)
- **Lockouts (EU Era):** Zockify states that Era, Hardcore and Anniversary share one schedule. [https://www.zockify.com/classic/calendar/] (medium-high)
  - Weekly raids (MC, BWL, AQ40, Naxx): reset **Wednesday** at the EU daily reset, **04:00 UTC** (06:00 Berlin in summer time). NA resets Tuesday.
  - **Onyxia: every 5 days. ZG and AQ20: every 3 days.** These follow fixed server-time cycles (the system from 1.9), not "5 days after you saved". Recent EU dates: Ony resets Sun 4 Oct, Fri 9 Oct, Wed 14 Oct, Mon 19 Oct 2026. ZG/AQ20 resets Sat 3 Oct, Tue 6, Fri 9, Mon 12, Thu 15 Oct 2026.
  - ZG Edge of Madness boss rotates every 2 weeks: Hazza'rah 6–19 Oct 2026, Renataki 20 Oct–2 Nov, Wushoolay 3–16 Nov, Gri'lek 17–30 Nov.
  - Consequence: two ZG or Ony logs in the same calendar week can be **different lockouts**, and an MC log on a Tuesday and one on a Wednesday are different weeks.

## 4. Combat log / Warcraft Logs specifics for Era

Most of this was verified directly in Moist's API events (2026-10-07 Naxx night and all local nights). (high)
- **Player HP is a percentage.** On player units, `hitPoints`/`maxHitPoints` come as **0–100 / 100**. **NPC HP is absolute** (for example 56461/56592). Do not compare player HP numbers to damage numbers.
- **No current mana anywhere.** `classResources: []` on every event. `attackPower`, `spellPower` and `armor` are 0, and `mapID` is 0. `resourcechange` events carry `maxResourceAmount` (max mana) and the gain, but not the current pool. The project memory also records that the raw Era client writes powerType −1. You **cannot** say "X went OOM" from Era logs. At most you can infer it from mana-potion or rune use and from casting stopping.
- `x/y/facing` positions **are** present.
- **combatantinfo** (one per player per pull):
  - `specID: 0`.
  - `talents` is just **3 entries = points per tree**, for example `[35, 11, 5]`. There are no individual talents, so spec must be inferred from the tree split.
  - Crit and haste fields are 0. Primary stats and armor are present. Gear includes item ids and enchants.
  - `auras` lists the buffs active at pull, including world buffs and consumables. This is the best way to check who had Rallying Cry, SoZ and so on **for each pull**.
- **Feign Death:** WCL emits a normal `death` event with **`feign: true`** (2,171 of 94,099 local death events). Exclude these from death counts. Hunters (and NPCs that feign) look "dead" otherwise.
- `death` events have `killerID` and `killingAbilityGameID` most of the time, but not always: 79,617 of 94,099 had them.
- Advanced Combat Logging must be on for the unit-info block. The generic 1.13 log-format notes say AP and SP "seem off for classic". [https://github.com/magey/classic-warrior/wiki/Combat-log-format] (medium)
- Era logs live on **vanilla.warcraftlogs.com** (expansion "vanilla" in combatantinfo). WCL's interrupt table also counts CC and stuns, and dodged hits have amount 0. These come from project memory and match the data. (high)

---

## Things an analyst could easily get wrong

1. **"Rallying Cry / Spirit of Zandalar survive death."** False in Era. All world buffs drop on death. SoZ's persist-through-death ended in 1.11. If a player who died still has world buffs at a later pull, it means a **rebuff** (turn-in in a city, or Chronoboon release), not persistence.
2. **"They used a Chronoboon to rebuff everyone."** Each player can hold only one stored set, it has a 1 h cooldown on release, and it only returns buffs that player stored earlier. A raid-wide simultaneous `applybuff` points to a **head/heart turn-in**. Scattered single re-applies point to Chronoboon releases.
3. **Assuming world buffs are purged on raid entry or at encounter start.** That was BC Classic and SoM. Era has no purge.
4. **Mana/OOM claims.** Era logs from the WCL API contain no current mana. Never state mana levels.
5. **Treating player hitPoints as absolute HP.** For players it is a percent. For NPCs it is absolute.
6. **Counting Feign Death as a death** (`feign: true`), or treating WCL "interrupts" as kicks (they include CC and stuns).
7. **Spec from talents.** WCL only gives the point split per tree (specID 0). Do not name individual talents.
8. **Debuff cap.** Era still has 16 debuff slots. "Why wasn't X debuff up?" can be the cap pushing it off (warlock DoTs, low-priority debuffs), not a mistake. Do not apply Anniversary or Hardcore rules (no cap) to Era.
9. **Lockout weeks.** EU weekly reset is Wednesday, not Tuesday. Ony runs on a 5-day cycle and ZG/AQ20 on 3-day cycles, so "same week" logic does not apply to them.
10. **Might of Stormwind exists in Era** (since July 2024). Alliance raiders can have a WCB-equivalent. Do not call it a SoD-only buff. Boon of Blackfathom, Spark of Inspiration and Fervor **are** SoD-only.
11. **Spell batching.** Era uses ~10 ms batching, not 400 ms, so vanilla-era explanations based on batching (heal landed after death, double-ability timing) mostly do not apply.
12. **Zanza / Traces of Silithyst / flasks are not world buffs.** The Chronoboon cannot store them. Flasks persist through death. Do not mix them up with world buffs in "lost on death" statements.
13. **DMF buff availability.** It is only obtainable during the Faire week, and the location alternates Mulgore/Elwynn. Sayge's buffs can be Chronobooned, so a DMF buff outside Faire week is plausible.
