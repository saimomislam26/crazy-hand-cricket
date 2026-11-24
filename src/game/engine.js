// Pure hand-cricket rules. 0 = closed fist, 1-5 fingers, 6 = thumb.
//
// BASIC:     different numbers -> batter scores; same number -> OUT; fist(0) = dot ball
//            (fist vs fist is a dot ball, never out).
// NO MERCY:  everything in Basic, except fist vs fist = OUT, plus:
//   - Wide:      batter 0, bowler non-zero  -> +1 run, ball re-bowled
//   - No-ball:   bowler repeats the same number twice in a row -> +1 run, re-bowled, next ball FREE HIT
//   - Free hit:  batter cannot be out (matching numbers = dot ball)
//   - Power play: first over of each innings, all runs x2 (extras stay +1)
export const other = (r) => (r === 'p1' ? 'p2' : 'p1');
export const isNoMercy = (m) => m.config.mode === 'nomercy';

const blankInnings = (batter) => ({ batter, runs: 0, wkts: 0, balls: 0, log: [], lastBowl: null, freeHit: false });

export function createMatch({ names, config, firstBatter, superOver = 0 }) {
  return {
    names,
    config,
    superOver,
    innings: 1,
    batter: firstBatter,
    inn: [blankInnings(firstBatter), blankInnings(other(firstBatter))],
    target: null,
    phase: 'play', // play | break | done
    result: null,
  };
}

// Daily-challenge preset: the opponent has already batted, you chase `target` right away (no toss).
export function createChase({ names, config, target, botSide = 'p2', meSide = 'p1' }) {
  const m = createMatch({ names, config, firstBatter: botSide });
  m.inn[0] = { ...m.inn[0], runs: target - 1, balls: config.overs * 6 };
  m.innings = 2;
  m.batter = meSide;
  m.target = target;
  m.preset = true;
  return m;
}

export const maxBalls = (m) => m.config.overs * 6;
export const cur = (m) => m.inn[m.innings - 1];
export const isPowerplay = (m) => isNoMercy(m) && !m.superOver && cur(m).balls < 6;

export function applyBall(m, batNum, bowlNum) {
  const s = structuredClone(m);
  const c = cur(s);
  const nm = isNoMercy(s);
  const free = nm && c.freeHit;
  const pp = isPowerplay(s);

  let type = 'legal';
  let out = false;
  let runs = 0;
  let saved = false;

  if (nm && c.lastBowl === bowlNum) {
    type = 'noball'; // same bowler number twice in a row
    runs = 1;
    c.lastBowl = null; // re-bowl can't be an instant second no-ball
    c.freeHit = true;
  } else if (nm && batNum === 0 && bowlNum !== 0) {
    type = 'wide';
    runs = 1;
    c.lastBowl = bowlNum;
  } else {
    c.lastBowl = bowlNum;
    const match = batNum === bowlNum;
    out = match && (batNum !== 0 || nm);
    if (out && free) { out = false; saved = true; }
    runs = out || match ? 0 : batNum;
    if (pp) runs *= 2;
    if (free) c.freeHit = false; // free hit used up by a legal ball
  }

  if (type === 'legal') c.balls += 1;
  if (out) c.wkts += 1;
  c.runs += runs;
  const entry = { b: batNum, w: bowlNum, out, runs, type, pp: type === 'legal' && pp, free: type === 'legal' && free, saved };
  c.log.push(entry);
  s.last = entry;

  const allOut = c.wkts >= s.config.wickets;
  const oversDone = c.balls >= maxBalls(s);

  if (s.innings === 1) {
    if (allOut || oversDone) {
      s.phase = 'break';
      s.target = c.runs + 1;
    }
  } else {
    const chased = c.runs >= s.target;
    if (chased || allOut || oversDone) {
      s.phase = 'done';
      const first = s.inn[0];
      if (chased) {
        const left = s.config.wickets - c.wkts;
        s.result = { winner: c.batter, by: `${left} wicket${left === 1 ? '' : 's'}`, tie: false };
      } else if (c.runs === first.runs) {
        s.result = { winner: null, by: 'Scores level', tie: true };
      } else {
        const d = first.runs - c.runs;
        s.result = { winner: first.batter, by: `${d} run${d === 1 ? '' : 's'}`, tie: false };
      }
    }
  }
  return s;
}

export function startSecondInnings(m) {
  const s = structuredClone(m);
  s.innings = 2;
  s.batter = other(m.batter);
  s.phase = 'play';
  s.last = null;
  return s;
}

export const oversText = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;

export function chaseInfo(m) {
  if (m.innings !== 2 || m.target == null) return null;
  const c = cur(m);
  return {
    need: Math.max(0, m.target - c.runs),
    ballsLeft: maxBalls(m) - c.balls,
    wktsLeft: m.config.wickets - c.wkts,
  };
}

const isLegal = (e) => !e.type || e.type === 'legal';

// Deliveries (including extras) belonging to the current / just-finished over.
export function lastOverBalls(inn) {
  if (inn.balls === 0) return inn.log;
  const n = inn.balls % 6 === 0 ? 6 : inn.balls % 6;
  let i = inn.log.length;
  let legal = 0;
  while (i > 0) {
    if (isLegal(inn.log[i - 1])) {
      if (legal === n) break;
      legal++;
    }
    i--;
  }
  return inn.log.slice(i);
}

export const ballLabel = (b) => (b.out ? 'W' : b.type === 'wide' ? 'Wd' : b.type === 'noball' ? 'Nb' : b.runs === 0 ? '•' : String(b.runs));
export const ballClass = (b) =>
  b.out ? 'w' : b.type === 'wide' || b.type === 'noball' ? 'ext' : b.runs === 0 ? 'dot' : b.b === 6 ? 'six' : b.b === 4 ? 'four' : 'run';

// Count fours / sixes by the number the batter showed.
export const countOf = (inn, v) => inn.log.filter((x) => isLegal(x) && !x.out && x.runs > 0 && x.b === v).length;

export const modeName = (m) => (m.config.mode === 'nomercy' ? 'No Mercy' : 'Basic');

export function summaryText(history, final) {
  const all = [...history, final];
  const lines = [`🏏 HAND CRICKET — ${modeName(final)} 🏏`];
  all.forEach((m, i) => {
    if (all.length > 1) lines.push(i === 0 ? '— Main match —' : `— Super Over ${m.superOver} —`);
    m.inn.forEach((inn) => lines.push(`${m.names[inn.batter]}: ${inn.runs}/${inn.wkts} (${oversText(inn.balls)} ov)`));
  });
  const r = final.result;
  if (r) lines.push(r.tie ? '🤝 Match tied' : `🏆 ${final.names[r.winner]} won by ${r.by}`);
  lines.push('Play: ' + location.origin);
  return lines.join('\n');
}
