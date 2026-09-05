/**
 * DeskFlow icon set — drawn in the same language as the logo:
 * 24×24 grid, round caps, 2.2 stroke, no fills except the head dot.
 */
const paths = {
  // the logo person, arms up
  move: (
    <>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M12 7.5v6M12 10l-4-3M12 10l4-3M12 13.5l-3 6M12 13.5l3 6" />
    </>
  ),
  water: <path d="M12 3.5c3.2 4 5.5 7 5.5 10a5.5 5.5 0 0 1-11 0c0-3 2.3-6 5.5-10zM9.5 14.5a2.5 2.5 0 0 0 2 2.3" />,
  focus: (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9v4l2.5 2M9.5 3h5M12 3v2.5" />
    </>
  ),
  progress: <path d="M4 20V11M10 20V5M16 20v-6M22 20H2" />,
  tip: (
    <>
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1.2.9 2V16h5.2v-.1c0-.8.3-1.5.9-2A6 6 0 0 0 12 3z" />
    </>
  ),
  streak: <path d="M12 3s5 4.5 5 9.5A5 5 0 0 1 7 12.5c0-1.5.5-2.7 1.2-3.7.3 1.2 1 2 2 2.2C10 8 10.5 5.5 12 3zM12 21a2.6 2.6 0 0 1-2.6-2.6c0-1.6 1.6-2.6 2.6-4 1 1.4 2.6 2.4 2.6 4A2.6 2.6 0 0 1 12 21z" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </>
  ),
  bell: <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  install: <path d="M12 3v11M7.5 9.5L12 14l4.5-4.5M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" />,
  home: <path d="M3.5 11.5L12 4l8.5 7.5M6 10v10h12V10" />,
  alert: <path d="M12 3.5l9.5 16.5h-19zM12 10v4.5M12 17.2v.3" />,
  pause: <path d="M8 5v14M16 5v14" />,
  play: <path d="M7 4.5v15l12-7.5z" />,
  next: <path d="M6 4.5v15l10-7.5zM19 4.5v15" />,
  // mind: head with a calm wave (breath) inside
  mind: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M7.5 12.5c1.5-2 3-2 4.5 0s3 2 4.5 0" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </>
  ),
  dot: <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />,
}

export default function Icon({ name, size = 20, className = '', title }) {
  return (
    <svg
      className={`icon icon-${name} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {paths[name] ?? paths.dot}
    </svg>
  )
}
