# Boss reference audit (Classic Era 1.15 / 1.12 content)

Sources used:
- **LOG**: the repo's own Warcraft Logs cache, /Users/cedrik/moist/data/wcl (MC, Ony, BWL, ZG, AQ40, Naxx; no AQ20 reports). It is the strongest source for exact combat-log names. Scripts are in this folder: scan.py → names.txt (enemy abilities that hit raiders, per boss), intr.py → intr.txt (what was interrupted or dispelled, and by what).
- **SITE**: aggregated `mech` counts in src/raids/data. A key that is 0 across all nights means the name never matches the log.
- **WIKI**: warcraft.wiki.gg Classic pages. **WH**: wowhead.com/classic spell pages. **VM**: vmangos 1.12 scripts.

Global findings:
- **Tranquilizing Shot.** Every Tranq-removable boss buff is logged as **"Enrage"**, not "Frenzy" (LOG, dispelled only by Tranquilizing Shot). The observed IDs are Magmadar 19451, Chromaggus 23128, Flamegor 23342, Huhuran 26051 and Gluth 28371. Two trash mobs also have one: Death Talon Seether 22428 and Qiraji Slayer 26041.
  - No other boss in these raids showed a Tranq-able enrage in the logs.
  - Not Tranq-able: Faerlina (WIKI), Sartura, Kurinnaxx, Mandokir, Patchwerk, Chromaggus's 20% enrage (WIKI and WH comments).
  - Hakkar's Aspect of Thekal and Thekal's phase 2 enrage appear on old community "tranq target" lists. They are unconfirmed for Era and absent from the logs (this guild kills priests first). Flag them as uncertain.
- **Dispel types confirmed by LOG.** A dispel type below is confirmed when the logs show the matching dispel spells removing it.
  - Curses: Life Drain (Sapphiron), Nefarian's Veil of Shadow 22687 (curse, so mages/druids remove it, not priests), Delusions of Jin'do.
  - Diseases: Mutating Injection, Brood Affliction: Red, Decrepit Fever.
  - Poisons: Huhuran's Wyvern Sting 26180, Viscidus's Poison Bolt Volley, Toxic Volley, Venom Spit, Poisonous Blood, Deathbloom.
  - Magic: Panic, Impending Doom, Ignite Mana, Magma Shackles, Cripple, Widow's Embrace, Hex.

---

## Molten Core

### Lucifron
- **Confirmed** (LOG and WIKI):
  - "Impending Doom" (19702) is magic and deals 2000 shadow after 10 s.
  - "Lucifron's Curse" (19703) is a curse.
  - "Shadow Shock" (19460).
  - Protector "Dominate Mind" (20604) is removed only by Dispel Magic (LOG: 128 Dispel Magic, 0 Cleanse).
  - Protector "Cleave" (20605).
- **Missing**: none.

### Magmadar
- **Confirmed**:
  - "Panic" (19408) is magic (LOG: Dispel Magic and Cleanse).
  - Tranq removes "Enrage" (19451).
  - "Lava Breath" (19272/21333) and "Magma Spit" (19450).
  - The ground fire is "Conflagration" (19428), and its source attribution is broken (it showed "Conflict Assessor").
- **Wrong (mechanics.js)**: `lava` lists "Lava Bomb". LOG has no damage event named Lava Bomb; 19411 is the cast only. Harmless, because "Conflagration" carries the count.

### Gehennas
- **Confirmed**:
  - "Gehennas' Curse" (19716) is a curse.
  - "Rain of Fire" (19717).
  - "Shadow Bolt" (19728/19729).
  - Flamewaker "Fist of Ragnaros" (20277), "Strike" (19730) and "Sunder Armor".

### Garr
- **Confirmed**:
  - "Antimagic Pulse" (19492).
  - "Magma Shackles" (19496) is magic (LOG).
  - Firesworn "Immolate" (15732) is magic.
  - "Separation Anxiety" (WIKI: adds enrage if pulled too far from Garr).
- **Uncertain in our file**: "Garr enrage stacks per Firesworn death". WIKI only mentions an "enrage buff" being lost on leaving combat (patch 1.3.0). Keep it flagged as unverified.

### Baron Geddon
- **Confirmed** (WIKI and LOG):
  - Living Bomb (20475) explodes 8 s after it is applied for 3200 fire.
  - Inferno (19695 cast, 19698 damage) lasts 8 s and Geddon cannot move during it.
  - Ignite Mana (19659) is magic and burns 400 mana every 3 s for 5 min.
  - Armageddon (20478) does 8000 fire.
- **Missing in .md**: the bomb's damage is logged as **"Explosion" (20476)**, and its source is the bomb carrier (a player), not Geddon. Typical hits are 2880-3590. mechanics.js already uses "Explosion" correctly. Add this to the .md so "Explosion" deaths from a player source are not read as friendly fire.

### Shazzrah
- **Wrong (.md)**: "Blink (also seen named 'Gate of Shazzrah' in some guides)". In LOG the teleport is **"Gate of Shazzrah" (23138)**. Use that name.
- **Confirmed**:
  - "Arcane Explosion" (19712): 20 yd radius, roughly 800-1075 damage (WH, WIKI).
  - "Shazzrah's Curse" (19713): +100% damage taken, 5 min, curse (WH).
  - "Magic Grounding" (19714) is the real log name, removed with Dispel Magic (LOG 22). "Deaden Magic" does not appear in the logs.
- **Interruptible?**
  - WH lists a 0.5 s cast for Arcane Explosion, but in LOG it was **never** interrupted (0 of thousands of casts, against 232 interrupts of Skeram's AE).
  - Treat it as effectively not interruptible. Don't build "missed kicks" analysis on it.
  - The .md does not claim it is interruptible, so this is fine.

### Sulfuron Harbinger
- **Confirmed**:
  - "Dark Mending" (19775) is interruptible (LOG 257 interrupts).
  - Shadow Word: Pain (19776) and Immolate (20294) are magic and dispellable.
  - "Hand of Ragnaros" (19780), "Flame Spear" (19781), "Demoralizing Shout" (19778).
- **Missing**: Sulfuron's "Throw" (19785) appears in LOG.
- **Wrong (mechanics.js)**: the `kick` key lists "Shadow Word: Pain" and "Immolate" under the label "Priest heals interrupted". LOG shows only Dark Mending interrupted. Keep only "Dark Mending".

### Golemagg
- **Confirmed**:
  - "Magma Splash" (13880), "Pyroblast" (20228), "Earthquake" (19798).
  - Core Rager "Mangle" (19820).
- **Missing**: none important.

### Majordomo Executus
- **Confirmed** (WIKI):
  - Magic Reflection and Damage Shield (21075) each last 10 s.
  - Teleport into the coals (logged as "Fire").
  - Aegis of Ragnaros absorbs 30k.
  - Elite "Blast Wave" (20229), "Fire Blast" (20623), "Fireball" (20420).
  - Healer "Shadow Shock" (20603) and "Shadow Bolt" (21077).
- **Sharpen**: "CC stops working after several adds have died" should be specific. WIKI: Polymorph is disabled after **4** adds die (Season of Mastery: 2), and Healers become sheep-immune if pulled too far from Executus.
- **Uncertain**: "Great Heal/heals on allies" for Flamewaker Healer. WIKI lists only Shadow Shock. Unverified.

### Ragnaros
- **Confirmed**:
  - "Wrath of Ragnaros" (20566) and "Elemental Fire" (20564): 2160-2640 + 600/s for 8 s.
  - "Magma Blast": 6000, cast only when nobody is in melee.
  - "Melt Weapon" (21388), "Lava Burst" (21158), "Intense Heat" (21155, from "Flame of Ragnaros").
  - Submerge at 3:00 with 8 Sons; he returns after 90 s or when the Sons die, and banished Sons count as dead (WIKI).
- **Missing**: none.

## Onyxia
- **Confirmed** by WIKI (Onyxia (Classic)) and LOG:
  - Phases at 65% and 40%.
  - Immune to Taunt, Challenging Shout and Mocking Blow.
  - Knock Away (19633) reduces threat by 25%.
  - Wing Buffet does **not** reduce threat (unlike the BWL drakes).
  - Bellowing Roar (18431) every 10-30 s.
  - Eruption (17731) in phase 3, after the fear.
  - The Fireball threat wipe is unconfirmed (the wiki says "research suggests").
  - "Flame Lash" (18958) is dispelled a lot, but it is Onyxian Warder trash.
- **Wrong (mechanics.js)**: the `eruption` note says "Eruption in phase 2". It is **phase 3**.

## Blackwing Lair

### Razorgore the Untamed
- **Confirmed** (LOG): "Conflagration" (23023), "War Stomp" (24375), "Fireball Volley" (22425), "Cleave" (19632).
- Phase 1 adds are logged as "Fireball" (17290, Blackwing Mage, interrupted 670 times).
- Technician "Bomb" (22334) and "Bottle of Poison" (22335, a poison) come from Suppression/trash.

### Vaelastrasz the Corrupt
- **Confirmed**: "Flame Breath" (23461), "Fire Nova" (23462), "Cleave" (19983), "Tail Sweep" (15847), "Burning Adrenaline" (18173).

### Broodlord Lashlayer
- **Confirmed**:
  - "Knock Away" (18670).
  - "Mortal Strike" (24573).
  - "Blast Wave" (23331).
  - "Cleave" (15754).

### Firemaw / Ebonroc / Flamegor
- **Confirmed**:
  - "Shadow Flame" (22539/22682), "Wing Buffet" (23339), "Flame Buffet" (23341), "Shadow of Ebonroc" (23340).
  - Flamegor casts "Fire Nova" (23462) **only while enraged** (WIKI).
- **Wrong/clarify (.md)**: Flamegor's buff is logged as **"Enrage" (23342)**, not "Frenzy". The .md half-says this ("some sources call it Enrage"). State plainly that WCL shows "Enrage" dispelled by Tranquilizing Shot.

### Chromaggus
- **Confirmed** (WIKI and LOG):
  - Breaths: "Incinerate" (23308/23309), "Corrosive Acid" (23313/23314), "Frost Burn" (23187), "Ignite Flesh" (23315/23316), "Time Lapse".
  - One breath every 30 s, alternating.
  - Affliction dispel types: Red is a disease, Green a poison, Blue magic, Black a curse. Bronze can only be removed with Hourglass Sand or Ice Block.
  - Tranq-able Frenzy every 10-15 s.
  - Permanent 20% enrage, which is not Tranq-able.
- **Clarify (.md)**: the Tranq-able buff is logged as **"Enrage" (23128)**.

### Nefarian
- **Confirmed** (LOG):
  - "Shadow Flame" (many IDs), "Bellowing Roar" (22686), "Tail Lash" (23364), "Cleave" (19983), "Veil of Shadow" (22687).
  - Lord Victor Nefarius: "Shadow Command" (22667, mind control), "Shadowblink", "Silence" (22666), "Fear" (22678).
  - Class calls in the log: "Corrupted Healing" (23401/23402, priest), "Wild Polymorph" (23603, magic), "Wild Magic" (23410, mage), "Involuntary Transformation" (23398, druid cat form), "Corrupted Infernal" with "Infernal Awakening" and "Immolation" (warlock).
- **Wrong (.md)**: "Veil of Shadow ... dispel it". It is a **curse**: LOG shows only Remove Curse and Remove Corruption removing it. Mages and druids own it.
- **Wrong (mechanics.js)**, `classcall` key:
  - "Curse of Shadows" does not exist.
  - "Hunter's Call" and "Druid's Call" never appear in the log.
  - "Bone Construct" is an NPC, not a debuff.
  - "Burning Adrenaline" is Vaelastrasz's ability.
  - Replace the list with: Corrupted Healing, Wild Polymorph, Wild Magic, Involuntary Transformation, Shadow Command.

## Zul'Gurub

### High Priest Venoxis
- **Wrong (.md + mechanics.js)**: the Holy Wrath chain is logged as **"Ancient Power" (23979)**, with source Venoxis.
  - WH names spell 23979 "Holy Wrath", but WCL prints "Ancient Power". LOG shows chain hits escalating from 270 to 5377, which matches the WIKI description (+30% per jump).
  - The .md's "Holy Wrath" will never match the log.
  - Add an "Ancient Power" hit to mechanics.js (tone bad: bad spacing).
- **Confirmed**:
  - "Holy Fire" (23860) is magic.
  - "Holy Nova" (23858).
  - "Poison Cloud" (23861).
  - "Venom Spit" (24011) is a poison, and it is interrupted or stunned 49 times in LOG.
  - "Virulent Poison" (22412).
  - Cobra "Poison" (24097).
  - Snake form at 50%; Parasitic Serpents at 25%, and their DoT is not dispellable (WIKI).

### High Priestess Jeklik
- **Confirmed**: "Sonic Burst" (23918), "Swoop" (23919), "Charge" (22911), "Blood Leech" (22644), "Psychic Scream" (22884), "Shadow Word: Pain" (23952), "Curse of Blood" (24673, a curse).

### High Priestess Mar'li
- **Confirmed**: "Poison Bolt Volley" (24099, a poison), "Drain Life" (24300, interruptible: 11 interrupts in LOG), Spawn "Poison" (19448).

### Bloodlord Mandokir
- **Wrong (.md)**: "exact log name of the killing hit is uncertain". It is **"Guillotine" (24316)** (LOG: a 9075 hit; WIKI: about 15,000 physical).
  - Sequence: "Threatening Gaze" (24314, 6 s) → the gazed player takes any action → "Charge" (24408) → "Guillotine".
  - WIKI says "any action"; Icy Veins says no moving, casting or attacking. The site's "stand still or die" is right.
- **Wrong (.md)**: "Intimidating Shout". LOG shows **"Frightening Shout" (19134)**. WIKI says Intimidating Shout, but the log name is what counts.
- **Missing**:
  - "Overpower" (24407): about 2200 on the tank after a dodge.
  - "Execute" below 20% (WIKI, about 5000).
  - Level Up happens per 3 player deaths (confirmed). No "Level Up" string appears in LOG, so it is likely visible only as an emote or buff.
  - Ohgan "Sunder Armor" (24317).

### High Priest Thekal
- **Confirmed** (LOG):
  - Thekal: "Mortal Cleave" (22859), "Silence" (22666), "Force Punch" (24189), "Speed Slash" (24192), "Summon Zulian Guardians".
  - Zath: "Blind", "Gouge", "Kick", "Sinister Strike", "Sweeping Strikes".
  - Lor'Khan: "Disarm", "Lightning Shield".
- **Uncertain**: whether Thekal's tiger-phase enrage is Tranq-able (it is on old community lists; unverified for Era).

### Arlokk / Jin'do / Hakkar / Edge of Madness
- **Confirmed** (LOG):
  - Arlokk: "Gouge" (12540), "Shadow Word: Pain" (24212).
  - Jin'do: "Hex" (17172 cast; the 24053 debuff is magic), "Delusions of Jin'do" (24306, a curse), Shade "Shadow Shock" (24458), "Summon Brain Wash Totem".
  - Hakkar: "Corrupted Blood" (24328), "Poisonous Blood" (24321, a poison, cleansed 434 times in LOG; only curing it *before* a Blood Siphon is a mistake).
  - Edge of Madness: Hazza'rah "Chain Burn" (24684, not "Mana Burn"), Wushoolay "Chain Lightning" / "Forked Lightning" / "Lightning Cloud".
- **Uncertain**: whether Hakkar's Aspect of Thekal is Tranq-able. Old community tranq lists include Hakkar; there is no Era confirmation.

## AQ40

### The Prophet Skeram
- **Confirmed**: "Arcane Explosion" (26192) is interruptible (LOG 232 interrupts) and "Earth Shock" (26194).

### Silithid Royalty
- **Wrong (.md)**: Vem's charge is **"Berserker Charge" (26561)**, not "Charge".
- **Confirmed**:
  - "Toxic Volley" (25812) is a poison.
  - "Toxic Vapors" (25786); its source is **"Poison Cloud"**, not Kri.
  - Yauj "Fear" (26580) is magic and dispellable.
  - "Ravage" (3242).
  - Yauj "Great Heal" (25807) is interruptible (LOG 62). "Dispel" (25808) was also interrupted 24 times in LOG.
  - Vem "Knock Away" (18670) and "Knockdown" (19128).
  - Brood "Head Butt" (25788).

### Battleguard Sartura
- **Confirmed**: Sartura's "Whirlwind" is 26084 and the guards' is 26686; "Sundering Cleave" (25174); guard "Knockback" (26027).

### Fankriss
- **Confirmed**: "Mortal Wound" and "Entangle" debuffs exist in LOG (SITE counts > 0).

### Viscidus
- **Confirmed**: "Poison Bolt Volley" (25991, a poison), "Poison Shock" (25993), "Toxin" (25989); the Toxin source is "Toxic Slime".

### Princess Huhuran
- **Wrong (.md)**: the berserk spam is **"Poison Bolt" (26052)**, not "Poison Bolt Volley". mechanics.js already uses "Poison Bolt".
  - LOG: 97% of hits land on fury warriors, which is consistent with "15 closest".
  - WIKI: it is also fired when a Frenzy is not tranquilized, about 5 s after the Frenzy.
- **Wrong (.md)**: "Wyvern Sting" (26180) is a **poison**. LOG shows it removed by Cleanse, Abolish Poison and Cure Poison. Shamans and druids can remove it, not only paladins. Dispelling it deals about 3k (WIKI).
- **Clarify**:
  - The Tranq-able buff is logged as **"Enrage" (26051)**.
  - Berserk (26068) at **30%** is confirmed (WIKI, VM <31%).
  - The "or after 5 min" timer exists only in the vmangos script. WIKI and guides do not mention it. Mark it as unverified.

### Twin Emperors
- **Wrong (mechanics.js)**: the `bugs` hit uses "Explode Bug". That is only Vek'lor's cast (804, type 8). The damage is **"Explode" (26059)**, with the bug as source. SITE count is 0 across all nights, so the key never fires. Change it to "Explode".
- **Confirmed**:
  - "Arcane Burst" (568), "Blizzard" (26607), "Shadow Bolt" (26006).
  - "Uppercut" (26007), "Unbalancing Strike" (26613).
  - "Mutate Bug" (802), "Heal Brother", "Twin Teleport".
  - Bug "Virulent Poison" (22412).

### Ouro / C'Thun
- **Confirmed**:
  - Ouro: "Sand Blast" (26102), "Sweep" (26103), Dirt Mound "Quake" (26093).
  - C'Thun: "Eye Beam" (26134; also 341722 in Era, a Classic hotfix ID), "Dark Glare" (26029), "Digestive Acid" (26476), Eye Tentacle "Mind Flay" (26143, interruptible), "Ground Rupture" (26139/26478), "Ground Tremor", "Hamstring".

## AQ20
- There are no AQ20 reports in LOG, so names are not log-verified. Nothing found contradicts the .md, but treat AQ20 ability names as **unverified**.

## Naxxramas

### Anub'Rekhan
- **Confirmed**: "Impale" (28783); Crypt Guard "Acid Spit" (28969), "Web" (28991), "Cleave".

### Grand Widow Faerlina
- **Confirmed**:
  - "Poison Bolt Volley" (28796) is a poison.
  - "Rain of Fire" (28794).
  - "Widow's Embrace" (28732) is a magic debuff.
  - Follower "Silence" (30225).
  - Her Enrage is **not** Tranq-able (WIKI).
- **Wrong (.md)**: Follower "charges random players". In LOG that charge is **"Berserker Charge" (22886)**.

### Maexxna
- **Confirmed**:
  - "Poison Shock" (28741) is a **frontal cone**, 15 yd, 1750-2250 nature (WIKI). LOG agrees: only warriors are hit, 81% protection tanks.
  - "Web Spray" (29484): 8 s per WIKI; the .md's "6-8 s" is fine.
  - "Web Wrap" hits 3 players at 20 s and then every 40 s.
  - Enrage at 30%.
  - "Necrotic Poison" (28776) is a poison.

### Noth / Heigan
- **Confirmed**:
  - Noth: "Cripple" (29212) is magic, "Curse of the Plaguebringer" (29213) is a curse.
  - Heigan: "Eruption" (29371), "Decrepit Fever" (29998) is a disease, and "Spell Disruption" (29310) is the damaging mana burn (LOG: hits only casters, 1.8-2.6k).

### Loatheb
- **Confirmed** (WIKI):
  - Inevitable Doom (29204): first at about 2:00, 10 s delay, 2550 shadow, then every 30 s, every 15 s from 5:00.
  - Corrupted Mind: 60 s lockout.
  - Loatheb removes curses from himself every 30 s.
  - Fungal Bloom: +50% melee and +60% spell crit, no threat, 90 s, up to 5 players. It is logged as "Fungal Creep".
  - The poison aura is logged as "Deathbloom" (29865).
- **Sharpen (.md)**: WIKI gives the poison aura as 196 damage every 6 s for 12 s, 5 yd range. Spores spawn every 12-13 s (the wiki is inconsistent).

### Instructor Razuvious
- **Confirmed** (WIKI):
  - Disrupting Shout (29107): every 25 s, 45 yd, **line of sight only**, burns 4050-4950 mana and deals 2x that as damage.
  - Unbalancing Strike (26613): 350% weapon damage, -100 defense for 6 s.
  - Understudy Taunt and Shield Wall, Mind Exhaustion 60 s, Hopeless.

### Gothik the Harvester
- **Confirmed** (LOG): living-side Shadow Mark (27825), undead-side abilities, Shadow Bolt (29317).
- **Missing**: Unrelenting Trainee "Eagle Claw" (30285) and "Knockdown" (11428), and Unrelenting Death Knight "Intercept" (20615), appear in LOG.

### The Four Horsemen
- **Confirmed** (WIKI and LOG):
  - Marks every 12 s, first at 20 s, 65 yd, pierce line of sight, 75 s duration.
  - Mark damage by stack: 0 / 250 / 1000 / 3000 / 5000, then +1000 per extra stack.
  - Each Mark is a 50% threat drop on that Horseman.
  - Shield Wall at 50% and 20%.
  - Berserk at 100 marks (about 20 min).
  - **Spirits do keep marking**: LOG has "Mark" damage sourced from "Spirit of Blaumeux". WIKI: the spirit lingers, is rooted, and keeps its abilities.
  - Mograine's mark is "Mark of Rivendare" in LOG; "Mark of Mograine" never appears (harmless in mechanics.js).
  - Mograine's proc is "Unholy Shadow" (28882) in LOG. WIKI calls it Righteous Fire: 25% on hit, 2160-2640 + 4800 over 8 s.
  - Zeliek "Holy Wrath": 495-605, doubles per jump within 10 yd.
  - Blaumeux "Consumption": 3950-4750 per second.
  - Korth'azz "Meteor": 12825-14275, split among players within 8 yd.

### Patchwerk
- **Confirmed** (WIKI): Hateful Strike hits ranks 2-4 on threat, in melee, highest HP (not the main tank); every 1.2 s; 22.1-29.9k before armor.
- **Sharpen (.md)**: Berserk at 7:00 (about 5x damage), then **Slime Bolt at 7:30** (about 25k nature to the raid).

### Grobbulus
- **Confirmed**:
  - Mutating Injection (28169) is a **disease**. LOG: Cleanse 150 and Abolish Disease 7, so priests, paladins and shamans can remove it.
  - Cleansing detonates it early, at the player's current spot.
  - The explosion is "Mutagen Explosion" (28206).
  - Enrage at 12:00.
  - More injections below 30%.
  - Cloud damage is "Poison" (28241) from "Grobbulus Cloud".

### Gluth
- **Confirmed** (WIKI):
  - Frenzy is Tranq-able; it is logged as **"Enrage" (28371)**.
  - Decimate about every 105 s; enrage 10-20 s after the 3rd Decimate.
  - **Not tauntable** (WIKI). The .md's "sources disagree" can be dropped.
  - Terrifying Roar (29685) every 20 s.
- **Note**: "Decimate" has never appeared in LOG (the fast guild kills before it). The mechanics.js key is plausible but unverified against the log.

### Thaddius
- **Confirmed**:
  - "Chain Lightning" (28167), "Shock" from "Tesla Coil" (28099), Feugen "Static Field" (28135), "War Stomp" (28125).
  - "Positive Charge" (28062) and "Negative Charge" (28085) damage is sourced from players.
- **Uncertain**: the same-charge +10% damage per nearby same-charge ally is described on the Classic wiki. That was not verified in LOG; keep it flagged.

### Sapphiron
- **Confirmed**:
  - Life Drain (28542) is a **curse** (WH dispel type; LOG decursed by Remove Curse and Remove Corruption).
  - It drains 1750 per 3 s for 12 s ("Periodically Leech Health") and heals Sapphiron (WIKI).
  - 10 targets every 24 s.
  - Frost Aura is logged as 348191 (Era-specific ID).
  - Air phase at 45 s, then 67 s after each landing, none below 10%; 5 Icebolts.
  - Berserk at 15:00 (Frost Aura x5).
  - Immune to taunt.
- **Wrong/unsupported (.md)**: Life Drain "heals Sapphiron for twice that". No source supports "twice". Say "heals Sapphiron".

### Kel'Thuzad
- **Confirmed**:
  - Both Frostbolts are logged as "Frostbolt": 28478 is the single-target cast (2 s, 9-11k, interruptible; LOG 898 interrupts), 28479 is the volley (instant, not interruptible, 2750-3500, every 15 s). The name "Frostbolt Volley" never appears in LOG.
  - The 28479 slow is magic and is dispelled a little.
  - Chains of Kel'Thuzad: 5 players, 60 s cooldown.
  - Detonate Mana explodes after 4 s.
  - Shadow Fissure: 3 s delay.
  - 5 Guardians; more than 3 shackles makes KT break them all.
  - Phase 3 at 40%.
  - Phase 1 lasts about 228 s in LOG (the wiki says phase 2 starts at 5:10, so LOG beats the wiki for Era).

---

## mechanics.js fix list (exact names)
1. Twin Emperors `bugs`: "Explode Bug" → **"Explode"** (never matches today).
2. Venoxis: add `{kind:"hit", abilities:["Ancient Power"]}` for the Holy Wrath chain (bad spacing).
3. Nefarian `classcall`: drop "Curse of Shadows", "Hunter's Call", "Druid's Call", "Bone Construct", "Burning Adrenaline". Keep Corrupted Healing, Wild Polymorph, Wild Magic, Involuntary Transformation, Shadow Command.
4. Sulfuron `kick`: only "Dark Mending".
5. Onyxia `eruption` note: "phase 3", not phase 2.
6. Optional: Mandokir add a "Guillotine" hit (gaze punish). Vem "Berserker Charge". Huhuran `tranq` stays as-is.
