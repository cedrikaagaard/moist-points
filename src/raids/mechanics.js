// What matters on each boss, as data. Shared by the fetcher (which events to
// pull) and the pages (how to show them). No imports - Node uses it too.
//
// kind:
//   hit    - damage to raiders from these abilities (count of hits per raider)
//   debuff - these debuffs landing on raiders
//   cast   - raiders casting these (Tranq Shot, Mind Control, protection potions)
//   dispel - raiders removing these debuffs
//   kick   - raiders interrupting these spells
// tone: "good"  - more is better (soaks, kicks, decurses) -> a leaderboard of heroes
//       "bad"   - avoidable; fewer is better            -> who got caught + who never did
//       "info"  - just what happened                    -> who it happened to
// note: one short line on why it matters (static copy, shown under the label).

const prot = (school) => ({ key: `${school.toLowerCase()}-prot`, kind: "cast", abilities: [`${school} Protection`], tone: "good", label: `${school} protection potions`, note: "came prepared" });
const tranq = { key: "tranq", kind: "cast", abilities: ["Tranquilizing Shot"], tone: "good", label: "Tranquilizing Shots", note: "removing the frenzy" };

export const MECHANICS = {
  // ---------------- Molten Core ----------------
  50663: [ // Lucifron
    { key: "curse", kind: "dispel", abilities: ["Lucifron's Curse"], tone: "good", label: "Lucifron's Curse removed", note: "decursing the raid" },
    { key: "doom", kind: "dispel", abilities: ["Impending Doom"], tone: "good", label: "Impending Doom dispelled", note: "before it blew" },
    { key: "mc", kind: "debuff", abilities: ["Dominate Mind"], tone: "info", label: "Mind-controlled", note: "by a Flamewaker Protector" },
  ],
  50664: [ // Magmadar
    tranq,
    { key: "panic", kind: "debuff", abilities: ["Panic"], tone: "info", label: "Feared by Panic", note: "running around screaming" },
    { key: "lava", kind: "hit", abilities: ["Lava Bomb", "Conflagration"], tone: "bad", label: "Stood in Lava Bomb fire", note: "move out of the fire" },
  ],
  50665: [ // Gehennas
    { key: "curse", kind: "dispel", abilities: ["Gehennas' Curse"], tone: "good", label: "Gehennas' Curse removed", note: "healing back to full strength" },
    { key: "rof", kind: "hit", abilities: ["Rain of Fire"], tone: "bad", label: "Stood in Rain of Fire", note: "move out of the fire" },
  ],
  50668: [ // Baron Geddon
    { key: "bomb", kind: "debuff", abilities: ["Living Bomb"], tone: "info", label: "Was the Living Bomb", note: "run out, explode alone" },
    { key: "explosion", kind: "hit", abilities: ["Explosion"], tone: "bad", label: "Caught in a Living Bomb", note: "someone didn't run far enough" },
    { key: "inferno", kind: "hit", abilities: ["Inferno"], tone: "bad", label: "Hit by Inferno", note: "melee out during Inferno" },
    { key: "ignite", kind: "dispel", abilities: ["Ignite Mana"], tone: "good", label: "Ignite Mana dispelled", note: "saving the casters' mana" },
  ],
  50667: [ // Shazzrah
    { key: "curse", kind: "dispel", abilities: ["Shazzrah's Curse"], tone: "good", label: "Shazzrah's Curse removed", note: "decursing the raid" },
    { key: "ae", kind: "hit", abilities: ["Arcane Explosion"], tone: "info", label: "Arcane Explosion hits", note: "after every Blink" },
  ],
  50669: [ // Sulfuron
    { key: "kick", kind: "kick", abilities: ["Dark Mending"], tone: "good", label: "Priest heals interrupted", note: "no Dark Mending allowed" },
  ],
  50672: [ // Ragnaros
    { key: "wrath", kind: "hit", abilities: ["Wrath of Ragnaros"], tone: "info", label: "Knocked back", note: "melee get thrown by Wrath of Ragnaros" },
    { key: "lava", kind: "hit", abilities: ["Lava Burst"], tone: "bad", label: "Hit by Lava Burst", note: "the eruptions under the raid" },
    { key: "elemental", kind: "hit", abilities: ["Elemental Fire"], tone: "info", label: "Elemental Fire", note: "melee taking the burn" },
    prot("Fire"),
  ],

  // ---------------- Onyxia ----------------
  51084: [
    { key: "breath", kind: "hit", abilities: ["Flame Breath"], tone: "bad", label: "Stood in front", note: "stay at her sides" },
    { key: "deep", kind: "hit", abilities: ["Deep Breath", "Breath"], tone: "bad", label: "Caught by Deep Breath", note: "phase 2, get out of the line" },
    { key: "eruption", kind: "hit", abilities: ["Eruption"], tone: "bad", label: "Lava cracks", note: "Eruption in phase 3" },
    { key: "fear", kind: "debuff", abilities: ["Bellowing Roar"], tone: "info", label: "Feared", note: "Bellowing Roar in phase 3" },
    prot("Fire"),
  ],

  // ---------------- Blackwing Lair ----------------
  50610: [ // Razorgore
    { key: "volley", kind: "hit", abilities: ["Fireball Volley"], tone: "info", label: "Fireball Volley hits", note: "phase 2" },
    { key: "conflag", kind: "debuff", abilities: ["Conflagration"], tone: "info", label: "Conflagrated", note: "disoriented and burning" },
  ],
  50611: [ // Vaelastrasz
    { key: "adrenaline", kind: "debuff", abilities: ["Burning Adrenaline"], tone: "info", label: "Burning Adrenaline", note: "run out and blow up alone" },
    { key: "breath", kind: "hit", abilities: ["Flame Breath"], tone: "bad", label: "Stood in front", note: "Flame Breath" },
    prot("Fire"),
  ],
  50612: [ // Broodlord
    { key: "blast", kind: "hit", abilities: ["Blast Wave"], tone: "info", label: "Blast Wave hits", note: "" },
    { key: "ms", kind: "debuff", abilities: ["Mortal Strike"], tone: "info", label: "Mortal Strikes taken", note: "tanks eating the big hits" },
  ],
  50613: [ // Firemaw
    { key: "shadowflame", kind: "hit", abilities: ["Shadow Flame"], tone: "info", label: "Shadow Flame hits", note: "Onyxia Scale Cloak saves lives" },
    { key: "buffet", kind: "debuff", abilities: ["Flame Buffet"], tone: "info", label: "Flame Buffet stacks", note: "line of sight to drop them" },
    prot("Fire"),
  ],
  50614: [ // Ebonroc
    { key: "shadowflame", kind: "hit", abilities: ["Shadow Flame"], tone: "info", label: "Shadow Flame hits", note: "Onyxia Scale Cloak saves lives" },
    { key: "shadow", kind: "debuff", abilities: ["Shadow of Ebonroc"], tone: "info", label: "Shadow of Ebonroc", note: "the tank swap" },
  ],
  50615: [ // Flamegor
    tranq,
    { key: "shadowflame", kind: "hit", abilities: ["Shadow Flame"], tone: "info", label: "Shadow Flame hits", note: "Onyxia Scale Cloak saves lives" },
    { key: "nova", kind: "hit", abilities: ["Fire Nova"], tone: "info", label: "Fire Nova hits", note: "frenzy left up too long" },
  ],
  50616: [ // Chromaggus
    tranq,
    { key: "bronze", kind: "debuff", abilities: ["Brood Affliction: Bronze"], tone: "info", label: "Bronze affliction", note: "only a Hourglass Sand cures it" },
    { key: "afflictions", kind: "dispel", abilities: ["Brood Affliction: Red", "Brood Affliction: Blue", "Brood Affliction: Black", "Brood Affliction: Green"], tone: "good", label: "Afflictions cleansed", note: "five stacks and you're a dragonkin" },
    { key: "breaths", kind: "hit", abilities: ["Time Lapse", "Corrosive Acid", "Ignite Flesh", "Incinerate", "Frost Burn"], tone: "bad", label: "Hit by a breath", note: "hide behind the door" },
  ],
  50617: [ // Nefarian
    { key: "shadowflame", kind: "hit", abilities: ["Shadow Flame"], tone: "info", label: "Shadow Flame hits", note: "Onyxia Scale Cloak saves lives" },
    { key: "fear", kind: "debuff", abilities: ["Bellowing Roar"], tone: "info", label: "Feared", note: "Fear Ward and Tremor help" },
    { key: "classcall", kind: "debuff", abilities: ["Corrupted Healing", "Wild Polymorph", "Wild Magic", "Involuntary Transformation", "Shadow Command"], tone: "info", label: "Class calls", note: "Nefarian picking on a class" },
    { key: "veil", kind: "dispel", abilities: ["Veil of Shadow"], tone: "good", label: "Veil of Shadow removed", note: "so the tank can be healed" },
    { key: "fw", kind: "cast", abilities: ["Fear Ward"], tone: "good", label: "Fear Wards", note: "keeping the tank in place" },
  ],

  // ---------------- Zul'Gurub ----------------
  50784: [ // Venoxis
    { key: "chain", kind: "hit", abilities: ["Ancient Power"], tone: "bad", label: "Hit by the Holy Wrath chain", note: "it grows with every jump: spread out (logged as Ancient Power)" },
    { key: "cloud", kind: "hit", abilities: ["Poison Cloud"], tone: "bad", label: "Stood in Poison Cloud", note: "" },
    { key: "fire", kind: "dispel", abilities: ["Holy Fire"], tone: "good", label: "Holy Fire dispelled", note: "" },
  ],
  50785: [ // Jeklik
    { key: "burst", kind: "hit", abilities: ["Sonic Burst"], tone: "info", label: "Sonic Burst hits", note: "" },
    { key: "kick", kind: "kick", abilities: ["Great Heal"], tone: "good", label: "Great Heal interrupted", note: "no heals for the bat" },
  ],
  50786: [ // Mar'li
    { key: "volley", kind: "hit", abilities: ["Poison Bolt Volley"], tone: "info", label: "Poison Bolt Volley hits", note: "" },
    { key: "webs", kind: "debuff", abilities: ["Enveloping Webs"], tone: "info", label: "Webbed", note: "" },
  ],
  50787: [ // Mandokir
    { key: "gaze", kind: "debuff", abilities: ["Threatening Gaze"], tone: "info", label: "Got the Gaze", note: "stand still or die" },
    { key: "ww", kind: "hit", abilities: ["Whirlwind"], tone: "bad", label: "Hit by Whirlwind", note: "melee out" },
  ],
  50789: [ // Thekal
    { key: "silence", kind: "debuff", abilities: ["Silence"], tone: "info", label: "Silenced", note: "" },
  ],
  50791: [ // Arlokk
    { key: "mark", kind: "debuff", abilities: ["Mark of Arlokk"], tone: "info", label: "Marked", note: "the panthers' favourite" },
  ],
  50792: [ // Jin'do
    { key: "hex", kind: "dispel", abilities: ["Hex"], tone: "good", label: "Hexes dispelled", note: "" },
    { key: "delusions", kind: "dispel", abilities: ["Delusions of Jin'do"], tone: "good", label: "Delusions removed", note: "decursing" },
  ],
  50793: [ // Hakkar
    { key: "blood", kind: "debuff", abilities: ["Corrupted Blood"], tone: "info", label: "Corrupted Blood", note: "spreading the plague" },
    { key: "insanity", kind: "debuff", abilities: ["Cause Insanity"], tone: "info", label: "Mind-controlled", note: "Cause Insanity" },
  ],

  // ---------------- AQ40 ----------------
  50709: [ // Skeram
    { key: "mc", kind: "debuff", abilities: ["True Fulfillment"], tone: "info", label: "Mind-controlled", note: "True Fulfillment" },
    { key: "ae", kind: "hit", abilities: ["Arcane Explosion"], tone: "info", label: "Arcane Explosion hits", note: "" },
    { key: "kick", kind: "kick", abilities: ["Arcane Explosion"], tone: "good", label: "Arcane Explosions kicked", note: "" },
  ],
  50710: [ // Silithid Royalty
    { key: "vapors", kind: "hit", abilities: ["Toxic Vapors"], tone: "bad", label: "Stood in Toxic Vapors", note: "Kri's death cloud" },
    { key: "volley", kind: "hit", abilities: ["Toxic Volley"], tone: "info", label: "Toxic Volley hits", note: "" },
    { key: "fear", kind: "debuff", abilities: ["Fear"], tone: "info", label: "Feared by Yauj", note: "" },
  ],
  50711: [ // Sartura
    { key: "ww", kind: "hit", abilities: ["Whirlwind"], tone: "bad", label: "Hit by Whirlwind", note: "stay out of the spin" },
  ],
  50712: [ // Fankriss
    { key: "wound", kind: "debuff", abilities: ["Mortal Wound"], tone: "info", label: "Mortal Wound stacks", note: "tanks swapping" },
    { key: "entangle", kind: "debuff", abilities: ["Entangle"], tone: "info", label: "Entangled", note: "" },
  ],
  50713: [ // Viscidus
    { key: "volley", kind: "hit", abilities: ["Poison Bolt Volley"], tone: "info", label: "Poison Bolt Volley hits", note: "nature resistance helps" },
    { key: "toxin", kind: "hit", abilities: ["Toxin"], tone: "bad", label: "Stood in Toxin", note: "the clouds he leaves" },
    prot("Nature"),
  ],
  50714: [ // Huhuran
    tranq,
    { key: "bolt", kind: "hit", abilities: ["Poison Bolt"], tone: "good", label: "Poison Bolts soaked", note: "the nature-resist soakers" },
    { key: "sting", kind: "debuff", abilities: ["Wyvern Sting"], tone: "info", label: "Wyvern Stung", note: "" },
    prot("Nature"),
  ],
  50715: [ // Twin Emperors
    { key: "burst", kind: "hit", abilities: ["Arcane Burst"], tone: "bad", label: "Hit by Arcane Burst", note: "too close to Vek'lor" },
    { key: "blizzard", kind: "hit", abilities: ["Blizzard"], tone: "bad", label: "Stood in Blizzard", note: "" },
    { key: "bugs", kind: "hit", abilities: ["Explode"], tone: "bad", label: "Hit by exploding bugs", note: "" },
  ],
  50716: [ // Ouro
    { key: "sweep", kind: "hit", abilities: ["Sweep"], tone: "info", label: "Swept", note: "knocked back" },
    { key: "sand", kind: "hit", abilities: ["Sand Blast"], tone: "bad", label: "Sand Blasted", note: "stay out of the front" },
  ],
  50717: [ // C'Thun
    { key: "beam", kind: "hit", abilities: ["Eye Beam"], tone: "bad", label: "Hit by Eye Beam", note: "spread out" },
    { key: "glare", kind: "hit", abilities: ["Dark Glare"], tone: "bad", label: "Caught by Dark Glare", note: "the death ray" },
    { key: "stomach", kind: "debuff", abilities: ["Digestive Acid"], tone: "info", label: "Went to the stomach", note: "eaten by C'Thun" },
  ],

  // ---------------- Naxxramas ----------------
  51107: [ // Anub'Rekhan
    { key: "impale", kind: "hit", abilities: ["Impale"], tone: "bad", label: "Impaled", note: "don't stand in the line" },
    { key: "swarm", kind: "hit", abilities: ["Locust Swarm"], tone: "bad", label: "Caught in Locust Swarm", note: "kite it" },
  ],
  51110: [ // Faerlina
    { key: "mc", kind: "cast", abilities: ["Mind Control"], tone: "good", label: "Worshippers mind-controlled", note: "Widow's Embrace for the boss" },
    { key: "rof", kind: "hit", abilities: ["Rain of Fire"], tone: "bad", label: "Stood in Rain of Fire", note: "" },
    { key: "volley", kind: "dispel", abilities: ["Poison Bolt Volley"], tone: "good", label: "Poison cleansed", note: "Poison Bolt Volley" },
  ],
  51116: [ // Maexxna
    { key: "wrap", kind: "debuff", abilities: ["Web Wrap"], tone: "info", label: "Web Wrapped", note: "thrown into the wall" },
    { key: "spray", kind: "debuff", abilities: ["Web Spray"], tone: "info", label: "Web Sprayed", note: "" },
    { key: "poison", kind: "dispel", abilities: ["Necrotic Poison"], tone: "good", label: "Necrotic Poison cleansed", note: "off the tank" },
  ],
  51117: [ // Noth
    { key: "curse", kind: "dispel", abilities: ["Curse of the Plaguebringer"], tone: "good", label: "Plaguebringer curses removed", note: "before they spread" },
    { key: "wrath", kind: "hit", abilities: ["Wrath of the Plaguebringer"], tone: "bad", label: "Hit by Wrath of the Plaguebringer", note: "a curse that wasn't removed" },
  ],
  51112: [ // Heigan
    { key: "eruption", kind: "hit", abilities: ["Eruption"], tone: "bad", label: "Hit by Eruption", note: "the dance" },
    { key: "fever", kind: "dispel", abilities: ["Decrepit Fever"], tone: "good", label: "Decrepit Fever cured", note: "" },
  ],
  51115: [ // Loatheb
    { key: "doom", kind: "hit", abilities: ["Inevitable Doom"], tone: "info", label: "Inevitable Doom", note: "the big shadow ticks" },
    { key: "spores", kind: "debuff", abilities: ["Fungal Creep", "Fungal Bloom"], tone: "good", label: "Got a spore", note: "crit buff from killing the spores" },
    prot("Shadow"),
  ],
  51118: [ // Patchwerk
    { key: "hateful", kind: "hit", abilities: ["Hateful Strike"], tone: "good", label: "Hateful Strikes soaked", note: "the off-tanks taking the big hits" },
  ],
  51111: [ // Grobbulus
    { key: "injection", kind: "debuff", abilities: ["Mutating Injection"], tone: "info", label: "Got Mutating Injection", note: "run to the edge" },
    { key: "spray", kind: "hit", abilities: ["Slime Spray"], tone: "bad", label: "Slime Sprayed", note: "stand behind him" },
    { key: "cloud", kind: "hit", abilities: ["Poison"], tone: "bad", label: "Stood in a poison cloud", note: "the clouds he leaves behind" },
    { key: "cleanse", kind: "dispel", abilities: ["Mutating Injection"], tone: "info", label: "Injections dispelled", note: "" },
  ],
  51108: [ // Gluth
    tranq,
    { key: "decimate", kind: "hit", abilities: ["Decimate"], tone: "info", label: "Decimated", note: "down to 5% health" },
    { key: "wound", kind: "debuff", abilities: ["Mortal Wound"], tone: "info", label: "Mortal Wound stacks", note: "tank swaps" },
  ],
  51120: [ // Thaddius
    { key: "polarity", kind: "hit", abilities: ["Positive Charge", "Negative Charge"], tone: "bad", label: "Wrong side of the polarity", note: "stand with your own charge" },
    { key: "chain", kind: "hit", abilities: ["Chain Lightning"], tone: "info", label: "Chain Lightning hits", note: "" },
  ],
  51113: [ // Razuvious
    { key: "mc", kind: "cast", abilities: ["Mind Control"], tone: "good", label: "Understudies mind-controlled", note: "the priests tanking the boss" },
    { key: "shout", kind: "hit", abilities: ["Disrupting Shout"], tone: "info", label: "Disrupting Shout hits", note: "" },
  ],
  51109: [ // Gothik
    { key: "volley", kind: "hit", abilities: ["Shadow Bolt Volley", "Shadow Mark"], tone: "info", label: "Shadow hits", note: "from the undead side" },
  ],
  51121: [ // Four Horsemen
    { key: "marks", kind: "debuff", abilities: ["Mark of Korth'azz", "Mark of Blaumeux", "Mark of Rivendare", "Mark of Mograine", "Mark of Zeliek"], tone: "info", label: "Marks taken", note: "rotating before the stacks kill you" },
    { key: "void", kind: "hit", abilities: ["Consumption", "Void Zone"], tone: "bad", label: "Stood in a Void Zone", note: "logged as Consumption" },
    { key: "meteor", kind: "hit", abilities: ["Meteor"], tone: "good", label: "Meteors soaked", note: "share the damage" },
    { key: "wrath", kind: "hit", abilities: ["Holy Wrath"], tone: "info", label: "Holy Wrath hits", note: "Zeliek's chain" },
  ],
  51119: [ // Sapphiron
    { key: "icebolt", kind: "debuff", abilities: ["Icebolt"], tone: "info", label: "Iceblocked", note: "everyone hides behind them" },
    { key: "breath", kind: "hit", abilities: ["Frost Breath"], tone: "bad", label: "Caught by Frost Breath", note: "didn't hide behind an ice block" },
    { key: "chill", kind: "hit", abilities: ["Chill"], tone: "bad", label: "Stood in the blizzard", note: "Chill" },
    { key: "drain", kind: "dispel", abilities: ["Life Drain"], tone: "good", label: "Life Drain removed", note: "decursing the raid" },
    prot("Frost"),
  ],
  51114: [ // Kel'Thuzad
    { key: "kick", kind: "kick", abilities: ["Frostbolt"], tone: "good", label: "Frostbolts interrupted", note: "the one-shot on the tank" },
    { key: "blast", kind: "debuff", abilities: ["Frost Blast"], tone: "info", label: "Frost Blasted", note: "frozen in place, drained" },
    { key: "chains", kind: "debuff", abilities: ["Chains of Kel'Thuzad"], tone: "info", label: "Mind-controlled", note: "Chains of Kel'Thuzad" },
    { key: "detonate", kind: "debuff", abilities: ["Detonate Mana", "Mana Detonation"], tone: "info", label: "Mana Detonation", note: "run out of the raid" },
    { key: "fissure", kind: "hit", abilities: ["Shadow Fissure", "Void Blast"], tone: "bad", label: "Stood in a Shadow Fissure", note: "move!" },
    { key: "shackle", kind: "cast", abilities: ["Shackle Undead"], tone: "good", label: "Guardians shackled", note: "phase 3" },
    prot("Frost"),
  ],
};

// Every ability name the fetcher should ask Warcraft Logs for, by kind.
export function mechanicAbilities() {
  const by = { hit: new Set(), debuff: new Set(), cast: new Set() };
  for (const list of Object.values(MECHANICS)) {
    for (const m of list) if (by[m.kind]) m.abilities.forEach((a) => by[m.kind].add(a));
  }
  return Object.fromEntries(Object.entries(by).map(([k, v]) => [k, [...v]]));
}
