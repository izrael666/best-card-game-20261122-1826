// Ember Isles renderer: everything the player sees, painted on one canvas.
// Table, cards, hands, HUD, log, and every screen (title, map, reward, win, loss).
// It never touches the rules — it reads the duel object and paints what is there.
import { CANVAS_W, CANVAS_H, FACTIONS, RIVALS } from './config.js';
import { cardDef } from './cards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_MAP = 'map';
export const SCREEN_DUEL = 'duel';
export const SCREEN_REWARD = 'reward';
export const SCREEN_VICTORY = 'victory';
export const SCREEN_DEFEAT = 'defeat';

const CARD_W = 148;
const CARD_H = 208;
const TITLE_FONT = 'Georgia, "Times New Roman", serif';
const BODY_FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? line + ' ' + word : word;
    if (ctx.measureText(trial).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = trial;
  }
  if (line) lines.push(line);
  return lines;
}

/** The faction glyph, drawn with paths (never text alone): flame, wave, leaf, peak. */
export function drawGlyph(ctx, glyph, cx, cy, size, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.lineJoin = 'round';
  const s = size;
  if (glyph === 'flame') {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.55);
    ctx.bezierCurveTo(s * 0.42, -s * 0.1, s * 0.4, s * 0.28, s * 0.18, s * 0.45);
    ctx.bezierCurveTo(s * 0.1, s * 0.55, -s * 0.1, s * 0.55, -s * 0.18, s * 0.45);
    ctx.bezierCurveTo(-s * 0.4, s * 0.28, -s * 0.42, -s * 0.1, 0, -s * 0.55);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.18, s * 0.1, s * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (glyph === 'wave') {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const y = -s * 0.3 + i * s * 0.3;
      ctx.moveTo(-s * 0.5, y);
      ctx.bezierCurveTo(-s * 0.2, y - s * 0.22, s * 0.2, y + s * 0.22, s * 0.5, y);
    }
    ctx.stroke();
  } else if (glyph === 'leaf') {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.55);
    ctx.bezierCurveTo(s * 0.5, -s * 0.2, s * 0.4, s * 0.4, 0, s * 0.55);
    ctx.bezierCurveTo(-s * 0.4, s * 0.4, -s * 0.5, -s * 0.2, 0, -s * 0.55);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.4);
    ctx.lineTo(0, s * 0.45);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-s * 0.55, s * 0.45);
    ctx.lineTo(0, -s * 0.5);
    ctx.lineTo(s * 0.55, s * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(-s * 0.16, -s * 0.18);
    ctx.lineTo(0, -s * 0.5);
    ctx.lineTo(s * 0.16, -s * 0.18);
    ctx.lineTo(0, -s * 0.05);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** One card face. opts: faceDown, hover (raised), dimmed (unplayable), small. */
export function drawCard(ctx, cardId, x, y, w, h, opts = {}) {
  const def = cardDef(cardId);
  const f = FACTIONS[def.faction];
  ctx.save();
  if (opts.hover) { ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8; }
  rr(ctx, x, y, w, h, 12);
  ctx.fillStyle = opts.faceDown ? '#5a3d7a' : '#fdf6e3';
  ctx.fill();
  ctx.lineWidth = opts.hover ? 3 : 2;
  ctx.strokeStyle = opts.faceDown ? '#3d2a55' : f.color;
  ctx.stroke();
  ctx.shadowColor = 'transparent';
  if (opts.faceDown) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    rr(ctx, x + 8, y + 8, w - 16, h - 16, 8);
    ctx.stroke();
    drawGlyph(ctx, 'flame', x + w / 2, y + h / 2, Math.min(w, h) * 0.3, 'rgba(255,255,255,0.5)');
    ctx.restore();
    return;
  }
  // Faction band across the top.
  ctx.save();
  rr(ctx, x, y, w, h, 12);
  ctx.clip();
  ctx.fillStyle = f.color;
  ctx.fillRect(x, y, w, h * 0.30);
  ctx.fillStyle = f.dark;
  ctx.fillRect(x, y + h * 0.30, w, 4);
  ctx.restore();
  // Cost gem.
  ctx.beginPath();
  ctx.arc(x + 20, y + 20, 15, 0, Math.PI * 2);
  ctx.fillStyle = '#2b6cb0';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(w * 0.13)}px ${BODY_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(def.cost), x + 20, y + 21);
  // Faction glyph in the band.
  drawGlyph(ctx, f.glyph, x + w / 2, y + h * 0.16, h * 0.13, 'rgba(255,255,255,0.95)');
  // Name.
  ctx.fillStyle = '#2d1f14';
  ctx.font = `bold ${Math.round(w * 0.115)}px ${TITLE_FONT}`;
  ctx.textAlign = 'center';
  const nameSize = Math.min(w * 0.115, (w - 16) / Math.max(1, def.name.length) * 1.7);
  ctx.font = `bold ${Math.round(nameSize)}px ${TITLE_FONT}`;
  ctx.fillText(def.name, x + w / 2, y + h * 0.40, w - 12);
  // Power line: the big number the eye finds first.
  const power = def.dmg ? `⚔ ${def.dmg}` : def.block ? `⛨ ${def.block}` : def.heal ? `✚ ${def.heal}` : def.draw ? `↻ ${def.draw}` : '✦';
  ctx.font = `bold ${Math.round(h * 0.11)}px ${BODY_FONT}`;
  ctx.fillStyle = f.dark;
  ctx.fillText(power, x + w / 2, y + h * 0.55);
  // Effect text.
  ctx.fillStyle = '#4a3a28';
  ctx.font = `${Math.round(w * 0.085)}px ${BODY_FONT}`;
  const lines = wrapText(ctx, def.text, w - 20);
  lines.slice(0, 4).forEach((line, i) => ctx.fillText(line, x + w / 2, y + h * 0.68 + i * h * 0.075));
  // Type + faction footer.
  ctx.fillStyle = f.color;
  ctx.font = `bold ${Math.round(w * 0.075)}px ${BODY_FONT}`;
  ctx.fillText(`${def.type.toUpperCase()} · ${f.name.toUpperCase()}`, x + w / 2, y + h - 12);
  if (opts.dimmed) {
    rr(ctx, x, y, w, h, 12);
    ctx.fillStyle = 'rgba(20,20,30,0.45)';
    ctx.fill();
  }
  ctx.restore();
}

function drawHpBar(ctx, x, y, w, h, hp, maxHp, color) {
  rr(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fill();
  const frac = Math.max(0, hp / maxHp);
  if (frac > 0) {
    rr(ctx, x + 2, y + 2, (w - 4) * frac, h - 4, (h - 4) / 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(h * 0.72)}px ${BODY_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${hp} / ${maxHp}`, x + w / 2, y + h / 2 + 1);
}

function drawFelt(ctx) {
  const g = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H * 0.42, 80, CANVAS_W / 2, CANVAS_H / 2, 900);
  g.addColorStop(0, '#2e6b4f');
  g.addColorStop(0.6, '#1f5138');
  g.addColorStop(1, '#123524');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.strokeStyle = 'rgba(212,175,105,0.5)';
  ctx.lineWidth = 3;
  rr(ctx, 14, 14, CANVAS_W - 28, CANVAS_H - 28, 24);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(212,175,105,0.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(CANVAS_W / 2, CANVAS_H * 0.42, 430, 210, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPortrait(ctx, rival, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = rival.hue;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.stroke();
  ctx.clip();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(cx - r, cy + r * 0.25, r * 2, r);
  const f = FACTIONS[rival.faction];
  drawGlyph(ctx, f.glyph, cx, cy - r * 0.08, r * 1.1, 'rgba(255,255,255,0.95)');
  ctx.restore();
}

/** Compute the duel table layout (shared by drawing and click hit-testing). */
export function layoutDuel(duel, hover) {
  const hand = duel.player.hand;
  const n = hand.length;
  const gap = Math.min(14, n > 1 ? (CANVAS_W - 260 - n * CARD_W) / (n - 1) : 0);
  const totalW = n * CARD_W + (n - 1) * gap;
  let x = (CANVAS_W - totalW) / 2;
  const y = CANVAS_H - CARD_H - 26;
  const handRects = hand.map((id, i) => {
    const isHover = hover && hover.x >= x && hover.x <= x + CARD_W && hover.y >= y - 18 && hover.y <= y + CARD_H;
    const rect = { id, x, y: isHover ? y - 22 : y, w: CARD_W, h: CARD_H, hover: isHover, index: i };
    x += CARD_W + gap;
    return rect;
  });
  return {
    handRects,
    endTurn: { x: CANVAS_W - 218, y: CANVAS_H - 92, w: 190, h: 56 },
    deckPile: { x: 36, y: 250, w: 92, h: 112 },
    discardPile: { x: CANVAS_W - 128, y: 96, w: 92, h: 112 },
    mute: { x: CANVAS_W - 52, y: 26, w: 34, h: 34 },
  };
}

function drawButton(ctx, rect, label, enabled, accent) {
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fillStyle = enabled ? (accent || '#d4af69') : 'rgba(120,110,90,0.7)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.stroke();
  ctx.fillStyle = enabled ? '#241a10' : '#e8e0d0';
  ctx.font = `bold 20px ${BODY_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  function drawDuel(state) {
    const duel = state.duel;
    drawFelt(ctx);
    const layout = layoutDuel(duel, state.hover);
    state.layout = layout;
    const enemy = duel.enemy;
    const player = duel.player;

    // Foe's face-down hand.
    for (let i = 0; i < Math.min(5, enemy.hand.length); i++) {
      drawCard(ctx, 'spark', 430 + i * 62, 30, 56, 78, { faceDown: true });
    }
    // Foe portrait, name, HP, intent.
    drawPortrait(ctx, duel.rival, 150, 108, 62);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fff';
    ctx.font = `bold 26px ${TITLE_FONT}`;
    ctx.fillText(duel.rival.name, 232, 88);
    ctx.fillStyle = '#e8dcc0';
    ctx.font = `16px ${BODY_FONT}`;
    ctx.fillText(duel.rival.title, 232, 112);
    drawHpBar(ctx, 232, 126, 300, 24, enemy.hp, enemy.maxHp, '#e2483a');
    if (enemy.block > 0) {
      ctx.fillStyle = '#9ecfff';
      ctx.font = 'bold 16px ' + BODY_FONT;
      ctx.fillText(`⛨ ${enemy.block} Block`, 570, 145);
    }
    if (enemy.burn > 0) {
      ctx.fillStyle = '#ff9a3c';
      ctx.font = 'bold 16px ' + BODY_FONT;
      ctx.fillText(`🔥 Burn ${enemy.burn}`, 570, 168);
    }
    // Intent: the foe's plan, readable before it acts.
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    rr(ctx, 232, 162, 320, 34, 10);
    ctx.fill();
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 16px ' + BODY_FONT;
    ctx.fillText(`Intent: ${duel.intent || '…'}`, 246, 185);
    // Rival power.
    ctx.fillStyle = '#cbb98f';
    ctx.font = `italic 14px ${BODY_FONT}`;
    ctx.fillText(`Power — ${duel.rival.power.text}`, 232, 216);

    // Centre: the last played card spot + duel banner.
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `bold 20px ${TITLE_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(`Duel ${duel.rivalIndex + 1} of ${RIVALS.length}  ·  Turn ${duel.turnCount}`, CANVAS_W / 2, 250);
    if (state.lastPlayed) {
      drawCard(ctx, state.lastPlayed, CANVAS_W / 2 - CARD_W / 2, 268, CARD_W, CARD_H, {});
    }

    // Player HUD: name + HP + block/burn, in the free left column above the hand.
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = `bold 24px ${TITLE_FONT}`;
    ctx.fillText('You', 36, 400);
    drawHpBar(ctx, 36, 414, 260, 24, player.hp, player.maxHp, '#3da35a');
    let hy = 462;
    if (player.block > 0) { ctx.fillStyle = '#9ecfff'; ctx.font = 'bold 16px ' + BODY_FONT; ctx.fillText(`Block ${player.block}`, 36, hy); hy += 22; }
    if (player.burn > 0) { ctx.fillStyle = '#ff9a3c'; ctx.font = 'bold 16px ' + BODY_FONT; ctx.fillText(`🔥 Burn ${player.burn}`, 36, hy); hy += 22; }
    // Mana gems: above the End Turn button, clear of the hand.
    const gemY = CANVAS_H - 128;
    const gemStartX = CANVAS_W - 40 - player.manaMax * 26;
    for (let i = 0; i < player.manaMax; i++) {
      ctx.beginPath();
      ctx.arc(gemStartX + i * 26 + 10, gemY, 10, 0, Math.PI * 2);
      ctx.fillStyle = i < player.mana ? '#4aa8ff' : 'rgba(255,255,255,0.25)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px ' + BODY_FONT;
    ctx.textAlign = 'right';
    ctx.fillText(`Mana ${player.mana}/${player.manaMax}`, CANVAS_W - 30, gemY - 18);
    ctx.textAlign = 'left';

    // Deck / discard piles with counts.
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    rr(ctx, layout.deckPile.x, layout.deckPile.y, layout.deckPile.w, layout.deckPile.h, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px ' + BODY_FONT;
    ctx.textAlign = 'center';
    ctx.fillText('DECK', layout.deckPile.x + 46, layout.deckPile.y + 52);
    ctx.font = 'bold 22px ' + BODY_FONT;
    ctx.fillText(String(player.drawPile.length), layout.deckPile.x + 46, layout.deckPile.y + 80);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    rr(ctx, layout.discardPile.x, layout.discardPile.y, layout.discardPile.w, layout.discardPile.h, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px ' + BODY_FONT;
    ctx.fillText('DISCARD', layout.discardPile.x + 46, layout.discardPile.y + 52);
    ctx.font = 'bold 22px ' + BODY_FONT;
    ctx.fillText(String(player.discard.length), layout.discardPile.x + 46, layout.discardPile.y + 80);

    // Player hand.
    for (const rect of layout.handRects) {
      const def = cardDef(rect.id);
      const playable = duel.turn === 'player' && player.mana >= def.cost && !duel.over;
      drawCard(ctx, rect.id, rect.x, rect.y, rect.w, rect.h, { hover: rect.hover, dimmed: !playable });
    }
    // Surge hint: which factions have one play banked this turn.
    const banked = Object.keys(duel.factionsPlayed).filter((f) => duel.factionsPlayed[f] === 1 && !duel.surgeDone[f]);
    if (banked.length > 0 && duel.turn === 'player' && !duel.over) {
      ctx.fillStyle = '#ffd98a';
      ctx.font = 'bold 15px ' + BODY_FONT;
      ctx.textAlign = 'center';
      ctx.fillText(`Surge ready: play another ${banked.map((f) => FACTIONS[f].name).join(' or ')} card!`, CANVAS_W / 2, CANVAS_H - CARD_H - 46);
    }
    drawButton(ctx, layout.endTurn, duel.turn === 'player' ? 'End Turn (E)' : 'Foe’s turn…', duel.turn === 'player' && !duel.over);
    // Mute toggle.
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    rr(ctx, layout.mute.x, layout.mute.y, layout.mute.w, layout.mute.h, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '18px ' + BODY_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.muted ? '🔇' : '🔊', layout.mute.x + 17, layout.mute.y + 18);
    ctx.textBaseline = 'alphabetic';

    // Log panel.
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    rr(ctx, CANVAS_W - 330, 230, 300, 250, 12);
    ctx.fill();
    ctx.fillStyle = '#ffe9b0';
    ctx.font = 'bold 15px ' + BODY_FONT;
    ctx.textAlign = 'left';
    ctx.fillText('— Battle Log —', CANVAS_W - 316, 254);
    ctx.fillStyle = '#f0e8d5';
    ctx.font = '13px ' + BODY_FONT;
    const lines = duel.log.slice(-7);
    lines.forEach((line, i) => {
      const short = line.length > 44 ? line.slice(0, 43) + '…' : line;
      ctx.fillText(short, CANVAS_W - 316, 276 + i * 18);
    });

    // Turn banner.
    if (duel.turn === 'enemy' && !duel.over) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, CANVAS_H / 2 - 26, CANVAS_W, 52);
      ctx.fillStyle = '#ffd98a';
      ctx.font = 'bold 26px ' + TITLE_FONT;
      ctx.textAlign = 'center';
      ctx.fillText(`${duel.rival.name} takes its turn…`, CANVAS_W / 2, CANVAS_H / 2 + 9);
    }
    drawFloatsAndParticles(state);
    if (duel.over === 'win') drawWinOverlay(state, false);
    if (duel.over === 'lose') drawLoseOverlay(state);
  }

  function drawFloatsAndParticles(state) {
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    for (const f of state.floats) {
      ctx.globalAlpha = Math.max(0, 1 - f.age / f.life);
      ctx.font = `bold ${f.big ? 44 : 30}px ${BODY_FONT}`;
      ctx.fillStyle = f.color;
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 5;
      ctx.strokeText(f.text, f.x, f.y - f.age * 40);
      ctx.fillText(f.text, f.x, f.y - f.age * 40);
    }
    ctx.globalAlpha = 1;
  }

  function drawWinOverlay(state, final) {
    ctx.fillStyle = 'rgba(10,40,20,0.72)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#ffd98a';
    ctx.font = `bold 64px ${TITLE_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(final ? 'THE ISLES ARE YOURS!' : 'VICTORY!', CANVAS_W / 2, 300);
    ctx.fillStyle = '#fff';
    ctx.font = '22px ' + BODY_FONT;
    ctx.fillText(state.duel ? `${state.duel.rival.name} has fallen.` : '', CANVAS_W / 2, 350);
    ctx.font = '18px ' + BODY_FONT;
    ctx.fillText('Click or press Space to continue.', CANVAS_W / 2, 400);
  }

  function drawLoseOverlay(state) {
    ctx.fillStyle = 'rgba(40,10,10,0.72)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#ff8a7a';
    ctx.font = `bold 64px ${TITLE_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('DEFEAT', CANVAS_W / 2, 300);
    ctx.fillStyle = '#fff';
    ctx.font = '22px ' + BODY_FONT;
    ctx.fillText(`${state.duel.rival.name} stands over the fallen cards.`, CANVAS_W / 2, 350);
    ctx.font = '18px ' + BODY_FONT;
    ctx.fillText('Click or press Space to try again.', CANVAS_W / 2, 400);
  }

  function drawTitle(state) {
    drawFelt(ctx);
    // Fanned sample cards across the title.
    const samples = ['wildfire', 'stormSurge', 'hurricane', 'avalanche', 'healingRain', 'tempestFeather'];
    samples.forEach((id, i) => {
      const x = 180 + i * 160;
      const y = 452 + (i % 2) * 26;
      ctx.save();
      ctx.translate(x + CARD_W / 2, y + CARD_H / 2);
      ctx.rotate((i - 2.5) * 0.06);
      ctx.translate(-CARD_W / 2, -CARD_H / 2);
      drawCard(ctx, id, 0, 0, CARD_W, CARD_H, {});
      ctx.restore();
    });
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd98a';
    ctx.font = `bold 84px ${TITLE_FONT}`;
    ctx.fillText('EMBER ISLES', CANVAS_W / 2, 150);
    ctx.fillStyle = '#fff';
    ctx.font = `italic 30px ${TITLE_FONT}`;
    ctx.fillText('Duel of the Four Winds', CANVAS_W / 2, 200);
    ctx.font = '18px ' + BODY_FONT;
    ctx.fillStyle = '#e8dcc0';
    ctx.fillText('A card battler of fire, tide, gale and stone — outplay five rivals,', CANVAS_W / 2, 250);
    ctx.fillText('chain Surge combos, and claim the storm itself.', CANVAS_W / 2, 276);
    ctx.fillStyle = '#d4af69';
    rr(ctx, CANVAS_W / 2 - 170, 320, 340, 56, 14);
    ctx.fill();
    ctx.fillStyle = '#241a10';
    ctx.font = 'bold 22px ' + BODY_FONT;
    ctx.fillText('▶  Begin the Voyage', CANVAS_W / 2, 356);
    ctx.fillStyle = '#cbb98f';
    ctx.font = '15px ' + BODY_FONT;
    ctx.fillText('Click or press Space  ·  1–9 play a card  ·  E ends your turn  ·  M mutes', CANVAS_W / 2, 720);
    ctx.fillText(`Best voyage: ${state.bestVoyage} duel${state.bestVoyage === 1 ? '' : 's'} won`, CANVAS_W / 2, 748);
    // Faction legend: short Surge labels, clear of the fanned cards.
    const legend = { ember: 'Surge: Burn 2', tide: 'Surge: Heal 3', gale: 'Surge: Draw 1', stone: 'Surge: Block 4' };
    let lx = CANVAS_W / 2 - 330;
    for (const key of ['ember', 'tide', 'gale', 'stone']) {
      const f = FACTIONS[key];
      drawGlyph(ctx, f.glyph, lx + 12, 408, 26, f.light);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px ' + BODY_FONT;
      ctx.textAlign = 'left';
      ctx.fillText(f.name, lx + 32, 405);
      ctx.fillStyle = '#d8cdb2';
      ctx.font = '13px ' + BODY_FONT;
      ctx.fillText(legend[key], lx + 32, 424);
      lx += 170;
    }
  }

  function drawMap(state) {
    drawFelt(ctx);
    const c = state.campaign;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd98a';
    ctx.font = `bold 48px ${TITLE_FONT}`;
    ctx.fillText('The Voyage', CANVAS_W / 2, 110);
    ctx.fillStyle = '#e8dcc0';
    ctx.font = '18px ' + BODY_FONT;
    ctx.fillText(`Your deck: ${c.deck.length} cards  ·  Health ${c.hp}/${c.maxHp}  ·  Duels won: ${c.wins}`, CANVAS_W / 2, 150);
    RIVALS.forEach((rival, i) => {
      const x = 120 + i * 216;
      const y = 260;
      const done = i < c.duelIndex;
      const current = i === c.duelIndex;
      ctx.save();
      if (!current && !done) ctx.globalAlpha = 0.55;
      rr(ctx, x, y, 190, 260, 16);
      ctx.fillStyle = current ? '#fdf6e3' : '#e8ddc2';
      ctx.fill();
      ctx.lineWidth = current ? 4 : 2;
      ctx.strokeStyle = rival.hue;
      ctx.stroke();
      drawPortrait(ctx, rival, x + 95, y + 70, 46);
      ctx.fillStyle = '#2d1f14';
      ctx.font = `bold 17px ${TITLE_FONT}`;
      ctx.fillText(rival.name, x + 95, y + 150);
      ctx.font = '13px ' + BODY_FONT;
      ctx.fillStyle = '#5a4a30';
      wrapText(ctx, rival.title, 170).forEach((l, j) => ctx.fillText(l, x + 95, y + 172 + j * 16));
      ctx.font = 'bold 15px ' + BODY_FONT;
      ctx.fillStyle = '#8f1d12';
      ctx.fillText(`♥ ${rival.hp} HP`, x + 95, y + 222);
      ctx.fillStyle = current ? '#1d7a3a' : done ? '#777' : '#999';
      ctx.font = 'bold 15px ' + BODY_FONT;
      ctx.fillText(done ? '✓ DEFEATED' : current ? '▶ FIGHT' : 'LOCKED', x + 95, y + 246);
      ctx.restore();
    });
    ctx.fillStyle = '#fff';
    ctx.font = '17px ' + BODY_FONT;
    ctx.fillText('Click a glowing isle to sail there. Win a duel to unlock the next.', CANVAS_W / 2, 600);
    ctx.fillText('After each victory, choose a new card for your deck and heal to full.', CANVAS_W / 2, 628);
    // Mini deck preview.
    ctx.fillStyle = '#cbb98f';
    ctx.font = '15px ' + BODY_FONT;
    ctx.fillText(`Deck: ${c.deck.map((id) => cardDef(id).name).join(' · ')}`, CANVAS_W / 2, 680);
  }

  function drawReward(state) {
    drawFelt(ctx);
    const duel = state.duel;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd98a';
    ctx.font = `bold 48px ${TITLE_FONT}`;
    ctx.fillText('Spoils of Victory', CANVAS_W / 2, 120);
    ctx.fillStyle = '#fff';
    ctx.font = '20px ' + BODY_FONT;
    ctx.fillText(`${duel.rival.name} is defeated! Choose one card to add to your deck.`, CANVAS_W / 2, 160);
    ctx.fillText(`You also heal to full and gain +${2} max health.`, CANVAS_W / 2, 190);
    duel.reward.forEach((id, i) => {
      const x = CANVAS_W / 2 - 260 + i * 190;
      const y = 260;
      const hover = state.hover && state.hover.x >= x && state.hover.x <= x + CARD_W && state.hover.y >= y && state.hover.y <= y + CARD_H;
      drawCard(ctx, id, x, y, CARD_W, CARD_H, { hover });
    });
    ctx.fillStyle = '#e8dcc0';
    ctx.font = '17px ' + BODY_FONT;
    ctx.fillText('Click a card (or press 1, 2, 3) to take it and sail on.', CANVAS_W / 2, 560);
  }

  function drawVictory(state) {
    drawFelt(ctx);
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd98a';
    ctx.font = `bold 72px ${TITLE_FONT}`;
    ctx.fillText('THE ISLES ARE YOURS!', CANVAS_W / 2, 260);
    ctx.fillStyle = '#fff';
    ctx.font = '24px ' + BODY_FONT;
    ctx.fillText('All five rivals have fallen. The Fourfold Tempest bows to you,', CANVAS_W / 2, 320);
    ctx.fillText('and the four winds sing your name across the Ember Isles.', CANVAS_W / 2, 352);
    ctx.font = '20px ' + BODY_FONT;
    ctx.fillStyle = '#e8dcc0';
    ctx.fillText(`Final deck: ${state.campaign.deck.length} cards  ·  Health ${state.campaign.hp}/${state.campaign.maxHp}`, CANVAS_W / 2, 420);
    ctx.fillStyle = '#d4af69';
    rr(ctx, CANVAS_W / 2 - 150, 480, 300, 56, 14);
    ctx.fill();
    ctx.fillStyle = '#241a10';
    ctx.font = 'bold 22px ' + BODY_FONT;
    ctx.fillText('↻  Sail Again', CANVAS_W / 2, 516);
    ctx.fillStyle = '#cbb98f';
    ctx.font = '15px ' + BODY_FONT;
    ctx.fillText('Click or press Space to start a new voyage.', CANVAS_W / 2, 580);
  }

  function drawDefeat(state) {
    drawFelt(ctx);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff8a7a';
    ctx.font = `bold 72px ${TITLE_FONT}`;
    ctx.fillText('DEFEAT', CANVAS_W / 2, 260);
    ctx.fillStyle = '#fff';
    ctx.font = '22px ' + BODY_FONT;
    ctx.fillText(`${state.duel.rival.name} stands over the fallen cards.`, CANVAS_W / 2, 320);
    ctx.fillText('The isles keep their secret — for now.', CANVAS_W / 2, 352);
    ctx.fillStyle = '#d4af69';
    rr(ctx, CANVAS_W / 2 - 150, 420, 300, 56, 14);
    ctx.fill();
    ctx.fillStyle = '#241a10';
    ctx.font = 'bold 22px ' + BODY_FONT;
    ctx.fillText('↻  Try Again', CANVAS_W / 2, 456);
    ctx.fillStyle = '#cbb98f';
    ctx.font = '15px ' + BODY_FONT;
    ctx.fillText('Click or press Space to retry this duel.', CANVAS_W / 2, 520);
  }

  function draw(state) {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.textBaseline = 'alphabetic';
    if (state.screen === SCREEN_TITLE) drawTitle(state);
    else if (state.screen === SCREEN_MAP) drawMap(state);
    else if (state.screen === SCREEN_DUEL) drawDuel(state);
    else if (state.screen === SCREEN_REWARD) drawReward(state);
    else if (state.screen === SCREEN_VICTORY) drawVictory(state);
    else if (state.screen === SCREEN_DEFEAT) drawDefeat(state);
  }

  return { draw, layoutDuel };
}
