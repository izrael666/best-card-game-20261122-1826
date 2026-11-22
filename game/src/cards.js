// Ember Isles card database: 48 original cards, 12 per faction.
// Each card: id, name, faction, cost, type, and an effect object the engine applies.
// Effects: dmg (to foe), block, heal, draw, mana (this turn), burn (stacks on foe),
// weaken (foe's attacks lose N next turn), surgeBonus (extra when Surge triggers).
// Types: strike (damage), guard (block), trick (draw/mana/control), charm (heal/utility).

export const CARDS = {
  // ---- Ember: red flame, raw damage and burn ----
  spark:       { name: 'Spark',        faction: 'ember', cost: 1, type: 'strike', dmg: 3, text: 'Deal 3 damage.' },
  cinderClaw:  { name: 'Cinder Claw',  faction: 'ember', cost: 1, type: 'strike', dmg: 4, text: 'Deal 4 damage.' },
  coalToss:    { name: 'Coal Toss',    faction: 'ember', cost: 0, type: 'strike', dmg: 2, text: 'Deal 2 damage.' },
  flameLash:   { name: 'Flame Lash',   faction: 'ember', cost: 2, type: 'strike', dmg: 6, text: 'Deal 6 damage.' },
  firebrand:   { name: 'Firebrand',    faction: 'ember', cost: 2, type: 'strike', dmg: 5, surgeBonus: 3, text: 'Deal 5 damage. Surge: +3 damage.' },
  ignite:      { name: 'Ignite',       faction: 'ember', cost: 1, type: 'strike', dmg: 2, burn: 2, text: 'Deal 2 damage. Burn 2.' },
  wildfire:    { name: 'Wildfire',     faction: 'ember', cost: 3, type: 'strike', dmg: 9, burn: 2, text: 'Deal 9 damage. Burn 2.' },
  magmaBurst:  { name: 'Magma Burst',  faction: 'ember', cost: 4, type: 'strike', dmg: 12, text: 'Deal 12 damage.' },
  phoenixFeather: { name: 'Phoenix Feather', faction: 'ember', cost: 2, type: 'charm', dmg: 5, heal: 2, text: 'Deal 5 damage. Heal 2.' },
  ashenGust:   { name: 'Ashen Gust',   faction: 'ember', cost: 2, type: 'strike', dmg: 4, weaken: 2, text: 'Deal 4 damage. Weaken 2.' },
  cinderWall:  { name: 'Cinder Wall',  faction: 'ember', cost: 1, type: 'guard', block: 5, text: 'Gain 5 Block.' },
  solarFlare:  { name: 'Solar Flare',  faction: 'ember', cost: 3, type: 'strike', dmg: 8, burn: 3, text: 'Deal 8 damage. Burn 3.' },

  // ---- Tide: blue wave, healing, draw and control ----
  ripple:      { name: 'Ripple',       faction: 'tide', cost: 1, type: 'strike', dmg: 2, draw: 1, text: 'Deal 2 damage. Draw 1.' },
  pearlDive:   { name: 'Pearl Dive',   faction: 'tide', cost: 0, type: 'trick', draw: 1, text: 'Draw 1 card.' },
  mistVeil:    { name: 'Mist Veil',    faction: 'tide', cost: 1, type: 'guard', block: 5, text: 'Gain 5 Block.' },
  undertow:    { name: 'Undertow',     faction: 'tide', cost: 1, type: 'strike', dmg: 3, weaken: 2, text: 'Deal 3 damage. Weaken 2.' },
  healingRain: { name: 'Healing Rain', faction: 'tide', cost: 2, type: 'charm', heal: 6, text: 'Heal 6.' },
  moonpool:    { name: 'Moonpool',     faction: 'tide', cost: 2, type: 'charm', heal: 4, draw: 1, text: 'Heal 4. Draw 1.' },
  tidalPull:   { name: 'Tidal Pull',   faction: 'tide', cost: 2, type: 'strike', dmg: 5, draw: 1, text: 'Deal 5 damage. Draw 1.' },
  coralGuard:  { name: 'Coral Guard',  faction: 'tide', cost: 2, type: 'guard', block: 8, text: 'Gain 8 Block.' },
  sirenSong:   { name: 'Siren Song',   faction: 'tide', cost: 2, type: 'charm', block: 6, heal: 2, text: 'Gain 6 Block. Heal 2.' },
  deepCurrent: { name: 'Deep Current', faction: 'tide', cost: 3, type: 'strike', dmg: 7, heal: 3, text: 'Deal 7 damage. Heal 3.' },
  flood:       { name: 'Flood',        faction: 'tide', cost: 3, type: 'strike', dmg: 8, text: 'Deal 8 damage.' },
  stormSurge:  { name: 'Storm Surge',  faction: 'tide', cost: 4, type: 'strike', dmg: 10, heal: 4, text: 'Deal 10 damage. Heal 4.' },

  // ---- Gale: green leaf, draw, mana and tempo ----
  zephyr:      { name: 'Zephyr',       faction: 'gale', cost: 1, type: 'strike', dmg: 3, draw: 1, text: 'Deal 3 damage. Draw 1.' },
  tailwind:    { name: 'Tailwind',     faction: 'gale', cost: 0, type: 'trick', mana: 2, text: 'Gain 2 mana this turn.' },
  leafDance:   { name: 'Leaf Dance',   faction: 'gale', cost: 1, type: 'trick', draw: 2, text: 'Draw 2 cards.' },
  seedling:    { name: 'Seedling',     faction: 'gale', cost: 1, type: 'charm', heal: 3, draw: 1, text: 'Heal 3. Draw 1.' },
  gustStep:    { name: 'Gust Step',    faction: 'gale', cost: 1, type: 'guard', block: 4, draw: 1, text: 'Gain 4 Block. Draw 1.' },
  vineSnare:   { name: 'Vine Snare',   faction: 'gale', cost: 1, type: 'guard', block: 5, weaken: 2, text: 'Gain 5 Block. Weaken 2.' },
  thornWhip:   { name: 'Thorn Whip',   faction: 'gale', cost: 2, type: 'strike', dmg: 6, text: 'Deal 6 damage.' },
  pollenCloud: { name: 'Pollen Cloud', faction: 'gale', cost: 2, type: 'strike', dmg: 4, weaken: 2, text: 'Deal 4 damage. Weaken 2.' },
  skyCall:     { name: 'Sky Call',     faction: 'gale', cost: 2, type: 'strike', dmg: 5, draw: 1, text: 'Deal 5 damage. Draw 1.' },
  cyclone:     { name: 'Cyclone',      faction: 'gale', cost: 3, type: 'strike', dmg: 8, text: 'Deal 8 damage.' },
  tempestFeather: { name: 'Tempest Feather', faction: 'gale', cost: 3, type: 'strike', dmg: 9, draw: 1, text: 'Deal 9 damage. Draw 1.' },
  hurricane:   { name: 'Hurricane',    faction: 'gale', cost: 4, type: 'strike', dmg: 11, text: 'Deal 11 damage.' },

  // ---- Stone: amber peak, block and heavy hits ----
  pebble:      { name: 'Pebble',       faction: 'stone', cost: 0, type: 'strike', dmg: 1, text: 'Deal 1 damage.' },
  gemcut:      { name: 'Gemcut',       faction: 'stone', cost: 1, type: 'strike', dmg: 4, block: 3, text: 'Deal 4 damage. Gain 3 Block.' },
  graniteWall: { name: 'Granite Wall', faction: 'stone', cost: 1, type: 'guard', block: 7, text: 'Gain 7 Block.' },
  tremor:      { name: 'Tremor',       faction: 'stone', cost: 1, type: 'strike', dmg: 3, weaken: 2, text: 'Deal 3 damage. Weaken 2.' },
  boulderSlam: { name: 'Boulder Slam', faction: 'stone', cost: 2, type: 'strike', dmg: 7, text: 'Deal 7 damage.' },
  ironhide:    { name: 'Ironhide',     faction: 'stone', cost: 2, type: 'guard', block: 6, heal: 2, text: 'Gain 6 Block. Heal 2.' },
  stalwart:    { name: 'Stalwart',     faction: 'stone', cost: 2, type: 'guard', block: 10, text: 'Gain 10 Block.' },
  diamondEdge: { name: 'Diamond Edge', faction: 'stone', cost: 2, type: 'strike', dmg: 6, surgeBonus: 4, text: 'Deal 6 damage. Surge: +4 damage.' },
  landslide:   { name: 'Landslide',    faction: 'stone', cost: 3, type: 'strike', dmg: 8, block: 4, text: 'Deal 8 damage. Gain 4 Block.' },
  quake:       { name: 'Quake',        faction: 'stone', cost: 3, type: 'strike', dmg: 9, text: 'Deal 9 damage.' },
  bedrock:     { name: 'Bedrock',      faction: 'stone', cost: 3, type: 'guard', block: 12, text: 'Gain 12 Block.' },
  avalanche:   { name: 'Avalanche',    faction: 'stone', cost: 4, type: 'strike', dmg: 13, text: 'Deal 13 damage.' },
};

export const CARD_IDS = Object.keys(CARDS);

export function cardDef(id) {
  return CARDS[id];
}

/** The player's starter deck: 10 cards, a taste of every wind. */
export function starterDeck() {
  return ['spark', 'spark', 'cinderClaw', 'ripple', 'ripple', 'zephyr', 'zephyr', 'pebble', 'mistVeil', 'graniteWall'];
}

/** A rival's themed deck: mostly its own faction, splashed with two others. */
export function rivalDeck(rival, rng) {
  const own = CARD_IDS.filter((id) => CARDS[id].faction === rival.faction);
  const others = CARD_IDS.filter((id) => CARDS[id].faction !== rival.faction);
  const deck = [];
  for (let i = 0; i < 14; i++) deck.push(own[rng.int(own.length)]);
  for (let i = 0; i < 5; i++) deck.push(others[rng.int(others.length)]);
  if (rival.id === 'tempest') {
    // The final storm plays every wind.
    for (let i = 0; i < 5; i++) deck.push(CARD_IDS[rng.int(CARD_IDS.length)]);
  }
  return deck;
}

/** Three reward cards offered after a won duel: one per random faction, weighted to rares. */
export function rewardChoices(rng, ownedDeck) {
  const pool = CARD_IDS.filter((id) => (CARDS[id].cost >= 2 || rng.next() < 0.4));
  const picks = [];
  const seen = new Set();
  while (picks.length < 3 && seen.size < pool.length) {
    const id = pool[rng.int(pool.length)];
    if (seen.has(id)) continue;
    seen.add(id);
    picks.push(id);
  }
  return picks;
}
