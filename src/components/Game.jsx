import { useEffect, useRef, useState } from 'react';
import Hand, { NUM_LABEL } from './Hand.jsx';
import Scoreboard from './Scoreboard.jsx';
import Result from './Result.jsx';
import CommentaryPanel from './CommentaryPanel.jsx';
import HowToPlay from './HowToPlay.jsx';
import { Avatar } from './Avatar.jsx';
import { applyBall, chaseInfo, createChase, createMatch, cur, isNoMercy, isPowerplay, oversText, other, startSecondInnings } from '../game/engine.js';
import { commentary } from '../game/commentary.js';
import { botPick } from '../game/bot.js';
import { recordMatch } from '../game/progress.js';
import { isMuted, setMuted, sfx } from '../game/sfx.js';

const NUMS = [0, 1, 2, 3, 4, 5, 6];
const EMOTES = ['🔥', '😂', '👏', '😡', '😭', '😎', '🤝', '🎯'];
const TURN_MS = 10000; // online: time allowed to pick each ball
const rand = (a) => a[Math.floor(Math.random() * a.length)];

export default function Game({
  mode, kind = 'bot', role, names, avatars = {}, config, difficulty, botStyle,
  preset, daily, tournament, onTournament, link, spec, roomCode, onExit,
}) {
  const opp = other(role);
  const makePreset = () => createChase({ names, config, target: preset.target });
  const [stage, setStage] = useState(preset ? 'play' : 'toss'); // toss | tossReveal | tossChoice | play | superIntro | done
  const [toss, setToss] = useState({ call: null, mine: null, theirs: null, winner: null, sum: null });
  const [match, setMatch] = useState(() => (preset ? makePreset() : null));
  const [history, setHistory] = useState([]);
  const [mine, setMine] = useState(null);
  const [queue, setQueue] = useState([]);
  const [reveal, setReveal] = useState(null);
  const [rematch, setRematch] = useState({ mine: false, theirs: false });
  const [oppLeft, setOppLeft] = useState(false);
  const [help, setHelp] = useState(false);
  const [quitAsk, setQuitAsk] = useState(false);
  const [feed, setFeed] = useState([]);
  const [unlocks, setUnlocks] = useState(null);
  const [emotes, setEmotes] = useState({ me: null, opp: null });
  const [emoteOpen, setEmoteOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [turnLeft, setTurnLeft] = useState(null);
  const [specCount, setSpecCount] = useState(0);
  const [, tick] = useState(0);
  const feedId = useRef(0);
  const busy = useRef(false);
  const timers = useRef([]);
  const hist = useRef({ bat: [], bowl: [] });
  const recorded = useRef(false);
  const lastEmote = useRef(0);
  const matchRef = useRef(null);
  const pickRef = useRef(null);

  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); };
  const flash = (t) => { setToast(t); later(() => setToast(''), 1900); };
  const say = (lines, ov = '') => {
    setFeed((f) => [...lines.map((l) => ({ ...l, ov, id: feedId.current++ })).reverse(), ...f].slice(0, 60));
  };

  const startMatch = (first) => {
    setMatch(createMatch({ names, config, firstBatter: first }));
    setStage('play');
    say([{ tone: 'info', text: `Welcome to the match! ${names[first]} will bat first — ${config.overs} over${config.overs > 1 ? 's' : ''}, ${config.wickets} wicket${config.wickets > 1 ? 's' : ''}${config.mode === 'nomercy' ? ', NO MERCY rules on!' : '.'}` }]);
  };
  const presetIntro = () =>
    say([{ tone: 'info', text: `Daily challenge! ${names[opp]} set ${preset.target - 1}. Chase ${preset.target} in ${config.overs} over${config.overs > 1 ? 's' : ''} with ${config.wickets} wicket${config.wickets > 1 ? 's' : ''}${config.mode === 'nomercy' ? ' — NO MERCY rules' : ''}.` }]);
  useEffect(() => { if (preset) presetIntro(); /* eslint-disable-next-line */ }, []);

  const quit = () => {
    if (mode === 'online') link.send({ type: 'quit' });
    onExit();
  };

  // ---------- emotes ----------
  const showEmote = (who, e) => {
    const id = Math.random();
    setEmotes((s) => ({ ...s, [who]: { e, id } }));
    later(() => setEmotes((s) => (s[who]?.id === id ? { ...s, [who]: null } : s)), 2400);
  };
  const sendEmote = (e) => {
    setEmoteOpen(false);
    if (Date.now() - lastEmote.current < 1500) return;
    lastEmote.current = Date.now();
    sfx.click();
    showEmote('me', e);
    if (mode === 'online') link.send({ type: 'emote', e });
    else if (Math.random() < 0.6) later(() => showEmote('opp', rand(['😂', '😎', '🔥', '👏'])), 900 + Math.random() * 700);
  };

  // ---------- online messages ----------
  useEffect(() => {
    if (mode !== 'online') return;
    link.setHandler((m) => {
      if (m.type === 'toss') setToss((t) => ({ ...t, theirs: m.n, call: m.call ?? t.call }));
      else if (m.type === 'tossChoice') startMatch(m.first);
      else if (m.type === 'ball') setQueue((q) => [...q, m.n]);
      else if (m.type === 'rematch') setRematch((r) => ({ ...r, theirs: true }));
      else if (m.type === 'emote') showEmote('opp', m.e);
      else if (m.type === 'quit') setOppLeft(true);
    });
    link.onClose(() => setOppLeft(true));
    return () => link.close();
    // eslint-disable-next-line
  }, []);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  // ---------- spectators (host relays snapshots) ----------
  useEffect(() => { if (spec) spec.onCount(setSpecCount); }, [spec]);
  useEffect(() => {
    if (spec) spec.publish({ type: 'snap', stage, match, feed: feed.slice(0, 40), names, avatars, config });
    // eslint-disable-next-line
  }, [spec, stage, match, feed]);

  // ---------- toss ----------
  const pickToss = (n) => {
    if (toss.mine !== null) return;
    sfx.click();
    const patch = { mine: n };
    if (mode === 'bot') patch.theirs = 1 + Math.floor(Math.random() * 6);
    else link.send({ type: 'toss', n, call: role === 'p1' ? toss.call : undefined });
    setToss((t) => ({ ...t, ...patch }));
  };
  const setCall = (c) => { sfx.click(); setToss((t) => ({ ...t, call: c })); };

  useEffect(() => {
    if (stage !== 'toss' || toss.mine === null || toss.theirs === null || !toss.call) return;
    const p1n = role === 'p1' ? toss.mine : toss.theirs;
    const p2n = role === 'p1' ? toss.theirs : toss.mine;
    const sum = p1n + p2n;
    const callerWins = (toss.call === 'even') === (sum % 2 === 0);
    setToss((t) => ({ ...t, sum, winner: callerWins ? 'p1' : 'p2' }));
    setStage('tossReveal');
    later(() => setStage('tossChoice'), 3000);
    // eslint-disable-next-line
  }, [stage, toss.mine, toss.theirs, toss.call]);

  useEffect(() => {
    if (stage === 'tossChoice' && mode === 'bot' && toss.winner === 'p2') {
      later(() => startMatch(Math.random() < 0.5 ? 'p1' : 'p2'), 1600);
    }
    // eslint-disable-next-line
  }, [stage]);

  const chooseToss = (bat) => {
    sfx.click();
    const first = bat ? role : opp;
    if (mode === 'online') link.send({ type: 'tossChoice', first });
    startMatch(first);
  };

  // ---------- balls ----------
  const pick = (n) => {
    if (mine !== null || reveal || stage !== 'play' || !match || match.phase !== 'play') return;
    sfx.click();
    const meBatting = match.batter === role;
    if (mode === 'bot') {
      const botBatting = !meBatting;
      const bn = botPick({
        difficulty, style: botStyle, botBatting,
        userBatHist: hist.current.bat, userBowlHist: hist.current.bowl,
        chase: botBatting ? chaseInfo(match) : null,
        nm: isNoMercy(match), lastBowl: cur(match).lastBowl, freeHit: cur(match).freeHit,
      });
      setQueue((q) => [...q, bn]);
    } else link.send({ type: 'ball', n });
    (meBatting ? hist.current.bat : hist.current.bowl).push(n);
    setMine(n);
  };
  matchRef.current = match;
  pickRef.current = pick;

  useEffect(() => {
    if (stage !== 'play' || !match || match.phase !== 'play' || mine === null || !queue.length || busy.current) return;
    busy.current = true;
    const theirs = queue[0];
    const snap = match;
    setReveal({ me: mine, opp: theirs, show: false });
    sfx.shake();
    later(() => {
      const meBat = snap.batter === role;
      const next = applyBall(snap, meBat ? mine : theirs, meBat ? theirs : mine);
      const { out, runs } = next.last;
      setMatch(next);
      say(commentary(next), oversText(next.inn[next.innings - 1].balls));
      setReveal({ me: mine, opp: theirs, show: true, out, runs });
      if (next.last.type !== 'legal') sfx.dot(); else if (out) sfx.out(); else if (runs >= 6) sfx.six(); else if (runs === 4) sfx.four(); else if (runs === 0) sfx.dot(); else sfx.run();
      // the bot reacts to big moments
      if (mode === 'bot' && Math.random() < 0.4) {
        const L = next.last;
        const pool = L.out ? (meBat ? ['😂', '😎'] : ['😭', '😡']) : L.type === 'legal' && L.b === 6 ? (meBat ? ['😡', '👏'] : ['🔥', '😎']) : null;
        if (pool) later(() => showEmote('opp', rand(pool)), 600);
      }
      later(() => {
        setReveal(null);
        setMine(null);
        setQueue((q) => q.slice(1));
        busy.current = false;
        if (next.phase === 'done') {
          if (next.result.tie) {
            setStage('superIntro');
            later(() => {
              setHistory((h) => [...h, next]);
              setMatch(createMatch({ names, config: { ...config, overs: 1, wickets: 1 }, firstBatter: next.inn[1].batter, superOver: (next.superOver || 0) + 1 }));
              say([{ tone: 'info', text: `Super Over! ${names[next.inn[1].batter]} bat first — 1 over, 1 wicket.` }]);
              setStage('play');
            }, 3200);
          } else setStage('done');
        }
      }, 2300);
    }, 1400);
    // eslint-disable-next-line
  }, [stage, match, mine, queue]);

  // ---------- online turn timer ----------
  const canPick = mode === 'online' && stage === 'play' && !!match && match.phase === 'play' && mine === null && !reveal && !oppLeft;
  const turnKey = canPick ? `${match.superOver}-${match.innings}-${cur(match).log.length}` : null;
  useEffect(() => {
    if (!turnKey) { setTurnLeft(null); return; }
    const start = Date.now();
    setTurnLeft(TURN_MS);
    const iv = setInterval(() => {
      const left = TURN_MS - (Date.now() - start);
      if (left <= 0) {
        clearInterval(iv);
        setTurnLeft(0);
        const m = matchRef.current;
        const meBat = m.batter === role;
        const lastBowl = isNoMercy(m) && !meBat ? cur(m).lastBowl : null;
        const pool = (meBat ? [1, 2, 3, 4, 5, 6] : NUMS).filter((x) => x !== lastBowl);
        const n = rand(pool);
        flash(`⏱ Time's up — auto-picked ${n}`);
        pickRef.current(n);
      } else setTurnLeft(left);
    }, 100);
    return () => clearInterval(iv);
    // eslint-disable-next-line
  }, [turnKey]);

  // ---------- record the result once (stats, badges, avatar unlocks) ----------
  useEffect(() => {
    if (stage === 'done' && !recorded.current) {
      recorded.current = true;
      const won = match.result.winner === role;
      won ? sfx.win() : sfx.lose();
      setUnlocks(recordMatch({ final: match, history, role, kind, difficulty }));
    }
    // eslint-disable-next-line
  }, [stage]);

  // ---------- rematch ----------
  const resetAll = () => {
    timers.current.forEach(clearTimeout); timers.current = [];
    busy.current = false; recorded.current = false;
    hist.current = { bat: [], bowl: [] };
    setToss({ call: null, mine: null, theirs: null, winner: null, sum: null });
    setFeed([]); setUnlocks(null); setEmotes({ me: null, opp: null });
    setHistory([]); setMine(null); setQueue([]); setReveal(null);
    setRematch({ mine: false, theirs: false });
    if (preset) { setMatch(makePreset()); setStage('play'); presetIntro(); }
    else { setMatch(null); setStage('toss'); }
  };
  const askRematch = () => {
    if (mode === 'bot') return resetAll();
    link.send({ type: 'rematch' });
    setRematch((r) => ({ ...r, mine: true }));
  };
  useEffect(() => {
    if (rematch.mine && rematch.theirs) resetAll();
    // eslint-disable-next-line
  }, [rematch]);

  // ---------- render ----------
  const banner = oppLeft && stage !== 'done' && (
    <div className="banner-left">Your opponent left the match. <button className="btn small" onClick={onExit}>Exit</button></div>
  );
  const actions = (
    <>
      <button className="ibtn" aria-label="Toggle sound effects" onClick={() => { setMuted(!isMuted()); tick((n) => n + 1); }}>{isMuted() ? '🔇' : '🔊'}</button>
      <button className="ibtn" aria-label="Rules" onClick={() => setHelp(true)}>📖</button>
      <button className="ibtn danger" aria-label="Quit" onClick={() => setQuitAsk(true)}>🚪</button>
    </>
  );
  const topbar = <div className="toprow">{actions}</div>;
  const quitModal = quitAsk && (
    <div className="modal-back" onClick={() => setQuitAsk(false)}>
      <div className="modal center" onClick={(e) => e.stopPropagation()}>
        <h2>Quit the match?</h2>
        <p className="muted">
          {mode === 'online' ? 'Your friend will be told you left.' : tournament ? 'Quitting abandons the whole tournament.' : 'Your progress in this match will be lost.'}
        </p>
        <div className="row">
          <button className="btn primary" onClick={() => setQuitAsk(false)}>Keep playing</button>
          <button className="btn danger" onClick={quit}>Quit</button>
        </div>
      </div>
    </div>
  );
  const toastEl = toast && <div className="toast-float">{toast}</div>;

  if (stage === 'done') {
    return (
      <Result
        final={match} history={history} role={role} avatars={avatars}
        onRematch={askRematch} rematch={rematch} oppLeft={oppLeft} online={mode === 'online'} onExit={onExit}
        unlocks={unlocks} daily={daily} tournament={tournament}
        onContinue={() => onTournament && onTournament(match.result.winner === role)}
      />
    );
  }

  if (stage === 'toss' || stage === 'tossReveal' || stage === 'tossChoice') {
    const isCaller = role === 'p1';
    const winnerIsMe = toss.winner === role;
    return (
      <div className="game">
        {banner}
        {topbar}
        {help && <HowToPlay mode={config.mode} onClose={() => setHelp(false)} />}
        {quitModal}
        <div className="panel center toss">
          <h2>🪙 The Toss</h2>
          {stage === 'toss' && (
            <>
              {isCaller ? (
                <>
                  <p className="muted">{mode === 'bot' ? 'You call' : 'You call the toss'} — Odd or Even?</p>
                  <div className="pills">
                    {['odd', 'even'].map((c) => (
                      <button key={c} className={`pill big ${toss.call === c ? 'on' : ''}`} onClick={() => setCall(c)} disabled={toss.mine !== null}>{c.toUpperCase()}</button>
                    ))}
                  </div>
                </>
              ) : <p className="muted">{names.p1} is calling Odd or Even.</p>}
              <p className="muted">{toss.mine === null ? 'Now show a number (1–6):' : toss.theirs === null ? `Locked in! Waiting for ${names[opp]}…` : ''}</p>
              <div className="numgrid">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button key={n} className={`numbtn ${toss.mine === n ? 'sel' : ''}`} disabled={toss.mine !== null || (isCaller && !toss.call)} onClick={() => pickToss(n)}>
                    <Hand n={n} size={44} /><b>{n}</b>
                  </button>
                ))}
              </div>
            </>
          )}
          {stage === 'tossReveal' && (
            <div className="tossreveal">
              <div className="hands">
                <div><Hand n={role === 'p1' ? toss.mine : toss.theirs} size={90} className="pop" /><small>{names.p1}</small></div>
                <span className="plus">+</span>
                <div><Hand n={role === 'p1' ? toss.theirs : toss.mine} size={90} className="pop" mirror /><small>{names.p2}</small></div>
              </div>
              <h3>Sum = {toss.sum} → <span className="gold">{toss.sum % 2 === 0 ? 'EVEN' : 'ODD'}</span></h3>
              <p>{names.p1} called <b>{toss.call.toUpperCase()}</b>.</p>
              <h3 className="gold">{winnerIsMe ? '🎉 You won the toss!' : `${names[toss.winner]} won the toss!`}</h3>
            </div>
          )}
          {stage === 'tossChoice' && (
            winnerIsMe ? (
              <>
                <h3 className="gold">🎉 You won the toss!</h3>
                <p className="muted">What do you choose?</p>
                <div className="row">
                  <button className="btn primary big" onClick={() => chooseToss(true)}>🏏 Bat first</button>
                  <button className="btn big" onClick={() => chooseToss(false)}>⚾ Bowl first</button>
                </div>
              </>
            ) : <p className="waiting"><span className="dots">{names[toss.winner]} is choosing</span></p>
          )}
        </div>
      </div>
    );
  }

  // ---------- play ----------
  const meBatting = match.batter === role;
  const me = names[role], op = names[opp];
  const locked = mine !== null || !!reveal || match.phase !== 'play';
  const rv = reveal;
  const L = rv?.show ? match.last : null;
  const outcome = L
    ? L.type === 'wide' ? 'wide' : L.type === 'noball' ? 'noball'
      : L.out ? 'out' : L.saved ? 'saved' : L.runs === 0 ? 'dot' : L.b === 6 ? 'six' : L.b === 4 ? 'four' : 'run'
    : null;
  const ppTag = L?.pp && L.runs > 0 ? ` = ${L.runs} ⚡×2` : '';
  const bannerText = {
    out: 'OUT!', six: `SIX! 🚀${ppTag}`, four: `FOUR! 💥${ppTag}`, dot: 'DOT BALL',
    run: `${L?.runs} RUN${L?.runs === 1 ? '' : 'S'}${ppTag}`,
    wide: 'WIDE! +1', noball: 'NO BALL! +1', saved: 'FREE HIT — SAFE!',
  }[outcome];
  const sub = !L ? '' :
    L.type === 'wide' ? 'Fist vs a number — bowl it again' :
    L.type === 'noball' ? 'Bowler repeated a number — FREE HIT next!' :
    L.out ? (meBatting ? 'You are out!' : 'You got the wicket! 🎯') :
    L.saved ? 'Numbers matched, but a free hit can\'t get you out' :
    meBatting ? `+${L.runs} for you` : `${op} scores ${L.runs}`;
  const nm = isNoMercy(match);
  const inn = cur(match);
  const repeatNum = nm && !meBatting ? inn.lastBowl : null; // would be a no-ball
  const freeHit = nm && inn.freeHit;
  const power = isPowerplay(match);

  return (
    <div className="game">
      {banner}
      <Scoreboard match={match} role={role} avatars={avatars} actions={actions} />

      <div className={`arena ${outcome ? `res-${outcome}` : ''}`}>
        <div className="side">
          <div className="who"><Avatar a={avatars[role]} size={34} /> {me} <small>(You)</small></div>
          <div className="handbox">
            <Hand n={rv && rv.show ? rv.me : 0} size={110} className={rv && !rv.show ? 'shake' : rv?.show ? 'pop' : 'idle'} />
            {emotes.me && <span key={emotes.me.id} className="emote-bubble">{emotes.me.e}</span>}
          </div>
          <div className="role">{meBatting ? 'BATTING' : 'BOWLING'}</div>
        </div>
        <div className="vs">VS</div>
        <div className="side">
          <div className="who"><Avatar a={avatars[opp]} size={34} /> {op}</div>
          <div className="handbox">
            <Hand n={rv && rv.show ? rv.opp : 0} size={110} mirror className={rv && !rv.show ? 'shake' : rv?.show ? 'pop' : 'idle'} />
            {emotes.opp && <span key={emotes.opp.id} className="emote-bubble">{emotes.opp.e}</span>}
          </div>
          <div className="role">{!meBatting ? 'BATTING' : 'BOWLING'}</div>
        </div>
        {(power || freeHit) && !rv && (
          <div className="tags">
            {power && <span className="tag pp">⚡ POWER PLAY ×2</span>}
            {freeHit && <span className="tag fh">🆓 FREE HIT — can't be out</span>}
          </div>
        )}
        {rv && !rv.show && <div className="countdown">Shake…</div>}
        {rv?.show && (
          <div className={`result-banner ${outcome}`}>
            <b>{bannerText}</b>
            <small>{sub}</small>
          </div>
        )}
        <div className="arena-tools">
          {spec && roomCode && (
            <button className="arena-btn" aria-label="Copy spectator link" onClick={async () => {
              try { await navigator.clipboard.writeText(`${location.origin}${location.pathname}?watch=${roomCode}`); flash('👀 Spectator link copied!'); } catch { flash(`Spectators join with code ${roomCode}`); }
            }}>👀{specCount > 0 ? ` ${specCount}` : ''}</button>
          )}
          <button className="arena-btn" aria-label="Send an emote" onClick={() => setEmoteOpen((o) => !o)}>😀</button>
        </div>
        {emoteOpen && (
          <div className="emote-tray">
            {EMOTES.map((e) => <button key={e} onClick={() => sendEmote(e)}>{e}</button>)}
          </div>
        )}
      </div>

      <CommentaryPanel feed={feed} />

      <div className="pickpanel">
        {turnLeft !== null && (
          <div className={`turnbar ${turnLeft < 3500 ? 'urgent' : ''}`} role="timer">
            <i style={{ width: `${(turnLeft / TURN_MS) * 100}%` }} />
            <span>⏱ {Math.ceil(turnLeft / 1000)}s</span>
          </div>
        )}
        <p className="tip">
          {mine !== null && !rv ? <span className="dots">Locked in — waiting for {op}</span>
            : meBatting ? <>You're <b>BATTING</b>: pick a number. If it matches the bowler's, you're out!{nm && <> <small>(0 = wide, 0–0 = out)</small></>}</>
            : <>You're <b>BOWLING</b>: guess the batter's number to take a wicket!{repeatNum != null && <> <b className="red">Don't repeat {repeatNum} — no-ball!</b></>}</>}
        </p>
        <div className="numrow">
          {NUMS.map((n) => (
            <button key={n} className={`numbtn ${mine === n ? 'sel' : ''} ${repeatNum === n ? 'warn' : ''} ${nm && meBatting && n === 0 ? 'wide' : ''}`} disabled={locked} onClick={() => pick(n)} title={NUM_LABEL[n]}>
              <Hand n={n} size={40} /><b>{n}</b>{repeatNum === n && <i className="nb">NB</i>}{nm && meBatting && n === 0 && <i className="nb">WD</i>}
            </button>
          ))}
        </div>
      </div>

      {match.phase === 'break' && !reveal && (
        <div className="modal-back">
          <div className="modal center">
            <h2>⏸ Innings break</h2>
            <p>{names[match.inn[0].batter]} scored <b className="gold">{match.inn[0].runs}/{match.inn[0].wkts}</b></p>
            <p>{names[other(match.inn[0].batter)]} needs <b className="gold">{match.target}</b> to win{match.inn[0].batter === role ? '' : ' — that\'s you!'}</p>
            <button className="btn primary big" onClick={() => { sfx.click(); setMatch(startSecondInnings(match)); say([{ tone: 'info', text: `Second innings! ${names[other(match.batter)]} chase ${match.target}.` }]); }}>Start 2nd innings ▶</button>
          </div>
        </div>
      )}
      {help && <HowToPlay mode={config.mode} onClose={() => setHelp(false)} />}
      {quitModal}
      {toastEl}
      {stage === 'superIntro' && (
        <div className="modal-back">
          <div className="modal center">
            <h1>🤝 TIE!</h1>
            <h2 className="gold">SUPER OVER</h2>
            <p>1 over • 1 wicket each. Winner takes it all!</p>
          </div>
        </div>
      )}
    </div>
  );
}
