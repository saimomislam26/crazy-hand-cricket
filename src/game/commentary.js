// Ball-by-ball commentary. Returns [{ text, tone }] for the delivery in m.last.
import { chaseInfo, cur, other } from './engine.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const WORD = ['no run', 'a single', 'two runs', 'three runs', 'FOUR', 'five runs', 'SIX'];

export function commentary(m) {
  const e = m.last;
  const c = cur(m);
  const bat = m.names[c.batter];
  const bow = m.names[other(c.batter)];
  const out = [];
  const wk = m.config.wickets - c.wkts;
  let text;
  let tone = 'run';

  if (e.type === 'wide') {
    tone = 'ext';
    text = pick([
      `Wide! ${bat} shows a fist while ${bow} sends down a ${e.w}. +1 and bowl it again.`,
      `That's a wide — ${bat} stays closed-fisted and ${bow} loses the line. One extra run.`,
      `Wide ball called! ${bow} shows ${e.w} against a fist. +1 to the total, re-bowl.`,
    ]);
  } else if (e.type === 'noball') {
    tone = 'ext';
    text = pick([
      `No ball! ${bow} repeated ${e.w} twice in a row. +1 run and a FREE HIT is coming up!`,
      `Overstepped! ${bow} showed ${e.w} again — that's a no-ball. Free hit next, ${bat}!`,
      `${bow} goes with ${e.w} one time too many. No ball, +1, and the next one is a free hit.`,
    ]);
  } else if (e.out) {
    tone = 'w';
    const fist = e.b === 0;
    text = fist
      ? pick([
          `OUT! Fist meets fist — no mercy! ${bat} has to walk back.`,
          `Both closed their fists and that's a wicket! ${bow} strikes in No Mercy.`,
        ])
      : pick([
          `OUT! Both showed ${e.b} — ${bow} read ${bat} perfectly!`,
          `Gone! ${bat} and ${bow} both picked ${e.b}, and the batter is dismissed.`,
          `Wicket! ${bow} matched ${e.b} and ${bat} is out. What a delivery!`,
          `Timber! Same number, ${e.b} — ${bat} departs.`,
        ]);
    text += wk > 0 ? ` ${wk} wicket${wk === 1 ? '' : 's'} left.` : ` ${bat} was the last wicket!`;
  } else if (e.saved) {
    tone = 'run';
    text = pick([
      `Free hit! Both showed ${e.b}, but ${bat} can't be out — a lucky escape!`,
      `Matched on ${e.b}... but it's a free hit, so ${bat} survives. Dot ball.`,
    ]);
  } else if (e.runs === 0) {
    tone = 'dot';
    text = e.b === 0 && e.w === 0
      ? pick([`Fist against fist — nothing doing. Dot ball.`, `Both closed fists. A quiet dot ball.`])
      : pick([`${bat} shows a fist. Dot ball.`, `Defended solidly by ${bat}. No run.`, `Tight bowling from ${bow}. Dot ball.`]);
  } else if (e.b === 6) {
    tone = 'six';
    text = pick([
      `SIX! ${bat} gives it the thumbs-up and launches it over the rope!`,
      `Massive! ${bat} sends ${bow}'s delivery into the stands for SIX!`,
      `That's out of the park! SIX runs for ${bat}!`,
    ]);
  } else if (e.b === 4) {
    tone = 'four';
    text = pick([
      `FOUR! ${bat} finds the gap and it races to the boundary!`,
      `Cracked away for FOUR by ${bat}!`,
      `Beautiful shot — four runs to ${bat}.`,
    ]);
  } else {
    tone = 'run';
    const n = e.b;
    text = pick([
      `${bat} shows ${n} against ${bow}'s ${e.w} — ${WORD[n]}.`,
      `${WORD[n][0].toUpperCase() + WORD[n].slice(1)} taken by ${bat}, nicely placed.`,
      `Good running! ${n} run${n === 1 ? '' : 's'} added by ${bat}.`,
    ]);
  }

  if (e.pp && e.runs > 0) text += ` ⚡ Power play — doubled to ${e.runs}!`;
  if (e.free && !e.saved) text = `🆓 Free hit! ${text}`;
  const ch = chaseInfo(m);
  if (ch && m.phase === 'play' && ch.need > 0 && e.type === 'legal') text += ` (Need ${ch.need} from ${ch.ballsLeft}.)`;
  out.push({ text, tone });

  if (m.phase === 'break') {
    out.push({ tone: 'info', text: `End of innings! ${bat} finish on ${c.runs}/${c.wkts}. ${other(c.batter) && m.names[other(c.batter)]} need ${m.target} to win.` });
  } else if (m.phase === 'done') {
    const r = m.result;
    out.push({ tone: 'info', text: r.tie ? `It's a TIE! Scores are level — Super Over coming up!` : `Game over! ${m.names[r.winner]} win by ${r.by}. 🏆` });
  }
  return out;
}
