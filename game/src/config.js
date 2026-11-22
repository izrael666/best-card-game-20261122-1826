// Ember Isles: Duel of the Four Winds — tuning constants and the four factions.
// One clear job: every number the rules use lives here, so balance tweaks touch one file.

export const CANVAS_W = 1280;
export const CANVAS_H = 800;

export const PLAYER_MAX_HP = 30;
export const HAND_SIZE_START = 5;
export const DRAW_PER_TURN = 2;
export const MANA_START = 3;
export const MANA_MAX = 10;
export const MANA_GROWTH_TURN = 1;

export const FACTIONS = {
  ember: { name: 'Ember', color: '#e2483a', dark: '#8f1d12', light: '#ff8a5c', glyph: 'flame', surge: 'Burn 2: the foe takes 2 damage at the start of its turn.' },
  tide: { name: 'Tide', color: '#2f7fd0', dark: '#123f6e', light: '#6fc3ff', glyph: 'wave', surge: 'Heal 3.' },
  gale: { name: 'Gale', color: '#3da35a', dark: '#14532a', light: '#8be28b', glyph: 'leaf', surge: 'Draw 1 card.' },
  stone: { name: 'Stone', color: '#c98a2e', dark: '#6e4510', light: '#f2c14e', glyph: 'peak', surge: 'Gain 4 Block.' },
};

export const FACTION_ORDER = ['ember', 'tide', 'gale', 'stone'];

// Surge: playing a second card of the same faction in one turn triggers the faction bonus.
export const SURGE_THRESHOLD = 2;

// Rival duels of the campaign, in order. Each rival has a themed deck, a power and a portrait hue.
export const RIVALS = [
  {
    id: 'pip', name: 'Pip the Sprout', title: 'Gale Gardener of the First Isle',
    hp: 20, faction: 'gale', hue: '#3da35a',
    power: { id: 'sprout', text: 'Draws an extra card each turn.' },
    taunt: 'The wind carries my seeds — and my victories!',
  },
  {
    id: 'mara', name: 'Brine Mara', title: 'Tidecaller of the Sunken Steps',
    hp: 26, faction: 'tide', hue: '#2f7fd0',
    power: { id: 'tidecall', text: 'Heals 2 at the start of each turn.' },
    taunt: 'The tide always comes back. So do I.',
  },
  {
    id: 'cinder', name: 'Cinder Fox', title: 'Ember Trickster of the Ashen Den',
    hp: 30, faction: 'ember', hue: '#e2483a',
    power: { id: 'kindle', text: 'Burn ticks for +1 damage.' },
    taunt: 'Catch me if you can — the fire already has.',
  },
  {
    id: 'warden', name: 'Granite Warden', title: 'Stonekeeper of the Old Gate',
    hp: 36, faction: 'stone', hue: '#c98a2e',
    power: { id: 'bulwark', text: 'Begins each turn with 4 Block.' },
    taunt: 'Mountains do not hurry. Mountains do not fall.',
  },
  {
    id: 'tempest', name: 'The Fourfold Tempest', title: 'Storm That Wears Four Winds',
    hp: 38, faction: 'ember', hue: '#7b4fd0',
    power: { id: 'fourfold', text: 'Plays an extra card each turn.' },
    taunt: 'Four winds, one storm. Show me a hand that can hold it.',
  },
];

export const REWARD_HEAL = 999; // heal to full between duels
export const REWARD_MAX_HP_BONUS = 2;
export const REWARD_CHOICES = 3;
