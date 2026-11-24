// Bot opponent. Easy = random. Medium/Hard learn the human's habits.
const SKILL = { easy: 0, medium: 0.4, hard: 0.75 };

function sample(w) {
  const total = w.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < w.length; i++) {
    r -= w[i];
    if (r <= 0) return i;
  }
  return w.length - 1;
}

// Probability distribution of the human's next number given their recent picks.
function predict(hist) {
  const w = Array(7).fill(0.4);
  const recent = hist.slice(-14);
  recent.forEach((n, i) => {
    w[n] += 1 + (i / recent.length) * 2.5; // recent picks matter more
  });
  // humans like to repeat/avoid repeating: slight bump to the last number
  if (recent.length) w[recent[recent.length - 1]] += 0.6;
  const t = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / t);
}

export function botPick({ difficulty, botBatting, userBatHist, userBowlHist, chase, nm = false, lastBowl = null, freeHit = false, style = 'balanced' }) {
  let n = pickRaw({ difficulty, botBatting, userBatHist, userBowlHist, chase, freeHit, style });
  // No Mercy: a bowler repeating a number is a no-ball. Smarter bots avoid it.
  if (nm && !botBatting && lastBowl != null && n === lastBowl) {
    const avoid = { easy: 0.5, medium: 0.9, hard: 1 }[difficulty] ?? 0.5;
    if (Math.random() < avoid) {
      for (let i = 0; i < 12 && n === lastBowl; i++) n = pickRaw({ difficulty, botBatting, userBatHist, userBowlHist, chase, freeHit, style });
      if (n === lastBowl) n = (n + 1 + Math.floor(Math.random() * 6)) % 7;
    }
  }
  return n;
}

// Personality = base shot preference when the bot bats.
const STYLE_W = {
  balanced: [0.5, 1, 1, 1, 1, 1, 1.1],
  aggressive: [0.2, 0.6, 0.8, 1, 1.6, 1.9, 2.3],
  defensive: [0.7, 1.8, 1.7, 1.2, 0.6, 0.3, 0.2],
};
function styleWeights(style, ball) {
  if (style === 'trickster') return Math.floor(ball / 5) % 2 === 0 ? STYLE_W.aggressive : STYLE_W.defensive; // flips tactics every 5 balls
  return STYLE_W[style] || STYLE_W.balanced;
}

function pickRaw({ difficulty, botBatting, userBatHist, userBowlHist, chase, freeHit, style }) {
  const skill = SKILL[difficulty] ?? 0;

  if (botBatting) {
    // base: mostly 1-6, fist is rare
    let w = [...styleWeights(style, userBowlHist.length)];
    if (freeHit && difficulty !== 'easy') return sample([0, 0.2, 0.4, 0.8, 1.5, 2, 2.6]); // can't be out: swing big
    if (difficulty === 'hard' && chase) {
      const perBall = chase.need / Math.max(1, chase.ballsLeft);
      if (perBall >= 4) w = [0.1, 0.4, 0.6, 0.9, 1.4, 1.6, 2];
      else if (perBall <= 2 && chase.wktsLeft <= 2) w = [0.6, 1.6, 1.6, 1.2, 0.8, 0.5, 0.4];
    }
    if (skill > 0) {
      const p = predict(userBowlHist); // what the human will likely bowl
      w = w.map((x, n) => x * Math.max(0.05, 1 - p[n] * skill * 3));
    }
    return sample(w);
  }

  // bot bowling: try to match the human's likely batting number
  const uniform = Array(7).fill(1 / 7);
  if (skill === 0) return sample(uniform);
  const p = predict(userBatHist).map((x, n) => (n === 0 ? x * 0.7 : x)); // fist batting is rare
  const w = p.map((x, n) => (1 - skill) * uniform[n] + skill * x * x * 3);
  return sample(w);
}
