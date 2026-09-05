/**
 * The DeskFlow person (same figure as the logo), articulated and animated.
 *
 * Skeleton (viewBox 0 0 120 120, feet on y≈108):
 *   head  – circle at hip-relative position
 *   torso – hips (60,70) → shoulders (60,42)
 *   arms  – pivot at shoulders, upper arm 14, forearm 13
 *   legs  – pivot at hips, thigh 20, shin 20
 * Each move is a CSS keyframe set on the limb groups, so animations are
 * crisp at any size, cost nothing to download, and match the logo exactly.
 * The same component renders the frames for the exported GIFs.
 */
const MOVES = [
  'handsup', 'squat', 'sidebend', 'neck', 'shoulders', 'lunge', 'fold', 'march', 'calf', 'wrist', 'eyes', 'walk', 'reach', 'stand', 'lookup', 'sit', 'palms',
]

export default function StretchFigure({ pose = 'reach', size = 160, className = '' }) {
  const move = MOVES.includes(pose) ? pose : 'reach'
  return (
    <svg
      className={`figure fig-${move} ${className}`}
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <g className="body">
        {/* legs: pivot at hips (60,70) */}
        <g className="leg leg-l">
          <path className="thigh" d="M60 70 L60 90" />
          <g className="shin-g" style={{ transformOrigin: '60px 90px' }}>
            <path className="shin" d="M60 90 L60 108" />
          </g>
        </g>
        <g className="leg leg-r">
          <path className="thigh" d="M60 70 L60 90" />
          <g className="shin-g" style={{ transformOrigin: '60px 90px' }}>
            <path className="shin" d="M60 90 L60 108" />
          </g>
        </g>
        {/* torso + head + arms move together for bends */}
        <g className="upper" style={{ transformOrigin: '60px 70px' }}>
          <path className="torso" d="M60 70 L60 42" />
          <g className="head-g" style={{ transformOrigin: '60px 42px' }}>
            <circle className="head" cx="60" cy="30" r="8" />
          </g>
          <g className="arm arm-l" style={{ transformOrigin: '60px 44px' }}>
            <path d="M60 44 L60 58" />
            <g className="fore-g" style={{ transformOrigin: '60px 58px' }}>
              <path d="M60 58 L60 71" />
            </g>
          </g>
          <g className="arm arm-r" style={{ transformOrigin: '60px 44px' }}>
            <path d="M60 44 L60 58" />
            <g className="fore-g" style={{ transformOrigin: '60px 58px' }}>
              <path d="M60 58 L60 71" />
            </g>
          </g>
        </g>
      </g>
      {move === 'eyes' && <circle className="target" cx="106" cy="18" r="4" />}
      {move === 'lookup' && <circle className="target" cx="60" cy="8" r="3" />}
      {move === 'sit' && <path className="seat" d="M38 84h44M44 84v24M76 84v24" strokeWidth="4" opacity="0.45" />}
    </svg>
  )
}

export { MOVES }
