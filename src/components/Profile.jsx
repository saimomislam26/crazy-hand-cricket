import { ACHIEVEMENTS, loadProgress } from '../game/progress.js';
import { Avatar } from './Avatar.jsx';

const KIND = { bot: '🤖', online: '🌍', daily: '📅', tournament: '🏆' };

export default function Profile({ name, avatar, onBack }) {
  const p = loadProgress();
  const s = p.stats;
  const earned = ACHIEVEMENTS.filter((a) => p.ach[a.id]).length;
  const tiles = [
    ['Matches', s.matches], ['Wins', s.wins], ['Win rate', s.matches ? `${Math.round((s.wins / s.matches) * 100)}%` : '–'],
    ['Win streak', `${s.streak} (best ${s.bestStreak})`], ['High score', s.highScore], ['Total runs', s.runs],
    ['Sixes', s.sixes], ['Wickets', s.wickets], ['Daily streak', `${s.dailyStreak} 🔥`], ['Trophies', `${s.tournaments} 🏆`],
  ];
  return (
    <div className="panel">
      <button className="back" onClick={onBack}>← Back</button>
      <div className="profile-head">
        <Avatar a={avatar} size={64} />
        <div><h2>{name || 'Player'}</h2><span className="muted small">{earned}/{ACHIEVEMENTS.length} badges earned</span></div>
      </div>

      <div className="stat-grid">
        {tiles.map(([k, v]) => (<div key={k} className="stat"><b>{v}</b><small>{k}</small></div>))}
      </div>

      <h3>🏅 Badges</h3>
      <div className="badge-grid">
        {ACHIEVEMENTS.map((a) => {
          const got = p.ach[a.id];
          return (
            <div key={a.id} className={`bdg ${got ? 'got' : ''}`} title={a.desc}>
              <span className="bdg-i">{got ? a.icon : '🔒'}</span>
              <b>{a.name}</b>
              <small>{a.desc}</small>
            </div>
          );
        })}
      </div>

      <h3>🕑 Recent matches</h3>
      {p.history.length === 0 ? <p className="muted small">No matches yet — go play one!</p> : (
        <div className="hist">
          {p.history.slice(0, 8).map((h) => (
            <div key={h.t} className={`hist-row ${h.won ? 'won' : 'lost'}`}>
              <span>{KIND[h.kind] || '🏏'}</span>
              <b>{h.won ? 'W' : 'L'}</b>
              <span className="grow">vs {h.vs}</span>
              <span>{h.me} – {h.opp}</span>
              <small>{h.mode === 'nomercy' ? '🔥' : ''}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
