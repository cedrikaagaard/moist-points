# Classes, consumables and log reading (Classic Era, Alliance, 40-man)

Scope: vanilla 1.12 mechanics as played on Classic Era / Anniversary realms. Alliance only, so no shamans (no totems, no Windfury, no Tremor Totem, no Purge, no Bloodlust/Heroism, which did not exist anyway). No Misdirection, no Steady Shot, no Lifebloom: those are TBC. Spell names below are the names Warcraft Logs (WCL) shows in casts, buffs and debuffs. Where a name is uncertain it is flagged.

## 1. Class raid responsibilities

### Warrior
- Specs: Protection or "deep Fury/Prot" tanks (main tank, off-tanks), Fury DPS (most warriors, often dual-wield), Arms rare in PvE (some Arms for Mortal Strike, rarely needed).
- Tanking kit: Taunt, Mocking Blow, Challenging Shout (AoE taunt, emergency), Shield Block, Shield Wall (big defensive), Last Stand, Revenge, Shield Slam (talent), Sunder Armor, Heroic Strike (threat), Thunder Clap, Berserker Rage (breaks/prevents fear, used to stay up through Bellowing Roar etc.).
- Raid utility: Sunder Armor (5 stacks, -450 armor each at max rank; the boss tank or first warrior is expected to get 5 stacks fast), Demoralizing Shout (boss AP reduction, should stay up on bosses that hit hard), Thunder Clap (attack speed slow), Battle Shout (party AP buff, each group with warriors should have it), Intimidating Shout (AoE fear, can cause chaos), Pummel / Shield Bash (interrupts, 1.12 has kicks on warriors), Disarm, Hamstring (snare). Fury DPS cooldowns: Death Wish, Recklessness, Bloodthirst, Whirlwind, Execute (sub-20% phase), Cleave on adds, Sweeping Strikes.
- Common log tells: Sunder Armor debuff stack count on boss, "Deep Wounds" bleed, "Flurry" uptime, "Enrage" (talent).

### Rogue
- Specs: Combat (swords or daggers) is the default raid spec; some Assassination/Seal Fate daggers. All DPS.
- Raid utility: Expose Armor (usually Improved Expose Armor, replaces and does NOT stack with Sunder Armor, so only used when the raid plans it), Kick (main interrupter on casters), Gouge/Kidney Shot/Cheap Shot (stun trash), Blind, Sap (pre-pull CC on humanoids), Distract, Vanish (threat drop, also escapes), Evasion (off-tanking trash/whelps in emergencies), Feint (threat reduction; a rogue dying to boss melee without Feint casts is a threat mistake).
- Throughput cooldowns: Blade Flurry, Adrenaline Rush, Slice and Dice uptime. Thistle Tea is a consumable for energy.

### Mage
- Specs: Frost (MC and other fire-immune or fire-resistant bosses), Fire (BWL onward with Scorch support), Arcane (rare as main spec; Arcane Power/Presence of Mind in hybrid builds, e.g. "Elemental/PoM").
- Raid utility: Arcane Intellect / Arcane Brilliance (raid intellect buff), Remove Lesser Curse (main curse removers alongside druids; Lucifron, Gehennas, Nefarian Veil of Shadow, Noth, Sapphiron Life Drain), Polymorph (sheep humanoids/beasts, also used on mind-controlled raiders, e.g. Kel'Thuzad Chains of Kel'Thuzad, Hakkar Cause Insanity, Skeram True Fulfillment), Counterspell (interrupt, also lockouts), Frost Nova, Blizzard/Arcane Explosion/Flamestrike (AoE on trash), Amplify Magic / Dampen Magic.
- Fire mage debuffs: Scorch applies "Fire Vulnerability" (Improved Scorch, 3% fire damage taken per stack up to 5); keeping 5 stacks is a fire-mage team job. Frost: "Winter's Chill" (crit, 5 stacks).
- Defensives: Ice Block, Evocation (mana), Mana gems (Mana Ruby etc.; use-effect names vary, verify in the report). Conjured water/food between pulls.

### Warlock
- Specs: Destruction (SM/Ruin) is standard; Demonology/Sacrifice variants (Demonic Sacrifice with Succubus = "Touch of Shadow").
- Curse assignments (only one curse per warlock per target): Curse of Recklessness (removes armor, used when melee-heavy; also makes target immune to fear), Curse of the Elements (fire/frost damage taken, for mages), Curse of Shadow (shadow/arcane taken, for warlocks), Curse of Tongues (casting speed, on caster bosses/adds), Curse of Weakness (rarely), Curse of Doom. A missing curse on a long fight is a measurable DPS loss.
- Raid utility: Soulstone Resurrection (buff on a target, typically a healer/priest or paladin, used for wipe recovery and battle res; shows as "Soulstone Resurrection" buff and a resurrect when used), Healthstones ("Major Healthstone" when used), Ritual of Summoning, Banish (Garr's Firesworn adds, MC elementals, demons), Enslave Demon (some trash), Fear (risky in raids), Death Coil, Shadow Ward.
- "Shadow Vulnerability" from Improved Shadow Bolt (20% shadow damage taken, charges). "Shadow Trance" (Nightfall proc). Life Tap and Dark/Demonic Rune show self damage, not real threats.
- Felhunter: Devour Magic can remove a magic effect from a friendly target (pet ability; low volume in logs). Imp: Blood Pact, Fire Shield.

### Hunter
- Specs: Marksmanship (Trueshot Aura) standard; Survival hybrids; Beast Mastery rare in raids.
- Raid utility: Tranquilizing Shot (removes Frenzy; learned from a tome that drops in Molten Core; 20 s cooldown so hunters rotate; required on Magmadar, Flamegor, Chromaggus, and per community sources Princess Huhuran and Gluth), Hunter's Mark (ranged AP on the boss; one hunter keeps it up), Trueshot Aura (party AP aura), Feign Death (threat drop and used to drop combat when pulling), Distracting Shot (threat), Freezing Trap (CC trash), Viper Sting (mana drain on casters), Scorpid Sting (hit chance debuff, conflicts with Serpent Sting), Aspect of the Wild (party nature resistance, AQ40), Frost Trap (snare).
- Pulling: hunters often pull trash and bosses then Feign Death; a pull where the hunter dies or the pack resets onto healers is a pull error, not a tank error.
- Throughput: Auto Shot, Aimed Shot, Multi-Shot, Arcane Shot, Rapid Fire, pet damage counted under the hunter.

### Priest
- Specs: Holy or Discipline/Holy hybrid healers (Power Infusion builds), occasional Shadow (provides "Shadow Weaving" 15% shadow debuff for warlocks and "Vampiric Embrace").
- Healing spells: Flash Heal, Greater Heal, Heal (downranked spam is normal), Renew, Prayer of Healing (group heal), Power Word: Shield (leaves "Weakened Soul"), Holy Nova, Lightwell. Inner Focus (free spell).
- Raid utility: Power Word: Fortitude / Prayer of Fortitude, Divine Spirit / Prayer of Spirit (talent), Shadow Protection / Prayer of Shadow Protection, Fear Ward (DWARF priests only in 1.12: 10 min duration, 30 s cooldown; trivialises Onyxia P3 and Nefarian fear for the main tank), Dispel Magic (main magic dispellers with paladins), Cure Disease / Abolish Disease, Shackle Undead (Naxx undead trash, Kel'Thuzad Guardians of Icecrown), Mind Control (humanoids; Razuvious Death Knight Understudies are controlled via the Obedience Crystals by priests, verify spell name in report), Mana Burn, Psychic Scream (dangerous in raids), Fade (threat drop), Power Infusion (talent, 20% spell damage buff given to a mage/warlock), Resurrection.

### Druid
- Specs: Restoration (most raid druids), Feral (bear off-tank or cat DPS with "Leader of the Pack" party crit aura), Balance/Moonkin (rare, "Moonkin Aura" 3% spell crit).
- Healing spells: Healing Touch (often downranked), Regrowth, Rejuvenation, Tranquility, Swiftmend (talent, 1.12), Nature's Swiftness (instant Healing Touch emergency).
- Raid utility: Innervate (mana to a healer, usually priests; a healer OOM with Innervate unused is a planning failure), Rebirth (combat resurrection, 30 min cooldown, needs a reagent; shows as a resurrect), Remove Curse, Cure Poison / Abolish Poison (main poison removers with paladins), Faerie Fire (armor debuff, one druid keeps it up; feral version "Faerie Fire (Feral)"), Mark of the Wild / Gift of the Wild, Thorns on tanks, Hibernate (beasts/dragonkin CC), Entangling Roots, Challenging Roar (AoE taunt), Growl, Demoralizing Roar (does not stack with Demoralizing Shout).

### Paladin
- Specs: Holy (vast majority), Retribution (for Sanctity Aura and Judgement debuff support), Protection (tanks are uncommon in Classic Era but exist; Blessing of Kings is a Protection-tree talent, so most raids have a "Kings" paladin).
- Healing spells: Holy Light (often downranked), Flash of Light, Holy Shock (talent), Lay on Hands (full heal, drains caster mana, long cooldown).
- Blessings: Blessing / Greater Blessing of Kings, Might, Wisdom, Salvation (threat reduction, warriors who tank should NOT have it), Light, Sanctuary. Greater Blessings are class-wide, 15 min, need Symbol of Kings. One blessing per paladin per target, so blessing coverage depends on paladin count.
- Raid utility: Cleanse (magic, poison, disease), Purify (poison, disease), Blessing of Protection (physical immunity, also drops threat-target; cannot be used on someone who needs to attack), Blessing of Sacrifice (transfers part of the target's damage taken to the paladin), Blessing of Freedom (roots/snares), Divine Intervention (sacrifices the paladin to save a target for a wipe recovery; target becomes immune and is "removed" from combat, paladin dies, so a paladin death right before a wipe can be deliberate), Divine Shield / Divine Protection (self), Hammer of Justice (stun), Turn Undead, Redemption (resurrect).
- Judgements on boss: Judgement of Wisdom, Judgement of Light, Judgement of the Crusader (holy damage taken). Auras: Devotion, Concentration (healers), Retribution, Sanctity, Fire/Frost/Shadow Resistance Aura (resistance fights).

## 2. Who can remove what (Alliance)

| Type | Removers (spell) | Notes |
|---|---|---|
| Curse | Mage (Remove Lesser Curse), Druid (Remove Curse) | Paladins and priests CANNOT remove curses. |
| Magic | Priest (Dispel Magic), Paladin (Cleanse), Warlock Felhunter (Devour Magic) | Druids and mages cannot dispel magic. |
| Poison | Druid (Cure Poison, Abolish Poison), Paladin (Purify, Cleanse) | Dwarf Stoneform self-cleanses poison/disease/bleed; Anti-Venom/Elixir of Poison Resistance items. |
| Disease | Priest (Cure Disease, Abolish Disease), Paladin (Purify, Cleanse) | |
| Fear | Fear Ward (dwarf priest, prevention), Berserker Rage (warrior self), Will of the Forsaken does not exist on Alliance | No Tremor Totem for Alliance. |
| Frenzy (enemy buff) | Hunter Tranquilizing Shot | |
| Mind control on raider | Polymorph, Hammer of Justice, stuns; killing or CCing, not dispelling, is usual | |

Common raid debuffs by type (verify per encounter in the report's debuff list):
- Curse: Lucifron's Curse, Gehennas' Curse, Shazzrah's Curse (MC); Veil of Shadow (Nefarian, healing reduction); Curse of the Plaguebringer (Noth); Life Drain (Sapphiron); Delusions of Jin'do (ZG, remove so player can see/kill shades only if assigned; uncertain on intended handling); Chromaggus Brood Affliction: Black.
- Magic: Impending Doom (Lucifron), Magma Shackles (Garr), Ignite Mana (Baron Geddon; Living Bomb is the one players must run out with), Dominate Mind (Lucifron's Flamewaker Protectors, it is MC), Hex (Jin'do, tank), Holy Fire (Venoxis), Brood Affliction: Blue, Detonate Mana (Kel'Thuzad), Frost Blast (cannot be dispelled; heal through).
- Poison: Necrotic Poison (Maexxna, on tank, must be cured quickly), Poison Bolt Volley (Faerlina adds/Viscidus), Brood Affliction: Green, Wyvern Sting/Noxious Poison/Acid Spit (Huhuran, nature damage, mostly resist/potion rather than cure), Venoxis/Mar'li poisons (ZG).
- Disease: Brood Affliction: Red, Decrepit Fever (Heigan), Mutating Injection (Grobbulus: curing it triggers the slime explosion immediately, so curing must be timed after the player leaves the raid), various Naxx trash diseases.
- Not removable / special: Brood Affliction: Bronze (Hourglass Sand item), Burning Adrenaline (Vaelastrasz, player must run out and die away from raid), Living Bomb, Mark of Korth'azz/Blaumeux/Mograine/Zeliek (4HM marks), Corrupted Mind (Loatheb: healing spells, including Cleanse, on a shared 1 min cooldown per healer), Mortal Wound/Mortal Strike (healing reduction on tanks).

## 3. Consumables that matter

Log names are the buff/cast names seen in WCL, which often differ from the item name.

| Item | Log name (buff/cast) | Effect / use |
|---|---|---|
| Greater Fire Protection Potion | Fire Protection | Absorbs 1950-3250 fire, 1 h in Classic. Ragnaros, Vaelastrasz, Onyxia Deep Breath, Faerlina, 4HM (Thane Meteor). |
| Greater Frost Protection Potion | Frost Protection | Sapphiron (air phase Icebolt/Frost Breath), Kel'Thuzad, Viscidus. |
| Greater Nature Protection Potion | Nature Protection | Huhuran, Viscidus, Bug Trio, C'Thun, Thaddius (Chain Lightning), Hakkar-adjacent poison. |
| Greater Shadow Protection Potion | Shadow Protection | Loatheb (Inevitable Doom), 4HM (Void Zone), Nefarian, Firemaw/Ebonroc Shadow Flame (with cloak). Note priest spell "Shadow Protection" has the same name, distinguish by source. |
| Greater Arcane Protection Potion | Arcane Protection | Moam (Arcane Eruption), Gothik is cited by some guides; low certainty. |
| Free Action Potion | Free Action | Immunity to stun/root/snare movement effects, 30 s. Situational (e.g. Anub'Rekhan adds, trash, roots). |
| Limited Invulnerability Potion | Invulnerability | 6 s physical immunity; used by DPS who pulled aggro, or to survive a melee hit. |
| Restorative Potion | Restoration | Removes one curse/disease/poison/magic every 5 s for 30 s. Useful when dispellers are short. |
| Major Healing Potion | Healing Potion | 1050-1750 heal, shared 2 min potion cooldown with all potions above. |
| Major Mana Potion | Restore Mana | 1350-2250 mana. Shares potion cooldown. |
| Dark Rune / Demonic Rune | Dark Rune / Demonic Rune | 900-1500 mana, deals 600-1000 shadow damage to self (shows as self damage, can contribute to deaths). Shared rune cooldown, separate from potions. |
| Major Healthstone | Major Healthstone | ~1200 heal (more with talent). Separate cooldown. |
| Goblin Sapper Charge | Goblin Sapper Charge | AoE fire damage around the user, also damages the user. Engineers, trash and add phases. |
| Dense Dynamite / Thorium Grenade / Iron Grenade | same names | Engineering AoE / stun (grenades stun). |
| Flask of the Titans | Flask of the Titans | +1200 HP, tanks (and some others). 2 h, persists through death. |
| Flask of Supreme Power | Supreme Power | +150 spell damage, casters. |
| Flask of Distilled Wisdom | Distilled Wisdom | +2000 mana, healers. |
| Flask of Chromatic Resistance | Chromatic Resistance | +25 all resistances. |
| Other common buffs | Elixir of the Mongoose, Elixir of Giants, Juju Power, Juju Might, Winterfall Firewater, Greater Arcane Elixir, Shadow Power, Greater Firepower, Mana Regeneration (Mageblood), Mighty Rage (potion), Gift of Arthas, Juju Chill (frost res) | |

World buffs (Classic Era, verify presence in the report's buff table; cooldowns and server policies change):
- Rallying Cry of the Dragonslayer: +10% spell crit, +5% melee/ranged crit, +140 AP, 2 h. From Onyxia or Nefarian head turn-in in Stormwind.
- Songflower Serenade: +5% crit, +15 all stats, 1 h (Felwood).
- Spirit of Zandalar: +15% all stats, +10% movement speed, 2 h (Heart of Hakkar turn-in, Yojamba Isle / Booty Bay area).
- Dire Maul North tribute: Fengus' Ferocity (+200 AP), Mol'dar's Moxie (+15% stamina), Slip'kik's Savvy (+3% spell crit), 2 h.
- Sayge's Dark Fortune of Damage (+10% damage) and other Sayge's options (stats, resistances), 2 h, Darkmoon Faire.
- Traces of Silithyst (+5% damage, Silithus PvP). Resist Fire (UBRS, +fire resistance, older-style MC prep).
- Warchief's Blessing is Horde only and will not appear on Alliance raiders.
- Chronoboon Displacer lets players store and re-apply world buffs; "Supercharged Chronoboon Displacer"-style buffs can appear in logs.
- Expectations: world buffs inflate DPS heavily and are common for speedrunning/parsing guilds; casual guilds often raid without them. Missing world buffs explain lower damage but are rarely the cause of a wipe. Death removes world buffs (flasks persist through death), so early deaths in the night also cut later DPS.

Fight-specific expectations (typical, not absolute):
- MC: fire resistance and Fire Protection potions for Ragnaros (tanks/melee); curse removal on Lucifron, Gehennas; magic dispel on Lucifron (Impending Doom), Garr (Magma Shackles), Geddon (Ignite Mana); Tranquilizing Shot on Magmadar; Fear Ward/Berserker Rage for Magmadar Panic.
- Onyxia: Fear Ward on tank for P3 Bellowing Roar; Fire Protection optional for Deep Breath; whelp control in P2/P3.
- BWL: Onyxia Scale Cloak mandatory for Firemaw, Ebonroc, Flamegor and Nefarian (Shadow Flame without it is near instant death, killing blow "Shadow Flame"); Fire Protection for Vaelastrasz; Chromaggus breaths may call for Fire/Frost/Nature protection; Tranq on Flamegor/Chromaggus.
- ZG: poison/nature for Venoxis, Mar'li, Hakkar ("Poisonous Blood" from Son of Hakkar needed to stop Blood Siphon); curse removal on Jin'do Delusions, magic on Hex.
- AQ20/AQ40: Nature resistance and Greater Nature Protection for Huhuran, Viscidus (frost damage to freeze), Bug Trio, C'Thun; Polymorph/CC on Skeram MC; heavy Kick rotation on some trash/Twin Emperors adds.
- Naxx: Frost resistance plus Frost Protection for Sapphiron and Kel'Thuzad; Shadow Protection on Loatheb; Nature Protection on Thaddius; Fire on Faerlina and 4HM; poison cures on Maexxna; Free Action for Anub'Rekhan adds/trash.

## 4. Reading Warcraft Logs for wipe analysis

How things appear:
- Deaths: each death has a timestamp, the player, killing blow ability ("killingBlow"), the killer (NPC or player), and a death recap of the damage/heals before death. Overkill on the final hit says how big the burst was: high overkill (thousands) = one-shot or burst (tank crushed, failed mechanic, Shadow Flame, Deep Breath); small overkill after a long trickle = healing failure/attrition.
- Damage taken by ability: group damage taken by ability across the raid. One avoidable ability doing large damage to many people (Living Bomb, Deep Breath, Lava Bomb, Arcane Explosion, Void Zone, Chain Lightning) is a positioning/execution problem. Boss melee ("Melee") on non-tanks = threat or positioning error.
- Debuffs/buffs: uptime and stack counts per target (Sunder Armor, Faerie Fire, curses on boss; Fire Protection on raiders; Frenzy on boss and how fast it was removed).
- Interrupts: Interrupts table lists who interrupted which spell. Successful kicks of key casts vs casts that went through (look at enemy casts completing).
- Dispels: who removed which aura (dispel/cleanse events). Long debuff durations on raiders that are removable = dispel shortage.
- Resurrects: Rebirth, Soulstone Resurrection, Resurrection, Redemption show as resurrect events; a player can die twice in one fight.
- Friendly fire: mind-controlled raiders (Dominate Mind, Cause Insanity, Chains of Kel'Thuzad, True Fulfillment, Nefarian/Razorgore-style controls) become hostile; their damage on raiders is attributed to a player source, and raiders' damage on them can kill them (killer is a raider). Deaths with a player as killer usually mean MC handling went wrong. Also self-damage sources: Dark/Demonic Rune, Life Tap, Goblin Sapper Charge, Hellfire, Burning Adrenaline (Vael bomb kills others around the target).
- Fight percentage: the fights list shows boss health remaining at wipe. The project fetches `fightPercentage` and `bossPercentage` from the v2 API (0-100; kills show 0). For multi-boss or multi-phase encounters (Bug Trio, Twin Emperors, 4HM, Razorgore, C'Thun, Nefarian) the percentage may reflect the active boss/phase rather than total progress; treat it as approximate.
- Combat log caveats: the Classic client records events within a limited range of the logger, and multiple uploads may be merged; missing events (e.g. no recap for a far-away death, gaps in resource data) are a logging artifact, not a mechanic. HP/mana data needs Advanced Combat Logging.

Root cause vs cascade:
- Sort deaths by time. The first 1-3 deaths, and what killed them, usually define the wipe. Deaths after the raid has lost a tank or several healers are cascade and should not be blamed individually.
- A "wipe called" phase: many deaths within a few seconds near the end, often after boss reset or after people stop healing, sometimes with Divine Intervention / Soulstone / Feign Death / Vanish / Invisibility to save consumables or respawn time. Treat late mass deaths as the wipe itself, not separate failures.
- Tank deaths: killing blow from boss melee or a tank-buster (Flame Breath, Mortal Strike, Crush). Check the recap: were heals landing (healer issue: OOM, wrong target, out of range, Corrupted Mind), was there a debuff that should have been removed (Necrotic Poison, Hex), was a cooldown (Shield Wall, Last Stand) used, was a Frenzy not tranquilized, did the tank have Fire/Shadow protection when expected.
- Healer deaths: an early healer death usually means aggro from overhealing on adds (healer killed by add melee, e.g. Razorgore, whelps, Onyxia P2), standing in an avoidable ability, or targeted mechanics. Multiple healer deaths reduce healing and cause the tank death that follows; the tank death is then cascade.
- Raid-wide damage: many deaths from the same ability within a short window = failed mechanic (missing protection potions, standing wrong, not enough resistance, no Fear Ward causing fear into lava/adds, raid stacked during Living Bomb).
- Healer OOM attrition: long fight, mana of healers trending to zero, deaths with small overkill late, little or no Restore Mana / Dark Rune / Innervate usage, increasing gaps in heals. Usually a DPS/kill-time problem combined with poor consumable use, not a single mistake.
- Threat/aggro mistakes: a non-tank DPS killed by boss melee or a tank-only ability early in the fight, often in the first 10-20 s or right after a tank swap/knockback (Wing Buffet, Knock Away, Wrath of Ragnaros). Warrior, rogue and mage early deaths with killer = boss are the classic pattern. Check for Salvation, Feint, Fade, Feign Death use.
- Positioning failures: several players dying to one avoidable ability (Lava Bomb, Deep Breath, Rain of Fire, Living Bomb, Void Zone, Blizzard on Sapphiron, Chain Lightning on Thaddius polarity) or falling (killing blow "Falling" or environment).
- Add control failures: deaths to add melee (Core Hounds, Firesworn explosion, Flamewaker adds, whelps, Death Talons, Sons of Flame, Guardians of Icecrown, Anub'Rekhan Crypt Guards); deaths of cloth players to adds signal adds were not tanked/CCed/killed in time.
- Spec/role detection: WCL has no talent data for vanilla logs, so Classic Era spec labels are inferred and can be wrong (healers shown as a DPS spec, Fury tanks labelled DPS, Ret/Holy confusion). Infer roles from activity instead:
  - Healer: majority of casts are heals (Flash Heal, Greater Heal, Heal, Renew, Prayer of Healing; Healing Touch, Regrowth, Rejuvenation; Holy Light, Flash of Light) and healing done far exceeds damage done.
  - Tank: takes most boss melee, casts Taunt/Sunder Armor/Shield Block/Revenge (warrior), Growl/Maul/Swipe in bear form (druid), Righteous Fury active (paladin).
  - DPS: everyone else; caster vs melee by spells used.

## 5. Benchmarks (WCL parses)

- Percentile colours: grey 0-24, green 25-49, blue 50-74, purple 75-94, orange 95-98, pink 99, gold/tan 100 (the top log).
- A parse compares one player's performance on one boss kill with every other ranked log for the same encounter, same class and spec (role), in the same partition/metric. DPS players rank on DPS, healers on HPS. Only kills are ranked; wipes have no parse.
- "Bracket" (item level) percentile compares against players of similar gear; it is usually higher for undergeared players.
- Caveats:
  - Spec/role detection in vanilla logs is heuristic (see section 4), so a healer misdetected as DPS gets a meaningless parse.
  - Kill time matters: DPS is total damage over fight duration, so short kills with all cooldowns, world buffs and consumables inflate parses; long kills dilute them. A slow kill can still be fine execution.
  - World buffs, Power Infusion, raid composition (number of Sunder/Faerie Fire/curse providers) and boss mechanics (movement, add priority) heavily affect parses; parse percentiles are not a direct measure of mistakes.
  - Healers parse on effective healing per second (overheal excluded as far as known; how absorbs are counted is not documented clearly), so healers in an overgeared raid or assigned to tanks/dispels parse low without doing anything wrong. Do not judge healers by parse alone; judge by deaths prevented, dispels, mana management.
  - Tanks rarely parse meaningfully; judge them on deaths, threat (DPS dying to boss melee) and debuff uptime.
  - Per-player deaths reduce damage time and therefore parses.

## Sources
- https://www.archon.gg/classic-fresh/articles/help/rankings-and-parses (colour/percentile table, via search summary; page itself returned 403)
- https://www.archon.gg/classic-mop/articles/news/classic-blog-wrath-release (no talent data in vanilla logs)
- https://www.archon.gg/classic-sod/articles/news/sod-phase-4-on-warcraft-logs (tank detection approach)
- https://articles.classic.warcraftlogs.com/help/how-to-navigate-through-logs
- https://bittsguides.com/warcraft-logs-tutorial/
- https://www.wowhead.com/classic/spell=17543 (Fire Protection)
- https://www.wowhead.com/classic/spell=17531 (Restore Mana)
- https://www.wowhead.com/classic/spell=17534 (Healing Potion)
- https://www.wowhead.com/classic/spell=27869 (Dark Rune), https://www.wowhead.com/classic/spell=16666 (Demonic Rune)
- https://www.wowhead.com/classic/spell=11732 (Major Healthstone)
- https://www.wowhead.com/classic/spell=11359 (Restoration), https://www.wowhead.com/classic/spell=3169 (Invulnerability)
- https://warcraft.wiki.gg/wiki/Greater_Fire_Protection_Potion
- https://warcraft.wiki.gg/wiki/Elemental_protection_potions
- https://warcraft.wiki.gg/wiki/Fear_Ward
- https://warcraft.wiki.gg/wiki/Greater_Blessing_of_Kings
- https://warcraft.wiki.gg/wiki/Tranquilizing_Shot
- https://warcraft.wiki.gg/wiki/Chromaggus
- https://warcraft.wiki.gg/wiki/Raid_buffs
- https://www.warcrafttavern.com/wow-classic/guides/world-buffs/
- https://www.icy-veins.com/wow-classic/mage-dps-pve-enchants-consumables
- https://www.icy-veins.com/wow-classic/chromaggus-guide-strategy-abilities-loot
- https://www.wowhead.com/classic/guide/sapphiron-naxxramas-raid-strategy
- https://bittsguides.com/consumables-for-naxxramas/ (via search summary)
- https://www.wowhead.com/news/how-important-is-nature-resistance-gear-in-classic-temple-of-ahnqiraj-317307
- https://www.icy-veins.com/wow-classic/warrior-tank-nature-resistance-gear
