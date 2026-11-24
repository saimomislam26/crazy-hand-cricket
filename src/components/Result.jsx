import { useState } from 'react';
import { ballClass, ballLabel, countOf, modeName, oversText, summaryText } from '../game/engine.js';
import { copyText, shareScorecard } from '../share.js';
import { Ball } from './Art.jsx';
import { Avatar } from './Avatar.jsx';
import { TOUR_BOTS } from '../game/daily.js';

function Confetti() {
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: 36 }, (_, i) => (
        <i key={i} style={{ left: `${(i * 29) % 100}%`, animationDelay: `${(i % 9) * 0.25}s`, background: ['#ffd34d', '#ff6b6b', '#4dd0ff', '#8cf5a8', '#c58bff'][i % 5] }} />
      ))}
    </div>
  );
}

function Innings({ m, inn, i }) {
  const rate = inn.balls ? ((inn.runs / inn.balls) * 6).toFixed(2) : '0.00';
  return (
    <div className="inn-card">
      <div className="inn-head">
        <span className="badge">{m.superOver ? `SO ${m.superOver} • ` : ''}INNINGS {i + 1}</span>
        <b>{m.names[inn.batter]}</b>
        <span className="inn-score">{inn.runs}/{inn.wkts}</span>
      </div>
      <div className="inn-stats">
        <span>Overs {oversText(inn.balls)}</span><span>RR {rate}</span><span>4s {countOf(inn, 4)}</span><span>6s {countOf(inn, 6)}</span>
      </div>
      <div className="chips">
        {inn.log.map((b, k) => (
          <span key={k} className={`chip ${ballClass(b)}`}>{ballLabel(b)}</span>
        ))}
      </div>
    </div>
  );
}

export default function Result({ final, history, role, avatars = {}, onRematch, rematch, oppLeft, online, onExit, unlocks, tournament, onContinue, daily }) {
  const [note, setNote] = useState('');
  const r = final.result;
  const won = r.winner === role;
  const text = summaryText(history, final);
  const flash = (t) => { setNote(t); setTimeout(() => setNote(''), 2000); };

  return (
    <div className="game result">
      {!r.tie && won && <Confetti />}
      <div className="panel center">
        {r.winner ? <Avatar a={avatars[r.winner]} size={84} className="spin" /> : <Ball size={54} className="spin" />}
        <h1 className={won ? 'gold' : ''}>{won ? '🏆 You won!' : `${final.names[r.winner]} wins!`}</h1>
        <p className="muted">{final.names[r.winner]} won by <b>{r.by}</b>{final.superOver ? ' in the Super Over' : ''} <span className={`badge mode ${final.config.mode === 'nomercy' ? 'nm' : ''}`}>{modeName(final)}</span></p>

        {daily && <p className="unlock">{won ? `📅 Daily challenge complete!` : `📅 Daily challenge failed — try again!`}</p>}
        {unlocks?.newAch.map((a) => <div key={a.id} className="unlock-card"><span>{a.icon}</span><div><b>Badge unlocked: {a.name}</b><small>{a.desc}</small></div></div>)}
        {unlocks?.newAvatars.map((a) => <div key={a} className="unlock-card"><Avatar a={a} size={40} /><div><b>New avatar unlocked!</b><small>Pick it from your profile</small></div></div>)}

        {[...history, final].map((m, mi) => (
          <div key={mi}>
            {history.length > 0 && <h4 className="muted">{mi === 0 ? 'Main match' : `Super Over ${m.superOver}`}</h4>}
            {m.inn.map((inn, i) => <Innings key={i} m={m} inn={inn} i={i} />)}
          </div>
        ))}

        <div className="row wrap">
          <button className="btn primary" onClick={async () => { const s = await shareScorecard(final, history, text); flash(s === 'downloaded' ? '📥 Scorecard saved!' : s === 'shared' ? '✅ Shared!' : ''); }}>📤 Share scorecard</button>
          <button className="btn" onClick={async () => flash((await copyText(text)) ? '📋 Copied!' : 'Copy failed')}>📋 Copy text</button>
        </div>
        {note && <p className="toast">{note}</p>}
        <div className="row wrap">
          {tournament ? (
            <button className="btn primary big" onClick={onContinue}>
              {!won ? 'See results' : tournament.round === TOUR_BOTS.length - 1 ? '👑 Claim the trophy' : '▶ Next round'}
            </button>
          ) : (
            <button className="btn" disabled={oppLeft} onClick={onRematch}>
              {online ? (rematch.mine ? '⏳ Waiting for friend…' : rematch.theirs ? '🔁 Friend wants a rematch!' : '🔁 Rematch') : daily && !won ? '🔁 Try again' : '🔁 Play again'}
            </button>
          )}
          {!tournament && <button className="btn ghost" onClick={onExit}>🏠 Home</button>}
        </div>
        {oppLeft && <p className="muted small">Your opponent left.</p>}
      </div>
    </div>
  );
}
