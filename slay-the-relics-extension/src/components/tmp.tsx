export const CardsLoc: Record<
  string,
  {
    NAME: string;
    DESCRIPTION: string;
    UPGRADE_DESCRIPTION?: string;
    EXTENDED_DESCRIPTION?: string[];
  }
> = {
  "A Thousand Cuts": {
    NAME: "A Thousand Cuts",
    DESCRIPTION: "Whenever you play a card, deal !M! damage to ALL enemies.",
  },
  Accuracy: {
    NAME: "Accuracy",
    DESCRIPTION: "*Shivs deal !M! additional damage.",
  },
  Acrobatics: {
    NAME: "Acrobatics",
    DESCRIPTION: "Draw !M! cards. NL Discard 1 card.",
  },
  Adrenaline: {
    NAME: "Adrenaline",
    DESCRIPTION: "Gain [G]. NL Draw 2 cards. NL Exhaust.",
    UPGRADE_DESCRIPTION: "Gain [G] [G]. NL Draw 2 cards. NL Exhaust.",
  },
  "After Image": {
    NAME: "After Image",
    DESCRIPTION: "Whenever you play a card, gain 1 Block.",
    UPGRADE_DESCRIPTION: "Innate. NL Whenever you play a card, gain 1 Block.",
  },
  Aggregate: {
    NAME: "Aggregate",
    DESCRIPTION: "Gain [B] for every !M! cards in your draw pile.",
  },
  "All For One": {
    NAME: "All for One",
    DESCRIPTION:
      "Deal !D! damage. NL Put all cost 0 cards from your discard pile into your hand.",
  },
  "All Out Attack": {
    NAME: "All-Out Attack",
    DESCRIPTION: "Deal !D! damage to ALL enemies. NL Discard 1 card at random.",
  },
  Allocate: {
    NAME: "Allocate",
    DESCRIPTION: "Gain !M! Focus. NL Lose 1 Strength. NL Lose 1 Dexterity.",
  },
  Amplify: {
    NAME: "Amplify",
    DESCRIPTION: "This turn, your next Power card is played twice.",
    UPGRADE_DESCRIPTION:
      "This turn, your next !M! Power cards are played twice.",
  },
  Anger: {
    NAME: "Anger",
    DESCRIPTION:
      "Deal !D! damage. NL Add a copy of this card into your discard pile.",
  },
  Apotheosis: {
    NAME: "Apotheosis",
    DESCRIPTION: "Upgrade ALL your cards for the rest of combat. NL Exhaust.",
  },
  Armaments: {
    NAME: "Armaments",
    DESCRIPTION:
      "Gain !B! Block. NL Upgrade a card in your hand for the rest of combat.",
    UPGRADE_DESCRIPTION:
      "Gain !B! Block. NL Upgrade all cards in your hand for the rest of combat.",
  },
  AscendersBane: {
    NAME: "Ascender's Bane",
    DESCRIPTION:
      "Unplayable. NL Ethereal. NL Cannot be removed from your deck.",
  },
  "Auto Shields": {
    NAME: "Auto-Shields",
    DESCRIPTION: "If you have no Block, gain !B! Block.",
  },
  "Axe Kick": {
    NAME: "Axe Kick",
    DESCRIPTION: "Deal !D! damage. NL Evoke your next Orb.",
  },
  Backflip: {
    NAME: "Backflip",
    DESCRIPTION: "Gain !B! Block. NL Draw 2 cards.",
  },
  Backstab: {
    NAME: "Backstab",
    DESCRIPTION: "Innate. NL Deal !D! damage. NL Exhaust.",
  },
  "Ball Lightning": {
    NAME: "Ball Lightning",
    DESCRIPTION: "Deal !D! damage. Channel !M! Lightning.",
  },
  "Bandage Up": {
    NAME: "Bandage Up",
    DESCRIPTION: "Heal !M! HP. NL Exhaust.",
  },
  Bane: {
    NAME: "Bane",
    DESCRIPTION:
      "Deal !D! damage. NL If the enemy has Poison, deal !D! damage again.",
  },
  Barrage: {
    NAME: "Barrage",
    DESCRIPTION: "Deal !D! damage for each Channeled Orb.",
  },
  Barricade: {
    NAME: "Barricade",
    DESCRIPTION: "Block is not removed at the start of your turn.",
  },
  Bash: {
    NAME: "Bash",
    DESCRIPTION: "Deal !D! damage. NL Apply !M! Vulnerable.",
  },
  "Battle Trance": {
    NAME: "Battle Trance",
    DESCRIPTION:
      "Draw !M! cards. NL You cannot draw additional cards this turn.",
  },
  "Beam Cell": {
    NAME: "Beam Cell",
    DESCRIPTION: "Deal !D! damage. NL Apply !M! Vulnerable.",
  },
  Berserk: {
    NAME: "Berserk",
    DESCRIPTION: "Gain !M! Vulnerable. NL At the start of your turn, gain [R].",
  },
  "Biased Cognition": {
    NAME: "Biased Cognition",
    DESCRIPTION: "Gain !M! Focus. NL At the start of your turn, lose 1 Focus.",
  },
  Bite: {
    NAME: "Bite",
    DESCRIPTION: "Deal !D! damage. NL Heal !M! HP.",
  },
  "Blade Dance": {
    NAME: "Blade Dance",
    DESCRIPTION: "Add !M! *Shivs into your hand.",
  },
  Blaster: {
    NAME: "Blaster",
    DESCRIPTION: "deprecated",
  },
  Blind: {
    NAME: "Blind",
    DESCRIPTION: "Apply !M! Weak.",
    UPGRADE_DESCRIPTION: "Apply !M! Weak to ALL enemies.",
  },
  Blizzard: {
    NAME: "Blizzard",
    DESCRIPTION:
      "Deal damage equal to !M! times the number of Frost Channeled this combat to ALL enemies.",
    UPGRADE_DESCRIPTION: "",
    EXTENDED_DESCRIPTION: [" NL (Deals !D! damage.)", ""],
  },
  "Blood for Blood": {
    NAME: "Blood for Blood",
    DESCRIPTION:
      "Costs 1 less [R] NL for each time you lose HP this combat. NL Deal !D! damage.",
  },
  Bloodletting: {
    NAME: "Bloodletting",
    DESCRIPTION: "Lose 3 HP. NL Gain [R] [R].",
    UPGRADE_DESCRIPTION: "Lose 3 HP. NL Gain [R] [R] [R].",
  },
  Bludgeon: {
    NAME: "Bludgeon",
    DESCRIPTION: "Deal !D! damage.",
  },
  Blur: {
    NAME: "Blur",
    DESCRIPTION:
      "Gain !B! Block. NL Block is not removed at the start of your next turn.",
  },
  "Body Slam": {
    NAME: "Body Slam",
    DESCRIPTION: "Deal damage equal to your Block.",
    UPGRADE_DESCRIPTION: " NL (Deals !D! damage.)",
  },
  BootSequence: {
    NAME: "Boot Sequence",
    DESCRIPTION: "Innate. NL Gain !B! Block. NL Exhaust.",
  },
  "Bouncing Flask": {
    NAME: "Bouncing Flask",
    DESCRIPTION: "Apply 3 Poison to a random enemy !M! times.",
  },
  Brutality: {
    NAME: "Brutality",
    DESCRIPTION: "At the start of your turn, lose 1 HP and draw 1 card.",
    UPGRADE_DESCRIPTION:
      "Innate. NL At the start of your turn, lose 1 HP and draw 1 card.",
  },
  Buffer: {
    NAME: "Buffer",
    DESCRIPTION: "Prevent the next time you would lose HP.",
    UPGRADE_DESCRIPTION: "Prevent the next !M! times you would lose HP.",
  },
  "Bullet Time": {
    NAME: "Bullet Time",
    DESCRIPTION:
      "You cannot draw additional cards this turn. Reduce the cost of all cards in your hand to 0 this turn.",
  },
  Burn: {
    NAME: "Burn",
    DESCRIPTION: "Unplayable. NL At the end of your turn, take 2 damage.",
    UPGRADE_DESCRIPTION:
      "Unplayable. NL At the end of your turn, take 4 damage.",
  },
  "Burning Pact": {
    NAME: "Burning Pact",
    DESCRIPTION: "Exhaust 1 card. NL Draw !M! cards.",
  },
  Burst: {
    NAME: "Burst",
    DESCRIPTION: "This turn, your next Skill is played twice.",
    UPGRADE_DESCRIPTION: "This turn, your next !M! Skills are played twice.",
  },
  "Calculated Gamble": {
    NAME: "Calculated Gamble",
    DESCRIPTION: "Discard your hand, NL then draw that many cards. NL Exhaust.",
    UPGRADE_DESCRIPTION: "Discard your hand, NL then draw that many cards.",
  },
  Caltrops: {
    NAME: "Caltrops",
    DESCRIPTION: "Whenever you are attacked, deal !M! damage back.",
  },
  Capacitor: {
    NAME: "Capacitor",
    DESCRIPTION: "Gain !M! Orb slots.",
    UPGRADE_DESCRIPTION: "Gain !M! Orb slots.",
  },
  Carnage: {
    NAME: "Carnage",
    DESCRIPTION: "Ethereal. NL Deal !D! damage.",
  },
  Catalyst: {
    NAME: "Catalyst",
    DESCRIPTION: "Double the enemy's Poison. NL Exhaust.",
    UPGRADE_DESCRIPTION: "Triple the enemy's Poison. NL Exhaust.",
  },
  Chaos: {
    NAME: "Chaos",
    DESCRIPTION: "Channel !M! random Orb.",
    UPGRADE_DESCRIPTION: "Channel !M! random Orbs.",
  },
  Chill: {
    NAME: "Chill",
    DESCRIPTION: "Channel !M! Frost for each enemy in combat. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Innate. NL Channel !M! Frost for each enemy in combat. NL Exhaust.",
  },
  Choke: {
    NAME: "Choke",
    DESCRIPTION:
      "Deal !D! damage. NL Whenever you play a card this turn, the enemy loses !M! HP.",
  },
  Chrysalis: {
    NAME: "Chrysalis",
    DESCRIPTION:
      "Shuffle !M! random Skills into your draw pile. They cost 0 this combat. NL Exhaust.",
  },
  Clash: {
    NAME: "Clash",
    DESCRIPTION:
      "Can only be played if every card in your hand is an Attack. NL Deal !D! damage.",
    EXTENDED_DESCRIPTION: ["I have non-Attack cards in my hand."],
  },
  Cleave: {
    NAME: "Cleave",
    DESCRIPTION: "Deal !D! damage to ALL enemies.",
  },
  "Cloak And Dagger": {
    NAME: "Cloak and Dagger",
    DESCRIPTION: "Gain !B! Block. NL Add !M! *Shiv into your hand.",
    UPGRADE_DESCRIPTION: "Gain !B! Block. NL Add !M! *Shivs into your hand.",
  },
  Clothesline: {
    NAME: "Clothesline",
    DESCRIPTION: "Deal !D! damage. NL Apply !M! Weak.",
  },
  Clumsy: {
    NAME: "Clumsy",
    DESCRIPTION: "Unplayable. NL Ethereal.",
  },
  "Cold Snap": {
    NAME: "Cold Snap",
    DESCRIPTION: "Deal !D! damage. Channel !M! Frost.",
  },
  Combust: {
    NAME: "Combust",
    DESCRIPTION:
      "At the end of your turn, lose 1 HP and deal !M! damage to ALL enemies.",
  },
  Concentrate: {
    NAME: "Concentrate",
    DESCRIPTION: "Discard !M! cards. NL Gain [G] [G].",
  },
  "Conserve Battery": {
    NAME: "Charge Battery",
    DESCRIPTION: "Gain !B! Block. NL Next turn, gain [B].",
  },
  Consume: {
    NAME: "Consume",
    DESCRIPTION: "Gain !M! Focus. NL Lose 1 Orb slot.",
  },
  Coolheaded: {
    NAME: "Coolheaded",
    DESCRIPTION: "Channel 1 Frost. NL Draw !M! card.",
    UPGRADE_DESCRIPTION: "Channel 1 Frost. NL Draw !M! cards.",
  },
  "Corpse Explosion": {
    NAME: "Corpse Explosion",
    DESCRIPTION:
      "Apply !M! Poison. NL When the enemy dies, deal damage equal to its Max HP to ALL enemies.",
    UPGRADE_DESCRIPTION: "deprecated",
    EXTENDED_DESCRIPTION: ["deprecated"],
  },
  Corruption: {
    NAME: "Corruption",
    DESCRIPTION: "Skills cost 0. NL Whenever you play a Skill, Exhaust it.",
  },
  "Creative AI": {
    NAME: "Creative AI",
    DESCRIPTION:
      "At the start of your turn, add a random Power card into your hand.",
  },
  "Crippling Poison": {
    NAME: "Crippling Cloud",
    DESCRIPTION: "Apply !M! Poison and 2 Weak to ALL enemies. NL Exhaust.",
  },
  "Dagger Spray": {
    NAME: "Dagger Spray",
    DESCRIPTION: "Deal !D! damage to ALL enemies twice.",
  },
  "Dagger Throw": {
    NAME: "Dagger Throw",
    DESCRIPTION: "Deal !D! damage. NL Draw 1 card. NL Discard 1 card.",
  },
  "Dark Embrace": {
    NAME: "Dark Embrace",
    DESCRIPTION: "Whenever a card is Exhausted, NL draw 1 card.",
  },
  "Dark Shackles": {
    NAME: "Dark Shackles",
    DESCRIPTION: "Enemy loses !M! Strength this turn. NL Exhaust.",
  },
  Darkness: {
    NAME: "Darkness",
    DESCRIPTION: "Channel !M! Dark.",
    UPGRADE_DESCRIPTION:
      "Channel !M! Dark. NL Trigger the passive ability of all Dark orbs.",
  },
  Dash: {
    NAME: "Dash",
    DESCRIPTION: "Gain !B! Block. NL Deal !D! damage.",
  },
  Dazed: {
    NAME: "Dazed",
    DESCRIPTION: "Unplayable. NL Ethereal.",
  },
  "Deadly Poison": {
    NAME: "Deadly Poison",
    DESCRIPTION: "Apply !M! Poison.",
  },
  Decay: {
    NAME: "Decay",
    DESCRIPTION: "Unplayable. NL At the end of your turn, take 2 damage.",
  },
  "Deep Breath": {
    NAME: "Deep Breath",
    DESCRIPTION:
      "Shuffle your discard pile into your draw pile. NL Draw !M! card.",
    UPGRADE_DESCRIPTION:
      "Shuffle your discard pile into your draw pile. NL Draw !M! cards.",
  },
  Defend_B: {
    NAME: "Defend",
    DESCRIPTION: "Gain !B! Block.",
  },
  Defend_G: {
    NAME: "Defend",
    DESCRIPTION: "Gain !B! Block.",
  },
  Defend_R: {
    NAME: "Defend",
    DESCRIPTION: "Gain !B! Block.",
  },
  Defend_P: {
    NAME: "Defend",
    DESCRIPTION: "Gain !B! Block.",
  },
  Deflect: {
    NAME: "Deflect",
    DESCRIPTION: "Gain !B! Block.",
  },
  Defragment: {
    NAME: "Defragment",
    DESCRIPTION: "Gain !M! Focus.",
  },
  "Demon Form": {
    NAME: "Demon Form",
    DESCRIPTION: "At the start of your turn, gain !M! Strength.",
  },
  "Die Die Die": {
    NAME: "Die Die Die",
    DESCRIPTION: "Deal !D! damage to ALL enemies. NL Exhaust.",
  },
  Disarm: {
    NAME: "Disarm",
    DESCRIPTION: "Enemy loses !M! Strength. NL Exhaust.",
  },
  Distraction: {
    NAME: "Distraction",
    DESCRIPTION:
      "Add a random Skill into your hand. NL It costs 0 this turn. NL Exhaust.",
  },
  "Dodge and Roll": {
    NAME: "Dodge and Roll",
    DESCRIPTION: "Gain !B! Block. NL Next turn, gain !B! Block.",
  },
  "Doom and Gloom": {
    NAME: "Doom and Gloom",
    DESCRIPTION: "Deal !D! damage to ALL enemies. NL Channel !M! Dark.",
  },
  Doppelganger: {
    NAME: "Doppelganger",
    DESCRIPTION: "Next turn, draw X cards and gain X [G]. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Next turn, draw X+1 cards and gain X+1 [G]. NL Exhaust.",
  },
  "Double Energy": {
    NAME: "Double Energy",
    DESCRIPTION: "Double your Energy. NL Exhaust.",
    UPGRADE_DESCRIPTION: "Double your Energy.",
  },
  "Double Tap": {
    NAME: "Double Tap",
    DESCRIPTION: "This turn, your next Attack is played twice.",
    UPGRADE_DESCRIPTION: "This turn, your next !M! Attacks are played twice.",
  },
  Doubt: {
    NAME: "Doubt",
    DESCRIPTION: "Unplayable. NL At the end of your turn, gain 1 Weak.",
  },
  "Dramatic Entrance": {
    NAME: "Dramatic Entrance",
    DESCRIPTION: "Innate. NL Deal !D! damage to ALL enemies. NL Exhaust.",
  },
  Dropkick: {
    NAME: "Dropkick",
    DESCRIPTION:
      "Deal !D! damage. NL If the enemy has Vulnerable, NL gain [R] and NL draw 1 card.",
  },
  "Dual Wield": {
    NAME: "Dual Wield",
    DESCRIPTION:
      "Choose an Attack or Power card. Add a copy of that card into your hand.",
    UPGRADE_DESCRIPTION:
      "Choose an Attack or Power card. Add 2 copies of that card into your hand.",
  },
  Dualcast: {
    NAME: "Dualcast",
    DESCRIPTION: "Evoke your next Orb twice.",
  },
  "Echo Form": {
    NAME: "Echo Form",
    DESCRIPTION:
      "Ethereal. NL The first card you play each turn is played twice.",
    UPGRADE_DESCRIPTION: "The first card you play each turn is played twice.",
  },
  Electrodynamics: {
    NAME: "Electrodynamics",
    DESCRIPTION: "Lightning now hits ALL enemies. NL Channel !M! Lightning.",
    UPGRADE_DESCRIPTION: "",
  },
  "Endless Agony": {
    NAME: "Endless Agony",
    DESCRIPTION:
      "Deal !D! damage. NL Whenever you draw this card, add a copy of it into your hand. NL Exhaust.",
  },
  "Energy Pulse": {
    NAME: "Energy Pulse",
    DESCRIPTION: "Gain Block equal to your Energy.",
    UPGRADE_DESCRIPTION: "Gain Block equal to twice your Energy.",
  },
  Enlightenment: {
    NAME: "Enlightenment",
    DESCRIPTION: "Reduce the cost of all cards in your hand to 1 this turn.",
    UPGRADE_DESCRIPTION:
      "Reduce the cost of all cards in your hand to 1 this combat.",
  },
  Entrench: {
    NAME: "Entrench",
    DESCRIPTION: "Double your Block.",
    UPGRADE_DESCRIPTION: "Double your Block.",
  },
  Envenom: {
    NAME: "Envenom",
    DESCRIPTION: "Whenever an Attack deals unblocked damage, apply 1 Poison.",
  },
  "Escape Plan": {
    NAME: "Escape Plan",
    DESCRIPTION: "Draw 1 card. NL If you draw a Skill, gain !B! Block.",
  },
  Eviscerate: {
    NAME: "Eviscerate",
    DESCRIPTION:
      "Costs 1 less [G] NL for each card discarded this turn. NL Deal !D! damage 3 times.",
  },
  Evolve: {
    NAME: "Evolve",
    DESCRIPTION: "Whenever you draw a Status card, draw !M! card.",
    UPGRADE_DESCRIPTION: "Whenever you draw a Status card, draw !M! cards.",
  },
  Exhume: {
    NAME: "Exhume",
    DESCRIPTION:
      "Put a card from your exhaust pile into your hand. NL Exhaust.",
  },
  Expertise: {
    NAME: "Expertise",
    DESCRIPTION: "Draw cards until you have !M! in your hand.",
  },
  FTL: {
    NAME: "FTL",
    DESCRIPTION:
      "Deal !D! damage. If you have played less than !M! cards this turn, draw 1 card.",
    EXTENDED_DESCRIPTION: [" NL (", " card played.)", " cards played.)"],
  },
  Feed: {
    NAME: "Feed",
    DESCRIPTION:
      "Deal !D! damage. NL If Fatal, raise your Max HP by !M!. Exhaust.",
  },
  "Feel No Pain": {
    NAME: "Feel No Pain",
    DESCRIPTION: "Whenever a card is Exhausted, NL gain !M! Block.",
  },
  "Fiend Fire": {
    NAME: "Fiend Fire",
    DESCRIPTION:
      "Exhaust your hand. NL Deal !D! damage for each card Exhausted. NL Exhaust.",
  },
  Finesse: {
    NAME: "Finesse",
    DESCRIPTION: "Gain !B! Block. NL Draw 1 card.",
  },
  Finisher: {
    NAME: "Finisher",
    DESCRIPTION: "Deal !D! damage for each Attack played this turn.",
    EXTENDED_DESCRIPTION: [" NL (", " Attack played.)", " Attacks played.)"],
  },
  "Fire Breathing": {
    NAME: "Fire Breathing",
    DESCRIPTION:
      "Whenever you draw a Status or Curse card, deal !M! damage to ALL enemies.",
  },
  Fission: {
    NAME: "Fission",
    DESCRIPTION:
      "Remove all your Orbs. Gain [B] and draw !M! card for each Orb removed. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Evoke all your Orbs. Gain [B] and draw !M! card for each Orb Evoked. NL Exhaust.",
  },
  "Flame Barrier": {
    NAME: "Flame Barrier",
    DESCRIPTION:
      "Gain !B! Block. NL Whenever you are attacked this turn, deal !M! damage back.",
  },
  "Flash of Steel": {
    NAME: "Flash of Steel",
    DESCRIPTION: "Deal !D! damage. NL Draw 1 card.",
  },
  Flechettes: {
    NAME: "Flechettes",
    DESCRIPTION: "Deal !D! damage for each Skill in your hand.",
    EXTENDED_DESCRIPTION: [" NL (You have ", " Skill).", " Skills)."],
  },
  Flex: {
    NAME: "Flex",
    DESCRIPTION:
      "Gain !M! Strength. NL At the end of this turn, lose !M! Strength.",
  },
  "Flux Capacitor": {
    NAME: "Flux Capacitor",
    DESCRIPTION: "Replace all Channeled Orbs with Plasma. NL Exhaust.",
  },
  "Flying Knee": {
    NAME: "Flying Knee",
    DESCRIPTION: "Deal !D! damage. NL Next turn, gain [G].",
  },
  Footwork: {
    NAME: "Footwork",
    DESCRIPTION: "Gain !M! Dexterity.",
  },
  "Force Field": {
    NAME: "Force Field",
    DESCRIPTION:
      "Costs 1 less [B] for each Power card played this combat. NL Gain !B! Block.",
  },
  Fusion: {
    NAME: "Fusion",
    DESCRIPTION: "Channel !M! Plasma.",
  },
  Gash: {
    NAME: "Claw",
    DESCRIPTION:
      "Deal !D! damage. NL Increase the damage of ALL Claw cards by !M! this combat.",
  },
  "Genetic Algorithm": {
    NAME: "Genetic Algorithm",
    DESCRIPTION:
      "Gain !B! Block. Permanently increase this card's Block by !M!. NL Exhaust.",
  },
  Ghostly: {
    NAME: "Apparition",
    DESCRIPTION: "Ethereal. NL Gain 1 Intangible. NL Exhaust.",
    UPGRADE_DESCRIPTION: "Gain 1 Intangible. NL Exhaust.",
  },
  "Ghostly Armor": {
    NAME: "Ghostly Armor",
    DESCRIPTION: "Ethereal. NL Gain !B! Block.",
  },
  Glacier: {
    NAME: "Glacier",
    DESCRIPTION: "Gain !B! Block. NL Channel !M! Frost.",
    UPGRADE_DESCRIPTION: "Gain !B! Block. NL Channel !M! Frost.",
  },
  "Glass Knife": {
    NAME: "Glass Knife",
    DESCRIPTION:
      "Deal !D! damage twice. Decrease the damage of this card by 2 this combat.",
  },
  "Go for the Eyes": {
    NAME: "Go for the Eyes",
    DESCRIPTION:
      "Deal !D! damage. NL If the enemy intends to attack, apply !M! Weak.",
  },
  "Good Instincts": {
    NAME: "Good Instincts",
    DESCRIPTION: "Gain !B! Block.",
  },
  "Grand Finale": {
    NAME: "Grand Finale",
    DESCRIPTION:
      "Can only be played if there are no cards in your draw pile. NL Deal !D! damage to ALL enemies.",
    UPGRADE_DESCRIPTION: "My draw pile NL must be #rEmpty.",
  },
  Havoc: {
    NAME: "Havoc",
    DESCRIPTION: "Play the top card of your draw pile and Exhaust it.",
  },
  Headbutt: {
    NAME: "Headbutt",
    DESCRIPTION:
      "Deal !D! damage. NL Put a card from your discard pile on top of your draw pile.",
  },
  Heatsinks: {
    NAME: "Heatsinks",
    DESCRIPTION: "Whenever you play a Power card, draw !M! card.",
    UPGRADE_DESCRIPTION: "Whenever you play a Power card, draw !M! cards.",
  },
  "Heavy Blade": {
    NAME: "Heavy Blade",
    DESCRIPTION: "Deal !D! damage. NL Strength affects this card !M! times.",
    UPGRADE_DESCRIPTION:
      "Deal !D! damage. NL Strength affects this card !M! times.",
  },
  "Heel Hook": {
    NAME: "Heel Hook",
    DESCRIPTION:
      "Deal !D! damage. NL If the enemy has Weak, NL gain [G] and NL draw 1 card.",
  },
  "Hello World": {
    NAME: "Hello World",
    DESCRIPTION:
      "At the start of your turn, add a random Common card into your hand.",
    UPGRADE_DESCRIPTION:
      "Innate. NL At the start of your turn, add a random Common card into your hand.",
  },
  Hemokinesis: {
    NAME: "Hemokinesis",
    DESCRIPTION: "Lose !M! HP. NL Deal !D! damage.",
  },
  Hide: {
    NAME: "Hide",
    DESCRIPTION:
      "You cannot lose HP until the start of your next turn. NL Exhaust.",
  },
  Hologram: {
    NAME: "Hologram",
    DESCRIPTION:
      "Gain !B! Block. NL Put a card from your discard pile into your hand. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Gain !B! Block. NL Put a card from your discard pile into your hand.",
  },
  Hyperbeam: {
    NAME: "Hyperbeam",
    DESCRIPTION: "Deal !D! damage to ALL enemies. NL Lose !M! Focus.",
  },
  Immolate: {
    NAME: "Immolate",
    DESCRIPTION:
      "Deal !D! damage to ALL enemies. NL Add a *Burn into your discard pile.",
  },
  Impervious: {
    NAME: "Impervious",
    DESCRIPTION: "Gain !B! Block. NL Exhaust.",
  },
  "Infernal Blade": {
    NAME: "Infernal Blade",
    DESCRIPTION:
      "Add a random Attack into your hand. NL It costs 0 this turn. NL Exhaust.",
  },
  "Infinite Blades": {
    NAME: "Infinite Blades",
    DESCRIPTION: "At the start of your turn, add a *Shiv into your hand.",
    UPGRADE_DESCRIPTION:
      "Innate. NL At the start of your turn, add a *Shiv into your hand.",
  },
  Inflame: {
    NAME: "Inflame",
    DESCRIPTION: "Gain !M! Strength.",
  },
  Injury: {
    NAME: "Injury",
    DESCRIPTION: "Unplayable.",
  },
  Intimidate: {
    NAME: "Intimidate",
    DESCRIPTION: "Apply !M! Weak to ALL enemies. NL Exhaust.",
  },
  "Iron Wave": {
    NAME: "Iron Wave",
    DESCRIPTION: "Gain !B! Block. NL Deal !D! damage.",
  },
  "J.A.X.": {
    NAME: "J.A.X.",
    DESCRIPTION: "Lose 3 HP. NL Gain !M! Strength.",
  },
  "Jack Of All Trades": {
    NAME: "Jack of All Trades",
    DESCRIPTION: "Add !M! random Colorless card into your hand. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Add !M! random Colorless cards into your hand. NL Exhaust.",
  },
  Juggernaut: {
    NAME: "Juggernaut",
    DESCRIPTION: "Whenever you gain Block, deal !M! damage to a random enemy.",
  },
  Leap: {
    NAME: "Leap",
    DESCRIPTION: "Gain !B! Block.",
  },
  "Leg Sweep": {
    NAME: "Leg Sweep",
    DESCRIPTION: "Apply !M! Weak. NL Gain !B! Block.",
  },
  "Limit Break": {
    NAME: "Limit Break",
    DESCRIPTION: "Double your Strength. NL Exhaust.",
    UPGRADE_DESCRIPTION: "Double your Strength.",
  },
  Lockon: {
    NAME: "Bullseye",
    DESCRIPTION: "Deal !D! damage. NL Apply !M! Lock-On.",
  },
  Loop: {
    NAME: "Loop",
    DESCRIPTION:
      "At the start of your turn, trigger the passive ability of your next Orb.",
    UPGRADE_DESCRIPTION:
      "At the start of your turn, trigger the passive ability of your next Orb !M! times.",
  },
  "Machine Learning": {
    NAME: "Machine Learning",
    DESCRIPTION: "At the start of your turn, draw !M! additional card.",
    UPGRADE_DESCRIPTION:
      "Innate. NL At the start of your turn, draw !M! additional card.",
  },
  Study: {
    NAME: "Study",
    DESCRIPTION:
      "At the end of your turn, shuffle an *Insight into your draw pile.",
  },
  Madness: {
    NAME: "Madness",
    DESCRIPTION:
      "Reduce the cost of a random card in your hand to 0 this combat. NL Exhaust.",
  },
  Magnetism: {
    NAME: "Magnetism",
    DESCRIPTION:
      "At the start of your turn, add a random Colorless card into your hand.",
  },
  Malaise: {
    NAME: "Malaise",
    DESCRIPTION: "Enemy loses X Strength. Apply X Weak. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Enemy loses X+1 Strength. Apply X+1 Weak. NL Exhaust.",
  },
  "Master of Strategy": {
    NAME: "Master of Strategy",
    DESCRIPTION: "Draw !M! cards. NL Exhaust.",
  },
  "Masterful Stab": {
    NAME: "Masterful Stab",
    DESCRIPTION:
      "Costs 1 additional [G] NL for each time you lose HP this combat. NL Deal !D! damage.",
    UPGRADE_DESCRIPTION: "",
  },
  Mayhem: {
    NAME: "Mayhem",
    DESCRIPTION:
      "At the start of your turn, play the top card of your draw pile.",
  },
  Melter: {
    NAME: "Melter",
    DESCRIPTION: "Remove all Block from the enemy. NL Deal !D! damage.",
  },
  Metallicize: {
    NAME: "Metallicize",
    DESCRIPTION: "At the end of your turn, gain !M! Block.",
  },
  Metamorphosis: {
    NAME: "Metamorphosis",
    DESCRIPTION:
      "Shuffle !M! random Attacks into your draw pile. They cost 0 this combat. NL Exhaust.",
  },
  "Meteor Strike": {
    NAME: "Meteor Strike",
    DESCRIPTION: "Deal !D! damage. NL Channel !M! Plasma.",
  },
  "Mind Blast": {
    NAME: "Mind Blast",
    DESCRIPTION:
      "Innate. NL Deal damage equal to the number of cards in your draw pile.",
    UPGRADE_DESCRIPTION: "",
    EXTENDED_DESCRIPTION: [" NL (Deals !D! damage.)"],
  },
  "Multi-Cast": {
    NAME: "Multi-Cast",
    DESCRIPTION: "Evoke your next Orb X times.",
    UPGRADE_DESCRIPTION: "Evoke your next Orb X+1 times.",
  },
  Necronomicurse: {
    NAME: "Necronomicurse",
    DESCRIPTION: "Unplayable. NL There is no escape from this Curse.",
  },
  Neutralize: {
    NAME: "Neutralize",
    DESCRIPTION: "Deal !D! damage. NL Apply !M! Weak.",
  },
  "Night Terror": {
    NAME: "Nightmare",
    DESCRIPTION:
      "Choose a card. NL Next turn, add !M! copies of that card into your hand. Exhaust.",
    EXTENDED_DESCRIPTION: ["I can only use NL ", " NL once per turn."],
  },
  Normality: {
    NAME: "Normality",
    DESCRIPTION:
      "Unplayable. NL While in hand, you cannot play more than 3 cards this turn.",
    EXTENDED_DESCRIPTION: [
      "I can only play up to NL #r3 cards this turn.",
      "Unplayable. NL You cannot play more than ",
      " cards per turn.",
      " cards per turn. NL You have played ",
      " card this turn.",
      " cards this turn.",
    ],
  },
  "Noxious Fumes": {
    NAME: "Noxious Fumes",
    DESCRIPTION: "At the start of your turn, apply !M! Poison to ALL enemies.",
  },
  Offering: {
    NAME: "Offering",
    DESCRIPTION: "Lose 6 HP. NL Gain [R] [R]. NL Draw !M! cards. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Lose 6 HP. NL Gain [R] [R]. NL Draw !M! cards. NL Exhaust.",
  },
  Outmaneuver: {
    NAME: "Outmaneuver",
    DESCRIPTION: "Next turn, NL gain [G] [G].",
    UPGRADE_DESCRIPTION: "Next turn, NL gain [G] [G] [G].",
  },
  Pain: {
    NAME: "Pain",
    DESCRIPTION:
      "Unplayable. NL While in hand, NL lose 1 HP whenever you play another card.",
  },
  Panacea: {
    NAME: "Panacea",
    DESCRIPTION: "Gain !M! Artifact. NL Exhaust.",
  },
  Panache: {
    NAME: "Panache",
    DESCRIPTION:
      "Every time you play 5 cards in a single turn, deal !M! damage to ALL enemies.",
  },
  Parasite: {
    NAME: "Parasite",
    DESCRIPTION:
      "Unplayable. NL If transformed or removed from your deck, lose 3 Max HP.",
  },
  "Perfected Strike": {
    NAME: "Perfected Strike",
    DESCRIPTION:
      'Deal !D! damage. NL Deals !M! additional damage for ALL your cards containing "Strike".',
    UPGRADE_DESCRIPTION:
      'Deal !D! damage. NL Deals !M! additional damage for ALL your cards containing "Strike".',
  },
  "Phantasmal Killer": {
    NAME: "Phantasmal Killer",
    DESCRIPTION: "Next turn, your Attacks deal double damage.",
  },
  PiercingWail: {
    NAME: "Piercing Wail",
    DESCRIPTION: "ALL enemies lose !M! Strength this turn. NL Exhaust.",
  },
  "Poisoned Stab": {
    NAME: "Poisoned Stab",
    DESCRIPTION: "Deal !D! damage. NL Apply !M! Poison.",
  },
  "Pommel Strike": {
    NAME: "Pommel Strike",
    DESCRIPTION: "Deal !D! damage. NL Draw !M! card.",
    UPGRADE_DESCRIPTION: "Deal !D! damage. NL Draw !M! cards.",
  },
  "Power Through": {
    NAME: "Power Through",
    DESCRIPTION: "Add 2 *Wounds into your hand. NL Gain !B! Block.",
  },
  Predator: {
    NAME: "Predator",
    DESCRIPTION: "Deal !D! damage. NL Next turn, draw 2 additional cards.",
  },
  Prepared: {
    NAME: "Prepared",
    DESCRIPTION: "Draw !M! card. NL Discard !M! card.",
    UPGRADE_DESCRIPTION: "Draw !M! cards. NL Discard !M! cards.",
  },
  Pummel: {
    NAME: "Pummel",
    DESCRIPTION: "Deal !D! damage !M! times. NL Exhaust.",
    UPGRADE_DESCRIPTION: "Deal !D! damage !M! times. NL Exhaust.",
  },
  Purity: {
    NAME: "Purity",
    DESCRIPTION: "Exhaust up to !M! cards in your hand. NL Exhaust.",
  },
  "Quick Slash": {
    NAME: "Quick Slash",
    DESCRIPTION: "Deal !D! damage. NL Draw 1 card.",
  },
  Rage: {
    NAME: "Rage",
    DESCRIPTION: "Whenever you play an Attack this turn, gain !M! Block.",
  },
  Rainbow: {
    NAME: "Rainbow",
    DESCRIPTION:
      "Channel 1 Lightning. NL Channel 1 Frost. NL Channel 1 Dark. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Channel 1 Lightning. NL Channel 1 Frost. NL Channel 1 Dark.",
  },
  Rampage: {
    NAME: "Rampage",
    DESCRIPTION:
      "Deal !D! damage. NL Increase this card's damage by !M! this combat.",
  },
  Reaper: {
    NAME: "Reaper",
    DESCRIPTION:
      "Deal !D! damage to ALL enemies. Heal HP equal to unblocked damage. NL Exhaust.",
  },
  Reboot: {
    NAME: "Reboot",
    DESCRIPTION:
      "Shuffle ALL your cards into your draw pile. NL Draw !M! cards. NL Exhaust.",
  },
  Rebound: {
    NAME: "Rebound",
    DESCRIPTION:
      "Deal !D! damage. NL Put the next card you play this turn on top of your draw pile.",
  },
  "Reckless Charge": {
    NAME: "Reckless Charge",
    DESCRIPTION: "Deal !D! damage. NL Shuffle a *Dazed into your draw pile.",
  },
  Recycle: {
    NAME: "Recycle",
    DESCRIPTION: "Exhaust a card. NL Gain [B] equal to its cost.",
  },
  Redo: {
    NAME: "Recursion",
    DESCRIPTION:
      "Evoke your next Orb. NL Channel the Orb that was just Evoked.",
  },
  Reflex: {
    NAME: "Reflex",
    DESCRIPTION:
      "Unplayable. NL If this card is discarded from your hand, draw !M! cards.",
    UPGRADE_DESCRIPTION:
      "Unplayable. NL If this card is discarded from your hand, draw !M! cards.",
    EXTENDED_DESCRIPTION: ["I can't play this card."],
  },
  Regret: {
    NAME: "Regret",
    DESCRIPTION:
      "Unplayable. NL At the end of your turn, lose HP equal to the number of cards in your hand.",
  },
  "Reinforced Body": {
    NAME: "Reinforced Body",
    DESCRIPTION: "Gain !B! Block X times.",
  },
  Reprogram: {
    NAME: "Reprogram",
    DESCRIPTION: "Lose !M! Focus. NL Gain !M! Strength. NL Gain !M! Dexterity.",
    UPGRADE_DESCRIPTION: "",
  },
  "Riddle With Holes": {
    NAME: "Riddle with Holes",
    DESCRIPTION: "Deal !D! damage 5 times.",
  },
  "Rip and Tear": {
    NAME: "Rip and Tear",
    DESCRIPTION: "Deal !D! damage to a random enemy twice.",
  },
  Rupture: {
    NAME: "Rupture",
    DESCRIPTION: "Whenever you lose HP from a card, NL gain !M! Strength.",
  },
  "Sadistic Nature": {
    NAME: "Sadistic Nature",
    DESCRIPTION:
      "Whenever you apply a debuff to an enemy, they take !M! damage.",
  },
  Scrape: {
    NAME: "Scrape",
    DESCRIPTION:
      "Deal !D! damage. NL Draw !M! cards. NL Discard all cards drawn this way that do not cost 0.",
  },
  "Searing Blow": {
    NAME: "Searing Blow",
    DESCRIPTION: "Deal !D! damage. NL Can be Upgraded any number of times.",
  },
  "Second Wind": {
    NAME: "Second Wind",
    DESCRIPTION:
      "Exhaust all non-Attack cards in your hand. Gain !B! Block for each card Exhausted.",
  },
  "Secret Technique": {
    NAME: "Secret Technique",
    DESCRIPTION: "Put a Skill from your draw pile into your hand. NL Exhaust.",
    UPGRADE_DESCRIPTION: "Put a Skill from your draw pile into your hand.",
    EXTENDED_DESCRIPTION: ["There are no Skills NL in my draw pile."],
  },
  "Secret Weapon": {
    NAME: "Secret Weapon",
    DESCRIPTION:
      "Put an Attack from your draw pile into your hand. NL Exhaust.",
    UPGRADE_DESCRIPTION: "Put an Attack from your draw pile into your hand.",
    EXTENDED_DESCRIPTION: ["There are no Attacks NL in my draw pile."],
  },
  "Seeing Red": {
    NAME: "Seeing Red",
    DESCRIPTION: "Gain [R] [R]. NL Exhaust.",
  },
  Seek: {
    NAME: "Seek",
    DESCRIPTION: "Put !M! card from your draw pile into your hand. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Put !M! cards from your draw pile into your hand. NL Exhaust.",
  },
  "Self Repair": {
    NAME: "Self Repair",
    DESCRIPTION: "At the end of combat, heal !M! HP.",
  },
  Sentinel: {
    NAME: "Sentinel",
    DESCRIPTION:
      "Gain !B! Block. NL If this card is Exhausted, NL gain [R] [R].",
    UPGRADE_DESCRIPTION:
      "Gain !B! Block. NL If this card is Exhausted, NL gain [R] [R] [R].",
  },
  Setup: {
    NAME: "Setup",
    DESCRIPTION:
      "Put a card from your hand on top of your draw pile. NL It costs 0 until played.",
  },
  "Sever Soul": {
    NAME: "Sever Soul",
    DESCRIPTION:
      "Exhaust all non-Attack cards in your hand. NL Deal !D! damage.",
  },
  Shame: {
    NAME: "Shame",
    DESCRIPTION: "Unplayable. NL At the end of your turn, gain 1 Frail.",
  },
  Shiv: {
    NAME: "Shiv",
    DESCRIPTION: "Deal !D! damage. NL Exhaust.",
  },
  Shockwave: {
    NAME: "Shockwave",
    DESCRIPTION: "Apply !M! Weak and Vulnerable to ALL enemies. NL Exhaust.",
  },
  "Shrug It Off": {
    NAME: "Shrug It Off",
    DESCRIPTION: "Gain !B! Block. NL Draw 1 card.",
  },
  Skewer: {
    NAME: "Skewer",
    DESCRIPTION: "Deal !D! damage X times.",
  },
  Skim: {
    NAME: "Skim",
    DESCRIPTION: "Draw !M! cards.",
  },
  Slice: {
    NAME: "Slice",
    DESCRIPTION: "Deal !D! damage.",
  },
  Slimed: {
    NAME: "Slimed",
    DESCRIPTION: "Exhaust.",
  },
  "Spot Weakness": {
    NAME: "Spot Weakness",
    DESCRIPTION: "If the enemy intends to attack, gain !M! Strength.",
  },
  Stack: {
    NAME: "Stack",
    DESCRIPTION:
      "Gain Block equal to the number of cards in your discard pile.",
    UPGRADE_DESCRIPTION:
      "Gain Block equal to the number of cards in your discard pile +3.",
    EXTENDED_DESCRIPTION: [" NL (Gains !B! Block.)"],
  },
  "Static Discharge": {
    NAME: "Static Discharge",
    DESCRIPTION:
      "Whenever you receive unblocked attack damage, Channel !M! Lightning.",
    UPGRADE_DESCRIPTION:
      "Whenever you receive unblocked attack damage, Channel !M! Lightning.",
  },
  Steam: {
    NAME: "Steam Barrier",
    DESCRIPTION: "Gain !B! Block. Decrease this card's Block by 1 this combat.",
  },
  "Steam Power": {
    NAME: "Overclock",
    DESCRIPTION: "Draw !M! cards. NL Add a *Burn into your discard pile.",
  },
  Storm: {
    NAME: "Storm",
    DESCRIPTION: "Whenever you play a Power card, Channel 1 Lightning.",
    UPGRADE_DESCRIPTION:
      "Innate. NL Whenever you play a Power card, Channel 1 Lightning.",
  },
  "Storm of Steel": {
    NAME: "Storm of Steel",
    DESCRIPTION:
      "Discard your hand. NL Add 1 *Shiv into your hand for each card discarded.",
    UPGRADE_DESCRIPTION:
      "Discard your hand. NL Add 1 *Shiv+ into your hand for each card discarded.",
  },
  Streamline: {
    NAME: "Streamline",
    DESCRIPTION:
      "Deal !D! damage. NL Reduce this card's cost by !M! this combat.",
  },
  Strike_B: {
    NAME: "Strike",
    DESCRIPTION: "Deal !D! damage.",
  },
  Strike_G: {
    NAME: "Strike",
    DESCRIPTION: "Deal !D! damage.",
  },
  Strike_R: {
    NAME: "Strike",
    DESCRIPTION: "Deal !D! damage.",
  },
  Strike_P: {
    NAME: "Strike",
    DESCRIPTION: "Deal !D! damage.",
  },
  "Sucker Punch": {
    NAME: "Sucker Punch",
    DESCRIPTION: "Deal !D! damage. NL Apply !M! Weak.",
  },
  Sunder: {
    NAME: "Sunder",
    DESCRIPTION:
      "Deal !D! damage. NL If this kills an enemy, gain [B] [B] [B].",
  },
  Survivor: {
    NAME: "Survivor",
    DESCRIPTION: "Gain !B! Block. NL Discard 1 card.",
  },
  "Sweeping Beam": {
    NAME: "Sweeping Beam",
    DESCRIPTION: "Deal !D! damage to ALL enemies. NL Draw !M! card.",
  },
  "Swift Strike": {
    NAME: "Swift Strike",
    DESCRIPTION: "Deal !D! damage.",
  },
  "Sword Boomerang": {
    NAME: "Sword Boomerang",
    DESCRIPTION: "Deal !D! damage to a random enemy !M! times.",
  },
  Tactician: {
    NAME: "Tactician",
    DESCRIPTION:
      "Unplayable. NL If this card is discarded from your hand, gain [G].",
    UPGRADE_DESCRIPTION:
      "Unplayable. NL If this card is discarded from your hand, gain [G] [G].",
    EXTENDED_DESCRIPTION: ["I can't play this card."],
  },
  Tempest: {
    NAME: "Tempest",
    DESCRIPTION: "Channel X Lightning. NL Exhaust.",
    UPGRADE_DESCRIPTION: "Channel X+1 Lightning. NL Exhaust.",
  },
  Terror: {
    NAME: "Terror",
    DESCRIPTION: "Apply 99 Vulnerable. NL Exhaust.",
  },
  "The Bomb": {
    NAME: "The Bomb",
    DESCRIPTION: "At the end of 3 turns, deal !M! damage to ALL enemies.",
  },
  "Thinking Ahead": {
    NAME: "Thinking Ahead",
    DESCRIPTION:
      "Draw 2 cards. NL Put a card from your hand on top of your draw pile. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Draw 2 cards. NL Put a card from your hand on top of your draw pile.",
  },
  "Thunder Strike": {
    NAME: "Thunder Strike",
    DESCRIPTION:
      "Deal !D! damage to a random enemy for each Lightning Channeled this combat.",
    EXTENDED_DESCRIPTION: [" (Channeled !M! Lightning.)"],
  },
  Thunderclap: {
    NAME: "Thunderclap",
    DESCRIPTION: "Deal !D! damage and apply 1 Vulnerable to ALL enemies.",
  },
  "Tools of the Trade": {
    NAME: "Tools of the Trade",
    DESCRIPTION: "At the start of your turn, draw 1 card and discard 1 card.",
  },
  Transmutation: {
    NAME: "Transmutation",
    DESCRIPTION:
      "Add X random Colorless cards into your hand. They cost 0 this turn. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Add X random Upgraded Colorless cards into your hand. They cost 0 this turn. NL Exhaust.",
  },
  Trip: {
    NAME: "Trip",
    DESCRIPTION: "Apply !M! Vulnerable.",
    UPGRADE_DESCRIPTION: "Apply !M! Vulnerable to ALL enemies.",
  },
  "True Grit": {
    NAME: "True Grit",
    DESCRIPTION: "Gain !B! Block. NL Exhaust 1 card at random.",
    UPGRADE_DESCRIPTION: "Gain !B! Block. NL Exhaust 1 card.",
  },
  Turbo: {
    NAME: "TURBO",
    DESCRIPTION: "Gain [B] [B]. NL Add a *Void into your discard pile.",
    UPGRADE_DESCRIPTION:
      "Gain [B] [B] [B]. NL Add a *Void into your discard pile.",
  },
  "Twin Strike": {
    NAME: "Twin Strike",
    DESCRIPTION: "Deal !D! damage twice.",
  },
  "Underhanded Strike": {
    NAME: "Sneaky Strike",
    DESCRIPTION:
      "Deal !D! damage. NL If you have discarded a card this turn, NL gain [G] [G].",
    EXTENDED_DESCRIPTION: ["I can't play this card."],
  },
  Undo: {
    NAME: "Equilibrium",
    DESCRIPTION: "Gain !B! Block. NL Retain your hand this turn.",
  },
  Unload: {
    NAME: "Unload",
    DESCRIPTION:
      "Deal !D! damage. NL Discard all non-Attack cards in your hand.",
  },
  Uppercut: {
    NAME: "Uppercut",
    DESCRIPTION: "Deal !D! damage. NL Apply !M! Weak. NL Apply !M! Vulnerable.",
  },
  Venomology: {
    NAME: "Alchemize",
    DESCRIPTION: "Obtain a random potion. NL Exhaust.",
  },
  Void: {
    NAME: "Void",
    DESCRIPTION:
      "Unplayable. NL Ethereal. NL Whenever this card is drawn, lose 1 Energy.",
  },
  Warcry: {
    NAME: "Warcry",
    DESCRIPTION:
      "Draw !M! card. NL Put a card from your hand onto the top of your draw pile. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Draw !M! cards. NL Put a card from your hand onto the top of your draw pile. NL Exhaust.",
  },
  "Well Laid Plans": {
    NAME: "Well-Laid Plans",
    DESCRIPTION: "At the end of your turn, Retain up to !M! card.",
    UPGRADE_DESCRIPTION: "At the end of your turn, Retain up to !M! cards.",
  },
  Whirlwind: {
    NAME: "Whirlwind",
    DESCRIPTION: "Deal !D! damage to ALL enemies X times.",
  },
  "White Noise": {
    NAME: "White Noise",
    DESCRIPTION:
      "Add a random Power card into your hand. NL It costs 0 this turn. NL Exhaust.",
  },
  "Wild Strike": {
    NAME: "Wild Strike",
    DESCRIPTION: "Deal !D! damage. NL Shuffle a *Wound into your draw pile.",
  },
  Wound: {
    NAME: "Wound",
    DESCRIPTION: "Unplayable.",
  },
  "Wraith Form v2": {
    NAME: "Wraith Form",
    DESCRIPTION:
      "Gain !M! Intangible. NL At the end of your turn, lose 1 Dexterity.",
  },
  Writhe: {
    NAME: "Writhe",
    DESCRIPTION: "Unplayable. NL Innate.",
  },
  Zap: {
    NAME: "Zap",
    DESCRIPTION: "Channel !M! Lightning.",
  },
  "Core Surge": {
    NAME: "Core Surge",
    DESCRIPTION: "Deal !D! damage. NL Gain !M! Artifact. NL Exhaust.",
  },
  "Compile Driver": {
    NAME: "Compile Driver",
    DESCRIPTION:
      "Deal !D! damage. NL Draw !M! card for each unique Orb you have.",
  },
  RitualDagger: {
    NAME: "Ritual Dagger",
    DESCRIPTION:
      "Deal !D! damage. NL If Fatal, permanently increase this card's damage by !M!. NL Exhaust.",
  },
  Pride: {
    NAME: "Pride",
    DESCRIPTION:
      "Innate. NL At the end of your turn, put a copy of this card on top of your draw pile. Exhaust.",
  },
  PanicButton: {
    NAME: "Panic Button",
    DESCRIPTION:
      "Gain !B! Block. You cannot gain Block from cards for !M! turns. NL Exhaust.",
  },
  HandOfGreed: {
    NAME: "Hand of Greed",
    DESCRIPTION: "Deal !D! damage. NL If Fatal, gain !M! Gold.",
  },
  Violence: {
    NAME: "Violence",
    DESCRIPTION:
      "Put !M! random Attacks from your draw pile into your hand. NL Exhaust.",
  },
  Impatience: {
    NAME: "Impatience",
    DESCRIPTION: "If you have no Attacks in your hand, draw !M! cards.",
  },
  Forethought: {
    NAME: "Forethought",
    DESCRIPTION:
      "Put a card from your hand to the bottom of your draw pile. It costs 0 until played.",
    UPGRADE_DESCRIPTION:
      "Put any number of cards from your hand to the bottom of your draw pile. They cost 0 until played.",
  },
  Discovery: {
    NAME: "Discovery",
    DESCRIPTION:
      "Choose 1 of 3 random cards to add into your hand. It costs 0 this turn. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Choose 1 of 3 random cards to add into your hand. It costs 0 this turn.",
  },
  Nirvana: {
    NAME: "Nirvana",
    DESCRIPTION: "Whenever you Scry, gain !M! Block.",
    UPGRADE_DESCRIPTION: "",
  },
  EmptyFist: {
    NAME: "Empty Fist",
    DESCRIPTION: "Deal !D! damage. NL Exit your Stance.",
  },
  EmptyBody: {
    NAME: "Empty Body",
    DESCRIPTION: "Gain !B! Block. NL Exit your Stance.",
  },
  WreathOfFlame: {
    NAME: "Wreath of Flame",
    DESCRIPTION: "Your next Attack deals !M! additional damage.",
  },
  FearNoEvil: {
    NAME: "Fear No Evil",
    DESCRIPTION:
      "Deal !D! damage. NL If the enemy intends to Attack, enter Calm.",
  },
  MentalFortress: {
    NAME: "Mental Fortress",
    DESCRIPTION: "Whenever you change Stances, gain !M! Block.",
  },
  Mastery: {
    NAME: "Mastery",
    DESCRIPTION:
      "Whenever you attempt to switch Stances to your current Stance, gain [B].",
  },
  Collect: {
    NAME: "Collect",
    DESCRIPTION:
      "Put a *Miracle+ into your hand at the start of your next X turns. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Put a *Miracle+ into your hand at the start of your next X+1 turns. NL Exhaust.",
  },
  ForeignInfluence: {
    NAME: "Foreign Influence",
    DESCRIPTION:
      "Choose 1 of 3 Attacks of any color to add into your hand. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Choose 1 of 3 Attacks of any color to add into your hand. NL It costs 0 this turn. NL Exhaust.",
  },
  FlowState: {
    NAME: "DEPRECATED Flow State",
    DESCRIPTION: "Wrath: Enter Calm. NL Calm: Enter Wrath. NL Exhaust.",
    UPGRADE_DESCRIPTION: "Wrath: Enter Calm. NL Calm: Enter Wrath.",
  },
  FlurryOfBlows: {
    NAME: "Flurry of Blows",
    DESCRIPTION:
      "Deal !D! damage. NL Whenever you change Stances, return this from the discard pile to your hand.",
  },
  PalmThatRestrains: {
    NAME: "DEPRECATED Restraining Palm",
    DESCRIPTION: "Deal !D! damage. NL Apply !M! Weak.",
  },
  Wrath: {
    NAME: "Wrath",
    DESCRIPTION: "Deal and receive double attack damage.",
  },
  Calm: {
    NAME: "Calm",
    DESCRIPTION: "Upon exiting Calm, gain [W] [W].",
  },
  Polymath: {
    NAME: "DEPRECATED Polymath",
    DESCRIPTION: "Enter Calm or Wrath. NL Exhaust.",
  },
  Consecrate: {
    NAME: "Consecrate",
    DESCRIPTION: "Deal !D! damage to ALL enemies.",
  },
  Flicker: {
    NAME: "DEPRECATED Flicker",
    DESCRIPTION:
      "Deal !D! damage. If this kills the enemy, return this card to your hand.",
  },
  Blasphemy: {
    NAME: "Blasphemy",
    DESCRIPTION: "Enter Divinity. NL Die next turn. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Retain. NL Enter Divinity. NL Die next turn. NL Exhaust.",
  },
  Ragnarok: {
    NAME: "Ragnarok",
    DESCRIPTION: "Deal !D! damage to a random enemy !M! times.",
  },
  FlameMastery: {
    NAME: "DEPRECATED Flame Mastery",
    DESCRIPTION: "Gain !M! Strength.",
  },
  StepAndStrike: {
    NAME: "DEPRECATED Step and Strike",
    DESCRIPTION:
      "Costs 1 less per switched Stance this turn. NL Gain !B! Block. NL Deal !D! damage.",
  },
  Survey: {
    NAME: "DEPRECATED Survey",
    DESCRIPTION: "Gain !B! Block. NL Gain !M! Vigor.",
  },
  Swipe: {
    NAME: "DEPRECATED Swipe",
    DESCRIPTION: "Deal !D! damage. Deal half this damage to all other enemies.",
  },
  Blessed: {
    NAME: "DEPRECATED Blessed",
    DESCRIPTION: "Shuffle !M! *Miracles into your draw pile. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Shuffle !M! *Miracles+ into your draw pile. NL Exhaust.",
  },
  LetFateDecide: {
    NAME: "DEPRECATED Let Fate Decide",
    DESCRIPTION:
      "Play the top X cards of your draw pile. If X is 3 or more, Retain X cards.",
  },
  RetreatingHand: {
    NAME: "DEPRECATED Retreating Hand",
    DESCRIPTION:
      "Ethereal. NL Gain !B! Block. If the previous card played was an Attack, return this card to your hand.",
    UPGRADE_DESCRIPTION:
      "Gain !B! Block. If the previous card played was an Attack, return this card to your hand.",
  },
  Flare: {
    NAME: "DEPRECATED Flare",
    DESCRIPTION: "DEPRECATED.",
  },
  PerfectedForm: {
    NAME: "DEPRECATED Perfected Form",
    DESCRIPTION:
      "If you have entered all basic Stances this turn, enter Divinity. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "If you have entered all basic Stances this turn, enter Divinity.",
  },
  AwakenedStrike: {
    NAME: "DEPRECATED Awakened Strike",
    DESCRIPTION: "Deal !D! damage.",
  },
  EmptyMind: {
    NAME: "Empty Mind",
    DESCRIPTION: "Draw !M! cards. NL Exit your Stance.",
    UPGRADE_DESCRIPTION: "Draw !M! cards. NL Exit your Stance.",
  },
  Experienced: {
    NAME: "DEPRECATED Experienced",
    DESCRIPTION: "Gain !B! Block for each Upgraded card in your hand.",
  },
  Judgement: {
    NAME: "Judgment",
    DESCRIPTION: "If the enemy has !M! or less HP, set their NL HP to 0.",
    EXTENDED_DESCRIPTION: ["JUDGED"],
  },
  Pray: {
    NAME: "Pray",
    DESCRIPTION: "Gain !M! Mantra. NL Shuffle an *Insight into your draw pile.",
    UPGRADE_DESCRIPTION: "",
  },
  Conclude: {
    NAME: "Conclude",
    DESCRIPTION: "Deal !D! damage to ALL enemies. NL End your turn.",
  },
  LessonLearned: {
    NAME: "Lesson Learned",
    DESCRIPTION:
      "Deal !D! damage. NL If Fatal, Upgrade a random card in your deck. NL Exhaust.",
  },
  CutThroughFate: {
    NAME: "Cut Through Fate",
    DESCRIPTION: "Deal !D! damage. NL Scry !M!. NL Draw 1 card.",
  },
  ThirdEye: {
    NAME: "Third Eye",
    DESCRIPTION: "Gain !B! Block. NL Scry !M!.",
  },
  SublimeSlice: {
    NAME: "DEPRECATED Sublime Slice",
    DESCRIPTION: "Deal !D! damage. NL Enter a random Stance.",
  },
  SignatureMove: {
    NAME: "Signature Move",
    DESCRIPTION:
      "Can only be played if this is the only Attack in your hand. NL Deal !D! damage.",
  },
  Prediction: {
    NAME: "DEPRECATED Prediction",
    DESCRIPTION: "Gain !B! Block at the start of your next turn.",
  },
  Worship: {
    NAME: "Worship",
    DESCRIPTION: "Gain !M! Mantra.",
    UPGRADE_DESCRIPTION: "Retain. NL Gain !M! Mantra.",
  },
  Fasting: {
    NAME: "DEPRECATED",
    DESCRIPTION: "DEPRECATED",
  },
  Fasting2: {
    NAME: "Fasting",
    DESCRIPTION:
      "Gain !M! Strength. NL Gain !M! Dexterity. NL Gain 1 less [W] at the start of each turn.",
  },
  DevaForm: {
    NAME: "Deva Form",
    DESCRIPTION:
      "Ethereal. NL At the start of your turn, gain [W] NL and increase this gain by !M!.",
    UPGRADE_DESCRIPTION:
      "At the start of your turn, gain [W] NL and increase this gain by !M!.",
  },
  Wireheading: {
    NAME: "Foresight",
    DESCRIPTION: "At the start of your turn, Scry !M!.",
    UPGRADE_DESCRIPTION: "",
  },
  ReachHeaven: {
    NAME: "Reach Heaven",
    DESCRIPTION:
      "Deal !D! damage. NL Shuffle a NL *Through *Violence into your draw pile.",
    UPGRADE_DESCRIPTION: "",
  },
  ThroughViolence: {
    NAME: "Through Violence",
    DESCRIPTION: "Retain. NL Deal !D! damage. NL Exhaust.",
  },
  Clarity: {
    NAME: "Clarity",
    DESCRIPTION:
      "Look at the top !M! cards of your draw pile. Add 1 to your hand. NL Exhaust the other.",
    UPGRADE_DESCRIPTION:
      "Look at the top !M! cards of your draw pile. Add 1 to your hand. NL Exhaust the rest.",
  },
  Thwack: {
    NAME: "DEPRECATED Thwack",
    DESCRIPTION: "Deal !D! damage.",
  },
  Meditate: {
    NAME: "Meditate",
    DESCRIPTION:
      "Put a card from your discard pile into your hand and Retain it. NL Enter Calm. NL End your turn.",
    UPGRADE_DESCRIPTION:
      "Put 2 cards from your discard pile into your hand and Retain them. NL Enter Calm. NL End your turn.",
  },
  Miracle: {
    NAME: "Miracle",
    DESCRIPTION: "Retain. NL Gain [W]. NL Exhaust.",
    UPGRADE_DESCRIPTION: "Retain. NL Gain [W] [W]. NL Exhaust.",
  },
  Vault: {
    NAME: "Vault",
    DESCRIPTION:
      "Take an extra turn after this one. NL End your turn. NL Exhaust.",
  },
  Flow: {
    NAME: "DEPRECATED Flow",
    DESCRIPTION:
      "When you play an Attack, gain 1 temporary Dexterity. When you play a Skill, gain 1 temporary Strength.",
  },
  CarveReality: {
    NAME: "Carve Reality",
    DESCRIPTION: "Deal !D! damage. NL Add a *Smite into your hand.",
    UPGRADE_DESCRIPTION: "",
  },
  Smite: {
    NAME: "Smite",
    DESCRIPTION: "Retain. NL Deal !D! damage. NL Exhaust.",
  },
  Truth: {
    NAME: "Truth",
    DESCRIPTION: "Retain. NL Deal !D! damage. NL Draw !M! card. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Retain. NL Deal !D! damage. NL Draw !M! cards. NL Exhaust.",
  },
  Insight: {
    NAME: "Insight",
    DESCRIPTION: "Retain. NL Draw !M! cards. NL Exhaust.",
    UPGRADE_DESCRIPTION: "Retain. NL Draw !M! cards. NL Exhaust.",
  },
  DeceiveReality: {
    NAME: "Deceive Reality",
    DESCRIPTION: "Gain !B! Block. NL Add a *Safety into NL your hand.",
    UPGRADE_DESCRIPTION: "",
  },
  Safety: {
    NAME: "Safety",
    DESCRIPTION: "Retain. NL Gain !B! Block. NL Exhaust.",
  },
  Wisdom: {
    NAME: "Wisdom",
    DESCRIPTION: "Retain. NL Draw !M! cards. NL Exhaust.",
  },
  Peace: {
    NAME: "Peace",
    DESCRIPTION:
      "Retain. NL ALL enemies lose !M! Strength this turn. NL Exhaust.",
  },
  WindmillStrike: {
    NAME: "Windmill Strike",
    DESCRIPTION:
      "Retain. NL Deal !D! damage. NL When Retained, increase its damage by !M! this combat.",
  },
  Establishment: {
    NAME: "Establishment",
    DESCRIPTION:
      "Whenever a card is Retained, reduce its cost by !M! this combat.",
    UPGRADE_DESCRIPTION:
      "Innate. NL Whenever a card is Retained, reduce its cost by !M! this combat.",
  },
  WardAura: {
    NAME: "DEPRECATED Ward Aura",
    DESCRIPTION:
      "Retain. NL Gain !B! Block. NL At the start of your turn, gain !M! Block.",
  },
  Metaphysics: {
    NAME: "DEPRECATED",
    DESCRIPTION: "DEPRECATED",
    UPGRADE_DESCRIPTION: "DEPRECATED",
  },
  Evaluate: {
    NAME: "Evaluate",
    DESCRIPTION: "Gain !B! Block. NL Shuffle an *Insight into your draw pile.",
    UPGRADE_DESCRIPTION:
      "Gain !B! Block. NL Shuffle an *Insight+ into your draw pile.",
  },
  Devotion: {
    NAME: "Devotion",
    DESCRIPTION: "At the start of your turn, gain !M! Mantra.",
  },
  SoothingAura: {
    NAME: "DEPRECATED Soothing Aura",
    DESCRIPTION:
      "Retain. NL Apply !M! Weak. NL At the start of your turn, apply 1 Weak to a random enemy.",
  },
  BrillianceAura: {
    NAME: "DEPRECATED Brilliance Aura",
    DESCRIPTION: "DEPRECATED",
  },
  FuryAura: {
    NAME: "DEPRECATED Fury Aura",
    DESCRIPTION:
      "Retain. NL Gain !M! temporary Strength. NL At the start of your turn, gain 1 temporary Strength.",
  },
  DeusExMachina: {
    NAME: "Deus Ex Machina",
    DESCRIPTION:
      "Unplayable. NL When you draw this card, add !M! *Miracles to your hand and Exhaust.",
  },
  CleanseEvil: {
    NAME: "Cleanse Evil",
    DESCRIPTION: "Add X *Smite into your hand.",
    UPGRADE_DESCRIPTION: "Add X *Smite+ into your hand.",
  },
  Torrent: {
    NAME: "DEPRECATED Torrent",
    DESCRIPTION: "Deal !D! damage to ALL enemies !M! times. NL Exhaust.",
  },
  Windup: {
    NAME: "DEPRECATED Windup",
    DESCRIPTION: "Deal !D! damage. NL Gain !M! Vigor.",
  },
  Shield: {
    NAME: "DEPRECATED Shield",
    DESCRIPTION: "Retain. NL Gain !B! Block. NL Exhaust.",
  },
  CrescentKick: {
    NAME: "DEPRECATED Crescent Kick",
    DESCRIPTION:
      "Deal !D! damage. NL If you have Vigor, NL gain [W] and NL draw 1 card.",
  },
  TalkToTheHand: {
    NAME: "Talk to the Hand",
    DESCRIPTION:
      "Deal !D! damage. NL Whenever you attack this enemy, gain !M! Block. NL Exhaust.",
  },
  BattleHymn: {
    NAME: "Battle Hymn",
    DESCRIPTION: "At the start of each turn, add a *Smite into your hand.",
    UPGRADE_DESCRIPTION:
      "Innate. NL At the start of each turn, add a *Smite into your hand.",
  },
  Prostrate: {
    NAME: "Prostrate",
    DESCRIPTION: "Gain !M! Mantra. NL Gain !B! Block.",
    UPGRADE_DESCRIPTION: "DEPRECATED",
  },
  Punishment: {
    NAME: "DEPRECATED Punishment",
    DESCRIPTION: "Enter Punishment Stance.",
  },
  Eruption: {
    NAME: "Eruption",
    DESCRIPTION: "Deal !D! damage. NL Enter Wrath.",
  },
  ClearTheMind: {
    NAME: "Tranquility",
    DESCRIPTION: "Retain. NL Enter Calm. NL Exhaust.",
  },
  WaveOfTheHand: {
    NAME: "Wave of the Hand",
    DESCRIPTION:
      "Whenever you gain Block this turn, apply !M! Weak to ALL enemies.",
  },
  SpiritShield: {
    NAME: "Spirit Shield",
    DESCRIPTION: "Gain !M! Block for each card in your hand.",
    EXTENDED_DESCRIPTION: [" NL (Gain !B! Block.)"],
  },
  Vigilance: {
    NAME: "Vigilance",
    DESCRIPTION: "Gain !B! Block. NL Enter Calm.",
    UPGRADE_DESCRIPTION: "Deprecated.",
  },
  Serenity: {
    NAME: "DEPRECATED Serenity",
    DESCRIPTION: "While you are in Calm, HP loss is reduced by !M!.",
  },
  Crescendo: {
    NAME: "Crescendo",
    DESCRIPTION: "Retain. NL Enter Wrath. NL Exhaust.",
  },
  Transcendence: {
    NAME: "Transcendence",
    DESCRIPTION: "Upgrade all cards that Retain in your hand.",
  },
  FollowUp: {
    NAME: "Follow-Up",
    DESCRIPTION:
      "Deal !D! damage. NL If the last card played this combat was an Attack, gain [W].",
  },
  Perseverance: {
    NAME: "Perseverance",
    DESCRIPTION:
      "Retain. NL Gain !B! Block. NL When Retained, increase its Block by !M! this combat.",
  },
  CrushJoints: {
    NAME: "Crush Joints",
    DESCRIPTION:
      "Deal !D! damage. NL If the last card played this combat was a Skill, apply !M! Vulnerable.",
  },
  SashWhip: {
    NAME: "Sash Whip",
    DESCRIPTION:
      "Deal !D! damage. NL If the last card played this combat was an Attack, apply !M! Weak.",
  },
  Sanctity: {
    NAME: "Sanctity",
    DESCRIPTION:
      "Gain !B! Block. NL If the last card played this combat was a Skill, draw !M! cards.",
  },
  Omniscience: {
    NAME: "Omniscience",
    DESCRIPTION:
      "Choose a card in your draw pile. NL Play the chosen card twice and exhaust it. NL Exhaust.",
    UPGRADE_DESCRIPTION: "",
  },
  Scrawl: {
    NAME: "Scrawl",
    DESCRIPTION: "Draw cards until your hand is full. NL Exhaust.",
    UPGRADE_DESCRIPTION: "",
  },
  Swivel: {
    NAME: "Swivel",
    DESCRIPTION: "Gain !B! Block. NL The next Attack you play costs 0.",
  },
  Protect: {
    NAME: "Protect",
    DESCRIPTION: "Retain. NL Gain !B! Block.",
  },
  FlyingSleeves: {
    NAME: "Flying Sleeves",
    DESCRIPTION: "Retain. NL Deal !D! damage twice.",
  },
  MasterReality: {
    NAME: "Master Reality",
    DESCRIPTION: "Whenever a card is created during combat, Upgrade it.",
  },
  BowlingBash: {
    NAME: "Bowling Bash",
    DESCRIPTION: "Deal !D! damage for each enemy in combat.",
  },
  Unraveling: {
    NAME: "Unraveling",
    DESCRIPTION:
      "Play all of your cards from left to right. Targets are chosen randomly. NL Exhaust.",
  },
  BigBrain: {
    NAME: "DEPRECATED Big Brain",
    DESCRIPTION: "Retain. NL Draw 1 card. NL Exhaust.",
    UPGRADE_DESCRIPTION: "Retain. NL Draw 1 card.",
  },
  SandsOfTime: {
    NAME: "Sands of Time",
    DESCRIPTION:
      "Retain. NL Deal !D! damage. NL When Retained, lower its cost by 1 this combat.",
  },
  Brilliance: {
    NAME: "Brilliance",
    DESCRIPTION:
      "Deal !D! damage. NL Deals additional damage equal to Mantra gained this combat.",
    EXTENDED_DESCRIPTION: ["", ""],
  },
  Retribution: {
    NAME: "DEPRECATED Retribution",
    DESCRIPTION: "Whenever you lose HP, gain !M! Vigor.",
  },
  JustLucky: {
    NAME: "Just Lucky",
    DESCRIPTION: "Scry !M!. NL Gain !B! Block. NL Deal !D! damage.",
  },
  Weave: {
    NAME: "Weave",
    DESCRIPTION:
      "Deal !D! damage. NL Whenever you Scry, return this from the discard pile to your Hand.",
  },
  Adaptation: {
    NAME: "Rushdown",
    DESCRIPTION: "Whenever you enter Wrath, draw !M! cards.",
    UPGRADE_DESCRIPTION: "DEPRECATED",
  },
  Causality: {
    NAME: "Causality",
    DESCRIPTION: "Draw cards until your hand is full. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Retain. NL Draw cards until your hand is full. NL Exhaust.",
  },
  Wish: {
    NAME: "Wish",
    DESCRIPTION:
      "Choose one: NL Gain !B! Plated Armor, !D! Strength, or !M! Gold. NL Exhaust.",
    UPGRADE_DESCRIPTION: "",
  },
  CurseOfTheBell: {
    NAME: "Curse of the Bell",
    DESCRIPTION: "Unplayable. NL Cannot be removed from your deck.",
  },
  InnerPeace: {
    NAME: "Inner Peace",
    DESCRIPTION: "If you are in Calm, draw !M! cards, otherwise enter Calm.",
  },
  Tantrum: {
    NAME: "Tantrum",
    DESCRIPTION:
      "Deal !D! damage NL !M! times. NL Enter Wrath. NL Shuffle this card into your draw pile.",
  },
  Alpha: {
    NAME: "Alpha",
    DESCRIPTION: "Shuffle a *Beta into your draw pile. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Innate. NL Shuffle a *Beta into your draw pile. NL Exhaust.",
  },
  Beta: {
    NAME: "Beta",
    DESCRIPTION: "Shuffle an *Omega into your draw pile. NL Exhaust.",
    UPGRADE_DESCRIPTION: "",
  },
  Omega: {
    NAME: "Omega",
    DESCRIPTION: "At the end of your turn, deal !M! damage to ALL enemies.",
  },
  Vengeance: {
    NAME: "Simmering Fury",
    DESCRIPTION:
      "At the start of your next turn, enter Wrath and draw !M! cards.",
  },
  PathToVictory: {
    NAME: "Pressure Points",
    DESCRIPTION:
      "Apply !M! *Mark. NL ALL enemies lose HP equal to their *Mark.",
    UPGRADE_DESCRIPTION: "",
  },
  Wallop: {
    NAME: "Wallop",
    DESCRIPTION:
      "Deal !D! damage. NL Gain Block equal to unblocked damage dealt.",
  },
  Halt: {
    NAME: "Halt",
    DESCRIPTION:
      "Gain !B! Block. NL If you are in Wrath, gain !M! additional Block.",
  },
  WheelKick: {
    NAME: "Wheel Kick",
    DESCRIPTION: "Deal !D! damage. NL Draw !M! cards.",
    UPGRADE_DESCRIPTION: "",
  },
  Indignation: {
    NAME: "Indignation",
    DESCRIPTION:
      "If you are in Wrath, apply !M! Vulnerable to ALL enemies, otherwise enter Wrath.",
  },
  BecomeAlmighty: {
    NAME: "Become Almighty",
    DESCRIPTION: "Gain !M! Strength.",
  },
  LiveForever: {
    NAME: "Live Forever",
    DESCRIPTION: "Gain !M! *Plated *Armor.",
  },
  FameAndFortune: {
    NAME: "Fame and Fortune",
    DESCRIPTION: "Gain !M! Gold.",
  },
  ConjureBlade: {
    NAME: "Conjure Blade",
    DESCRIPTION: "Shuffle an *Expunger into your draw pile. NL Exhaust.",
    UPGRADE_DESCRIPTION:
      "Shuffle an *Expunger with X+1 into your draw pile. NL Exhaust.",
  },
  Expunger: {
    NAME: "Expunger",
    DESCRIPTION: "Deal !D! damage X times.",
    UPGRADE_DESCRIPTION: "",
    EXTENDED_DESCRIPTION: [
      "Deal !D! damage !M! times.",
      "Deal !D! damage !M! time.",
    ],
  },
  WaveOfTheHand2: {
    NAME: "DEPRECATED",
    DESCRIPTION: "DEPRECATED",
  },
  Discipline: {
    NAME: "DEPRECATED Discipline",
    DESCRIPTION:
      "If you end your turn with unused [W] , draw that many additional cards next turn.",
  },
  Flick: {
    NAME: "DEPRECATED Flick",
    DESCRIPTION:
      "Deal !D! damage. NL If an enemy is *Flicked 3 times, they take !M! damage.",
  },
  LikeWater: {
    NAME: "Like Water",
    DESCRIPTION: "At the end of your turn, if you are in Calm, gain !M! Block.",
  },
};

export const KeywordsLoc: Record<
  string,
  { NAMES: string[]; DESCRIPTION: string }
> = {
  ARTIFACT: {
    NAMES: ["artifact"],
    DESCRIPTION: "Negates the next debuff.",
  },
  BLOCK: {
    NAMES: ["block", "blocks"],
    DESCRIPTION: "Until next turn, prevents damage.",
  },
  BURN: {
    NAMES: ["burn", "burns"],
    DESCRIPTION: "Burns are unplayable status cards that damage you.",
  },
  CHANNEL: {
    NAMES: ["channel", "channeled"],
    DESCRIPTION:
      "Channeling an Orb puts it into your first empty slot. If you have no empty slots, your first Orb is automatically #yEvoked to make room.",
  },
  CONFUSED: {
    NAMES: ["confused"],
    DESCRIPTION: "Whenever you draw a card, randomize its cost.",
  },
  CURSE: {
    NAMES: ["curse"],
    DESCRIPTION: "Curse cards are negative cards that stay in your deck.",
  },
  DARK: {
    NAMES: ["dark", "dark+"],
    DESCRIPTION:
      "Orb: Increases damage every turn. When #yEvoked, deals damage to the enemy with the least HP.",
  },
  DAZED: {
    NAMES: ["dazed"],
    DESCRIPTION: "Dazed are unplayable status cards.",
  },
  DEXTERITY: {
    NAMES: ["dexterity"],
    DESCRIPTION: "Dexterity improves Block gained from cards.",
  },
  ETHEREAL: {
    NAMES: ["ethereal"],
    DESCRIPTION:
      "If this card is in your hand at the end of turn, it is exhausted. Exhausted cards are removed from your deck until the end of combat.",
  },
  EVOKE: {
    NAMES: ["evoke", "evoked"],
    DESCRIPTION: "Consume your rightmost Orb and use its Evoke effect.",
  },
  EXHAUST: {
    NAMES: ["exhaust", "exhausted", "exhausts"],
    DESCRIPTION: "Removed until end of combat.",
  },
  FOCUS: {
    NAMES: ["focus"],
    DESCRIPTION: "Focus increases the effectiveness of #yChanneled Orbs.",
  },
  FRAIL: {
    NAMES: ["frail"],
    DESCRIPTION: "While Frail, gain #b25% less #yBlock from cards.",
  },
  FROST: {
    NAMES: ["frost", "frost+"],
    DESCRIPTION: "Orb: Gains #yBlock.",
  },
  INNATE: {
    NAMES: ["innate"],
    DESCRIPTION: "Start each combat with this card in your hand.",
  },
  INTANGIBLE: {
    NAMES: ["intangible"],
    DESCRIPTION: "Reduce ALL damage taken and HP loss to #b1.",
  },
  LIGHTNING: {
    NAMES: ["lightning", "lightning+"],
    DESCRIPTION: "Orb: Deals damage to random enemies.",
  },
  LOCKED: {
    NAMES: ["locked"],
    DESCRIPTION: "This card has yet to be unlocked.",
  },
  LOCK_ON: {
    NAMES: ["lock-on"],
    DESCRIPTION: "Lock-On targets receive #b50% more damage from Orbs.",
  },
  OPENER: {
    NAMES: ["opener"],
    DESCRIPTION: "Opener cards may only be played as the first card each turn.",
  },
  PLASMA: {
    NAMES: ["plasma", "plasma+"],
    DESCRIPTION: "Orb: Gains Energy.",
  },
  POISON: {
    NAMES: ["poison", "poisoned"],
    DESCRIPTION:
      "Poisoned creatures lose HP at the start of their turn. Each turn, Poison is reduced by #b1.",
  },
  RETAIN: {
    NAMES: ["retain", "retains", "retained"],
    DESCRIPTION: "Retained cards are not discarded at the end of turn.",
  },
  SHIV: {
    NAMES: ["shiv", "shivs"],
    DESCRIPTION: "Shivs are #b0 cost Attack cards which Exhaust.",
  },
  STATUS: {
    NAMES: ["status"],
    DESCRIPTION: "Status cards are removed at the end of combat.",
  },
  STRENGTH: {
    NAMES: ["strength"],
    DESCRIPTION: "Strength adds additional damage to attacks.",
  },
  STRIKE: {
    NAMES: ["strike"],
    DESCRIPTION: 'Any card with the word "Strike" in its name.',
  },
  THORNS: {
    NAMES: ["thorns"],
    DESCRIPTION: "When receiving #yAttack damage, deals damage back.",
  },
  TRANSFORM: {
    NAMES: ["transform"],
    DESCRIPTION: "Transformed cards become a random card of any rarity.",
  },
  UNKNOWN: {
    NAMES: ["unknown"],
    DESCRIPTION: "This card has yet to be encountered.",
  },
  UNPLAYABLE: {
    NAMES: ["unplayable"],
    DESCRIPTION: "Unplayable cards cannot be played from your hand.",
  },
  UPGRADE: {
    NAMES: ["upgrade", "upgraded"],
    DESCRIPTION:
      "Upgrading cards makes them more powerful. Cards can only be upgraded once.",
  },
  VOID: {
    NAMES: ["void", "voids"],
    DESCRIPTION:
      "Voids are unplayable status cards that consume energy when drawn.",
  },
  VULNERABLE: {
    NAMES: ["vulnerable"],
    DESCRIPTION: "Vulnerable creatures take #b50% more damage from Attacks.",
  },
  WEAK: {
    NAMES: ["weak", "weaken", "weakened", "weakens"],
    DESCRIPTION: "Weakened creatures deal #b25% less damage with Attacks.",
  },
  WOUND: {
    NAMES: ["wound", "wounds"],
    DESCRIPTION: "Wounds are unplayable status cards.",
  },
  WRATH: {
    NAMES: ["wrath"],
    DESCRIPTION: "In this #yStance, you deal and receive double attack damage.",
  },
  CALM: {
    NAMES: ["calm"],
    DESCRIPTION: "Upon exiting this #yStance, gain [W] [W] .",
  },
  STANCE: {
    NAMES: ["stance", "stances"],
    DESCRIPTION: "You can only have one stance at a time.",
  },
  SCRY: {
    NAMES: ["scry"],
    DESCRIPTION:
      "Look at the top X cards of your draw pile. You may discard any of them.",
  },
  DIVINITY: {
    NAMES: ["divinity"],
    DESCRIPTION:
      "Upon entering this stance, gain [W] [W] [W] . Attacks deal triple damage. Exit this #yStance at the start of your next turn.",
  },
  PRAYER: {
    NAMES: ["mantra", "through violence"],
    DESCRIPTION: "When you obtain #b10 #yMantra, enter #yDivinity.",
  },
  VIGOR: {
    NAMES: ["vigor"],
    DESCRIPTION: "Your next Attack deals additional damage.",
  },
  REGEN: {
    NAMES: ["regen"],
    DESCRIPTION:
      "Regen heals HP at the end of your turn. Each turn, Regen is reduced by #b1.",
  },
  RITUAL: {
    NAMES: ["ritual"],
    DESCRIPTION: "Gain #yStrength at the end of your turn.",
  },
  FATAL: {
    NAMES: ["fatal"],
    DESCRIPTION: "Triggers whenever this card kills a non-minion enemy.",
  },
};

export const RelicsLoc: Record<
  string,
  { NAME: string; DESCRIPTIONS: string[] }
> = {
  Anchor: {
    NAME: "Anchor",
    DESCRIPTIONS: ["Start each combat with #b10 #yBlock."],
  },
  "Ancient Tea Set": {
    NAME: "Ancient Tea Set",
    DESCRIPTIONS: [
      "Whenever you enter a Rest Site, start the next combat with [E] [E] .",
    ],
  },
  "Art of War": {
    NAME: "Art of War",
    DESCRIPTIONS: [
      "If you do not play any #yAttacks during your turn, gain an additional [E] next turn.",
    ],
  },
  Astrolabe: {
    NAME: "Astrolabe",
    DESCRIPTIONS: ["Upon pickup, #yTransform #b3 cards, then #yUpgrade them."],
  },
  "Bag of Marbles": {
    NAME: "Bag of Marbles",
    DESCRIPTIONS: [
      "At the start of each combat, apply #b1 #yVulnerable to ALL enemies.",
    ],
  },
  "Bag of Preparation": {
    NAME: "Bag of Preparation",
    DESCRIPTIONS: ["At the start of each combat, draw #b2 additional cards."],
  },
  "Bird Faced Urn": {
    NAME: "Bird-Faced Urn",
    DESCRIPTIONS: ["Whenever you play a #yPower card, heal #b2 HP."],
  },
  "Black Blood": {
    NAME: "Black Blood",
    DESCRIPTIONS: [
      "Replaces #rBurning #rBlood. At the end of combat, heal #b12 HP.",
    ],
  },
  "Black Star": {
    NAME: "Black Star",
    DESCRIPTIONS: ["Elites drop an additional relic when defeated."],
  },
  "Blood Vial": {
    NAME: "Blood Vial",
    DESCRIPTIONS: ["At the start of each combat, heal #b2 HP."],
  },
  "Bloody Idol": {
    NAME: "Bloody Idol",
    DESCRIPTIONS: ["Whenever you gain #yGold, heal #b5 HP."],
  },
  "Blue Candle": {
    NAME: "Blue Candle",
    DESCRIPTIONS: [
      "#yUnplayable #rCurse cards can now be played. NL Whenever you play a #rCurse, lose #b1 HP and #yExhaust it.",
    ],
  },
  "Bottled Flame": {
    NAME: "Bottled Flame",
    DESCRIPTIONS: ["Start each combat with ", " in your hand."],
  },
  "Bottled Lightning": {
    NAME: "Bottled Lightning",
    DESCRIPTIONS: ["Start each combat with ", " in your hand."],
  },
  "Bottled Tornado": {
    NAME: "Bottled Tornado",
    DESCRIPTIONS: ["Start each combat with ", " in your hand."],
  },
  "Bronze Scales": {
    NAME: "Bronze Scales",
    DESCRIPTIONS: ["Start each combat with #b3 #yThorns."],
  },
  "Burning Blood": {
    NAME: "Burning Blood",
    DESCRIPTIONS: ["At the end of combat, heal #b6 HP."],
  },
  Cables: {
    NAME: "Gold-Plated Cables",
    DESCRIPTIONS: [
      "Your rightmost Orb triggers its passive an additional time.",
    ],
  },
  Calipers: {
    NAME: "Calipers",
    DESCRIPTIONS: [
      "At the start of your turn, lose #b15 #yBlock rather than all of your #yBlock.",
    ],
  },
  "Calling Bell": {
    NAME: "Calling Bell",
    DESCRIPTIONS: ["Upon pickup, obtain a unique #rCurse and #b3 relics."],
  },
  Cauldron: {
    NAME: "Cauldron",
    DESCRIPTIONS: ["Upon pickup, brews #b5 random potions."],
  },
  "Centennial Puzzle": {
    NAME: "Centennial Puzzle",
    DESCRIPTIONS: ["The first time you lose HP each combat, draw #b3 cards."],
  },
  "Chameleon Ring": {
    NAME: "Chameleon Ring",
    DESCRIPTIONS: ["You can now #yBrew at Rest Sites."],
  },
  "Champion Belt": {
    NAME: "Champion Belt",
    DESCRIPTIONS: ["Whenever you apply #yVulnerable, apply #b1 #yWeak."],
  },
  "Charon's Ashes": {
    NAME: "Charon's Ashes",
    DESCRIPTIONS: [
      "Whenever you #yExhaust a card, deal #b3 damage to ALL enemies.",
    ],
  },
  "Chemical X": {
    NAME: "Chemical X",
    DESCRIPTIONS: ["The effects of your cost #bX cards are increased by #b2"],
  },
  Circlet: {
    NAME: "Circlet",
    DESCRIPTIONS: ["Collect as many as you can."],
  },
  "Cracked Core": {
    NAME: "Cracked Core",
    DESCRIPTIONS: ["At the start of each combat, #yChannel #b1 #yLightning."],
  },
  FrozenCore: {
    NAME: "Frozen Core",
    DESCRIPTIONS: [
      "Replaces #bCracked #bCore. If you end your turn with any empty Orb slots, #yChannel #b1 #yFrost.",
    ],
  },
  "Cursed Key": {
    NAME: "Cursed Key",
    DESCRIPTIONS: [
      "Gain [E] at the start of your turn. Whenever you open a non-Boss chest, obtain a #rCurse.",
    ],
  },
  "Darkstone Periapt": {
    NAME: "Darkstone Periapt",
    DESCRIPTIONS: [
      "Whenever you obtain a #rCurse, increase your Max HP by #b6",
    ],
  },
  DataDisk: {
    NAME: "Data Disk",
    DESCRIPTIONS: ["Start each combat with #b1 #yFocus."],
  },
  "Dead Branch": {
    NAME: "Dead Branch",
    DESCRIPTIONS: [
      "Whenever you #yExhaust a card, add a random card into your hand.",
    ],
  },
  "Dream Catcher": {
    NAME: "Dream Catcher",
    DESCRIPTIONS: ["Whenever you #yRest, you may add a card into your deck."],
  },
  "Du-Vu Doll": {
    NAME: "Du-Vu Doll",
    DESCRIPTIONS: [
      "For each #rCurse in your deck, start each combat with #b1 #yStrength. You have #b",
      " #rCurses.",
    ],
  },
  Ectoplasm: {
    NAME: "Ectoplasm",
    DESCRIPTIONS: [
      "Gain [E] at the start of your turn. You can no longer gain #yGold.",
    ],
  },
  "Emotion Chip": {
    NAME: "Emotion Chip",
    DESCRIPTIONS: [
      "If you lost HP during the previous turn, trigger the passive ability of all Orbs at the start of your turn.",
    ],
  },
  Enchiridion: {
    NAME: "Enchiridion",
    DESCRIPTIONS: [
      "At the start of each combat, add a random #yPower card into your hand. It costs #b0 for that turn.",
    ],
  },
  "Eternal Feather": {
    NAME: "Eternal Feather",
    DESCRIPTIONS: [
      "For every #b5 cards in your deck, heal #b3 HP whenever you enter a Rest Site.",
    ],
  },
  "Frozen Egg 2": {
    NAME: "Frozen Egg",
    DESCRIPTIONS: [
      "Whenever you add a #yPower card into your deck, #yUpgrade it.",
    ],
  },
  "Frozen Eye": {
    NAME: "Frozen Eye",
    DESCRIPTIONS: [
      "When viewing your #yDraw #yPile, the cards are now shown in order.",
    ],
  },
  "Gambling Chip": {
    NAME: "Gambling Chip",
    DESCRIPTIONS: [
      "At the start of each combat, discard any number of cards, then draw that many cards.",
    ],
  },
  Ginger: {
    NAME: "Ginger",
    DESCRIPTIONS: ["You can no longer become #yWeakened."],
  },
  Girya: {
    NAME: "Girya",
    DESCRIPTIONS: [
      "You can now gain #yStrength at Rest Sites (up to 3 times).",
    ],
  },
  "Golden Idol": {
    NAME: "Golden Idol",
    DESCRIPTIONS: ["Enemies drop #b25% more #yGold."],
  },
  "Gremlin Horn": {
    NAME: "Gremlin Horn",
    DESCRIPTIONS: ["Whenever an enemy dies, gain [E] and draw #b1 card."],
  },
  "Happy Flower": {
    NAME: "Happy Flower",
    DESCRIPTIONS: ["Every #b3 turns, gain [E] ."],
  },
  "Ice Cream": {
    NAME: "Ice Cream",
    DESCRIPTIONS: ["Energy is now conserved between turns."],
  },
  Inserter: {
    NAME: "Inserter",
    DESCRIPTIONS: ["Every #b2 turns, gain #b1 Orb slot."],
  },
  "Juzu Bracelet": {
    NAME: "Juzu Bracelet",
    DESCRIPTIONS: [
      "Normal enemy combats are no longer encountered in #y? rooms.",
    ],
  },
  Kunai: {
    NAME: "Kunai",
    DESCRIPTIONS: [
      "Every time you play #b3 #yAttacks in a single turn, gain #b1 #yDexterity.",
    ],
  },
  Lantern: {
    NAME: "Lantern",
    DESCRIPTIONS: ["Start each combat with an additional [E] ."],
  },
  "Lee's Waffle": {
    NAME: "Lee's Waffle",
    DESCRIPTIONS: [
      "Upon pickup, raise your Max HP by #b7 and heal all of your HP.",
    ],
  },
  "Letter Opener": {
    NAME: "Letter Opener",
    DESCRIPTIONS: [
      "Every time you play #b3 #ySkills in a single turn, deal #b5 damage to ALL enemies.",
    ],
  },
  "Lizard Tail": {
    NAME: "Lizard Tail",
    DESCRIPTIONS: [
      "When you would die, heal to #b50% of your Max HP instead (works once).",
    ],
  },
  "Magic Flower": {
    NAME: "Magic Flower",
    DESCRIPTIONS: ["Healing is #b50% more effective during combat."],
  },
  Mango: {
    NAME: "Mango",
    DESCRIPTIONS: ["Upon pickup, raise your Max HP by #b14"],
  },
  "Mark of Pain": {
    NAME: "Mark of Pain",
    DESCRIPTIONS: [
      "Gain [R] at the start of your turn. At the start of combat, shuffle #b2 #rWounds into your draw pile.",
    ],
  },
  Matryoshka: {
    NAME: "Matryoshka",
    DESCRIPTIONS: [
      "The next #b",
      " non-Boss chests you open contain #b2 #yRelics.",
    ],
  },
  "Meat on the Bone": {
    NAME: "Meat on the Bone",
    DESCRIPTIONS: [
      "If your HP is at or below #b50% at the end of combat, heal #b12 HP.",
    ],
  },
  "Medical Kit": {
    NAME: "Medical Kit",
    DESCRIPTIONS: [
      "#yUnplayable #yStatus cards can now be played. Whenever you play a #yStatus card, #yExhaust it.",
    ],
  },
  "Membership Card": {
    NAME: "Membership Card",
    DESCRIPTIONS: ["#b50% discount on all products!"],
  },
  "Mercury Hourglass": {
    NAME: "Mercury Hourglass",
    DESCRIPTIONS: [
      "At the start of your turn, deal #b3 damage to ALL enemies.",
    ],
  },
  "Molten Egg 2": {
    NAME: "Molten Egg",
    DESCRIPTIONS: [
      "Whenever you add an #yAttack into your deck, #yUpgrade it.",
    ],
  },
  "Mummified Hand": {
    NAME: "Mummified Hand",
    DESCRIPTIONS: [
      "Whenever you play a #yPower card, a random card in your hand costs #b0 that turn.",
    ],
  },
  Necronomicon: {
    NAME: "Necronomicon",
    DESCRIPTIONS: [
      "The first #yAttack played each turn that costs #b2 or more is played twice. Upon pickup, obtain a special #rCurse.",
    ],
  },
  NeowsBlessing: {
    NAME: "Neow's Lament",
    DESCRIPTIONS: ["Enemies in your first #b3 combats will have #b1 HP."],
  },
  "Nilry's Codex": {
    NAME: "Nilry's Codex",
    DESCRIPTIONS: [
      "At the end of your turn, you may shuffle #b1 of #b3 random cards into your draw pile.",
    ],
  },
  "Ninja Scroll": {
    NAME: "Ninja Scroll",
    DESCRIPTIONS: [
      "At the start of each combat, add #b3 #yShivs into your hand.",
    ],
  },
  "Nloth's Gift": {
    NAME: "N'loth's Gift",
    DESCRIPTIONS: [
      "Triple the chance of finding #yRare cards from combat rewards.",
    ],
  },
  "Nuclear Battery": {
    NAME: "Nuclear Battery",
    DESCRIPTIONS: ["At the start of each combat, #yChannel #b1 #yPlasma."],
  },
  "Odd Mushroom": {
    NAME: "Odd Mushroom",
    DESCRIPTIONS: [
      "When #yVulnerable, take #b25% more attack damage rather than #b50%.",
    ],
  },
  "Oddly Smooth Stone": {
    NAME: "Oddly Smooth Stone",
    DESCRIPTIONS: ["Start each combat with #b1 #yDexterity."],
  },
  "Old Coin": {
    NAME: "Old Coin",
    DESCRIPTIONS: ["Upon pickup, gain #b300 #yGold."],
  },
  Omamori: {
    NAME: "Omamori",
    DESCRIPTIONS: ["Negate the next #b", " #rCurses you obtain."],
  },
  Orichalcum: {
    NAME: "Orichalcum",
    DESCRIPTIONS: ["If you end your turn without #yBlock, gain #b6 #yBlock."],
  },
  "Ornamental Fan": {
    NAME: "Ornamental Fan",
    DESCRIPTIONS: [
      "Every time you play #b3 #yAttacks in a single turn, gain #b4 #yBlock.",
    ],
  },
  Orrery: {
    NAME: "Orrery",
    DESCRIPTIONS: ["Upon pickup, choose and add #b5 cards to your deck."],
  },
  "Pandora's Box": {
    NAME: "Pandora's Box",
    DESCRIPTIONS: ["Upon pickup, #bTransform all Strike and Defend cards."],
  },
  Pantograph: {
    NAME: "Pantograph",
    DESCRIPTIONS: ["At the start of Boss combats, heal #b25 HP."],
  },
  "Paper Crane": {
    NAME: "Paper Krane",
    DESCRIPTIONS: [
      "Enemies with #yWeak deal #b40% less damage rather than #b25%.",
    ],
  },
  "Paper Frog": {
    NAME: "Paper Phrog",
    DESCRIPTIONS: [
      "Enemies with #yVulnerable take #b75% more damage rather than #b50%.",
    ],
  },
  "Peace Pipe": {
    NAME: "Peace Pipe",
    DESCRIPTIONS: ["You can now remove cards from your deck at Rest Sites."],
  },
  Pear: {
    NAME: "Pear",
    DESCRIPTIONS: ["Upon pickup, raise your Max HP by #b10"],
  },
  "Pen Nib": {
    NAME: "Pen Nib",
    DESCRIPTIONS: ["Every #b10th #yAttack you play deals double damage."],
  },
  "Philosopher's Stone": {
    NAME: "Philosopher's Stone",
    DESCRIPTIONS: [
      "Gain [E] at the start of your turn. ALL enemies start combat with #b1 #yStrength.",
    ],
  },
  "Potion Belt": {
    NAME: "Potion Belt",
    DESCRIPTIONS: ["Upon pickup, gain #b2 Potion slots."],
  },
  "Prayer Wheel": {
    NAME: "Prayer Wheel",
    DESCRIPTIONS: ["Normal enemies drop an additional card reward."],
  },
  "Question Card": {
    NAME: "Question Card",
    DESCRIPTIONS: [
      "Future card rewards have #b1 additional card to choose from.",
    ],
  },
  "Red Mask": {
    NAME: "Red Mask",
    DESCRIPTIONS: [
      "At the start of each combat, apply #b1 #yWeak to ALL enemies.",
    ],
  },
  "Red Skull": {
    NAME: "Red Skull",
    DESCRIPTIONS: [
      "While your HP is at or below #b50%, you have #b3 additional #yStrength.",
    ],
  },
  "Regal Pillow": {
    NAME: "Regal Pillow",
    DESCRIPTIONS: ["Whenever you #yRest, heal an additional #b15 HP."],
  },
  "Ring of the Serpent": {
    NAME: "Ring of the Serpent",
    DESCRIPTIONS: [
      "Replaces #gRing #gof #gthe #gSnake. At the start of your turn, draw #b1 additional card.",
    ],
  },
  "Ring of the Snake": {
    NAME: "Ring of the Snake",
    DESCRIPTIONS: ["At the start of each combat, draw #b2 additional cards."],
  },
  "Runic Capacitor": {
    NAME: "Runic Capacitor",
    DESCRIPTIONS: ["Start each combat with #b3 additional Orb slots."],
  },
  "Runic Cube": {
    NAME: "Runic Cube",
    DESCRIPTIONS: ["Whenever you lose HP, draw #b1 card."],
  },
  "Runic Dome": {
    NAME: "Runic Dome",
    DESCRIPTIONS: [
      "Gain [E] at the start of your turn. You can no longer see enemy intents.",
    ],
  },
  "Runic Pyramid": {
    NAME: "Runic Pyramid",
    DESCRIPTIONS: ["At the end of your turn, you no longer discard your hand."],
  },
  "Self Forming Clay": {
    NAME: "Self-Forming Clay",
    DESCRIPTIONS: ["Whenever you lose HP, gain #b3 #yBlock next turn."],
  },
  Shovel: {
    NAME: "Shovel",
    DESCRIPTIONS: ["You can now #yDig for relics at Rest Sites."],
  },
  Shuriken: {
    NAME: "Shuriken",
    DESCRIPTIONS: [
      "Every time you play #b3 #yAttacks in a single turn, gain #b1 #yStrength.",
    ],
  },
  "Singing Bowl": {
    NAME: "Singing Bowl",
    DESCRIPTIONS: [
      "When adding cards into your deck, you may raise your Max HP by #b2 instead.",
    ],
  },
  "Smiling Mask": {
    NAME: "Smiling Mask",
    DESCRIPTIONS: [
      "The Merchant's card removal service now always costs #b50 #yGold.",
    ],
  },
  "Snake Skull": {
    NAME: "Snecko Skull",
    DESCRIPTIONS: [
      "Whenever you apply #yPoison, apply an additional #b1 #yPoison.",
    ],
  },
  "Snecko Eye": {
    NAME: "Snecko Eye",
    DESCRIPTIONS: [
      "At the start of your turn, draw #b2 additional cards. Start each combat #yConfused.",
    ],
  },
  Sozu: {
    NAME: "Sozu",
    DESCRIPTIONS: [
      "Gain [E] at the start of your turn. You can no longer obtain potions.",
    ],
  },
  "Spirit Poop": {
    NAME: "Spirit Poop",
    DESCRIPTIONS: ["It's unpleasant."],
  },
  "Strange Spoon": {
    NAME: "Strange Spoon",
    DESCRIPTIONS: [
      "Cards which #yExhaust when played will instead discard #b50% of the time.",
    ],
  },
  Strawberry: {
    NAME: "Strawberry",
    DESCRIPTIONS: ["Upon pickup, raise your Max HP by #b"],
  },
  Sundial: {
    NAME: "Sundial",
    DESCRIPTIONS: [
      "Every #b3 times you shuffle your draw pile, gain [E] [E] .",
    ],
  },
  "Symbiotic Virus": {
    NAME: "Symbiotic Virus",
    DESCRIPTIONS: ["At the start of each combat, #yChannel #b1 #yDark."],
  },
  "The Courier": {
    NAME: "The Courier",
    DESCRIPTIONS: [
      "The Merchant restocks cards, relics, and potions. All prices are reduced by #b20%.",
    ],
  },
  "The Specimen": {
    NAME: "The Specimen",
    DESCRIPTIONS: [
      "Whenever an enemy dies, transfer any #yPoison it has to a random enemy.",
    ],
  },
  "Thread and Needle": {
    NAME: "Thread and Needle",
    DESCRIPTIONS: ["Start each combat with #b4 #yPlated #yArmor."],
  },
  Tingsha: {
    NAME: "Tingsha",
    DESCRIPTIONS: [
      "Whenever you discard a card during your turn, deal #b3 damage to a random enemy.",
    ],
  },
  "Tiny Chest": {
    NAME: "Tiny Chest",
    DESCRIPTIONS: ["Every #b4th #y? room is a #yTreasure room."],
  },
  "Tiny House": {
    NAME: "Tiny House",
    DESCRIPTIONS: [
      "Upon pickup, obtain #b1 potion. NL Gain #b50 #yGold. NL Raise your Max HP by #b5. NL Obtain #b1 card. NL Upgrade #b1 random card.",
    ],
  },
  Toolbox: {
    NAME: "Toolbox",
    DESCRIPTIONS: [
      "At the start of each combat, choose #b1 of #b3 random Colorless cards and add the chosen card into your hand.",
    ],
  },
  Torii: {
    NAME: "Torii",
    DESCRIPTIONS: [
      "Whenever you would receive #b5 or less unblocked attack damage, reduce it to #b1.",
    ],
  },
  "Tough Bandages": {
    NAME: "Tough Bandages",
    DESCRIPTIONS: [
      "Whenever you discard a card during your turn, gain #b3 #yBlock.",
    ],
  },
  "Toxic Egg 2": {
    NAME: "Toxic Egg",
    DESCRIPTIONS: ["Whenever you add a #ySkill into your deck, #yUpgrade it."],
  },
  "Toy Ornithopter": {
    NAME: "Toy Ornithopter",
    DESCRIPTIONS: ["Whenever you use a potion, heal #b5 HP."],
  },
  Turnip: {
    NAME: "Turnip",
    DESCRIPTIONS: ["You can no longer become #yFrail."],
  },
  "Unceasing Top": {
    NAME: "Unceasing Top",
    DESCRIPTIONS: [
      "Whenever you have no cards in hand during your turn, draw a card.",
    ],
  },
  Vajra: {
    NAME: "Vajra",
    DESCRIPTIONS: ["Start each combat with #b1 #yStrength."],
  },
  "Velvet Choker": {
    NAME: "Velvet Choker",
    DESCRIPTIONS: [
      "Gain [E] at the start of your turn. You cannot play more than #b6 cards per turn.",
    ],
  },
  "War Paint": {
    NAME: "War Paint",
    DESCRIPTIONS: ["Upon pickup, #yUpgrade #b2 random #ySkills."],
  },
  Whetstone: {
    NAME: "Whetstone",
    DESCRIPTIONS: ["Upon pickup, #yUpgrade #b2 random #yAttacks."],
  },
  "White Beast Statue": {
    NAME: "White Beast Statue",
    DESCRIPTIONS: ["Potions always appear in combat rewards."],
  },
  Boot: {
    NAME: "The Boot",
    DESCRIPTIONS: [
      "Whenever you would deal #b4 or less unblocked attack damage, increase it to #b5.",
    ],
  },
  "Mark of the Bloom": {
    NAME: "Mark of the Bloom",
    DESCRIPTIONS: ["You can no longer heal."],
  },
  "Busted Crown": {
    NAME: "Busted Crown",
    DESCRIPTIONS: [
      "Gain [E] at the start of your turn. Future card rewards have #b2 less cards to choose from.",
    ],
  },
  "Incense Burner": {
    NAME: "Incense Burner",
    DESCRIPTIONS: ["Every #b6 turns, gain #b1 #yIntangible."],
  },
  "Empty Cage": {
    NAME: "Empty Cage",
    DESCRIPTIONS: ["Upon pickup, remove #b2 cards from your deck."],
  },
  "Fusion Hammer": {
    NAME: "Fusion Hammer",
    DESCRIPTIONS: [
      "Gain [E] at the start of your turn. You can no longer #ySmith at Rest Sites.",
    ],
  },
  "Coffee Dripper": {
    NAME: "Coffee Dripper",
    DESCRIPTIONS: [
      "Gain [E] at the start of your turn. You can no longer #yRest at Rest Sites.",
    ],
  },
  SsserpentHead: {
    NAME: "Ssserpent Head",
    DESCRIPTIONS: ["Whenever you enter a #y? room, gain #b50 #yGold."],
  },
  MutagenicStrength: {
    NAME: "Mutagenic Strength",
    DESCRIPTIONS: [
      "Start each combat with #b3 #yStrength. At the end of your first turn, lose #b3 #yStrength.",
    ],
  },
  FaceOfCleric: {
    NAME: "Face Of Cleric",
    DESCRIPTIONS: ["At the end of combat, raise your Max HP by #b1."],
  },
  NlothsMask: {
    NAME: "N'loth's Hungry Face",
    DESCRIPTIONS: ["The next non-Boss chest you open is empty."],
  },
  GremlinMask: {
    NAME: "Gremlin Visage",
    DESCRIPTIONS: ["Start each combat with #b1 #yWeak."],
  },
  CultistMask: {
    NAME: "Cultist Headpiece",
    DESCRIPTIONS: ["You feel more talkative."],
  },
  TheAbacus: {
    NAME: "The Abacus",
    DESCRIPTIONS: ["Whenever you shuffle your draw pile, gain #b6 #yBlock."],
  },
  DollysMirror: {
    NAME: "Dolly's Mirror",
    DESCRIPTIONS: [
      "Upon pickup, obtain an additional copy of a card in your deck.",
    ],
  },
  ClockworkSouvenir: {
    NAME: "Clockwork Souvenir",
    DESCRIPTIONS: ["Start each combat with #b1 #yArtifact."],
  },
  MealTicket: {
    NAME: "Meal Ticket",
    DESCRIPTIONS: ["Whenever you enter a shop, heal #b15 HP."],
  },
  TwistedFunnel: {
    NAME: "Twisted Funnel",
    DESCRIPTIONS: [
      "At the start of each combat, apply #b4 #yPoison to ALL enemies.",
    ],
  },
  HandDrill: {
    NAME: "Hand Drill",
    DESCRIPTIONS: [
      "Whenever you break an enemy's #yBlock, apply #b2 #yVulnerable.",
    ],
  },
  HoveringKite: {
    NAME: "Hovering Kite",
    DESCRIPTIONS: ["The first time you discard a card each turn, gain [E] ."],
  },
  Sling: {
    NAME: "Sling of Courage",
    DESCRIPTIONS: ["Start each Elite combat with #b2 #yStrength."],
  },
  OrangePellets: {
    NAME: "Orange Pellets",
    DESCRIPTIONS: [
      "Whenever you play a #yPower, #yAttack, and #ySkill in the same turn, remove all of your debuffs.",
    ],
  },
  WristBlade: {
    NAME: "Wrist Blade",
    DESCRIPTIONS: ["#yAttacks that cost #b0 deal #b4 additional damage."],
  },
  StoneCalendar: {
    NAME: "Stone Calendar",
    DESCRIPTIONS: ["At the end of turn #b7, deal #b52 damage to ALL enemies."],
  },
  Nunchaku: {
    NAME: "Nunchaku",
    DESCRIPTIONS: ["Every time you play #b10 #yAttacks, gain [E] ."],
  },
  Brimstone: {
    NAME: "Brimstone",
    DESCRIPTIONS: [
      "At the start of your turn, gain #b2 #yStrength and ALL enemies gain #b1 #yStrength.",
    ],
  },
  PreservedInsect: {
    NAME: "Preserved Insect",
    DESCRIPTIONS: ["Enemies in Elite combats have #b25% less HP."],
  },
  Pocketwatch: {
    NAME: "Pocketwatch",
    DESCRIPTIONS: [
      "Whenever you play #b3 or less cards during your turn, draw #b3 additional cards at the start of your next turn.",
    ],
  },
  FossilizedHelix: {
    NAME: "Fossilized Helix",
    DESCRIPTIONS: ["Prevent the first time you would lose HP each combat."],
  },
  PrismaticShard: {
    NAME: "Prismatic Shard",
    DESCRIPTIONS: [
      "Combat reward screens now contain Colorless cards and cards from other colors.",
    ],
  },
  WarpedTongs: {
    NAME: "Warped Tongs",
    DESCRIPTIONS: [
      "At the start of your turn, #yUpgrade a random card in your hand for the rest of combat.",
    ],
  },
  WingedGreaves: {
    NAME: "Wing Boots",
    DESCRIPTIONS: [
      "You may ignore paths when choosing the next room to travel to #b3 times.",
    ],
  },
  MawBank: {
    NAME: "Maw Bank",
    DESCRIPTIONS: [
      "Whenever you climb a floor, gain #b",
      " #yGold. No longer works when you spend any #yGold at a shop.",
    ],
  },
  Melange: {
    NAME: "Melange",
    DESCRIPTIONS: ["Whenever you shuffle your draw pile, #yScry #b3."],
  },
  PureWater: {
    NAME: "Pure Water",
    DESCRIPTIONS: [
      "At the start of each combat, add a #yMiracle into your hand.",
    ],
  },
  HolyWater: {
    NAME: "Holy Water",
    DESCRIPTIONS: [
      "Replaces #pPure #pWater. At the start of each combat, add #b3 #yMiracles into your hand.",
    ],
  },
  SacredBark: {
    NAME: "Sacred Bark",
    DESCRIPTIONS: ["Double the effectiveness of potions."],
  },
  InkBottle: {
    NAME: "Ink Bottle",
    DESCRIPTIONS: ["Whenever you play #b10 cards, draw #b1 card."],
  },
  Yin: {
    NAME: "DEPRECATED Yin",
    DESCRIPTIONS: [
      "Whenever you play a #ySkill, gain #b1 temporary #yStrength.",
    ],
  },
  Yang: {
    NAME: "Duality",
    DESCRIPTIONS: [
      "Whenever you play an #yAttack, gain #b1 temporary #yDexterity.",
    ],
  },
  Akabeko: {
    NAME: "Akabeko",
    DESCRIPTIONS: [
      "Your first Attack each combat deals #b8 additional damage.",
    ],
  },
  VioletLotus: {
    NAME: "Violet Lotus",
    DESCRIPTIONS: ["Whenever you exit #yCalm, gain an additional [E] ."],
  },
  TeardropLocket: {
    NAME: "Teardrop Locket",
    DESCRIPTIONS: ["Start each combat in #yCalm."],
  },
  CeramicFish: {
    NAME: "Ceramic Fish",
    DESCRIPTIONS: ["Whenever you add a card to your deck, gain #b9 #yGold."],
  },
  SlaversCollar: {
    NAME: "Slaver's Collar",
    DESCRIPTIONS: [
      "During Boss and Elite combats, gain [E] at the start of your turn.",
    ],
  },
  StrikeDummy: {
    NAME: "Strike Dummy",
    DESCRIPTIONS: ['Cards containing "Strike" deal #b3 additional damage.'],
  },
  CloakClasp: {
    NAME: "Cloak Clasp",
    DESCRIPTIONS: [
      "At the end of your turn, gain #b1 #yBlock for each card in your hand.",
    ],
  },
  TungstenRod: {
    NAME: "Tungsten Rod",
    DESCRIPTIONS: ["Whenever you would lose HP, lose #b1 less."],
  },
  HornCleat: {
    NAME: "Horn Cleat",
    DESCRIPTIONS: ["At the start of your 2nd turn, gain #b14 #yBlock."],
  },
  CaptainsWheel: {
    NAME: "Captain's Wheel",
    DESCRIPTIONS: ["At the start of your 3rd turn, gain #b18 #yBlock."],
  },
  GoldenEye: {
    NAME: "Golden Eye",
    DESCRIPTIONS: ["Whenever you #yScry, #yScry #b2 additional cards."],
  },
  Damaru: {
    NAME: "Damaru",
    DESCRIPTIONS: ["At the start of your turn, gain #b1 #yMantra."],
  },
};

export const PotionsLoc: Record<
  string,
  { NAME: string; DESCRIPTIONS: string[] }
> = {
  "Ancient Potion": {
    NAME: "Ancient Potion",
    DESCRIPTIONS: ["Gain #b1 #yArtifact.", "Gain #b2 #yArtifact."],
  },
  AttackPotion: {
    NAME: "Attack Potion",
    DESCRIPTIONS: [
      "Choose #b1 of #b3 random #yAttack cards to add to your hand, it costs #b0 this turn.",
      "Choose #b1 of #b3 random #yAttack cards and add #b2 copies to your hand, they cost #b0 this turn.",
    ],
  },
  "Block Potion": {
    NAME: "Block Potion",
    DESCRIPTIONS: ["Gain #b12 #yBlock.", "Gain #b24 #yBlock."],
  },
  BloodPotion: {
    NAME: "Blood Potion",
    DESCRIPTIONS: [
      "Heal for #b20% of your Max HP.",
      "Heal for #b40% of your Max HP.",
    ],
  },
  "Dexterity Potion": {
    NAME: "Dexterity Potion",
    DESCRIPTIONS: ["Gain #b2 #yDexterity.", "Gain #b4 #yDexterity."],
  },
  "Energy Potion": {
    NAME: "Energy Potion",
    DESCRIPTIONS: ["Gain #b2 Energy.", "Gain #b4 Energy."],
  },
  EntropicBrew: {
    NAME: "Entropic Brew",
    DESCRIPTIONS: ["Fill all your empty potion slots with random potions."],
  },
  EssenceOfSteel: {
    NAME: "Essence of Steel",
    DESCRIPTIONS: ["Gain #b4 #yPlated #yArmor.", "Gain #b8 #yPlated #yArmor."],
  },
  "Explosive Potion": {
    NAME: "Explosive Potion",
    DESCRIPTIONS: [
      "Deal #b10 damage to ALL enemies.",
      "Deal #b20 damage to ALL enemies.",
    ],
  },
  FairyPotion: {
    NAME: "Fairy in a Bottle",
    DESCRIPTIONS: [
      "When you would die, heal to #b30% of your Max HP instead and discard this potion.",
      "When you would die, heal to #b60% of your Max HP instead and discard this potion.",
    ],
  },
  FearPotion: {
    NAME: "Fear Potion",
    DESCRIPTIONS: ["Apply #b3 #yVulnerable.", "Apply #b6 #yVulnerable."],
  },
  "Fire Potion": {
    NAME: "Fire Potion",
    DESCRIPTIONS: ["Deal #b20 damage.", "Deal #b40 damage."],
  },
  FocusPotion: {
    NAME: "Focus Potion",
    DESCRIPTIONS: ["Gain #b2 #yFocus.", "Gain #b4 #yFocus."],
  },
  "Fruit Juice": {
    NAME: "Fruit Juice",
    DESCRIPTIONS: ["Gain #b5 Max HP.", "Gain #b10 Max HP."],
  },
  GamblersBrew: {
    NAME: "Gambler's Brew",
    DESCRIPTIONS: ["Discard any number of cards then draw that many."],
  },
  GhostInAJar: {
    NAME: "Ghost in a Jar",
    DESCRIPTIONS: ["Gain #b1 #yIntangible.", "Gain #b2 #yIntangible."],
  },
  LiquidBronze: {
    NAME: "Liquid Bronze",
    DESCRIPTIONS: ["Gain #b3 #yThorns.", "Gain #b6 #yThorns."],
  },
  "Poison Potion": {
    NAME: "Poison Potion",
    DESCRIPTIONS: ["Apply #b6 #yPoison.", "Apply #b12 #yPoison."],
  },
  "Potion Slot": {
    NAME: "Potion Slot",
    DESCRIPTIONS: [
      "Use potions during combat to gain #gbonuses or #rhinder enemies.",
    ],
  },
  PowerPotion: {
    NAME: "Power Potion",
    DESCRIPTIONS: [
      "Choose #b1 of #b3 random #yPower cards to add to your hand, it costs #b0 this turn.",
      "Choose #b1 of #b3 random #yPower cards and add #b2 copies to your hand, they cost #b0 this turn.",
    ],
  },
  "Regen Potion": {
    NAME: "Regen Potion",
    DESCRIPTIONS: ["Gain #b5 #yRegen.", "Gain #b10 #yRegen."],
  },
  SkillPotion: {
    NAME: "Skill Potion",
    DESCRIPTIONS: [
      "Choose #b1 of #b3 random #ySkill cards to add to your hand, it costs #b0 this turn.",
      "Choose #b1 of #b3 random #ySkill cards and add #b2 copies to your hand, they cost #b0 this turn.",
    ],
  },
  SmokeBomb: {
    NAME: "Smoke Bomb",
    DESCRIPTIONS: ["Escape from a non-boss combat. Receive no rewards."],
  },
  SneckoOil: {
    NAME: "Snecko Oil",
    DESCRIPTIONS: [
      "Draw #b5 cards. Randomize the cost of cards in your hand.",
      "Draw #b10 cards. Randomize the cost of cards in your hand.",
    ],
  },
  SpeedPotion: {
    NAME: "Speed Potion",
    DESCRIPTIONS: [
      "Gain #b5 #yDexterity. At the end of your turn, lose #b5 #yDexterity.",
      "Gain #b10 #yDexterity. At the end of your turn, lose #b10 #yDexterity.",
    ],
  },
  SteroidPotion: {
    NAME: "Flex Potion",
    DESCRIPTIONS: [
      "Gain #b5 #yStrength. At the end of your turn, lose #b5 #yStrength.",
      "Gain #b10 #yStrength. At the end of your turn, lose #b10 #yStrength.",
    ],
  },
  "Strength Potion": {
    NAME: "Strength Potion",
    DESCRIPTIONS: ["Gain #b2 #yStrength.", "Gain #b4 #yStrength."],
  },
  "Swift Potion": {
    NAME: "Swift Potion",
    DESCRIPTIONS: ["Draw #b3 cards.", "Draw #b6 cards."],
  },
  "Weak Potion": {
    NAME: "Weak Potion",
    DESCRIPTIONS: ["Apply #b3 #yWeak.", "Apply #b6 #yWeak."],
  },
  StancePotion: {
    NAME: "Stance Potion",
    DESCRIPTIONS: ["Enter #yCalm or #yWrath."],
  },
  DuplicationPotion: {
    NAME: "Duplication Potion",
    DESCRIPTIONS: [
      "This turn, your next card is played twice.",
      "This turn, your next #b2 cards are played twice.",
    ],
  },
  ElixirPotion: {
    NAME: "Elixir",
    DESCRIPTIONS: ["#yExhaust any number of cards in your hand."],
  },
  HeartOfIron: {
    NAME: "Heart of Iron",
    DESCRIPTIONS: ["Gain #b6 #yMetallicize.", "Gain #b12 #yMetallicize."],
  },
  CunningPotion: {
    NAME: "Cunning Potion",
    DESCRIPTIONS: [
      "Add #b3 #yShiv+ to your hand.",
      "Add #b6 #yShiv+ to your hand.",
    ],
  },
  PotionOfCapacity: {
    NAME: "Potion Of Capacity",
    DESCRIPTIONS: ["Gain #b2 Orb slots.", "Gain #b4 Orb slots."],
  },
  EssenceOfDarkness: {
    NAME: "Essence Of Darkness",
    DESCRIPTIONS: [
      "#yChannel #b1 #yDark for each orb slot.",
      "#yChannel #b2 #yDark for each orb slot.",
    ],
  },
  BottledMiracle: {
    NAME: "Bottled Miracle",
    DESCRIPTIONS: [
      "Add #b2 #yMiracles to your hand.",
      "Add #b4 #yMiracles to your hand.",
    ],
  },
  Ambrosia: {
    NAME: "Ambrosia",
    DESCRIPTIONS: ["Enter #yDivinity #yStance."],
  },
  DistilledChaos: {
    NAME: "Distilled Chaos",
    DESCRIPTIONS: [
      "Play the top #b3 cards of your draw pile.",
      "Play the top #b6 cards of your draw pile.",
    ],
  },
  LiquidMemories: {
    NAME: "Liquid Memories",
    DESCRIPTIONS: [
      "Choose a card in your discard pile and return it to your hand. It costs #b0 this turn.",
      "Choose #b2 cards in your discard pile and return them to your hand. They cost #b0 this turn.",
    ],
  },
  CultistPotion: {
    NAME: "Cultist Potion",
    DESCRIPTIONS: ["Gain #b1 #yRitual.", "Gain #b2 #yRitual."],
  },
  ColorlessPotion: {
    NAME: "Colorless Potion",
    DESCRIPTIONS: [
      "Choose #b1 of #b3 random #yColorless cards to add to your hand, it costs #b0 this turn.",
      "Choose #b1 of #b3 random #yColorless cards and add #b2 copies to your hand, they cost #b0 this turn.",
    ],
  },
  BlessingOfTheForge: {
    NAME: "Blessing of the Forge",
    DESCRIPTIONS: ["Upgrade all cards in your hand for the rest of combat."],
  },
};
