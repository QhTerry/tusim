'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { toast } from '@/app/ui/Toaster'
import Icon from '@/app/ui/Icon'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Onest:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:var(--bg); min-height:100%; }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
  @keyframes fadeIn  { from{opacity:0;} to{opacity:1;} }
  @keyframes pulse   { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
  @keyframes shake   { 0%,100%{transform:translateX(0);} 20%{transform:translateX(-6px);} 40%{transform:translateX(6px);} 60%{transform:translateX(-4px);} 80%{transform:translateX(4px);} }
  @keyframes spin    { to{transform:rotate(360deg);} }

  .fade-up { animation:fadeUp 0.4s cubic-bezier(.22,1,.36,1) both; }
  .fade-in { animation:fadeIn 0.3s ease both; }
  .shake   { animation:shake 0.4s ease; }

  .ai {
    width:100%; padding:13px 16px;
    background:rgba(255,255,255,0.05);
    border:1px solid rgba(255,255,255,0.09);
    border-radius:11px; color:#F0F0F0;
    font-family:'Onest',sans-serif; font-size:14px;
    outline:none; transition:border-color 0.2s, background 0.2s;
    -webkit-appearance:none;
  }
  .ai:focus { border-color:rgba(195,7,63,0.5); background:rgba(195,7,63,0.03); }
  .ai::placeholder { color:#2a2a2a; }
  .ai.err { border-color:rgba(195,7,63,0.6); }

  .btn-r {
    background:linear-gradient(135deg,#C3073F,#950740);
    color:#fff; border:none; border-radius:11px;
    font-family:'Onest',sans-serif; font-weight:700; font-size:14px;
    padding:13px 22px; cursor:pointer;
    transition:transform 0.15s,box-shadow 0.15s;
    white-space:nowrap; -webkit-tap-highlight-color:transparent;
  }
  .btn-r:hover:not(:disabled) { transform:scale(1.02); box-shadow:0 6px 20px rgba(195,7,63,0.3); }
  .btn-r:active:not(:disabled) { transform:scale(0.98); }
  .btn-r:disabled { background:#1a1a1c; color:#444; cursor:not-allowed; }

  .btn-g {
    background:rgba(255,255,255,0.05);
    border:1px solid rgba(255,255,255,0.1);
    color:#666; border-radius:9px;
    font-family:'Onest',sans-serif; font-size:12px; font-weight:500;
    padding:8px 14px; cursor:pointer;
    transition:background 0.15s, color 0.15s, border-color 0.15s;
    white-space:nowrap;
  }
  .btn-g:hover { background:rgba(255,255,255,0.08); color:#999; border-color:rgba(255,255,255,0.18); }

  .ev-card {
    background:#18181b;
    border:1px solid rgba(255,255,255,0.07);
    border-radius:14px; padding:14px 18px;
    cursor:pointer; transition:border-color 0.2s, background 0.2s;
  }
  .ev-card:hover { border-color:rgba(195,7,63,0.3); background:rgba(195,7,63,0.03); }
  .ev-card.act { border-color:#C3073F; background:rgba(195,7,63,0.07); }

  .tab {
    padding:7px 16px; border-radius:8px;
    font-family:'Onest',sans-serif; font-size:13px; font-weight:600;
    cursor:pointer; border:none; transition:background 0.15s, color 0.15s;
  }
  .tab.act { background:rgba(195,7,63,0.18); color:#C3073F; }
  .tab:not(.act) { background:transparent; color:#555; }
  .tab:not(.act):hover { color:#888; }

  .photo-wrap { position:relative; border-radius:10px; overflow:hidden; }
  .photo-thumb { width:100%; aspect-ratio:1; object-fit:cover; display:block; cursor:pointer; transition:transform 0.2s; }
  .photo-thumb:hover { transform:scale(1.04); }
  .photo-del {
    position:absolute; top:4px; right:4px;
    width:24px; height:24px; border-radius:50%;
    background:rgba(195,7,63,0.9); border:none;
    color:#fff; font-size:11px; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    opacity:0; transition:opacity 0.15s;
  }
  .photo-wrap:hover .photo-del { opacity:1; }

  .sidebar {
    overflow-y:auto; max-height:calc(100dvh - 210px);
    scrollbar-width:thin; scrollbar-color:#2a2a2a transparent;
  }
  .sidebar::-webkit-scrollbar { width:3px; }
  .sidebar::-webkit-scrollbar-thumb { background:#2a2a2a; border-radius:3px; }

  .lbl {
    font-size:11px; color:#333;
    text-transform:uppercase; letter-spacing:0.1em;
    font-weight:700; margin-bottom:12px;
  }
  .card { background:#18181b; border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:20px; }
  .stat-box { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:16px; text-align:center; }

  /* Timer preset buttons */
  .preset-btn {
    padding:8px 12px; border-radius:8px; cursor:pointer; font-size:12px;
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
    color:#666; font-family:'Onest',sans-serif; font-weight:600;
    transition:all 0.15s; white-space:nowrap;
  }
  .preset-btn:hover { background:rgba(195,7,63,0.1); border-color:rgba(195,7,63,0.3); color:#C3073F; }
  .preset-btn.sel { background:rgba(195,7,63,0.15); border-color:rgba(195,7,63,0.4); color:#C3073F; }
`

// ── Timer preset helper ───────────────────────────────────────────────────────
function getEndsAt(minutes) {
  const d = new Date(Date.now() + minutes * 60 * 1000)
  return d.toISOString().slice(0, 16)
}

// ── QR Block ──────────────────────────────────────────────────────────────────
function QRBlock({ url }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=16&data=${encodeURIComponent(url)}`
  const [copied, setCopied] = useState(false)
  function copy() { navigator.clipboard.writeText(url); setCopied(true); setTimeout(()=>setCopied(false),2000) }
  function dl() {
    fetch(qrUrl).then(r=>r.blob()).then(blob => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob); a.download = 'tusim-qr.png'; a.click()
    })
  }
  return (
    <div style={{ display:'flex', gap:'20px', alignItems:'flex-start', flexWrap:'wrap' }}>
      <div style={{ background:'#fff', borderRadius:'14px', padding:'12px', flexShrink:0, boxShadow:'0 4px 20px rgba(0,0,0,0.4)' }}>
        <img src={qrUrl} width={140} height={140} alt="QR" style={{ display:'block' }}/>
      </div>
      <div style={{ flex:1, minWidth:'180px' }}>
        <div style={{ fontSize:'12px', color:'#555', marginBottom:'8px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em' }}>Ссылка для гостей</div>
        <div style={{ fontFamily:'monospace', fontSize:'12px', color:'#777', wordBreak:'break-all', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'9px', padding:'10px 13px', marginBottom:'12px', lineHeight:1.5 }}>{url}</div>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          <button className="btn-r" style={{ fontSize:'13px', padding:'10px 18px' }} onClick={copy}>{copied ? <><Icon name="check" size={15} style={{verticalAlign:'-3px',marginRight:6}}/>Скопировано</> : <><Icon name="copy" size={15} style={{verticalAlign:'-3px',marginRight:6}}/>Копировать</>}</button>
          <button className="btn-g" onClick={dl}><Icon name="download" size={15} style={{verticalAlign:'-3px',marginRight:6}}/>Скачать QR</button>
        </div>
      </div>
    </div>
  )
}

// ── Login ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [login, setLogin]     = useState('')
  const [pass, setPass]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [shake, setShake]     = useState(false)

  async function submit() {
    if (!login.trim() || !pass.trim()) return
    setLoading(true); setError('')
    const res  = await fetch('/api/admin-auth', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ login, password:pass }) })
    const data = await res.json()
    if (data.ok) { sessionStorage.setItem('tusim_admin','1'); onLogin() }
    else { setError(data.error||'Неверный логин или пароль'); setShake(true); setTimeout(()=>setShake(false),500) }
    setLoading(false)
  }

  return (
    <main style={{ minHeight:'100dvh', background:'transparent', position:'relative', isolation:'isolate', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:"'Onest',sans-serif" }}><div className="ds-atmos" style={{position:'absolute',zIndex:-1}} aria-hidden="true"><div className="ds-aurora"/><div className="ds-blob ds-blob-1"/><div className="ds-blob ds-blob-2"/></div>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 60% 50% at 50% 0%,rgba(195,7,63,0.1) 0%,transparent 60%)' }}/>
      <div className="fade-up" style={{ width:'100%', maxWidth:'360px' }}>
        <div style={{ textAlign:'center', marginBottom:'36px' }}>
          <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'linear-gradient(135deg,#C3073F,#6F2232)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 8px 32px rgba(195,7,63,0.35)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7-10h-3l-2-2H10L8 5.5H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2v-11a2 2 0 00-2-2z" fill="white"/></svg>
          </div>
          <h1 style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'22px', letterSpacing:'-0.5px', color:'#F0F0F0' }}>tusi<span style={{ color:'#C3073F' }}>'m</span></h1>
          <p style={{ color:'#444', fontSize:'13px', marginTop:'5px' }}>Панель организатора</p>
        </div>
        <div className={shake?'shake':''} style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          <input className={`ai ${error?'err':''}`} placeholder="Логин" value={login} onChange={e=>setLogin(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} autoComplete="username" autoFocus/>
          <input className={`ai ${error?'err':''}`} placeholder="Пароль" type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} autoComplete="current-password"/>
          {error && <div style={{ color:'#C3073F', fontSize:'13px', textAlign:'center', padding:'2px 0' }}>{error}</div>}
          <button className="btn-r" onClick={submit} disabled={loading||!login.trim()||!pass.trim()} style={{ marginTop:'4px', width:'100%', padding:'15px', fontSize:'15px' }}>
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </div>
      </div>
    </main>
  )
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
function AdminPanel({ onLogout }) {
  const [events, setEvents]         = useState([])
  const [selected, setSelected]     = useState(null)
  const [photos, setPhotos]         = useState([])
  const [tab, setTab]               = useState('photos')
  const [lightbox, setLightbox]     = useState(null)
  const [closing, setClosing]       = useState(false)
  const [creating, setCreating]     = useState(false)

  // Create form
  const [eventName, setEventName]   = useState('')
  const [photoLimit, setPhotoLimit] = useState(30)
  const [guestLimit, setGuestLimit] = useState(150)
  const [duration, setDuration]     = useState(120) // минут
  const [selectedPreset, setSelectedPreset] = useState(120)
  const [startNow, setStartNow]     = useState(true)

  const domain = typeof window !== 'undefined' ? window.location.origin : 'https://tusim.vercel.app'

  const PRESETS = [
    { label:'1 ч',    min: 60  },
    { label:'2 ч',    min: 120 },
    { label:'3 ч',    min: 180 },
    { label:'4 ч',    min: 240 },
    { label:'6 ч',    min: 360 },
    { label:'Весь день', min: 720 },
  ]

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

  async function adminAction(payload) {
    const res = await fetch('/api/admin/action', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { toast(data.error || 'Ошибка действия', 'error'); return { ok:false } }
    return { ok:true, ...data }
  }

  async function createEvent() {
    if (!eventName.trim()) return
    setCreating(true)
    const r = await adminAction({ action:'create_event', name: eventName.trim(), photo_limit: photoLimit, guest_limit: guestLimit, duration_min: duration, start_now: startNow })
    if (r.ok && r.event) { setEvents(prev=>[r.event,...prev]); setSelected(r.event); setTab('photos'); setEventName(''); toast('Событие создано','success') }
    setCreating(false)
  }

  async function closeEvent() {
    if (!selected || closing) return
    if (!window.confirm('Закрыть съёмку?')) return
    setClosing(true)
    const r = await adminAction({ action:'update_event', event_id: selected.id, fields:{ status:'closed' } })
    if (r.ok) { const upd = { ...selected, status:'closed' }; setSelected(upd); setEvents(prev=>prev.map(e=>e.id===selected.id?upd:e)); toast('Событие закрыто','success') }
    setClosing(false)
  }

  async function reopenEvent() {
    if (!selected) return
    const endsAt = new Date(Date.now() + 120 * 60 * 1000).toISOString() // +2ч
    const r = await adminAction({ action:'update_event', event_id: selected.id, fields:{ status:'active', ends_at: endsAt } })
    if (r.ok) { const upd = { ...selected, status:'active', ends_at: endsAt }; setSelected(upd); setEvents(prev=>prev.map(e=>e.id===selected.id?upd:e)); toast('Событие продлено','success') }
  }

  async function deletePhoto(photoId) {
    const r = await adminAction({ action:'delete_photo', photo_id: photoId })
    if (!r.ok) return
    setPhotos(prev => prev.filter(p => p.id !== photoId))
    if (lightbox?.id === photoId) setLightbox(null)
  }

  // Live countdown
  function useCountdown(endsAt) {
    const [ms, setMs] = useState(0)
    useEffect(() => {
      if (!endsAt) return
      const tick = () => setMs(Math.max(0, new Date(endsAt) - Date.now()))
      tick(); const t = setInterval(tick, 1000); return () => clearInterval(t)
    }, [endsAt])
    return ms
  }

  function formatCountdown(ms) {
    if (ms <= 0) return 'Завершено'
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    if (h > 0) return `${h}ч ${String(m).padStart(2,'0')}м`
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  const guestCount = new Set(photos.map(p=>p.device_id)).size
  const totalVotes = photos.reduce((s,p)=>s+(p.votes||0), 0)
  const isClosed   = selected?.status === 'closed'
  const eventUrl   = selected ? `${domain}/event/${selected.code}` : ''

  function CountdownBadge({ endsAt, status }) {
    const ms = useCountdown(endsAt)
    if (status === 'closed') return <span style={{ fontSize:'11px', color:'#444', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'6px', padding:'3px 8px' }}>закрыто</span>
    if (!endsAt) return <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'#22C55E' }}><span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#22C55E', display:'inline-block', animation:'pulse 1.5s infinite' }}/>активно</span>
    const color = ms < 15*60*1000 ? '#C3073F' : ms < 60*60*1000 ? '#F59E0B' : '#22C55E'
    return <span style={{ fontSize:'12px', color, fontFamily:"'Unbounded',sans-serif", fontWeight:900 }}>{formatCountdown(ms)}</span>
  }

  return (
    <main style={{ minHeight:'100dvh', background:'transparent', position:'relative', isolation:'isolate', color:'#F0F0F0', fontFamily:"'Onest',sans-serif" }}><div className="ds-atmos" style={{position:'absolute',zIndex:-1}} aria-hidden="true"><div className="ds-aurora"/><div className="ds-blob ds-blob-1"/><div className="ds-blob ds-blob-2"/></div>

      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:100, background:'rgba(14,14,16,0.95)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:'58px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'9px', background:'linear-gradient(135deg,#C3073F,#6F2232)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7-10h-3l-2-2H10L8 5.5H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2v-11a2 2 0 00-2-2z" fill="white"/></svg>
          </div>
          <span style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'15px', letterSpacing:'-0.5px' }}>tusi<span style={{ color:'#C3073F' }}>'m</span></span>
          <span style={{ fontSize:'10px', color:'#333', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'5px', padding:'2px 7px', fontWeight:600 }}>admin</span>
        </div>
        <button className="btn-g" onClick={onLogout}>Выйти</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', minHeight:'calc(100dvh - 58px)' }}>

        {/* Sidebar */}
        <div style={{ borderRight:'1px solid rgba(255,255,255,0.06)', padding:'20px 16px', display:'flex', flexDirection:'column', gap:'18px' }}>

          {/* Create event */}
          <div>
            <div className="lbl">Новое мероприятие</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <input className="ai" placeholder="Название события" value={eventName} onChange={e=>setEventName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createEvent()}/>

              {/* Duration presets */}
              <div>
                <div style={{ fontSize:'12px', color:'#555', marginBottom:'8px', fontWeight:600 }}>Продолжительность</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {PRESETS.map(p => (
                    <button key={p.min} className={`preset-btn ${selectedPreset===p.min?'sel':''}`}
                      onClick={() => { setSelectedPreset(p.min); setDuration(p.min) }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom duration */}
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <input className="ai" type="number" min="15" max="1440" value={duration}
                  onChange={e => { setDuration(Number(e.target.value)); setSelectedPreset(null) }}
                  style={{ textAlign:'center', fontSize:'14px' }}/>
                <span style={{ fontSize:'12px', color:'#555', flexShrink:0 }}>минут</span>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                <div>
                  <div style={{ fontSize:'12px', color:'#555', marginBottom:'6px', fontWeight:500 }}>Кадров</div>
                  <input className="ai" type="number" min="1" max="200" value={photoLimit} onChange={e=>setPhotoLimit(Number(e.target.value))} style={{ textAlign:'center' }}/>
                </div>
                <div>
                  <div style={{ fontSize:'12px', color:'#555', marginBottom:'6px', fontWeight:500 }}>Гостей</div>
                  <input className="ai" type="number" min="1" max="9999" value={guestLimit} onChange={e=>setGuestLimit(Number(e.target.value))} style={{ textAlign:'center' }}/>
                </div>
              </div>

              <button className="btn-r" onClick={createEvent} disabled={creating||!eventName.trim()} style={{ fontSize:'14px', padding:'13px', width:'100%' }}>
                {creating ? 'Создаём...' : '+ Создать мероприятие'}
              </button>
            </div>
          </div>

          {/* Events list */}
          {events.length > 0 && (
            <div style={{ flex:1 }}>
              <div className="lbl">Мероприятия ({events.length})</div>
              <div className="sidebar" style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {events.map(ev => (
                  <div key={ev.id} className={`ev-card ${selected?.id===ev.id?'act':''}`} onClick={()=>{ setSelected(ev); setTab('photos') }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px', marginBottom:'6px' }}>
                      <div style={{ fontWeight:700, fontSize:'14px', color:'#F0F0F0', lineHeight:1.3 }}>{ev.name}</div>
                      <CountdownBadge endsAt={ev.ends_at} status={ev.status}/>
                    </div>
                    <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                      <span style={{ fontSize:'11px', color:'#C3073F', fontFamily:'monospace', fontWeight:700, background:'rgba(195,7,63,0.12)', padding:'2px 7px', borderRadius:'5px' }}>{ev.code}</span>
                      <span style={{ fontSize:'11px', color:'#2a2a2a' }}>{ev.photo_limit} кадров</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main area */}
        <div style={{ padding:'20px 28px' }}>
          {!selected ? (
            <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'12px', color:'#1e1e1e' }}>
              <div style={{ fontSize:'40px' }}>←</div>
              <div style={{ fontSize:'14px' }}>Выбери мероприятие</div>
            </div>
          ) : (
            <div className="fade-in">

              {/* Event header */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'18px', flexWrap:'wrap', gap:'10px' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px', flexWrap:'wrap' }}>
                    <h2 style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'20px', letterSpacing:'-0.5px', color:'#F0F0F0' }}>{selected.name}</h2>
                    <CountdownBadge endsAt={selected.ends_at} status={selected.status}/>
                  </div>
                  <div style={{ display:'flex', gap:'16px', fontSize:'13px', color:'#555', flexWrap:'wrap' }}>
                    <span><Icon name="images" size={14} style={{verticalAlign:'-2px',marginRight:5}}/><b style={{ color:'#888' }}>{photos.length}</b> фото</span>
                    <span><Icon name="users" size={14} style={{verticalAlign:'-2px',marginRight:5}}/><b style={{ color:'#888' }}>{guestCount}</b> гостей</span>
                    <span><Icon name="heart" size={14} style={{verticalAlign:'-2px',marginRight:5}}/><b style={{ color:'#888' }}>{totalVotes}</b> лайков</span>
                    <span>код: <b style={{ color:'#C3073F', fontFamily:'monospace', fontSize:'14px' }}>{selected.code}</b></span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  <a href={`/album?event_id=${selected.id}`} target="_blank" style={{ textDecoration:'none' }}><button className="btn-g"><Icon name="images" size={15} style={{verticalAlign:'-3px',marginRight:6}}/>Альбом</button></a>
                  <a href={`/live?event_id=${selected.id}`} target="_blank" style={{ textDecoration:'none' }}><button className="btn-g"><Icon name="eye" size={15} style={{verticalAlign:'-3px',marginRight:6}}/>Live</button></a>
                  {isClosed
                    ? <button className="btn-g" onClick={reopenEvent}><Icon name="play" size={14} style={{verticalAlign:'-2px',marginRight:5}}/>Открыть +2ч</button>
                    : <button className="btn-g" onClick={closeEvent} disabled={closing} style={{ borderColor:'rgba(195,7,63,0.35)', color:'#C3073F' }}>
                        {closing ? '...' : <><Icon name="stop" size={14} style={{verticalAlign:'-2px',marginRight:5}}/>Закрыть</>}
                      </button>
                  }
                </div>
              </div>

              {/* QR */}
              <div style={{ background:'rgba(195,7,63,0.04)', border:'1px solid rgba(195,7,63,0.14)', borderRadius:'16px', padding:'18px 20px', marginBottom:'16px' }}>
                <div className="lbl" style={{ marginBottom:'14px' }}>QR-код и ссылка</div>
                <QRBlock url={eventUrl}/>
              </div>

              {/* Tabs */}
              <div style={{ display:'flex', gap:'3px', marginBottom:'16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'11px', padding:'3px', width:'fit-content' }}>
                {[['photos',`Фото (${photos.length})`],['stats','Статистика'],['settings','Настройки']].map(([v,l]) => (
                  <button key={v} className={`tab ${tab===v?'act':''}`} onClick={()=>setTab(v)}>{l}</button>
                ))}
              </div>

              {/* Photos tab */}
              {tab === 'photos' && (
                photos.length === 0
                  ? <div style={{ textAlign:'center', padding:'60px 0', color:'#2a2a2a', fontSize:'14px' }}>
                      <div style={{ marginBottom:'12px', color:'#2f2f2f' }}><Icon name="camera" size={36} stroke={1.5}/></div>
                      Пока нет фото — жди гостей
                    </div>
                  : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(95px,1fr))', gap:'6px' }}>
                      {photos.map(photo => (
                        <div key={photo.id} className="photo-wrap">
                          <img src={photo.url} className="photo-thumb" onClick={()=>setLightbox(photo)} title={photo.author||'Гость'}/>
                          {photo.votes > 0 && <div style={{ position:'absolute', top:'4px', left:'4px', background:'rgba(0,0,0,0.72)', borderRadius:'6px', padding:'2px 6px', fontSize:'10px', color:'#C3073F', fontWeight:700, display:'flex', alignItems:'center', gap:2 }}><Icon name="heart" size={10} stroke={2.4}/>{photo.votes}</div>}
                          <button className="photo-del" onClick={()=>deletePhoto(photo.id)}><Icon name="x" size={13} stroke={2.4}/></button>
                        </div>
                      ))}
                    </div>
              )}

              {/* Stats tab */}
              {tab === 'stats' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'14px', maxWidth:'520px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
                    {[['images',photos.length,'Фото'],['users',guestCount,'Гостей'],['heart',totalVotes,'Лайков']].map(([e,v,l]) => (
                      <div key={l} className="stat-box">
                        <div style={{ marginBottom:'6px', color:'#C3073F', display:'flex', justifyContent:'center' }}><Icon name={e} size={24}/></div>
                        <div style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'28px', color:'#F0F0F0', lineHeight:1 }}>{v}</div>
                        <div style={{ fontSize:'12px', color:'#444', marginTop:'5px', fontWeight:600 }}>{l}</div>
                      </div>
                    ))}
                  </div>

                  {photos.length > 0 && (
                    <div className="card">
                      <div className="lbl">Топ фотографов</div>
                      {Object.entries(photos.reduce((acc,p)=>{ const k=p.author||'Гость'; acc[k]=(acc[k]||0)+1; return acc },{}))
                        .sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,count],i) => (
                        <div key={name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                            <span style={{ fontSize:'12px', color:'#333', width:'20px' }}>#{i+1}</span>
                            <span style={{ fontSize:'14px', color:'#888', fontWeight:500 }}>{name}</span>
                          </div>
                          <span style={{ fontSize:'13px', color:'#C3073F', fontWeight:700 }}>{count} фото</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {photos.filter(p=>p.votes>0).length > 0 && (
                    <div className="card">
                      <div className="lbl">Популярные фото</div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(75px,1fr))', gap:'6px' }}>
                        {[...photos].sort((a,b)=>(b.votes||0)-(a.votes||0)).slice(0,6).map(photo => (
                          <div key={photo.id} style={{ position:'relative', cursor:'pointer' }} onClick={()=>setLightbox(photo)}>
                            <img src={photo.url} style={{ width:'100%', aspectRatio:'1', objectFit:'cover', borderRadius:'9px', display:'block' }}/>
                            <div style={{ position:'absolute', top:'3px', right:'3px', background:'rgba(0,0,0,0.75)', borderRadius:'5px', padding:'2px 6px', fontSize:'10px', color:'#C3073F', fontWeight:700, display:'flex', alignItems:'center', gap:2 }}><Icon name="heart" size={10} stroke={2.4}/>{photo.votes}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Settings tab */}
              {tab === 'settings' && (
                <div style={{ maxWidth:'440px', display:'flex', flexDirection:'column', gap:'12px' }}>
                  <div className="card">
                    <div className="lbl">Параметры</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                      <div>
                        <div style={{ fontSize:'13px', color:'#666', marginBottom:'8px', fontWeight:500 }}>Лимит кадров</div>
                        <div style={{ display:'flex', gap:'8px' }}>
                          <input className="ai" type="number" min="1" max="200" defaultValue={selected.photo_limit||30} id="s-pl" style={{ maxWidth:'90px', textAlign:'center' }}/>
                          <button className="btn-r" style={{ fontSize:'13px', padding:'10px 16px' }} onClick={async()=>{
                            const v=Number(document.getElementById('s-pl').value); if(!v) return
                            const r=await adminAction({ action:'update_event', event_id:selected.id, fields:{ photo_limit:v } }); if(!r.ok) return
                            setSelected(p=>({...p,photo_limit:v})); setEvents(p=>p.map(e=>e.id===selected.id?{...e,photo_limit:v}:e)); toast('Лимит кадров обновлён','success')
                          }}>Сохранить</button>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:'13px', color:'#666', marginBottom:'8px', fontWeight:500 }}>Лимит гостей</div>
                        <div style={{ display:'flex', gap:'8px' }}>
                          <input className="ai" type="number" min="1" max="9999" defaultValue={selected.guest_limit||150} id="s-gl" style={{ maxWidth:'90px', textAlign:'center' }}/>
                          <button className="btn-r" style={{ fontSize:'13px', padding:'10px 16px' }} onClick={async()=>{
                            const v=Number(document.getElementById('s-gl').value); if(!v) return
                            const r=await adminAction({ action:'update_event', event_id:selected.id, fields:{ guest_limit:v } }); if(!r.ok) return
                            setSelected(p=>({...p,guest_limit:v})); toast('Лимит гостей обновлён','success')
                          }}>Сохранить</button>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:'13px', color:'#666', marginBottom:'8px', fontWeight:500 }}>Продлить на</div>
                        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                          {[30,60,120].map(m => (
                            <button key={m} className="btn-g" onClick={async()=>{
                              const current = selected.ends_at ? new Date(selected.ends_at) : new Date()
                              const base = current < new Date() ? new Date() : current
                              const newEnd = new Date(base.getTime() + m*60*1000).toISOString()
                              const r=await adminAction({ action:'update_event', event_id:selected.id, fields:{ ends_at:newEnd, status:'active' } }); if(!r.ok) return
                              setSelected(p=>({...p,ends_at:newEnd,status:'active'}))
                              setEvents(p=>p.map(e=>e.id===selected.id?{...e,ends_at:newEnd,status:'active'}:e))
                            }}>+{m < 60 ? m+'мин' : m/60+'ч'}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="lbl">Статус</div>
                    {isClosed
                      ? <button className="btn-g" onClick={reopenEvent} style={{ width:'100%', padding:'12px', fontSize:'14px' }}><Icon name="play" size={15} style={{verticalAlign:'-3px',marginRight:6}}/>Возобновить (+2 часа)</button>
                      : <button onClick={closeEvent} disabled={closing} style={{ width:'100%', padding:'12px', background:'rgba(195,7,63,0.08)', border:'1px solid rgba(195,7,63,0.28)', color:'#C3073F', borderRadius:'10px', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:"'Onest',sans-serif", transition:'background 0.15s' }}>
                          {closing ? 'Закрываем...' : <><Icon name="stop" size={15} style={{verticalAlign:'-3px',marginRight:6}}/>Закрыть съёмку</>}
                        </button>
                    }
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={()=>setLightbox(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.96)', zIndex:2000, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', animation:'fadeIn 0.18s ease' }}>
          <button onClick={()=>setLightbox(null)} style={{ position:'absolute', top:'18px', right:'18px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', color:'#fff', width:'38px', height:'38px', borderRadius:'50%', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="x" size={17} stroke={2.2}/></button>
          <img src={lightbox.url} onClick={e=>e.stopPropagation()} style={{ maxWidth:'100%', maxHeight:'78dvh', objectFit:'contain', borderRadius:'14px', boxShadow:'0 24px 80px rgba(0,0,0,0.8)' }}/>
          <div style={{ marginTop:'14px', textAlign:'center' }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontWeight:700, color:'#F0F0F0', fontSize:'15px', marginBottom:'4px' }}>{lightbox.author||'Гость'}</div>
            {lightbox.votes > 0 && <div style={{ color:'#C3073F', fontSize:'13px', marginBottom:'10px', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}><Icon name="heart" size={13} stroke={2.2}/>{lightbox.votes} лайков</div>}
            <button onClick={()=>deletePhoto(lightbox.id)} style={{ background:'rgba(195,7,63,0.1)', border:'1px solid rgba(195,7,63,0.3)', color:'#C3073F', borderRadius:'9px', padding:'8px 18px', fontSize:'13px', cursor:'pointer', fontFamily:"'Onest',sans-serif", fontWeight:600 }}>
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
  return <><style>{STYLES}</style><AdminPanel onLogout={()=>{ fetch('/api/admin-auth',{method:'DELETE'}).catch(()=>{}); sessionStorage.removeItem('tusim_admin'); setAuthed(false) }}/></>
}