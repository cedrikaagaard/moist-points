# Blackwing Lair and Zul'Gurub - boss reference for log analysis (Classic Era, 1.12 mechanics)

Read this before explaining a BWL or ZG wipe. Numbers are 1.12 / Classic Era values from the cited sources; where sources disagree or are unclear it says so. Spell names are given as they normally appear in Warcraft Logs (English client). Kill-time ballparks are rough guides for a normal, reasonably geared guild, not records.

General log-reading rules that apply to every boss below:
- The killing blow is the symptom. Look 5-15 s before the death: what debuffs were on the player, who was healing them, did a mechanic (fear, knockback, threat wipe, mind control) happen just before.
- A tank dying right after a threat-drop mechanic (Wing Buffet, Knock Away, Charge, Gouge, Time Lapse) usually means the swap/taunt failed, not that healing failed.
- A cascade of deaths within ~10 s after the first tank death is usually the consequence of the tank death; explain the first death.
- Deaths of players who were "not supposed to be there" (in front of a dragon, in melee of a cleaving boss) point to positioning/awareness, not healing.

---

# Blackwing Lair

## Razorgore the Untamed
- **Fight in one line**: Phase 1 = one player mind-controls Razorgore through the orb and destroys all 30 eggs while the raid holds waves of adds from the corners; Phase 2 = after the last egg Razorgore is freed, heals to full and must be tanked and killed. No berserk timer, but adds keep spawning until the last egg dies.
- **Mechanics**:
  - Orb control (the controller uses Razorgore's pet bar): "Destroy Egg" (eggs within 10 yd, short cast, ~1.5 s cooldown), "Calm Dragonkin" (sleeps a dragonspawn 30 s), plus his own Cleave/Fireball Volley. Control lasts about 90 s per channel; a "Mind Exhaustion" debuff prevents the same person from re-using the orb for a while (sources note it may be outdated in later expansions; in Era assume a second controller is needed).
  - Phase 1 opener: Grethok the Controller (casts mind control, kill first) and two Blackwing Guardsmen.
  - Adds (up to ~40 orcs and 12 dragonspawn total): "Blackwing Mage" (Fireball, Arcane Explosion; highest priority, they shred casters), "Blackwing Legionnaire" (melee, cleave; kite or kill), "Death Talon Dragonspawn" (hard-hitting, high HP; tanked/kited/feared/slept).
  - If Razorgore dies before all eggs are destroyed, he explodes and kills the room (instant wipe, shows as everyone dying at once).
  - Phase 2 Razorgore: "Conflagration" (3000 fire over 10 s on his target, the target panics/disorients and loses control, nearby players take splash), "War Stomp" (AoE damage + 5 s stun around him), "Cleave", "Fireball Volley" (raid-wide fire hits). Not tauntable; the orb controller with most control time starts high on threat.
- **Jobs**: Controller (often a paladin or someone with low other duties) plus a backup controller; one tank group per corner/side picking up dragonspawn; mages/warlocks/hunters burst Blackwing Mages; fears/Piercing Howl/frost on Legionnaires; healers spread to cover all corners. Phase 2: 2-3 tanks arranged in a triangle so Conflagration on the MT passes aggro to the next tank; mostly ranged DPS; fire resistance helpful.
- **Common wipe causes**:
  - Add overflow in phase 1: many deaths spread out over 1-3 minutes to Blackwing Mage spells and Dragonspawn melee, eggs destroyed too slowly (controller slow, controller died or lost control, orb not re-used). Check how long phase 1 lasted and how many "Destroy Egg" casts there were.
  - Accidental Razorgore death in phase 1 (raid AoE/DoTs on him while controlled): mass simultaneous deaths.
  - Phase 2: tank dies during Conflagration because no second tank had threat, Razorgore runs into casters; War Stomp + Fireball Volley killing a stacked melee group.
- **What good looks like**: Phase 1 roughly 2.5-4 min with few or no deaths, Blackwing Mages die fast, eggs finished in 1-2 control windows; phase 2 under ~1.5 min.
- **Analysis notes**: Deaths to "Fireball" / "Arcane Explosion" from Blackwing Mage are phase 1 add control, not boss damage. The controlling player appears to cast Razorgore's abilities; do not read their damage as normal DPS. Late-phase-1 deaths are often the add backlog, caused much earlier by slow egg destruction.

## Vaelastrasz the Corrupt
- **Fight in one line**: Single phase, boss starts at about 30% HP. "Essence of the Red" gives the raid enormous mana/rage/energy regeneration for 3 minutes; the fight is a DPS race against that buff ending. Fire resistance strongly recommended, especially for tanks. Expect several tank deaths by design.
- **Mechanics**:
  - "Essence of the Red": raid buff on pull, +500 mana/s, +50 energy/s, +20 rage/s for 3 min. When it expires healers run dry and the raid dies.
  - "Burning Adrenaline": every ~15 s on a random mana user; every third cast (about every 45 s) on the current tank. Target deals +100% damage, spells become instant, loses 5% max health per second, dies within ~20 s and then explodes for ~4400-5600 fire to nearby players. Targets must run away from the raid (usually to a wall/behind him) and the next tank must take over from a BA tank.
  - "Flame Breath": frontal cone, 3500-4500 fire + ~1000 every 3 s for 15 s, 2 s cast. Nobody but the tank in front.
  - "Fire Nova": 555-645 fire to the whole room, frequent; this is the constant raid damage.
  - "Cleave": chains to nearby players, can kill multiple melee standing beside the tank.
  - "Tail Sweep": rear cone, ~1000 damage and big knockback.
- **Jobs**: 3-5 warrior tanks in a pre-arranged order (each builds threat early so they can take over); healers on tanks with fire resistance gear; mana users with Burning Adrenaline run away from the raid immediately and use their remaining seconds to DPS; rogues Feint, hunters Feign Death to avoid pulling; melee on his sides, nobody behind (tail) or in front (breath). Fire Protection potions and resistance consumables common.
- **Common wipe causes**:
  - Burning Adrenaline explosion inside the raid/melee: several deaths at once, killing blow "Burning Adrenaline" on non-targets.
  - Tank BA swap failure: after the tank with BA dies, Vael turns to a DPS player (threat issue) or breathes on the raid; look for "Flame Breath" deaths on non-tanks right after a tank death.
  - Essence of the Red expiring before the kill (fight > 3 min): healers go OOM, deaths pile up near the 3:00 mark. Cause = too little DPS, or too many early deaths.
  - Tail Sweep knocking players far away / into adds; Cleave killing melee.
- **What good looks like**: Kill well under 3:00 (often 1:30-2:30). Only BA targets and the planned tanks die; no "Burning Adrenaline" killing blows on bystanders, no Flame Breath deaths on non-tanks.
- **Analysis notes**: Tank deaths and BA-target deaths are expected and are not mistakes by themselves; judge the deaths of non-BA players. A player who received BA and did high damage then died is working as intended. If deaths spike right after ~3:00, the root cause is DPS, not healing.

## Broodlord Lashlayer
- **Fight in one line**: Tank-and-spank threat fight after the suppression room; "Knock Away" repeatedly halves the top threat target's aggro, so the raid must control threat while killing him. No enrage.
- **Mechanics**:
  - "Knock Away": knocks back the current target and reduces their threat by 50%. Over the fight he cycles through tanks.
  - "Mortal Strike": heavy hit on the MT (can exceed 5000 on plate when it crits, far more on cloth), applies a healing reduction. Power Word: Shield right after is common.
  - "Cleave": frontal, dangerous to melee standing at the front.
  - "Blast Wave": AoE fire damage + knockback/slow around him.
- **Jobs**: 2-3 tanks spread ~90 degrees apart, all building threat; DPS holds off at the start and keeps threat below the second tank; healers spread healing so no healer tops threat; Demoralizing Shout on him; melee step out of Blast Wave.
- **Common wipe causes**:
  - Threat loss after Knock Away: a DPS or healer pulls aggro and dies to "Mortal Strike"/melee. Look for a boss target switch to a non-tank shortly after a Knock Away.
  - MT dies to Mortal Strike + melee with healing reduction active; check heals in the 3-4 s before.
  - Blast Wave deaths on low-HP melee/casters who stood too close.
- **What good looks like**: 1-2 min kill, no non-tank aggro, no Mortal Strike deaths.
- **Analysis notes**: Many attempts actually die in the suppression room trash, not to Broodlord; check which NPC dealt the killing blows. A non-tank killed by "Mortal Strike" means aggro was lost.

## Firemaw
- **Fight in one line**: First drake. Tanked at a corner/doorway; "Flame Buffet" stacks on everyone in line of sight, so the raid uses LoS to drop stacks. Onyxia Scale Cloak required for anyone who can be hit by Shadow Flame (tanks at minimum). No enrage.
- **Mechanics**:
  - "Flame Buffet": hits everyone in LoS for ~150 fire and stacks a debuff increasing fire damage taken (20 s, refreshed while in LoS, not dispellable). Players hide behind a wall when stacks get to roughly 5-10.
  - "Shadow Flame": frontal cone, 3938-5062 shadow; without Onyxia Scale Cloak it also applies a lethal shadow DoT. Every ~15-18 s.
  - "Wing Buffet": frontal cone 563-937 damage, knockback and threat reduction on the tank. Every ~30-35 s.
  - "Thrash": extra attacks.
- **Jobs**: 2-3 tanks, an offtank ready to taunt when the MT is knocked back or has too many buffet stacks; healers and DPS rotate in/out of LoS; bandages for non-tanks; fire resistance on tanks helps.
- **Common wipe causes**:
  - Healers/DPS ignore stacks: deaths to "Flame Buffet" ticks at 10+ stacks, healers going OOM.
  - Tank swap failure after "Wing Buffet": boss turns, "Shadow Flame" kills multiple non-tanks.
  - Missing Onyxia Scale Cloak: tank killed by the Shadow Flame DoT.
- **What good looks like**: ~2-3 min, few or no deaths, stacks kept moderate.
- **Analysis notes**: Many Flame Buffet killing blows on DPS = stack discipline, not healing. Shadow Flame deaths on anyone but tanks = positioning or failed taunt.

## Ebonroc
- **Fight in one line**: Second drake; tank-swap fight around "Shadow of Ebonroc". Onyxia Scale Cloak for tanks. No enrage.
- **Mechanics**:
  - "Shadow of Ebonroc": 8 s debuff on the tank; while it is on the target Ebonroc heals himself (~25,000) whenever he hits that target. Another tank must taunt immediately.
  - "Shadow Flame", "Wing Buffet" (50% threat drop), "Thrash" as on Firemaw.
- **Jobs**: 2-3 tanks with constant taunt rotation; one tank assigned to take over after Wing Buffet; Mortal Strike/Wound Poison help reduce his healing; raid stays to the sides.
- **Common wipe causes**:
  - Taunt resisted/late: Ebonroc heals large chunks (visible as big healing on the boss), fight drags, healers OOM.
  - Shadow Flame on raid after a Wing Buffet with no swap.
- **What good looks like**: 1-2 min, Ebonroc self-healing low.
- **Analysis notes**: Check boss healing events from Shadow of Ebonroc; large totals mean slow swaps.

## Flamegor
- **Fight in one line**: Third drake; same tanking as Firemaw, plus "Frenzy" that must be removed with Tranquilizing Shot or Flamegor casts Fire Nova on the raid. Onyxia Scale Cloak for tanks. No enrage.
- **Mechanics**:
  - "Frenzy" (some sources call it Enrage): every ~10-15 s, 10 s duration, increases attack speed and makes him pulse "Fire Nova" on the whole raid (LoS no longer avoids it). Hunters remove it with "Tranquilizing Shot".
  - "Shadow Flame", "Wing Buffet", "Thrash" as above.
- **Jobs**: hunter tranq rotation (2-3 hunters in order); tanks as Firemaw; raid at the sides.
- **Common wipe causes**: missed/late Tranquilizing Shot (multiple "Fire Nova" casts per Frenzy, steady raid damage), tank deaths during Frenzy, Shadow Flame on raid after Wing Buffet.
- **What good looks like**: 1-2 min; every Frenzy removed within 1-2 s; near-zero Fire Nova damage.
- **Analysis notes**: Count Frenzy applications vs Tranquilizing Shot dispels and the time between them. Fire Nova damage taken is the clearest "tranq quality" metric.

## Chromaggus
- **Fight in one line**: Two breaths per instance lockout (chosen from five), one breath every 30 s alternating; "Brood Affliction" debuffs stack on players; "Frenzy" needs Tranquilizing Shot; permanent enrage at 20%. Hourglass Sand needed for Bronze. No time-based berserk known.
- **Mechanics**:
  - Breaths (frontal/LoS; raid hides behind the door/pillars, only the tank takes them): "Incinerate" (red, ~3700-4300 fire, near 9000 with Black affliction), "Corrosive Acid" (green, ~1000 nature every 3 s for 15 s + big armor reduction), "Frost Burn" (blue, ~1400 frost + 80% attack speed slow), "Ignite Flesh" (black, ~750 fire every 3 s for 60 s, stacking), "Time Lapse" (bronze, halves max HP, 6 s stun, threat loss).
  - "Brood Affliction: Red" (disease, small fire DoT, heals Chromaggus if you die), "Brood Affliction: Green" (poison, -50% healing taken, nature DoT), "Brood Affliction: Blue" (magic, -70% move, -50% cast speed, mana drain), "Brood Affliction: Black" (curse, +100% fire damage taken), "Brood Affliction: Bronze" (random 4 s stuns for 10 min, only removable by Hourglass Sand or Ice Block).
  - All five afflictions at once = "Chromatic Mutation": the player becomes a hostile drakonid (mind-controlled, must be CCd or killed).
  - "Frenzy": every ~10-15 s, big attack speed increase; tranquilize immediately.
  - Shimmer: periodically changes his vulnerable magic school.
  - Enrage at 20% HP, permanent, Frenzy still happens.
- **Jobs**: hunters tranq rotation; priests/paladins dispel magic and disease, druids/shamans poison, mages/druids curses (decurse is critical with Black); everyone uses Hourglass Sand on Bronze; raid hides from breath; tank keeps him facing the door; ranged/caster DPS follows shimmer; save cooldowns for 20%.
- **Common wipe causes**:
  - Breath hitting the raid (late LoS): many deaths to "Incinerate"/"Ignite Flesh"/"Corrosive Acid" at the same timestamp.
  - Missed Frenzy tranq: MT dies to melee.
  - Affliction buildup: players stunned by Bronze or at 4-5 afflictions; mutation creates hostile adds; Black + Incinerate kills.
  - Time Lapse: tank stunned and loses threat; boss turns on raid.
  - Enrage phase too long because cooldowns were wasted.
- **What good looks like**: 2-3 min, no breath deaths on non-tanks, every Frenzy tranquilized fast, low affliction stacks, no Chromatic Mutation.
- **Analysis notes**: Check which two breaths were active (they define the danger). Fire deaths may be amplified by Black affliction; check the debuff list. A Red-afflicted death heals the boss.

## Nefarian
- **Fight in one line**: Phase 1 (Lord Victor Nefarius on the throne, untargetable) - drakonid waves from two doors until 42 die; Phase 2 - Nefarian lands with a raid-wide Shadow Flame (Onyxia Scale Cloak required for everyone), then class calls every ~25-35 s; Phase 3 at 20% - dead drakonids rise as Bone Constructs. No hard berserk known.
- **Phase 1 mechanics**:
  - Lord Victor Nefarius: "Shadow Bolt" on random raid members, a fear, and mind control ("Shadow Command" in some sources).
  - Drakonids: two colors per lockout (one per door) plus "Chromatic Drakonid" (strongest). Red (fire cone DoT, fire resistant), Blue (mana drain, attack speed slow, frost resistant), Green (stun, nature resistant), Black (strong fire hits, fire/shadow resistant), Bronze (attack/cast slow, arcane resistant). Must kill 42.
- **Phase 2 mechanics**:
  - Landing "Shadow Flame": raid-wide; without Onyxia Scale Cloak it is lethal (a resistible hit plus a DoT). Ice Block/Divine Shield also survive.
  - "Shadow Flame" (frontal cone ~2200 shadow), "Cleave" (frontal, up to 10 targets), "Tail Lash" (rear, damage + 2 s stun), "Bellowing Roar" (35 yd AoE fear about every 30 s), "Veil of Shadow" (-75% healing taken for 6 s on the tank, dispel it).
  - Class calls (every ~25-35 s, one class at a time):
    - Warrior: forced into Berserker Stance, takes more damage. Extra tank healing; tanks plan stance.
    - Rogue: teleported in front of Nefarian and rooted; tank turns him or they eat Cleave/Shadow Flame.
    - Priest: direct heals apply "Corrupted Healing" (stacking DoT on the healed target). Priests stop direct heals, use Renew/shield.
    - Mage: "Wild Polymorph" on random raid members (anywhere); mages Ice Block, priests/paladins dispel, especially tanks.
    - Warlock: summons 2 Infernals per warlock that stun nearby; warlocks stand apart, kill/CC infernals.
    - Hunter: ranged weapon breaks (durability). Unequip or swap weapons.
    - Druid: forced into Cat Form.
    - Paladin: "Blessing of Protection" on Nefarian (physical immunity briefly). Paladins use Judgement of Wisdom; physical DPS waits.
    - Shaman: corrupted totems for Nefarian (incl. Fire Nova and Windfury). Kill totems fast, especially before 20%.
- **Phase 3 mechanics**: at 20% every dead drakonid rises as a "Bone Construct" (undead, hits hard, low HP). AoE them (Holy Wrath, mage AoE) while tanks Challenging Shout; class calls continue.
- **Jobs**: P1 tanks on each door, AoE classes on red/bronze, single target on blue/black/chromatic, fear ward on tanks for P1 fear; P2 MT with Fear Ward / Berserker Rage / tremor totem for Bellowing Roar, healers outside 40 yd where possible, dispel Veil of Shadow, all wear Onyxia Scale Cloak; P3 group where drakonids died, AoE plan.
- **Common wipe causes**:
  - Missing Onyxia Scale Cloak: single player killed by "Shadow Flame" at landing.
  - P1 too slow: drakonids pile up, many deaths to drakonid melee; check DPS and the drakonid kill count over time.
  - Tank fear (Bellowing Roar) without Fear Ward/Berserker Rage: Nefarian turns, Shadow Flame/Cleave on raid.
  - Class call handling: Warrior call tank death, Wild Polymorph on tanks, priest heals killing tanks via Corrupted Healing, Infernals stunning healers, uncontrolled totems.
  - P3 Bone Constructs overwhelming the raid at 20% if AoE or cooldowns were not saved.
- **What good looks like**: P1 2-3 min, total fight 4-7 min; no cloak deaths; tank never feared; class calls cause minimal deaths.
- **Analysis notes**: Identify the class call active at the time of a death. Corrupted Healing damage counts as damage on the healed player; the source is the priest's healing. Wild Polymorph/Infernal deaths can be indirect (stunned/sheeped then killed).

---

# Zul'Gurub (20-man, 3-day reset)

## High Priestess Jeklik
- **Fight in one line**: Phase 1 bat form (100-50%) with bat waves about once a minute; Phase 2 priest form below 50% with Great Heal and Mind Flay; bomb-dropping Gurubashi Bat Riders around 35%.
- **Mechanics**:
  - P1: "Charge" (2 s stun), "Sonic Burst" (AoE damage + 10 s silence), "Swoop" (frontal, stun), "Pierce Armor" (-75% armor 20 s), "Blood Leech". Summons Frenzied Bloodseeker Bats (8 per wave).
  - P2: "Great Heal" (heals 92,500, 4 s cast, must interrupt), "Mind Flay" (chains, interrupt/spread), "Shadow Word: Pain", "Psychic Scream" (fear 5 nearby), "Curse of Blood".
  - Gurubashi Bat Riders throw liquid fire (~1000 fire) creating ground fires.
- **Jobs**: interrupt rotation (rogues/warriors) on Great Heal and Mind Flay; mage AoE on bat waves; tank circles away from fires; ranged spread.
- **Common wipe causes**: Great Heal landing (boss HP jumps), fire patches on raid, silenced healers in P1.
- **What good looks like**: 1.5-3 min, every Great Heal interrupted.
- **Analysis notes**: Boss healing events reveal missed interrupts.

## High Priest Venoxis
- **Fight in one line**: Phase 1 priest form with four Razzashi Cobras; Phase 2 serpent form at 50% (poison clouds); Parasitic Serpents at 25%.
- **Mechanics**:
  - P1: "Holy Nova" (875-1125, heals him/adds), "Holy Fire" (2200 + DoT), "Holy Wrath" (chain, +30% per jump), "Renew", "Dispel Magic" (removes CC on adds).
  - Cobras: stacking poison, "Spit" (~1850 nature, knockback).
  - P2: "Poison Cloud" (500/s, move out), "Venom Spit" (1500-2500 + DoT, stacks), "Virulent Poison" (melee proc, stacks). Parasitic Serpents at 25%.
- **Jobs**: CC/kill cobras one at a time; drain his mana; poison cures; ranged spread; P2 only the tank in melee.
- **Common wipe causes**: Holy Wrath chain through stacked raid, adds breaking CC, standing in Poison Cloud, stacked Venom Spit/Virulent Poison on tanks without cures.
- **What good looks like**: 1.5-3 min; few Holy Wrath jumps, no cloud deaths.
- **Analysis notes**: Holy Wrath damage scales per jump; high values mean bad spacing.

## High Priestess Mar'li
- **Fight in one line**: Alternating ~1 min troll and spider phases; spider adds that grow; Drain Life heals her.
- **Mechanics**:
  - Troll: "Poison Bolt Volley" (30 yd, damage + DoT, cure it), "Drain Life" (heals her a lot, interrupt), "Enlarge" on allies, "Hatch Eggs" (Spawn of Mar'li).
  - Spawn of Mar'li: grow every 4 s, fully grown after 20 s (immune to CC), stacking poison. Kill immediately.
  - Spider: "Enveloping Webs" (roots/silences everyone within 20 yd and wipes their threat; she then charges a distant player), "Charge", "Corrosive Poison" (-5000 armor + DoT), "Poison Shock", "Thrash".
  - Witherbark Speaker at the start (mind control or offtank).
- **Jobs**: offtank with the ranged group to catch her after Webs/Charge; interrupts on Drain Life; AoE spiders; poison cleansing (Poison Cleansing Totem is strong).
- **Common wipe causes**: grown spiders killing healers, Webs + no offtank pickup, Drain Life heals.
- **What good looks like**: 1.5-3 min, spiders die young.
- **Analysis notes**: Healer deaths after Enveloping Webs = offtank pickup issue.

## Bloodlord Mandokir
- **Fight in one line**: Mandokir and raptor Ohgan; "Threatening Gaze" punishes the watched player for acting; Mandokir levels up from player deaths; Chained Spirits resurrect dead players.
- **Mechanics**:
  - "Threatening Gaze": watches a player for ~6 s; if they act (cast/attack, many guides say any action) he charges and kills them. Sources say the result is effectively an instant kill; exact log name of the killing hit is uncertain.
  - "Charge" (wipes his threat table), "Whirlwind" (melee AoE ~2500), "Intimidating Shout" (fear), "Mortal Strike", "Level Up" (+10% damage/size every 3 player kills).
  - Ohgan: stacking "Sunder Armor" (up to 20), Thrash. Killing Ohgan enrages Mandokir (+65% attack speed, +50% damage) for ~1-1.5 min.
  - Chained Spirits revive dead players (limited number).
- **Jobs**: kill the Vilebranch Speaker first; MT and OT separated; tank re-taunts after Charge; DPS stops after a Charge; melee strafe out of Whirlwind; gazed player stops everything.
- **Common wipe causes**: gaze deaths snowballing into Level Up stacks, tank death to Ohgan enrage, Whirlwind on melee.
- **What good looks like**: 2-3 min, at most a couple of gaze deaths.
- **Analysis notes**: Deaths right after "Threatening Gaze" on that player = discipline. Level Up counts can explain a late tank death.

## Edge of Madness (Gri'lek, Hazza'rah, Renataki, Wushoolay)
- **Fight in one line**: Optional boss summoned with Gurubashi Mojo Madness (alchemist); one of four per rotation (rotation length differs by source, check the lockout). Imps and voidwalkers guard the area.
- **Gri'lek**: periodically grows ("Avatar"), wipes threat and chases a random player slowly; roots ("Entangling Roots"); bounce him between players.
- **Hazza'rah**: "Sleep" AoE (stay out of melee), chain "Mana Burn", summons Nightmare Illusions (hit hard, low HP; single target kill).
- **Renataki**: "Vanish", "Gouge", and random ambush on players; AoE to break stealth.
- **Wushoolay**: "Chain Lightning", "Lightning Cloud", "Forked Lightning", nature resistance; drain his mana.
- **Common wipe causes**: unexpected stealth/illusion damage on healers, mana burn, chain lightning on stacked raid.
- **Analysis notes**: Numbers are less documented; describe patterns cautiously.

## Gahz'ranka
- **Fight in one line**: Optional fishing boss (Mudskunk Lure); fought at the water.
- **Mechanics**: "Frost Breath" (frontal frost), "Massive Geyser" (knock-up and fall damage, threat issues), "Slam" (knockback). Exact numbers not confirmed.
- **Jobs**: fight in water to avoid fall damage; tank re-gains threat after knock-ups.
- **Common wipe causes**: fall deaths, tank loses threat.
- **Analysis notes**: "Falling" deaths are the Geyser pattern.

## High Priest Thekal
- **Fight in one line**: Phase 1 council of Thekal, Zealot Lor'Khan and Zealot Zath (+ tigers) who must die within ~10 s of each other or they resurrect; Phase 2 tiger form.
- **Mechanics**:
  - Thekal P1: "Mortal Cleave" (healing reduction), "Silence", "Bloodlust" on allies (dispel).
  - Lor'Khan: "Great Heal" (37,000-43,000, interrupt), "Lightning Shield", "Dispel Magic", "Disarm".
  - Zath: "Blind", "Gouge", "Kick", "Sinister Strike", "Sweeping Strikes".
  - P2 Thekal: "Force Punch" (AoE knockback ~1000), "Charge", "Speed Slash", summons 2 Zulian Guardians each minute, "Enrage" at 20%.
- **Jobs**: three tanks, interrupts on Lor'Khan, synchronized kill, CC on tigers, offtank catches Thekal after Force Punch.
- **Common wipe causes**: staggered kills (resurrection), Lor'Khan heals, Force Punch knocking raid around, Guardians uncontrolled.
- **What good looks like**: P1 deaths within a few seconds, 2-3 min total.
- **Analysis notes**: A target resurrection event = bad sync.

## High Priestess Arlokk
- **Fight in one line**: Started by the Gong of Bethekk; panthers spawn continuously; she alternates troll form and vanish, returning in panther form.
- **Mechanics**: "Mark of Arlokk" (panthers attack the marked player), "Gouge" (threat loss on tank), "Whirlwind", "Ravage", "Shadow Word: Pain", Vanish then panther form with strong cleave.
- **Jobs**: tanks/offtanks hold panthers or fear/AoE them; tank re-pickup after Gouge; marked player protected.
- **Common wipe causes**: panther buildup, marked player dies, Gouge leads to aggro on DPS.
- **What good looks like**: 2-3 min, few panther deaths of healers.
- **Analysis notes**: Healer deaths to "Zulian Prowler" melee point to panther control.

## Jin'do the Hexxer
- **Fight in one line**: Hex on the tank, curse that lets players see shades, Brain Wash Totems, Powerful Healing Wards, teleports to a skeleton pit. Often considered the hardest ZG fight.
- **Mechanics**:
  - "Hex": turns the tank into a frog; dispel.
  - "Delusions of Jin'do": curse, 200 every 2 s; do not remove it, cursed players kill Shades of Jin'do.
  - Shades of Jin'do: interrupt casts, "Shadow Shock" ~600; immune to AoE.
  - "Brain Wash Totem": mind control; kill totem.
  - "Powerful Healing Ward": heals Jin'do ~3% per tick; kill.
  - Teleport to skeleton pit; mage AoE.
- **Jobs**: priority Shades > Healing Ward > Brain Wash Totem > Jin'do; dispel Hex; healers protected from shades.
- **Common wipe causes**: decursing Delusions, shades interrupting healers, totems ignored.
- **What good looks like**: 2-3 min, wards die quickly.
- **Analysis notes**: Removing Delusions curse = mistake.

## Hakkar
- **Fight in one line**: Blood Siphon every 90 s must be countered with Poisonous Blood from a Son of Hakkar; Corrupted Blood raid damage; Cause Insanity mind-controls the tank; 10 min enrage. Each living High Priest adds an aspect and HP.
- **Mechanics**:
  - "Blood Siphon": every 90 s, drains and stuns players; with "Poisonous Blood" (from a dead Son of Hakkar's cloud) it damages Hakkar instead of healing him.
  - "Corrupted Blood": 875-1125 shadow then 200 every 2 s, spreads to nearby players. Sources disagree whether it can be cleansed.
  - "Cause Insanity": 10 s MC on the top-threat target.
  - "Will of Hakkar": 20 s MC on a humanoid.
  - Enrage: 10 min or 5%.
  - Aspects (if priests alive): Jeklik (AoE + silence), Venoxis (poison volley), Mar'li (stun + threat reset), Thekal (attack speed), Arlokk (gouge + threat wipe).
- **Jobs**: 2-3 tanks; sheep MC'd tank and dispel; Intimidating Shout preparations; Son kills timed before Siphon; do not cure Poisonous Blood; spread for Corrupted Blood.
- **Common wipe causes**: Siphon without poison (Hakkar heals big), tank MC'd and killing raid, Corrupted Blood cascades.
- **What good looks like**: 2-4 min, every Siphon poisoned.
- **Analysis notes**: Check Poisonous Blood count before each Siphon; curing it is a mistake.

---

# Notable trash

- **BWL suppression rooms**: suppression devices (slows 80%), whelps respawn every 30 s, Death Talon Hatchers. Wipes here look like whelp/hatcher deaths spread over time.
- **BWL Death Talon packs** (between Broodlord and the drakes): Death Talon Wyrmguards (random school vulnerability), Overseers, Flamescales, Seethers (enrage, tranq), Captains. Wipes come from fear/flame chains and failed CC.
- **BWL Chromatic Elite Guards** before Chromaggus (Mortal Strike, knockdown) and Blackwing Spellbinders/Warlocks in Vael's area (polymorph, Rain of Fire, felguards).
- **ZG trash**: Gurubashi Berserkers (fear, knock away), Gurubashi Bat Riders (explode at low HP), Hakkari priests, Zulian panthers, Sons of Hakkar, Razzashi snakes/spiders. Bat Rider explosions and Berserker fear into extra packs are the common raid killers.

---

## Sources
- https://warcraft.wiki.gg/wiki/Chromaggus
- https://warcraft.wiki.gg/wiki/Nefarian_(tactics)
- https://warcraft.wiki.gg/wiki/Vaelastrasz_the_Corrupt
- https://warcraft.wiki.gg/wiki/Razorgore_the_Untamed
- https://warcraft.wiki.gg/wiki/Broodlord_Lashlayer
- https://warcraft.wiki.gg/wiki/Firemaw
- https://warcraft.wiki.gg/wiki/Ebonroc
- https://warcraft.wiki.gg/wiki/Flamegor
- https://warcraft.wiki.gg/wiki/Hakkar_(tactics)
- https://warcraft.wiki.gg/wiki/Jin%27do_the_Hexxer
- https://warcraft.wiki.gg/wiki/High_Priest_Thekal
- https://warcraft.wiki.gg/wiki/High_Priestess_Jeklik_(tactics)
- https://warcraft.wiki.gg/wiki/High_Priest_Venoxis_(Classic)
- https://warcraft.wiki.gg/wiki/High_Priestess_Mar%27li_(Classic)
- https://warcraft.wiki.gg/wiki/Bloodlord_Mandokir_(Classic)
- https://warcraft.wiki.gg/wiki/High_Priestess_Arlokk
- https://www.warcrafttavern.com/wow-classic/guides/zg/
- https://www.warcrafttavern.com/wow-classic/guides/bwl/
- https://www.icy-veins.com/wow-classic/high-priestess-mar-li-guide-strategy-abilities-loot (search snippet only)
