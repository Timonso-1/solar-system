const RX = 26;
const RY = 17;
const C = Math.sqrt(RX * RX - RY * RY);

export function LogoMark({ size = 36, animated = false }: { size?: number; animated?: boolean }) {
  const orbit = `M ${32 - RX} 32 A ${RX} ${RY} 0 1 1 ${32 + RX} 32 A ${RX} ${RY} 0 1 1 ${32 - RX} 32`;
  return (
    <svg
      className={`logo-mark${animated ? " logo-mark--animated" : ""}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Perihel"
    >
      <defs>
        <radialGradient id="logo-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff4d6" />
          <stop offset="55%" stopColor="#e9c27a" />
          <stop offset="100%" stopColor="#b8873c" />
        </radialGradient>
      </defs>
      <g transform="rotate(-24 32 32)">
        <path className="logo-mark__orbit" d={orbit} fill="none" stroke="currentColor" strokeWidth="1.6" pathLength={100} />
        <line
          className="logo-mark__axis"
          x1={32 - RX - 3}
          y1="32"
          x2={32 + RX + 3}
          y2="32"
          stroke="currentColor"
          strokeWidth="0.6"
          strokeDasharray="1.5 2.5"
          opacity="0.55"
        />
        <circle cx={32 - C} cy="32" r="5.2" fill="url(#logo-sun)" />
        <circle className="logo-mark__planet" cx={32 - RX} cy="32" r="2.6" fill="#7fd3c4" />
      </g>
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`wordmark ${className}`}>Perihel</span>;
}
