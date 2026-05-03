'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const DOMAIN = 'https://tusim.vercel.app'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Onest:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #111113; min-height: 100%; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-8px); }
    40%       { transform: translateX(8px); }
    60%       { transform: translateX(-5px); }
    80%       { transform: translateX(5px); }
  }

  .fade-up  { animation: fadeUp  0.45s cubic-bezier(.22,1,.36,1) both; }
  .fade-in  { animation: fadeIn  0.3s ease both; }
  .shake    { animation: shake   0.4s ease; }

  /* ── Inputs ── */
  .admin-input {
    width: 100%; padding: 14px 18px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; color: #F0F0F0;
    font-family: 'Onest', sans-serif; font-size: 15px;
    outline: none; transition: border-color 0.2s, background 0.2s;
    -webkit-appearance: none;
  }
  .admin-input:focus {
    border-color: rgba(195,7,63,0.5);
    background: rgba(195,7,63,0.03);
  }
  .admin-input::placeholder { color: #333; }
  .admin-input.error { border-color: rgba(195,7,63,0.6); }

  .admin-input-sm {
    width: 100%; padding: 11px 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px; color: #F0F0F0;
    font-family: 'Onest', sans-serif; font-size: 14px;
    outline: none; transition: border-color 0.2s;
  }
  .admin-input-sm:focus { border-color: rgba(195,7,63,0.4); }
  .admin-input-sm::placeholder { color: #2a2a2a; }

  /* ── Buttons ── */
  .btn-red {
    background: linear-gradient(135deg, #C3073F, #950740);
    color: #fff; border: none; border-radius: 12px;
    font-family: 'Onest', sans-serif; font-weight: 700;
    font-size: 15px; padding: 14px 28px; cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
    white-space: nowrap; -webkit-tap-highlight-color: transparent;
  }
  .btn-red:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 6px 24px rgba(195,7,63,0.35);
  }
  .btn-red:active:not(:disabled) { transform: scale(0.98); }
  .btn-red:disabled { background: #222; color: #444; cursor: not-allowed; }

  .btn-ghost {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    color: #666; border-radius: 10px;
    font-family: 'Onest', sans-serif; font-size: 13px;
    padding: 9px 16px; cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
    white-space: nowrap;
  }
  .btn-ghost:hover { border-color: rgba(255,255,255,0.2); color: #999; }

  .btn-icon {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    color: #555; border-radius: 8px;
    font-family: 'Onest', sans-serif; font-size: 12px;
    padding: 7px 12px; cursor: pointer;
    transition: background 0.15s, color 0.15s;
    display: flex; align-items: center; gap: '6px';
  }
  .btn-icon:hover { background: rgba(255,255,255,0.07); color: #888; }

  /* ── Cards ── */
  .section-card {
    background: #161618;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px; padding: 24px;
    margin-bottom: '20px';
  }

  .event-card {
    background: #161618;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px; padding: 14px 18px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
  }
  .event-card:hover { border-color: rgba(195,7,63,0.3); }
  .event-card.active {
    border-color: #C3073F;
    background: rgba(195,7,63,0.06);
  }

  /* ── Photo grid ── */
  .photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 6px;
  }
  .photo-thumb {
    width: 100%; aspect-ratio: 1;
    object-fit: cover; border-radius: 10px;
    transition: opacity 0.2s, transform 0.2s;
    cursor: pointer;
  }
  .photo-thumb:hover { opacity: 0.85; transform: scale(1.03); }

  /* ── Section label ── */
  .section-label {
    font-size: 11px; color: #333;
    text-transform: uppercase; letter-spacing: 0.1em;
    font-weight: 600; margin-bottom: 14px;
  }

  /* ── Tab ── */
  .tab {
    padding: 8px 16px; border-radius: 8px;
    font-family: 'Onest', sans-serif; font-size: 13px;
    font-weight: 600; cursor: pointer;
    border: none; transition: background 0.15s, color 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .tab.active {
    background: rgba(195,7,63,0.15);
    color: #C3073F;
  }
  .tab:not(.active) {
    background: transparent; color: #444;
  }
  .tab:not(.active):hover { color: #666; }

  /* ── Sidebar scroll ── */
  .sidebar {
    overflow-y: auto;
    max-height: calc(100vh - 300px);
    scrollbar-width: thin;
    scrollbar-color: #2a2a2a transparent;
  }
  .sidebar::-webkit-scrollbar { width: 4px; }
  .sidebar::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }
`

// ─────────────────────────────────────────────
//  Экран логина
// ─────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [login, setLogin]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [shake, setShake]       = useState(false)

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!login.trim() || !password.trim()) return
    setLoading(true)
    setError('')

    const res  = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    })
    const data = await res.json()

    if (data.ok) {
      sessionStorage.setItem('tusim_admin', '1')
      onLogin()
    } else {
      setError(data.error || 'Ошибка')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
    setLoading(false)
  }

  return (
    <main style={{
      minHeight: '100dvh', background: '#111113',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'Onest', sans-serif",
    }}>
      {/* Декор */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(195,7,63,0.08) 0%, transparent 60%)',
      }}/>

      <div className="fade-up" style={{ width: '100%', maxWidth: '360px' }}>
        {/* Лого */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #C3073F, #6F2232)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(195,7,63,0.3)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7-10h-3l-2-2H10L8 5.5H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2v-11a2 2 0 00-2-2z" fill="white"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: "'Unbounded', sans-serif", fontWeight: 900,
            fontSize: '22px', letterSpacing: '-0.5px', color: '#F0F0F0',
          }}>
            tusi<span style={{ color: '#C3073F' }}>'m</span>
          </h1>
          <p style={{ color: '#333', fontSize: '13px', marginTop: '6px' }}>
            Панель организатора
          </p>
        </div>

        {/* Форма */}
        <div className={shake ? 'shake' : ''} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            className={`admin-input ${error ? 'error' : ''}`}
            placeholder="Логин"
            value={login}
            onChange={e => setLogin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoComplete="username"
            autoFocus
          />
          <input
            className={`admin-input ${error ? 'error' : ''}`}
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoComplete="current-password"
          />

          {error && (
            <div style={{
              color: '#C3073F', fontSize: '13px',
              textAlign: 'center', padding: '4px 0',
            }}>
              {error}
            </div>
          )}

          <button
            className="btn-red"
            onClick={handleSubmit}
            disabled={loading || !login.trim() || !password.trim()}
            style={{ marginTop: '4px', width: '100%', padding: '16px' }}
          >
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </div>
      </div>
    </main>
  )
}

// ─────────────────────────────────────────────
//  Главная панель
// ─────────────────────────────────────────────
function AdminPanel({ onLogout }) {
  const [events, setEvents]           = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [photos, setPhotos]           = useState([])
  const [tab, setTab]                 = useState('photos') // 'photos' | 'settings'

  // Создание события
  const [eventName, setEventName]     = useState('')
  const [photoLimit, setPhotoLimit]   = useState(30)
  const [creating, setCreating]       = useState(false)

  // Лайтбокс
  const [lightbox, setLightbox]       = useState(null)

  // Копирование ссылки
  const [copied, setCopied]           = useState(false)

  useEffect(() => { loadEvents() }, [])

  useEffect(() => {
    if (!selectedEvent) return
    loadPhotos(selectedEvent.id)

    const channel = supabase
      .channel(`admin-photos-${selectedEvent.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'photos',
        filter: `event_id=eq.${selectedEvent.id}`,
      }, payload => setPhotos(prev => [payload.new, ...prev]))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [selectedEvent])

  async function loadEvents() {
    const { data } = await supabase
      .from('events').select('*')
      .order('created_at', { ascending: false })
    if (data) setEvents(data)
  }

  async function loadPhotos(eventId) {
    const { data } = await supabase
      .from('photos').select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    if (data) setPhotos(data)
  }

  async function createEvent() {
    if (!eventName.trim()) return
    setCreating(true)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data } = await supabase
      .from('events')
      .insert({ name: eventName.trim(), code, photo_limit: photoLimit })
      .select().single()
    if (data) {
      setEvents(prev => [data, ...prev])
      setEventName('')
      setPhotoLimit(30)
      setSelectedEvent(data)
    }
    setCreating(false)
  }

  function copyLink() {
    if (!selectedEvent) return
    navigator.clipboard.writeText(`${DOMAIN}/event/${selectedEvent.code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const eventLink = selectedEvent ? `${DOMAIN}/event/${selectedEvent.code}` : ''
  const guestCount = new Set(photos.map(p => p.device_id)).size

  return (
    <main style={{
      minHeight: '100dvh', background: '#111113',
      color: '#F0F0F0', fontFamily: "'Onest', sans-serif",
    }}>

      {/* ── Шапка ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(17,17,19,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '0 28px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: '60px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #C3073F, #6F2232)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7-10h-3l-2-2H10L8 5.5H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2v-11a2 2 0 00-2-2z" fill="white"/>
            </svg>
          </div>
          <span style={{
            fontFamily: "'Unbounded', sans-serif", fontWeight: 900,
            fontSize: '16px', letterSpacing: '-0.5px',
          }}>
            tusi<span style={{ color: '#C3073F' }}>'m</span>
          </span>
          <span style={{
            fontSize: '11px', color: '#333',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '6px', padding: '3px 8px',
          }}>
            admin
          </span>
        </div>

        <button className="btn-ghost" onClick={onLogout} style={{ fontSize: '12px', padding: '7px 14px' }}>
          Выйти
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '0',
        minHeight: 'calc(100dvh - 60px)',
      }}>

        {/* ── Сайдбар ── */}
        <div style={{
          borderRight: '1px solid rgba(255,255,255,0.05)',
          padding: '24px 20px',
          display: 'flex', flexDirection: 'column', gap: '20px',
        }}>

          {/* Создать событие */}
          <div>
            <div className="section-label">Новое мероприятие</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                className="admin-input-sm"
                placeholder="Название события"
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createEvent()}
              />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#333', marginBottom: '6px' }}>
                    Лимит кадров на гостя
                  </div>
                  <input
                    className="admin-input-sm"
                    type="number"
                    min="1" max="200"
                    value={photoLimit}
                    onChange={e => setPhotoLimit(Number(e.target.value))}
                    style={{ textAlign: 'center' }}
                  />
                </div>
              </div>
              <button
                className="btn-red"
                onClick={createEvent}
                disabled={creating || !eventName.trim()}
                style={{ fontSize: '13px', padding: '12px' }}
              >
                {creating ? 'Создаём...' : '+ Создать'}
              </button>
            </div>
          </div>

          {/* Список событий */}
          {events.length > 0 && (
            <div style={{ flex: 1 }}>
              <div className="section-label">
                Мероприятия
                <span style={{ marginLeft: '8px', color: '#2a2a2a' }}>({events.length})</span>
              </div>
              <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {events.map(event => (
                  <div
                    key={event.id}
                    className={`event-card ${selectedEvent?.id === event.id ? 'active' : ''}`}
                    onClick={() => { setSelectedEvent(event); setTab('photos') }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '5px', color: '#F0F0F0' }}>
                      {event.name}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '11px', color: '#C3073F',
                        fontFamily: 'monospace', fontWeight: 700,
                        background: 'rgba(195,7,63,0.1)',
                        padding: '2px 7px', borderRadius: '5px',
                      }}>
                        {event.code}
                      </span>
                      <span style={{ fontSize: '11px', color: '#333' }}>
                        лимит: {event.photo_limit || 30}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {events.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '32px 0',
              color: '#2a2a2a', fontSize: '13px', lineHeight: 1.7,
            }}>
              Нет мероприятий<br/>Создай первое ↑
            </div>
          )}
        </div>

        {/* ── Правая часть ── */}
        <div style={{ padding: '24px 28px' }}>
          {!selectedEvent ? (
            <div style={{
              height: '100%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '14px',
              color: '#2a2a2a',
            }}>
              <div style={{ fontSize: '48px' }}>←</div>
              <div style={{ fontSize: '14px' }}>Выбери мероприятие</div>
            </div>
          ) : (
            <div className="fade-in">

              {/* Заголовок события */}
              <div style={{
                display: 'flex', alignItems: 'flex-start',
                justifyContent: 'space-between', marginBottom: '24px',
                flexWrap: 'wrap', gap: '12px',
              }}>
                <div>
                  <h2 style={{
                    fontFamily: "'Unbounded', sans-serif", fontWeight: 900,
                    fontSize: '20px', letterSpacing: '-0.5px', marginBottom: '6px',
                  }}>
                    {selectedEvent.name}
                  </h2>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#333' }}>
                      {photos.length} фото
                    </span>
                    <span style={{ fontSize: '12px', color: '#333' }}>
                      {guestCount} гостей
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#C3073F' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C3073F', display: 'inline-block', animation: 'pulse 1.5s infinite' }}/>
                      live
                    </span>
                  </div>
                </div>

                {/* Быстрые действия */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button className="btn-ghost" onClick={copyLink} style={{ fontSize: '12px' }}>
                    {copied ? '✓ Скопировано' : '🔗 Копировать ссылку'}
                  </button>
                  <a
                    href={`/album?event_id=${selectedEvent.id}`}
                    target="_blank"
                    style={{ textDecoration: 'none' }}
                  >
                    <button className="btn-ghost" style={{ fontSize: '12px' }}>
                      📁 Открыть альбом
                    </button>
                  </a>
                  <a
                    href={`/live?event_id=${selectedEvent.id}`}
                    target="_blank"
                    style={{ textDecoration: 'none' }}
                  >
                    <button className="btn-ghost" style={{ fontSize: '12px' }}>
                      📺 Live экран
                    </button>
                  </a>
                </div>
              </div>

              {/* Ссылка для гостей */}
              <div style={{
                background: 'rgba(195,7,63,0.05)',
                border: '1px solid rgba(195,7,63,0.15)',
                borderRadius: '14px', padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: '12px',
                flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#C3073F', marginBottom: '4px', fontWeight: 600, letterSpacing: '0.05em' }}>
                    ССЫЛКА ДЛЯ ГОСТЕЙ
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '14px', color: '#888', wordBreak: 'break-all' }}>
                    {eventLink}
                  </div>
                </div>
                <button className="btn-red" onClick={copyLink} style={{ fontSize: '13px', padding: '10px 18px', flexShrink: 0 }}>
                  {copied ? '✓' : 'Копировать'}
                </button>
              </div>

              {/* Табы */}
              <div style={{
                display: 'flex', gap: '4px', marginBottom: '20px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px', padding: '4px',
                width: 'fit-content',
              }}>
                <button className={`tab ${tab === 'photos' ? 'active' : ''}`} onClick={() => setTab('photos')}>
                  Фото ({photos.length})
                </button>
                <button className={`tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
                  Настройки
                </button>
              </div>

              {/* ── Вкладка: Фото ── */}
              {tab === 'photos' && (
                <div>
                  {photos.length === 0 ? (
                    <div style={{
                      textAlign: 'center', padding: '60px 0',
                      color: '#2a2a2a', fontSize: '14px', lineHeight: 1.7,
                    }}>
                      <div style={{ fontSize: '36px', marginBottom: '12px' }}>📸</div>
                      Пока нет фото — жди гостей
                    </div>
                  ) : (
                    <div className="photo-grid">
                      {photos.map((photo, i) => (
                        <div key={photo.id || i} style={{ position: 'relative' }}>
                          <img
                            src={photo.url}
                            className="photo-thumb"
                            onClick={() => setLightbox(photo)}
                            title={photo.author || 'Гость'}
                          />
                          {photo.votes > 0 && (
                            <div style={{
                              position: 'absolute', top: '4px', right: '4px',
                              background: 'rgba(0,0,0,0.7)', borderRadius: '6px',
                              padding: '2px 6px', fontSize: '10px', color: '#C3073F',
                              fontWeight: 700,
                            }}>
                              ❤️{photo.votes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Вкладка: Настройки ── */}
              {tab === 'settings' && (
                <div style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  <div style={{
                    background: '#161618',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '16px', padding: '20px',
                  }}>
                    <div className="section-label">Параметры события</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                      <div>
                        <div style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>
                          Код события
                        </div>
                        <div style={{
                          fontFamily: 'monospace', fontSize: '20px',
                          fontWeight: 700, color: '#C3073F',
                          letterSpacing: '0.1em',
                        }}>
                          {selectedEvent.code}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>
                          Лимит кадров на гостя
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input
                            className="admin-input-sm"
                            type="number"
                            min="1" max="200"
                            defaultValue={selectedEvent.photo_limit || 30}
                            style={{ maxWidth: '100px', textAlign: 'center' }}
                            id="limit-input"
                          />
                          <button
                            className="btn-red"
                            style={{ fontSize: '13px', padding: '10px 18px' }}
                            onClick={async () => {
                              const val = Number(document.getElementById('limit-input').value)
                              if (!val || val < 1) return
                              await supabase
                                .from('events')
                                .update({ photo_limit: val })
                                .eq('id', selectedEvent.id)
                              setSelectedEvent(prev => ({ ...prev, photo_limit: val }))
                              setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, photo_limit: val } : e))
                            }}
                          >
                            Сохранить
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Статистика */}
                  <div style={{
                    background: '#161618',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '16px', padding: '20px',
                  }}>
                    <div className="section-label">Статистика</div>
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '12px',
                    }}>
                      {[
                        { label: 'Фото', value: photos.length },
                        { label: 'Гостей', value: guestCount },
                        { label: 'Лайков', value: photos.reduce((s, p) => s + (p.votes || 0), 0) },
                      ].map(({ label, value }) => (
                        <div key={label} style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: '12px', padding: '14px',
                          textAlign: 'center',
                        }}>
                          <div style={{
                            fontFamily: "'Unbounded', sans-serif",
                            fontWeight: 900, fontSize: '24px', color: '#F0F0F0',
                          }}>{value}</div>
                          <div style={{ fontSize: '11px', color: '#333', marginTop: '4px' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* ── Лайтбокс ── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
            zIndex: 2000, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '24px', animation: 'fadeIn 0.2s ease',
          }}
        >
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', width: '40px', height: '40px',
              borderRadius: '50%', cursor: 'pointer', fontSize: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
          <img
            src={lightbox.url}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '100%', maxHeight: '80dvh',
              objectFit: 'contain', borderRadius: '16px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
            }}
          />
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: '#F0F0F0', fontSize: '15px' }}>
              {lightbox.author || 'Гость'}
            </div>
            {lightbox.votes > 0 && (
              <div style={{ color: '#C3073F', fontSize: '13px', marginTop: '4px' }}>
                ❤️ {lightbox.votes} лайков
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

// ─────────────────────────────────────────────
//  Root — проверка сессии
// ─────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(null) // null = loading

  useEffect(() => {
    const ok = sessionStorage.getItem('tusim_admin') === '1'
    setAuthed(ok)
  }, [])

  function handleLogout() {
    sessionStorage.removeItem('tusim_admin')
    setAuthed(false)
  }

  if (authed === null) return null // ждём проверки сессии

  if (!authed) return <><style>{STYLES}</style><LoginScreen onLogin={() => setAuthed(true)} /></>

  return <><style>{STYLES}</style><AdminPanel onLogout={handleLogout} /></>
}