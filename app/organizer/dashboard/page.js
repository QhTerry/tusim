'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function timeLeft(ts) {
  if (!ts) return null
  const diff = new Date(ts) - Date.now()
  if (diff <= 0) return null
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}ч ${m}м` : `${m}м`
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Dashboard() {
  const router = useRouter()
  const [organizer, setOrganizer] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('organizer_token')
    if (!token) { router.replace('/organizer'); return }
    const org = JSON.parse(localStorage.getItem('organizer') || '{}')
    setOrganizer(org)
    loadEvents(org.id)
    const t = setInterval(() => setTick(v => v + 1), 30000)
    return () => clearInterval(t)
  }, [])

  async function loadEvents(organizerId) {
    setLoading(true)
    try {
      let query = supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (organizerId) {
        query = query.eq('organizer_id', organizerId)
      }

      const { data, error } = await query
      if (!error && data) setEvents(data)
    } catch(e) {}
    setLoading(false)
  }

  function logout() {
    localStorage.removeItem('organizer_token')
    localStorage.removeItem('organizer')
    router.push('/organizer')
  }

  if (!organizer) return null

  const totalGuests = events.reduce((a, e) => a + (e.guest_count || 0), 0)
  const totalPhotos = events.reduce((a, e) => a + (e.photo_count || 0), 0)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Onest:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .db-root {
          min-height: 100vh; min-height: 100dvh;
          background: #0c0c0e; font-family: 'Onest', sans-serif;
          color: #F0F0F0;
        }

        .db-header {
          position: sticky; top: 0; z-index: 100;
          background: rgba(12,12,14,0.92);
          backdrop-filter: blur(20px);
          border-bottom: 0.5px solid rgba(255,255,255,0.05);
          padding: 0 24px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .db-logo {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 20px; color: #fff; letter-spacing: -1px;
          text-decoration: none;
        }
        .db-logo em { font-style: normal; color: #C3073F; }

        .db-header-right { display: flex; align-items: center; gap: 12px; }
        .db-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: linear-gradient(135deg, #C3073F, #6F2232);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 600; cursor: pointer;
          border: none; color: #fff; position: relative;
          overflow: visible;
        }
        .db-menu {
          position: absolute; top: calc(100% + 8px); right: 0;
          background: #161618; border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 6px; min-width: 160px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          animation: fadeUp 0.15s ease both;
        }
        .db-menu-item {
          display: block; width: 100%; padding: 10px 14px;
          background: none; border: none; color: #888;
          font-size: 13px; font-family: 'Onest', sans-serif;
          cursor: pointer; border-radius: 8px; text-align: left;
          transition: background 0.15s, color 0.15s;
        }
        .db-menu-item:hover { background: rgba(255,255,255,0.04); color: #fff; }
        .db-menu-item.danger:hover { background: rgba(195,7,63,0.08); color: #C3073F; }

        .db-body { max-width: 900px; margin: 0 auto; padding: 32px 20px 100px; }

        .db-welcome {
          margin-bottom: 32px;
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
        }
        .db-welcome h1 {
          font-family: 'Syne', sans-serif; font-size: clamp(22px, 5vw, 32px);
          font-weight: 800; letter-spacing: -1px; color: #fff;
        }
        .db-welcome h1 span { color: #C3073F; }
        .db-welcome p { font-size: 13px; color: #444; margin-top: 4px; }

        .db-create-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 20px; background: #C3073F; border: none;
          border-radius: 12px; color: #fff; font-size: 14px; font-weight: 600;
          font-family: 'Onest', sans-serif; cursor: pointer;
          white-space: nowrap; flex-shrink: 0;
          transition: background 0.2s, transform 0.1s;
        }
        .db-create-btn:hover { background: #a8063a; }
        .db-create-btn:active { transform: scale(0.97); }

        .db-stats {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 12px; margin-bottom: 32px;
        }
        @media(max-width: 500px) { .db-stats { grid-template-columns: 1fr 1fr; } }
        .db-stat {
          background: #111114; border: 0.5px solid rgba(255,255,255,0.05);
          border-radius: 16px; padding: 20px;
        }
        .db-stat-val {
          font-family: 'Syne', sans-serif; font-size: 28px;
          font-weight: 800; color: #fff; letter-spacing: -1px;
          display: block; margin-bottom: 4px;
        }
        .db-stat-label { font-size: 11px; color: #444; text-transform: uppercase; letter-spacing: 1px; }

        .db-section-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px;
        }
        .db-section-title {
          font-family: 'Syne', sans-serif; font-size: 16px;
          font-weight: 700; color: #fff;
        }
        .db-section-count {
          font-size: 12px; color: #444; padding: 4px 10px;
          background: rgba(255,255,255,0.03);
          border: 0.5px solid rgba(255,255,255,0.06);
          border-radius: 20px;
        }

        .db-events { display: flex; flex-direction: column; gap: 12px; }

        .db-event {
          background: #111114; border: 0.5px solid rgba(255,255,255,0.05);
          border-radius: 20px; padding: 20px 22px;
          transition: border-color 0.2s, background 0.2s;
          position: relative; overflow: hidden;
        }
        .db-event:hover {
          border-color: rgba(195,7,63,0.2);
          background: #131316;
        }
        .db-event.active-event::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #C3073F, #6F2232);
        }

        .db-event-top {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 12px; margin-bottom: 16px;
        }
        .db-event-name {
          font-family: 'Syne', sans-serif; font-size: 17px;
          font-weight: 700; color: #fff; letter-spacing: -0.3px;
        }
        .db-event-date { font-size: 12px; color: #444; margin-top: 4px; }

        .db-badge {
          padding: 4px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 500; white-space: nowrap;
        }
        .db-badge.active { background: rgba(34,197,94,0.1); color: #22c55e; }
        .db-badge.closed { background: rgba(255,255,255,0.04); color: #555; }
        .db-badge.plan { background: rgba(195,7,63,0.1); color: #C3073F; }

        .db-event-meta { display: flex; gap: 20px; flex-wrap: wrap; }
        .db-meta-item { display: flex; flex-direction: column; gap: 2px; }
        .db-meta-val { font-size: 16px; font-weight: 600; color: #F0F0F0; }
        .db-meta-label { font-size: 11px; color: #444; }

        .db-event-bar {
          margin-top: 14px; height: 3px; border-radius: 2px;
          background: rgba(255,255,255,0.05); overflow: hidden;
        }
        .db-event-bar-fill {
          height: 100%; border-radius: 2px;
          background: linear-gradient(90deg, #C3073F, #6F2232);
          transition: width 0.5s ease;
        }

        .db-event-footer {
          margin-top: 14px; display: flex;
          align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 8px;
        }
        .db-event-timer { font-size: 12px; color: #C3073F; font-weight: 500; }
        .db-event-code {
          font-size: 11px; color: #333; font-family: monospace;
          background: rgba(255,255,255,0.03); padding: 4px 10px;
          border-radius: 6px; letter-spacing: 1px;
        }

        .db-event-actions {
          display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap;
        }
        .db-action-btn {
          padding: 8px 14px; border-radius: 10px; border: none;
          font-size: 12px; font-weight: 500; font-family: 'Onest', sans-serif;
          cursor: pointer; transition: all 0.15s;
        }
        .db-action-btn.primary { background: #C3073F; color: #fff; }
        .db-action-btn.primary:hover { background: #a8063a; }
        .db-action-btn.secondary {
          background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.08);
          color: #888;
        }
        .db-action-btn.secondary:hover { color: #fff; background: rgba(255,255,255,0.07); }

        .db-empty {
          text-align: center; padding: 60px 24px;
          background: #111114; border: 0.5px dashed rgba(255,255,255,0.07);
          border-radius: 20px;
        }
        .db-empty-icon { font-size: 40px; margin-bottom: 16px; display: block; }
        .db-empty h3 {
          font-family: 'Syne', sans-serif; font-size: 18px;
          font-weight: 700; color: #fff; margin-bottom: 8px;
        }
        .db-empty p { font-size: 13px; color: #444; margin-bottom: 24px; line-height: 1.6; }

        .db-loading {
          display: flex; flex-direction: column; gap: 12px;
        }
        .db-skeleton {
          background: #111114; border: 0.5px solid rgba(255,255,255,0.04);
          border-radius: 20px; height: 160px;
          background: linear-gradient(90deg, #111114 25%, #161619 50%, #111114 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="db-root">
        <header className="db-header">
          <a href="/" className="db-logo">tusi<em>'m</em></a>
          <div className="db-header-right">
            <div style={{ position: 'relative' }}>
              <button className="db-avatar" onClick={() => setMenuOpen(v => !v)}>
                {organizer.name?.[0]?.toUpperCase() || organizer.first_name?.[0]?.toUpperCase() || 'О'}
              </button>
              {menuOpen && (
                <div className="db-menu">
                  <button className="db-menu-item" style={{ color: '#F0F0F0', cursor: 'default' }}>
                    {organizer.name || organizer.first_name || 'Организатор'}
                  </button>
                  <hr style={{ border: 'none', borderTop: '0.5px solid rgba(255,255,255,0.05)', margin: '4px 0' }} />
                  <button className="db-menu-item danger" onClick={logout}>Выйти</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="db-body">
          <div className="db-welcome">
            <div>
              <h1>Привет, <span>{organizer.name || organizer.first_name || 'Организатор'}</span> 👋</h1>
              <p>Управляй событиями и следи за фото в реальном времени</p>
            </div>
            <button className="db-create-btn" onClick={() => router.push('/organizer/create')}>
              + Новое событие
            </button>
          </div>

          <div className="db-stats">
            <div className="db-stat">
              <span className="db-stat-val">{events.length}</span>
              <span className="db-stat-label">Событий</span>
            </div>
            <div className="db-stat">
              <span className="db-stat-val">{totalGuests}</span>
              <span className="db-stat-label">Гостей</span>
            </div>
            <div className="db-stat">
              <span className="db-stat-val">{totalPhotos}</span>
              <span className="db-stat-label">Фото</span>
            </div>
          </div>

          <div className="db-section-head">
            <span className="db-section-title">Мои события</span>
            <span className="db-section-count">{events.length}</span>
          </div>

          {loading ? (
            <div className="db-loading">
              <div className="db-skeleton" />
              <div className="db-skeleton" style={{ height: 120, opacity: 0.5 }} />
            </div>
          ) : events.length === 0 ? (
            <div className="db-empty">
              <span className="db-empty-icon">📸</span>
              <h3>Нет событий</h3>
              <p>Создай первое событие и получи QR-код<br/>для своих гостей</p>
              <button className="db-create-btn" style={{ display:'inline-flex', margin: '0 auto' }} onClick={() => router.push('/organizer/create')}>
                Создать событие
              </button>
            </div>
          ) : (
            <div className="db-events">
              {events.map(ev => {
                const guestCount = ev.guest_count || 0
                const photoCount = ev.photo_count || 0
                const pct = ev.guest_limit ? Math.min(100, Math.round(guestCount / ev.guest_limit * 100)) : 0
                const tl = timeLeft(ev.ends_at)
                const isActive = ev.status === 'active'
                return (
                  <div key={ev.id} className={`db-event${isActive ? ' active-event' : ''}`}>
                    <div className="db-event-top">
                      <div>
                        <div className="db-event-name">{ev.name}</div>
                        <div className="db-event-date">{formatDate(ev.starts_at)}</div>
                      </div>
                      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', justifyContent:'flex-end' }}>
                        <span className={`db-badge ${ev.status}`}>
                          {isActive ? '● Активно' : 'Завершено'}
                        </span>
                        {ev.plan && <span className="db-badge plan">{ev.plan}</span>}
                      </div>
                    </div>

                    <div className="db-event-meta">
                      <div className="db-meta-item">
                        <span className="db-meta-val">
                          {guestCount}
                          {ev.guest_limit && <span style={{fontSize:12,color:'#444',fontWeight:400}}>/{ev.guest_limit}</span>}
                        </span>
                        <span className="db-meta-label">Гостей</span>
                      </div>
                      <div className="db-meta-item">
                        <span className="db-meta-val">{photoCount}</span>
                        <span className="db-meta-label">Фото</span>
                      </div>
                      <div className="db-meta-item">
                        <span className="db-meta-val">{Math.round(photoCount / Math.max(guestCount, 1))}</span>
                        <span className="db-meta-label">Фото/гость</span>
                      </div>
                    </div>

                    {ev.guest_limit && (
                      <div className="db-event-bar">
                        <div className="db-event-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    )}

                    <div className="db-event-footer">
                      {tl && <span className="db-event-timer">⏱ Осталось {tl}</span>}
                      {ev.code && <span className="db-event-code">{ev.code}</span>}
                    </div>

                    <div className="db-event-actions">
                      <button className="db-action-btn primary" onClick={() => router.push(`/organizer/event/${ev.id}`)}>
                        Управление →
                      </button>
                      <button className="db-action-btn secondary" onClick={() => router.push(`/album?event_id=${ev.id}`)}>
                        Альбом
                      </button>
                      <button className="db-action-btn secondary">
                        QR-код
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}