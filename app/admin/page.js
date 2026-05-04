'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const PLANS = {
  basic:    { name:'Базовый',  price:990,  color:'#555',    defaults:{ guest_limit:50,   photo_limit:10 }, features:{ live:false, voting:false, nominations:false }, description:'До 50 гостей · 10 кадров · Альбом' },
  standard: { name:'Стандарт', price:2490, color:'#C3073F', defaults:{ guest_limit:150,  photo_limit:30 }, features:{ live:false, voting:true,  nominations:true  }, description:'До 150 гостей · 30 кадров · Голосование' },
  premium:  { name:'Премиум',  price:4990, color:'#F59E0B', defaults:{ guest_limit:9999, photo_limit:50 }, features:{ live:true,  voting:true,  nominations:true  }, description:'Без лимита · 50 кадров · Live экран' },
}
const ADDONS = [
  { id:'extra_photos', label:'+20 кадров на гостя', price:500 },
  { id:'live',         label:'Live экран для ТВ',   price:990 },
  { id:'nominations',  label:'Свои номинации',      price:490 },
]

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Onest:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#111113; min-height:100%; }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
  @keyframes fadeIn  { from{opacity:0;} to{opacity:1;} }
  @keyframes pulse   { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
  @keyframes shake   { 0%,100%{transform:translateX(0);} 20%{transform:translateX(-7px);} 40%{transform:translateX(7px);} 60%{transform:translateX(-4px);} 80%{transform:translateX(4px);} }

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

  .plan-card { border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:14px; cursor:pointer; transition:border-color 0.2s,background 0.2s; background:#161618; }
  .addon-row { display:flex; align-items:center; justify-content:space-between; padding:9px 13px; border-radius:9px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); cursor:pointer; transition:background 0.15s; }
  .addon-row.sel { background:rgba(195,7,63,0.07); border-color:rgba(195,7,63,0.2); }

  .photo-thumb { width:100%; aspect-ratio:1; object-fit:cover; border-radius:8px; cursor:pointer; transition:opacity 0.2s,transform 0.2s; }
  .photo-thumb:hover { opacity:0.85; transform:scale(1.03); }

  .sidebar { overflow-y:auto; max-height:calc(100dvh - 270px); scrollbar-width:thin; scrollbar-color:#2a2a2a transparent; }
  .sidebar::-webkit-scrollbar { width:3px; }
  .sidebar::-webkit-scrollbar-thumb { background:#2a2a2a; border-radius:3px; }

  .lbl { font-size:11px; color:#2a2a2a; text-transform:uppercase; letter-spacing:0.1em; font-weight:600; margin-bottom:11px; }
  .section { background:#161618; border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:18px; }
`

// ── QR компонент ──────────────────────────────────────────────────────────────
function QRBlock({ url }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=16&data=${encodeURIComponent(url)}`

  function downloadQR() {
    fetch(qrUrl)
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'tusim-qr.png'
        a.click()
        URL.revokeObjectURL(a.href)
      })
  }

  return (
    <div style={{ display:'flex', gap:'20px', alignItems:'flex-start', flexWrap:'wrap' }}>
      {/* QR */}
      <div style={{ background:'#fff', borderRadius:'14px', padding:'12px', display:'inline-block', flexShrink:0 }}>
        <img src={qrUrl} width={140} height={140} alt="QR" style={{ display:'block' }}/>
      </div>
      {/* Инфо */}
      <div style={{ flex:1, minWidth:'180px' }}>
        <div style={{ fontSize:'11px', color:'#333', marginBottom:'8px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Ссылка для гостей</div>
        <div style={{ fontFamily:'monospace', fontSize:'12px', color:'#666', wordBreak:'break-all', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'8px', padding:'8px 12px', marginBottom:'12px' }}>{url}</div>
        <div style={{ display:'flex', gap:'7px', flexWrap:'wrap' }}>
          <button className="btn-r" style={{ fontSize:'12px', padding:'9px 16px' }} onClick={() => { navigator.clipboard.writeText(url) }}>
            Копировать ссылку
          </button>
          <button className="btn-g" onClick={downloadQR} style={{ fontSize:'12px' }}>
            ⬇ Скачать QR
          </button>
        </div>
        <div style={{ fontSize:'11px', color:'#2a2a2a', marginTop:'10px', lineHeight:1.6 }}>
          Распечатай QR и расставь по залу.<br/>Гость сканирует — и сразу снимает.
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
  const [tab, setTab]             = useState('photos')
  const [lightbox, setLightbox]   = useState(null)
  const [copied, setCopied]       = useState(false)
  const [closing, setClosing]     = useState(false)

  const [eventName, setEventName] = useState('')
  const [plan, setPlan]           = useState('standard')
  const [addons, setAddons]       = useState([])
  const [guestLimit, setGuestLimit] = useState(150)
  const [photoLimit, setPhotoLimit] = useState(30)
  const [startsAt, setStartsAt]   = useState('')
  const [endsAt, setEndsAt]       = useState('')
  const [creating, setCreating]   = useState(false)

  const domain = typeof window !== 'undefined' ? window.location.origin : 'https://tusim.vercel.app'

  const planData   = PLANS[plan]
  const addonsCost = addons.reduce((s,id) => s+(ADDONS.find(a=>a.id===id)?.price||0), 0)
  const totalPrice = planData.price + addonsCost

  useEffect(() => { loadEvents() }, [])
  useEffect(() => { setGuestLimit(PLANS[plan].defaults.guest_limit); setPhotoLimit(PLANS[plan].defaults.photo_limit) }, [plan])

  useEffect(() => {
    if (!selected) return
    loadPhotos(selected.id)
    const ch = supabase.channel(`adm-${selected.id}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'photos', filter:`event_id=eq.${selected.id}` }, p => setPhotos(prev=>[p.new,...prev]))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [selected])

  async function loadEvents() {
    const { data } = await supabase.from('events').select('*').order('created_at',{ ascending:false })
    if (data) setEvents(data)
  }
  async function loadPhotos(eid) {
    const { data } = await supabase.from('photos').select('*').eq('event_id',eid).order('created_at',{ ascending:false })
    if (data) setPhotos(data)
  }
  async function createEvent() {
    if (!eventName.trim()) return
    setCreating(true)
    const code = Math.random().toString(36).substring(2,8).toUpperCase()
    const { data } = await supabase.from('events').insert({ name:eventName.trim(), code, photo_limit:photoLimit, guest_limit:guestLimit, plan, status:'active', plan_features:{ ...planData.features, addons }, starts_at:startsAt||null, ends_at:endsAt||null }).select().single()
    if (data) { setEvents(prev=>[data,...prev]); setSelected(data); setEventName(''); setStartsAt(''); setEndsAt('') }
    setCreating(false)
  }
  async function closeEvent() {
    if (!selected||closing) return
    if (!confirm('Закрыть съёмку?')) return
    setClosing(true)
    await supabase.from('events').update({ status:'closed' }).eq('id',selected.id)
    const upd = { ...selected, status:'closed' }
    setSelected(upd); setEvents(prev=>prev.map(e=>e.id===selected.id?upd:e))
    setClosing(false)
  }
  async function reopenEvent() {
    if (!selected) return
    await supabase.from('events').update({ status:'active' }).eq('id',selected.id)
    const upd = { ...selected, status:'active' }
    setSelected(upd); setEvents(prev=>prev.map(e=>e.id===selected.id?upd:e))
  }
  function copyLink() { navigator.clipboard.writeText(`${domain}/event/${selected.code}`); setCopied(true); setTimeout(()=>setCopied(false),2000) }
  function toggleAddon(id) { setAddons(prev=>prev.includes(id)?prev.filter(a=>a!==id):[...prev,id]) }

  const guestCount = new Set(photos.map(p=>p.device_id)).size
  const totalVotes = photos.reduce((s,p)=>s+(p.votes||0),0)
  const isClosed   = selected?.status==='closed'
  const eventUrl   = selected ? `${domain}/event/${selected.code}` : ''

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

        {/* Сайдбар */}
        <div style={{ borderRight:'1px solid rgba(255,255,255,0.05)', padding:'18px 14px', display:'flex', flexDirection:'column', gap:'16px' }}>

          <div>
            <div className="lbl">Новое мероприятие</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              <input className="ai" placeholder="Название события" value={eventName} onChange={e=>setEventName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createEvent()}/>

              {Object.entries(PLANS).map(([key,p]) => (
                <div key={key} className="plan-card" style={{ borderColor:plan===key?p.color:'rgba(255,255,255,0.07)', background:plan===key?'rgba(195,7,63,0.05)':'#161618' }} onClick={()=>setPlan(key)}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'2px' }}>
                    <span style={{ fontWeight:700, fontSize:'12px', color:plan===key?p.color:'#666' }}>{p.name}</span>
                    <span style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'12px', color:plan===key?p.color:'#444' }}>{p.price.toLocaleString()} ₽</span>
                  </div>
                  <div style={{ fontSize:'10px', color:'#2a2a2a' }}>{p.description}</div>
                </div>
              ))}

              {ADDONS.map(a => {
                const included = planData.features[a.id]
                return (
                  <div key={a.id} className={`addon-row ${addons.includes(a.id)||included?'sel':''}`} onClick={()=>!included&&toggleAddon(a.id)} style={{ opacity:included?0.55:1, cursor:included?'default':'pointer' }}>
                    <span style={{ fontSize:'11px', color:addons.includes(a.id)||included?'#C3073F':'#444' }}>{included?'✓ ':addons.includes(a.id)?'✓ ':'+ '}{a.label}</span>
                    {!included && <span style={{ fontSize:'10px', color:'#333', fontWeight:600 }}>+{a.price} ₽</span>}
                    {included  && <span style={{ fontSize:'10px', color:'#222' }}>вкл.</span>}
                  </div>
                )
              })}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
                <div><div style={{ fontSize:'10px', color:'#222', marginBottom:'4px' }}>Гостей</div><input className="ai" type="number" min="1" max="9999" value={guestLimit} onChange={e=>setGuestLimit(Number(e.target.value))} style={{ textAlign:'center', fontSize:'13px' }}/></div>
                <div><div style={{ fontSize:'10px', color:'#222', marginBottom:'4px' }}>Кадров</div><input className="ai" type="number" min="1" max="200" value={photoLimit} onChange={e=>setPhotoLimit(Number(e.target.value))} style={{ textAlign:'center', fontSize:'13px' }}/></div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
                <div><div style={{ fontSize:'10px', color:'#222', marginBottom:'4px' }}>Начало</div><input className="ai" type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} style={{ fontSize:'10px' }}/></div>
                <div><div style={{ fontSize:'10px', color:'#222', marginBottom:'4px' }}>Конец</div><input className="ai" type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)} style={{ fontSize:'10px' }}/></div>
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 13px', background:'rgba(195,7,63,0.06)', border:'1px solid rgba(195,7,63,0.14)', borderRadius:'9px' }}>
                <span style={{ fontSize:'11px', color:'#666' }}>Итого</span>
                <span style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'15px', color:'#C3073F' }}>{totalPrice.toLocaleString()} ₽</span>
              </div>

              <button className="btn-r" onClick={createEvent} disabled={creating||!eventName.trim()} style={{ fontSize:'13px', padding:'11px' }}>
                {creating?'Создаём...':'+ Создать'}
              </button>
            </div>
          </div>

          {events.length > 0 && (
            <div style={{ flex:1 }}>
              <div className="lbl">Мероприятия ({events.length})</div>
              <div className="sidebar" style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                {events.map(ev => (
                  <div key={ev.id} className={`ev-card ${selected?.id===ev.id?'act':''}`} onClick={()=>{ setSelected(ev); setTab('photos') }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div style={{ fontWeight:600, fontSize:'13px', color:'#F0F0F0', marginBottom:'4px', flex:1 }}>{ev.name}</div>
                      {ev.status==='closed' && <span style={{ fontSize:'9px', color:'#444', background:'rgba(255,255,255,0.04)', borderRadius:'4px', padding:'1px 5px', flexShrink:0, marginLeft:'5px' }}>закрыто</span>}
                    </div>
                    <div style={{ display:'flex', gap:'7px' }}>
                      <span style={{ fontSize:'10px', color:'#C3073F', fontFamily:'monospace', fontWeight:700, background:'rgba(195,7,63,0.1)', padding:'1px 5px', borderRadius:'4px' }}>{ev.code}</span>
                      <span style={{ fontSize:'10px', color:'#222' }}>{PLANS[ev.plan]?.name||'—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Правая часть */}
        <div style={{ padding:'18px 22px' }}>
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
                  <div style={{ display:'flex', alignItems:'center', gap:'9px', marginBottom:'4px' }}>
                    <h2 style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'17px', letterSpacing:'-0.5px' }}>{selected.name}</h2>
                    {isClosed
                      ? <span style={{ fontSize:'10px', color:'#444', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'5px', padding:'2px 7px' }}>закрыто</span>
                      : <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#22C55E' }}><span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#22C55E', display:'inline-block', animation:'pulse 1.5s infinite' }}/>live</span>
                    }
                  </div>
                  <div style={{ display:'flex', gap:'12px', fontSize:'11px', color:'#333' }}>
                    <span>{photos.length} фото</span><span>{guestCount} гостей</span><span>{totalVotes} лайков</span>
                    <span style={{ color:'#C3073F' }}>{PLANS[selected.plan]?.name||'—'}</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                  <button className="btn-g" onClick={copyLink}>{copied?'✓ Скопировано':'🔗 Ссылка'}</button>
                  <a href={`/album?event_id=${selected.id}`} target="_blank" style={{ textDecoration:'none' }}><button className="btn-g">📁 Альбом</button></a>
                  <a href={`/live?event_id=${selected.id}`} target="_blank" style={{ textDecoration:'none' }}><button className="btn-g">📺 Live</button></a>
                  {isClosed
                    ? <button className="btn-g" onClick={reopenEvent}>▶ Открыть</button>
                    : <button className="btn-g" onClick={closeEvent} disabled={closing} style={{ borderColor:'rgba(195,7,63,0.3)', color:'#C3073F' }}>{closing?'...':'⏹ Закрыть'}</button>
                  }
                </div>
              </div>

              {/* QR блок */}
              <div style={{ background:'rgba(195,7,63,0.04)', border:'1px solid rgba(195,7,63,0.12)', borderRadius:'14px', padding:'16px 18px', marginBottom:'14px' }}>
                <div className="lbl" style={{ marginBottom:'14px' }}>QR-код и ссылка для гостей</div>
                <QRBlock url={eventUrl}/>
              </div>

              {/* Табы */}
              <div style={{ display:'flex', gap:'3px', marginBottom:'14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px', padding:'3px', width:'fit-content' }}>
                {[['photos',`Фото (${photos.length})`],['stats','Статистика'],['settings','Настройки']].map(([v,l]) => (
                  <button key={v} className={`tab ${tab===v?'act':''}`} onClick={()=>setTab(v)}>{l}</button>
                ))}
              </div>

              {/* Фото */}
              {tab==='photos' && (
                photos.length === 0
                  ? <div style={{ textAlign:'center', padding:'60px 0', color:'#2a2a2a', fontSize:'13px' }}><div style={{ fontSize:'28px', marginBottom:'10px' }}>📸</div>Пока нет фото</div>
                  : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(85px,1fr))', gap:'5px' }}>
                      {photos.map(photo => (
                        <div key={photo.id} style={{ position:'relative' }}>
                          <img src={photo.url} className="photo-thumb" onClick={()=>setLightbox(photo)} title={photo.author||'Гость'}/>
                          {photo.votes>0 && <div style={{ position:'absolute', top:'3px', right:'3px', background:'rgba(0,0,0,0.7)', borderRadius:'5px', padding:'1px 5px', fontSize:'9px', color:'#C3073F', fontWeight:700 }}>❤️{photo.votes}</div>}
                        </div>
                      ))}
                    </div>
              )}

              {/* Статистика */}
              {tab==='stats' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'10px', maxWidth:'480px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                    {[['📸',photos.length,'Фото'],['👥',guestCount,'Гостей'],['❤️',totalVotes,'Лайков']].map(([e,v,l]) => (
                      <div key={l} className="section" style={{ textAlign:'center' }}>
                        <div style={{ fontSize:'18px', marginBottom:'5px' }}>{e}</div>
                        <div style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'22px', color:'#F0F0F0' }}>{v}</div>
                        <div style={{ fontSize:'10px', color:'#333', marginTop:'3px' }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="section">
                    <div className="lbl">Тариф</div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ fontWeight:700, color:'#C3073F', fontSize:'14px' }}>{PLANS[selected.plan]?.name||'—'}</div>
                        <div style={{ fontSize:'11px', color:'#333', marginTop:'2px' }}>{PLANS[selected.plan]?.description}</div>
                      </div>
                      <div style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'17px', color:'#C3073F' }}>{PLANS[selected.plan]?.price.toLocaleString()} ₽</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Настройки */}
              {tab==='settings' && (
                <div style={{ maxWidth:'400px', display:'flex', flexDirection:'column', gap:'10px' }}>
                  <div className="section">
                    <div className="lbl">Параметры</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                      <div>
                        <div style={{ fontSize:'11px', color:'#444', marginBottom:'6px' }}>Код события</div>
                        <div style={{ fontFamily:'monospace', fontSize:'20px', fontWeight:700, color:'#C3073F', letterSpacing:'0.1em' }}>{selected.code}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:'11px', color:'#444', marginBottom:'6px' }}>Лимит кадров</div>
                        <div style={{ display:'flex', gap:'7px' }}>
                          <input className="ai" type="number" min="1" max="200" defaultValue={selected.photo_limit||30} id="s-pl" style={{ maxWidth:'80px', textAlign:'center' }}/>
                          <button className="btn-r" style={{ fontSize:'12px', padding:'8px 13px' }} onClick={async()=>{ const v=Number(document.getElementById('s-pl').value); if(!v)return; await supabase.from('events').update({photo_limit:v}).eq('id',selected.id); setSelected(p=>({...p,photo_limit:v})); setEvents(p=>p.map(e=>e.id===selected.id?{...e,photo_limit:v}:e)) }}>Сохранить</button>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:'11px', color:'#444', marginBottom:'6px' }}>Лимит гостей</div>
                        <div style={{ display:'flex', gap:'7px' }}>
                          <input className="ai" type="number" min="1" max="9999" defaultValue={selected.guest_limit||150} id="s-gl" style={{ maxWidth:'80px', textAlign:'center' }}/>
                          <button className="btn-r" style={{ fontSize:'12px', padding:'8px 13px' }} onClick={async()=>{ const v=Number(document.getElementById('s-gl').value); if(!v)return; await supabase.from('events').update({guest_limit:v}).eq('id',selected.id); setSelected(p=>({...p,guest_limit:v})) }}>Сохранить</button>
                        </div>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
                        <div><div style={{ fontSize:'11px', color:'#444', marginBottom:'5px' }}>Начало</div><input className="ai" type="datetime-local" defaultValue={selected.starts_at?.slice(0,16)||''} id="s-st" style={{ fontSize:'10px' }}/></div>
                        <div><div style={{ fontSize:'11px', color:'#444', marginBottom:'5px' }}>Конец</div><input className="ai" type="datetime-local" defaultValue={selected.ends_at?.slice(0,16)||''} id="s-en" style={{ fontSize:'10px' }}/></div>
                      </div>
                      <button className="btn-r" style={{ fontSize:'12px', padding:'9px' }} onClick={async()=>{ const st=document.getElementById('s-st').value, en=document.getElementById('s-en').value; await supabase.from('events').update({starts_at:st||null,ends_at:en||null}).eq('id',selected.id); setSelected(p=>({...p,starts_at:st||null,ends_at:en||null})) }}>Сохранить даты</button>
                    </div>
                  </div>
                  <div className="section">
                    <div className="lbl">Статус</div>
                    {isClosed
                      ? <button className="btn-g" onClick={reopenEvent} style={{ width:'100%', padding:'10px' }}>▶ Возобновить съёмку</button>
                      : <button onClick={closeEvent} disabled={closing} style={{ width:'100%', padding:'10px', background:'rgba(195,7,63,0.08)', border:'1px solid rgba(195,7,63,0.25)', color:'#C3073F', borderRadius:'9px', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:"'Onest',sans-serif" }}>{closing?'Закрываем...':'⏹ Закрыть съёмку'}</button>
                    }
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <div onClick={()=>setLightbox(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.96)', zIndex:2000, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'22px', animation:'fadeIn 0.2s ease' }}>
          <button onClick={()=>setLightbox(null)} style={{ position:'absolute', top:'18px', right:'18px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', color:'#fff', width:'36px', height:'36px', borderRadius:'50%', cursor:'pointer', fontSize:'15px', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          <img src={lightbox.url} onClick={e=>e.stopPropagation()} style={{ maxWidth:'100%', maxHeight:'80dvh', objectFit:'contain', borderRadius:'13px', boxShadow:'0 24px 80px rgba(0,0,0,0.8)' }}/>
          <div style={{ marginTop:'12px', textAlign:'center' }}>
            <div style={{ fontWeight:700, color:'#F0F0F0', fontSize:'14px' }}>{lightbox.author||'Гость'}</div>
            {lightbox.votes>0 && <div style={{ color:'#C3073F', fontSize:'12px', marginTop:'3px' }}>❤️ {lightbox.votes} лайков</div>}
          </div>
        </div>
      )}
    </main>
  )
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(null)
  useEffect(() => { setAuthed(sessionStorage.getItem('tusim_admin')==='1') }, [])
  if (authed===null) return null
  if (!authed) return <><style>{STYLES}</style><LoginScreen onLogin={()=>setAuthed(true)}/></>
  return <><style>{STYLES}</style><AdminPanel onLogout={()=>{ sessionStorage.removeItem('tusim_admin'); setAuthed(false) }}/></>
}