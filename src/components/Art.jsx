// Illustrations drawn in SVG: stadium backdrop, logo, cricket ball and bat.
export function Stadium() {
  const crowd = Array.from({ length: 160 }, (_, i) => ({
    x: (i * 53) % 1000,
    y: 300 + ((i * 37) % 70),
    c: ['#ff6b6b', '#ffd34d', '#4dd0ff', '#fff', '#8cf5a8', '#c58bff'][i % 6],
    d: i,
  }));
  return (
    <div className="stadium" aria-hidden>
      <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#050b1d" />
            <stop offset="1" stopColor="#173a6b" />
          </linearGradient>
          <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1f7a43" />
            <stop offset="1" stopColor="#0c3d22" />
          </linearGradient>
          <radialGradient id="beam" cx="0.5" cy="0" r="1">
            <stop offset="0" stopColor="#fff6c8" stopOpacity=".6" />
            <stop offset="1" stopColor="#fff6c8" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1000" height="600" fill="url(#sky)" />
        {Array.from({ length: 50 }, (_, i) => (
          <circle key={i} cx={(i * 197) % 1000} cy={(i * 71) % 220} r={i % 3 ? 0.8 : 1.4} fill="#fff" opacity=".7" className="twinkle" style={{ animationDelay: `${(i % 7) * 0.4}s` }} />
        ))}
        {[110, 890].map((x) => (
          <g key={x}>
            <polygon points={`${x},90 ${x - 330},600 ${x + 330},600`} fill="url(#beam)" />
            <rect x={x - 3} y="80" width="6" height="230" fill="#2b3a55" />
            <rect x={x - 30} y="60" width="60" height="30" rx="4" fill="#fffbe0" />
            {[-20, -7, 7, 20].map((o) => <circle key={o} cx={x + o} cy="75" r="4" fill="#fff" />)}
          </g>
        ))}
        <path d="M0 330 Q500 240 1000 330 L1000 420 L0 420 Z" fill="#101c36" />
        {crowd.map((p) => <circle key={p.d} cx={p.x} cy={p.y} r="3" fill={p.c} opacity=".75" />)}
        <ellipse cx="500" cy="560" rx="760" ry="230" fill="url(#grass)" />
        {[0, 1, 2, 3].map((i) => <ellipse key={i} cx="500" cy="560" rx={740 - i * 150} ry={220 - i * 45} fill="none" stroke="#ffffff" strokeOpacity=".05" strokeWidth="22" />)}
        <polygon points="470,400 530,400 600,600 400,600" fill="#c9a66b" opacity=".85" />
      </svg>
    </div>
  );
}

export function Ball({ size = 60, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id="ballg" cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#ff6a6a" />
          <stop offset="1" stopColor="#a50f1f" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#ballg)" />
      <path d="M20 22 Q50 50 20 78" fill="none" stroke="#fff" strokeWidth="2.5" strokeDasharray="5 4" />
      <path d="M80 22 Q50 50 80 78" fill="none" stroke="#fff" strokeWidth="2.5" strokeDasharray="5 4" />
    </svg>
  );
}

export function Bat({ size = 90, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 100">
      <g transform="rotate(40 50 50)">
        <rect x="45" y="4" width="10" height="30" rx="4" fill="#3b2a1d" />
        <rect x="45" y="10" width="10" height="3" fill="#ffd34d" />
        <rect x="45" y="18" width="10" height="3" fill="#ffd34d" />
        <rect x="34" y="32" width="32" height="62" rx="9" fill="#e5b778" stroke="#a97a3d" strokeWidth="2" />
        <line x1="50" y1="38" x2="50" y2="88" stroke="#a97a3d" strokeWidth="1.5" opacity=".6" />
      </g>
    </svg>
  );
}

export function Logo() {
  return (
    <div className="logo">
      <Bat size={96} className="logo-bat" />
      <div className="logo-text">
        <span>HAND</span>
        <span className="gold">CRICKET</span>
      </div>
      <Ball size={64} className="logo-ball" />
    </div>
  );
}
