import { useEffect, useRef, useState } from 'react';
import { hostRoom, joinRoom } from '../net/peer.js';
import { createSpectators } from '../net/spectators.js';
import { Avatar, ProfileRow } from './Avatar.jsx';

export function HostLobby({ name, avatar, config, onBack, onStart }) {
  const [code, setCode] = useState(null);
  const [err, setErr] = useState(null);
  const [guest, setGuest] = useState(null); // {name, avatar, link}
  const [copied, setCopied] = useState('');
  const roomRef = useRef(null);
  const started = useRef(false);
  const playerLinked = useRef(false);
  const spec = useRef(createSpectators());

  useEffect(() => {
    let dead = false;
    hostRoom(() => setErr('Could not reach the matchmaking server. Check your internet and try again.'))
      .then((room) => {
        if (dead) return room.destroy();
        roomRef.current = room;
        // The first friend to say "hello" is the opponent; anyone who says "watch" is a spectator.
        room.setConnHandler((link) => {
          link.setHandler((m) => {
            if (m.type === 'watch') spec.current.add(link);
            else if (m.type === 'hello' && !playerLinked.current && !started.current) {
              playerLinked.current = true;
              setGuest({ name: m.name, avatar: m.avatar, link });
              link.onClose(() => { playerLinked.current = false; setGuest(null); });
            }
          });
        });
        setCode(room.code);
      })
      .catch(() => {});
    return () => { dead = true; if (!started.current) { spec.current.closeAll(); roomRef.current?.destroy(); } };
  }, []);

  const base = `${location.origin}${location.pathname}`;
  const copy = async (kind, text) => {
    try { await navigator.clipboard.writeText(text); setCopied(kind); setTimeout(() => setCopied(''), 1500); } catch {}
  };
  const start = () => {
    started.current = true;
    const names = { p1: name, p2: guest.name };
    const avatars = { p1: avatar, p2: guest.avatar };
    guest.link.send({ type: 'start', config, names, avatars });
    onStart({ mode: 'online', kind: 'online', role: 'p1', link: guest.link, names, avatars, config, spec: spec.current, roomCode: code });
  };

  return (
    <div className="panel center">
      <button className="back" onClick={onBack}>← Back</button>
      <h2>🌍 Invite a friend</h2>
      {err ? <p className="error">{err}</p> : !code ? <p className="muted">Creating room…</p> : (
        <>
          <p className="muted">Share this code or link:</p>
          <div className="roomcode">{code}</div>
          <div className="row wrap">
            <button className="btn" onClick={() => copy('play', `${base}?room=${code}`)}>{copied === 'play' ? '✅ Copied!' : '📋 Invite link'}</button>
            <button className="btn" onClick={() => copy('watch', `${base}?watch=${code}`)}>{copied === 'watch' ? '✅ Copied!' : '👀 Spectator link'}</button>
          </div>
          <p className="muted small">{config.mode === 'nomercy' ? '🔥 No Mercy' : '🏏 Basic'} • {config.overs} overs • {config.wickets} wickets</p>
          {guest ? (
            <>
              <p className="joined"><Avatar a={guest.avatar} size={36} /> <b>{guest.name}</b> joined!</p>
              <button className="btn primary big" onClick={start}>Start match 🏏</button>
            </>
          ) : <p className="waiting"><span className="dots">Waiting for your friend to join</span></p>}
        </>
      )}
    </div>
  );
}

export function JoinLobby({ name, setName, avatar, setAvatar, initialCode = '', onBack, onStart, onWatch }) {
  const [code, setCode] = useState(initialCode);
  const [tab, setTab] = useState('play'); // play | watch
  const [state, setState] = useState('idle'); // idle | joining | waiting | error
  const [err, setErr] = useState('');
  const linkRef = useRef(null);

  const join = async () => {
    if (code.trim().length < 3) return;
    setState('joining'); setErr('');
    try {
      const link = await joinRoom(code);
      linkRef.current = link;
      link.setHandler((m) => {
        if (m.type === 'start') onStart({ mode: 'online', kind: 'online', role: 'p2', link, names: m.names, avatars: m.avatars, config: m.config });
      });
      link.onClose(() => { setState('error'); setErr('Host left the room.'); });
      link.send({ type: 'hello', name: name.trim() || 'Player', avatar });
      setState('waiting');
    } catch {
      setState('error'); setErr('Room not found. Check the code and try again.');
    }
  };

  return (
    <div className="panel center">
      <button className="back" onClick={() => { linkRef.current?.close(); onBack(); }}>← Back</button>
      <h2>🔑 Join a match</h2>
      {state === 'waiting' ? (
        <p className="waiting"><span className="dots">Connected! Waiting for host to start</span></p>
      ) : (
        <>
          <div className="tabs">
            <button className={`tab ${tab === 'play' ? 'on' : ''}`} onClick={() => setTab('play')}>🎮 Play</button>
            <button className={`tab ${tab === 'watch' ? 'on' : ''}`} onClick={() => setTab('watch')}>👀 Watch</button>
          </div>
          {tab === 'play' && <ProfileRow avatar={avatar} setAvatar={setAvatar} name={name} setName={setName} />}
          <label className="field">
            <span>Room code</span>
            <input className="codeinput" value={code} maxLength={5} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABCDE" />
          </label>
          {err && <p className="error">{err}</p>}
          {tab === 'play' ? (
            <button className="btn primary big" disabled={state === 'joining'} onClick={join}>
              {state === 'joining' ? 'Connecting…' : 'Join 🚀'}
            </button>
          ) : (
            <button className="btn primary big" disabled={code.trim().length < 3} onClick={() => onWatch(code.trim())}>Watch live 👀</button>
          )}
        </>
      )}
    </div>
  );
}
