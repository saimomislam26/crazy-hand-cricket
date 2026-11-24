import { useEffect, useRef, useState } from 'react';
import { joinRoom } from '../net/peer.js';
import Scoreboard from './Scoreboard.jsx';
import CommentaryPanel from './CommentaryPanel.jsx';
import Hand from './Hand.jsx';
import { Avatar } from './Avatar.jsx';
import { cur, oversText } from '../game/engine.js';

// Read-only live view of a match, fed by snapshots the host relays over WebRTC.
export default function Watch({ code, name, onBack }) {
  const [status, setStatus] = useState('connecting'); // connecting | live | ended | error
  const [snap, setSnap] = useState(null);
  const linkRef = useRef(null);

  useEffect(() => {
    let dead = false;
    joinRoom(code)
      .then((link) => {
        if (dead) return link.close();
        linkRef.current = link;
        link.setHandler((m) => { if (m.type === 'snap') setSnap(m); });
        link.onClose(() => setStatus('ended'));
        link.send({ type: 'watch', name });
        setStatus('live');
      })
      .catch(() => !dead && setStatus('error'));
    return () => { dead = true; linkRef.current?.close(); };
  }, [code, name]);

  const leave = <button className="ibtn danger" aria-label="Leave" onClick={onBack}>🚪</button>;

  if (status === 'connecting') return <div className="panel center"><h2>👀 Spectating</h2><p className="waiting"><span className="dots">Connecting to room {code}</span></p><button className="btn" onClick={onBack}>Cancel</button></div>;
  if (status === 'error') return <div className="panel center"><h2>👀 Spectating</h2><p className="error">Couldn't find room {code}. Check the code and try again.</p><button className="btn primary" onClick={onBack}>Back</button></div>;

  const m = snap?.match;
  if (!m) {
    const toss = snap && snap.stage !== 'lobby';
    return (
      <div className="panel center">
        <h2>👀 Spectating</h2>
        <p className="waiting"><span className="dots">{toss ? 'Toss in progress' : 'Waiting for the match to start'}</span></p>
        {status === 'ended' && <p className="error">The host left.</p>}
        <button className="btn" onClick={onBack}>Leave</button>
      </div>
    );
  }

  const c = cur(m);
  const last = m.last;
  const bowler = m.batter === 'p1' ? 'p2' : 'p1';
  const over = snap.stage === 'done';
  return (
    <div className="game">
      {status === 'ended' && !over && <div className="banner-left">The host left the match. <button className="btn small" onClick={onBack}>Exit</button></div>}
      <Scoreboard match={m} role={null} avatars={snap.avatars} actions={leave} />
      <div className="arena">
        <div className="side">
          <div className="who"><Avatar a={snap.avatars?.[c.batter]} size={34} /> {m.names[c.batter]}</div>
          <div className="handbox"><Hand n={last ? last.b : 0} size={110} className="idle" /></div>
          <div className="role">BATTING</div>
        </div>
        <div className="vs">VS</div>
        <div className="side">
          <div className="who"><Avatar a={snap.avatars?.[bowler]} size={34} /> {m.names[bowler]}</div>
          <div className="handbox"><Hand n={last ? last.w : 0} size={110} mirror className="idle" /></div>
          <div className="role">BOWLING</div>
        </div>
        <div className="spec-tag">👀 SPECTATING • {oversText(c.balls)} ov</div>
        {over && m.result && (
          <div className="result-banner six">
            <b>{m.result.tie ? 'TIE!' : `${m.names[m.result.winner]} WINS`}</b>
            <small>{m.result.tie ? 'Scores level' : `by ${m.result.by}`}</small>
          </div>
        )}
      </div>
      <CommentaryPanel feed={snap.feed || []} />
    </div>
  );
}
