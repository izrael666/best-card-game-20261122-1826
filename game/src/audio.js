// Synthesised sound effects: no audio files, just the Web Audio API.
// Every sound is a short oscillator blip, created lazily on first use so a
// headless run (or a muted tab) never breaks the game.
let ctx = null;
let muted = false;

export function setMuted(value) { muted = value; }
export function isMuted() { return muted; }

function audio() {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function blip(freq, dur, type, vol, slideTo) {
  const ac = audio();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
    gain.gain.setValueAtTime(vol || 0.12, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur);
  } catch {
    // Sound is garnish; a failure here must never stop the game.
  }
}

export const sfx = {
  play() { blip(520, 0.09, 'triangle', 0.14, 760); },
  draw() { blip(880, 0.05, 'sine', 0.07, 990); },
  hit() { blip(180, 0.16, 'sawtooth', 0.16, 90); },
  block() { blip(320, 0.1, 'square', 0.08, 240); },
  heal() { blip(660, 0.18, 'sine', 0.1, 990); },
  surge() { blip(440, 0.22, 'triangle', 0.14, 1320); },
  error() { blip(140, 0.12, 'square', 0.1, 110); },
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.25, 'triangle', 0.14), i * 110)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => blip(f, 0.3, 'sine', 0.12), i * 130)); },
  click() { blip(700, 0.04, 'sine', 0.06); },
};
