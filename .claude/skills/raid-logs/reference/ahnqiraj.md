# Ahn'Qiraj reference (AQ40 + AQ20) for Classic Era log analysis

Boss-by-boss reference for reading Warcraft Logs from Classic Era / Anniversary (1.12 mechanics). Numbers are 1.12-era values from community wikis, guides and the vmangos 1.12 emulator scripts. Treat them as approximate. Where sources disagree, both values are given. Spell names are the in-game names WCL shows. A few are flagged as uncertain.

General AQ notes:
- Nature resistance (NR) matters at Huhuran (soakers), Viscidus, Ouro, Bug Trio (Kri) and C'Thun (potions). Raids use Greater Nature Protection Potion and NR gear.
- Many AQ40 encounters contain several hostile units. WCL often names the fight after the "boss" while deaths come from adds: Images of Skeram, globs, tentacles, bugs, worms.
- Mind control (Skeram True Fulfillment, Qiraji Mindslayer Cause Insanity) makes players kill other players. WCL then shows a player as the killing-blow source. Treat that as a mechanics failure, not griefing.

---

# Temple of Ahn'Qiraj (AQ40)

## The Prophet Skeram
- **Fight in one line**: Single caster boss that splits into 2 Images at 75/50/25% (3 targets each split) and blinks between three platforms (middle, left stairs, right stairs). There is no enrage. Interrupts, CC on mind-controlled players and tanks on every platform are required.
- **Mechanics**:
  - **Arcane Explosion**: about 190-220 arcane damage to nearby players. It is cast when more than 4 players are in melee range, so it punishes melee stacking. It is interruptible (kick, pummel, shield bash, counterspell, Earth Shock).
  - **Earth Shock**: about 150-175 nature damage plus interrupt. It is spammed on his current target whenever nobody is in melee range. Reported hits on non-melee targets go up to about 3k. Every Skeram and Image must have someone in melee or he Earth Shocks a healer or caster to death.
  - **True Fulfillment**: 20 second mind control. The victim gains about 300% damage, instant casts, +50 resistances and +40% speed. Sources disagree on the target. Some say the closest target including tanks (vmangos), others the closest non-tank. In logs it shows as a "True Fulfillment" buff or debuff on the player.
  - **Blink / Teleport**: about every 10-20 s Skeram blinks to one of three positions and wipes threat. Images also swap places.
  - **Summon Images** at 75/50/25%: two Images with the same abilities and the same health % but much less HP. They hit noticeably weaker. The real Skeram drops loot. Killing the real one ends the fight and despawns Images.
- **Jobs by class/role**:
  - Tanks: at least one tank at each of the 3 platforms (two per platform is safer in case of MC). The tank picks up whichever Skeram or Image lands there.
  - Interrupters: rogues, warriors, mages and shamans assigned per Skeram to interrupt Arcane Explosion. Curse of Tongues and Mind-numbing Poison work since 1.10.
  - CC on MC'd players: mages Polymorph (the standard answer). Warriors can use Intimidating Shout, and rogues can Gouge or Blind. Hunters can find the real Skeram, since pets sent in after a split attack the real one.
  - DPS: kill the real Skeram if identified (common Classic approach is to just kill the boss and ignore Images, or kill Images fast). Keep at most 4 melee on any one target.
- **Common wipe causes and what they look like in logs**:
  - Many deaths from **True Fulfillment** casts or from players' own spells: MC'd players were not CC'd. The killing blow source is a raid member, often a mage (Arcane Explosion) or a warrior.
  - Healers dying to **Earth Shock**: an unattended Skeram or Image after a blink or split. Root cause is a missing platform tank.
  - Lots of **Arcane Explosion** damage across melee: too many melee on one target or missed interrupts. Check interrupt counts.
  - Fight that drags past 4-5 min with repeated splits: low DPS on the real Skeram or DPS spread on Images.
- **What good looks like**: kill in about 1-2.5 min. Few or no Arcane Explosion casts landing (most interrupted). Zero or near zero True Fulfillment-caused kills. Earth Shock damage mostly on tanks.
- **Analysis notes**: Images share the name "The Prophet Skeram", so WCL may show several units with that name. Damage to Images is not wasted for the split order but does not progress the kill. Friendly-fire kills during MC are expected noise if rare. Several per pull points to a CC problem. Trash before Skeram (Anubisath Sentinels) is often a bigger killer than Skeram.

## Silithid Royalty (Bug Trio: Lord Kri, Princess Yauj, Vem)
- **Fight in one line**: Three bosses pulled together. When one dies, the survivors run to the corpse, **devour** it (about 4 s) and heal to full with threat reset. Kill order decides the loot table (the last bug alive). The easy order is Kri > Yauj > Vem. When Vem dies, the others gain **Vengeance** (enrage). Leaving the room resets the encounter. Some sources mention a soft enrage (about 15 min family-wide), but this is uncertain.
- **Mechanics**:
  - Lord Kri: **Toxic Volley**, a raid-wide nature hit (about 500) plus a stacking, dispellable poison DoT (about 125 per tick). Also **Cleave** and **Thrash**. On death a poison cloud spawns, shown in logs as **Toxic Vapors** (about 2000 nature damage per second). Standing in it is near-certain death.
  - Princess Yauj: **Fear** (AoE fear about every 20 s that wipes threat on feared players) and **Great Heal** (heals herself under about 93%, otherwise heals a brother). It must be interrupted. She is immune to silence effects, Curse of Tongues and Mind-numbing Poison. **Ravage** (tank hit and stun). On death she spawns about 10 **Yauj Brood** that attack the raid, are AoE-able and can be CC'd.
  - Vem: **Charge** on targets out of melee, **Knock Away** (with threat drop) and **Knockdown**. Hits cloth hard (2-3k). On death the survivors gain **Vengeance** (big damage and attack speed increase).
- **Jobs by class/role**:
  - Tanks: one team per bug. Yauj needs 2-3 rotating warriors (Berserker Rage timing, taunt right after Fear). Vem is often parked in an alcove with 2 tanks because of knockbacks.
  - Interrupters: kick, pummel, shield bash and counterspell on Yauj's **Great Heal**. Shamans drop Tremor Totem near Yauj.
  - Dispellers: paladins, druids and shamans (Poison Cleansing Totem) cleanse Toxic Volley stacks. Hunters keep Aspect of the Wild up. NR helps.
  - Positioning: drag Kri away from where the raid will fight next before he dies so Toxic Vapors are not on top of anyone. For Kri > Yauj > Vem, keep Vem closer to Kri than Yauj so Vem devours Kri, not Yauj. This prevents Yauj's devour heal and threat reset.
  - AoE (mages, warlocks, paladins with consecration) on Yauj Brood.
- **Common wipe causes and what they look like in logs**:
  - Burst of deaths to **Toxic Vapors** right after Kri dies: bad positioning when Kri died.
  - Stacked **Toxic Volley** DoT ticks killing people slowly: dispel coverage missing. Count the dispels.
  - Yauj **Great Heal** casts succeeding (heals show on boss healing taken): interrupt rotation failed. Long fight, mana runs out.
  - Tanks or healers killed by a Yauj or Vem that ran loose after **Fear** or **Knock Away**: no backup taunt.
  - Raid wipe after a premature Vem death: **Vengeance**-buffed survivor kills tanks.
  - Sudden encounter reset: a bug left the room (feared or kited out). Logs show the encounter ending with no kill and no full raid death.
- **What good looks like**: 2-4 min. Yauj's heals fully interrupted, no Toxic Vapors deaths, steady dispels.
- **Analysis notes**: WCL lists the encounter as "Silithid Royalty" (sometimes "Bug Trio"). Boss HP "resets to full" mid-fight are the devour mechanic, not a bug. Check which bug died last to explain loot choice. Do not mistake the deliberate full heal for failed DPS.

## Battleguard Sartura
- **Fight in one line**: Sartura plus 3 **Sartura's Royal Guard**. All of them use Whirlwind and random threat changes. **Enrage** at 20% HP. Hard enrage (**Berserk**) at 10 min. Stuns are the core tool.
- **Mechanics**:
  - **Whirlwind**: Sartura spins for about 15 s, hitting everyone within about 10 yd (cloth 3k+). She is stun-immune while spinning and swaps to random targets often during it. Guards also **Whirlwind** (about 1-1.2k on tanks, 2.5-3k on cloth). A stun does not stop a Guard's spin.
  - **Sundering Cleave**: frontal cleave on up to 3 targets that stacks extra physical damage taken.
  - **Knockback** (Guards): punts players. Getting punted into the tunnel toward Fankriss can pull extra trash.
  - Random aggro: boss and Guards periodically pick a random target for a few seconds, then return to the tank.
  - **Enrage** at 20%: big attack speed and damage increase. Hard enrage at 10 min: 10-15k hits, effectively a wipe.
- **Jobs by class/role**:
  - Tanks: 1-2 on Sartura, 1 per Guard, spread out with backs to walls.
  - Stunners: rogues (Kidney Shot, Gouge), warriors (Concussion Blow), paladins (Hammer of Justice) chain stuns on Sartura when she is not spinning, and on Guards.
  - Melee: back out of Whirlwind. Kill Guards first (usual approach), then Sartura.
  - Healers: spread, save mana for the 20% enrage.
- **Common wipe causes and what they look like in logs**:
  - Lots of cloth and healer deaths to **Whirlwind** (from Sartura or a Guard): bad spacing or a random-aggro chase into the raid. Check if stuns were applied.
  - Tank deaths after 20%: insufficient healing or cooldowns during **Enrage**.
  - Extra non-boss mobs in the damage taken (Qiraji trash from the tunnel): knockback pulled tunnel trash.
- **What good looks like**: 1.5-3 min. Heavy stun uptime (Kidney Shot, Hammer of Justice and Concussion Blow casts on boss and Guards), few Whirlwind deaths.
- **Analysis notes**: Whirlwind damage on melee is partly unavoidable, so judge by deaths, not total damage. "Random target" spikes on healers are a mechanic. Survival depends on stuns and positioning.

## Fankriss the Unyielding
- **Fight in one line**: Tank-and-spank boss with a stacking healing debuff plus add control. **Spawn of Fankriss** worms must die before they enrage. **Vekniss Hatchlings** come from 3 tunnels. There is no boss enrage.
- **Mechanics**:
  - **Mortal Wound**: stacking 10% healing reduction per stack on the tank, also frontal. Tanks swap at about 3-5 stacks.
  - **Spawn of Fankriss**: 1-3 elite worms spawn at intervals at random spots. They enrage (shows as an Enrage/Berserk buff, uncertain name) after about 15-25 s alive (vmangos: 15/20/25 s for a wave of 3, since patch 1.10). Enraged they hit for 10-20k and one-shot anyone. Stunnable.
  - **Entangle**: a random player is teleported into one of the 3 tunnel alcoves and rooted, and 2-4 **Vekniss Hatchlings** spawn there. Hatchlings hit cloth for about 800-900. They can be feared or snared and AoE'd.
  - Vekniss Drones and other room bugs aggro on pull in some versions.
- **Jobs by class/role**:
  - Tanks: 2 on Fankriss swapping for Mortal Wound. A berserker-stance warrior (Intercept) on worms. A tank at the tunnels or the raid ready to AoE hatchlings.
  - All DPS: switch to worms immediately and burn them. Stunners lock them if one is about to enrage.
  - Healers: the webbed player needs a heal on them. Healing the Fankriss tank is heavy at high Mortal Wound stacks.
- **Common wipe causes and what they look like in logs**:
  - Deaths to a **Spawn of Fankriss** with very large melee hits: the worm enraged. Look at time from worm spawn to worm death (over about 20 s is bad).
  - Tank death with high Mortal Wound stacks: late swap.
  - Webbed player dying to hatchlings: no assigned helper or healer.
- **What good looks like**: 1-2 min. Worms die in under about 15 s each, Mortal Wound swaps at low stacks, no worm-enrage kills.
- **Analysis notes**: Spawn deaths are the key metric. Count Spawn of Fankriss units and their lifetimes. Recovery after a wipe usually means re-clearing tunnel trash, so expect long gaps between pulls.

## Viscidus
- **Fight in one line**: Poison ooze that you cannot DPS down normally. Freeze him with frost hits (about 200), shatter him with melee hits (about 75), then kill the 20 **Globs of Viscidus** (each worth 5% HP) before they reach the center and merge back. Repeat until he dies (shatter below 5% kills him). NR and frost sources (mages, frost wands, Frost Oil) are required. No hard enrage.
- **Mechanics**:
  - **Poison Bolt Volley**: raid-wide (very long range, ignores LoS) nature hit of about 1500 resistible damage plus a dispellable DoT (about 500 per 2 s for 10 s).
  - **Poison Shock**: nature AoE of about 1200 around the boss (about 15 yd).
  - **Toxin**: drops a toxic cloud (about 1500 damage per 2 s, 40% slow) every 30-40 s. Move out.
  - Freeze stages (frost **hits**, not damage): 100 hits = slowed ("begins to slow"), 150 = freezing ("is freezing up"), 200 = frozen solid ("is frozen solid"). Each stage reverts if the next is not reached in time (about 15 s in 1.12).
  - Shatter: about 75 melee or physical hits while frozen ("begins to crack", then "looks ready to shatter"). Then **Viscidus** explodes into globs. HP drops 5% per glob killed. Surviving globs that reach him restore HP.
  - **Membrane** / damage reduction: he takes reduced damage. Normal DPS on the boss barely matters.
- **Jobs by class/role**:
  - Frost: mages spam rank 1 Frostbolt. Priests, warlocks and others use frost wands. Shamans can use Frost Shock. Frost Oil and frost-proc weapons help.
  - Melee: wait (many guilds keep melee out of the room during the freeze to reduce damage), then rush in and spam fast hits to shatter. Hunters count.
  - Glob killers: all DPS and AoE (Blizzard, Arcane Explosion, Consecration, Multi-Shot) on globs. They cannot be stunned or slowed.
  - Dispellers: cleanse Poison Bolt Volley DoTs. Shamans use Poison Cleansing Totem.
  - Tank: NR-geared, can be targeted randomly after re-forming.
- **Common wipe causes and what they look like in logs**:
  - Many deaths to **Poison Bolt Volley** or its DoT: low NR, poor dispelling or a long drawn-out fight.
  - **Toxin** cloud deaths: players not moving.
  - Fight lasting 8+ min with HP not decreasing between cycles: freeze or shatter counts not reached in time (too few frost casters, or frost wands not used), or globs reaching the boss.
- **What good looks like**: 2-5 min with few re-freezes. Each shatter followed by fast glob AoE. Few poison deaths.
- **Analysis notes**: Boss "damage taken" is misleading. Count frost hits (number of casts like Frostbolt and Shoot with frost wands on Viscidus) and melee hits in frozen windows. Glob kills are the real progress. Frost resists on the boss do not count as hits. Classic 2020 fixed a bug where frost wands did not count.

## Princess Huhuran
- **Fight in one line**: Tank-and-spank race. At **30% HP** she goes **Berserk** and spams **Poison Bolt** (log name, 26052) on the 15 closest players every few seconds (the extra 5 min trigger exists only in private-server scripts). That needs about 15 high-NR soakers (often 200-300 NR) plus a burn phase. **Frenzy** must be removed with Tranquilizing Shot.
- **Mechanics**:
  - **Frenzy** (logged as "Enrage", 26051): every 25-35 s, big melee damage increase. Hunters must remove it with **Tranquilizing Shot** within seconds or tank damage spikes, and per some sources volleys start.
  - **Acid Spit**: stacking nature DoT on the current tank (about 220-280 per 2 s per stack, unresistable). Tanks swap at around 8-12 stacks. She is taunt-immune, so swaps use threat, Limited Invulnerability Potion or Blessing of Protection on the old tank.
  - **Noxious Poison**: random target, about 2.9k nature over 8 s plus silence, spreads to nearby players. Not dispellable. Spread out.
  - **Wyvern Sting**: sleeps players near her (several targets). Dispelling it deals about 3k+ nature damage. Usually only dispel tanks or key healers.
  - **Berserk** (30%): double attack speed plus **Poison Bolt** (about 2000 nature, log name "Poison Bolt") on the 15 closest every about 3 s. Hunter and warlock pets do not count.
- **Jobs by class/role**:
  - Hunters: Tranquilizing Shot rotation (2-3 hunters in order). Pets do not count toward the 15 volley targets.
  - Tanks: 2-3 NR-geared warriors rotating on Acid Spit.
  - Soakers: 15 NR players (tanks, melee, some healers) stack close at 30%. Everyone else stays far back. Priests use Prayer of Healing on soaker groups.
  - Warlocks: Curse of Doom near 45% so it ticks in the burn. Everyone uses cooldowns at 30%.
- **Common wipe causes and what they look like in logs**:
  - Tank death with very high **Acid Spit** stacks: late swap.
  - Tank death right after a **Frenzy** that stayed up: missed Tranquilizing Shot (check Tranq casts vs Frenzy applications).
  - After 30%, soakers die one by one to **Poison Bolt Volley**, then non-NR players die: once a soaker dies, the volley hits the next closest, low-NR players, and it cascades. Root cause is low NR, low healing on soakers or too slow DPS in the last 30%.
  - Wipe at about 5:00 with boss above 30%: soft enrage reached because DPS was too low.
- **What good looks like**: 1.5-3 min. The 30%-0% burn takes under about 30-45 s. Every Frenzy is tranquilized quickly. No more than about 1-2 soaker deaths.
- **Analysis notes**: Deaths in the final seconds while the boss dies are common and minor. A cascade of deaths at 30% means NR or healing failed. Check whether the dead players were among the closest 15.

## Twin Emperors (Emperor Vek'lor and Emperor Vek'nilash)
- **Fight in one line**: Two bosses with shared health percentage, split to opposite sides of the room. They **Twin Teleport** (swap positions) every 30-40 s, which wipes threat. Vek'nilash (melee) is immune to magic, Vek'lor (caster) is immune to physical. **Heal Brother** if they are within about 60 yd. **Berserk** after 15 min. Bugs in the room get mutated or exploded.
- **Mechanics**:
  - **Heal Brother**: big heals between the twins if within about 60 yd of each other. Shows as healing on bosses. It means the twins were too close.
  - **Twin Teleport**: swap places. Both are briefly stunned (about 2 s), then each attacks the nearest player (threat wipe). That is why the correct tank must be closest when they land.
  - Vek'nilash: **Uppercut** (knockback on a random non-tank in melee), **Unbalancing Strike** (heavy hit, -100 defense for a few seconds), **Mutate Bug** (every 10-15 s turns a nearby bug into a large, hard-hitting elite).
  - Vek'lor: **Shadow Bolt** (about 3-4k on his target, resistible, hence warlock tanks with shadow resistance and Shadow Ward), **Blizzard** (about 1500 per tick, slow), **Arcane Burst** (about 4-5k arcane AoE knockback and slow on anyone in melee range), **Explode Bug** (every 7-10 s makes a nearby bug explode after about 3 s for about 3k fire in an area).
  - Bugs (Qiraji Scarab, Qiraji Scorpion): melee with **Virulent Poison** stacking DoT.
  - **Berserk** at 15 min: wipe.
- **Jobs by class/role**:
  - Warlock tanks (one per side): tank Vek'lor with Searing Pain spam. Keep about 8k+ HP, high shadow resistance, Shadow Ward before teleport. Stay out of melee range (Arcane Burst). Usually Curse of Doom is not cast early so it does not pull threat from a warrior tank at the start.
  - Warrior tanks (one per side): stand where Vek'nilash lands, back to a wall (Uppercut), heavy heals after Unbalancing Strike.
  - Bug team: mages and warriors kill mutated bugs, hunters pull bugs away. Keep bugs away from Vek'lor (Explode Bug).
  - Melee and hunters follow Vek'nilash. Casters follow Vek'lor. They move with the teleport.
  - Melee must leave Vek'lor (or stay away from where he will land) before the teleport so they do not get Arcane Burst or aggro.
- **Common wipe causes and what they look like in logs**:
  - Warlock tank dies to **Shadow Bolt**: low shadow resistance or HP, no Shadow Ward, or late healing after teleport.
  - Melee or healers die to **Arcane Burst** or **Blizzard**: standing on Vek'lor's side, or lingering after teleport.
  - Big **Heal Brother** numbers: the emperors were not kept far enough apart. Bosses gain HP, the fight gets longer.
  - Deaths to mutated bugs or **Explode Bug** fire damage: bug control failed.
  - Raid wipe right after a teleport with a random player dying: the wrong person was closest and took aggro (warrior tank late, or a DPS standing on the landing spot).
  - Berserk wipe at 15:00: not enough DPS, often from Heal Brother.
- **What good looks like**: 3-6 min. Near-zero Heal Brother. Few Arcane Burst hits on non-tanks. No warlock tank deaths. Bug deaths controlled.
- **Analysis notes**: WCL shows one encounter "Twin Emperors" with two bosses. Damage on either twin counts toward shared %, but casters do more effective damage per point due to HP difference (Vek'lor about 1M vs Vek'nilash about 1.6M HP on the wiki). A teleport about every 35 s means a warlock tank will be idle half the fight. Judge them on deaths, not DPS. Bug kills inflate damage done.

## Ouro
- **Fight in one line**: Rooted sandworm. Melee and tank in front, with surface phases broken by **Submerge**. At **20% HP** he goes **Berserk**, stops submerging and spawns mounds and scarabs. NR and multiple tanks are needed because **Sand Blast** wipes threat.
- **Mechanics**:
  - **Sweep**: about every 20 s, AoE knockback (1-2.5k physical) on everyone in melee range around him. Threat effects reported. Melee lose time running back.
  - **Sand Blast**: about every 20-25 s, 3.5-4.5k nature frontal cone (wide, about 45 yd) aimed at his top-threat target. It clears threat of players hit (binary resist). The next tank in line must pick up immediately.
  - **Submerge**: random chance about every 90 s (not while casting), or after a few seconds with no one in melee. He becomes untargetable and threat is wiped. **Dirt Mounds** chase players (**Quake** nature damage). **Ouro Scarabs** spawn and attack, despawning after about 45 s. On re-emerge, **Ground Rupture** hits anyone on top of him (about 2k).
  - **Berserk** at 20%: much faster and harder melee, no more submerges, mounds and scarabs keep spawning. If no one is in melee, he casts **Boulder** (about 6k) on raid members.
- **Jobs by class/role**:
  - Tanks: 2-3 NR warriors side by side in front so whoever survives Sand Blast holds aggro. A tank must reach him within about 10 s of emerging or he submerges again.
  - Melee: attack from the sides, expect Sweeps, return fast. Melee must also keep someone in range or he submerges.
  - Ranged and healers: spread, stay out of the frontal cone. Prefer the sides.
  - CC/AoE: fears, Frost Nova and traps on scarabs. Kite Dirt Mounds away from groups.
- **Common wipe causes and what they look like in logs**:
  - Many healers or ranged hit by **Sand Blast**: they stood in front, or the boss turned to a non-tank who had top threat.
  - Tank or healer deaths to scarabs or **Quake** after submerge: poor movement or CC.
  - Deaths to **Boulder**: no one in melee range (tanks dead or out of range).
  - Wipe soon after 20%: Berserk damage on tanks plus scarabs, low DPS for the final 20% (about 400k HP).
- **What good looks like**: 2.5-5 min. One or two submerges at most, quick re-engage, short Berserk phase. Few Sand Blast hits on non-tanks.
- **Analysis notes**: Ouro is optional and spawned by touching the base. Pulls may show long gaps. Threat drops (Sand Blast or Sweep) mean the boss target switches often. Do not blame tanks for normal Sand Blast swaps.

## C'Thun
- **Fight in one line**: Two phases. **Phase 1**: the **Eye of C'Thun** alternates a 45 s **Eye Beam** phase with a roughly 40 s rotating **Dark Glare**. Eye Tentacles and Claw Tentacles spawn. The raid must be spread (about 10 yd grid, 8 groups in a circle). **Phase 2**: **C'Thun** body with **Carapace of C'Thun** (immune). Players are swallowed into the **stomach** to kill 2 **Flesh Tentacles**, which makes C'Thun **Weakened** (vulnerable) for 45 s. Repeat until dead. No hard enrage (sources vary).
- **Mechanics (Phase 1)**:
  - **Eye Beam**: 2 s cast, about every 3 s, about 2.6-3.4k nature, chains to players within about 10 yd with increasing damage. Grouped players die in chains.
  - **Dark Glare**: every about 86 s (45 s beam + 3 s cast + about 38 s glare). A beam sweeping around the room (direction varies) that one-shots anyone it touches (about 44-56k shadow).
  - **Eye Tentacle**: 8 spawn every 45 s around the Eye. **Mind Flay** (about 750 per s, slows) on random players. Interrupt, stun or kill fast (low HP).
  - **Claw Tentacle**: spawns under random players frequently. **Ground Rupture** (about 1.4-2.7k nature, knockback; it can knock players into Dark Glare) and **Hamstring**.
- **Mechanics (Phase 2)**:
  - **Carapace of C'Thun**: damage taken reduced about 99% until weakened.
  - **Eye Tentacle** every 30 s. **Giant Claw Tentacle** every 60 s (offset 30 s from Giant Eye). **Ground Rupture**, **Ground Tremor** (stun), **Thrash**, **Hamstring**. It one-shots non-tanks. If not tanked in melee, it burrows and reappears elsewhere at full HP. **Giant Eye Tentacle** every 60 s casts **Eye Beam**. Stun or kill quickly.
  - Swallow / mouth tentacle: about every 10 s a random player is grabbed into the stomach.
  - Stomach: **Digestive Acid** stacking nature DoT (150 per 5 s per stack, stacks grow each tick). **Flesh Tentacles** (about 24k HP each, melee only). Exit by standing in the punt spot (center of the dark circle), which throws you back into the room.
  - **Weakened**: when both Flesh Tentacles die, Carapace drops for 45 s. No new tentacles spawn during it. Then a new Giant Claw comes about 10 s later.
- **Jobs by class/role**:
  - Everyone: hold spread positions. Move counter-clockwise or to an assigned quadrant on Dark Glare and re-spread.
  - Tanks: pick up Giant Claws immediately (stand on them), stay out of the group.
  - Interrupters and stunners: Eye Tentacles' Mind Flay, Giant Eye Tentacles' Eye Beam.
  - Stomach team: stomach DPS kill Flesh Tentacles, a healer stays inside, and players leave around 8-10 acid stacks.
  - Surface DPS: kill tentacles in priority (Eye > Giant Eye > Giant Claw), then nuke C'Thun during Weakened.
  - Consumables: Greater Nature Protection Potion. Opening tactics often send one player in first to soak initial beams.
- **Common wipe causes and what they look like in logs**:
  - Several deaths to **Eye Beam** in seconds: spread failed, or claw knockbacks clumped players.
  - Deaths to **Dark Glare**: players did not move with the sweep, or were knocked into it.
  - **Mind Flay** deaths: Eye Tentacles not handled.
  - Non-tank deaths to **Thrash** or melee from Giant Claw: tank was late or players stood too close.
  - **Digestive Acid** deaths: players stayed too long or could not find the exit.
  - P2 dragging (many Weakened cycles needed): low DPS during Weakened windows, or tentacles still alive soaking DPS.
- **What good looks like**: 4-8 min total. Phase 1 about 1.5-3 min. Few Eye Beam chains. Zero Dark Glare deaths. Phase 2 done in 1-3 Weakened windows.
- **Analysis notes**: WCL shows one encounter with Eye of C'Thun then C'Thun (body). Splitting by phase helps. In phase 2, boss damage is near zero except during Weakened, which is expected. Stomach deaths are often silent from the surface view. Check deaths with Digestive Acid on them. Classic 2020 hotfix fixed an Eye Beam delay at pull.

---

# Ruins of Ahn'Qiraj (AQ20)

## Kurinnaxx
- **Fight in one line**: Tank-and-spank. Stacking **Mortal Wound** and **Sand Trap** on random players. Enrage at 30%.
- **Mechanics**: **Mortal Wound** (-10% healing per stack on the tank), **Sand Trap** (spawned under a random player, applies -75% hit and silence-like effect), **Wide Slash** (frontal cleave), **Thrash** (extra attacks), enrage (**Enrage** or **Frenzy**, attack speed and damage up) at 30%.
- **Jobs**: 2 tanks swapping on Mortal Wound. Melee on one side. Ranged spread so Sand Trap hits one person.
- **Wipe causes / logs**: Tank death with high Mortal Wound stacks or after 30% with no cooldowns. Healers trapped (miss chance, cannot cast) while the tank dies.
- **Good**: about 1-2 min, no deaths.
- **Analysis notes**: Sand Trap makes healers' casts fail. Low healing output can be the mechanic, not laziness.

## General Rajaxx
- **Fight in one line**: 7 waves of Qiraji (Captain Qeez, Captain Tuubid, Captain Drenn, Captain Xurrem, Major Yeggeth, Major Pakkon, Colonel Zerran), then **General Rajaxx**. **Lieutenant General Andorov** and 4 Kaldorei Elites help, and Andorov heals the raid.
- **Mechanics**: waves have officers with **Intimidating Shout** (Qeez), **Attack Order** (Tuubid, all adds focus one player), **Hurricane** (Drenn), **Shockwave** (Xurrem), **Blessing of Protection** (Yeggeth, physical immunity), **Sweeping Slam** (Pakkon), **Enlarge** (Zerran, dispel). Rajaxx uses **Thundercrash** (halves all players' current HP, knockback, threat reset) and drops threat on his target.
- **Jobs**: kill officers first, offtanks on adds, dispel Enlarge, keep Andorov alive. On Rajaxx, keep everyone above about 50% HP before Thundercrash, and the tank re-taunts right after.
- **Wipe causes / logs**: Raid deaths during Attack Order wave (focused player). Andorov death (no raid heal), then Thundercrash and melee killing low-HP players. Rajaxx running free after threat drop.
- **Good**: 3-6 min including waves.
- **Analysis notes**: The encounter can include many mob types. Andorov's healing is NPC healing. Check Andorov's death time as a pivot point.

## Moam
- **Fight in one line**: Mana-race boss. He gains mana from **Drain Mana**. At full mana he casts **Arcane Eruption** (some sources call it Arcane Explosion), a raid-wide hit (about 3k+) with knockup. After 90 s he turns to stone (**Energize**) and summons 3 **Mana Fiends**.
- **Mechanics**: **Drain Mana** (several random mana users), **Trample**, Arcane Eruption at full mana, stone form with Mana Fiends (Arcane Explosion, Counterspell) for up to 90 s or until fiends die.
- **Jobs**: warlocks (Drain Mana), priests (Mana Burn), hunters (Viper Sting) keep his mana down. Warlocks banish fiends. Or kill him before 90 s with good DPS.
- **Wipe causes / logs**: Big **Arcane Eruption** damage across the raid means mana drain failed. Fiend damage on healers means banish or CC failed.
- **Good**: under 90 s single phase, or one stone phase with banished fiends.
- **Analysis notes**: Drain Mana, Mana Burn and Viper Sting casts on the boss are mechanics work. Do not judge those players on DPS.

## Buru the Gorger
- **Fight in one line**: Buru fixates a random player who kites him over **Buru Eggs**. Breaking an egg next to him deals large damage (about 45k) and resets his speed. At 20% he loses his shell and spams **Creeping Plague** (raid-wide stacking damage) until he dies.
- **Mechanics**: fixate with gaining speed, **Dismember** (stacking bleed about 1.2k per 2 s if he catches the target), **Thorns**, eggs explode for 100-500 to nearby players and spawn a **Hive'Zara Hatchling**. At 20%: **Creeping Plague** ramps (80, 160, 240 per tick and so on). It is a DPS race.
- **Jobs**: kiter runs over eggs, DPS kill eggs when Buru is on them. Hatchling cleanup. All cooldowns at 20%.
- **Wipe causes / logs**: Fixated player dies to **Dismember** (bad kite or speed). Raid dies to Creeping Plague because the 20% burn is too slow.
- **Good**: 2-4 min, phase 2 under about 30 s.
- **Analysis notes**: Boss damage mostly comes from eggs in phase 1 (shows as egg or explosion damage, not players). Player DPS on Buru is low before 20% by design.

## Ayamiss the Hunter
- **Fight in one line**: Phase 1 airborne (ranged only) until 70%, phase 2 on the ground with full threat wipe. **Paralyze** sacrifices a player on the altar unless a **Hive'Zara Larva** is killed.
- **Mechanics**: **Stinger Spray** (raid nature hit about 1k), **Poison Stinger** (stacking nature DoT on top-threat in phase 1), **Paralyze** (player sent to altar, a larva walks to them and kills them if not stopped, then a wasp spawns), **Hive'Zara Swarmer** waves. Phase 2: **Lash**, **Thrash**, **Frenzy** at 20% (vmangos). Taunt-immune.
- **Jobs**: ranged DPS and spread Poison Stinger stacks by trading threat in phase 1. Melee kill larvae at the altar. AoE swarmers. Tank waits for threat in phase 2.
- **Wipe causes / logs**: Deaths with high Poison Stinger stacks. Sacrificed players dying because the larva was not killed. Tank loses aggro at 70% (no taunt).
- **Good**: 2-4 min, no sacrifices.
- **Analysis notes**: Melee DPS near zero in phase 1 is expected.

## Ossirian the Unscarred
- **Fight in one line**: Ossirian starts with **Strength of Ossirian** (huge damage and resistances). Clicking an **Ossirian Crystal** removes it for about 45 s and applies a random school weakness. The raid kites him crystal to crystal in a sandstorm with tornadoes.
- **Mechanics**: **Strength of Ossirian** (returns if no crystal in time), crystal weaknesses (one of fire, frost, nature, shadow or arcane), **Curse of Tongues** (AoE, decurse healers), **War Stomp** (AoE knockback), **Enveloping Winds** (stun on tank, threat kept), **Sand Vortex** tornadoes (**Sandstorm**) that whirl players and wipe their threat.
- **Jobs**: crystal clicker and scout, 2+ tanks (taunt-immune), decursers (mages and druids), casters switch to the weakened school.
- **Wipe causes / logs**: Raid wipes fast after a missed crystal (Strength of Ossirian returns, tanks get one-shot). Tank swept by a tornado and boss runs to healers.
- **Good**: 2-4 min, Strength of Ossirian never re-applied.
- **Analysis notes**: Check the gaps between crystal debuffs. A sharp rise in boss damage dealt means supreme mode came back.

---

# AQ40 trash that commonly kills raids

- **Anubisath Sentinel** (packs before Skeram, near Huhuran): each has one random ability (**Mending**, **Mortal Strike**, **Knock Away**, **Mana Burn**, **Shadow Storm**, **Thunderclap**, **Thorns**, reflects of arcane/fire or shadow/frost). When one dies the survivors gain its ability and heal (vmangos: **Transfer** plus **Heal Brethren**), so the last one has 4 abilities. Separate them, kill knockback and heal ones first. Wipes show stacked Thunderclap or Shadow Storm damage, or tank deaths to Mortal Strike plus Mending prolonging the fight.
- **Anubisath Defender** (path to Twin Emperors and around Huhuran): random **Meteor** or **Plague**, **Shadow Storm** or **Thunderclap**, reflect type, and at about 10% either **Explode** (rooted, glowing, run away) or **Enrage**. Summons Anubisath Warrior or Swarmguard adds (chain fear them). Wipes show Explode damage on melee, Plague spreading through stacks, or Shadow Storm on ranged out of melee.
- **Obsidian Eradicator** (Viscidus and Fankriss area): at full mana casts **Shock Blast** (about 6.5k nature within 30 yd). Warlocks drain and priests Mana Burn to keep its mana down. A wipe shows Shock Blast hitting many players at once.
- **Qiraji Champion** and **Qiraji Mindslayer / Slayer** (after Twins, toward C'Thun): Mindslayers cast **Cause Insanity** (MC with threat wipe), **Mind Flay**, **Mind Blast**, **Mana Burn**. Champions use **Frightening Shout**, **Knock Away**, **Vengeance**. MC'd raiders killing others shows in logs as player-sourced killing blows.
- **Vekniss Wasp / Vekniss Stinger / Qiraji Lasher packs** (Huhuran area): wasps apply **Vekniss Catalyst** (via an "Itch" debuff, about 500 per 2 s, slow). A Stinger's **Charge** does about 10x damage to Catalyst targets, so it is lethal. Dispel Catalyst, kill quickly. Packs cannot be CC'd. Wipes show sudden one-shot Charge deaths on players with Catalyst.
- **Anubisath Warder** (Ouro and Twins hallway, uncertain details): random Fear or Entangling Roots, Silence or Dust Cloud, plus Fire Nova. Annoying more than lethal.

---

## Sources
- https://warcraft.wiki.gg/wiki/The_Prophet_Skeram
- https://warcraft.wiki.gg/wiki/Silithid_Royalty
- https://warcraft.wiki.gg/wiki/Battleguard_Sartura
- https://warcraft.wiki.gg/wiki/Fankriss_the_Unyielding
- https://warcraft.wiki.gg/wiki/Viscidus
- https://warcraft.wiki.gg/wiki/Princess_Huhuran
- https://warcraft.wiki.gg/wiki/Twin_Emperors
- https://warcraft.wiki.gg/wiki/Ouro
- https://warcraft.wiki.gg/wiki/C'Thun
- https://warcraft.wiki.gg/wiki/C%27Thun_(tactics)
- https://warcraft.wiki.gg/wiki/Kurinnaxx
- https://warcraft.wiki.gg/wiki/General_Rajaxx
- https://warcraft.wiki.gg/wiki/Moam
- https://warcraft.wiki.gg/wiki/Buru_the_Gorger
- https://warcraft.wiki.gg/wiki/Ayamiss_the_Hunter
- https://warcraft.wiki.gg/wiki/Ossirian_the_Unscarred
- https://warcraft.wiki.gg/wiki/Anubisath_Sentinel
- https://warcraft.wiki.gg/wiki/Anubisath_Defender
- https://warcraft.wiki.gg/wiki/Obsidian_Eradicator
- https://warcraft.wiki.gg/wiki/Qiraji_Mindslayer
- https://warcraft.wiki.gg/wiki/Qiraji_Champion
- https://www.warcrafttavern.com/guides/wow-classic-temple-of-ahnqiraj-aq40-guide/
- https://github.com/vmangos/core/tree/development/src/scripts/kalimdor/silithus/temple_of_ahnqiraj (1.12 emulator scripts: spell names/IDs, timers)
- https://github.com/vmangos/core/tree/development/src/scripts/kalimdor/silithus/ruins_of_ahnqiraj
- Search-result summaries (not fetched directly) of Icy Veins Classic guides (Twin Emperors, C'Thun, Viscidus, Silithid Royalty) and older AQ40 trash guides for Vekniss Catalyst
