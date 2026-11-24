import { useState } from 'react';

export function CommentaryList({ feed, full = false }) {
  return (
    <div className={`com-list ${full ? 'full' : ''}`}>
      {feed.length === 0 && <p className="muted small">The match is about to begin…</p>}
      {feed.map((f, i) => (
        <div key={f.id} className={`com-line ${f.tone} ${i === 0 ? 'new' : ''}`}>
          <span className="com-ov">{f.tone === 'info' ? '★' : f.ov}</span>
          <span>{f.text}</span>
        </div>
      ))}
    </div>
  );
}

// Full list on big screens, one-line ticker + History sheet on small ones (CSS decides).
export default function CommentaryPanel({ feed }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="commentary">
      <div className="com-ticker">
        <span className="com-mic">🎙️</span>
        <span className={`com-now ${feed[0]?.tone || ''}`}>{feed[0] ? feed[0].text : 'The match is about to begin…'}</span>
        <button className="btn small" onClick={() => setOpen(true)}>History</button>
      </div>
      <div className="com-head">🎙️ Live commentary</div>
      <CommentaryList feed={feed} />
      {open && (
        <div className="modal-back" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>🎙️ Commentary</h2>
            <CommentaryList feed={feed} full />
            <button className="btn primary" onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
