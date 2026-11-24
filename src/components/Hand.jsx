// SVG hand gestures: 0 = fist, 1-4 fingers, 5 = open hand, 6 = thumbs up.
const SKIN = '#f6c796';
const SHADE = '#c98a52';

// Classic thumbs-up: fist seen from the side, thumb straight up, four curled fingers stacked in front.
function ThumbsUp() {
  const st = { fill: SKIN, stroke: SHADE, strokeWidth: 2 };
  return (
    <g>
      <rect x="22" y="54" width="62" height="58" rx="18" {...st} />
      <path d="M28 66 L28 28 Q28 12 41 12 Q54 12 54 28 L54 66 Z" {...st} />
      <path d="M34 24 Q41 18 48 24" fill="none" stroke={SHADE} strokeWidth="1.6" opacity=".55" strokeLinecap="round" />
      {[[40, 64, 44], [40, 76, 42], [40, 88, 40], [40, 100, 34]].map(([x, y, w], i) => (
        <rect key={i} x={x} y={y} width={w} height="13" rx="6.5" {...st} />
      ))}
    </g>
  );
}

export default function Hand({ n, size = 90, mirror = false, className = '' }) {
  const fingers = [
    { x: 25, h: 44 }, // index
    { x: 38, h: 54 }, // middle
    { x: 51, h: 46 }, // ring
    { x: 64, h: 36 }, // pinky
  ];
  const raised = n >= 1 && n <= 5 ? Math.min(n, 4) : 0;
  const open = n === 5;
  const thumbUp = n === 6;
  return (
    <svg
      className={`hand ${className}`}
      width={size}
      height={size * 1.2}
      viewBox="0 0 100 120"
      aria-label={`${n}`}
    >
      <g transform={mirror ? 'translate(100 0) scale(-1 1)' : undefined}>
      {open && (
        <g transform="rotate(-38 28 84)">
          <rect x="6" y="50" width="14" height="40" rx="7" fill={SKIN} stroke={SHADE} strokeWidth="2" />
        </g>
      )}
      {!thumbUp && <rect x="18" y="62" width="64" height="50" rx="20" fill={SKIN} stroke={SHADE} strokeWidth="2" />}
      {thumbUp && <ThumbsUp />}
      {!thumbUp && fingers.map((f, i) =>
        i < raised ? (
          <rect key={i} x={f.x} y={64 - f.h} width="12" height={f.h + 4} rx="6" fill={SKIN} stroke={SHADE} strokeWidth="2" />
        ) : (
          <rect key={i} x={f.x} y="52" width="12" height="22" rx="6" fill={SKIN} stroke={SHADE} strokeWidth="2" />
        )
      )}
      {!open && !thumbUp && <ellipse cx="30" cy="84" rx="13" ry="8" fill={SKIN} stroke={SHADE} strokeWidth="2" transform="rotate(-12 30 84)" />}
      </g>
    </svg>
  );
}

export const NUM_LABEL = ['Fist', 'One', 'Two', 'Three', 'Four', 'Five', 'Thumb'];
