import { useState } from 'react';
import { sfx } from '../game/sfx.js';
import { ProfileRow } from './Avatar.jsx';

const OVERS = [1, 2, 3, 5, 10];
const MODES = [
  { id: 'basic', icon: '🏏', name: 'Basic', desc: 'Classic rules. Same number = out, fist = dot ball.' },
  { id: 'nomercy', icon: '🔥', name: 'No Mercy', desc: 'Wides, no-balls, free hits & power play. 0–0 = out!' },
];
const DIFFS = [
  { id: 'easy', icon: '😄', name: 'Easy', desc: 'Plays randomly' },
  { id: 'medium', icon: '😎', name: 'Medium', desc: 'Learns your habits' },
  { id: 'hard', icon: '🔥', name: 'Hard', desc: 'Reads you & the chase' },
];

export default function Setup({ mode, name, setName, avatar, setAvatar, onBack, onContinue }) {
  const [overs, setOvers] = useState(2);
  const [wickets, setWickets] = useState(2);
  const [difficulty, setDifficulty] = useState('medium');
  const [gameMode, setGameMode] = useState('basic');
  const bot = mode === 'bot';

  return (
    <div className="panel">
      <button className="back" onClick={onBack}>← Back</button>
      <h2>{bot ? '🤖 Play vs Bot' : mode === 'tournament' ? '🏆 Tournament' : '🌍 Host a match'}</h2>

      <ProfileRow avatar={avatar} setAvatar={setAvatar} name={name} setName={setName} />

      <div className="field">
        <span>Game mode</span>
        <div className="cards2">
          {MODES.map((m) => (
            <button key={m.id} className={`dcard ${gameMode === m.id ? 'on' : ''} ${m.id === 'nomercy' ? 'nmcard' : ''}`} onClick={() => { setGameMode(m.id); sfx.click(); }}>
              <div className="dicon">{m.icon}</div>
              <b>{m.name}</b>
              <small>{m.desc}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span>Overs <small>(6 balls each)</small></span>
        <div className="pills">
          {OVERS.map((o) => (
            <button key={o} className={`pill ${overs === o ? 'on' : ''}`} onClick={() => { setOvers(o); sfx.click(); }}>{o}</button>
          ))}
          <input className="pill num" type="number" min="1" max="20" value={overs}
            onChange={(e) => setOvers(Math.max(1, Math.min(20, +e.target.value || 1)))} />
        </div>
      </div>

      <div className="field">
        <span>Wickets: <b className="gold">{wickets}</b></span>
        <input type="range" min="1" max="10" value={wickets} onChange={(e) => setWickets(+e.target.value)} />
        <div className="range-labels"><small>1 (sudden death)</small><small>10 (full team)</small></div>
      </div>

      {bot && (
        <div className="field">
          <span>Difficulty</span>
          <div className="cards3">
            {DIFFS.map((d) => (
              <button key={d.id} className={`dcard ${difficulty === d.id ? 'on' : ''}`} onClick={() => { setDifficulty(d.id); sfx.click(); }}>
                <div className="dicon">{d.icon}</div>
                <b>{d.name}</b>
                <small>{d.desc}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      <button className="btn primary big" onClick={() => onContinue({ config: { overs, wickets, mode: gameMode }, difficulty })}>
        {bot ? 'Start match 🏏' : mode === 'tournament' ? 'Enter the tournament 🏆' : 'Create room 🔗'}
      </button>
    </div>
  );
}
