// Original SVG ornaments. All use currentColor (= template accent).

const deg = (a) => (a * Math.PI) / 180

/** Ornate corners — placed at the four corners of the page. */
export function Corners() {
  const corner = (
    <svg viewBox="0 0 100 100">
      <path d="M4 98 V34 Q4 4 34 4 H98" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M14 98 V40 Q14 14 40 14 H98" fill="none" stroke="currentColor" strokeWidth="0.9" />
      <circle cx="26" cy="26" r="5.5" fill="currentColor" />
      <circle cx="26" cy="26" r="9.5" fill="none" stroke="currentColor" strokeWidth="0.9" />
      <path d="M26 40 C20 52 32 58 26 70" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M40 26 C52 20 58 32 70 26" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M26 74 l-3 5 l3 5 l3 -5 z M74 26 l5 -3 l5 3 l-5 3 z" fill="currentColor" />
    </svg>
  )
  return (
    <div className="corners" aria-hidden>
      {['tl', 'tr', 'br', 'bl'].map((c) => (
        <div key={c} className={`corner ${c}`}>{corner}</div>
      ))}
    </div>
  )
}

function bez(t, p0, p1, p2, p3) {
  const u = 1 - t
  const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]
  const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
  const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0])
  const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1])
  return { x, y, a: (Math.atan2(dy, dx) * 180) / Math.PI }
}

function Flower({ x, y, r = 6 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy={-r} rx={r * 0.55} ry={r} transform={`rotate(${a})`} opacity="0.55" fill="currentColor" />
      ))}
      <circle r={r * 0.4} fill="currentColor" />
    </g>
  )
}

/** Leafy branch with small flowers — used in two opposite corners. */
export function Branch({ className }) {
  const P = [[8, 212], [40, 120], [110, 50], [212, 10]]
  const leaves = []
  for (let i = 0; i < 13; i++) {
    const t = 0.07 + i * 0.068
    const { x, y, a } = bez(t, ...P)
    const side = i % 2 ? 1 : -1
    const n = deg(a + 90 * side)
    const s = 1 - t * 0.35
    leaves.push(
      <ellipse
        key={i}
        cx={x + Math.cos(n) * 9 * s}
        cy={y + Math.sin(n) * 9 * s}
        rx={14 * s}
        ry={5 * s}
        transform={`rotate(${a + 38 * side} ${x + Math.cos(n) * 9 * s} ${y + Math.sin(n) * 9 * s})`}
        fill="currentColor"
        opacity={0.75}
      />,
    )
  }
  const end = bez(1, ...P)
  const mid = bez(0.45, ...P)
  return (
    <svg className={className} viewBox="0 0 230 230" aria-hidden>
      <path d={`M${P[0]} C${P[1]} ${P[2]} ${P[3]}`} fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d={`M${mid.x} ${mid.y} Q ${mid.x + 40} ${mid.y + 10} ${mid.x + 62} ${mid.y + 40}`} fill="none" stroke="currentColor" strokeWidth="1.1" />
      {leaves}
      <Flower x={end.x} y={end.y} r={8} />
      <Flower x={mid.x + 62} y={mid.y + 40} r={6} />
      <Flower x={bez(0.2, ...P).x + 26} y={bez(0.2, ...P).y - 8} r={4.5} />
    </svg>
  )
}

/** Laurel / olive wreath, open at the top — surrounds the photo. */
export function Wreath() {
  const cx = 100, cy = 100, r = 88
  const pt = (a, rr = r) => [cx + Math.cos(deg(a)) * rr, cy + Math.sin(deg(a)) * rr]
  const leaves = []
  for (let i = 0; i < 15; i++) {
    const a = 98 + i * 10.5
    const out = i % 2 ? 7 : -7
    const [x, y] = pt(a, r + out)
    leaves.push(
      <ellipse key={i} cx={x} cy={y} rx="11" ry="4.2" fill="currentColor" opacity="0.85"
        transform={`rotate(${a + 90 + (out > 0 ? -30 : 30)} ${x} ${y})`} />,
    )
  }
  const [sx, sy] = pt(94)
  const [ex, ey] = pt(258)
  const half = (
    <g>
      <path d={`M${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`} fill="none" stroke="currentColor" strokeWidth="1.4" />
      {leaves}
      <circle cx={pt(150, r - 12)[0]} cy={pt(150, r - 12)[1]} r="2.8" fill="currentColor" />
      <circle cx={pt(205, r + 13)[0]} cy={pt(205, r + 13)[1]} r="2.8" fill="currentColor" />
    </g>
  )
  return (
    <svg className="wreath" viewBox="0 0 200 200" aria-hidden>
      {half}
      <g transform="translate(200 0) scale(-1 1)">{half}</g>
    </svg>
  )
}

/** Lit candle with soft glow. */
export function Candle() {
  return (
    <svg className="candle" viewBox="0 0 60 120" aria-hidden>
      <defs>
        <radialGradient id="cglow">
          <stop offset="0" stopColor="#ffd27a" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cflame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#e47d24" />
          <stop offset="0.55" stopColor="#ffc94d" />
          <stop offset="1" stopColor="#fff6cf" />
        </linearGradient>
      </defs>
      <circle cx="30" cy="27" r="27" fill="url(#cglow)" />
      <path d="M30 6 C39 20 39 33 30 40 C21 33 21 20 30 6 Z" fill="url(#cflame)" />
      <path d="M30 24 C33 30 33 35 30 38 C27 35 27 30 30 24 Z" fill="#fff" opacity="0.7" />
      <line x1="30" y1="39" x2="30" y2="46" stroke="#3a2c1c" strokeWidth="1.6" />
      <path d="M19 47 Q30 43 41 47 V114 Q30 118 19 114 Z" fill="#f4e8cf" stroke="currentColor" strokeWidth="1.4" />
      <path d="M25 47 q1 10 -2 16" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  )
}

/** Shown in template thumbnails when no photo has been uploaded yet. */
export function PhotoPlaceholder() {
  return (
    <svg className="placeholder" viewBox="0 0 100 130" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="100" height="130" fill="#b9b6b1" />
      <circle cx="50" cy="52" r="20" fill="#8e8a84" />
      <path d="M12 130 C14 96 34 84 50 84 C66 84 86 96 88 130 Z" fill="#8e8a84" />
    </svg>
  )
}
