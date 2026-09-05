/**
 * Lightweight animated SVG stick figure — one pose per stretch.
 * Replaces AI video clips (Seedance) until real clips are dropped into
 * public/videos/<pose>.mp4 — see README. Zero bytes to download, works offline.
 */
const POSES = {
  reach: (
    <g className="pose pose-reach">
      <circle cx="60" cy="22" r="9" />
      <path d="M60 31v40M60 44l-22-20M60 44l22-20M60 71l-14 34M60 71l14 34" />
    </g>
  ),
  neck: (
    <g className="pose pose-neck">
      <g className="head"><circle cx="60" cy="22" r="9" /></g>
      <path d="M60 31v40M60 44l-18 16M60 44l18 16M60 71l-14 34M60 71l14 34" />
    </g>
  ),
  shoulders: (
    <g className="pose pose-shoulders">
      <circle cx="60" cy="22" r="9" />
      <path d="M60 31v40M60 71l-14 34M60 71l14 34" />
      <path className="arm l" d="M60 44l-16 12 4 16" />
      <path className="arm r" d="M60 44l16 12-4 16" />
    </g>
  ),
  lunge: (
    <g className="pose pose-lunge">
      <circle cx="52" cy="22" r="9" />
      <path d="M52 31l4 38M54 44l-16 14M54 44l16 10M56 69l24 4 4 30M56 69l-16 22-2 14" />
    </g>
  ),
  fold: (
    <g className="pose pose-fold">
      <circle cx="30" cy="62" r="9" />
      <path d="M38 66c14-8 24-6 30 6v33M44 68l-6 30M50 70l-4 30M68 72l-8 33M68 72l8 33" />
    </g>
  ),
  eyes: (
    <g className="pose pose-eyes">
      <circle cx="60" cy="24" r="10" />
      <circle className="eye" cx="56" cy="23" r="1.6" fill="currentColor" />
      <circle className="eye" cx="64" cy="23" r="1.6" fill="currentColor" />
      <path d="M60 34v36M60 46l-20 8M60 46l20 8M60 70l-12 34M60 70l12 34" />
      <circle className="target" cx="104" cy="16" r="5" />
    </g>
  ),
  wrist: (
    <g className="pose pose-wrist">
      <circle cx="56" cy="22" r="9" />
      <path d="M56 31v40M56 71l-14 34M56 71l14 34M56 44l-16 14" />
      <path className="arm r" d="M56 44h34" />
      <path className="hand" d="M90 44l-4-8M90 44l6-7" />
    </g>
  ),
  walk: (
    <g className="pose pose-walk">
      <circle cx="60" cy="22" r="9" />
      <path d="M60 31v40" />
      <path className="leg l" d="M60 71l-16 30" />
      <path className="leg r" d="M60 71l16 30" />
      <path className="arm l" d="M60 44l-14 18" />
      <path className="arm r" d="M60 44l14 18" />
    </g>
  ),
  stand: (
    <g className="pose pose-reach">
      <circle cx="60" cy="22" r="9" />
      <path d="M60 31v40M60 44l-22-20M60 44l22-20M60 71l-14 34M60 71l14 34" />
    </g>
  ),
}

export default function StretchFigure({ pose = 'reach', size = 160, className = '' }) {
  return (
    <svg
      className={`figure ${className}`}
      viewBox="0 0 120 110"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {POSES[pose] ?? POSES.reach}
    </svg>
  )
}
