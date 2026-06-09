'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/app/ui/Toaster'
import Icon from '@/app/ui/Icon'
import Illustration from '@/app/ui/Illustration'

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
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('new')

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('unauthorized')))
      .then(d => { setOrganizer(d.organizer || {}); loadEvents() })
      .catch(() => router.replace('/organizer'))
  }, [])

  async function loadEvents() {
    setLoading(true)
    try {
      const res = await fetch('/api/organizer/events')
      if (res.status === 401) { router.replace('/organizer'); return }
      const data = await res.json()
      if (res.ok && data.events) setEvents(data.events)
    } catch(e) {}
    setLoading(false)
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' }).catch(() => {})
    router.push('/organizer')
  }

  function copyCode(code) {
    navigator.clipboard?.writeText(code)
    toast('Код события скопирован', 'success')
  }

  if (!organizer) return null

  const totalPhotos = events.reduce((a, e) => a + (e.photo_count || 0), 0)
  const activeCount = events.filter(e => e.status === 'active').length

  const q = query.trim().toLowerCase()
  const visibleEvents = events
    .filter(e => filter === 'all' ? true : filter === 'active' ? e.status === 'active' : e.status !== 'active')
    .filter(e => !q || (e.name||'').toLowerCase().includes(q) || (e.code||'').toLowerCase().includes(q))
    .slice()
    .sort((a,b) => {
      if (sort === 'photos') return (b.photo_count||0) - (a.photo_count||0)
      if (sort === 'active') return (b.status==='active'?1:0) - (a.status==='active'?1:0)
      return new Date(b.created_at||0) - new Date(a.created_at||0)
    })

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .db-root {
          min-height: 100vh; min-height: 100dvh;
          background: #09090b; font-family: 'Onest', sans-serif;
          color: #F0F0F0; position: relative; overflow-x: hidden;
        }

        .db-header {
          position: sticky; top: 0; z-index: 100;
          background: rgba(9,9,11,0.72);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 0 28px; height: 62px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .db-logo { font-family: 'Unbounded', sans-serif; font-weight: 900; font-size: 20px; color: #fff; letter-spacing: -1.5px; text-decoration: none; }
        .db-logo span { color: #C3073F; }

        .db-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #C3073F, #6F2232);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; cursor: pointer;
          border: none; color: #fff; position: relative;
          box-shadow: 0 0 0 2px rgba(195,7,63,0.2); transition: box-shadow 0.2s;
        }
        .db-avatar:hover { box-shadow: 0 0 0 3px rgba(195,7,63,0.4); }

        .db-menu {
          position: absolute; top: calc(100% + 10px); right: 0;
          background: rgba(17,17,19,0.96); backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 6px; min-width: 180px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.6); animation: menuIn 0.15s ease both;
        }
        @keyframes menuIn { from { opacity: 0; transform: translateY(6px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .db-menu-item {
          display: block; width: 100%; padding: 10px 14px;
          background: none; border: none; color: rgba(255,255,255,0.5);
          font-size: 13px; font-family: 'Onest', sans-serif;
          cursor: pointer; border-radius: 10px; text-align: left; transition: background 0.15s, color 0.15s;
        }
        .db-menu-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .db-menu-item.danger:hover { background: rgba(195,7,63,0.08); color: #C3073F; }
        .db-menu-sep { height: 1px; background: rgba(255,255,255,0.05); margin: 4px 0; }

        .db-body { max-width: 920px; margin: 0 auto; padding: 40px 24px 120px; position: relative; z-index: 1; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .db-welcome { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 36px; animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) both; }
        .db-welcome-title { font-family: 'Unbounded', sans-serif; font-size: clamp(22px, 4vw, 32px); font-weight: 900; letter-spacing: -1.5px; color: #fff; line-height: 1.1; }
        .db-welcome-title span { color: #C3073F; }
        .db-welcome-sub { font-size: 13px; color: rgba(255,255,255,0.3); margin-top: 6px; }

        .db-create-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 13px 22px; background: #C3073F; border: none;
          border-radius: 12px; color: #fff; font-size: 14px; font-weight: 700;
          font-family: 'Onest', sans-serif; cursor: pointer; white-space: nowrap;
          box-shadow: 0 4px 24px rgba(195,7,63,0.4); transition: transform 0.15s, box-shadow 0.15s; flex-shrink: 0;
        }
        .db-create-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 36px rgba(195,7,63,0.55); }
        .db-create-btn:active { transform: scale(0.97); }

        .db-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 32px; animation: fadeUp 0.5s 0.05s cubic-bezier(.22,1,.36,1) both; }
        @media(max-width: 480px) { .db-stats { grid-template-columns: 1fr 1fr; } }
        .db-stat { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 18px; padding: 22px 20px; position: relative; overflow: hidden; transition: border-color 0.2s, background 0.2s; }
        .db-stat:hover { border-color: rgba(195,7,63,0.2); background: rgba(195,7,63,0.02); }
        .db-stat::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(195,7,63,0.3), transparent); opacity: 0; transition: opacity 0.2s; }
        .db-stat:hover::before { opacity: 1; }
        .db-stat-val { font-family: 'Unbounded', sans-serif; font-size: 30px; font-weight: 900; color: #fff; letter-spacing: -1.5px; display: block; margin-bottom: 6px; line-height: 1; }
        .db-stat-label { font-size: 11px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }

        .db-controls { display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:18px; animation: fadeUp 0.5s 0.1s cubic-bezier(.22,1,.36,1) both; }
        .db-search { position:relative; flex:1; min-width:200px; }
        .db-search-ic { position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:13px; opacity:.4; pointer-events:none; }
        .db-search-input { width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:11px 38px; color:#F0F0F0; font-size:14px; font-family:'Onest',sans-serif; transition:border-color .2s, background .2s; }
        .db-search-input::placeholder { color:rgba(255,255,255,0.25); }
        .db-search-input:focus { outline:none; border-color:rgba(195,7,63,0.3); background:rgba(255,255,255,0.05); }
        .db-search-clear { position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; color:rgba(255,255,255,0.4); font-size:18px; cursor:pointer; line-height:1; padding:4px 8px; }
        .db-chips { display:flex; gap:6px; }
        .db-chip { padding:9px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.5); font-size:12px; font-weight:600; font-family:'Onest',sans-serif; cursor:pointer; transition:all .15s; white-space:nowrap; }
        .db-chip:hover { color:#fff; }
        .db-chip.on { background:rgba(195,7,63,0.12); border-color:rgba(195,7,63,0.3); color:#E11D54; }
        .db-sort { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:10px; padding:10px 14px; color:rgba(255,255,255,0.6); font-size:12px; font-weight:600; font-family:'Onest',sans-serif; cursor:pointer; }
        .db-sort:focus { outline:none; border-color:rgba(195,7,63,0.3); }
        @media(max-width:560px){ .db-controls{ flex-direction:column; align-items:stretch; } .db-chips{ justify-content:space-between; } .db-chip{ flex:1; text-align:center; } }

        .db-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; animation: fadeUp 0.5s 0.12s cubic-bezier(.22,1,.36,1) both; }
        .db-section-title { font-family: 'Unbounded', sans-serif; font-size: 14px; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
        .db-section-count { font-size: 11px; color: rgba(255,255,255,0.3); padding: 4px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; font-weight: 600; }

        .db-events { display: flex; flex-direction: column; gap: 12px; animation: fadeUp 0.5s 0.14s cubic-bezier(.22,1,.36,1) both; }

        .db-event { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 22px 24px; transition: border-color 0.2s, background 0.2s, transform 0.2s; position: relative; overflow: hidden; }
        .db-event:hover { border-color: rgba(195,7,63,0.2); background: rgba(195,7,63,0.02); transform: translateY(-2px); }
        .db-event.active-event::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #C3073F, #6F2232, transparent); }

        .db-event-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
        .db-event-name { font-family: 'Unbounded', sans-serif; font-size: 15px; font-weight: 900; color: #fff; letter-spacing: -0.5px; line-height: 1.3; }
        .db-event-date { font-size: 12px; color: rgba(255,255,255,0.25); margin-top: 5px; }

        .db-badges { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; flex-shrink: 0; }
        .db-badge { padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; white-space: nowrap; letter-spacing: 0.3px; }
        .db-badge.active { background: rgba(34,197,94,0.1); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); }
        .db-badge.closed { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.3); border: 1px solid rgba(255,255,255,0.07); }
        .db-badge.plan { background: rgba(195,7,63,0.1); color: #C3073F; border: 1px solid rgba(195,7,63,0.2); text-transform: capitalize; }

        .db-event-meta { display: flex; gap: 24px; flex-wrap: wrap; }
        .db-meta-item { display: flex; flex-direction: column; gap: 3px; }
        .db-meta-val { font-family: 'Unbounded', sans-serif; font-size: 18px; font-weight: 900; color: #F0F0F0; letter-spacing: -0.5px; }
        .db-meta-sub { font-size: 10px; color: rgba(255,255,255,0.3); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

        .db-event-bar { margin-top: 16px; height: 3px; border-radius: 2px; background: rgba(255,255,255,0.05); overflow: hidden; }
        .db-event-bar-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, #6F2232, #C3073F); transition: width 0.6s cubic-bezier(.22,1,.36,1); }

        .db-event-footer { margin-top: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
        .db-event-timer { font-size: 12px; color: #C3073F; font-weight: 700; }
        .db-event-code { font-size: 11px; color: rgba(255,255,255,0.4); font-family: monospace; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 4px 10px; border-radius: 6px; letter-spacing: 1px; cursor: pointer; transition: all .15s; }
        .db-event-code:hover { color:#fff; border-color: rgba(195,7,63,0.3); }

        .db-event-actions { display: flex; gap: 8px; margin-top: 18px; flex-wrap: wrap; }
        .db-action-btn { padding: 9px 16px; border-radius: 10px; border: none; font-size: 12px; font-weight: 700; font-family: 'Onest', sans-serif; cursor: pointer; transition: all 0.15s; }
        .db-action-btn.primary { background: #C3073F; color: #fff; box-shadow: 0 2px 12px rgba(195,7,63,0.3); }
        .db-action-btn.primary:hover { background: #E11D54; box-shadow: 0 4px 20px rgba(195,7,63,0.45); }
        .db-action-btn.secondary { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.5); }
        .db-action-btn.secondary:hover { color: #fff; background: rgba(255,255,255,0.08); }

        .db-empty { text-align: center; padding: 64px 24px; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.07); border-radius: 24px; animation: fadeUp 0.5s 0.14s cubic-bezier(.22,1,.36,1) both; }
        .db-empty-icon { font-size: 48px; margin-bottom: 20px; display: block; }
        .db-empty h3 { font-family: 'Unbounded', sans-serif; font-size: 18px; font-weight: 900; color: #fff; margin-bottom: 10px; letter-spacing: -0.5px; }
        .db-empty p { font-size: 13px; color: rgba(255,255,255,0.3); margin-bottom: 28px; line-height: 1.7; }

        .db-loading { display: flex; flex-direction: column; gap: 12px; }
        .db-skeleton { border-radius: 20px; height: 180px; background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.03) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      <div className="ds-atmos" aria-hidden="true">
        <div className="ds-aurora"/><div className="ds-blob ds-blob-1"/><div className="ds-blob ds-blob-2"/><div className="ds-grain"/>
      </div>

      <div className="db-root">
        <header className="db-header">
          <a href="/" className="db-logo">tusi<span>'m</span></a>
          <div style={{ position: 'relative' }}>
            <button className="db-avatar" onClick={() => setMenuOpen(v => !v)}>
              {organizer.name?.[0]?.toUpperCase() || organizer.first_name?.[0]?.toUpperCase() || 'О'}
            </button>
            {menuOpen && (
              <div className="db-menu">
                <button className="db-menu-item" style={{ color: '#F0F0F0', cursor: 'default', fontWeight: 600 }}>
                  {organizer.name || organizer.first_name || 'Организатор'}
                </button>
                <div className="db-menu-sep"/>
                <button className="db-menu-item danger" onClick={logout}>Выйти</button>
              </div>
            )}
          </div>
        </header>

        <div className="db-body">
          <div className="db-welcome">
            <div>
              <div className="db-welcome-title">
                Привет, <span>{organizer.name || organizer.first_name || 'Организатор'}</span> 👋
              </div>
              <div className="db-welcome-sub">Управляй событиями и следи за фото в реальном времени</div>
            </div>
            <button className="db-create-btn" onClick={() => router.push('/organizer/create')}>
              + Новое событие
            </button>
          </div>

          <div className="db-stats">
            {[
              { val: events.length, label: 'Событий' },
              { val: activeCount,   label: 'Активных' },
              { val: totalPhotos,   label: 'Фото' },
            ].map((s) => (
              <div key={s.label} className="db-stat">
                <span className="db-stat-val">{s.val}</span>
                <span className="db-stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {events.length > 0 && (
            <div className="db-controls">
              <div className="db-search">
                <span className="db-search-ic"><Icon name="search" size={15} stroke={2} style={{display:'block'}}/></span>
                <input className="db-search-input" placeholder="Поиск события или кода…" value={query} onChange={e => setQuery(e.target.value)} />
                {query && <button className="db-search-clear" onClick={() => setQuery('')}>×</button>}
              </div>
              <div className="db-chips">
                {[['all','Все'],['active','Активные'],['closed','Завершённые']].map(([k,l]) => (
                  <button key={k} className={`db-chip${filter===k?' on':''}`} onClick={() => setFilter(k)}>{l}</button>
                ))}
              </div>
              <select className="db-sort" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="new">Сначала новые</option>
                <option value="active">Сначала активные</option>
                <option value="photos">Больше фото</option>
              </select>
            </div>
          )}

          <div className="db-section-head">
            <span className="db-section-title">Мои события</span>
            <span className="db-section-count">{visibleEvents.length}</span>
          </div>

          {loading ? (
            <div className="db-loading">
              <div className="db-skeleton"/>
              <div className="db-skeleton" style={{ height: 140, opacity: 0.5 }}/>
            </div>
          ) : events.length === 0 ? (
            <div className="db-empty">
              <Illustration name="events" size={124} style={{margin:'0 auto 8px'}}/>
              <h3>Нет событий</h3>
              <p>Создай первое событие и получи QR-код<br/>для своих гостей</p>
              <button className="db-create-btn" style={{ display:'inline-flex', margin:'0 auto' }}
                onClick={() => router.push('/organizer/create')}>
                Создать событие
              </button>
            </div>
          ) : visibleEvents.length === 0 ? (
            <div className="db-empty" style={{ padding:'48px 24px' }}>
              <Illustration name="search" size={104} style={{margin:'0 auto 8px'}}/>
              <h3>Ничего не найдено</h3>
              <p>Измени запрос или фильтр</p>
            </div>
          ) : (
            <div className="db-events">
              {visibleEvents.map((ev) => {
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
                      <div className="db-badges">
                        <span className={`db-badge ${isActive ? 'active' : 'closed'}`}>
                          {isActive ? '● Активно' : 'Завершено'}
                        </span>
                        {ev.plan && <span className="db-badge plan">{ev.plan}</span>}
                      </div>
                    </div>

                    <div className="db-event-meta">
                      <div className="db-meta-item">
                        <span className="db-meta-val">
                          {guestCount}
                          {ev.guest_limit && <span style={{ fontSize:12, color:'rgba(255,255,255,0.2)', fontWeight:400 }}>/{ev.guest_limit}</span>}
                        </span>
                        <span className="db-meta-sub">Гостей</span>
                      </div>
                      <div className="db-meta-item">
                        <span className="db-meta-val">{photoCount}</span>
                        <span className="db-meta-sub">Фото</span>
                      </div>
                      <div className="db-meta-item">
                        <span className="db-meta-val">{Math.round(photoCount / Math.max(guestCount, 1))}</span>
                        <span className="db-meta-sub">Фото/гость</span>
                      </div>
                    </div>

                    {ev.guest_limit && (
                      <div className="db-event-bar">
                        <div className="db-event-bar-fill" style={{ width:`${pct}%` }}/>
                      </div>
                    )}

                    <div className="db-event-footer">
                      {tl ? <span className="db-event-timer"><Icon name="clock" size={13} stroke={2} style={{verticalAlign:'-2px',marginRight:5}}/>Осталось {tl}</span> : <span/>}
                      {ev.code && <span className="db-event-code" onClick={() => copyCode(ev.code)} title="Скопировать код">{ev.code}</span>}
                    </div>

                    <div className="db-event-actions">
                      <button className="db-action-btn primary" onClick={() => router.push(`/organizer/event/${ev.id}`)}>
                        Управление →
                      </button>
                      <button className="db-action-btn secondary" onClick={() => router.push(`/album?event_id=${ev.id}`)}>
                        Альбом
                      </button>
                      <button className="db-action-btn secondary" onClick={() => router.push(`/organizer/event/${ev.id}`)}>
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
