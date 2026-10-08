# Naxxramas (40-man, Classic Era / Anniversary) - boss reference for log analysis

Covers vanilla 1.12-style 40-man Naxxramas as run on Classic Era / Anniversary realms (not the Wrath 10/25 version; ignore Wrath-only mechanics such as 4H Shadow Bolt / Unyielding Pain or Thaddius phase-swap rules). Numbers come from warcraft.wiki.gg Classic pages, Wowhead Classic guides and spell tooltips. Ability names and spell IDs marked "(log)" were checked against 47 real Classic Era Naxxramas reports in this repo (`data/wcl/`), which is the best guide to what Warcraft Logs actually prints. Kill times marked "sample" come from those same reports. That guild is fast and well geared, so treat its times as the good end of the range.

General log-reading notes for the whole raid:
- Warcraft Logs (WCL) shows ability names, not Wowhead tooltip names. Several differ: 4H mark damage is just "Mark", Loatheb's aura is "Deathbloom", Fungal Bloom shows as "Fungal Creep", Shadow Fissure damage is "Void Blast", Heigan's mana burn is "Spell Disruption", and Grobbulus cloud damage is "Poison" from "Grobbulus Cloud". Use spell IDs when two abilities share a name. For example, KT "Frostbolt" 28478 is the single-target cast and 28479 is the volley.
- Death lists are symptoms. Always look at the 5-10 seconds before the first 3-5 deaths and ask whether the dead player was in the wrong place, the tank lost cover, or a mechanic was missed (dispel, interrupt, shackle, MC).
- Damage between players appears with a player as the source: Thaddius charges, Mind Controlled players on KT, and KT Mana Detonation. Do not read these as griefing.

## Anub'Rekhan
- **Fight in one line**: Single phase with roughly 1.67M HP. Two Crypt Guards are up at the pull, and each Locust Swarm (first one around 90s, then every 70-120s) brings another. The tank kites Anub during Swarm. Scarabs spawn from corpses. No berserk. Nature resistance is optional, and Free Action Potions help at the pull.
- **Mechanics**:
  - "Impale" (28783): 1s cast. A line of spikes toward a random player deals up to about 3.9k physical to everyone in the line and knocks them up, causing fall damage. Raids spread and avoid standing in lines behind other players. Healers heal knocked-up players before they land.
  - "Locust Swarm" (28785): 3s cast, then a 20s channel with a 30yd radius. The debuff deals 875-1,125 Nature every 2s for 6s, stacks, and pacifies and silences the target. Anub moves 40% slower while channelling. The main tank (MT) kites him around the room's outer edge while everyone else moves more than 30yd away. Hunters sometimes give the MT Aspect of the Pack, which dazes anyone hit while it is active. The MT must not run through the slime ring, which reduces stats.
  - "Summon Corpse Scarabs": a dead Crypt Guard spawns 10 scarabs and a dead player spawns 5. They take a few seconds to appear and then go for healers on healing threat. Mages Frost Nova them and the raid AoEs them down.
  - Crypt Guard (about 204k HP): "Acid Spit" (28969, log) is a stacking Nature DoT that cannot be cleansed, so the guard's tanks rotate. "Cleave" hits 3 targets, so the guard faces away from the raid. "Web" (28991, log) roots nearby players for 10s and Free Action Potion prevents it. "Enrage" below 50% gives +60% attack speed.
- **Jobs**: The MT holds Anub and kites during Swarm. 1-2 off-tanks (OTs) per Crypt Guard face it away from the raid. Mages and warlocks are ready to AoE scarabs, with Frost Nova first. Healers spread, stay behind the MT, and pre-HoT the MT before Swarm (Power Word: Shield, Renew, Rejuvenation). Melee use Free Action at the pull.
- **Common wipe causes / log signatures**:
  - "Locust Swarm" damage on many players, especially healers, means people did not get 30yd away. If the MT dies to Locust Swarm stacks, the kite started late or the MT healers were too far away.
  - Several deaths followed by many Corpse Scarab melee hits on cloth means a snowball. Each dead player spawns 5 more scarabs, so the first death is the real cause.
  - Deaths to "Impale" alone or to Falling mean bunched ranged or slow spot healing.
  - High "Acid Spit" stacks on a guard tank means the guard died too slowly or the tanks did not rotate.
- **What good looks like**: Sample kills took 49-68s (median 57s), so a fast raid kills Anub before or right at the first Locust Swarm and has no deaths at all. A typical guild needs 2-4 minutes with 1-2 kites.
- **Analysis notes**: In a sub-90s kill Locust Swarm may never be cast, so its absence is not evidence of good kiting. In the sample data the logged debuffs were only Web and Acid Spit. Scarab deaths are a consequence of earlier deaths, not their cause.

## Grand Widow Faerlina
- **Fight in one line**: Faerlina comes with 2 Naxxramas Followers and 4 Naxxramas Worshippers. Her Enrage comes roughly every 60s and is removed by sacrificing a Mind Controlled Worshipper (Widow's Embrace). Once the Worshippers are gone, Enrage cannot be removed, which makes it a soft enrage at about 4:45. Melee benefit from fire resistance.
- **Mechanics**:
  - "Poison Bolt Volley" (28796): Nature hit plus a poison DoT every 2s for 8s on several players. Dispellable by druids, shamans and paladins (cleanse or cure poison).
  - "Rain of Fire" (28794): ground AoE dealing 1,850-2,150 Fire every 2s for 6s. Move out immediately.
  - "Enrage" (28798): +75% attack speed and +150 physical damage. On a geared MT it is lethal within seconds if not removed.
  - "Widow's Embrace" (28732): cast by a Mind Controlled Worshipper near Faerlina. The Worshipper dies, Enrage is removed or prevented, and her Nature spells (the Volley) are silenced for 30s. Sacrificing a Worshipper before she enrages only delays Enrage by about 30s. Sacrificing one right after she enrages buys the full 60s. In logs, "Widow's Embrace" also appears as a debuff on many raid members, mostly melee, near the Worshipper when it dies, and healers dispel it (log). Its count therefore does not equal the number of sacrifices.
  - Naxxramas Follower (about 100k HP, stunnable): "Silence" (30225, log) is an AoE silence that also blocks Taunt and healing. It also charges random players. Followers are usually killed first.
- **Jobs**: The MT holds Faerlina. OTs hold the Followers, which are often stacked for cleave, and the Worshippers, which are kept away from melee. Nobody damages the Worshippers. 2+ priests rotate Mind Control so the sacrifice lands next to Faerlina right after Enrage. About 3 dedicated poison cleansers. Ranged spread for Rain of Fire.
- **Common wipe causes / log signatures**:
  - MT killed by "Melee <Grand Widow Faerlina>" in a burst means Enrage was not removed: the Mind Control was late, resisted or broke, or the Worshipper was too far away. Look for the Widow's Embrace cast or debuff timing relative to her Enrage.
  - "Rain of Fire" killing blows mean players stood in fire, which often stacks with Volley DoTs nobody dispelled.
  - Healers silenced at the same time means Followers were left loose near the raid.
  - Worshippers dying to raid damage, such as AoE or cleave, leaves no way to remove Enrage later in the fight.
- **What good looks like**: Sample kills took 47-68s (median 54s), so fast raids finish around the first Enrage. Typical kills take 2-4 minutes and use 2-3 sacrifices. Poison Bolt Volley gets dispelled. There are 0-2 deaths.
- **Analysis notes**: Most Melee <Faerlina> deaths in the sample were MT deaths in the last seconds, which matter little on a kill. On a wipe, line up the MT's death with when the Enrage buff appeared. A WCL buff view of Faerlina shows Enrage. The debuff list will not show it.

## Maexxna
- **Fight in one line**: Single boss on a 40s cycle. Web Wrap at 20s, Spiderlings at 30s and Web Spray at 40s, each repeating every 40s. She Enrages at 30%. Poison cleansers are mandatory. Nature resistance potions help the MT.
- **Mechanics**:
  - "Web Wrap" (28622): flings players (3 per the wiki; some sources say 2) to the wall and cocoons them with about 6k HP. Wrapped players take Nature damage every 2s. Ranged kill the cocoons. A PvP trinket can free a wrapped player.
  - "Web Spray" (29484): unresistable raid-wide stun (roughly 6-8s) plus 1,750-2,250 Nature damage. Nobody can heal during it, so the MT must be topped up with HoTs, shields and Abolish Poison before it lands. A Flask of Petrification can be used to cheese it.
  - "Poison Shock" (28741): 15yd frontal Nature cone. Only the tank should be hit.
  - "Necrotic Poison" (28776): -90% healing taken for 30s on the tank. A poison, so cleanse it immediately.
  - Spiderlings: 8-10 every 40s with about 4k HP each. AoE them before Web Spray or they chew on stunned healers.
  - "Enrage" at 30%: large attack speed and damage increase. Shield Wall, Last Stand and Lifegiving Gem are used.
- **Jobs**: The MT faces her away from the raid (the raid sits behind her near a wall). Cleansers are assigned to the MT for Necrotic Poison. 2-4 ranged or hunters handle cocoons. Mages and warlocks AoE Spiderlings, with Frost Nova if needed. Healers stack HoTs on the MT before each Spray. DPS ideally time 30% to land right after a Spray.
- **Common wipe causes / log signatures**:
  - MT death to "Melee <Maexxna>" during or just after a Web Spray stun means the MT was not topped up or pre-HoTted before the Spray. If Necrotic Poison was on the MT, the cause is the missing cleanse.
  - MT dies soon after 30% means Enrage overlapped a Spray, or the MT had no cooldowns or Necrotic Poison was not cleansed.
  - Deaths of wrapped players mean cocoons were not killed fast enough.
  - "Poison Shock" deaths to non-tanks mean she turned toward the raid.
- **What good looks like**: Sample kills took 63-81s (median 68s), meaning 1-2 cycles. Typical kills take 3-5 minutes. Necrotic Poison is dispelled within a few seconds (54 of 76 applications were dispelled in the sample). Only the tank dies, if anyone.
- **Analysis notes**: 34 of the 36 deaths in the sample kills were "Melee <Maexxna>", mostly tanks at the end of kills or after Enrage. Look at the tank's Necrotic Poison uptime and when the last Web Spray landed. Do not blame individual healers for low healing during the stun.

## Noth the Plaguebringer
- **Fight in one line**: Noth fights on the ground and teleports to the balcony at about 90s, then about 110s and about 180s after each return (each balcony phase lasts up to 70s or 90s). Adds spawn on the ground and from balcony waves. Curse removal is the critical job. The whole raid must be inside the room at the pull, or anyone outside gets locked out.
- **Mechanics**:
  - "Curse of the Plaguebringer" (29213): curses several players. If it is not removed within 10s, it becomes "Wrath of the Plaguebringer" (29214), which spreads to nearby allies with an initial Nature hit plus ticks. Mages and druids decurse.
  - "Blink": Noth teleports about 20yd and wipes threat. "Cripple" (29212, magic) is put on everyone near his old spot: -50% movement, attack speed and strength. Dispel it from the MT right away.
  - Summon Skeletons: Plagued Warriors spawn at the bone piles every 30s. OTs hold them at their spawn points.
  - Balcony waves: Plagued Champions ("Mortal Strike", "Shadow Shock") and Plagued Guardians (Arcane Explosion, cannot be shackled). Stun the Guardians and kill them first.
- **Jobs**: The MT is in the centre with an intercept or charge ready after each Blink. Three OTs cover the NW, NE and SW spawns. Mages and druids have decurse assignments by group. Priests and paladins dispel Cripple. Rogues and warriors stun Guardians. Priests can shackle Champions and Warriors. DPS pause briefly after a Blink.
- **Common wipe causes / log signatures**:
  - "Wrath of the Plaguebringer" damage on many players means a curse was not removed within 10s. Find the cursed player whose curse expired (applied with no dispel within 10s) and who was responsible for removing it.
  - Ranged deaths to "Melee <Noth>" right after a Blink means threat reset and DPS did not wait for the MT.
  - OT deaths during the balcony waves mean too few healers on the OTs (Champion Mortal Strike) or Guardians left unstunned.
- **What good looks like**: Sample kills took 53-178s (median 68s), so fast raids kill him before the first balcony. Typical kills take 4-6 minutes with 2 balcony phases. Curses are decursed; in the sample 659 of 700 were removed and Wrath was applied 39 times across about 41 kills. No deaths.
- **Analysis notes**: Adds do not despawn when Noth dies, so deaths after the kill are not boss mechanics. Cripple and curse dispel counts per player show who did the decursing work.

## Heigan the Unclean
- **Fight in one line**: About 1.78M HP on a 135s cycle: 90s on the floor plus a 45s "dance" on the platform, repeating. Eruption waves move across 4 floor zones (order 1-2-3-4-3-2-1...). No hard enrage. Disease cleansers are needed. The bat tunnel gauntlet comes before him.
- **Mechanics**:
  - "Eruption" (29371, log; also 30244 from source "Plague Wave"): the floor erupts zone by zone for about 3.5-4.5k Nature damage, effectively a one-shot on low-health players. The waves are slower on the floor phase and much faster during the dance.
  - "Decrepit Fever" (29998): disease on melee within 20yd. Halves max HP and deals 500 Nature every 3s. Floor phase only. Cure Disease, Abolish Disease or Cleanse removes it.
  - "Spell Disruption" (29310, log; the Mana Burn): an AoE mana burn around Heigan that deals damage equal to the mana burned. Mana users stand on the platform during the floor phase so they are out of range.
  - Teleport: sends 3 players (never the top-threat player) into the Eye Stalk tunnel, where "Mind Flay" (29407) from Eye Stalks hits them. They must fight their way back before the dance.
  - "Plague Cloud" (30122, log): Heigan's channel on the platform during the dance. Anyone on the platform takes heavy damage, so everyone dances on the floor.
- **Jobs**: The MT drags Heigan to the floor away from the platform and moves with the safe zone. Melee stay with him. Ranged and healers stay on the platform during the floor phase. Priests, paladins and shamans cleanse Decrepit Fever. Everyone dances.
- **Common wipe causes / log signatures**:
  - "Eruption" killing blows (the most common death in the sample: 27 + 8 across 41 kills) mean a player was in the wrong zone. Usually it is an individual mistake. Many at once in the same second means the group misread the wave or lagged.
  - "Decrepit Fever" deaths mean disease not cleansed on half-HP melee. "Spell Disruption" deaths mean a caster was in range of Heigan, or the MT pulled him toward the platform.
  - "Plague Cloud" deaths mean someone stayed on the platform after the dance started.
- **What good looks like**: Sample kills took 56-193s (median 77s). Fast raids kill him in the first floor phase. Typical kills take 3-6 minutes with 1-3 dances. Decrepit Fever is mostly cleansed (773 of 1,087 in the sample).
- **Analysis notes**: Bat-tunnel and maggot deaths ("Melee <Diseased Maggot,Rotting Maggot>") can show up inside the boss segment from teleported players. Eruption deaths to individuals are personal errors, not raid-wide failures. Note the fast guild still averaged under 1 Eruption death per kill.

## Loatheb
- **Fight in one line**: A DPS race. Healers get one heal per 60s. "Inevitable Doom" starts at 2:00 and comes every 30s, then every 15s from 5:00, which works as a soft enrage. Spores grant crit and remove threat. The raid lives on consumables: Greater Shadow Protection Potions, bandages, healthstones, Whipper Root Tubers.
- **Mechanics**:
  - "Corrupted Mind" (29185, 29194, 29196 per class, log): any healing or beneficial spell triggers a 60s lockout, so healers rotate one heal each on the MT and DPS in between.
  - "Deathbloom" (29865, log; the Poison Aura): a melee-range Nature DoT. Poison cleansing totem or cleanses help; it was dispelled 290 times in the sample.
  - "Inevitable Doom" (29204): 2,550 Shadow to everyone after 10s. It cannot be resisted or dispelled, but Shadow Protection Potions absorb it. First cast at about 2:00 (confirmed at 121s in the sample logs), then every 30s, then every 15s after 5:00.
  - Remove Curse: Loatheb strips curses from himself every 30s. In the logs these appear as dispels of Curse of Recklessness, Curse of the Elements and Curse of Shadow; warlocks must reapply them.
  - "Summon Spore": the spore's death gives "Fungal Creep" (29232, log; called Fungal Bloom in guides) to the 5 nearest players: +50% melee crit, +60% spell crit and no threat for 90s. Groups rotate on spores.
- **Jobs**: The MT holds Loatheb (heal rotation addon or schedule). Healers DPS and cast their one heal on rotation. Everyone uses a consumable schedule (shadow potion before the pull, then potion, bandage and healthstone around each Doom). Warlocks recurse. Groups rotate onto spores.
- **Common wipe causes / log signatures**:
  - "Inevitable Doom" killing blows rising late in the fight mean either slow DPS (the fight is past 4-5 minutes) or players not using potions and bandages. Compare fight length with when the deaths cluster.
  - MT death to "Melee <Loatheb>" means the heal rotation had a gap: two healers cast in the same window, or a healer was dead or out of range.
  - Low Fungal Creep uptime on top DPS means spores were not taken in the right order.
- **What good looks like**: Sample kills took 143-228s (median 180s), so fast raids take only 2-4 Dooms. Typical kills take 4-5 minutes. A 6+ minute fight is near-wipe territory. A few Doom deaths at the end are normal in the sample (22 Doom killing blows across 41 kills).
- **Analysis notes**: Healer "HPS" is meaningless here, so judge healers by heal-rotation adherence and damage done. Doom deaths are often the result of consumable discipline, not healer failure. The Remove Curse dispels are the boss, not players.

## Instructor Razuvious
- **Fight in one line**: Razuvious is tanked by Mind Controlled Deathknight Understudies (4 of them), not by players. "Disrupting Shout" burns mana in line of sight every 25s. Needs 2+ priests on Mind Control rotation. No enrage.
- **Mechanics**:
  - "Unbalancing Strike" (26613): 350% weapon damage and -100 defense for 6s. It effectively one-shots or cripples player tanks, which is why Understudies tank him.
  - "Disrupting Shout" (29107): every 25s (first cast at about 26s in the sample). Burns 4,050-4,950 mana from everyone in line of sight within 45yd and deals physical damage equal to twice the mana burned, enough to kill most casters. Line of sight around the stairs or railing avoids it.
  - Understudy (MC pet bar): "Taunt" (20s, 1 min cooldown), "Shield Wall" (75% damage reduction, 20s, 30s cooldown). "Mind Exhaustion" makes an Understudy immune to charm for 60s after the MC breaks. "Hopeless" makes the remaining Understudies take +5000% damage after Razuvious dies.
- **Jobs**: Priests rotate MC: they Shield Wall and Taunt with the controlled Understudy and hand over when its Shield Wall or Taunt runs out or the MC breaks. Warrior OTs hold the free Understudies (no Sunder on Understudies). A player tank taunts briefly with cooldowns as an emergency. Casters and healers stay out of Razuvious's line of sight. Melee DPS Razuvious.
- **Common wipe causes / log signatures**:
  - Many "Disrupting Shout" deaths in one second (the sample's top wipe killer: 42 deaths on 6 wipes) mean casters or healers were in line of sight. When all of them die on the first Shout at about 26s, the raid was positioned badly or Razuvious was pulled to the wrong spot.
  - "Unbalancing Strike" or "Melee <Instructor Razuvious>" killing a player means there was no Understudy tanking: the MC was resisted, broke early, the Understudy died, or a Taunt was used late.
  - Understudy deaths before Razuvious dies mean healers were not healing the controlled Understudy.
- **What good looks like**: Sample kills took 89-134s (median 99s). Typical kills take 2.5-4 minutes. Zero or near-zero Disrupting Shout deaths. Each MC handoff is clean.
- **Analysis notes**: On kills, "Melee <Death Knight Understudy>" deaths are usually OTs or melee killed by free Understudies, or deaths after Hopeless is applied. Even fast raids lose people to Disrupting Shout (29 killing blows on kills in the sample), so a few per kill is normal. Clustered Shout deaths are a positioning problem.

## Gothik the Harvester
- **Fight in one line**: About 4:30 of add waves (Gothik is untargetable), then Gothik descends (confirmed by the first Harvest Soul at about 272s in the sample). The raid splits into a living side and an undead side. The centre gate opens when Gothik drops low (wiki and Wowhead: about 30%) or when one side has no living players. Adds do not despawn when Gothik dies.
- **Mechanics**:
  - Living side: Unrelenting Trainee (from 24s, every 20s), Unrelenting Death Knight (from 74s, every 25s), Unrelenting Rider (from 134s, every 30s). The Death Knight's "Shadow Mark" (27825, log) is a whirlwind that marks players. The Rider's "Shadow Bolt Volley" (interruptible, interrupted 76 times in the sample) hits marked players, and its "Unholy Aura" (27988) deals 450 Shadow every 2s within 45yd.
  - Undead side, where each add arrives after its living version dies: Spectral Trainee "Arcane Explosion" (27989, the biggest damage source in the sample), Spectral Death Knight "Whirlwind" (15589), Cleave, "Sunder Armor" and Mana Burn, Spectral Rider "Drain Life" (27994, interruptible, magic) and Unholy Aura, Spectral Horse "Stomp" (27993).
  - Gothik: "Harvest Soul" (28679) stacks -10% stats on the raid about every 15-20s. "Shadow Bolt" (29317) hits hard. He alternates sides about every 15s.
- **Jobs**: Living side: about 3 tanks at the spawn points, most ranged and priests (shackle Death Knights, crowd control Trainees). The kill pace is controlled so the undead side is not flooded. Undead side: most melee plus healers, who stun-lock Trainees and Death Knights (Spectral adds are largely immune to magic), interrupt Drain Life and Shadow Bolt Volley, and kill in the order Trainee, Rider, Death Knight, Horse.
- **Common wipe causes / log signatures**:
  - Clusters of "Arcane Explosion" deaths on the undead side mean too many Spectral Trainees at once: the living side killed too fast, or Trainees were not stunned.
  - "Shadow Mark" plus "Melee <Unrelenting Death Knight,Unrelenting Rider>" deaths on the living side mean a Rider was not killed first or Shadow Bolt Volley was not interrupted.
  - One side wiping causes the gate to open and leaks every remaining add onto the other side, so later deaths are knock-on effects.
  - Deaths after 4:30 to "Shadow Bolt" while Harvest Soul stacks climb mean phase 2 lasted too long.
- **What good looks like**: The fight length is mostly fixed: sample kills took 297-329s (median 305s), so Gothik dies about 30s after landing. Typical kills take 5-6 minutes. Some deaths are normal; the sample averaged about 3 per kill, mostly undead-side melee.
- **Analysis notes**: Do not judge Gothik by duration. Judge add control by which side the deaths happen on and when, relative to the wave timers. Killing blows from "Melee <Spectral Horse,Spectral Rider>" are the most common sample death and are mostly melee on the undead side.

## The Four Horsemen
- **Fight in one line**: Thane Korth'azz, Lady Blaumeux, Highlord Mograine and Sir Zeliek are tanked in four corners. Each puts a stacking Mark on everyone within about 60-65yd every 12s (first Marks at 20s). Tanks and the raid rotate between corners. The standard setup uses 8 tanks. Each Horseman Shield Walls at 50% and 20%. Berserk after 100 Marks, at about 20 minutes. Dead Horsemen leave a Spirit that keeps casting Marks.
- **Mechanics**:
  - Marks (debuff names from the logs): "Mark of Korth'azz" (28832), "Mark of Blaumeux" (28833), "Mark of Rivendare" (28834, cast by Highlord Mograine in Classic Era logs; not "Mark of Mograine"), "Mark of Zeliek" (28835). Damage appears as "Mark" (28836, log). Unresistable Shadow by stack count: 1 stack 0, 2 stacks 250, 3 stacks 1,000, 4 stacks 3,000, 5 stacks 5,000, then +1,000 per extra stack. They last 75s and refresh, and each Mark halves threat on that Horseman. Players drop stacks at the safe spot in the middle or front.
  - Korth'azz "Meteor" (28884): 12.8-14.3k Fire split between everyone within 8yd of the target, so that group stays stacked.
  - Blaumeux "Void Zone" (28863): the damage is logged as "Consumption" (28865), about 4k Shadow per tick, and the zone lasts 90s. The tank circles her corner so she does not drop zones on the group.
  - Zeliek "Holy Wrath" (28883): chain that starts at about 500 Holy and doubles on each jump between players within about 10yd, every 12s. That group spreads.
  - Mograine: melee procs logged as "Unholy Shadow" (28882, log; guides call it Righteous Fire), heavy Fire/Shadow burst on his tank.
- **Jobs**: 4 primary plus 4 backup tanks (or a full 8-tank rotation) taunt at fixed Mark counts. Taunt can be resisted, so the next tank needs a backup taunt. Healers are assigned per corner and rotate with their group. DPS groups follow a rotation (typically switching every 3 Marks). Two Horsemen are commonly killed first, often Korth'azz and Blaumeux or Mograine, but this varies by strategy.
- **Common wipe causes / log signatures**:
  - "Mark" killing blows mean players stayed for too many stacks or missed the rotation call. Read the Mark stack count on the dead player. 4+ stacks of one Mark means a rotation failure.
  - Tank death followed by the Horseman running into a group means a missed or resisted Taunt, or the replacement tank was not in range.
  - "Holy Wrath" deaths in groups (the second biggest killer in the sample) mean players stacked near Zeliek's tank.
  - "Consumption" deaths mean players stood in Void Zones. Deaths with a "Spirit of X" source mean players were near a dead Horseman's Spirit.
- **What good looks like**: Sample kills took 252-408s (median 296s). A typical guild takes 6-10 minutes. Deaths are few (the sample averaged under 4 per kill) and players rarely go above 3-4 stacks.
- **Analysis notes**: The Mark damage name is "Mark" for all four, so check the source (Sir Zeliek, Lady Blaumeux and so on) or the debuff to see which corner. Spirits continue Marks after a Horseman dies, so late "Mark <Spirit of Blaumeux>" deaths are positioning mistakes, not rotation mistakes.

## Patchwerk
- **Fight in one line**: Tank-and-spank with about 3.85M HP (wiki; Wowhead says "nearly 4 million"). The key mechanic is "Hateful Strike" on off-tank soakers. Berserk at 7:00, followed by Slimebolt. Enrage at 5%. Needs 3 high-HP soakers and heavy healing on them.
- **Mechanics**:
  - "Hateful Strike" (28308): about every 1.2s. Per the wiki and Wowhead it hits the highest-HP player among threat ranks 2-4 who is in melee range (not the MT). It deals 22-30k before armor; in the sample it did 6.1k median and 9.2k max on warrior soakers. It cannot crit or crush.
  - Normal melee on the MT: about 2-3k.
  - "Enrage" at 5%: attack speed and damage up. The MT may use Shield Wall.
  - "Berserk" at 7:00 plus "Slime Bolt" (32309; Wowhead calls it Slimebolt) after it: raid-wide Nature damage that wipes the raid.
- **Jobs**: The MT holds top threat. 3 OTs (with Flask of the Titans and high armor) stay at threat ranks 2-4 and have the most HP among melee. Each soaker has dedicated healers. Melee stay below the soakers on threat and below their HP; if needed they step into the slime to lower HP. Ranged are free, as long as they stay below the MT.
- **Common wipe causes / log signatures**:
  - A "Hateful Strike" killing blow on a soaker means healing gaps or a soaker without enough armor or HP. Check the soaker's health before the hit.
  - "Hateful Strike" on a DPS warrior or rogue means that player was in ranks 2-4 with more HP than the soakers (too much threat, or healed back to full). If the MT never takes Hateful Strike but a DPS does, the soakers lost threat.
  - Wipe right after 7:00 with "Slime Bolt" means a DPS check failure. Compare raid DPS to roughly 3.85M / 420s, about 9.2k raid DPS minimum.
- **What good looks like**: Sample kills took 109-177s (median 130s) with zero deaths across 40 kills. A typical guild takes 3-5 minutes.
- **Analysis notes**: 2-3 distinct Hateful Strike targets per fight is normal in the sample. Some Classic players report that the MT can be struck when they have the highest HP among the top 4; the guides say ranks 2-4. Treat Hateful Strikes on the MT as noteworthy but not proof of a bug.

## Grobbulus
- **Fight in one line**: The tank slowly kites Grobbulus around the room's outer edge while clouds pile up. "Mutating Injection" players drop clouds away from the raid. Slimes spawn from Slime Spray. Enrage at 12:00. Nature resistance consumables help.
- **Mechanics**:
  - "Mutating Injection" (28169): disease on a random player that explodes after 10s ("Mutagen Explosion" 28206, log) and leaves a poison cloud. Dispelling it triggers it early. The target runs to the edge or the cloud line, then gets cleansed (the sample dispelled 139 of 150). Injections come more often below 30%.
  - "Poison Cloud" (28240): the cloud grows over time. Its damage is logged as "Poison" (28241) from source "Grobbulus Cloud" (log).
  - "Slime Spray" (28157): frontal Nature damage. Every player hit spawns a Fallout Slime, which has a "Disease Cloud" aura (28153, log). Melee kill slimes away from casters.
  - "Slime Stream" (28137): AoE that triggers when the top-threat target is out of melee range. It signals that the tank moved too fast or around a corner.
- **Jobs**: The MT kites slowly and keeps Grobbulus facing away from the raid. Injected players run to the designated drop spot before they are cleansed. Disease dispellers wait until the player is in position. Melee kill Fallout Slimes.
- **Common wipe causes / log signatures**:
  - "Poison" deaths from "Grobbulus Cloud" (the top sample killer) mean players stood in clouds, usually because clouds were dropped in the raid when an injection was cleansed too early or the player did not move.
  - "Slime Spray" deaths and many Fallout Slimes mean Grobbulus turned toward the raid.
  - "Slime Stream" applications mean the tank lost melee range.
- **What good looks like**: Sample kills took 64-112s (median 86s). A typical guild takes 3-6 minutes. 0-1 deaths.
- **Analysis notes**: An injection being dispelled is expected in Classic Era strategy, so do not flag dispels as errors. Instead check where the player stood when the dispel landed.

## Gluth
- **Fight in one line**: Gluth is tanked near the far door, Zombie Chow are kited or killed, and "Decimate" comes about every 105s and drops everyone to 5% HP. Gluth enrages after the 3rd Decimate (about 5:15). Hunters must keep Tranquilizing Shot on his Frenzy, and fear protection helps.
- **Mechanics**:
  - "Mortal Wound" (25646): stacking -10% healing taken on the tank. Tanks swap or the OT builds threat. Sources disagree on whether Gluth can be taunted.
  - "Frenzy" (28371): about every 10s. Remove it with Tranquilizing Shot. In logs the dispels show as removing "Enrage" (log).
  - "Terrifying Roar" (29685): AoE fear about every 20s for 5s. Fear Ward, Tremor Totem, and melee line-of-sighting it in the door frame.
  - "Decimate" (28374): about every 105s. Sets players and Zombie Chow to 5% HP and pulls zombies to Gluth. AoE the zombies before he eats them ("Zombie Chow Search", which heals him 5% per zombie).
  - Zombie Chow "Infected Wound" (29306): +100 physical damage taken per stack for 1 min, which is dangerous on healers who pick up a zombie.
  - The approach tunnel's "Gas" (28369, source "Toxic Tunnel") can kill players before or at the start of the fight.
- **Jobs**: The MT (and OT if swapping) cover the tank. Hunters rotate Tranquilizing Shot. A kite team (mage or warrior) handles zombies, slowing them with Frost Nova and Frost Trap. Dwarf priests Fear Ward the tanks and shamans drop Tremor Totem. After Decimate, AoE the zombies and quickly heal everyone up from 5%.
- **Common wipe causes / log signatures**:
  - MT death with Frenzy up (no Enrage removal events nearby) means hunters missed Tranquilizing Shot. MT death with high Mortal Wound stacks means no tank rotation.
  - Deaths right after "Decimate" mean anyone hit by anything at 5% dies, so post-Decimate healing or AoE was slow.
  - Gluth's HP going back up (zombies eaten) means zombies reached him, which leads to a long fight and the enrage.
  - Deaths shortly after about 5:15 mean a DPS check failure after the 3rd Decimate.
- **What good looks like**: Sample kills took 52-80s (median 65s), before the first Decimate, with almost no deaths (the only sample deaths were tunnel "Gas" and a couple of melee). A typical guild takes 2-4 minutes with 1-2 Decimates.
- **Analysis notes**: "Gas <Toxic Tunnel>" deaths inside a Gluth segment are tunnel deaths, not boss mechanics. If Tranquilizing Shot counts are low but the fight is short, Frenzy may barely have mattered.

## Thaddius
- **Fight in one line**: Phase 1: Stalagg and Feugen (about 500k HP each) on their platforms must die within about 5s of each other. Phase 2: Thaddius (about 6.66M HP per the wiki) with "Polarity Shift" every 30s and Berserk 5:00 after he activates. Nature resistance potions help.
- **Mechanics (phase 1)**:
  - If one wight dies and the other lives for more than about 5s, the dead one revives at full HP. Its DPS must be balanced with the other platform.
  - "Magnetic Pull" (28338): about every 20s the tanks are swapped between platforms and threat is wiped. Backup tanks taunt.
  - "War Stomp" (28125): about 700-1,500 damage plus a knockback, which can knock players off the platform edge.
  - Stalagg "Power Surge" (28134): +200% attack speed for 10s on his tank.
  - Feugen "Static Field" (28135): AoE mana drain that deals damage equal to the mana drained. Usually melee go on Feugen and casters on Stalagg; healers outrange it.
  - Tesla Coil "Shock" (28099, source "Tesla Coil", log): if a wight is pulled away from its coil, the coil hits the raid with heavy Nature damage.
- **Mechanics (phase 2)**:
  - Players have about 15s to jump to Thaddius's platform. "Falling" deaths can happen here.
  - "Polarity Shift" (28089): 3s cast about every 30s. Each player gets "Positive Charge" or "Negative Charge" for 60s. Opposite charges near each other deal about 2,000 Nature to each other every tick ("Positive Charge" 28062 and "Negative Charge" 28085 damage, logged with a player as the source). Classic Era guides also describe a damage bonus for standing with same-charge players. Standard positioning: negative on Thaddius's left, positive on his right. A player whose charge changed runs through the boss to the other side.
  - "Chain Lightning" (28167): hits up to 15 targets for heavy Nature damage, more on each jump.
  - "Ball Lightning" (28299): cast if nobody is in melee range.
  - Berserk at 5:00 after he activates, which is a wipe.
- **Jobs**: Phase 1: a tank and a backup taunter on each wight, melee on Feugen, casters on Stalagg, healers at max range on Feugen's side, and DPS balanced across platforms. Phase 2: MT plus a backup tank. Everyone checks their charge after each Shift. 3-4 healers on the tank and the rest raid-heal Chain Lightning.
- **Common wipe causes / log signatures**:
  - "Shock <Tesla Coil>" deaths in phase 1 (a top killer in sample wipes) mean a wight was pulled off its platform, usually after a Magnetic Pull with no taunt.
  - "Melee <Stalagg>" deaths on tanks mean "Power Surge" without cooldowns, or the tank swap lagged.
  - Wights reviving (long phase 1, both still alive at about 90s+) means unbalanced DPS.
  - Many "Positive Charge" or "Negative Charge" deaths right after a Polarity Shift mean players went to the wrong side or did not move.
  - "Chain Lightning" deaths spread over time mean raid healing could not keep up, often because the phase ran long or Nature potions were not used.
  - Melee or Chain Lightning wipe near 5:00 after activation means Berserk.
- **What good looks like**: Sample kills took 149-282s (median 212s) for the whole encounter. Phase 2 starts about 75-105s in, judging by the first Chain Lightning. A typical guild takes 5-7 minutes. Few charge deaths.
- **Analysis notes**: The WCL segment includes phase 1. Measure Thaddius's own time from his first Chain Lightning or Polarity Shift. Charge damage with a player source is the mechanic, not friendly fire. If players were dead before Thaddius activated, they lost their charge assignment and should stay dead.

## Sapphiron
- **Fight in one line**: About 3.16M HP. The ground phase alternates with air phases (first at about 45s, then 67s after each landing; no air phases below 10%). Frost resistance gear and potions are mandatory. 12+ healers. Berserk at 15:00 (Frost Aura damage x5).
- **Mechanics**:
  - "Frost Aura" (28531; the damage ID in Classic Era logs is 348191): about 600 Frost every 2s (the tooltip says per second; treat it as constant raid-wide damage) on everyone in the room, all fight long. Frost resistance and potions reduce it. It is the main raid-wide healing check.
  - "Life Drain" (28542): a curse on about 10 players every 24s. It drains about 1.75-2.25k every 3s for 12s and heals Sapphiron for twice that. Mages and druids must decurse quickly (the sample removed 2,379 of 2,643).
  - "Chill" (28547): damage from the roaming Blizzard (source "Blizzard"), about 3-4k Frost every 2s plus a 65% slow. Move out.
  - "Cleave" (19983) at the front and "Tail Sweep" (15847) at the back: melee and ranged stay at his sides.
  - Air phase: "Icebolt" (28522) is cast 5 times. Each turns a player into an ice block and deals about 2.6-3.4k to everyone within 10yd. Then "Frost Breath" (28524 and 29318) lands about 7s later and kills (75-125k) anyone with line of sight to it. The raid hides behind the ice blocks. Sample timings: first Icebolt at 41-48s, Frost Breath at 62-68s.
- **Jobs**: The MT holds Sapphiron sideways to the raid. Paladins and shamans place Frost Resistance Aura and Frost Resistance Totem where frost resistance is lowest. Mages and druids have decurse assignments by area. Healers have spread assignments by group. Everyone spreads more than 10yd before the air phase and moves behind a block after the last Icebolt.
- **Common wipe causes / log signatures**:
  - "Frost Aura" killing blows (by far the top killer, 346 in sample wipes) are a symptom: healing could not keep up. Root causes are low frost resistance, missing potions, healers dead or out of mana in a long fight, and Life Drain not decursed (the extra damage plus healing on the boss). Check fight length, Life Drain uptime and healer deaths before blaming healers.
  - "Life Drain" killing blows mean decursing was too slow.
  - "Frost Breath" deaths mean someone was not behind an ice block: a bad spread, or a block was placed where nobody could use it. Several deaths at once mean the raid failed to find cover.
  - "Icebolt" deaths mean players were stacked within 10yd during the air phase, or were already low.
  - "Chill" deaths mean players stood in the Blizzard. "Cleave" or "Tail Sweep" deaths mean players stood at the front or back.
- **What good looks like**: Sample kills took 210-281s (median 231s), meaning 2-3 air phases. A typical guild takes 5-8 minutes. Even the sample kills averaged about 8 deaths, mostly late "Frost Aura" deaths as healers ran dry, which is acceptable on a kill. Sample wipes averaged about 35 deaths.
- **Analysis notes**: Many sample wipes ended at about 65-70s, right after the first Frost Breath. That means either a bad first air phase or a deliberate reset; check whether deaths spike at the breath. Frost Aura deaths late in a kill are acceptable. Early ones point to resistance or decurse problems.

## Kel'Thuzad
- **Fight in one line**: Phase 1 is about 3:48 of adds from the room's alcoves (Kel'Thuzad is inactive). Phase 2: Kel'Thuzad (about 3.15M HP, cannot be taunted) with Frostbolt, Frostbolt Volley, Frost Blast, Chains of Kel'Thuzad, Detonate Mana and Shadow Fissure. Phase 3 starts at 40% with 5 Guardians of Icecrown. Needs interrupters, shacklers, crowd control for Mind Controlled players, and a spread raid.
- **Mechanics (phase 1)**:
  - Soldier of the Frozen Wastes: "Dark Blast" (28457) is a suicide explosion of about 2.5-3.1k Shadow on reaching the raid. Ranged kill them before they arrive.
  - Unstoppable Abomination: "Mortal Wound" (28467, -10% healing per stack). Tanked, and melee kill them.
  - Soul Weaver: "Wail of Souls" (28459), about 6.4-8.6k Shadow plus a knockback, which can knock players into the portals.
  - The Wowhead and warcraft.wiki.gg guides say phase 2 starts at 5:10. In these Classic Era logs, phase 1 lasts about 228-230s. WCL records it as a separate segment named "Kel'Thuzad" with encounterID 0 and kill null. The real encounter segment (encounterID set) covers phases 2 and 3 only.
- **Mechanics (phase 2/3)**:
  - "Frostbolt" (28478): 2s cast on the tank for 9-11k Frost. Must be interrupted. The sample raids interrupted it 847 times.
  - "Frostbolt" (28479, volley): instant raid-wide Frost damage of about 2.75-3.5k plus a 4s slow, about every 15s. Partly resistible and absorbed by Frost Protection Potions.
  - "Frost Blast" (27808 is the debuff; damage is 29879, log): about every 30s. Freezes the target and everyone within 10yd, and deals about 104% of max HP over 4-5s unless they are healed.
  - "Chains of Kel'Thuzad" (28410): Mind Controls 5 players (Wowhead says the MT is one of them), who get +200% size and damage. About every 60-120s. Polymorph, fear, Sleep or crowd control them. Threat is wiped.
  - "Detonate Mana" (27819 is the debuff; damage is "Mana Detonation" 27820, log): a mana user explodes for arcane damage to anyone within 10yd. That player moves away.
  - "Shadow Fissure" (27810): the damage is "Void Blast" (27812, source "Shadow Fissure", log), about 62-137k (a one-shot) 3s after the fissure appears. Move out.
  - Guardian of Icecrown (phase 3, 5 of them): "Blood Tap" stacks increase their damage each time they change target or kill someone. Shackle Undead works on up to 3 at a time; more than 3 makes Kel'Thuzad break all shackles. OTs hold the 2 free Guardians. The Guardians leave when Kel'Thuzad dies.
- **Jobs**: Phase 1: ranged on Soldiers and Soul Weavers, melee and tanks on Abominations, everyone stacked in the centre. Phase 2/3: the MT holds Kel'Thuzad in the centre and melee spread around him on a kick or pummel rotation. Ranged and healers spread in a ring. Healers watch for Frost Blast blocks. Mages and warlocks crowd control Chains targets. Three priests shackle and re-shackle Guardians; 2 tanks hold the rest. Shield Wall during Chains.
- **Common wipe causes / log signatures**:
  - "Frostbolt" (28478) killing the tank means a missed interrupt. Check the interrupt timeline. "Frostbolt" (28479) deaths are volley deaths on low-HP players, which point to raid healing or bandage gaps.
  - "Frost Blast" deaths, especially several at once, mean players stood within 10yd of each other or the block was not healed in time.
  - "Melee <Guardian of Icecrown>" or "Melee <Kel'Thuzad,Guardian of Icecrown>" deaths on non-tanks (a huge share of sample wipe deaths) mean a shackle broke or was not refreshed, a shackler died or was Chained, more than 3 shackles broke them all, or a free Guardian tank died. Find the first Guardian to go loose and why.
  - Player-sourced damage killing players right after Chains means Mind Controlled players were not crowd controlled. Look for killing blows with a player as the source (e.g. "Frostbolt <Kel'Thuzad,Amima>").
  - "Void Blast" deaths mean players did not move off a fissure. Usually these are individual errors.
  - "Dark Blast" or "Wail of Souls" deaths in phase 1 mean ranged let Soldiers or Weavers reach the raid. Two Soldiers reaching the raid can be a wipe.
- **What good looks like**: Sample phase 2+3 segments on kills took 141-274s (median 178s), after a phase 1 of about 3:48. A typical guild takes 4-7 minutes after phase 1. Most deaths come late in phase 3.
- **Analysis notes**: The phase 1 segment of about 228s (encounterID 0) comes right before each attempt. Do not count it as a wipe or analyse it for phase 2 mechanics, but phase 1 deaths there do reduce the raid for the real attempt. Encounter segments that are not kills and where Kel'Thuzad stays at 100% are wipes at the phase 2 transition (6 of the 39 sample wipes). The other 33 were real phase 2/3 wipes averaging about 36 deaths. Use spell IDs to separate the two Frostbolts. Chains targets show up in damage-done tables hitting their own raid.

## Trash that commonly kills raids
- **Arachnid Quarter**: Venom Stalker and Necro Stalker "Poison Charge" (28431) charges a random player and deals poison damage to everyone within 10yd. Spread out, kill them fast, and cleanse poisons or use Poison Cleansing Totem. The sample's most frequent spider-wing killer was "Poison Charge" (often logged in segments WCL names after a nearby boss). Carrion Spinners (web pull and poison), Dread Creepers (healing reduction), Crypt Reavers (Cleave and enrage), and Infectious Skitterers ("Instant Poison", large packs) are the other threats. Tomb Horrors throw spike volleys and summon scarabs. Naxxramas Acolyte and Cultist packs before Faerlina cast "Shadow Bolt Volley" and "Arcane Explosion".
- **Plague Quarter**: Stoneskin Gargoyles and Plagued Gargoyles use "Acid Volley" (29325, a Nature DoT) and a 6s-cast "Stoneskin" (28995) that heals them heavily, so interrupt or stun it. Plague Slimes, Infectious and Plagued Ghouls, and Necropolis Acolytes (Shadow Bolt Volley, Arcane Explosion) are also here. The bat tunnel before Heigan contains Mutated Grubs ("Slime Burst" slow), Plagued Bats ("Putrid Bite", a disease), Frenzied Bats ("Frenzied Dive" stun charge) and Plague Beasts (Nature aura plus a trample). Kill or skip these quickly; most have about a 30s respawn.
- **Military Quarter (the biggest killer in the sample)**: Death Knight Captain "Whirlwind" (28334/28335): big melee AoE that also knocks down. Disarm reduces it; melee back off while it whirls. Death Knight Cavalier "Aura of Agony" (28413, a Shadow curse DoT on the raid, decursable) and "Cleave", riding a Deathcharger Steed with "Trample" (5568, frontal or AoE melee) and an intercept stun. Unholy Axe, Unholy Staff and Unholy Swords (animated weapons) do "Whirlwind" and "Arcane Explosion"; in the sample they caused the most trash deaths. Necro Knights (Arcane Explosion, Flamestrike, Frost Nova and Blink) and Death Knight Vindicator / Necro Knight Guardian packs (Aura of Agony, Cleave) round out the dangerous pulls. Typical root causes: melee staying in Whirlwind, curses not removed, packs pulled together.
- **Construct Quarter**: Living Poison oozes in the entrance corridor "Explode" (instant kill) on contact; walk around them. Patchwork Golem "War Stomp" (27758: about 1k AoE plus a 5s stun), "Cleave", "Disease Cloud" aura and "Execute". Bile Retcher "Bile Retcher Slam". Sludge Belcher "Disease Buffet" (27891: 324-376 Nature plus +80 Nature damage taken) and a disease cloud. Embalming Slime "Embalming Cloud". Living Monstrosity "Chain Lightning", "Lightning Totem" (damage logged as "Shock" from "Lightning Totem") and "Fear"; kill it or the totem first. Mad Scientists and Surgical Assistants (Mind Flay, mana burn and heals) come with it. Stitched Spewers "Slime Bolt" and knock players off ledges ("Falling" deaths). Gluth's tunnel "Gas" (Toxic Tunnel) ticks Nature damage on the way down.
- **Analysis notes**: WCL sometimes names trash segments after a nearby boss (the sample has a "Grobbulus" trash segment full of Venom Stalker Poison Charge deaths), so check the source NPC names, not the segment name. Trash deaths do not affect boss analysis but explain empty raid slots at the next pull.

## Sources
- https://warcraft.wiki.gg/wiki/Anub%27Rekhan_(Classic)
- https://warcraft.wiki.gg/wiki/Grand_Widow_Faerlina_(Classic)
- https://warcraft.wiki.gg/wiki/Maexxna_(Classic)
- https://warcraft.wiki.gg/wiki/Noth_the_Plaguebringer_(Classic)
- https://warcraft.wiki.gg/wiki/Heigan_the_Unclean_(Classic)
- https://warcraft.wiki.gg/wiki/Loatheb_(Classic)
- https://warcraft.wiki.gg/wiki/Instructor_Razuvious_(Classic)
- https://warcraft.wiki.gg/wiki/Gothik_the_Harvester_(Classic)
- https://warcraft.wiki.gg/wiki/Four_Horsemen_(Classic)
- https://warcraft.wiki.gg/wiki/Patchwerk_(Classic)
- https://warcraft.wiki.gg/wiki/Grobbulus_(Classic)
- https://warcraft.wiki.gg/wiki/Gluth_(Classic)
- https://warcraft.wiki.gg/wiki/Thaddius_(Classic)
- https://warcraft.wiki.gg/wiki/Sapphiron_(Classic)
- https://warcraft.wiki.gg/wiki/Kel%27Thuzad_(Classic)
- https://warcraft.wiki.gg/wiki/Necro_Stalker
- https://warcraft.wiki.gg/wiki/Death_Knight_Captain
- https://warcraft.wiki.gg/wiki/Living_Monstrosity
- https://www.wowhead.com/classic/guide/anubrekhan-naxxramas-raid-strategy
- https://www.wowhead.com/classic/guide/grand-widow-faerlina-naxxramas-raid-strategy
- https://www.wowhead.com/classic/guide/maexxna-naxxramas-raid-strategy
- https://www.wowhead.com/classic/guide/noth-the-plaguebringer-naxxramas-raid-strategy
- https://www.wowhead.com/classic/guide/heigan-the-unclean-naxxramas-raid-strategy
- https://www.wowhead.com/classic/guide/loatheb-naxxramas-raid-strategy
- https://www.wowhead.com/classic/guide/instructor-razuvious-naxxramas-raid-strategy
- https://www.wowhead.com/classic/guide/gothik-the-harvester-naxxramas-raid-strategy
- https://www.wowhead.com/classic/guide/four-horsemen-naxxramas-raid-strategy
- https://www.wowhead.com/classic/guide/patchwerk-naxxramas-raid-strategy
- https://www.wowhead.com/classic/guide/grobbulus-naxxramas-raid-strategy
- https://www.wowhead.com/classic/guide/gluth-naxxramas-raid-strategy
- https://www.wowhead.com/classic/guide/thaddius-naxxramas-raid-strategy
- https://www.wowhead.com/classic/guide/sapphiron-naxxramas-raid-strategy
- https://www.wowhead.com/classic/guide/kelthuzad-naxxramas-raid-strategy
- Wowhead Classic spell tooltips (https://nether.wowhead.com/classic/tooltip/spell/<id>) for the spell IDs cited above
- Wowhead Classic NPC ability lists for trash (https://www.wowhead.com/classic/npc=16145, 16163, 16067, 16021, 16029, 16017, 16168, 16446)
- https://www.hydraguild.com/raid-runbooks/naxxramas (trash handling only; its boss HP figures looked non-Classic and were not used)
- Local Warcraft Logs data: 47 Classic Era Naxxramas reports in `/Users/cedrik/moist/data/wcl/` (ability names, spell IDs, kill times, death patterns)
