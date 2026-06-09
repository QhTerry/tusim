// Брендовые иллюстрации для пустых состояний. Линейный стиль + градиент красный→фиолет.
// <Illustration name="events" size={132} />
function Grad({ id }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FF4D7D"/><stop offset="0.5" stopColor="#E11D54"/><stop offset="1" stopColor="#7C5CFF"/>
      </linearGradient>
    </defs>
  )
}

const SCENES = {
  // Камера + QR + искры — «создай первое событие»
  events: (id) => (<>
    <Grad id={id}/>
    <ellipse cx="60" cy="104" rx="40" ry="6" fill="#7C5CFF" opacity="0.12"/>
    <rect x="22" y="44" width="76" height="52" rx="12" fill="none" stroke={`url(#${id})`} strokeWidth="3"/>
    <path d="M40 44l5-8h30l5 8" fill="none" stroke={`url(#${id})`} strokeWidth="3" strokeLinejoin="round"/>
    <circle cx="60" cy="70" r="14" fill="none" stroke={`url(#${id})`} strokeWidth="3"/>
    <circle cx="60" cy="70" r="5" fill="#E11D54"/>
    <path d="M92 30l1.6 4.2 4.4 1.6-4.4 1.6L92 46l-1.6-4.2-4.4-1.6 4.4-1.6z" fill="#7C5CFF"/>
    <path d="M28 26l1 2.8 2.8 1-2.8 1-1 2.8-1-2.8-2.8-1 2.8-1z" fill="#FF4D7D"/>
  </>),
  // Сетка фото — «пока нет фото»
  photos: (id) => (<>
    <Grad id={id}/>
    <ellipse cx="60" cy="104" rx="38" ry="6" fill="#7C5CFF" opacity="0.12"/>
    <rect x="24" y="32" width="34" height="34" rx="8" fill="none" stroke={`url(#${id})`} strokeWidth="3"/>
    <rect x="62" y="32" width="34" height="34" rx="8" fill="none" stroke="#7C5CFF" strokeWidth="3" opacity="0.5"/>
    <rect x="24" y="70" width="34" height="26" rx="8" fill="none" stroke="#E11D54" strokeWidth="3" opacity="0.5"/>
    <rect x="62" y="70" width="34" height="26" rx="8" fill="none" stroke={`url(#${id})`} strokeWidth="3"/>
    <circle cx="33" cy="42" r="3.5" fill="#FF4D7D"/>
    <path d="M28 60l7-7 6 6 4-4 7 7" fill="none" stroke={`url(#${id})`} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round"/>
  </>),
  // Лупа — «ничего не найдено»
  search: (id) => (<>
    <Grad id={id}/>
    <ellipse cx="60" cy="104" rx="32" ry="5" fill="#7C5CFF" opacity="0.12"/>
    <circle cx="54" cy="54" r="26" fill="none" stroke={`url(#${id})`} strokeWidth="3.4"/>
    <path d="M74 74l16 16" stroke={`url(#${id})`} strokeWidth="3.4" strokeLinecap="round"/>
    <path d="M46 54h16M54 46v16" stroke="#7C5CFF" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
  </>),
  // Замок — «доступ закрыт»
  denied: (id) => (<>
    <Grad id={id}/>
    <ellipse cx="60" cy="104" rx="34" ry="5" fill="#7C5CFF" opacity="0.12"/>
    <rect x="32" y="56" width="56" height="40" rx="12" fill="none" stroke={`url(#${id})`} strokeWidth="3.4"/>
    <path d="M44 56v-8a16 16 0 0 1 32 0v8" fill="none" stroke={`url(#${id})`} strokeWidth="3.4"/>
    <circle cx="60" cy="74" r="5" fill="#E11D54"/><path d="M60 79v7" stroke="#E11D54" strokeWidth="3.4" strokeLinecap="round"/>
  </>),
}

export default function Illustration({ name, size = 128, className = '', style }) {
  const scene = SCENES[name]
  if (!scene) return null
  const gid = `ilg-${name}`
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className} style={style} aria-hidden="true">
      {scene(gid)}
    </svg>
  )
}
