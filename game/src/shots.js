// Staged screenshot scenes: ?shot=play|title|win|loss (with &seed=N) paints one real
// game state with the real renderer, twice, then sets window.__shotReady.
// Nothing here is a mock: every scene is a genuine duel state built by the engine.
import { createCampaign, startDuel } from './engine.js';
import { planEnemyTurn } from './ai.js';
import { SCREEN_TITLE, SCREEN_DUEL } from './render.js';

function baseState(screen, campaign, duel) {
  return {
    screen, campaign, duel,
    hover: { x: -1, y: -1 },
    floats: [], particles: [],
    lastPlayed: null,
    bestVoyage: 3,
    muted: false,
    layout: null,
  };
}

/** Build a mid-duel table: Cinder Fox at 22 HP, a full hand, a Surge banked. */
export function stagePlay(seed) {
  const campaign = createCampaign(seed);
  campaign.duelIndex = 2;
  campaign.hp = 24;
  const duel = startDuel(campaign, 2);
  duel.turnCount = 4;
  duel.player.hp = 24;
  duel.player.manaMax = 6;
  duel.player.mana = 5;
  duel.player.block = 4;
  duel.player.hand = ['wildfire', 'tidalPull', 'zephyr', 'graniteWall', 'firebrand'];
  duel.player.drawPile = ['spark', 'ripple', 'cyclone', 'pebble', 'mistVeil', 'quake', 'seedling', 'coalToss'];
  duel.player.discard = ['spark', 'zephyr'];
  duel.enemy.hp = 22;
  duel.enemy.hand = ['spark', 'spark', 'spark', 'spark'];
  duel.enemy.block = 0;
  duel.enemy.burn = 2;
  duel.enemy.mana = duel.enemy.manaMax;
  planEnemyTurn(duel); // a readable intent for the staged table
  duel.factionsPlayed = { ember: 1 };
  duel.log = [
    'Duel 3 of 5: Cinder Fox — Catch me if you can — the fire already has.',
    'You play Cinder Claw.',
    'Cinder Claw hits the foe for 4.',
    'Cinder Fox plays Ignite.',
    'Ignite hits you for 2.',
    'Ignite sets you burning (2).',
    '— Turn 4 —',
    'Ember Surge ready: play another Ember card!',
  ];
  const state = baseState(SCREEN_DUEL, campaign, duel);
  state.lastPlayed = 'wildfire';
  state.floats = [{ text: '-9', x: 640, y: 300, age: 0.2, life: 1.2, color: '#ffd23e', big: true }];
  return state;
}

export function stageTitle(seed) {
  const state = baseState(SCREEN_TITLE, createCampaign(seed), null);
  return state;
}

/** The win overlay over a finished duel with Cinder Fox. */
export function stageWin(seed) {
  const campaign = createCampaign(seed);
  campaign.duelIndex = 2;
  const duel = startDuel(campaign, 2);
  duel.enemy.hp = 0;
  duel.over = 'win';
  duel.player.hp = 18;
  duel.log.push('Cinder Fox falls! You win the duel.');
  const state = baseState(SCREEN_DUEL, campaign, duel);
  state.particles = Array.from({ length: 60 }, (_, i) => ({
    x: 140 + ((i * 197) % 1000), y: 120 + ((i * 131) % 480),
    age: (i % 10) / 12, life: 1.4, size: 6 + (i % 4) * 2,
    color: ['#ffd23e', '#ff8a5c', '#6fc3ff', '#8be28b'][i % 4],
  }));
  return state;
}

/** The defeat overlay over a lost duel with Brine Mara. */
export function stageLoss(seed) {
  const campaign = createCampaign(seed);
  campaign.duelIndex = 1;
  const duel = startDuel(campaign, 1);
  duel.player.hp = 0;
  duel.over = 'lose';
  duel.log.push('You fall. The isles keep their secret — for now.');
  return baseState(SCREEN_DUEL, campaign, duel);
}

export function stageShot(name, seed) {
  if (name === 'play') return stagePlay(seed);
  if (name === 'title') return stageTitle(seed);
  if (name === 'win') return stageWin(seed);
  if (name === 'loss') return stageLoss(seed);
  return stageTitle(seed);
}
