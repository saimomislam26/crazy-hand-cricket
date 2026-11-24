import { useState } from 'react';
import { Stadium, Logo } from './components/Art.jsx';
import Setup from './components/Setup.jsx';
import { HostLobby, JoinLobby } from './components/Lobby.jsx';
import Game from './components/Game.jsx';
import Watch from './components/Watch.jsx';
import Profile from './components/Profile.jsx';
import Tournament from './components/Tournament.jsx';
import HowToPlay from './components/HowToPlay.jsx';
import { Avatar, AvatarPicker, DEFAULT_AVATAR } from './components/Avatar.jsx';
import { awardTournament, dailyDone, isAvatarUnlocked, loadProgress } from './game/progress.js';
import { TOUR_BOTS, botFor, dailyChallenge } from './game/daily.js';
import { isMuted, setMuted, sfx } from './game/sfx.js';

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export default function App() {
  const qs = new URLSearchParams(location.search);
  const urlRoom = qs.get('room') || '';
  const urlWatch = (qs.get('watch') || '').toUpperCase();
  const [screen, setScreen] = useState(urlWatch ? 'watch' : urlRoom ? 'join' : 'home');
  const [name, setNameState] = useState(load('hc-name', ''));
  const [avatar, setAvatarState] = useState(() => {
    const a = load('hc-avatar', DEFAULT_AVATAR);
    return isAvatarUnlocked(loadProgress(), a) ? a : DEFAULT_AVATAR; // never keep a locked avatar
  });
  const [picker, setPicker] = useState(false);
  const [setup, setSetup] = useState(null); // {config, difficulty}
  const [game, setGame] = useState(null);
  const [tour, setTour] = useState(null);
  const [watchCode, setWatchCode] = useState(urlWatch);
  const [help, setHelp] = useState(false);
  const [, force] = useState(0);
  const muted = isMuted();

  const setName = (v) => { setNameState(v); save('hc-name', v); };
  const setAvatar = (a) => { setAvatarState(a); save('hc-avatar', a); };
  const myName = name.trim() || 'Player';
  const home = () => { setGame(null); setTour(null); setScreen('home'); history.replaceState(null, '', location.pathname); };
  const startGame = (g) => { setGame(g); setScreen('game'); };

  const botGame = (bot, extra) => ({
    mode: 'bot', role: 'p1', names: { p1: myName, p2: bot.name }, avatars: { p1: avatar, p2: bot.avatar },
    difficulty: bot.difficulty, botStyle: bot.style, ...extra,
  });

  // --- daily challenge ---
  const daily = dailyChallenge();
  const startDaily = () => {
    sfx.click();
    startGame(botGame(daily.bot, { kind: 'daily', config: daily.config, preset: { target: daily.target }, daily: { date: daily.date } }));
  };

  // --- tournament ---
  const playRound = (t = tour) => {
    const bot = TOUR_BOTS[t.round];
    startGame(botGame(bot, { kind: 'tournament', config: t.config, tournament: { round: t.round, total: TOUR_BOTS.length }, onTournament: roundDone }));
  };
  const roundDone = (won) => {
    if (!won) setTour((t) => ({ ...t, status: 'out' }));
    else if (tour.round === TOUR_BOTS.length - 1) { const award = awardTournament(); setTour((t) => ({ ...t, status: 'champion', award })); }
    else setTour((t) => ({ ...t, round: t.round + 1 }));
    setGame(null);
    setScreen('bracket');
  };

  const prog = loadProgress();
  const doneToday = dailyDone(prog);

  return (
    <>
      <Stadium />
      {screen === 'home' && <button className="mute" onClick={() => { setMuted(!muted); force((n) => n + 1); }} aria-label="Toggle sound">{muted ? '🔇' : '🔊'}</button>}
      <main className="app">
        {screen === 'home' && (
          <div className="home">
            <Logo />
            <p className="tagline">Shake. Show. Score. The classic game, online.</p>
            <button className="profile-chip" onClick={() => setPicker(true)}>
              <Avatar a={avatar} size={40} />
              <span>{myName}</span>
              <i>✎ Change avatar</i>
            </button>

            <button className={`daily-card ${doneToday ? 'done' : ''}`} onClick={startDaily}>
              <span className="daily-i">{doneToday ? '✅' : '📅'}</span>
              <div>
                <b>Daily Challenge {prog.stats.dailyStreak > 0 && <em>🔥 {prog.stats.dailyStreak}-day streak</em>}</b>
                <small>Chase <b>{daily.target}</b> in {daily.config.overs} ov • {daily.config.wickets} wkt • {daily.config.mode === 'nomercy' ? '🔥 No Mercy' : 'Basic'} • vs {daily.bot.avatar} {daily.bot.name}</small>
              </div>
              <span className="daily-go">{doneToday ? 'Replay' : 'Play ▶'}</span>
            </button>

            <div className="menu">
              <button className="btn primary big" onClick={() => { sfx.click(); setScreen('setupBot'); }}>🤖 Play vs Bot</button>
              <button className="btn big" onClick={() => { sfx.click(); setScreen('setupTour'); }}>🏆 Tournament</button>
              <button className="btn big" onClick={() => { sfx.click(); setScreen('setupHost'); }}>🌍 Play with a friend</button>
              <button className="btn big" onClick={() => { sfx.click(); setScreen('join'); }}>🔑 Join / Watch with code</button>
              <div className="row">
                <button className="btn ghost" onClick={() => setScreen('profile')}>🏅 Profile & badges</button>
                <button className="btn ghost" onClick={() => setHelp(true)}>📖 How to play</button>
              </div>
            </div>
            <div className="record">🏆 Wins <b>{prog.stats.wins}</b> &nbsp;•&nbsp; 💔 Losses <b>{prog.stats.losses}</b> &nbsp;•&nbsp; 🔥 Streak <b>{prog.stats.streak}</b></div>
          </div>
        )}

        {(screen === 'setupBot' || screen === 'setupHost' || screen === 'setupTour') && (
          <Setup
            mode={screen === 'setupBot' ? 'bot' : screen === 'setupTour' ? 'tournament' : 'online'}
            name={name} setName={setName} avatar={avatar} setAvatar={setAvatar}
            onBack={home}
            onContinue={(s) => {
              if (screen === 'setupBot') startGame(botGame(botFor(s.difficulty), { kind: 'bot', config: s.config }));
              else if (screen === 'setupTour') { setTour({ config: s.config, round: 0, status: 'active' }); setScreen('bracket'); }
              else { setSetup(s); setScreen('host'); }
            }}
          />
        )}
        {screen === 'host' && <HostLobby name={myName} avatar={avatar} config={setup.config} onBack={home} onStart={startGame} />}
        {screen === 'join' && (
          <JoinLobby
            name={name} setName={setName} avatar={avatar} setAvatar={setAvatar} initialCode={urlRoom} onBack={home}
            onStart={startGame} onWatch={(c) => { setWatchCode(c); setScreen('watch'); }}
          />
        )}
        {screen === 'watch' && <Watch code={watchCode} name={myName} onBack={home} />}
        {screen === 'bracket' && tour && <Tournament tour={tour} avatar={avatar} name={myName} onPlay={() => playRound()} onExit={home} />}
        {screen === 'profile' && <Profile name={myName} avatar={avatar} onBack={home} />}
        {screen === 'game' && <Game {...game} onExit={home} />}
      </main>
      {picker && <AvatarPicker value={avatar} onChange={setAvatar} onClose={() => setPicker(false)} />}
      {help && <HowToPlay onClose={() => setHelp(false)} />}
    </>
  );
}
