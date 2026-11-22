// Ember Isles: Duel of the Four Winds — boot and the one loop.
// The loop reads input, advances the duel (the enemy plays one card per beat so
// its turn reads as a turn, not a blink), and paints the current screen.
// ?seed=N fixes the shuffle. ?shot=title|play|win|loss stages that scene instead
// of running the loop, paints it twice and sets window.__shotReady for a screenshot.
//
// Revision notes (v2): the keyboard path now captures the played card's id BEFORE
// playPlayerCard removes it from the hand (v1 read hand[n-1] after the splice and
// showed the wrong card in the centre); the unused seeded-RNG import is gone.
import { createCampaign, startDuel, playPlayerCard, endPlayerTurn, stepEnemyTurn, takeReward, retryDuel } from './engine.js';
import { createRenderer, SCREEN_TITLE, SCREEN_MAP, SCREEN_DUEL, SCREEN_REWARD, SCREEN_VICTORY, SCREEN_DEFEAT } from './render.js';
import { createInput, keyAction, ACTION_CONFIRM, ACTION_END_TURN, ACTION_MUTE } from './input.js';
import { stageShot } from './shots.js';
import { sfx, setMuted, isMuted } from './audio.js';

const BEST_KEY = 'ember-isles-best-voyage';
const ENEMY_BEAT = 0.75; // seconds between the foe's cards

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; }
  catch { return 0; }
}

function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); }
  catch { /* Storage can be off: the best voyage then lasts this visit only. */ }
}

function runShot(name) {
  const state = stageShot(name, seed);
  let painted = 0;
  function paint() {
    renderer.draw(state);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  const state = {
    screen: SCREEN_TITLE,
    campaign: createCampaign(seed),
    duel: null,
    hover: { x: -1, y: -1 },
    floats: [],
    particles: [],
    lastPlayed: null,
    bestVoyage: readBest(),
    muted: isMuted(),
    enemyTimer: 0,
    overTimer: 0,
  };

  function announce(message) { status.textContent = message; }

  function addFloat(text, x, y, color, big) {
    state.floats.push({ text, x, y, color: color || '#ffd23e', big: !!big, age: 0, life: 1.2 });
    if (state.floats.length > 12) state.floats.shift();
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < (n || 14); i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 20 + Math.random() * 60;
      state.particles.push({
        x, y, vx: Math.cos(a) * d, vy: Math.sin(a) * d - 20,
        age: 0, life: 0.5 + Math.random() * 0.4, size: 4 + Math.random() * 5, color,
      });
    }
  }

  function confetti() {
    const colors = ['#ffd23e', '#ff8a5c', '#6fc3ff', '#8be28b', '#f2c14e'];
    for (let i = 0; i < 120; i++) {
      state.particles.push({
        x: Math.random() * 1280, y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 40, vy: 60 + Math.random() * 120,
        age: 0, life: 2.5 + Math.random(), size: 5 + Math.random() * 6,
        color: colors[i % colors.length],
      });
    }
  }

  /** Turn engine events into floats, particles and sounds. */
  function showEvents(events) {
    if (!events || events.error) return;
    for (const ev of events) {
      if (ev.kind === 'damage') {
        const target = ev.target === 'enemy' ? { x: 300, y: 130 } : { x: 220, y: 620 };
        addFloat(`-${ev.amount}`, target.x, target.y, '#ff6a5a', ev.big);
        burst(target.x, target.y, '#ff6a5a', ev.big ? 26 : 12);
        sfx.hit();
      } else if (ev.kind === 'block') {
        const target = ev.target === 'enemy' ? { x: 300, y: 130 } : { x: 220, y: 620 };
        addFloat(`+${ev.amount} ⛨`, target.x, target.y + 30, '#9ecfff', false);
        sfx.block();
      } else if (ev.kind === 'heal') {
        const target = ev.target === 'enemy' ? { x: 300, y: 130 } : { x: 220, y: 620 };
        addFloat(`+${ev.amount} ✚`, target.x, target.y + 30, '#7be28b', false);
        sfx.heal();
      } else if (ev.kind === 'surge') {
        addFloat('SURGE!', 640, 300, '#ffd23e', true);
        burst(640, 300, '#ffd23e', 30);
        sfx.surge();
      } else if (ev.kind === 'draw') {
        sfx.draw();
      }
    }
  }

  function startDuelAt(index) {
    state.duel = startDuel(state.campaign, index);
    state.screen = SCREEN_DUEL;
    state.lastPlayed = null;
    state.floats = [];
    state.enemyTimer = 0;
    state.overTimer = 0;
    announce(`Duel ${index + 1}. ${state.duel.rival.name}. Your turn.`);
  }

  function handleDuelClick(click) {
    const duel = state.duel;
    if (!duel) return;
    const layout = state.layout;
    if (!layout) return;
    if (click.x >= layout.mute.x && click.x <= layout.mute.x + layout.mute.w &&
        click.y >= layout.mute.y && click.y <= layout.mute.y + layout.mute.h) {
      state.muted = !state.muted;
      setMuted(state.muted);
      return;
    }
    if (duel.over) return; // the overlay handles the click
    for (const rect of layout.handRects) {
      if (click.x >= rect.x && click.x <= rect.x + rect.w && click.y >= rect.y && click.y <= rect.y + rect.h) {
        const cardId = rect.id; // captured before the play removes it from the hand
        const events = playPlayerCard(duel, rect.index);
        if (events && events.error) { sfx.error(); return; }
        if (events) {
          state.lastPlayed = cardId;
          showEvents(events);
          sfx.play();
          if (duel.over) onDuelOver();
        }
        return;
      }
    }
    const et = layout.endTurn;
    if (duel.turn === 'player' && click.x >= et.x && click.x <= et.x + et.w && click.y >= et.y && click.y <= et.y + et.h) {
      state.lastPlayed = null;
      endPlayerTurn(duel);
      state.enemyTimer = 0;
      announce(`${duel.rival.name} takes its turn.`);
    }
  }

  function onDuelOver() {
    const duel = state.duel;
    if (duel.over === 'win') {
      sfx.win();
      if (duel.campaign.wins + 1 > state.bestVoyage) {
        state.bestVoyage = duel.campaign.wins + 1;
        saveBest(state.bestVoyage);
      }
    } else {
      sfx.lose();
    }
    state.overTimer = 0;
  }

  function advanceFromOver() {
    const duel = state.duel;
    if (duel.over === 'win') {
      if (duel.rivalIndex >= 4) { state.screen = SCREEN_VICTORY; confetti(); }
      else state.screen = SCREEN_REWARD;
    } else {
      state.duel = retryDuel(duel);
      state.screen = SCREEN_DUEL;
      state.lastPlayed = null;
      state.floats = [];
      announce(`Retry. ${state.duel.rival.name}. Your turn.`);
    }
  }

  function handleClick(click) {
    sfx.click();
    if (state.screen === SCREEN_TITLE) {
      state.screen = SCREEN_MAP;
      announce('Choose your next duel.');
      return;
    }
    if (state.screen === SCREEN_MAP) {
      const i = Math.floor((click.x - 120) / 216);
      if (click.y >= 260 && click.y <= 520 && i >= 0 && i < 5 && i === state.campaign.duelIndex) {
        startDuelAt(i);
      }
      return;
    }
    if (state.screen === SCREEN_DUEL) {
      if (state.duel && state.duel.over) { advanceFromOver(); return; }
      handleDuelClick(click);
      return;
    }
    if (state.screen === SCREEN_REWARD) {
      const duel = state.duel;
      for (let i = 0; i < duel.reward.length; i++) {
        const x = 640 - 260 + i * 190;
        if (click.x >= x && click.x <= x + 148 && click.y >= 260 && click.y <= 260 + 208) {
          const done = takeReward(duel, duel.reward[i]);
          if (done) { state.screen = SCREEN_VICTORY; confetti(); sfx.win(); }
          else state.screen = SCREEN_MAP;
          announce(done ? 'The isles are yours!' : 'Choose your next duel.');
          return;
        }
      }
      return;
    }
    if (state.screen === SCREEN_VICTORY || state.screen === SCREEN_DEFEAT) {
      state.campaign = createCampaign(Math.floor(Math.random() * 4294967296));
      state.duel = null;
      state.screen = SCREEN_TITLE;
      announce('Ember Isles. Press Space or click to start.');
    }
  }

  function handleKeys() {
    for (const key of input.takeKeys()) {
      const action = keyAction(key);
      if (action & ACTION_MUTE) {
        state.muted = !state.muted;
        setMuted(state.muted);
        continue;
      }
      if (state.screen === SCREEN_DUEL && state.duel && !state.duel.over) {
        if (action & ACTION_END_TURN) {
          state.lastPlayed = null;
          endPlayerTurn(state.duel);
          state.enemyTimer = 0;
          continue;
        }
        const n = Number.parseInt(key, 10);
        if (n >= 1 && n <= state.duel.player.hand.length) {
          const cardId = state.duel.player.hand[n - 1]; // captured before the play removes it
          const events = playPlayerCard(state.duel, n - 1);
          if (events && events.error) { sfx.error(); continue; }
          if (events) {
            state.lastPlayed = cardId;
            showEvents(events);
            sfx.play();
            if (state.duel.over) onDuelOver();
          }
          continue;
        }
      }
      if (state.screen === SCREEN_REWARD && state.duel) {
        const n = Number.parseInt(key, 10);
        if (n >= 1 && n <= state.duel.reward.length) {
          const done = takeReward(state.duel, state.duel.reward[n - 1]);
          if (done) { state.screen = SCREEN_VICTORY; confetti(); sfx.win(); }
          else state.screen = SCREEN_MAP;
          continue;
        }
      }
      if (action & ACTION_CONFIRM) {
        if (state.screen === SCREEN_TITLE) { state.screen = SCREEN_MAP; continue; }
        if (state.screen === SCREEN_DUEL && state.duel && state.duel.over) { advanceFromOver(); continue; }
        if (state.screen === SCREEN_VICTORY || state.screen === SCREEN_DEFEAT) {
          state.campaign = createCampaign(Math.floor(Math.random() * 4294967296));
          state.duel = null;
          state.screen = SCREEN_TITLE;
        }
      }
    }
  }

  function step(dt) {
    state.hover = input.hover();
    for (const click of input.takeClicks()) handleClick(click);
    handleKeys();
    // The foe plays one card per beat.
    if (state.screen === SCREEN_DUEL && state.duel && state.duel.turn === 'enemy' && !state.duel.over) {
      state.enemyTimer += dt;
      if (state.enemyTimer >= ENEMY_BEAT) {
        state.enemyTimer = 0;
        const result = stepEnemyTurn(state.duel);
        if (result !== 'done') {
          state.lastPlayed = state.duel.enemy.discard[state.duel.enemy.discard.length - 1];
          showEvents(result);
          if (state.duel.over) onDuelOver();
        }
      }
    }
    // After a loss, linger on the overlay, then show the defeat screen.
    if (state.screen === SCREEN_DUEL && state.duel && state.duel.over === 'lose') {
      state.overTimer += dt;
      if (state.overTimer > 1.6) state.screen = SCREEN_DEFEAT;
    }
    // Age floats and particles.
    for (const f of state.floats) f.age += dt;
    state.floats = state.floats.filter((f) => f.age < f.life);
    for (const p of state.particles) {
      p.age += dt;
      p.x += (p.vx || 0) * dt;
      p.y += (p.vy || 0) * dt;
    }
    state.particles = state.particles.filter((p) => p.age < p.life);
  }

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    step(dt);
    renderer.draw(state);
  }

  announce('Ember Isles. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
