// Единый набор иконок tusi'm. Stroke-стиль, 24×24, наследует цвет (currentColor).
// Использование: <Icon name="camera" size={20} />
const ICONS = {
  camera: (<><path d="M3 9a2 2 0 0 1 2-2h1.5l1.2-1.8a1 1 0 0 1 .8-.4h7a1 1 0 0 1 .8.4L18.5 7H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.2"/></>),
  image: (<><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16l-5-5L5 21"/></>),
  images: (<><rect x="7" y="3" width="14" height="14" rx="3"/><circle cx="11.5" cy="7.5" r="1.4"/><path d="M21 12l-4-4-6 6"/><path d="M3 8v11a2 2 0 0 0 2 2h11"/></>),
  user: (<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></>),
  users: (<><circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.4 3-5.5 6.5-5.5s6.5 2.1 6.5 5.5"/><path d="M16 4.2A3.4 3.4 0 0 1 16 11"/><path d="M17.5 14.6c2.7.5 4.5 2.3 4.5 5.4"/></>),
  calendar: (<><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 9h18M8 3v4M16 3v4"/></>),
  clock: (<><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></>),
  qr: (<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><path d="M14 14h3v3M21 14v.01M14 21h3M21 18v3M19.5 19.5v.01"/></>),
  link: (<><path d="M9 15l6-6"/><path d="M11 6.5l1.2-1.2a4 4 0 0 1 5.7 5.7L16.5 12"/><path d="M13 17.5l-1.2 1.2a4 4 0 0 1-5.7-5.7L7.5 12"/></>),
  copy: (<><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2"/></>),
  download: (<><path d="M12 3v12"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M4 19h16"/></>),
  upload: (<><path d="M12 21V9"/><path d="M7.5 13.5L12 9l4.5 4.5"/><path d="M4 5h16"/></>),
  search: (<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></>),
  x: (<path d="M6 6l12 12M18 6L6 18"/>),
  check: (<path d="M5 12.5l4.5 4.5L19 7.5"/>),
  plus: (<path d="M12 5v14M5 12h14"/>),
  trash: (<><path d="M4 7h16"/><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2"/><path d="M6.5 7l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12"/></>),
  chevronRight: (<path d="M9 5l7 7-7 7"/>),
  chevronLeft: (<path d="M15 5l-7 7 7 7"/>),
  chevronDown: (<path d="M5 9l7 7 7-7"/>),
  arrowRight: (<><path d="M4 12h15"/><path d="M13 5l7 7-7 7"/></>),
  arrowLeft: (<><path d="M20 12H5"/><path d="M11 5l-7 7 7 7"/></>),
  heart: (<path d="M12 20s-7-4.3-9.2-8.5C1.4 9 2.4 5.5 5.6 5c1.9-.3 3.5.7 4.4 2 .9-1.3 2.5-2.3 4.4-2 3.2.5 4.2 4 2.8 6.5C19 15.7 12 20 12 20z"/>),
  flame: (<path d="M12 3c2.5 3 5.5 5 5.5 9a5.5 5.5 0 0 1-11 0c0-1.6.7-2.8 1.5-3.7.2 1.2 1 2 2 2 .3-3 .5-5.3 2-7.3z"/>),
  star: (<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>),
  sparkles: (<><path d="M12 4l1.4 3.6L17 9l-3.6 1.4L12 14l-1.4-3.6L7 9l3.6-1.4z"/><path d="M18 14l.7 1.8L20.5 16.5l-1.8.7L18 19l-.7-1.8L15.5 16.5l1.8-.7z"/></>),
  settings: (<><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.2-1.3L13.9 2h-3.8l-.4 2.5a7 7 0 0 0-2.2 1.3l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .9.1 1.3l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.2 1.3l.4 2.5h3.8l.4-2.5a7 7 0 0 0 2.2-1.3l2.3 1 2-3.4-2-1.5c.1-.4.1-.9.1-1.3z"/></>),
  sliders: (<><path d="M4 8h10M18 8h2M4 16h2M10 16h10"/><circle cx="16" cy="8" r="2"/><circle cx="8" cy="16" r="2"/></>),
  logout: (<><path d="M14 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M9 12h11"/><path d="M16 8l4 4-4 4"/></>),
  share: (<><circle cx="6" cy="12" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="M8.3 10.8l6.4-3.6M8.3 13.2l6.4 3.6"/></>),
  bolt: (<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>),
  eye: (<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></>),
  refresh: (<><path d="M20 11a8 8 0 0 0-14-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14 4.5L20 16"/><path d="M20 20v-4h-4"/></>),
  party: (<><path d="M3 21l5.5-14 8.5 8.5z"/><path d="M14 3c1.5 0 2 1 2 2M19 8c1 0 1.5.5 1.5 1.5M18 4l1-1M21 7l1-1M15 9l6 6"/></>),
  grid: (<><rect x="3" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8"/></>),
  lock: (<><rect x="4.5" y="10" width="15" height="10" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>),
  send: (<path d="M21 4L3 11l6 2.5L11 20l3.5-6L21 4z"/>),
  play: (<path d="M7 5l12 7-12 7z"/>),
  stop: (<rect x="6" y="6" width="12" height="12" rx="3"/>),
}

export default function Icon({ name, size = 20, stroke = 1.8, className = '', style }) {
  const inner = ICONS[name]
  if (!inner) return null
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style} aria-hidden="true">
      {inner}
    </svg>
  )
}
