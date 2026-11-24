import { oversText, countOf, ballLabel, ballClass, modeName } from './game/engine.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function renderScorecard(final, history = []) {
  const W = 1080, H = 1350;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a1630'); g.addColorStop(0.55, '#10305a'); g.addColorStop(1, '#0c4a2c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // light beams
  [[140, 0], [940, 0]].forEach(([x]) => {
    const b = ctx.createRadialGradient(x, 0, 10, x, 0, 620);
    b.addColorStop(0, 'rgba(255,240,180,.45)'); b.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = b; ctx.fillRect(0, 0, W, H);
  });
  // pitch
  ctx.fillStyle = 'rgba(255,255,255,.05)';
  ctx.beginPath(); ctx.ellipse(W / 2, H + 120, 760, 420, 0, 0, Math.PI * 2); ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd34d';
  ctx.font = '900 76px system-ui, sans-serif';
  ctx.fillText('🏏 HAND CRICKET', W / 2, 120);
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.font = '600 30px system-ui, sans-serif';
  ctx.fillText(`${final.config.overs} over${final.config.overs > 1 ? 's' : ''} • ${final.config.wickets} wicket${final.config.wickets > 1 ? 's' : ''}${history.length ? ' • Super Over' : ''} • ${modeName(final)}`, W / 2, 168);

  // result banner
  const r = final.result;
  rr(ctx, 70, 210, W - 140, 170, 36);
  ctx.fillStyle = r && !r.tie ? '#ffd34d' : '#9fb4d6'; ctx.fill();
  ctx.fillStyle = '#10213f';
  ctx.font = '900 60px system-ui, sans-serif';
  ctx.fillText(r?.tie ? '🤝 MATCH TIED' : `🏆 ${final.names[r.winner]} WINS`.toUpperCase(), W / 2, 300);
  ctx.font = '700 36px system-ui, sans-serif';
  ctx.fillText(r?.tie ? 'What a thriller!' : `by ${r.by}`, W / 2, 351);

  // innings cards
  final.inn.forEach((inn, i) => {
    const y = 420 + i * 300;
    rr(ctx, 70, y, W - 140, 270, 32);
    ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.font = '700 26px system-ui, sans-serif';
    ctx.fillText(`INNINGS ${i + 1}`, 110, y + 55);
    ctx.fillStyle = '#fff';
    ctx.font = '800 50px system-ui, sans-serif';
    ctx.fillText(final.names[inn.batter].slice(0, 16), 110, y + 120);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd34d';
    ctx.font = '900 100px system-ui, sans-serif';
    ctx.fillText(`${inn.runs}/${inn.wkts}`, W - 110, y + 120);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.font = '600 30px system-ui, sans-serif';
    const rrate = inn.balls ? ((inn.runs / inn.balls) * 6).toFixed(2) : '0.00';
    ctx.fillText(`Overs ${oversText(inn.balls)}   •   RR ${rrate}   •   4s ${countOf(inn, 4)}   •   6s ${countOf(inn, 6)}`, 110, y + 180);
    // ball dots
    const last = inn.log.slice(-18);
    last.forEach((b, k) => {
      const x = 126 + k * 52, yy = y + 225;
      ctx.beginPath(); ctx.arc(x, yy, 20, 0, Math.PI * 2);
      ctx.fillStyle = { w: '#ff4d5e', six: '#b86bff', four: '#35c3ff', dot: '#5b6b8a', ext: '#ff9f1c', run: '#2fd47c' }[ballClass(b)];
      ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '800 20px system-ui, sans-serif';
      ctx.fillText(ballLabel(b), x, yy + 8);
    });
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.font = '600 28px system-ui, sans-serif';
  ctx.fillText('Think you can beat me? Play Hand Cricket!', W / 2, H - 70);
  return c;
}

export async function shareScorecard(final, history, text) {
  const canvas = renderScorecard(final, history);
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  const file = new File([blob], 'hand-cricket-scorecard.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Hand Cricket scorecard', text });
      return 'shared';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'hand-cricket-scorecard.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return 'downloaded';
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
