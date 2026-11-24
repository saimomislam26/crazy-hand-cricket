import { useState } from 'react';
import { AVATAR_RULES, isAvatarUnlocked, loadProgress } from '../game/progress.js';

export const AVATARS = ['🦁', '🐯', '🐼', '🦊', '🐺', '🦅', '🐲', '🧑‍🚀', '🥷', '🤠', '👑', '😎'];
export const DEFAULT_AVATAR = AVATARS[0];
const GRADS = [
  ['#ffb347', '#ff7a1c'], ['#ffd34d', '#ff9f1c'], ['#9fb4d6', '#5b6b8a'], ['#ff9a8b', '#ff4d5e'],
  ['#8fa4c8', '#3b4a6b'], ['#c8a56a', '#8a6a2f'], ['#7be0a5', '#1f9e5a'], ['#7cc4ff', '#3b6fd4'],
  ['#555b6e', '#1b1f2e'], ['#e0b97f', '#b9824a'], ['#ffe27a', '#e0a800'], ['#c58bff', '#7a3bd4'],
];

export function Avatar({ a = DEFAULT_AVATAR, size = 44, className = '' }) {
  const i = AVATARS.indexOf(a);
  const [c1, c2] = i < 0 ? ['#9fe8ff', '#3b8fd4'] : GRADS[i]; // bots / opponents outside the player list get a steel-blue badge
  return (
    <span className={`avatar ${className}`} style={{ width: size, height: size, fontSize: size * 0.58, background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
      {a}
    </span>
  );
}

export function AvatarPicker({ value, onChange, onClose }) {
  const [hint, setHint] = useState('');
  const p = loadProgress();
  const total = AVATARS.length;
  const owned = AVATARS.filter((a) => isAvatarUnlocked(p, a)).length;
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal center" onClick={(e) => e.stopPropagation()}>
        <h2>Choose your avatar</h2>
        <Avatar a={value} size={84} />
        <p className="muted small">{owned}/{total} unlocked — win matches and earn badges to unlock more</p>
        <div className="avatar-grid">
          {AVATARS.map((a) => {
            const open = isAvatarUnlocked(p, a);
            return (
              <button key={a} className={`avatar-opt ${a === value ? 'on' : ''} ${open ? '' : 'locked'}`}
                onClick={() => { if (open) { onChange(a); setHint(''); } else setHint(`🔒 ${AVATAR_RULES[a].hint} to unlock`); }}
                aria-label={open ? `Avatar ${a}` : `Locked avatar: ${AVATAR_RULES[a].hint}`}>
                <Avatar a={a} size={52} />
                {!open && <i className="lock">🔒</i>}
              </button>
            );
          })}
        </div>
        <p className="hint-line">{hint || '\u00A0'}</p>
        <button className="btn primary" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

// Avatar + name input row used on setup/join screens.
export function ProfileRow({ avatar, setAvatar, name, setName }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="profile-row">
      {open && <AvatarPicker value={avatar} onChange={setAvatar} onClose={() => setOpen(false)} />}
      <button className="avatar-btn" onClick={() => setOpen(true)} aria-label="Change avatar">
        <Avatar a={avatar} size={56} />
        <i>✎</i>
      </button>
      <label className="field">
        <span>Your name</span>
        <input value={name} maxLength={14} onChange={(e) => setName(e.target.value)} placeholder="Player" />
      </label>
    </div>
  );
}
