import { Avatar } from './Avatar.jsx';
import { cur, oversText, maxBalls, chaseInfo, lastOverBalls, ballLabel, ballClass, isNoMercy, isPowerplay } from '../game/engine.js';

function Chip({ b }) {
  return <span className={`chip ${ballClass(b)}`} title={b.pp ? 'Power play ×2' : b.free ? 'Free hit' : ''}>{ballLabel(b)}{b.pp && b.runs > 0 ? '⚡' : ''}</span>;
}

export default function Scoreboard({ match, role, avatars = {}, actions = null }) {
  const c = cur(match);
  const chase = chaseInfo(match);
  const crr = c.balls ? ((c.runs / c.balls) * 6).toFixed(2) : '0.00';
  const over = lastOverBalls(c);
  const first = match.inn[0];
  return (
    <div className="scoreboard">
      <div className="sb-top">
        <span className="badge">{match.superOver ? `SUPER OVER ${match.superOver}` : `INNINGS ${match.innings}`}</span>
        <span className="live"><i /> LIVE</span>
        <span className={`badge mode ${isNoMercy(match) ? 'nm' : ''}`}>{isNoMercy(match) ? '🔥 NO MERCY' : 'BASIC'}</span>
        <span className="sb-sub">{match.config.overs} ov • {match.config.wickets} wkt</span>
        {actions && <span className="sb-actions">{actions}</span>}
      </div>
      <div className="sb-main">
        <div className="sb-team">
          <div className="sb-name"><Avatar a={avatars[c.batter]} size={26} /> {match.names[c.batter]}{c.batter === role ? ' (You)' : ''}</div>
          <div className="sb-bowl">bowling: {match.names[match.batter === 'p1' ? 'p2' : 'p1']}</div>
        </div>
        <div className="sb-score">
          <b key={c.runs}>{c.runs}</b>
          <span>/{c.wkts}</span>
        </div>
        <div className="sb-overs">
          <b>{oversText(c.balls)}</b>
          <small>/ {match.config.overs} ov</small>
        </div>
      </div>
      <div className="sb-info">
        {match.innings === 2 && first ? (
          <span className="target">
            Target <b>{match.target}</b>
            {chase && <> — need <b>{chase.need}</b> from <b>{chase.ballsLeft}</b> ball{chase.ballsLeft === 1 ? '' : 's'}</>}
          </span>
        ) : (
          <span>Run rate <b>{crr}</b> • {maxBalls(match) - c.balls} balls left</span>
        )}
        <span className="sb-wk">{match.config.wickets - c.wkts} wkt{match.config.wickets - c.wkts === 1 ? '' : 's'} left</span>
      </div>
      <div className="sb-over">
        <small>This over</small>
        <div className="chips">{over.length ? over.map((b, i) => <Chip key={i} b={b} />) : <span className="muted">—</span>}</div>
      </div>
    </div>
  );
}
