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
  { emoji: '😍', key: 'love',  label: 'Вау'   },
  { emoji: '😮', key: 'wow',   label: 'Ого'   },
]

function FloatingReaction({ emoji, x, y, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 700); return () => clearTimeout(t) }, [])
  return (
    <div style={{
      position:'fixed', left:x-14, top:y-14, fontSize:28,
      pointerEvents:'none', zIndex:2000,
      animation:'reactionPop 0.7s cubic-bezier(.22,1,.36,1) forwards',
    }}>{emoji}</div>
  )
}

function AlbumInner() {
  const searchParams = useSearchParams()
  const [photos, setPhotos]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [eventName, setEventName]     = useState('')
  const [eventId, setEventId]         = useState(null)
  const [cols, setCols]               = useState(3)
  const [sort, setSort]               = useState('new')
  const [selected, setSelected]       = useState(null)
  const [selIdx, setSelIdx]           = useState(0)
  const [newCount, setNewCount]       = useState(0)
  const [reactions, setReactions]     = useState({})
  const [myReactions, setMyReactions] = useState({})
  const [floats, setFloats]           = useState([])
  const deviceId = useRef(null)
  let lbTouch = null

  useEffect(() => {
    deviceId.current = localStorage.getItem('tusim_device_id')
    const eid  = searchParams.get('event_id') || localStorage.getItem('tusim_event_id')
    const name = localStorage.getItem('tusim_event_name')
    if (name) setEventName(name)
    if (eid) { setEventId(eid); loadPhotos(eid); loadReactions(eid); subscribeRealtime(eid) }
    else setLoading(false)
    try { setMyReactions(JSON.parse(localStorage.getItem('tusim_reactions') || '{}')) } catch {}
  }, [])

  async function loadPhotos(eid) {
    const { data } = await supabase.from('photos').select('*').eq('event_id', eid).order('created_at', { ascending: false })
    if (data) setPhotos(data)
    setLoading(false)
  }

  async function loadReactions(eid) {
    const { data } = await supabase.from('reactions').select('*').eq('event_id', eid)
    if (!data) return
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
        payload => { setPhotos(prev => [payload.new, ...prev]); setNewCount(p => p + 1) })
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
    const ra = Object.values(reactions[a.id]||{}).reduce((s,v)=>s+v,0) + (a.votes||0)
    const rb = Object.values(reactions[b.id]||{}).reduce((s,v)=>s+v,0) + (b.votes||0)
    return rb - ra
  })

  function openPhoto(idx) { setSelIdx(idx); setSelected(sorted[idx]) }
  function closePhoto()   { setSelected(null) }
  function prev(e) { e?.stopPropagation(); const i=(selIdx-1+sorted.length)%sorted.length; setSelIdx(i); setSelected(sorted[i]) }
  function next(e) { e?.stopPropagation(); const i=(selIdx+1)%sorted.length; setSelIdx(i); setSelected(sorted[i]) }

  function lbTouchStart(e) { lbTouch = e.touches[0].clientX }
  function lbTouchEnd(e) {
    if (!lbTouch) return
    const dx = e.changedTouches[0].clientX - lbTouch
    if (Math.abs(dx) > 50) dx > 0 ? prev(e) : next(e)
    lbTouch = null
  }

  async function addReaction(photoId, reactionKey, e) {
    e?.stopPropagation()
    const rect = e?.currentTarget?.getBoundingClientRect()
    if (rect) {
      const id = Date.now()
      const emoji = REACTIONS.find(r=>r.key===reactionKey)?.emoji || '❤️'
      setFloats(prev => [...prev, { id, emoji, x: rect.left + rect.width/2, y: rect.top }])
    }
    const myR = myReactions[photoId] || []
    if (myR.includes(reactionKey)) return
    const newMy = { ...myReactions, [photoId]: [...myR, reactionKey] }
    setMyReactions(newMy)
    localStorage.setItem('tusim_reactions', JSON.stringify(newMy))
    setReactions(prev => ({
      ...prev,
      [photoId]: { ...(prev[photoId]||{}), [reactionKey]: ((prev[photoId]||{})[reactionKey]||0) + 1 }
    }))
    await fetch('/api/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_id: photoId, event_id: eventId, device_id: deviceId.current, reaction_key: reactionKey }),
    }).catch(() => {})
  }

  const totalReactions = (photoId) => Object.values(reactions[photoId]||{}).reduce((s,v)=>s+v,0)

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body { background:#09090b; }

        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
        @keyframes fadeIn   { from{opacity:0;} to{opacity:1;} }
        @keyframes scaleIn  { from{opacity:0;transform:scale(0.92);} to{opacity:1;transform:scale(1);} }
        @keyframes photoIn  { from{opacity:0;transform:scale(0.88);} to{opacity:1;transform:scale(1);} }
        @keyframes spin     { to{transform:rotate(360deg);} }
        @keyframes reactionPop {
          0%   { transform:scale(0) translateY(0); opacity:1; }
          60%  { transform:scale(1.4) translateY(-12px); opacity:1; }
          100% { transform:scale(1) translateY(-24px); opacity:0; }
        }
        @keyframes newBadge {
          0%   { transform:translateX(-50%) translateY(-8px); opacity:0; }
          100% { transform:translateX(-50%) translateY(0); opacity:1; }
        }
        @keyframes blobDrift {
          from { transform:translate(0,0) scale(1); }
          to   { transform:translate(50px,70px) scale(1.12); }
        }

        .al-blob {
          position:fixed; border-radius:50%;
          filter:blur(120px); pointer-events:none; z-index:0;
        }
        .al-blob-1 {
          width:500px; height:500px; background:rgba(195,7,63,0.07);
          top:-150px; right:-100px;
          animation:blobDrift 24s ease-in-out infinite alternate;
        }
        .al-blob-2 {
          width:350px; height:350px; background:rgba(195,7,63,0.04);
          bottom:-100px; left:-80px;
          animation:blobDrift 30s ease-in-out infinite alternate-reverse;
        }

        .al-root {
          min-height:100dvh; background:#09090b;
          color:#F0F0F0; font-family:'Onest',sans-serif;
          padding-bottom:100px; position:relative;
        }

        /* Хедер */
        .al-header {
          position:sticky; top:0; z-index:50;
          background:rgba(9,9,11,0.88);
          backdrop-filter:blur(24px);
          border-bottom:1px solid rgba(255,255,255,0.05);
          padding:max(48px,env(safe-area-inset-top,48px)) 16px 14px;
          animation:fadeUp 0.4s ease both;
        }
        .al-header-top {
          display:flex; align-items:flex-start;
          justify-content:space-between; gap:10px; margin-bottom:14px;
        }
        .al-title {
          font-family:'Unbounded',sans-serif; font-weight:900;
          font-size:22px; letter-spacing:-1px; line-height:1;
          color:#fff;
        }
        .al-title span { color:#C3073F; }
        .al-subtitle { font-size:12px; color:rgba(255,255,255,0.25); margin-top:5px; }

        /* Кнопки колонок */
        .al-cols { display:flex; gap:5px; flex-shrink:0; }
        .al-col-btn {
          width:34px; height:34px; border-radius:9px; cursor:pointer;
          background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07);
          display:flex; align-items:center; justify-content:center;
          transition:all 0.15s; -webkit-tap-highlight-color:transparent;
        }
        .al-col-btn.on {
          background:rgba(195,7,63,0.12); border-color:rgba(195,7,63,0.3);
        }

        /* Сортировка */
        .al-sorts { display:flex; gap:5px; flex-wrap:wrap; }
        .al-sort-btn {
          padding:7px 13px; border-radius:9px; cursor:pointer; font-size:12px;
          background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07);
          color:rgba(255,255,255,0.35); font-family:'Onest',sans-serif; font-weight:700;
          transition:all 0.15s; -webkit-tap-highlight-color:transparent;
        }
        .al-sort-btn.on {
          background:rgba(195,7,63,0.1); border-color:rgba(195,7,63,0.25); color:#C3073F;
        }

        /* Сетка */
        .al-grid { animation:fadeIn 0.3s ease both; }

        .al-thumb {
          position:relative; overflow:hidden; cursor:pointer;
          background:rgba(255,255,255,0.03); aspect-ratio:1;
          animation:photoIn 0.35s cubic-bezier(.22,1,.36,1) both;
        }
        .al-thumb img {
          width:100%; height:100%; object-fit:cover; display:block;
          transition:transform 0.3s cubic-bezier(.22,1,.36,1);
        }
        .al-thumb:hover img { transform:scale(1.06); }
        .al-thumb:active img { transform:scale(0.97); }

        .al-thumb-info {
          position:absolute; bottom:0; left:0; right:0;
          background:linear-gradient(transparent,rgba(0,0,0,0.72));
          padding:18px 7px 7px; opacity:0; transition:opacity 0.2s;
        }
        .al-thumb:hover .al-thumb-info { opacity:1; }
        @media(hover:none) { .al-thumb-info { opacity:1; } }
        .al-thumb-author { font-size:10px; color:rgba(255,255,255,0.8); font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

        .al-react-badge {
          position:absolute; top:5px; right:5px;
          background:rgba(0,0,0,0.65); border-radius:8px;
          padding:2px 7px; font-size:10px; color:#fff; font-weight:700;
          backdrop-filter:blur(4px);
        }

        /* Новые фото бейдж */
        .al-new-badge {
          position:fixed; top:max(70px,env(safe-area-inset-top,70px)); left:50%;
          transform:translateX(-50%);
          background:rgba(195,7,63,0.95); color:#fff; border-radius:100px;
          padding:9px 20px; font-size:13px; font-weight:700;
          font-family:'Onest',sans-serif; z-index:500; cursor:pointer;
          backdrop-filter:blur(8px); animation:newBadge 0.3s ease;
          box-shadow:0 4px 24px rgba(195,7,63,0.5);
          -webkit-tap-highlight-color:transparent;
        }

        /* Лайтбокс */
        .al-lb {
          position:fixed; inset:0; background:rgba(0,0,0,0.97);
          z-index:1000; display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          animation:fadeIn 0.18s ease;
          -webkit-tap-highlight-color:transparent;
        }
        .al-lb-img {
          max-width:100%; max-height:58dvh; object-fit:contain;
          border-radius:14px; animation:scaleIn 0.25s cubic-bezier(.22,1,.36,1);
          box-shadow:0 24px 80px rgba(0,0,0,0.8);
        }
        .al-lb-nav {
          position:absolute; top:50%; transform:translateY(-50%);
          width:40px; height:40px; border-radius:50%; cursor:pointer;
          background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1);
          color:#fff; font-size:16px; display:flex; align-items:center; justify-content:center;
          transition:background 0.15s;
        }
        .al-lb-nav:hover { background:rgba(255,255,255,0.14); }
        .al-lb-close {
          position:absolute; top:max(18px,env(safe-area-inset-top,18px)); right:18px;
          width:40px; height:40px; border-radius:50%; cursor:pointer;
          background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1);
          color:#fff; font-size:15px; display:flex; align-items:center; justify-content:center;
          transition:background 0.15s;
        }
        .al-lb-close:hover { background:rgba(255,255,255,0.14); }

        /* Реакции */
        .al-reaction-btn {
          display:flex; flex-direction:column; align-items:center; gap:4px;
          background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);
          border-radius:14px; padding:10px 14px; cursor:pointer;
          transition:all 0.15s; min-width:62px;
          -webkit-tap-highlight-color:transparent;
        }
        .al-reaction-btn:active { transform:scale(0.88); }
        .al-reaction-btn.reacted {
          background:rgba(195,7,63,0.1); border-color:rgba(195,7,63,0.3);
        }

        /* Пустое состояние */
        .al-empty {
          display:flex; flex-direction:column; align-items:center;
          padding:80px 24px; gap:14px; animation:fadeUp 0.5s ease both;
        }
        .al-empty-icon {
          width:76px; height:76px; border-radius:50%;
          background:rgba(195,7,63,0.06); border:1px solid rgba(195,7,63,0.12);
          display:flex; align-items:center; justify-content:center; font-size:30px;
        }
      `}</style>

      <div className="ds-atmos" aria-hidden="true">
        <div className="ds-aurora"/><div className="ds-blob ds-blob-1"/><div className="ds-blob ds-blob-2"/><div className="ds-grain"/>
      </div>

      {/* Floating реакции */}
      {floats.map(f => (
        <FloatingReaction key={f.id} emoji={f.emoji} x={f.x} y={f.y}
          onDone={() => setFloats(prev => prev.filter(p => p.id !== f.id))}/>
      ))}

      {/* Бейдж новых фото */}
      {newCount > 0 && sort !== 'new' && (
        <div className="al-new-badge" onClick={() => { setSort('new'); setNewCount(0) }}>
          +{newCount} новых фото ↑
        </div>
      )}

      <div className="al-root">
        {/* Хедер */}
        <div className="al-header">
          <div className="al-header-top">
            <div>
              <div className="al-title">tusi<span>'m</span></div>
              <div className="al-subtitle">
                {loading ? 'Загружаем...' : (
                  <>{photos.length} фото{eventName && <span> · {eventName}</span>}</>
                )}
              </div>
            </div>
            {!loading && photos.length > 0 && (
              <div className="al-cols">
                {[2,3,4].map(n => (
                  <button key={n} className={`al-col-btn${cols===n?' on':''}`} onClick={() => setCols(n)}>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      {n===2 && <><rect x="1" y="1" width="5.5" height="13" rx="1.2" fill={cols===2?'#C3073F':'rgba(255,255,255,0.3)'}/><rect x="8.5" y="1" width="5.5" height="13" rx="1.2" fill={cols===2?'#C3073F':'rgba(255,255,255,0.3)'}/></>}
                      {n===3 && [0,1,2].map(i=><rect key={i} x={1+i*4.5} y="1" width="3.5" height="13" rx="1" fill={cols===3?'#C3073F':'rgba(255,255,255,0.3)'}/>)}
                      {n===4 && [0,1,2,3].map(i=><rect key={i} x={1+i*3.5} y="1" width="2.5" height="13" rx="0.8" fill={cols===4?'#C3073F':'rgba(255,255,255,0.3)'}/>)}
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>

          {!loading && photos.length > 0 && (
            <div className="al-sorts">
              {[['new','Новые'],['old','Старые'],['top','Популярные']].map(([v,l]) => (
                <button key={v} className={`al-sort-btn${sort===v?' on':''}`}
                  onClick={() => { setSort(v); setNewCount(0) }}>{l}</button>
              ))}
            </div>
          )}
        </div>

        {/* Загрузка */}
        {loading && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'80px 0', gap:14 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.05)', borderTopColor:'#C3073F', animation:'spin 0.8s linear infinite' }}/>
            <span style={{ color:'rgba(255,255,255,0.2)', fontSize:13 }}>Загружаем...</span>
          </div>
        )}

        {/* Пусто */}
        {!loading && photos.length === 0 && (
          <div className="al-empty">
            <div className="al-empty-icon">📸</div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>Пока пусто</div>
              <div style={{ color:'rgba(255,255,255,0.25)', fontSize:13, lineHeight:1.7 }}>Сделай первый кадр</div>
            </div>
          </div>
        )}

        {/* Сетка */}
        {!loading && sorted.length > 0 && (
          <div className="al-grid" style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:cols>=3?'2px':'4px' }}>
            {sorted.map((photo, i) => (
              <div key={photo.id} className="al-thumb" style={{ animationDelay:`${Math.min(i*0.02,0.2)}s` }} onClick={() => openPhoto(i)}>
                <img src={photo.url} loading="lazy" alt={photo.author||'фото'}/>
                <div className="al-thumb-info">
                  <div className="al-thumb-author">{photo.author||'Гость'}</div>
                </div>
                {totalReactions(photo.id) > 0 && (
                  <div className="al-react-badge">
                    {Object.entries(reactions[photo.id]||{}).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k]) => REACTIONS.find(r=>r.key===k)?.emoji).join('')} {totalReactions(photo.id)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Лайтбокс */}
      {selected && (
        <div className="al-lb" onClick={closePhoto} onTouchStart={lbTouchStart} onTouchEnd={lbTouchEnd}>
          <button className="al-lb-close" onClick={closePhoto}>✕</button>
          {sorted.length > 1 && <>
            <button className="al-lb-nav" style={{ left:12 }} onClick={prev}>‹</button>
            <button className="al-lb-nav" style={{ right:12 }} onClick={next}>›</button>
          </>}

          <img key={selected.id} src={selected.url} className="al-lb-img" onClick={e => e.stopPropagation()}/>

          <div style={{ marginTop:16, textAlign:'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:14, color:'#F0F0F0', marginBottom:4, letterSpacing:'-0.3px' }}>
              {selected.author||'Гость'}
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)', marginBottom:18 }}>
              {selIdx+1} из {sorted.length}
            </div>

            {/* Реакции */}
            <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
              {REACTIONS.map(r => {
                const count   = (reactions[selected.id]||{})[r.key] || 0
                const reacted = (myReactions[selected.id]||[]).includes(r.key)
                return (
                  <button key={r.key} className={`al-reaction-btn${reacted?' reacted':''}`}
                    onClick={e => addReaction(selected.id, r.key, e)}>
                    <span style={{ fontSize:22, lineHeight:1 }}>{r.emoji}</span>
                    <span style={{ fontSize:11, color:reacted?'#C3073F':'rgba(255,255,255,0.3)', fontWeight:700 }}>
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