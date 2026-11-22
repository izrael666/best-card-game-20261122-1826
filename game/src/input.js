// Keyboard and mouse input, kept apart from the rules: it only reports what the
// player did (clicks, keys) and the main loop decides what that means.
export const ACTION_CONFIRM = 1;
export const ACTION_END_TURN = 2;
export const ACTION_MUTE = 4;

export function createInput(canvas) {
  const state = { clicks: [], keys: [], hover: { x: -1, y: -1 } };

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    state.clicks.push({ x, y });
  });
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    state.hover.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    state.hover.y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  });
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    state.keys.push(e.key);
  });

  return {
    takeClicks() { const c = state.clicks; state.clicks = []; return c; },
    takeKeys() { const k = state.keys; state.keys = []; return k; },
    hover() { return state.hover; },
  };
}

/** Map a key press to an action bit. Space/Enter confirm, E ends the turn, M mutes. */
export function keyAction(key) {
  if (key === ' ' || key === 'Enter') return ACTION_CONFIRM;
  if (key === 'e' || key === 'E') return ACTION_END_TURN;
  if (key === 'm' || key === 'M') return ACTION_MUTE;
  return 0;
}
