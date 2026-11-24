let ctx = null;
let muted = false;
try { muted = localStorage.getItem('hc-muted') === '1'; } catch {}

export const isMuted = () => muted;
export function setMuted(v) {
  muted = v;
  try { localStorage.setItem('hc-muted', v ? '1' : '0'); } catch {}
}

function tone(freq, dur = 0.12, type = 'sine', vol = 0.15, delay = 0) {
  if (muted) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur);
  } catch {}
}

export const sfx = {
  click: () => tone(520, 0.06, 'triangle'),
  shake: () => { tone(220, 0.08, 'square', 0.06); tone(260, 0.08, 'square', 0.06, 0.18); tone(300, 0.08, 'square', 0.06, 0.36); },
  run: () => tone(660, 0.12, 'triangle'),
  four: () => { tone(660, 0.1, 'triangle'); tone(880, 0.16, 'triangle', 0.15, 0.1); },
  six: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'triangle', 0.16, i * 0.09)); },
  out: () => { tone(300, 0.2, 'sawtooth', 0.14); tone(160, 0.35, 'sawtooth', 0.14, 0.15); },
  dot: () => tone(200, 0.08, 'sine', 0.1),
  win: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.12)); },
  lose: () => { [392, 330, 262].forEach((f, i) => tone(f, 0.28, 'sine', 0.14, i * 0.18)); },
};
