// Local-only progress: stats, badges, unlockable avatars, daily streak. Stored in localStorage.
import { maxBalls, other } from './engine.js';
import { dateKey, yesterdayKey } from './daily.js';

const KEY = 'hc-progress-v1';
const blank = () => ({
  stats: { matches: 0, wins: 0, losses: 0, runs: 0, sixes: 0, fours: 0, wickets: 0, highScore: 0, streak: 0, bestStreak: 0, onlineWins: 0, tournaments: 0, dailyStreak: 0, lastDaily: null },
  ach: {},
  daily: {},
  history: [],
});

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const p = JSON.parse(raw); const b = blank(); return { ...b, ...p, stats: { ...b.stats, ...p.stats } }; }
    const old = JSON.parse(localStorage.getItem('hc-record') || 'null'); // migrate the earlier win/loss counter
    const p = blank();
    if (old) { p.stats.wins = old.w || 0; p.stats.losses = old.l || 0; p.stats.matches = p.stats.wins + p.stats.losses; }
    return p;
  } catch { return blank(); }
}
const save = (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} };

// ---------- achievements ----------
export const ACHIEVEMENTS = [
  { id: 'first_win', icon: '🏆', name: 'First Victory', desc: 'Win your first match', test: (c) => c.p.stats.wins >= 1 },
  { id: 'wins10', icon: '🎖️', name: 'Veteran', desc: 'Win 10 matches', test: (c) => c.p.stats.wins >= 10 },
  { id: 'streak3', icon: '🔥', name: 'On Fire', desc: 'Win 3 matches in a row', test: (c) => c.p.stats.streak >= 3 },
  { id: 'hat_trick', icon: '🎯', name: 'Hat-trick', desc: 'Take 3 wickets in a row', test: (c) => c.flags.hatTrick },
  { id: 'sixer', icon: '💥', name: 'Sixer Over', desc: 'Hit 3 sixes in one over', test: (c) => c.flags.sixer },
  { id: 'first_blood', icon: '🩸', name: 'First Blood', desc: 'Take a wicket on the first ball of a match', test: (c) => c.flags.firstBlood },
  { id: 'big_hitter', icon: '🏏', name: 'Big Hitter', desc: 'Score 50+ in a single innings', test: (c) => c.best >= 50 },
  { id: 'last_ball', icon: '⏱️', name: 'Last-Ball Thriller', desc: 'Win a chase on the very last ball', test: (c) => c.won && c.flags.lastBall },
  { id: 'super_hero', icon: '🦸', name: 'Super Over Hero', desc: 'Win a match in the Super Over', test: (c) => c.won && c.flags.superOver },
  { id: 'giant', icon: '😤', name: 'Giant Slayer', desc: 'Beat a Hard bot', test: (c) => c.won && c.difficulty === 'hard' && (c.kind === 'bot' || c.kind === 'tournament' || c.kind === 'daily') },
  { id: 'nm_win', icon: '💀', name: 'No Mercy Survivor', desc: 'Win a No Mercy match', test: (c) => c.won && c.mode === 'nomercy' },
  { id: 'online_win', icon: '🌍', name: 'Social Star', desc: 'Win an online match', test: (c) => c.won && c.kind === 'online' },
  { id: 'daily_done', icon: '📅', name: 'Daily Grinder', desc: 'Complete a daily challenge', test: (c) => c.won && c.kind === 'daily' },
  { id: 'champion', icon: '👑', name: 'Champion', desc: 'Win a tournament', test: (c) => c.champion },
];
export const achById = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

// ---------- avatar unlocks ----------
export const AVATAR_RULES = {
  '🦁': null, '🐯': null, '🐼': null, '🦊': null,
  '🐺': { hint: 'Win 1 match', test: (p) => p.stats.wins >= 1 },
  '🦅': { hint: 'Win 3 matches', test: (p) => p.stats.wins >= 3 },
  '🐲': { hint: 'Win 10 matches', test: (p) => p.stats.wins >= 10 },
  '🧑‍🚀': { hint: 'Win a tournament', test: (p) => !!p.ach.champion },
  '🥷': { hint: 'Earn the Hat-trick badge', test: (p) => !!p.ach.hat_trick },
  '🤠': { hint: 'Win an online match', test: (p) => !!p.ach.online_win },
  '👑': { hint: 'Complete a daily challenge', test: (p) => !!p.ach.daily_done },
  '😎': { hint: 'Earn the Sixer Over badge', test: (p) => !!p.ach.sixer },
};
export const isAvatarUnlocked = (p, a) => !AVATAR_RULES[a] || AVATAR_RULES[a].test(p);
export const unlockedAvatars = (p) => Object.keys(AVATAR_RULES).filter((a) => isAvatarUnlocked(p, a));

const legal = (e) => !e.type || e.type === 'legal';

function finish(p, before, ctx) {
  const newAch = [];
  ACHIEVEMENTS.forEach((a) => {
    if (!p.ach[a.id] && a.test({ ...ctx, p })) { p.ach[a.id] = Date.now(); newAch.push(a); }
  });
  const newAvatars = unlockedAvatars(p).filter((a) => !before.includes(a));
  save(p);
  return { newAch, newAvatars };
}

export function recordMatch({ final, history = [], role, kind, difficulty }) {
  const p = loadProgress();
  const before = unlockedAvatars(p);
  const opp = other(role);
  const all = [...history, final];
  const won = final.result.winner === role;
  const flags = { hatTrick: false, sixer: false, firstBlood: false, lastBall: false, superOver: final.superOver > 0 };
  let runs = 0, sixes = 0, fours = 0, wkts = 0, best = 0;

  all.forEach((m, mi) => {
    m.inn.forEach((inn, ii) => {
      const L = inn.log.filter(legal);
      if (inn.batter === role) {
        runs += inn.runs; best = Math.max(best, inn.runs);
        const perOver = {};
        L.forEach((e, i) => {
          if (e.out || e.runs <= 0) return;
          if (e.b === 4) fours++;
          if (e.b === 6) { sixes++; const o = Math.floor(i / 6); perOver[o] = (perOver[o] || 0) + 1; }
        });
        if (Object.values(perOver).some((v) => v >= 3)) flags.sixer = true;
      } else {
        wkts += inn.log.filter((e) => e.out).length;
        let streak = 0;
        L.forEach((e) => { streak = e.out ? streak + 1 : 0; if (streak >= 3) flags.hatTrick = true; });
        if (mi === 0 && ii === 0 && inn.log[0]?.out) flags.firstBlood = true;
      }
    });
  });
  if (final.innings === 2 && won && /wicket/.test(final.result.by) && final.inn[1].balls === maxBalls(final)) flags.lastBall = true;

  const s = p.stats;
  s.matches++; won ? s.wins++ : s.losses++;
  s.runs += runs; s.sixes += sixes; s.fours += fours; s.wickets += wkts;
  s.highScore = Math.max(s.highScore, best);
  s.streak = won ? s.streak + 1 : 0;
  s.bestStreak = Math.max(s.bestStreak, s.streak);
  if (won && kind === 'online') s.onlineWins++;

  if (won && kind === 'daily') {
    const today = dateKey();
    if (!p.daily[today]) {
      p.daily[today] = true;
      s.dailyStreak = s.lastDaily === yesterdayKey() ? s.dailyStreak + 1 : 1;
      s.lastDaily = today;
    }
  }

  const mine = final.inn.find((i) => i.batter === role);
  const theirs = final.inn.find((i) => i.batter === opp);
  p.history.unshift({ t: Date.now(), won, kind, vs: final.names[opp], mode: final.config.mode, me: `${mine.runs}/${mine.wkts}`, opp: `${theirs.runs}/${theirs.wkts}` });
  p.history = p.history.slice(0, 20);

  const unlocks = finish(p, before, { won, flags, best, kind, difficulty, mode: final.config.mode, champion: false });
  return { won, ...unlocks };
}

export function awardTournament() {
  const p = loadProgress();
  const before = unlockedAvatars(p);
  p.stats.tournaments++;
  return finish(p, before, { won: true, flags: {}, best: 0, champion: true });
}

export const dailyDone = (p = loadProgress()) => !!p.daily[dateKey()];
