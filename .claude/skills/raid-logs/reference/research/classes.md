# Classic Era classes for raid-log analysis (Alliance, 1.15.x client, 1.12 rules)

Researched 2026-10-09. Every fact carries a source tag and a confidence (H = high, M = medium, L = low).

## 0. The most important finding: Warcraft Logs renames reused spell IDs

WCL does not show the Classic in-game name for every spell. For spell IDs that later expansions reused, WCL shows the later name. I checked this by pulling every ability name from the guild's own stored WCL data (`data/wcl/reports/*.json.gz` masterData, 2,395 spell IDs; `data/wcl/fights/*.json.gz` cast tables) and comparing each ID with the Classic name from Wowhead's Classic tooltip API (`nether.wowhead.com/classic/tooltip/spell/<id>`). 152 IDs differ. The ones that matter for raid analysis:

| Spell ID | Classic in-game name | Name WCL shows | Casts in guild data | Why it matters |
|---|---|---|---|---|
| 71 | Defensive Stance | **Vanguard** | 1,805 | tank detection |
| 12328 | Death Wish | **Sweeping Strikes** | 2,568 | Fury cooldown shows under the wrong name |
| 12292 | Sweeping Strikes | **Bloodbath** | 7 | |
| 14751 | Inner Focus | **Chakra** | 965 | |
| 20271 / 23590 | Judgement (cast) | **Judgment** (US spelling) | 530 | debuff names keep "Judgement of ..." |
| 475 | Remove Lesser Curse (mage) | **Remove Curse** | 475 casts in this sample; 9,570 by mages in all fight tables | dispel attribution |
| 2782 | Remove Curse (druid) | **Remove Corruption** | 336 / 6,572 | dispel attribution |
| 528 | Cure Disease (priest) | **Dispel Magic** | 11 / 69 | collides with real Dispel Magic (988, which WCL also calls "Dispel Magic") |
| 527 | Dispel Magic rank 1 (priest) | **Purify** | 6 / 11 | collides with the paladin's Purify (1152) |
| 2060 | Greater Heal rank 1 | **Heal** | 434 | harmless for healer detection |
| 10278, 5599 (1022 not seen) | Blessing of Protection | **Hand of Protection** | 452 | "Blessing of Protection" never appears in the guild's logs |
| 1038 | Blessing of Salvation | **Hand of Salvation** | 59 | Greater Blessing of Salvation (25895) keeps its name |
| 20925 | Holy Shield (rank 1) | **Sacred Shield** | 13 (63 for one prot paladin) | rank 3 (20928) shows correctly as "Holy Shield" |
| 9908 | Swipe (bear) | **Swipe (Bear)** | 78 | breaks the `TANK_SPELLS` "Swipe" match |
| 16979 | Feral Charge | **Wild Charge** | 81 | |
| 17057 | Furor (rage on shifting) | **Bear Form** | – | |
| 22959 | Fire Vulnerability (Improved Scorch debuff) | **Critical Mass** | aura | |
| 17800 / 17799 | Shadow Vulnerability (Improved Shadow Bolt debuff) | **Shadow and Flame** / **Shadow Mastery** | aura | |
| 15258 | Shadow Vulnerability (the Shadow Weaving debuff) | **Shadow Weaving** | aura | the in-game debuff has the same name as the Improved Shadow Bolt one |
| 17941 | Shadow Trance (Nightfall talent proc) | **Agony** | aura | |
| 980 / 603 | Curse of Agony r1 / Curse of Doom | **Agony** / **Doom** | | |
| 11958 | Ice Block | **Cold Snap** | 99 | |
| 12472 | Cold Snap | **Icy Veins** | 29 | |
| 27683 | Prayer of Shadow Protection | **Shadow Protection** | 131 | same name as the potion buff (17548) |
| 21562 | Prayer of Fortitude r1 | **Power Word: Fortitude** | | |
| 21183 | Judgement of the Crusader (low rank) | **Heart of the Crusader** | | 20303 (high rank) shows correctly |
| 20424 | Seal of Command | **Seals of Command** | 66 | |
| 20165 | Seal of Light | **Seal of Insight** | 4 | |
| 10326 | Turn Undead | **Turn Evil** | 76 | |
| 2812 | Holy Wrath r1 | **Denounce** | | |
| 13809 | Frost Trap | **Ice Trap** | 155 | |
| 14268 | Wing Clip | **Alliance Flag** | 334 | |
| 19451, 23128, 23342, 26051, 28371… | Frenzy (boss enrage that Tranquilizing Shot removes) | **Enrage** | | `NOT_DISPELS` already filters both |
| 20050 | Vengeance (paladin talent) | **Conviction** | | |
| 16491 | Blood Craze | **Second Wind** | | |
| 18469 / 18425 | Counterspell - Silenced / Kick - Silenced | **Silenced - Improved Counterspell** / **Silenced - Improved Kick** | | |
| 26677 | Cure Poison (the effect of the Elixir of Poison Resistance item) | **Cure Poison** | ~1,550, cast by every class | not the druid spell (8946); don't credit it to druids |

Sources: [LOG] the guild's WCL data; [WH-tt] Wowhead Classic tooltips for IDs 71, 12328, 12292, 14751, 475, 2782, 22959, 17800, 15258, 17941, 12472, 20925, 26677 (also fetched as wowhead.com/classic/spell=… pages). Item 3386 (Elixir of Poison Resistance) uses spell 26677 [WH-tt]. Confidence H for every row that lists casts or an aura seen in [LOG]. For IDs the guild has never logged, I can't predict WCL's name (Wowhead retail returns nothing for most of them), so **match on spell ID wherever possible and treat names as display labels.**

Names that WCL shows correctly (checked against [LOG] and [WH-tt]) include: Sunder Armor, Expose Armor, Faerie Fire, Faerie Fire (Feral), Curse of Recklessness/the Elements/Shadow/Tongues/Weakness, Winter's Chill, Judgement of Wisdom/Light/the Crusader (20303), Demoralizing Shout/Roar, Thunder Clap, Hunter's Mark, Spell Vulnerability, Ignite, Deep Wounds, all Blessings except Protection and Salvation, all Greater Blessings, Power Word: Fortitude, Prayer of Fortitude (21564), Mark/Gift of the Wild, Thorns, Arcane Intellect/Brilliance, Divine Spirit, Prayer of Spirit, Trueshot Aura, Battle Shout, Blood Pact, Leader of the Pack, Moonkin Aura, Moonkin Form, Power Infusion, Innervate, Rebirth, Soulstone Resurrection, Fear Ward, Blessing of Sacrifice, Blessing of Freedom, Divine Intervention, Tranquilizing Shot, Shackle Undead, Mind Control, Kick, Pummel, Shield Bash, Counterspell, Fade, Feint, Vanish, Taunt, Shield Block, Revenge, Shield Slam, Growl, Maul, Righteous Fury, Mocking Blow, Challenging Shout/Roar, Holy Shield (20928), Consecration, Dire Bear Form, Shield Wall, Last Stand, Frenzied Regeneration, Bloodrage, Berserker Rage, Cleanse, Purify (1152), Abolish Disease, Abolish Poison, Cure Poison (8946), Stoneform, all main heals. Feign Death (5384) has the same name in Classic and retail [WH-tt], but it never appeared in the guild's cast tables.

## 1. Raid roles and specs (Classic Era, Alliance)

The guild's own role split is computed from casts across 206 nights (`src/raids/data/nights/*.json`, `raiders[].role`): Warrior 1,882 dps / 717 tank; Rogue 854; Priest 878 healer / 64 dps; Paladin 717 healer / 73 dps; Mage 649; Hunter 502; Warlock 338; Druid 299 healer / 73 dps / 46 tank. Per 40-man night that is roughly 9 DPS warriors, 3–4 warrior tanks, 4 rogues, 3 mages, 2–3 hunters, 1–2 warlocks, 4–5 priests, 3–4 paladins and 2 druids. [LOG], H for this guild.

Community composition templates (M): one warrior main tank plus warrior or druid off-tanks; 4+ paladins for Greater Blessings; about 10 healers in total, most of them priests; at least one druid for its buffs; DPS mostly Fury warriors, rogues and mages; at least one hunter with Tranquilizing Shot. [WT-comp], [Guildorder].

| Class | Specs seen in Era raids | Notes |
|---|---|---|
| Warrior | Prot or "Fury/Prot" tanks; Fury DPS (most of them); Arms rare | Fury/Prot tanks dual-wield and use no Shield Block or Shield Slam, so their tells are Taunt, Revenge (it procs on dodge/parry too), Sunder Armor and Defensive Stance (logged as "Vanguard"). (M, general knowledge, consistent with [LOG]) |
| Paladin | Holy (most); Ret (Sanctity Aura, Judgement of the Crusader/Wisdom); Prot (rare; AoE trash tank) | Prot tells: Holy Shield (logged as "Holy Shield" or "Sacred Shield"), Consecration, Righteous Fury (one cast per 30 min). Two prot paladins in [LOG] cast Holy Shield 30–74 times per report. (H) |
| Priest | Holy or Discipline/Holy (Power Infusion); one Shadow for Shadow Weaving | Holy Nova is a Holy talent and a frequent heal in [LOG] (489+ casts). (H) |
| Druid | Resto (most); Feral bear off-tank or cat DPS (Leader of the Pack); Balance/Moonkin rare (Moonkin Form cast 7 times in [LOG]) | Resto druids are often assigned Faerie Fire: up to 354 casts in one report. (H, [LOG]) |
| Mage | Frost in MC/Naxx (fire-immune bosses); Fire from BWL on, with Scorch stacks; Arcane hybrids rare | (M) |
| Warlock | Destruction (SM/Ruin), Demonic Sacrifice variants ("Demonic Sacrifice" cast 128 times in [LOG]) | Curses are assigned per warlock. (H) |
| Hunter | Marksmanship (Trueshot Aura), Survival hybrids | Tranquilizing Shot comes from a book that drops in MC. (H, [WW-Tranq]) |
| Rogue | Combat swords/daggers; some Seal Fate daggers | Expose Armor only when assigned. (M) |

## 2. Spells that identify a role

### Healing casts (all names checked in [LOG])
- Priest: Flash Heal, Heal (includes Greater Heal rank 1, ID 2060), Greater Heal, Lesser Heal, Renew, Prayer of Healing, Holy Nova (talent), Power Word: Shield, Desperate Prayer (dwarf/human self-heal), Lightwell (the "Lightwell Renew" buff was not seen).
- Paladin: Holy Light, Flash of Light, Holy Shock (talent), Lay on Hands.
- Druid: Healing Touch, Regrowth, Rejuvenation, Swiftmend (talent), Tranquility, Nature's Swiftness (the instant-cast enabler; not a heal itself).

Pitfalls, from [LOG], H:
- **Wand "Shoot" inflates a healer's total casts.** Several holy priests had 40–60% of their casts as Shoot (for example 102 Shoot against 108 heals), which puts them under the 50% healer threshold.
- **Resto druids on Faerie Fire duty** had 193–354 Faerie Fire casts, which drops their heal share to about 0.37–0.48.
- **Holy paladins on dispel duty** cast many Cleanse; one was at 0.49.
- Shadow priests may cast Power Word: Shield or Renew on themselves. Ret paladins occasionally cast Flash of Light. Desperate Prayer is a self-heal any dwarf or human priest can use.
- Better rule: drop non-throughput casts from the denominator (Shoot, Faerie Fire, dispels, buffs), or compare healing done with damage done.

### Tank casts
- Warrior: Taunt, Mocking Blow, Challenging Shout, Shield Block, Shield Slam, Revenge, Shield Wall, Last Stand, Defensive Stance ("Vanguard"). DPS warriors do cast Taunt, Revenge and Vanguard a few times per night: in [LOG], 251 warrior report-rows fall in the 5–14 band, so a threshold like ≥15 is reasonable. Sunder Armor is not a tank tell, because DPS warriors sunder too.
- Druid: Growl, Maul, "Swipe (Bear)", Demoralizing Roar, Challenging Roar, Frenzied Regeneration, Dire Bear Form. **"Swipe" never matches in WCL.** Bears in [LOG] still get classified through Maul and Growl.
- Paladin: Holy Shield / "Sacred Shield", Consecration, Righteous Fury. Righteous Fury lasts 30 min [WH-tt 25780], so a prot paladin casts it about once per night and never reaches 15 casts. The prot paladins in [LOG] (Kennor: 65 and 74 tank-like casts; Alea: 30) are classified as DPS today.
- The strongest signal is boss melee taken (damage-taken by "Melee" from the boss). Recommended over casts alone. (M)

## 3. Dispel matrix (Alliance)

| Type | Class (Classic spell → **WCL name**) | Spell ID | Conf. |
|---|---|---|---|
| Magic | Priest Dispel Magic → "Dispel Magic" (r2), "Purify" (r1) | 988 / 527 | H [WH-tt][LOG] |
| Magic | Paladin Cleanse → "Cleanse" (1 poison + 1 disease + 1 magic) | 4987 | H |
| Magic | Warlock Felhunter Devour Magic (pet; WCL credits the owner) | 19505, 19731, 19734, 19736 | M (not seen in [LOG]) |
| Curse | Mage Remove Lesser Curse → "**Remove Curse**" | 475 | H |
| Curse | Druid Remove Curse → "**Remove Corruption**" | 2782 | H |
| Poison | Druid Cure Poison → "Cure Poison"; Abolish Poison → "Abolish Poison" (1 poison every 2 s for 8 s) | 8946 / 2893 | H |
| Poison | Paladin Purify (poison + disease), Cleanse | 1152 / 4987 | H |
| Poison (items) | Elixir of Poison Resistance → "Cure Poison" (any class); Powerful Anti-Venom (23786); "Dispel Poison" 21954 and "Cure Ailments" 3592 are other item uses | 26677 … | H for 26677, L for the others |
| Disease | Priest Cure Disease → "**Dispel Magic**"; Abolish Disease → "Abolish Disease" (1 disease every 5 s for 20 s) | 528 / 552 | H |
| Disease | Paladin Purify, Cleanse | | H |
| Any (self) | Restorative Potion → "Restoration" (1 effect every 5 s for 30 s) | 11359 | H |
| Poison/Disease/Bleed (self, dwarf) | Stoneform: 8 s immunity to bleed, poison and disease, +10% armor, 3 min cooldown | 20594 | H [WW-Stoneform] |
| Root/snare (self, gnome) | Escape Artist | 20589 | H |
| Fear prevention | Fear Ward (priest; dwarf-only in 1.12): 10 min, 30 s cooldown, absorbs the next Fear | 6346 | H for the numbers [WH-tt]; M that it is still dwarf-only in Era [WW-FearWard] |
| Fear (self) | Berserker Rage (warrior); Death Wish also grants fear immunity | 18499 / 12328 | H [WH-tt] |
| Frenzy (enemy) | Tranquilizing Shot: removes 1 Frenzy, 20 s cooldown. WCL logs the removed buff as "Enrage" | 19801 | H |

Paladins and priests cannot remove curses. Druids and mages cannot remove magic. Mages cannot remove poison or disease. (H)

## 4. Raid debuffs and buffs

**Debuff cap: 16 debuff slots per target in Classic Era.** Blizzard restored the 1.12 value at launch, and I found nothing saying it has been raised in Era since. When a 17th debuff lands, a lower-priority debuff is pushed off. Raids restrict DoTs (Corruption, Rupture, Serpent Sting) to protect the slots. Sources: [BlizzForum-debuff], [WW-Debuff], [Engadget-2006]. Confidence: H for 16, L for the exact priority rules.

Typical priority on a boss, from guild practice and community lore (M): Sunder Armor, Faerie Fire, Curse of Recklessness, Curse of the Elements, Curse of Shadow, Fire Vulnerability ("Critical Mass"), Winter's Chill, Shadow Weaving, Improved Shadow Bolt ("Shadow and Flame"), Judgement of Wisdom / of the Crusader / of Light, Demoralizing Shout, Thunder Clap, Hunter's Mark, plus automatic ones (Ignite, Deep Wounds, Spell Vulnerability, Armor Shatter from Annihilator, Holy Strength procs are buffs). Expose Armor replaces Sunder Armor (they don't stack). Demoralizing Shout and Demoralizing Roar don't stack.

| Debuff | Effect (top rank) | Source | Conf. |
|---|---|---|---|
| Sunder Armor | −450 armor per stack, 5 stacks, 30 s | WH-tt 11597 | H |
| Expose Armor | −340 armor per combo point (1,700 at 5 CP; +50% with Improved Expose Armor), 30 s | WH-tt 11198 | H / M for the talent |
| Faerie Fire / Faerie Fire (Feral) | −505 armor, 40 s | WH-tt 9907 / 17392 | H |
| Curse of Recklessness | −640 armor, +90 melee AP; target won't flee and ignores Fear/Horror | WH-tt 11717 | H |
| Curse of the Elements | −75 fire/frost resistance, +10% fire/frost damage taken, 5 min | WH-tt 11722 | H |
| Curse of Shadow | −75 shadow/arcane resistance, +10% shadow/arcane damage taken | WH-tt 17937 | H |
| Shadow Weaving (in game "Shadow Vulnerability", 15258) | +3% shadow damage taken per stack, 5 stacks, 15 s | WH-tt 15258 | H |
| Improved Shadow Bolt (in game "Shadow Vulnerability"; WCL "Shadow and Flame") | +20% shadow damage taken, 12 s (charge-based) | WH-tt 17800 | H |
| Improved Scorch (in game "Fire Vulnerability"; WCL "Critical Mass") | +3% fire damage taken per stack, 5 stacks, 30 s | WH-tt 22959 | H |
| Winter's Chill | +2% frost crit per stack, 5 stacks, 15 s | WH-tt 12579 | H |
| Spell Vulnerability (Nightfall axe proc, **not** the warlock talent) | +15% spell damage taken, 5 s | WH-tt 23605, WW-Nightfall | H |
| Judgement of Wisdom / Light / the Crusader | mana return / health return / +140 holy damage taken, 10 s | WH-tt 20355, 20343, 20303 | H |
| Demoralizing Shout / Demoralizing Roar | −146 / −138 melee AP, 30 s | WH-tt 11556 / 9898 | H |
| Thunder Clap | +10% time between attacks, 30 s (Battle Stance) | WH-tt 11581 | H |
| Hunter's Mark | +110 ranged AP for all attackers | WH-tt 14325 | H |
| Shadow Trance (warlock Nightfall talent; WCL "Agony") | self buff, instant Shadow Bolt; not a raid debuff | WH-tt 17941 | H |

Buffs (names correct in WCL unless noted): Blessing / Greater Blessing of Kings, Might, Wisdom, Light, Sanctuary; Blessing of Salvation ("**Hand of Salvation**") and Greater Blessing of Salvation (−30% threat, 5 min / 15 min; Greater Blessings need a Symbol of Kings). Also: Power Word: Fortitude / Prayer of Fortitude; Mark of the Wild / Gift of the Wild; Thorns; Arcane Intellect / Arcane Brilliance; Divine Spirit / Prayer of Spirit (talent; Prayer of Spirit uses a Sacred Candle); Shadow Protection / Prayer of Shadow Protection (WCL shows both as "Shadow Protection"); Trueshot Aura (party +100 AP); Battle Shout (party +232 melee AP, 2 min); Blood Pact (imp, party +42 stamina); Leader of the Pack (party +3% melee/ranged crit, shapeshifted druid); Moonkin Aura (party +3% spell crit, cast via "Moonkin Form"). Sources: [WH-tt] 1038, 25895, 20906, 25289, 11767, 24932, 24907, 27681; [LOG]. H.

## 5. Utility worth recognising

| Spell (**WCL name**) | What it means | Conf. |
|---|---|---|
| Power Infusion | +20% spell damage and healing for 15 s, 3 min cooldown; given to a mage or warlock | H WH-tt 10060 |
| Innervate | +400% mana regen, 100% regen while casting, 20 s, 6 min cooldown | H WH-tt 29166 |
| Rebirth | combat res (2,200 HP / 2,800 mana at r5), 30 min cooldown, Ironwood Seed reagent; logged as a resurrect event (20748) | H |
| Soulstone Resurrection | warlock pre-placed res; buff, then a resurrect event (20765) | H |
| Fear Ward | see the dispel table | H |
| Blessing of Protection ("**Hand of Protection**") | 10 s physical immunity; the target can't attack; 5 min cooldown; drops the target off melee | H |
| Blessing of Sacrifice | transfers a flat 45–55 damage per hit to the paladin, 30 s | H WH-tt 20729, WW-BoSac |
| Blessing of Freedom | 10 s immunity to movement impairment | H |
| Divine Intervention | the paladin dies, the target becomes immune and unable to move; 1 h cooldown, Symbol of Divinity reagent | H WH-tt 19752 |
| Tranquilizing Shot | removes 1 Frenzy (WCL "Enrage") | H |
| Shackle Undead, Mind Control | crowd control | H |
| Interrupts: Kick, Pummel, Shield Bash, Counterspell | WCL logs the silence as "Silenced - Improved Counterspell" / "Silenced - Improved Kick" | H |
| Feign Death | logs as a death event with a feign flag. `derive.mjs` already skips it (`e.feign`). Addons have had to filter it explicitly | H for the project behaviour, M for WCL in general [CF-RDT] |
| Vanish, Feint, Fade | threat drops | H |

## 6. Threat basics (vanilla)

- **Aggro pull rule:** you pull aggro at 110% of the current target's threat when in melee range and at 130% when at range. The comparison is against the mob's current target, not the top of the threat list. Moving into melee range adds no threat, but a player between 110% and 130% pulls aggro with the first threat action in melee range. Sources: [WH-threat], [Reddit-threat]. H.
- **Modifiers** (from [WT-threat]):
  - Defensive Stance ×1.3, ×1.495 with Defiance. Battle and Berserker Stance ×0.8.
  - Bear Form ×1.3, ×1.495 with Feral Instinct. Cat Form ×0.8 per this table; some sources say 0.71.
  - Righteous Fury ×1.6 on holy damage, ×1.9 with Improved Righteous Fury.
  - Rogue ×0.8 per this table; commonly cited as 0.71 elsewhere.
  - Healing generates 0.5 threat per point healed, split across all engaged mobs. Mana and rage gains generate threat too.
  - Confidence: M, because rogue and cat values vary by source.
- **Threat reducers:**
  - Blessing of Salvation / Greater Blessing of Salvation: −30% threat [WH-tt 1038]. Tanks must not have it.
  - Fade: temporary, −820 at r6. Feint: −800 at r5. Feign Death and Vanish wipe threat entirely [WT-threat]. H.
- **Boss threat resets or reductions:**
  - Broodlord Lashlayer: Knock Away cuts the target's threat by 50% [WW-Broodlord, search summary]. M.
  - Twin Emperors: threat resets on teleport [IV-Twins]. H.
  - Princess Yauj (Bug Trio): fear wipes her threat table [search summary]. M.
  - Ragnaros: Wrath of Ragnaros knocks melee back. Whether it actually wipes threat is disputed (player reports only) [BlizzForum-Rag]. L.
  - Onyxia: knockbacks reduce threat by about 25% (anecdotal). L.
  - Not verified: Noth (blink), Arlokk and Bloodlord Mandokir. Treat any such claim as unconfirmed.

## Sources
- [LOG] /Users/cedrik/moist/data/wcl/reports/*.json.gz (masterData.abilities), /Users/cedrik/moist/data/wcl/fights/*.json.gz (cast tables), /Users/cedrik/moist/src/raids/data/nights/*.json. Extracted lists: scratchpad/research/abilities.jsonl, fight_names.txt, renamed.tsv
- [WH-tt] https://nether.wowhead.com/classic/tooltip/spell/<id> (dataEnv 4) and https://www.wowhead.com/classic/spell=<id> (IDs cited inline). Some tooltips carry Season of Discovery tuning tags (for example Trueshot Aura), so base values are taken from the non-SoD text.
- [WW-Nightfall] https://warcraft.wiki.gg/wiki/Nightfall_(axe)
- [WW-Stoneform] https://warcraft.wiki.gg/wiki/Stoneform
- [WW-BoSac] https://warcraft.wiki.gg/wiki/Blessing_of_Sacrifice
- [WW-FearWard] https://warcraft.wiki.gg/wiki/Fear_Ward (already cited in the project reference)
- [WW-Tranq] https://warcraft.wiki.gg/wiki/Tranquilizing_Shot
- [WW-Debuff] https://warcraft.wiki.gg/wiki/Debuff
- [BlizzForum-debuff] https://us.forums.blizzard.com/en/wow/t/debuff-limits/265988 and https://us.forums.blizzard.com/en/wow/t/removing-debuff-limit-in-classic-era-airtight-arguments/2050921
- [Engadget-2006] https://www.engadget.com/2006-02-25-debuffs-and-the-debuff-priority-system.html
- [WH-threat] https://www.wowhead.com/classic/guide/threat-overview-classic-wow
- [WT-threat] https://warcrafttavern.com/wow-classic/guides/threat-guide-reference-table
- [Reddit-threat] r/classicwow threat-threshold thread (mirror found via search; M)
- [WW-Broodlord] https://warcraft.wiki.gg/wiki/Broodlord
- [IV-Twins] https://www.icy-veins.com/wow-classic/the-twin-emperors-guide-strategy-abilities-loot
- [BlizzForum-Rag] https://us.forums.blizzard.com/en/wow/t/possible-glitch-with-ragnaros-threat/343390
- [WT-comp] https://www.warcrafttavern.com/community/pve/classic-40-man-raid-composition/
- [Guildorder] https://guildorder.com/games/wow_classic/guides/forty-man-raid-roster-management
- [CF-RDT] https://www.curseforge.com/wow/addons/raid-death-tracker/files/8314466 (Feign Death shows as a death in the combat log)
- [wow.gg] https://wow.gg/guides/nightfall-transmog-guide (Spell Vulnerability name)

## Discrepancies with the project files

### scripts/raids/fetch.mjs (line 764–765)
1. **Bug: `TANK_SPELLS` "Swipe" never matches.** WCL shows bear Swipe as `"Swipe (Bear)"` (ID 9908).
   - Current: `"Swipe"`
   - Suggested: `"Swipe (Bear)"`
2. **Prot paladins are never classified as tanks.** Righteous Fury is cast about once per night (30 min buff).
   - Suggested: add `"Holy Shield"` and `"Sacred Shield"`. Holy Shield rank 1 (ID 20925) shows as "Sacred Shield". Seen at 30–74 casts per report for the guild's prot paladins.
   - Optional: `"Consecration"`, but holy paladins use it on trash (36 casts by one healer), so it is not safe.
3. Optional additions to `TANK_SPELLS`:
   - Safe: `"Frenzied Regeneration"`, `"Demoralizing Roar"`, `"Challenging Shout"` (Challenging Roar is already in).
   - `"Vanguard"` (Defensive Stance, ID 71) is a good tank signal, but DPS warriors also have a few casts (4–20 in [LOG]). Only add it if the threshold is raised or it gets a lower weight.
4. **`HEAL_SPELLS` is missing `"Holy Nova"` and `"Tranquility"`.** Holy Nova had 489+ casts on holy priests. Optional: `"Lay on Hands"`.
5. **The healer ratio counts casts that aren't throughput.** Wand `"Shoot"`, resto druids' `"Faerie Fire"` and dispels (`"Cleanse"`, `"Dispel Magic"`, `"Remove Corruption"`, `"Remove Curse"`, `"Abolish Poison"`, `"Abolish Disease"`, `"Purify"`, `"Cure Poison"`) all count toward the total today.
   - Real cases in [LOG]: priests at 0.41–0.47 because of Shoot; resto druids at 0.37–0.48 because of Faerie Fire; a holy paladin at 0.49 because of Cleanse. All of them were classified as DPS.
   - Suggested: exclude a `NEUTRAL_CASTS` set from `t.total`, or require `heal >= 0.5 * (total - neutral)`.

### scripts/raids/config.mjs (TRACKED_CASTS)
6. `"Blessing of Protection"` never occurs, because WCL logs it as "Hand of Protection".
   - Keep `"Hand of Protection"` but add `label: "Blessing of Protection"` so the UI and the AI see the Classic name.
   - Drop `"Blessing of Protection"`, or leave it as harmless.
7. Debuff category: add `"Faerie Fire (Feral)"`. There were 130+ feral Faerie Fire casts that don't count today.
   - Consider `"Demoralizing Roar"` (it doesn't stack with Demoralizing Shout, so it covers the same job).
   - Consider `"Curse of Tongues"` and `"Curse of Weakness"` (59 and 10 casts).
8. Utility category: consider adding:
   - `"Hand of Salvation"` with label "Blessing of Salvation" (only single-target Salvation; the Greater one is a buff).
   - `"Blessing of Freedom"` (80 casts).
   - Threat-drop tools for wipe analysis: `"Feint"`, `"Fade"`, `"Vanish"`.
   - `"Berserker Rage"` (fear-break on Magmadar, Onyxia and Nefarian).
9. Optional potion entry: `{ name: "Cure Poison", label: "Elixir of Poison Resistance", category: "potion", ids: [26677] }`. It has ~1,550 casts across all classes.
10. Any future entry for Death Wish must use `{ name: "Sweeping Strikes", ids: [12328], label: "Death Wish" }`. The WCL name is wrong for this spell.

### .claude/skills/raid-logs/reference/classes-and-log-reading.md
11. Line 4 says the names below are the names WCL shows, which is not always true. Add a "WCL display-name traps" table: the section 0 table above (at least Vanguard, Sweeping Strikes = Death Wish, Bloodbath, Chakra, Judgment, Remove Curse (mage), Remove Corruption (druid), Dispel Magic = Cure Disease, Purify = Dispel Magic r1, Hand of Protection, Hand of Salvation, Sacred Shield, Swipe (Bear), Wild Charge, Critical Mass, Shadow and Flame, Agony = Shadow Trance, Cold Snap = Ice Block, Icy Veins = Cold Snap, Seals of Command, Seal of Insight, Turn Evil, Ice Trap, Heart of the Crusader, Enrage = Frenzy, Shadow Protection = Prayer of Shadow Protection).
12. Line 10 (warrior tanking kit): note that Defensive Stance is logged as **"Vanguard"**, and that Fury/Prot tanks have no Shield Block or Shield Slam.
13. Line 11 (Fury cooldowns): "Death Wish" shows as **"Sweeping Strikes"** (12328), and real Sweeping Strikes shows as **"Bloodbath"** (12292). Death Wish also grants fear immunity (WH-tt 12328), which is useful for Onyxia, Magmadar and Nefarian.
14. Line 21 (mage): Remove Lesser Curse appears as **"Remove Curse"**.
15. Line 22 (mage): "Fire Vulnerability" appears as **"Critical Mass"** (22959). Add durations: Fire Vulnerability 30 s, Winter's Chill 15 s at +2% frost crit per stack.
16. Line 23 (mage): Ice Block appears as **"Cold Snap"** (11958), Cold Snap as "Icy Veins". Mana Ruby is cast as "Conjure Mana Gem".
17. Line 29 (warlock):
    - Improved Shadow Bolt's "Shadow Vulnerability" appears as **"Shadow and Flame"** (17800); lower talent ranks as "Shadow Mastery".
    - "Shadow Trance" appears as **"Agony"** (17941).
    - Curse of Doom appears as "Doom".
    - Add a separate line: the **Nightfall axe** proc is the debuff **"Spell Vulnerability"** (+15% spell damage taken, 5 s, ID 23605). It is not Shadow Vulnerability and not Shadow Trance.
18. Line 39 (shadow priest): "15% shadow debuff" is accurate as 5 stacks × 3%. Note that the in-game debuff is also called "Shadow Vulnerability"; WCL shows it as "Shadow Weaving" (15258).
19. Line 40 (priest): Inner Focus appears as **"Chakra"**. Greater Heal rank 1 appears as "Heal".
20. Line 41 (priest):
    - Cure Disease appears as **"Dispel Magic"** (528), and Dispel Magic rank 1 appears as "Purify" (527).
    - Prayer of Shadow Protection appears as "Shadow Protection". This collides with the potion; section 3's note about the shared name already exists and is correct.
    - Power Infusion is correct (+20% spell damage *and healing*, 15 s).
21. Line 45 (druid healing): add Tranquility to the list (it's in the reference but not in HEAL_SPELLS).
22. Line 46 (druid):
    - Remove Curse appears as **"Remove Corruption"**.
    - Bear Swipe appears as **"Swipe (Bear)"**, Feral Charge as "Wild Charge".
    - Rebirth reagent at max rank is Ironwood Seed; the 30 min cooldown is correct.
23. Line 51 (paladin blessings):
    - Blessing of Salvation appears as **"Hand of Salvation"**; Greater Blessing of Salvation keeps its name.
    - Salvation is −30% threat.
24. Line 52 (paladin):
    - Blessing of Protection appears as **"Hand of Protection"**.
    - Blessing of Sacrifice moves a flat 45–55 damage per hit, not a percentage.
    - Turn Undead appears as "Turn Evil".
    - Add Holy Shield (talent; rank 1 shows as "Sacred Shield") as the prot paladin tell.
25. Line 53 (Judgements): the cast is logged as **"Judgment"**. The debuffs keep "Judgement of …"; the low-rank Crusader debuff (21183) shows as "Heart of the Crusader".
26. Line 59 (curse row): change to "Mage (Remove Lesser Curse, WCL: 'Remove Curse'), Druid (Remove Curse, WCL: 'Remove Corruption')".
27. Line 61 (poison row):
    - Stoneform in 1.12 is 8 s *immunity* to poison, disease and bleed, plus 10% armor, on a 3 min cooldown (WW-Stoneform).
    - Add Elixir of Poison Resistance, logged as "Cure Poison" (26677), cast by any class. Don't credit those to druids.
28. Line 62 (disease row): Priest Cure Disease shows as "Dispel Magic".
29. Line 64 (Frenzy row): WCL logs boss Frenzy auras as **"Enrage"**. The code handles this through `NOT_DISPELS`.
30. Missing entirely: the **16-debuff cap** and debuff priority (Sunder, Faerie Fire, curses, Fire Vulnerability, Winter's Chill, Shadow Weaving / Improved Shadow Bolt, Judgements, Demoralizing Shout, Thunder Clap, Hunter's Mark; DoTs restricted). Add a short paragraph.
31. Missing entirely: threat rules (110% melee / 130% ranged against the current target; stance and form modifiers; Salvation −30%; Feign Death and Vanish wipe threat; Fade and Feint are partial; Broodlord, Twins and Yauj resets). Line 139 mentions Salvation, Feint, Fade and Feign Death but not the 110/130 rule.
32. Lines 143–144 (role detection):
    - Healer list: add Holy Nova, Lesser Heal, Tranquility.
    - Tank list: replace "Swipe" with "Swipe (Bear)" and add Defensive Stance ("Vanguard") and Holy Shield / "Sacred Shield".
    - Note that Righteous Fury is a once-per-30-minute cast.
    - Add the wand / Faerie Fire / dispel denominator pitfalls.
33. Line 128 (friendly fire): fine. Add that Feign Death logs as a death event; the pipeline drops it via `e.feign` (derive.mjs:187).
