// Ember Isles duel engine: the rules, the turns, the campaign. No drawing here.
// A duel is a plain object; every function below mutates it and appends to its log,
// so the renderer and the playtester can read the same truth.
import { FACTIONS, HAND_SIZE_START, DRAW_PER_TURN, MANA_START, MANA_MAX, PLAYER_MAX_HP, RIVALS, REWARD_MAX_HP_BONUS, SURGE_THRESHOLD } from './config.js';
import { cardDef, rivalDeck, starterDeck, rewardChoices } from './cards.js';
import { createRandom, shuffle } from './random.js';
import { planEnemyTurn, describeIntent } from './ai.js';

export function createCampaign(seed) {
  return {
    seed,
    rng: createRandom(seed),
    duelIndex: 0,
    deck: starterDeck(),
    maxHp: PLAYER_MAX_HP,
    hp: PLAYER_MAX_HP,
    wins: 0,
  };
}

/** Begin a duel against RIVALS[index]. Returns the duel state. */
export function startDuel(campaign, index) {
  const rival = RIVALS[index];
  const rng = campaign.rng;
  const duel = {
    campaign,
    rival,
    rivalIndex: index,
    turn: 'player',
    turnCount: 1,
    over: null, // 'win' | 'lose' | null
    log: [`Duel ${index + 1} of ${RIVALS.length}: ${rival.name} — ${rival.taunt}`],
    player: makeFighter(campaign.hp, campaign.maxHp, shuffle(campaign.deck, rng)),
    enemy: makeFighter(rival.hp, rival.hp, shuffle(rivalDeck(rival, rng), rng)),
    factionsPlayed: {},
    surgeDone: {},
    intent: null,
    enemyPlan: [],
    reward: null,
  };
  duel.enemy.manaMax = Math.min(4 + index, 7);
  duel.enemy.mana = duel.enemy.manaMax;
  drawCards(duel.player, HAND_SIZE_START, duel);
  drawCards(duel.enemy, 3, duel);
  planEnemyTurn(duel);
  duel.player.manaMax = MANA_START;
  duel.player.mana = MANA_START;
  return duel;
}

function makeFighter(hp, maxHp, deck) {
  return {
    hp, maxHp, block: 0, mana: 0, manaMax: 0,
    burn: 0, weaken: 0,
    hand: [], drawPile: deck.slice(), discard: [],
  };
}

export function drawCards(fighter, n, duel) {
  for (let i = 0; i < n; i++) {
    if (fighter.drawPile.length === 0) {
      if (fighter.discard.length === 0) return;
      fighter.drawPile = shuffle(fighter.discard, duel.campaign.rng);
      fighter.discard = [];
      duel.log.push('Deck reshuffled.');
    }
    fighter.hand.push(fighter.drawPile.pop());
  }
}

/** Start of a side's turn: burn ticks, block fades, mana refills, cards draw. */
export function beginTurn(duel, side) {
  const me = duel[side];
  const foe = duel[side === 'player' ? 'enemy' : 'player'];
  me.block = 0;
  if (me.burn > 0) {
    let tick = me.burn;
    // Kindle is the Fox's power: its burns bite harder — only the player's burn ticks get +1.
    if (side === 'player' && duel.rival.power.id === 'kindle') tick += 1;
    damageFighter(me, tick, duel, side === 'player' ? 'Burn scorches you' : 'Burn scorches the foe');
    if (duel.over) return;
  }
  me.weaken = 0;
  // The storm closes in: after turn 10 both sides take rising damage that ignores
  // Block, so no duel can stall forever and slow decks must still finish the fight.
  if (duel.turnCount > 10) {
    const storm = duel.turnCount - 10;
    me.hp = Math.max(0, me.hp - storm);
    duel.log.push(`The storm closes in! ${side === 'player' ? 'You take' : 'The foe takes'} ${storm} storm damage.`);
    if (duel.over) return;
    checkOver(duel);
    if (duel.over) return;
  }
  if (side === 'player') {
    me.manaMax = Math.min(MANA_START + duel.turnCount - 1, MANA_MAX);
    me.mana = me.manaMax;
    drawCards(me, DRAW_PER_TURN, duel);
    duel.factionsPlayed = {};
    duel.surgeDone = {};
  } else {
    me.manaMax = Math.min(4 + duel.rivalIndex, 7);
    me.mana = me.manaMax;
    if (duel.rival.power.id === 'bulwark') me.block = 4;
    if (duel.rival.power.id === 'tidecall') healFighter(me, 2, duel);
    const extra = duel.rival.power.id === 'sprout' ? 1 : 0;
    drawCards(me, 2 + extra, duel);
    planEnemyTurn(duel);
  }
}

/** Deal damage through block. Returns the HP actually lost. */
export function damageFighter(fighter, amount, duel, label) {
  let left = amount;
  if (fighter.block > 0) {
    const absorbed = Math.min(fighter.block, left);
    fighter.block -= absorbed;
    left -= absorbed;
  }
  if (left > 0) fighter.hp = Math.max(0, fighter.hp - left);
  if (label && left > 0) duel.log.push(`${label} for ${left}.`);
  return left;
}

export function healFighter(fighter, amount, duel) {
  const healed = Math.min(amount, fighter.maxHp - fighter.hp);
  if (healed > 0) {
    fighter.hp += healed;
    duel.log.push(`${fighter === duel.player ? 'You heal' : 'The foe heals'} ${healed}.`);
  }
  return healed;
}

/** Apply one card's effects. `owner` is 'player' or 'enemy'. Returns a list of visual events. */
export function applyCard(duel, owner, cardId) {
  const def = cardDef(cardId);
  const me = duel[owner];
  const foe = duel[owner === 'player' ? 'enemy' : 'player'];
  const events = [];
  const surge = owner === 'player' && checkSurge(duel, def.faction);
  let dmg = def.dmg || 0;
  if (surge && def.surgeBonus) dmg += def.surgeBonus;
  if (me.weaken > 0 && dmg > 0) dmg = Math.max(0, dmg - me.weaken);
  if (dmg > 0) {
    const lost = damageFighter(foe, dmg, duel, owner === 'player' ? `${def.name} hits the foe` : `${def.name} hits you`);
    events.push({ kind: 'damage', target: owner === 'player' ? 'enemy' : 'player', amount: lost, big: dmg >= 9 });
  }
  if (def.block) { me.block += def.block; events.push({ kind: 'block', target: owner, amount: def.block }); }
  if (def.heal) { const h = healFighter(me, def.heal, duel); if (h > 0) events.push({ kind: 'heal', target: owner, amount: h }); }
  if (def.draw) { drawCards(me, def.draw, duel); events.push({ kind: 'draw', target: owner, amount: def.draw }); }
  if (def.mana) { me.mana += def.mana; events.push({ kind: 'mana', target: owner, amount: def.mana }); }
  if (def.burn) { foe.burn += def.burn; duel.log.push(`${def.name} sets the foe burning (${foe.burn}).`); events.push({ kind: 'burn', target: owner === 'player' ? 'enemy' : 'player', amount: def.burn }); }
  if (def.weaken) { foe.weaken += def.weaken; duel.log.push(`${def.name} weakens the foe (-${def.weaken} attack).`); }
  if (surge) {
    const f = FACTIONS[def.faction];
    events.push({ kind: 'surge', target: owner, faction: def.faction });
    if (def.faction === 'ember') { damageFighter(foe, 2, duel, 'Ember Surge burns the foe'); }
    if (def.faction === 'tide') { healFighter(me, 3, duel); }
    if (def.faction === 'gale') { drawCards(me, 1, duel); }
    if (def.faction === 'stone') { me.block += 4; }
    duel.log.push(`${f.name} Surge! ${f.surge}`);
  }
  checkOver(duel);
  return events;
}

/** Track faction plays; a Surge fires the second time a faction is played in a turn. */
export function checkSurge(duel, faction) {
  duel.factionsPlayed[faction] = (duel.factionsPlayed[faction] || 0) + 1;
  if (duel.factionsPlayed[faction] >= SURGE_THRESHOLD && !duel.surgeDone[faction]) {
    duel.surgeDone[faction] = true;
    return true;
  }
  return false;
}

/** Play a card from the player's hand by index. Returns events, or null if illegal. */
export function playPlayerCard(duel, handIndex) {
  if (duel.over || duel.turn !== 'player') return null;
  const cardId = duel.player.hand[handIndex];
  if (!cardId) return null;
  const def = cardDef(cardId);
  if (duel.player.mana < def.cost) {
    duel.log.push(`Not enough mana for ${def.name} (${def.cost} needed).`);
    return { error: 'mana' };
  }
  duel.player.mana -= def.cost;
  duel.player.hand.splice(handIndex, 1);
  duel.player.discard.push(cardId);
  duel.log.push(`You play ${def.name}.`);
  return applyCard(duel, 'player', cardId);
}

/** End the player's turn; the enemy turn then plays out one step at a time via stepEnemyTurn. */
export function endPlayerTurn(duel) {
  if (duel.over || duel.turn !== 'player') return;
  duel.turn = 'enemy';
  duel.enemyPlan = planEnemyTurn(duel);
  beginTurn(duel, 'enemy');
}

/** Play the enemy's next planned card (or finish its turn). Returns events or 'done'. */
export function stepEnemyTurn(duel) {
  if (duel.over || duel.turn !== 'enemy') return 'done';
  if (duel.enemyPlan.length === 0) {
    duel.turn = 'player';
    duel.turnCount += 1;
    beginTurn(duel, 'player');
    duel.log.push(`— Turn ${duel.turnCount} —`);
    return 'done';
  }
  const cardId = duel.enemyPlan.shift();
  const idx = duel.enemy.hand.indexOf(cardId);
  if (idx === -1) return stepEnemyTurn(duel);
  const def = cardDef(cardId);
  if (duel.enemy.mana < def.cost) return stepEnemyTurn(duel);
  duel.enemy.mana -= def.cost;
  duel.enemy.hand.splice(idx, 1);
  duel.enemy.discard.push(cardId);
  duel.log.push(`${duel.rival.name} plays ${def.name}.`);
  const events = applyCard(duel, 'enemy', cardId);
  duel.intent = describeIntent(duel);
  return events;
}

export function checkOver(duel) {
  if (duel.enemy.hp <= 0 && !duel.over) {
    duel.over = 'win';
    duel.log.push(`${duel.rival.name} falls! You win the duel.`);
    duel.reward = rewardChoices(duel.campaign.rng, duel.campaign.deck);
  } else if (duel.player.hp <= 0 && !duel.over) {
    duel.over = 'lose';
    duel.log.push('You fall. The isles keep their secret — for now.');
  }
}

/** Take a reward card after a won duel and advance the campaign. */
export function takeReward(duel, cardId) {
  const c = duel.campaign;
  c.deck.push(cardId);
  c.wins += 1;
  c.duelIndex += 1;
  c.maxHp += REWARD_MAX_HP_BONUS;
  c.hp = c.maxHp;
  return c.duelIndex >= RIVALS.length;
}

/** Retry the same duel after a loss (full heal, same deck). */
export function retryDuel(duel) {
  const c = duel.campaign;
  c.hp = c.maxHp;
  return startDuel(c, c.duelIndex);
}
