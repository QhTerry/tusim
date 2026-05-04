'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Onest:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#111113; min-height:100%; }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
  @keyframes fadeIn  { from{opacity:0;} to{opacity:1;} }
  @keyframes pulse   { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
  @keyframes shake   { 0%,100%{transform:translateX(0);} 20%{transform:translateX(-7px);} 40%{transform:translateX(7px);} 60%{transform:translateX(-4px);} 80%{transform:translateX(4px);} }
  @keyframes spin    { to{transform:rotate(360deg);} }

  .fade-up { animation:fadeUp 0.4s cubic-bezier(.22,1,.36,1) both; }
  .fade-in { animation:fadeIn 0.3s ease both; }
  .shake   { animation:shake 0.4s ease; }

  .ai { width:100%; padding:12px 15px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; color:#F0F0F0; font-family:'Onest',sans-serif; font-size:14px; outline:none; transition:border-color 0.2s; -webkit-appearance:none; }
  .ai:focus { border-color:rgba(195,7,63,0.45); }
  .ai::placeholder { color:#222; }
  .ai.err { border-color:rgba(195,7,63,0.6); }

  .btn-r { background:linear-gradient(135deg,#C3073F,#950740); color:#fff; border:none; border-radius:10px; font-family:'Onest',sans-serif; font-weight:700; font-size:14px; padding:12px 20px; cursor:pointer; transition:transform 0.15s,box-shadow 0.15s; white-space:nowrap; -webkit-tap-highlight-color:transparent; }
  .btn-r:hover:not(:disabled) { transform:scale(1.02); box-shadow:0 5px 18px rgba(195,7,63,0.3); }
  .btn-r:active:not(:disabled) { transform:scale(0.98); }
  .btn-r:disabled { background:#1e1e1e; color:#444; cursor:not-allowed; }

  .btn-g { background:transparent; border:1px solid rgba(255,255,255,0.1); color:#555; border-radius:8px; font-family:'Onest',sans-serif; font-size:12px; padding:7px 13px; cursor:pointer; transition:border-color 0.15s,color 0.15s; white-space:nowrap; }
  .btn-g:hover { border-color:rgba(255,255,255,0.2); color:#888; }

  .ev-card { background:#161618; border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:12px 16px; cursor:pointer; transition:border-color 0.2s,background 0.2s; }
  .ev-card:hover { border-color:rgba(195,7,63,0.25); }
  .ev-card.act { border-color:#C3073F; background:rgba(195,7,63,0.06); }

  .tab { padding:6px 14px; border-radius:7px; font-family:'Onest',sans-serif; font-size:13px; font-weight:600; cursor:pointer; border:none; transition:background 0.15s,color 0.15s; }
  .tab.act { background:rgba(195,7,63,0.15); color:#C3073F; }
  .tab:not(.act) { background:transparent; color:#444; }
  .tab:not(.act):hover { color:#666; }

  .photo-thumb { width:100%; aspect-ratio:1; object-fit:cover; border-radius:8px; cursor:pointer; transition:opacity 0.2s,transform 0.2s; display:block; }
  .photo-thumb:hover { opacity:0.85; transform:scale(1.03); }
  .photo-wrap { position:relative; }
  .photo-del { position:absolute; top:4px; right:4px; width:24px; height:24px; border-radius:50%; background:rgba(195,7,63,0.85); border:none; color:#fff; font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.15s; }
  .photo-wrap:hover .photo-del { opacity:1; }

  .sidebar { overflow-y:auto; max-height:calc(100dvh - 220px); scrollbar-width:thin; scrollbar-color:#2a2a2a transparent; }
  .sidebar::-webkit-scrollbar { width:3px; }
  .sidebar::-webkit-scrollbar-thumb { background:#2a2a2a; border-radius:3px; }

  .lbl { font-size:11px; color:#2a2a2a; text-transform:uppercase; letter-spacing:0.1em; font-weight:600; margin-bottom:11px; }
  .section { background:#161618; border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:18px; }
  .stat-box { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:14px; text-align:center; }
`

// ── QR компонент ──────────────────────────────────────────────────────────────
function QRBlock({ url }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=16&data=${encodeURIComponent(url)}`
  function downloadQR() {
    fetch(qrUrl).then(r=>r.blob()).then(blob => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'tusim-qr.png'
      a.click()
    })
  }
  return (
    <div style={{ display:'flex', gap:'18px', alignItems:'flex-start', flexWrap:'wrap' }}>
      <div style={{ background:'#fff', borderRadius:'12px', padding:'10px', flexShrink:0 }}>
        <img src={qrUrl} width={130} height={130} alt="QR" style={{ display:'block' }}/>
      </div>
      <div style={{ flex:1, minWidth:'160px' }}>
        <div style={{ fontSize:'11px', color:'#333', marginBottom:'7px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Ссылка для гостей</div>
        <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#666', wordBreak:'break-all', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'8px', padding:'8px 10px', marginBottom:'10px' }}>{url}</div>
        <div style={{ display:'flex', gap:'7px', flexWrap:'wrap' }}>
          <button className="btn-r" style={{ fontSize:'12px', padding:'8px 14px' }} onClick={() => { navigator.clipboard.writeText(url) }}>Копировать</button>
          <button className="btn-g" onClick={downloadQR}>⬇ Скачать QR</button>
        </div>
      </div>
    </div>
  )
}

// ── Логин ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [login, setLogin]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [shake, setShake]       = useState(false)

  async function submit() {
    if (!login.trim() || !password.trim()) return
    setLoading(true); setError('')
    const res  = await fetch('/api/admin-auth', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ login, password }) })
    const data = await res.json()
    if (data.ok) { sessionStorage.setItem('tusim_admin','1'); onLogin() }
    else { setError(data.error||'Неверный логин или пароль'); setShake(true); setTimeout(()=>setShake(false),500) }
    setLoading(false)
  }

  return (
    <main style={{ minHeight:'100dvh', background:'#111113', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:"'Onest',sans-serif" }}>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 60% 50% at 50% 0%,rgba(195,7,63,0.08) 0%,transparent 60%)' }}/>
      <div className="fade-up" style={{ width:'100%', maxWidth:'340px' }}>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ width:'50px', height:'50px', borderRadius:'14px', background:'linear-gradient(135deg,#C3073F,#6F2232)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 13px', boxShadow:'0 8px 28px rgba(195,7,63,0.3)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7-10h-3l-2-2H10L8 5.5H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2v-11a2 2 0 00-2-2z" fill="white"/></svg>
          </div>
          <h1 style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'20px', letterSpacing:'-0.5px', color:'#F0F0F0' }}>tusi<span style={{ color:'#C3073F' }}>'m</span></h1>
          <p style={{ color:'#333', fontSize:'12px', marginTop:'4px' }}>Панель организатора</p>
        </div>
        <div className={shake?'shake':''} style={{ display:'flex', flexDirection:'column', gap:'9px' }}>
          <input className={`ai ${error?'err':''}`} placeholder="Логин" value={login} onChange={e=>setLogin(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} autoComplete="username" autoFocus/>
          <input className={`ai ${error?'err':''}`} placeholder="Пароль" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} autoComplete="current-password"/>
          {error && <div style={{ color:'#C3073F', fontSize:'12px', textAlign:'center' }}>{error}</div>}
          <button className="btn-r" onClick={submit} disabled={loading||!login.trim()||!password.trim()} style={{ marginTop:'4px', width:'100%', padding:'14px' }}>
            {loading?'Входим...':'Войти'}
          </button>
        </div>
      </div>
    </main>
  )
}

// ── Панель ────────────────────────────────────────────────────────────────────
function AdminPanel({ onLogout }) {
  const [events, setEvents]       = useState([])
  const [selected, setSelected]   = useState(null)
  const [photos, setPhotos]       = useState([])
  const [tab, setTab]             = useState('photos') // 'photos' | 'settings' | 'stats'
  const [lightbox, setLightbox]   = useState(null)
  const [closing, setClosing]     = useState(false)
  const [creating, setCreating]   = useState(false)

  // Форма создания
  const [eventName, setEventName] = useState('')
  const [photoLimit, setPhotoLimit] = useState(30)
  const [guestLimit, setGuestLimit] = useState(150)
  const [startsAt, setStartsAt]   = useState('')
  const [endsAt, setEndsAt]       = useState('')

  const domain = typeof window !== 'undefined' ? window.location.origin : 'https://tusim.vercel.app'

  useEffect(() => { loadEvents() }, [])

  useEffect(() => {
    if (!selected) return
    loadPhotos(selected.id)
    const ch = supabase.channel(`adm-${selected.id}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'photos', filter:`event_id=eq.${selected.id}` },
        p => setPhotos(prev => [p.new, ...prev]))
      .on('postgres_changes', { event:'DELETE', schema:'public', table:'photos', filter:`event_id=eq.${selected.id}` },
        p => setPhotos(prev => prev.filter(ph => ph.id !== p.old.id)))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [selected])

  async function loadEvents() {
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending:false })
    if (data) setEvents(data)
  }

  async function loadPhotos(eid) {
    const { data } = await supabase.from('photos').select('*').eq('event_id', eid).order('created_at', { ascending:false })
    if (data) setPhotos(data)
  }

  async function createEvent() {
    if (!eventName.trim()) return
    setCreating(true)
    const code = Math.random().toString(36).substring(2,8).toUpperCase()
    const { data } = await supabase.from('events').insert({
      name: eventName.trim(), code,
      photo_limit: photoLimit,
      guest_limit: guestLimit,
      status: 'active',
      starts_at: startsAt || null,
      ends_at:   endsAt   || null,
    }).select().single()
    if (data) { setEvents(prev=>[data,...prev]); setSelected(data); setEventName(''); setTab('photos') }
    setCreating(false)
  }

  async function closeEvent() {
    if (!selected || closing) return
    if (!confirm('Закрыть съёмку? Гости больше не смогут делать фото.')) return
    setClosing(true)
    await supabase.from('events').update({ status:'closed' }).eq('id', selected.id)
    const upd = { ...selected, status:'closed' }
    setSelected(upd); setEvents(prev=>prev.map(e=>e.id===selected.id?upd:e))
    setClosing(false)
  }

  async function reopenEvent() {
    if (!selected) return
    await supabase.from('events').update({ status:'active' }).eq('id', selected.id)
    const upd = { ...selected, status:'active' }
    setSelected(upd); setEvents(prev=>prev.map(e=>e.id===selected.id?upd:e))
  }

  async function deletePhoto(photoId) {
    if (!confirm('Удалить это фото?')) return
    await supabase.from('photos').delete().eq('id', photoId)
    setPhotos(prev => prev.filter(p => p.id !== photoId))
    if (lightbox?.id === photoId) setLightbox(null)
  }

  const guestCount = new Set(photos.map(p=>p.device_id)).size
  const totalVotes = photos.reduce((s,p)=>s+(p.votes||0), 0)
  const isClosed   = selected?.status === 'closed'
  const eventUrl   = selected ? `${domain}/event/${selected.code}` : ''

  // Форматирование даты создания
  function fmtDate(str) {
    if (!str) return '—'
    return new Date(str).toLocaleDateString('ru-RU', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
  }

  return (
    <main style={{ minHeight:'100dvh', background:'#111113', color:'#F0F0F0', fontFamily:"'Onest',sans-serif" }}>

      {/* Шапка */}
      <div style={{ position:'sticky', top:0, zIndex:100, background:'rgba(17,17,19,0.94)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'0 22px', display:'flex', alignItems:'center', justifyContent:'space-between', height:'56px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'linear-gradient(135deg,#C3073F,#6F2232)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7-10h-3l-2-2H10L8 5.5H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2v-11a2 2 0 00-2-2z" fill="white"/></svg>
          </div>
          <span style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'14px', letterSpacing:'-0.5px' }}>tusi<span style={{ color:'#C3073F' }}>'m</span></span>
          <span style={{ fontSize:'10px', color:'#2a2a2a', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'5px', padding:'2px 6px' }}>admin</span>
        </div>
        <button className="btn-g" onClick={onLogout} style={{ fontSize:'12px' }}>Выйти</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', minHeight:'calc(100dvh - 56px)' }}>

        {/* ── Сайдбар ── */}
        <div style={{ borderRight:'1px solid rgba(255,255,255,0.05)', padding:'18px 14px', display:'flex', flexDirection:'column', gap:'16px' }}>

          {/* Создать событие */}
          <div>
            <div className="lbl">Новое мероприятие</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              <input className="ai" placeholder="Название события" value={eventName} onChange={e=>setEventName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createEvent()}/>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
                <div>
                  <div style={{ fontSize:'10px', color:'#333', marginBottom:'4px' }}>Кадров</div>
                  <input className="ai" type="number" min="1" max="200" value={photoLimit} onChange={e=>setPhotoLimit(Number(e.target.value))} style={{ textAlign:'center', fontSize:'13px' }}/>
                </div>
                <div>
                  <div style={{ fontSize:'10px', color:'#333', marginBottom:'4px' }}>Гостей</div>
                  <input className="ai" type="number" min="1" max="9999" value={guestLimit} onChange={e=>setGuestLimit(Number(e.target.value))} style={{ textAlign:'center', fontSize:'13px' }}/>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
                <div>
                  <div style={{ fontSize:'10px', color:'#333', marginBottom:'4px' }}>Начало</div>
                  <input className="ai" type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} style={{ fontSize:'10px' }}/>
                </div>
                <div>
                  <div style={{ fontSize:'10px', color:'#333', marginBottom:'4px' }}>Конец</div>
                  <input className="ai" type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)} style={{ fontSize:'10px' }}/>
                </div>
              </div>

              <button className="btn-r" onClick={createEvent} disabled={creating||!eventName.trim()} style={{ fontSize:'13px', padding:'11px' }}>
                {creating ? 'Создаём...' : '+ Создать'}
              </button>
            </div>
          </div>

          {/* Список событий */}
          {events.length > 0 && (
            <div style={{ flex:1 }}>
              <div className="lbl">Мероприятия ({events.length})</div>
              <div className="sidebar" style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                {events.map(ev => (
                  <div key={ev.id} className={`ev-card ${selected?.id===ev.id?'act':''}`} onClick={()=>{ setSelected(ev); setTab('photos') }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div style={{ fontWeight:600, fontSize:'13px', color:'#F0F0F0', marginBottom:'4px', flex:1, paddingRight:'6px' }}>{ev.name}</div>
                      <span style={{ fontSize:'9px', color: ev.status==='closed'?'#444':'#22C55E', background: ev.status==='closed'?'rgba(255,255,255,0.04)':'rgba(34,197,94,0.1)', borderRadius:'4px', padding:'1px 5px', flexShrink:0 }}>
                        {ev.status==='closed'?'закрыто':'активно'}
                      </span>
                    </div>
                    <div style={{ display:'flex', gap:'7px', alignItems:'center' }}>
                      <span style={{ fontSize:'10px', color:'#C3073F', fontFamily:'monospace', fontWeight:700, background:'rgba(195,7,63,0.1)', padding:'1px 5px', borderRadius:'4px' }}>{ev.code}</span>
                      <span style={{ fontSize:'10px', color:'#222' }}>{fmtDate(ev.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {events.length === 0 && (
            <div style={{ textAlign:'center', padding:'24px 0', color:'#1e1e1e', fontSize:'13px' }}>Нет мероприятий</div>
          )}
        </div>

        {/* ── Правая часть ── */}
        <div style={{ padding:'18px 24px' }}>
          {!selected ? (
            <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'10px', color:'#1e1e1e' }}>
              <div style={{ fontSize:'36px' }}>←</div>
              <div style={{ fontSize:'13px' }}>Выбери мероприятие</div>
            </div>
          ) : (
            <div className="fade-in">

              {/* Заголовок */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'16px', flexWrap:'wrap', gap:'9px' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'9px', marginBottom:'4px', flexWrap:'wrap' }}>
                    <h2 style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'17px', letterSpacing:'-0.5px' }}>{selected.name}</h2>
                    {isClosed
                      ? <span style={{ fontSize:'10px', color:'#444', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'5px', padding:'2px 7px' }}>закрыто</span>
                      : <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#22C55E' }}><span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#22C55E', display:'inline-block', animation:'pulse 1.5s infinite' }}/>live</span>
                    }
                  </div>
                  <div style={{ display:'flex', gap:'14px', fontSize:'11px', color:'#333', flexWrap:'wrap' }}>
                    <span>📸 {photos.length} фото</span>
                    <span>👥 {guestCount} гостей</span>
                    <span>❤️ {totalVotes} лайков</span>
                    <span style={{ color:'#444' }}>код: <b style={{ color:'#C3073F', fontFamily:'monospace' }}>{selected.code}</b></span>
                  </div>
                </div>

                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                  <a href={`/album?event_id=${selected.id}`} target="_blank" style={{ textDecoration:'none' }}><button className="btn-g">📁 Альбом</button></a>
                  <a href={`/live?event_id=${selected.id}`} target="_blank" style={{ textDecoration:'none' }}><button className="btn-g">📺 Live</button></a>
                  {isClosed
                    ? <button className="btn-g" onClick={reopenEvent}>▶ Открыть</button>
                    : <button className="btn-g" onClick={closeEvent} disabled={closing} style={{ borderColor:'rgba(195,7,63,0.3)', color:'#C3073F' }}>
                        {closing ? '...' : '⏹ Закрыть съёмку'}
                      </button>
                  }
                </div>
              </div>

              {/* QR */}
              <div style={{ background:'rgba(195,7,63,0.04)', border:'1px solid rgba(195,7,63,0.12)', borderRadius:'14px', padding:'16px 18px', marginBottom:'14px' }}>
                <div className="lbl" style={{ marginBottom:'14px' }}>QR-код и ссылка</div>
                <QRBlock url={eventUrl}/>
              </div>

              {/* Табы */}
              <div style={{ display:'flex', gap:'3px', marginBottom:'14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px', padding:'3px', width:'fit-content' }}>
                {[['photos',`Фото (${photos.length})`],['stats','Статистика'],['settings','Настройки']].map(([v,l]) => (
                  <button key={v} className={`tab ${tab===v?'act':''}`} onClick={()=>setTab(v)}>{l}</button>
                ))}
              </div>

              {/* ── Фото ── */}
              {tab === 'photos' && (
                photos.length === 0
                  ? <div style={{ textAlign:'center', padding:'60px 0', color:'#2a2a2a', fontSize:'13px' }}>
                      <div style={{ fontSize:'28px', marginBottom:'10px' }}>📸</div>
                      Пока нет фото — жди гостей
                    </div>
                  : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:'5px' }}>
                      {photos.map(photo => (
                        <div key={photo.id} className="photo-wrap">
                          <img src={photo.url} className="photo-thumb" onClick={()=>setLightbox(photo)} title={photo.author||'Гость'}/>
                          {photo.votes > 0 && (
                            <div style={{ position:'absolute', top:'3px', left:'3px', background:'rgba(0,0,0,0.7)', borderRadius:'5px', padding:'1px 5px', fontSize:'9px', color:'#C3073F', fontWeight:700 }}>❤️{photo.votes}</div>
                          )}
                          <button className="photo-del" onClick={()=>deletePhoto(photo.id)} title="Удалить фото">✕</button>
                        </div>
                      ))}
                    </div>
              )}

              {/* ── Статистика ── */}
              {tab === 'stats' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px', maxWidth:'500px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
                    {[['📸',photos.length,'Фото'],['👥',guestCount,'Гостей'],['❤️',totalVotes,'Лайков']].map(([e,v,l]) => (
                      <div key={l} className="stat-box">
                        <div style={{ fontSize:'18px', marginBottom:'5px' }}>{e}</div>
                        <div style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'24px', color:'#F0F0F0' }}>{v}</div>
                        <div style={{ fontSize:'10px', color:'#333', marginTop:'3px' }}>{l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Топ фотографов */}
                  {photos.length > 0 && (
                    <div className="section">
                      <div className="lbl">Топ фотографов</div>
                      {Object.entries(
                        photos.reduce((acc, p) => {
                          const key = p.author || 'Гость'
                          acc[key] = (acc[key] || 0) + 1
                          return acc
                        }, {})
                      ).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name, count]) => (
                        <div key={name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ fontSize:'13px', color:'#888' }}>{name}</span>
                          <span style={{ fontSize:'12px', color:'#C3073F', fontWeight:700 }}>{count} фото</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Топ по лайкам */}
                  {photos.filter(p=>p.votes>0).length > 0 && (
                    <div className="section">
                      <div className="lbl">Популярные фото</div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(70px,1fr))', gap:'5px' }}>
                        {[...photos].sort((a,b)=>(b.votes||0)-(a.votes||0)).slice(0,6).map(photo => (
                          <div key={photo.id} style={{ position:'relative', cursor:'pointer' }} onClick={()=>setLightbox(photo)}>
                            <img src={photo.url} style={{ width:'100%', aspectRatio:'1', objectFit:'cover', borderRadius:'8px', display:'block' }}/>
                            <div style={{ position:'absolute', top:'3px', right:'3px', background:'rgba(0,0,0,0.7)', borderRadius:'5px', padding:'1px 5px', fontSize:'9px', color:'#C3073F', fontWeight:700 }}>❤️{photo.votes}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Настройки ── */}
              {tab === 'settings' && (
                <div style={{ maxWidth:'400px', display:'flex', flexDirection:'column', gap:'10px' }}>
                  <div className="section">
                    <div className="lbl">Параметры события</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

                      <div>
                        <div style={{ fontSize:'11px', color:'#444', marginBottom:'6px' }}>Лимит кадров на гостя</div>
                        <div style={{ display:'flex', gap:'7px' }}>
                          <input className="ai" type="number" min="1" max="200" defaultValue={selected.photo_limit||30} id="s-pl" style={{ maxWidth:'80px', textAlign:'center' }}/>
                          <button className="btn-r" style={{ fontSize:'12px', padding:'8px 13px' }} onClick={async()=>{
                            const v = Number(document.getElementById('s-pl').value)
                            if (!v) return
                            await supabase.from('events').update({ photo_limit:v }).eq('id', selected.id)
                            setSelected(p=>({...p, photo_limit:v}))
                            setEvents(p=>p.map(e=>e.id===selected.id?{...e,photo_limit:v}:e))
                          }}>Сохранить</button>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize:'11px', color:'#444', marginBottom:'6px' }}>Лимит гостей</div>
                        <div style={{ display:'flex', gap:'7px' }}>
                          <input className="ai" type="number" min="1" max="9999" defaultValue={selected.guest_limit||150} id="s-gl" style={{ maxWidth:'80px', textAlign:'center' }}/>
                          <button className="btn-r" style={{ fontSize:'12px', padding:'8px 13px' }} onClick={async()=>{
                            const v = Number(document.getElementById('s-gl').value)
                            if (!v) return
                            await supabase.from('events').update({ guest_limit:v }).eq('id', selected.id)
                            setSelected(p=>({...p, guest_limit:v}))
                          }}>Сохранить</button>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize:'11px', color:'#444', marginBottom:'6px' }}>Время проведения</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px', marginBottom:'8px' }}>
                          <div>
                            <div style={{ fontSize:'10px', color:'#333', marginBottom:'4px' }}>Начало</div>
                            <input className="ai" type="datetime-local" defaultValue={selected.starts_at?.slice(0,16)||''} id="s-st" style={{ fontSize:'10px' }}/>
                          </div>
                          <div>
                            <div style={{ fontSize:'10px', color:'#333', marginBottom:'4px' }}>Конец</div>
                            <input className="ai" type="datetime-local" defaultValue={selected.ends_at?.slice(0,16)||''} id="s-en" style={{ fontSize:'10px' }}/>
                          </div>
                        </div>
                        <button className="btn-r" style={{ fontSize:'12px', padding:'9px', width:'100%' }} onClick={async()=>{
                          const st = document.getElementById('s-st').value
                          const en = document.getElementById('s-en').value
                          await supabase.from('events').update({ starts_at:st||null, ends_at:en||null }).eq('id', selected.id)
                          setSelected(p=>({...p, starts_at:st||null, ends_at:en||null}))
                        }}>Сохранить даты</button>
                      </div>
                    </div>
                  </div>

                  <div className="section">
                    <div className="lbl">Статус съёмки</div>
                    {isClosed
                      ? <button className="btn-g" onClick={reopenEvent} style={{ width:'100%', padding:'10px' }}>▶ Возобновить съёмку</button>
                      : <button onClick={closeEvent} disabled={closing} style={{ width:'100%', padding:'10px', background:'rgba(195,7,63,0.08)', border:'1px solid rgba(195,7,63,0.25)', color:'#C3073F', borderRadius:'9px', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:"'Onest',sans-serif" }}>
                          {closing ? 'Закрываем...' : '⏹ Закрыть съёмку'}
                        </button>
                    }
                  </div>

                  <div className="section">
                    <div className="lbl">Модерация</div>
                    <p style={{ fontSize:'12px', color:'#444', lineHeight:1.6, marginBottom:'10px' }}>
                      Во вкладке «Фото» наведи на любое фото — появится кнопка ✕ для удаления. Удалённое фото пропадает у всех гостей.
                    </p>
                    {photos.length > 0 && (
                      <div style={{ fontSize:'12px', color:'#555' }}>
                        Всего фото в базе: <span style={{ color:'#C3073F', fontWeight:700 }}>{photos.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Лайтбокс */}
      {lightbox && (
        <div onClick={()=>setLightbox(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.96)', zIndex:2000, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'22px', animation:'fadeIn 0.2s ease' }}>
          <button onClick={()=>setLightbox(null)} style={{ position:'absolute', top:'18px', right:'18px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', color:'#fff', width:'36px', height:'36px', borderRadius:'50%', cursor:'pointer', fontSize:'15px', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          <img src={lightbox.url} onClick={e=>e.stopPropagation()} style={{ maxWidth:'100%', maxHeight:'78dvh', objectFit:'contain', borderRadius:'13px', boxShadow:'0 24px 80px rgba(0,0,0,0.8)' }}/>
          <div style={{ marginTop:'12px', textAlign:'center' }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontWeight:700, color:'#F0F0F0', fontSize:'14px' }}>{lightbox.author||'Гость'}</div>
            {lightbox.votes > 0 && <div style={{ color:'#C3073F', fontSize:'12px', marginTop:'3px' }}>❤️ {lightbox.votes} лайков</div>}
            <button onClick={()=>deletePhoto(lightbox.id)} style={{ marginTop:'12px', background:'rgba(195,7,63,0.1)', border:'1px solid rgba(195,7,63,0.3)', color:'#C3073F', borderRadius:'8px', padding:'7px 16px', fontSize:'12px', cursor:'pointer', fontFamily:"'Onest',sans-serif" }}>
              Удалить фото
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(null)
  useEffect(() => { setAuthed(sessionStorage.getItem('tusim_admin') === '1') }, [])
  if (authed === null) return null
  if (!authed) return <><style>{STYLES}</style><LoginScreen onLogin={()=>setAuthed(true)}/></>
  return <><style>{STYLES}</style><AdminPanel onLogout={()=>{ sessionStorage.removeItem('tusim_admin'); setAuthed(false) }}/></>
}