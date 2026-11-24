// Bot personalities, tournament ladder and the seeded daily challenge (no server needed).
export const BOTS = {
  rookie: { id: 'rookie', name: 'Rookie', avatar: '🐣', difficulty: 'easy', style: 'balanced', blurb: 'Plays by feel. Easy to read.' },
  wall: { id: 'wall', name: 'The Wall', avatar: '🛡️', difficulty: 'medium', style: 'defensive', blurb: 'Safe singles, hard to dislodge.' },
  slugger: { id: 'slugger', name: 'Slugger', avatar: '💪', difficulty: 'medium', style: 'aggressive', blurb: 'Goes big. Boundary or wicket.' },
  trickster: { id: 'trickster', name: 'Trickster', avatar: '🎭', difficulty: 'hard', style: 'trickster', blurb: 'Switches tactics and reads you.' },
};
export const TOUR_BOTS = [BOTS.rookie, BOTS.wall, BOTS.slugger, BOTS.trickster];
export const botFor = (difficulty) =>
  difficulty === 'easy' ? BOTS.rookie : difficulty === 'medium' ? (Math.random() < 0.5 ? BOTS.wall : BOTS.slugger) : BOTS.trickster;

export const dateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dateKey(d); };

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Same date -> same challenge for every player on every device.
export function dailyChallenge(d = new Date()) {
  const date = dateKey(d);
  const r = mulberry32(hash('hand-cricket-' + date));
  const overs = [1, 2, 2, 3][Math.floor(r() * 4)];
  const wickets = [1, 2, 2, 3][Math.floor(r() * 4)];
  const mode = r() < 0.5 ? 'basic' : 'nomercy';
  const rate = 1.5 + r() * 0.9;
  const target = Math.max(6, Math.round(overs * 6 * rate * (wickets === 1 ? 0.8 : 1)) + 1);
  const bot = [BOTS.wall, BOTS.slugger, BOTS.trickster][Math.floor(r() * 3)];
  return { date, config: { overs, wickets, mode }, target, bot };
}
