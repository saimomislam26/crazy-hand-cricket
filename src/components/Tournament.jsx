import { TOUR_BOTS } from '../game/daily.js';
import { achById } from '../game/progress.js';
import { Avatar } from './Avatar.jsx';

export default function Tournament({ tour, avatar, name, onPlay, onExit }) {
  const { round, status, config } = tour;
  return (
    <div className="panel">
      <button className="back" onClick={onExit}>← Leave tournament</button>
      <h2>🏆 Tournament</h2>
      <p className="muted small">{config.mode === 'nomercy' ? '🔥 No Mercy' : '🏏 Basic'} • {config.overs} over{config.overs > 1 ? 's' : ''} • {config.wickets} wicket{config.wickets > 1 ? 's' : ''} per match. Lose once and you're out!</p>

      {status === 'champion' && (
        <div className="champ">
          <div className="champ-i">👑</div>
          <h2 className="gold">YOU ARE THE CHAMPION!</h2>
          {tour.award?.newAch.map((a) => <p key={a.id} className="unlock">🏅 Badge unlocked: <b>{a.icon} {a.name}</b></p>)}
          {tour.award?.newAvatars.map((a) => <p key={a} className="unlock">🔓 Avatar unlocked: <Avatar a={a} size={30} /></p>)}
        </div>
      )}
      {status === 'out' && <div className="champ out"><h3>💔 Knocked out in round {round + 1}</h3><p className="muted small">Better luck next time — the ladder is waiting.</p></div>}

      <div className="ladder">
        <div className="lad you"><Avatar a={avatar} size={40} /><b>{name || 'Player'}</b><small>You</small></div>
        {TOUR_BOTS.map((b, i) => {
          const done = i < round || status === 'champion';
          const current = i === round && status === 'active';
          const lost = i === round && status === 'out';
          return (
            <div key={b.id} className={`lad ${done ? 'done' : ''} ${current ? 'current' : ''} ${lost ? 'lost' : ''}`}>
              <span className="lad-n">{i === TOUR_BOTS.length - 1 ? 'FINAL' : `R${i + 1}`}</span>
              <Avatar a={b.avatar} size={40} />
              <div className="lad-t"><b>{b.name}</b><small>{b.blurb}</small></div>
              <span className="lad-s">{done ? '✅' : lost ? '❌' : current ? '▶' : '🔒'}</span>
            </div>
          );
        })}
      </div>

      {status === 'active' && <button className="btn primary big" onClick={onPlay}>{round === 0 ? 'Start round 1 🏏' : `Play ${round === TOUR_BOTS.length - 1 ? 'the final' : `round ${round + 1}`} 🏏`}</button>}
      {status !== 'active' && <button className="btn primary big" onClick={onExit}>Back to home</button>}
    </div>
  );
}
