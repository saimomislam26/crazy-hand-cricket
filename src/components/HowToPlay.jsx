import { useState } from 'react';
import Hand, { NUM_LABEL } from './Hand.jsx';

// One worked example: two hands side by side and the outcome.
function Scenario({ a, b, aLabel = 'BATTER', bLabel = 'BOWLER', sep = 'VS', tone, result, note }) {
  return (
    <div className={`scn ${tone}`}>
      <div className="scn-hands">
        <div><Hand n={a} size={54} /><small>{aLabel}</small><b>{a}</b></div>
        <span className="scn-vs">{sep}</span>
        <div><Hand n={b} size={54} mirror /><small>{bLabel}</small><b>{b}</b></div>
      </div>
      <div className={`scn-res ${tone}`}>{result}</div>
      <p>{note}</p>
    </div>
  );
}

const STEPS = [
  { icon: '🪙', t: 'Toss', d: 'Call Odd/Even. Both show a number. Sum matches? You choose bat or bowl.' },
  { icon: '🏏', t: 'Innings 1', d: 'Batter scores until out or overs finish.' },
  { icon: '🔄', t: 'Swap', d: 'Roles switch. Target = first score + 1.' },
  { icon: '🏆', t: 'Result', d: 'Chase it and win. Level scores → Super Over.' },
];

function Gestures() {
  return (
    <>
      <h3>✋ Hand gestures</h3>
      <div className="gesture-grid">
        {[0, 1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="gesture">
            <Hand n={n} size={58} />
            <b>{n}</b>
            <small>{n === 0 ? 'Fist' : n === 6 ? 'Thumb up' : `${n} finger${n > 1 ? 's' : ''}`}</small>
          </div>
        ))}
      </div>
      <p className="muted small">Both players reveal at the same moment on every ball.</p>
    </>
  );
}

function Basic() {
  return (
    <>
      <Gestures />
      <h3>🗺 How a match flows</h3>
      <div className="steps">
        {STEPS.map((s, i) => (
          <div key={i} className="step"><span className="step-n">{i + 1}</span><div className="step-i">{s.icon}</div><b>{s.t}</b><small>{s.d}</small></div>
        ))}
      </div>

      <h3>🪙 Toss example</h3>
      <div className="scn info">
        <div className="scn-hands">
          <div><Hand n={3} size={50} /><small>Caller</small></div>
          <span className="scn-vs">+</span>
          <div><Hand n={4} size={50} mirror /><small>Other</small></div>
          <span className="scn-vs">=</span><b className="big-sum">7</b>
        </div>
        <div className="scn-res info">ODD — caller who said Odd wins the toss</div>
      </div>

      <h3>🎯 Every ball</h3>
      <div className="scn-grid">
        <Scenario a={4} b={2} tone="good" result="+4 RUNS" note="Different numbers: batter scores what they showed." />
        <Scenario a={6} b={1} tone="six" result="SIX! +6" note="Thumb up is worth 6." />
        <Scenario a={3} b={3} tone="bad" result="OUT!" note="Same number: the batter is out." />
        <Scenario a={0} b={5} tone="dot" result="DOT BALL" note="Fist scores nothing, but is safe." />
        <Scenario a={0} b={0} tone="dot" result="DOT BALL" note="Fist vs fist is just a dot ball. Not out in Basic." />
      </div>
      <p className="muted small">Wickets are the number of outs allowed. Overs have 6 balls each.</p>
    </>
  );
}

function NoMercy() {
  return (
    <>
      <div className="callout nm">🔥 <b>No Mercy</b> = all Basic rules + the extra rules below. One big change: <b>fist vs fist is OUT</b>.</div>

      <h3>🟧 Wide ball</h3>
      <div className="scn-grid">
        <Scenario a={0} b={3} tone="ext" result="WIDE +1" note="Batter shows fist, bowler shows a number: +1 run, ball is re-bowled." />
        <Scenario a={0} b={0} tone="bad" result="OUT!" note="Both fists: NOT a wide. The batter is out." />
      </div>

      <h3>🟧 No-ball</h3>
      <div className="scn-grid">
        <Scenario a={3} b={3} aLabel="BOWLER • BALL 1" bLabel="BOWLER • BALL 2" sep="→" tone="ext" result="NO BALL +1" note="Bowler repeats a number twice in a row: +1 run, re-bowl." />
      </div>

      <h3>🆓 Free hit</h3>
      <div className="scn-grid">
        <Scenario a={5} b={5} tone="good" result="SAFE — DOT" note="The ball after a no-ball is a Free Hit: batter can't be out. Matching numbers = dot ball." />
        <Scenario a={4} b={1} tone="good" result="+4 RUNS" note="Free hit still scores normally. Swing big!" />
      </div>

      <h3>⚡ Power play</h3>
      <div className="scn-grid">
        <Scenario a={4} b={2} tone="six" result="+8 RUNS ×2" note="First over of each innings: every run counts double." />
        <Scenario a={0} b={2} tone="ext" result="WIDE +1 only" note="Extras are still just +1, even in the power play." />
      </div>
      <p className="muted small">Wides and no-balls don't use up a ball in the over. The Super Over has no power play.</p>
    </>
  );
}

export default function HowToPlay({ onClose, mode = 'basic' }) {
  const [tab, setTab] = useState(mode === 'nomercy' ? 'nomercy' : 'basic');
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal manual" onClick={(e) => e.stopPropagation()}>
        <div className="manual-head">
          <h2>📖 How to play</h2>
          <button className="btn small" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="tabs">
          <button className={`tab ${tab === 'basic' ? 'on' : ''}`} onClick={() => setTab('basic')}>🏏 Basic</button>
          <button className={`tab nm ${tab === 'nomercy' ? 'on' : ''}`} onClick={() => setTab('nomercy')}>🔥 No Mercy</button>
        </div>
        <div className="manual-body">{tab === 'basic' ? <Basic /> : <NoMercy />}</div>
        <button className="btn primary" onClick={onClose}>Got it!</button>
      </div>
    </div>
  );
}
