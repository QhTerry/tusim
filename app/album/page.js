'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const REACTIONS = [
  { emoji: '🔥', key: 'fire',  label: 'Огонь' },
  { emoji: '😂', key: 'laugh', label: 'Ха-ха' },
  { emoji: '😍', key: 'love',  label: 'Вау' },
  { emoji: '😮', key: 'wow',   label: 'Ого' },
]

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Onest:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#1A1A1D; }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
  @keyframes fadeIn  { from{opacity:0;} to{opacity:1;} }
  @keyframes scaleIn { from{opacity:0;transform:scale(0.9);} to{opacity:1;transform:scale(1);} }
  @keyframes photoIn { from{opacity:0;transform:scale(0.86);} to{opacity:1;transform:scale(1);} }
  @keyframes spin    { to{transform:rotate(360deg);} }
  @keyframes reactionPop {
    0%   { transform:scale(0) translateY(0); opacity:1; }
    60%  { transform:scale(1.4) translateY(-12px); opacity:1; }
    100% { transform:scale(1) translateY(-20px); opacity:0; }
  }
  @keyframes reactionBtnPop {
    0%   { transform:scale(1); }
    40%  { transform:scale(0.82); }
    70%  { transform:scale(1.2); }
    100% { transform:scale(1); }
  }
  @keyframes newPhotoBadge {
    0%   { transform:translateY(-8px); opacity:0; }
    100% { transform:translateY(0);    opacity:1; }
  }

  .thumb-wrap {
    position:relative; overflow:hidden; cursor:pointer;
    background:#111; aspect-ratio:1;
    animation:photoIn 0.35s cubic-bezier(.22,1,.36,1) both;
  }
  .thumb-wrap img {
    width:100%; height:100%; object-fit:cover; display:block;
    transition:transform 0.3s cubic-bezier(.22,1,.36,1);
  }
  .thumb-wrap:hover img { transform:scale(1.05); }
  .thumb-wrap:active img { transform:scale(0.97); }

  .thumb-info {
    position:absolute; bottom:0; left:0; right:0;
    background:linear-gradient(transparent,rgba(0,0,0,0.7));
    padding:18px 7px 7px; opacity:0; transition:opacity 0.2s;
  }
  .thumb-wrap:hover .thumb-info { opacity:1; }
  @media (hover:none) { .thumb-info { opacity:1; } }

  .grid-btn {
    width:34px; height:34px; border-radius:8px; cursor:pointer;
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07);
    display:flex; align-items:center; justify-content:center;
    transition:background 0.15s; -webkit-tap-highlight-color:transparent;
  }
  .grid-btn.on { background:rgba(195,7,63,0.15); border-color:rgba(195,7,63,0.3); }

  .sort-btn {
    padding:6px 13px; border-radius:8px; cursor:pointer; font-size:12px;
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07);
    color:#444; font-family:'Onest',sans-serif; font-weight:600;
    transition:background 0.15s,color 0.15s; white-space:nowrap;
    -webkit-tap-highlight-color:transparent;
  }
  .sort-btn.on { background:rgba(195,7,63,0.12); border-color:rgba(195,7,63,0.25); color:#C3073F; }

  /* Лайтбокс */
  .lb-bg {
    position:fixed; inset:0; background:rgba(0,0,0,0.97);
    z-index:1000; display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    animation:fadeIn 0.18s ease;
    -webkit-tap-highlight-color:transparent;
  }
  .lb-img {
    max-width:100%; max-height:60dvh;
    object-fit:contain; border-radius:14px;
    animation:scaleIn 0.25s cubic-bezier(.22,1,.36,1);
    box-shadow:0 24px 80px rgba(0,0,0,0.8);
  }
  .lb-nav {
    position:absolute; top:50%; transform:translateY(-50%);
    width:38px; height:38px; border-radius:50%; cursor:pointer;
    background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12);
    color:#fff; font-size:16px; display:flex; align-items:center; justify-content:center;
    transition:background 0.15s; -webkit-tap-highlight-color:transparent;
  }
  .lb-nav:hover { background:rgba(255,255,255,0.14); }
  .lb-close {
    position:absolute; top:max(18px,env(safe-area-inset-top,18px)); right:18px;
    width:38px; height:38px; border-radius:50%; cursor:pointer;
    background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12);
    color:#fff; font-size:15px; display:flex; align-items:center; justify-content:center;
  }

  /* Реакции */
  .reaction-btn {
    display:flex; flex-direction:column; align-items:center; gap:3px;
    background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08);
    border-radius:14px; padding:10px 14px; cursor:pointer;
    transition:background 0.15s, transform 0.15s;
    -webkit-tap-highlight-color:transparent;
    min-width:60px;
  }
  .reaction-btn:active { animation:reactionBtnPop 0.3s ease; }
  .reaction-btn.reacted {
    background:rgba(195,7,63,0.12); border-color:rgba(195,7,63,0.3);
  }
  .reaction-float {
    position:fixed; font-size:28px; pointer-events:none; z-index:2000;
    animation:reactionPop 0.7s cubic-bezier(.22,1,.36,1) forwards;
  }

  .new-badge {
    position:fixed; top:max(70px,env(safe-area-inset-top,70px)); left:50%; transform:translateX(-50%);
    background:rgba(195,7,63,0.9); color:#fff; border-radius:100px;
    padding:8px 18px; font-size:13px; font-weight:700;
    font-family:'Onest',sans-serif; z-index:500; cursor:pointer;
    backdrop-filter:blur(8px); animation:newPhotoBadge 0.3s ease;
    -webkit-tap-highlight-color:transparent;
    box-shadow:0 4px 20px rgba(195,7,63,0.4);
  }
`

// Плавающая реакция при клике
function FloatingReaction({ emoji, x, y, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 700); return () => clearTimeout(t) }, [])
  return <div className="reaction-float" style={{ left: x - 14, top: y - 14 }}>{emoji}</div>
}

function AlbumInner() {
  const searchParams = useSearchParams()
  const [photos, setPhotos]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [eventName, setEventName]   = useState('')
  const [eventId, setEventId]       = useState(null)
  const [cols, setCols]             = useState(3)
  const [sort, setSort]             = useState('new')
  const [selected, setSelected]     = useState(null)
  const [selIdx, setSelIdx]         = useState(0)
  const [newCount, setNewCount]     = useState(0)
  const [reactions, setReactions]   = useState({}) // photoId → { fire:N, laugh:N, ... }
  const [myReactions, setMyReactions] = useState({}) // photoId → Set of keys
  const [floats, setFloats]         = useState([])  // floating emoji анимации
  const deviceId = useRef(null)
  let lbTouch = null

  useEffect(() => {
    deviceId.current = localStorage.getItem('tusim_device_id')
    const eid  = searchParams.get('event_id') || localStorage.getItem('tusim_event_id')
    const name = localStorage.getItem('tusim_event_name')
    if (name) setEventName(name)
    if (eid) { setEventId(eid); loadPhotos(eid); loadReactions(eid); subscribeRealtime(eid) }
    else setLoading(false)

    // Загружаем свои реакции из localStorage
    try { setMyReactions(JSON.parse(localStorage.getItem('tusim_reactions') || '{}')) } catch {}
  }, [])

  async function loadPhotos(eid) {
    const { data } = await supabase.from('photos').select('*').eq('event_id', eid).order('created_at', { ascending:false })
    if (data) setPhotos(data)
    setLoading(false)
  }

  async function loadReactions(eid) {
    const { data } = await supabase.from('reactions').select('*').eq('event_id', eid)
    if (!data) return
    // Группируем по photo_id и reaction_key
    const grouped = {}
    data.forEach(r => {
      if (!grouped[r.photo_id]) grouped[r.photo_id] = {}
      grouped[r.photo_id][r.reaction_key] = (grouped[r.photo_id][r.reaction_key] || 0) + 1
    })
    setReactions(grouped)
  }

  function subscribeRealtime(eid) {
    supabase.channel(`album-${eid}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'photos', filter:`event_id=eq.${eid}` },
        payload => {
          setPhotos(prev => {
            // Если сортировка "новые" — добавляем в начало и показываем бейдж
            setNewCount(p => p + 1)
            return [payload.new, ...prev]
          })
        })
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'reactions', filter:`event_id=eq.${eid}` },
        payload => {
          const { photo_id, reaction_key } = payload.new
          setReactions(prev => ({
            ...prev,
            [photo_id]: { ...(prev[photo_id]||{}), [reaction_key]: ((prev[photo_id]||{})[reaction_key]||0) + 1 }
          }))
        })
      .subscribe()
  }

  const sorted = [...photos].sort((a,b) => {
    if (sort === 'new') return new Date(b.created_at) - new Date(a.created_at)
    if (sort === 'old') return new Date(a.created_at) - new Date(b.created_at)
    // Популярные — по сумме всех реакций + votes
    const ra = Object.values(reactions[a.id]||{}).reduce((s,v)=>s+v,0) + (a.votes||0)
    const rb = Object.values(reactions[b.id]||{}).reduce((s,v)=>s+v,0) + (b.votes||0)
    return rb - ra
  })

  function openPhoto(idx) { setSelIdx(idx); setSelected(sorted[idx]) }
  function closePhoto()   { setSelected(null) }
  function prev(e)  { e?.stopPropagation(); const i=(selIdx-1+sorted.length)%sorted.length; setSelIdx(i); setSelected(sorted[i]) }
  function next(e)  { e?.stopPropagation(); const i=(selIdx+1)%sorted.length; setSelIdx(i); setSelected(sorted[i]) }

  function lbTouchStart(e) { lbTouch = e.touches[0].clientX }
  function lbTouchEnd(e) {
    if (!lbTouch) return
    const dx = e.changedTouches[0].clientX - lbTouch
    if (Math.abs(dx) > 50) dx > 0 ? prev(e) : next(e)
    lbTouch = null
  }

  async function addReaction(photoId, reactionKey, e) {
    e?.stopPropagation()

    // Floating emoji анимация
    const rect = e?.currentTarget?.getBoundingClientRect()
    if (rect) {
      const id = Date.now()
      const emoji = REACTIONS.find(r=>r.key===reactionKey)?.emoji || '❤️'
      setFloats(prev => [...prev, { id, emoji, x: rect.left + rect.width/2, y: rect.top }])
    }

    // Проверяем уже лайкнули
    const myR = myReactions[photoId] || []
    if (myR.includes(reactionKey)) return // уже поставили эту реакцию

    const newMy = { ...myReactions, [photoId]: [...myR, reactionKey] }
    setMyReactions(newMy)
    localStorage.setItem('tusim_reactions', JSON.stringify(newMy))

    // Оптимистичное обновление
    setReactions(prev => ({
      ...prev,
      [photoId]: { ...(prev[photoId]||{}), [reactionKey]: ((prev[photoId]||{})[reactionKey]||0) + 1 }
    }))

    // Сохраняем в БД (нужна таблица reactions)
    await supabase.from('reactions').insert({
      photo_id: photoId,
      event_id: eventId,
      device_id: deviceId.current,
      reaction_key: reactionKey,
    })
  }

  const totalReactions = (photoId) =>
    Object.values(reactions[photoId]||{}).reduce((s,v)=>s+v,0)

  return (
    <>
      <style>{STYLES}</style>

      {/* Floating emoji */}
      {floats.map(f => (
        <FloatingReaction key={f.id} emoji={f.emoji} x={f.x} y={f.y} onDone={() => setFloats(prev => prev.filter(p=>p.id!==f.id))}/>
      ))}

      {/* Бейдж новых фото */}
      {newCount > 0 && sort !== 'new' && (
        <div className="new-badge" onClick={() => { setSort('new'); setNewCount(0) }}>
          +{newCount} новых фото ↑
        </div>
      )}

      <main style={{ minHeight:'100dvh', background:'#1A1A1D', color:'#F0F0F0', fontFamily:"'Onest',sans-serif", paddingBottom:'100px' }}>

        {/* Шапка */}
        <div style={{ padding:'max(48px,env(safe-area-inset-top,48px)) 16px 14px', animation:'fadeUp 0.4s ease both' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'10px', marginBottom:'12px' }}>
            <div>
              <h1 style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'22px', letterSpacing:'-0.5px', lineHeight:1 }}>Альбом</h1>
              <p style={{ color:'#2a2a2a', fontSize:'12px', marginTop:'5px' }}>
                {loading ? 'Загружаем...' : <><span style={{ color:'#444' }}>{photos.length} фото</span>{eventName && <span style={{ color:'#222' }}> · {eventName}</span>}</>}
              </p>
            </div>

            {!loading && photos.length > 0 && (
              <div style={{ display:'flex', gap:'5px', flexShrink:0 }}>
                {[2,3,4].map(n => (
                  <button key={n} className={`grid-btn ${cols===n?'on':''}`} onClick={() => setCols(n)}>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      {n===2 && <><rect x="1" y="1" width="5.5" height="13" rx="1.2" fill={cols===2?'#C3073F':'#444'}/><rect x="8.5" y="1" width="5.5" height="13" rx="1.2" fill={cols===2?'#C3073F':'#444'}/></>}
                      {n===3 && [0,1,2].map(i=><rect key={i} x={1+i*4.5} y="1" width="3.5" height="13" rx="1" fill={cols===3?'#C3073F':'#444'}/>)}
                      {n===4 && [0,1,2,3].map(i=><rect key={i} x={1+i*3.5} y="1" width="2.5" height="13" rx="0.8" fill={cols===4?'#C3073F':'#444'}/>)}
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>

          {!loading && photos.length > 0 && (
            <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
              {[['new','Новые'],['old','Старые'],['top','Популярные']].map(([v,l]) => (
                <button key={v} className={`sort-btn ${sort===v?'on':''}`} onClick={() => { setSort(v); setNewCount(0) }}>{l}</button>
              ))}
            </div>
          )}
        </div>

        {/* Загрузка */}
        {loading && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'80px 0', gap:'14px' }}>
            <div style={{ width:'30px', height:'30px', borderRadius:'50%', border:'3px solid #1a1a1a', borderTopColor:'#C3073F', animation:'spin 0.8s linear infinite' }}/>
            <span style={{ color:'#2a2a2a', fontSize:'13px' }}>Загружаем...</span>
          </div>
        )}

        {/* Пусто */}
        {!loading && photos.length === 0 && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'80px 24px', gap:'14px', animation:'fadeUp 0.5s ease both' }}>
            <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'rgba(195,7,63,0.06)', border:'1px solid rgba(195,7,63,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px' }}>📸</div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'15px', fontWeight:600, marginBottom:'6px' }}>Пока пусто</div>
              <div style={{ color:'#2a2a2a', fontSize:'13px', lineHeight:1.7 }}>Сделай первый кадр</div>
            </div>
          </div>
        )}

        {/* Сетка */}
        {!loading && sorted.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap: cols>=3?'2px':'4px', animation:'fadeIn 0.3s ease both' }}>
            {sorted.map((photo, i) => (
              <div key={photo.id} className="thumb-wrap" style={{ animationDelay:`${Math.min(i*0.02,0.2)}s` }} onClick={() => openPhoto(i)}>
                <img src={photo.url} loading="lazy" alt={photo.author||'фото'}/>
                <div className="thumb-info">
                  <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.75)', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {photo.author||'Гость'}
                  </div>
                </div>
                {/* Счётчик реакций на превью */}
                {totalReactions(photo.id) > 0 && (
                  <div style={{ position:'absolute', top:'5px', right:'5px', background:'rgba(0,0,0,0.65)', borderRadius:'8px', padding:'2px 7px', fontSize:'10px', color:'#fff', fontWeight:700, backdropFilter:'blur(4px)' }}>
                    {Object.entries(reactions[photo.id]||{}).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k]) => REACTIONS.find(r=>r.key===k)?.emoji).join('')} {totalReactions(photo.id)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Лайтбокс */}
      {selected && (
        <div className="lb-bg" onClick={closePhoto} onTouchStart={lbTouchStart} onTouchEnd={lbTouchEnd}>
          <button className="lb-close" onClick={closePhoto}>✕</button>
          {sorted.length > 1 && <>
            <button className="lb-nav" style={{ left:'12px' }} onClick={prev}>‹</button>
            <button className="lb-nav" style={{ right:'12px' }} onClick={next}>›</button>
          </>}

          <img key={selected.id} src={selected.url} className="lb-img" onClick={e=>e.stopPropagation()}/>

          {/* Инфо */}
          <div style={{ marginTop:'14px', textAlign:'center' }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontWeight:700, fontSize:'15px', color:'#F0F0F0', marginBottom:'4px' }}>{selected.author||'Гость'}</div>
            <div style={{ fontSize:'12px', color:'#333', marginBottom:'16px' }}>{selIdx+1} из {sorted.length}</div>

            {/* Реакции */}
            <div style={{ display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap' }}>
              {REACTIONS.map(r => {
                const count   = (reactions[selected.id]||{})[r.key] || 0
                const reacted = (myReactions[selected.id]||[]).includes(r.key)
                return (
                  <button
                    key={r.key}
                    className={`reaction-btn ${reacted?'reacted':''}`}
                    onClick={e => addReaction(selected.id, r.key, e)}
                  >
                    <span style={{ fontSize:'22px', lineHeight:1 }}>{r.emoji}</span>
                    <span style={{ fontSize:'11px', color: reacted?'#C3073F':'#444', fontWeight:600 }}>
                      {count > 0 ? count : r.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function AlbumPage() {
  return (
    <Suspense fallback={null}>
      <AlbumInner/>
    </Suspense>
  )
}