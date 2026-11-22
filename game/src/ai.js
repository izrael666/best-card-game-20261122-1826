// Rival AI: readable, counterable, and fair. The foe plans its whole turn up front,
// the table shows that plan as an intent, and it plays what it planned —
// so a player who reads the intent can block, heal, or race it.
import { cardDef } from './cards.js';

/** Score a card for the foe in the current position: damage first, defence when hurt. */
export function scoreCard(duel, cardId) {
  const def = cardDef(cardId);
  const me = duel.enemy;
  const foe = duel.player;
  let score = 0;
  if (def.dmg) score += def.dmg * (foe.block > 0 ? 0.7 : 1);
  if (def.block) score += def.block * (me.hp < me.maxHp * 0.45 ? 1.4 : 0.8);
  if (def.heal) score += def.heal * (me.hp < me.maxHp * 0.5 ? 1.6 : 0.4);
  if (def.draw) score += 2.5;
  if (def.mana) score += 2;
  if (def.burn) score += def.burn * 2;
  if (def.weaken) score += 2.5;
  score -= def.cost * 0.6;
  return score;
}

/**
 * Plan the foe's turn: pick cards from its hand, best first, while mana lasts.
 * The final storm plays one extra card. The plan is stored on the duel so the
 * table can show the intent before a single card is played.
 */
export function planEnemyTurn(duel) {
  const me = duel.enemy;
  const limit = duel.rival.power.id === 'fourfold' ? 2 : 1;
  const affordable = me.hand.filter((id) => cardDef(id).cost <= me.mana);
  affordable.sort((a, b) => scoreCard(duel, b) - scoreCard(duel, a));
  const plan = [];
  let mana = me.mana;
  for (const id of affordable) {
    if (plan.length >= limit) break;
    const cost = cardDef(id).cost;
    if (cost > mana) continue;
    plan.push(id);
    mana -= cost;
  }
  // A foe with nothing worth playing still guards if it can.
  if (plan.length === 0) {
    const guard = me.hand.find((id) => cardDef(id).block && cardDef(id).cost <= me.mana);
    if (guard) plan.push(guard);
  }
  duel.enemyPlan = plan;
  duel.intent = describeIntent(duel);
  return plan;
}

/** One line the table shows above the foe: what it is about to do. */
export function describeIntent(duel) {
  const plan = duel.enemyPlan || [];
  if (plan.length === 0) return 'Biding its time…';
  let dmg = 0, block = 0, heal = 0;
  for (const id of plan) {
    const d = cardDef(id);
    dmg += d.dmg || 0;
    block += d.block || 0;
    heal += d.heal || 0;
  }
  const parts = [];
  if (dmg > 0) parts.push(`Attack ${dmg}`);
  if (block > 0) parts.push(`Guard ${block}`);
  if (heal > 0) parts.push(`Heal ${heal}`);
  return parts.join(' · ') || 'Plotting…';
}
