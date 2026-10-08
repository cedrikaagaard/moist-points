# Molten Core and Onyxia's Lair: boss reference for log analysis (Classic Era, 1.12 mechanics)

Intro: per-boss mechanics, exact combat-log ability names, roles, wipe signatures and log-reading traps. Classic Era / Anniversary realms run the 1.12 versions. Season of Mastery and Season of Discovery changes (e.g. 3 Living Bombs, Sons of Flame at 50%, Magmakin on Garr, Core Hound adds on Magmadar, Image of Shazzrah) do NOT apply; ignore guides that mention them. Spell IDs are given where they were verified in actual Warcraft Logs data. "Observed in local logs" refers to 48 Molten Core and 24 Onyxia reports cached in this repo (data/wcl), from a guild that clears quickly with world buffs; treat those numbers as a fast-guild baseline, not a typical one.

General traps that apply to every boss here:
- WCL death recaps list the killing blow, but the root cause is usually 2-10 seconds earlier (a missed dispel, a stun, a fear, a knockback). Always read the few seconds before the death.
- Some environmental/trigger damage has broken source attribution in this dataset: Ragnaros "Lava Burst" can appear sourced from a player name, and Onyxia "Eruption" can appear sourced from unrelated NPC names (e.g. "Kill Credit", "Rotting Shambler"). These are not friendly fire or extra mobs; treat them as the boss mechanic.
- MC trash (Firewalker, Flameguard, Lava Elemental, Ancient Core Hound, Core Hound) can appear inside a boss fight window if a pack was pulled or a patrol walked in. Deaths to those are pull/clear mistakes, not boss mechanics.
- "Dazed" debuffs from bosses only mean someone was hit from behind; harmless noise.

## Lucifron
- **Fight in one line**: Single phase, Lucifron plus 2 Flamewaker Protectors that mind control; no enrage timer; needs decursers (mage/druid) and magic dispellers (priest/paladin). Adds respawn if the raid wipes.
- **Mechanics**:
  - "Impending Doom" (19702): AoE magic debuff on nearby enemies, deals 2000 Shadow damage when it expires after 10 sec. Dispel (Dispel Magic / Cleanse) before it ticks. Observed ~55 applications per kill.
  - "Lucifron's Curse": AoE curse, doubles mana/rage/energy cost of spells and abilities for 5 min, recast roughly every 15-20 sec. Remove Curse (mage) or druid decurse (shows in WCL as "Remove Corruption"). Range about 40 yd, so ranged can stand out of it.
  - "Shadow Shock" (19460): instant Shadow damage to one target.
  - Flamewaker Protector "Dominate Mind": mind controls a humanoid for 15 sec. MC'd players attack the raid and use their own abilities. Dispel Magic (priest) breaks it; stuns/Intimidating Shout/Polymorph on the MC'd player as backup.
  - Flamewaker Protector "Cleave": weapon damage +85 on up to 3 targets in front.
- **Jobs by class/role**:
  - Tanks: 1 on Lucifron, 1 per Protector (or one tank holds both). Pull Lucifron away from the raid.
  - Priests/Paladins: dispel Impending Doom on everyone, priests dispel Dominate Mind. Paladins cannot dispel MC (enemy-controlled player is hostile), only priests' Dispel Magic works on it.
  - Mages/Druids: decurse Lucifron's Curse, priority tanks and healers.
  - DPS: kill Protectors first, then Lucifron.
- **Common wipe causes and what they look like in logs**:
  - Many "Impending Doom" damage events (2000 each) at the same timestamp = dispellers not keeping up, raid stacked within his 40 yd range.
  - Healers going OOM fast plus many Lucifron's Curse applications not removed = decursing failure; deaths later are mana-starvation symptoms.
  - Players dying to other players' abilities (friendly damage, e.g. a warrior's Mortal Strike on a healer) while a "Dominate Mind" debuff exists = MC not dispelled/CC'd.
  - Deaths to Core Hound "Serrated Bite" inside the window = a trash pack pulled with the boss.
- **What good looks like**: 30-60 sec kill. Observed in local logs: median 36 sec (24-72), median 1 death per kill, ~3 Dominate Mind per kill, all dispelled (Dispel Magic on Dominate Mind ~2 per kill).
- **Analysis notes**: Impending Doom applications are huge in count (one per player per cast); the meaningful metric is how many reached their 2000 damage tick. Dispel counts per player (Cleanse/Dispel Magic on Impending Doom, Remove Curse on Lucifron's Curse) are a good "did people do their job" signal. A rage cost doubling (curse) explains low warrior DPS here.

## Magmadar
- **Fight in one line**: Single target core hound boss, AoE fear every ~30 sec, Frenzy that hunters must remove with Tranquilizing Shot (tome from Lucifron); no hard enrage. Fear protection for the main tank is the key requirement.
- **Mechanics**:
  - "Panic": AoE fear, about 30 yd, 8 sec, roughly every 30 sec. Magic, can be dispelled (Dispel Magic / Cleanse). Fear Ward (Dwarf priest, Alliance) or Tremor Totem (Horde) on/near the tank. Warriors can use Berserker Rage.
  - "Frenzy": +150% attack speed, roughly every 15-20 sec in practice. Removed by "Tranquilizing Shot". In WCL the removal shows in the Dispels table as "Enrage" dispelled by Tranquilizing Shot (observed ~2 per kill).
  - "Lava Bomb": thrown at a random player, leaves a fire patch; the ground fire is logged as "Conflagration" (19428) with source "Environment". Move out.
  - "Lava Breath": frontal cone, 1157-1343 Fire. Face him away from the raid.
  - "Magma Spit": fire hit plus stacking DoT on melee/tank.
- **Jobs by class/role**:
  - MT: Fear Ward from a priest, or Berserker Rage timed with Panic. Off-tank ready if MT gets feared.
  - Hunters: Tranq rotation (2-3 hunters, a fixed order, call misses).
  - Priests/Paladins: dispel Panic off healers and tank-healers first.
  - Healers/ranged: stand outside 30 yd fear range but within 40 yd heal range of the tank.
  - Melee: sides/behind, out of Conflagration patches.
- **Common wipe causes and what they look like in logs**:
  - MT dies to rapid "Melee" hits with no Tranquilizing Shot (no "Enrage" dispel) in the preceding seconds = missed tranq.
  - MT feared ("Panic" on tank, no Fear Ward) then Magmadar walks into healers and Lava Breath hits many = fear protection failure; the healer deaths are symptoms.
  - Several melee deaths with "Conflagration" ticks = standing in fire.
- **What good looks like**: 40-80 sec kill, 0-1 deaths. Observed in local logs: median 48 sec (32-85), median 1 death per kill, killing blows almost only Magmadar "Melee" on tanks.
- **Analysis notes**: Panic counts are high (whole raid in range); judge by whether the tank got feared and whether healers did. Tranq misses are not always visible; a Frenzy that stays up long before an "Enrage" dispel shows a slow tranq.

## Gehennas
- **Fight in one line**: Gehennas plus 2 Flamewakers; no enrage; needs dedicated decursers because his curse cuts healing by 75%. Guards are killed first.
- **Mechanics**:
  - "Gehennas' Curse" (19716): AoE curse, -75% healing received for 5 min. Remove Curse (mage) / druid decurse. Tank first.
  - "Rain of Fire" (19717): ground AoE, about 368 Fire every 2 sec for 6 sec (logs often show larger ticks for low-FR players). Logged both as debuff and damage. Move out immediately.
  - "Shadow Bolt" (19729): 2250-2750 Shadow on a random non-tank.
  - Flamewaker "Fist of Ragnaros": AoE 4 sec stun around the add.
  - Flamewaker "Sunder Armor": stacking armor reduction on its tank.
  - Flamewaker "Strike" (19730): weapon damage +200.
- **Jobs by class/role**:
  - Tanks: 1 on Gehennas, 1 per Flamewaker, adds tanked apart so Fist of Ragnaros does not chain-stun melee.
  - Mages/Druids: decurse tank first, then melee and healers.
  - Everyone: move out of Rain of Fire.
- **Common wipe causes and what they look like in logs**:
  - Clustered deaths with "Rain of Fire" as killing blow = people standing in it (most common killer; observed 13 of 16 known killing blows).
  - Tank dies with Gehennas' Curse active and heals landing at a quarter of normal size = decurse failure on the tank.
  - Melee deaths while "Fist of Ragnaros" stun active = adds tanked in melee DPS area.
- **What good looks like**: 25-60 sec kill. Observed in local logs: median 31 sec (19-63), median 3.5 deaths per kill (mostly Rain of Fire), which is a soft spot even for a fast guild.
- **Analysis notes**: Rain of Fire deaths are avoidable-damage failures, not healing failures. Check whether the dead player had Gehennas' Curse at death; if yes, part of the fault lies with decursers.

## Garr
- **Fight in one line**: Garr plus 8 Firesworn; no enrage timer; Firesworn explode on death, Garr gets stronger as Firesworn die. Classic warlock-banish strategy, but geared Era raids often tank all adds and AoE.
- **Mechanics**:
  - "Antimagic Pulse" (19492): dispels one beneficial effect from each nearby enemy, frequent. Logged as a dispel by Garr (huge counts, harmless noise except losing buffs like Fear Ward/PW:S).
  - "Magma Shackles" (19496): -60% movement speed for 15 sec, nearby enemies. Magic, dispellable.
  - Firesworn "Immolate" (15732 / 20294): ~337 + DoT over 21 sec. Dispellable magic.
  - Firesworn "Eruption" (19497): on death, AoE fire damage and knockback to everyone nearby. Melee should step away from a Firesworn about to die.
  - Firesworn "Separation Anxiety": Firesworn enrage if moved too far from Garr (hits tanks for thousands).
  - Garr enrage stacks: each Firesworn death empowers Garr (increased attack speed/damage). Exact values uncertain.
- **Jobs by class/role**:
  - Tanks: MT on Garr, off-tanks on Firesworn, or 1-2 tanks holding several adds each.
  - Warlocks: Banish one Firesworn each (classic strategy), rebanish on break.
  - Priests/Paladins: dispel Magma Shackles and Immolate on tanks.
  - Melee: leave a low-HP Firesworn before it dies.
- **Common wipe causes and what they look like in logs**:
  - Off-tank deaths to Firesworn "Melee" (most common in local logs, 24 of 27 killing blows) = add tank overwhelmed, adds unbanished or too many per tank; then loose adds kill healers.
  - Multiple melee deaths at the moment a Firesworn dies = Eruption.
  - Tank death right after Antimagic Pulse removed a shield/Fear Ward is incidental; look at add count on that tank.
- **What good looks like**: 30-90 sec kill. Observed in local logs: median 49 sec (26-88), median 1.5 deaths per kill.
- **Analysis notes**: "Antimagic Pulse" dispel counts are Garr removing player buffs, not player dispels. Firesworn are separate enemies; boss damage done to Firesworn counts as useful damage. Ancient Core Hound abilities (Withering Heat, Cauterizing Flames, Ancient Dread/Hysteria) in this window mean nearby trash got pulled.

## Baron Geddon
- **Fight in one line**: Single target; Inferno (melee out), Ignite Mana (dispel), Living Bomb (run out); explodes at low HP; no enrage timer. Some fire resistance helps.
- **Mechanics**:
  - "Inferno" (19695 cast, damage logged as 19698): Geddon roots himself and pulses increasing Fire damage to everything near him for ~8 sec. All melee including the tank must run out. Top killer in local logs (77 of 111 killing blows).
  - "Ignite Mana" (19659): magic debuff on nearby enemies, burns mana every 3 sec and deals damage equal to mana burned, lasts long (minutes). Dispel on mana users. Second killer in local logs (23 killing blows).
  - "Living Bomb" (20475): one random player, explodes after 8 sec for 3200 Fire to the target and nearby allies, with a knockup. Target runs away from the raid. Ice Block / Divine Shield remove it. Fall damage ("Falling") after the knockup can kill.
  - "Armageddon" (20478): at very low HP Geddon self-destructs, 8000 Fire to players in range. Not seen in local logs (fast guilds kill through it).
- **Jobs by class/role**:
  - MT: tanks him in open space, steps out during Inferno.
  - Priests/Paladins: dispel Ignite Mana on mana users, prioritise healers.
  - Bomb target: run to a predefined spot (low ceiling side to avoid fall damage), healers top them up before explosion.
  - Melee: leave on Inferno cast.
- **Common wipe causes and what they look like in logs**:
  - Several melee dying to "Inferno" ticks = not leaving; avoidable deaths.
  - Casters dying to "Ignite Mana" damage or healers OOM = dispel failure.
  - 2+ deaths at one timestamp with "Living Bomb" damage = bomb target did not run out.
  - "Falling" deaths shortly after a Living Bomb = knockup fall damage (positioning issue).
- **What good looks like**: 30-90 sec kill. Observed in local logs: median 47 sec (26-169), median 2 deaths per kill, almost all Inferno.
- **Analysis notes**: Living Bomb debuff ~2 per kill. A bomb death is usually only the bomb carrier; extra deaths from it are the failure. Inferno deaths on warriors/rogues are avoidable damage; on the tank they can mean tank stayed for threat.

## Shazzrah
- **Fight in one line**: Caster boss; Arcane Explosion PBAoE, Shazzrah's Curse, Counterspell, Blink that wipes threat; no enrage; short burn fight.
- **Mechanics**:
  - "Arcane Explosion" (19712): 925-1075 Arcane damage within ~20 yd, spammed. The killer in this fight (15 of 15 killing blows locally).
  - "Shazzrah's Curse": +100% magic damage taken for 5 min (range ~35 yd). Decurse immediately or Arcane Explosion hits for ~2000.
  - "Counterspell": AoE silence/lockout of casters for 10 sec. Logged as an interrupt by Shazzrah.
  - "Magic Grounding": self-buff, -50% magic damage taken, 30 sec. Purge (shaman) / Dispel Magic (priest) removes it.
  - "Blink" (also seen named "Gate of Shazzrah" in some guides): teleports to a random player about every 45 sec, threat wiped. Tanks must re-acquire immediately.
- **Jobs by class/role**:
  - Tanks: MT plus off-tanks positioned so someone is near any Blink spot.
  - Mages/Druids: decurse, melee and tanks first.
  - Priests: Dispel Magic on Magic Grounding.
  - Melee: burst; many groups simply nuke him in under 30 sec.
- **Common wipe causes and what they look like in logs**:
  - Melee dying to "Arcane Explosion" while carrying Shazzrah's Curse = decurse too slow (curse doubles each hit).
  - Healers/casters dying after a Blink lands next to them = no tank picked him up.
  - Casters with no casts for 10 sec after a "Counterspell" interrupt = expected, not slacking.
- **What good looks like**: 15-45 sec kill. Observed in local logs: median 22 sec (14-54), median 2 deaths per kill.
- **Analysis notes**: Short fight, so a couple of deaths swing DPS a lot. Arcane Explosion deaths on low-HP cloth DPS in melee range are positioning errors.

## Sulfuron Harbinger
- **Fight in one line**: Sulfuron plus 4 Flamewaker Priests who heal each other with Dark Mending; interrupts are the key job; no enrage.
- **Mechanics**:
  - Sulfuron "Demoralizing Shout": -300 attack power, 30 sec.
  - Sulfuron "Inspire": an ally gets +25% physical damage and double attack speed for 10 sec.
  - Sulfuron "Hand of Ragnaros": 300-400 Fire AoE, knockback and 2 sec stun.
  - Sulfuron "Flame Spear" (19781): 850-1150 Fire on a target plus splash.
  - Flamewaker Priest "Dark Mending" (19775): big heal on an ally (~30k), must be interrupted (Kick, Pummel, Shield Bash, Counterspell, Earth Shock).
  - Flamewaker Priest "Shadow Word: Pain" (19776): Shadow DoT 18 sec. Dispellable.
  - Flamewaker Priest "Immolate" (20294): 760-840 + 380-420 every 3 sec for 21 sec. Dispellable.
  - Flamewaker Priest "Dark Strike" (19777): melee-range shadow strike.
- **Jobs by class/role**:
  - Tanks: 1 on Sulfuron, adds tanked separately or together and killed one by one.
  - Rogues/Warriors: interrupt rotation on Dark Mending.
  - Priests/Paladins: dispel SW:P and Immolate on tanks and their healers.
- **Common wipe causes and what they look like in logs**:
  - Priests healed back up repeatedly, fight drags, healers OOM = missed interrupts (compare "Dark Mending" spellsCompleted vs spellsInterrupted in the Interrupts table).
  - Off-tank/healer deaths to SW:P/Immolate ticks = dispel failure.
  - Melee stunned by Hand of Ragnaros when hit hard = positioned on Sulfuron while tanking adds there.
- **What good looks like**: 35-90 sec kill. Observed in local logs: median 51 sec (33-97), median 1 death per kill, ~4.5 Dark Mending interrupts per kill with very few completed.
- **Analysis notes**: Any completed Dark Mending is a mistake worth naming (who was assigned). Hand of Ragnaros debuff counts are high and normal for melee.

## Golemagg the Incinerator
- **Fight in one line**: Golemagg plus 2 Core Ragers that cannot die while he lives; tank-and-spank with heavy tank damage from stacking Magma Splash; Earthquake below 10%.
- **Mechanics**:
  - "Magma Splash" (13880): stacking armor reduction plus Fire DoT on the tank. Stacks climb all fight; tank swaps or FR on the MT help.
  - "Pyroblast": random target, ~1009 Fire + DoT 12 sec.
  - "Earthquake" (19798): below 10% HP, 1388-1612 damage to everyone in melee range, repeatedly. Melee should leave at 10%; ranged finish.
  - "Golemagg's Trust": buffs Core Ragers near Golemagg (+physical damage, +attack speed). Keep Ragers tanked away.
  - Core Rager "Mangle" (19820): bleed/slow on its tank. Ragers heal back at low HP and do not die until Golemagg dies (they despawn/die with him).
- **Jobs by class/role**:
  - Tanks: MT (plus optional second tank to swap when Magma Splash stacks get high), 1 off-tank per Core Rager tanked far from Golemagg.
  - Healers: heavy on MT; dedicated healers on Rager tanks.
  - Melee: back out at 10%.
  - DPS: do not DPS Ragers (wasted).
- **Common wipe causes and what they look like in logs**:
  - Rager off-tank dies to Core Rager "Melee" (most common locally) = Rager tanked inside Golemagg's Trust range or under-healed.
  - Several melee deaths to "Earthquake" at the end = melee not leaving at 10%; avoidable.
  - MT death with high Magma Splash stack = no tank swap / healer lapse.
- **What good looks like**: 40-100 sec kill. Observed in local logs: median 57 sec (35-106), median 2.5 deaths per kill, one wipe in 48.
- **Analysis notes**: DPS on Core Ragers is wasted damage; check damage-done targets. Deaths to Firewalker ("Fire Blossom", "Incite Flames"), Flameguard ("Cone of Fire", "Melt Armor") or Lava Elemental ("Pyroclast Barrage") during this fight are trash pulled into the encounter, not Golemagg mechanics.

## Majordomo Executus
- **Fight in one line**: Majordomo plus 4 Flamewaker Elites and 4 Flamewaker Healers; you win by killing all 8 adds (Majordomo submits, cannot be killed); shields reflect magic or melee; Teleport into the coals. No hard enrage. First kill is required before Ragnaros can be summoned.
- **Mechanics**:
  - Majordomo "Magic Reflection": nearby adds reflect 50% of harmful spells for 10 sec. Casters stop.
  - Majordomo "Damage Shield": adds deal 100 Arcane back to melee attackers for 10 sec. Melee stop. Logged as "Damage Shield" (21075) sourced from the add.
  - Majordomo "Teleport": moves a player (often the tank on Majordomo) into the fire pit/coals; damage logged as "Fire" (environment). Walk out fast.
  - "Aegis of Ragnaros": absorb shield on Majordomo.
  - Flamewaker Healer "Shadow Shock" (20603): instant AoE Shadow around the healer, hits hard. The top killer locally (51 of 122 killing blows).
  - Flamewaker Healer "Shadow Bolt" (21077), "Great Heal"/heals on allies (interrupt or CC).
  - Flamewaker Elite "Blast Wave" (20229): 694-806 Fire AoE + 50% slow. "Fire Blast" (20623): ~841 Fire. "Fireball" (20420).
  - CC (Polymorph, etc.) on adds stops working after several adds have died.
- **Jobs by class/role**:
  - Tanks: 1 on Majordomo, tanks on Elites; healers often polymorphed (mages) or held by tanks.
  - Mages: Polymorph Healers, stop casting during Magic Reflection.
  - Interrupters: Kick/Pummel healer heals.
  - Melee: stop attacking during Damage Shield.
- **Common wipe causes and what they look like in logs**:
  - Melee dying to Flamewaker Healer "Shadow Shock"/"Melee" = healers not CC'd/tanked, melee standing in Shadow Shock range.
  - Casters dying to their own reflected spells or melee dying to "Damage Shield" = ignoring shields.
  - Tank dies to "Fire" ticks = Teleported tank slow to leave coals (or healers lost them).
  - Elite tank deaths to "Blast Wave"/"Fireball" after sheeps break = CC broke and nobody picked up.
- **What good looks like**: 50-120 sec. Observed in local logs: median 69 sec (40-179), median 3 deaths per kill, 2 wipes in 48.
- **Analysis notes**: Boss HP percentage is meaningless here; progress = number of adds dead. "Fire" damage source is "?" (environment). Damage done to Majordomo himself is mostly wasted. Deaths to Shadow Shock are the fight's main avoidable damage.

## Ragnaros
- **Fight in one line**: Burn phase of 3 min, then submerge for up to 90 sec with 8 Sons of Flame, repeat. Fast guilds kill before the first submerge. Fire resistance needed (MT ~300+, melee ~200, others ~100 for weaker guilds; geared Era guilds go lower). Melee knockbacks and threat drops are the core challenge.
- **Mechanics**:
  - "Wrath of Ragnaros" (20566): melee-range AoE ~1000 Fire + big knockback, roughly every 25 sec. Knocks the tank away; Ragnaros then attacks the highest-threat target in melee range, so a second tank must be in melee to catch him. Melee DPS can step back before it.
  - "Elemental Fire" (20564): on his current target, 2160-2640 Fire plus 600 per sec for 8 sec. The top killer locally (106 of 170 killing blows), overwhelmingly warriors.
  - "Lava Burst" (21158): eruption/knockback on players around the room (often ranged); in local logs it is the top non-tank killer and its source can show as a random player name.
  - "Flame of Ragnaros" casting "Intense Heat" (21155): appears in local logs as a fire effect killing ranged/healers (paladin, mage, druid). Mechanism not confirmed in written sources; likely ground fire left by eruptions. Treat as avoidable positioning damage.
  - "Lava" (environment): falling or being knocked into lava.
  - "Magma Blast": 1 sec cast, ~6000 Fire on a random player when nobody is in melee range. Seeing it = melee/tank absent.
  - "Melt Weapon": durability loss on melee weapons, not lethal.
  - "Sons of Flame" (submerge at 3:00): 8 adds, burn mana and hit with fire; Ragnaros returns after 90 sec or when all die (banished Sons count as dead, so never banish all).
- **Jobs by class/role**:
  - Tanks: 2-3 warriors in melee with FR; after each Wrath, the backup tank holds until MT returns.
  - Healers: heavy tank healing, fire resistance, out of Lava Burst spots.
  - Melee: step back before Wrath, avoid stealing aggro when tank is knocked away.
  - Ranged: spread, avoid lava edges.
  - Sons phase: CC (Frost Nova, traps, banish some), focus one at a time.
- **Common wipe causes and what they look like in logs**:
  - Warrior deaths to "Elemental Fire" right after a "Wrath of Ragnaros" = Ragnaros picked up by someone unprepared after a knockback (an off-tank under-healed or a DPS warrior with threat); check whether the dead warrior was a tank or fury.
  - Deaths to "Lava"/"Falling" = knocked into lava by Wrath or Lava Burst; positioning.
  - "Magma Blast" damage = nobody in melee.
  - Sons phase wipes: many mana-user deaths around 3:00-4:30, healers OOM = not killing Sons fast enough or Ragnaros emerging early.
- **What good looks like**: kill before the first submerge (under 3 min) is the norm for geared Era raids. Observed in local logs: median 74 sec (41-141), never reached Sons phase, median 4 deaths per kill.
- **Analysis notes**: A few Elemental Fire tank deaths in a fast kill are often accepted risk; repeated ones on the same off-tank point to FR/healing issues. Deaths to Lava Burst/Intense Heat/Lava on ranged are avoidable.

## Onyxia
- **Fight in one line**: Phase 1 (100-65%) ground, Phase 2 (65-40%) airborne with Fireballs, Deep Breath and whelps, Phase 3 (40-0%) ground with Bellowing Roar fear and floor Eruptions; immune to fire and taunt; no enrage. Fear protection for the tank in P3 is critical.
- **Mechanics**:
  - "Flame Breath" (18435): frontal cone, up to ~4000 Fire. Top killer locally (36 of 94 killing blows), mostly in P3.
  - "Cleave" (19983), "Tail Sweep" (15847, knockback behind her, into whelp eggs), "Wing Buffet" (18500, front knockback, no threat loss), "Knock Away" (19633, tank knockback, -25% threat).
  - "Fireball" (18392, "Engulfing Flames"): P2, random target plus splash, ~3000. Widely reported to wipe the target's threat; P3 landing threat is unreliable.
  - "Deep Breath": P2, she flies across the room, emote "takes in a deep breath"; logged as "Breath" with directional spell IDs 17086-17097. Lethal to anyone in the path; move to the sides.
  - Onyxian Whelps: large wave at start of P2, smaller waves after; extra whelps if someone is knocked into eggs.
  - "Bellowing Roar" (18431): P3 AoE fear, roughly every 10-30 sec.
  - "Eruption" (17731): P3 floor cracks erupt for ~1500, mainly after Roar.
  - Onyxian Warders: tunnel trash with "Fire Nova"; respawn during the fight.
- **Jobs by class/role**:
  - MT: tank her facing a wall; Fear Ward (priest) / Tremor Totem (Horde) / Berserker Rage for P3.
  - DPS: throttle P1 until threat is secure; burn P2; stop near 41% until tank regains aggro at P3.
  - Whelp handlers: assigned tanks + AoE (warriors, mages) on each side.
  - Healers: stay against walls, out of Flame Breath and crack lines.
- **Common wipe causes and what they look like in logs**:
  - Clusters of "Flame Breath" deaths in P3 = fear sent people in front of her, or she turned to a DPS that pulled threat after landing.
  - "Breath" deaths in P2 = standing in Deep Breath path.
  - Many whelp "Melee" deaths = whelps unhandled.
  - "Eruption" deaths = players feared over cracks or low HP.
  - Tank dies to "Melee" plus "Cleave" in P3 = healing gap during fear.
- **What good looks like**: 3-5 min kill. Observed in local logs: median 229 sec (161-566), median 3.5 deaths per kill.
- **Analysis notes**: Most P3 deaths are caused by threat or fear; the killing blow is just Flame Breath. Track who had aggro when she landed.

## Sources
- https://warcraft.wiki.gg/wiki/Lucifron
- https://warcraft.wiki.gg/wiki/Magmadar
- https://warcraft.wiki.gg/wiki/Gehennas
- https://warcraft.wiki.gg/wiki/Garr
- https://warcraft.wiki.gg/wiki/Baron_Geddon
- https://warcraft.wiki.gg/wiki/Shazzrah
- https://warcraft.wiki.gg/wiki/Sulfuron_Harbinger
- https://warcraft.wiki.gg/wiki/Golemagg_the_Incinerator
- https://warcraft.wiki.gg/wiki/Majordomo_Executus
- https://warcraft.wiki.gg/wiki/Ragnaros_(tactics)
- https://warcraft.wiki.gg/wiki/Onyxia_(Classic)
- https://warcraft.wiki.gg/wiki/Onyxia_(tactics)
- https://www.warcrafttavern.com/guides/wow-classic-molten-core-guide/
- https://warcrafttavern.com/guides/onyxias-lair
- https://almarsguides.com/wow/instances/classic/moltencore/
- Local Warcraft Logs data: /Users/cedrik/moist/data/wcl (48 MC reports, 24 Onyxia reports) for exact ability names, spell IDs, killing-blow distributions and kill times
