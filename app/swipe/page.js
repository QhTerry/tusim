'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function SwipePage() {
  const [photos, setPhotos]       = useState([])
  const [index, setIndex]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [done, setDone]           = useState(false)
  const [flying, setFlying]       = useState(null)
  const [showOv, setShowOv]       = useState(null)
  const [likedCount, setLikedCount] = useState(0)
  const [liked, setLiked]         = useState({})
  const [dragX, setDragX]         = useState(0)

  const animating  = useRef(false)
  const touchStart = useRef(null)
  const cardId     = useRef('card-0')

  useEffect(() => {
    const params  = new URLSearchParams(window.location.search)
    const eventId = params.get('event_id') || localStorage.getItem('tusim_event_id')
    try { setLiked(JSON.parse(localStorage.getItem('tusim_liked') || '{}')) } catch {}
    if (eventId) loadPhotos(eventId)
    else setLoading(false)
  }, [])

  useEffect(() => {
    const card = document.getElementById(cardId.current)
    if (!card || done || loading) return

    let sx = null, sy = null, dragging = false

    function onStart(e) {
      if (animating.current) return
      const t = e.touches ? e.touches[0] : e
      sx = t.clientX; sy = t.clientY; dragging = true
    }
    function onMove(e) {
      if (!dragging || sx === null) return
      const t = e.touches ? e.touches[0] : e
      const dx = t.clientX - sx
      const dy = t.clientY - sy
      if (e.touches && Math.abs(dy) > Math.abs(dx)) return
      if (e.cancelable) e.preventDefault()
      setDragX(dx)
      setShowOv(dx > 15 ? 'right' : dx < -15 ? 'left' : null)
    }
    function onEnd(e) {
      if (!dragging) return
      dragging = false
      const t = e.changedTouches ? e.changedTouches[0] : e
      const dx = t.clientX - sx
      setDragX(0); setShowOv(null)
      if (Math.abs(dx) > 60) dx > 0 ? triggerLike() : triggerSkip()
      sx = null
    }

    card.addEventListener('touchstart', onStart, { passive: true })
    card.addEventListener('touchmove',  onMove,  { passive: false })
    card.addEventListener('touchend',   onEnd,   { passive: true })
    card.addEventListener('mousedown',  onStart)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onEnd)

    return () => {
      card.removeEventListener('touchstart', onStart)
      card.removeEventListener('touchmove',  onMove)
      card.removeEventListener('touchend',   onEnd)
      card.removeEventListener('mousedown',  onStart)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onEnd)
    }
  }, [index, done, loading, liked])

  async function loadPhotos(eventId) {
    const { data } = await supabase
      .from('photos').select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    if (data) setPhotos(data)
    setLoading(false)
  }

  const current  = photos[index]
  const next     = photos[index + 1]
  const progress = photos.length ? (index / photos.length) * 100 : 0
  const dragProg = Math.min(Math.abs(dragX) / 100, 1)

  function saveLiked(nl) { localStorage.setItem('tusim_liked', JSON.stringify(nl)); setLiked(nl) }

  function advance() {
    cardId.current = `card-${Date.now()}`
    if (index + 1 >= photos.length) setDone(true)
    else setIndex(p => p + 1)
    animating.current = false
  }

  function triggerLike() {
    if (!current || animating.current) return
    animating.current = true
    setDragX(0); setShowOv(null); setFlying('right')
    if (!liked[current.id]) {
      const nl = { ...liked, [current.id]: true }
      saveLiked(nl); setLikedCount(p => p + 1)
      fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: current.id }),
      }).catch(() => {})
    }
    setTimeout(() => { setFlying(null); advance() }, 420)
  }

  function triggerSkip() {
    if (!current || animating.current) return
    animating.current = true
    setDragX(0); setShowOv(null); setFlying('left')
    setTimeout(() => { setFlying(null); advance() }, 420)
  }

  function reset() { setIndex(0); setDone(false); setLikedCount(0); setDragX(0) }

  const isLiked = current && liked[current.id]

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body { height:100%; background:var(--bg); overflow:hidden; }

        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
        @keyframes fadeIn  { from{opacity:0;} to{opacity:1;} }
        @keyframes spin    { to{transform:rotate(360deg);} }
        @keyframes popIn   { 0%{opacity:0;transform:scale(0.4);} 60%{opacity:1;transform:scale(1.1);} 100%{opacity:1;transform:scale(1);} }
        @keyframes cardIn  { from{opacity:0;transform:scale(0.94) translateY(16px);} to{opacity:1;transform:scale(1) translateY(0);} }
        @keyframes blobDrift { from{transform:translate(0,0) scale(1);} to{transform:translate(50px,60px) scale(1.1);} }

        @keyframes flyRight {
          0%   { transform:translateX(0) rotate(0deg); opacity:1; }
          100% { transform:translateX(140%) rotate(18deg); opacity:0; }
        }
        @keyframes flyLeft {
          0%   { transform:translateX(0) rotate(0deg); opacity:1; }
          100% { transform:translateX(-140%) rotate(-18deg); opacity:0; }
        }
        @keyframes nextRise {
          from { transform:scale(0.92) translateY(14px); }
          to   { transform:scale(1) translateY(0); }
        }
        @keyframes stampPop {
          0%   { opacity:0; transform:scale(0.5) rotate(var(--r0)); }
          55%  { opacity:1; transform:scale(1.2) rotate(var(--r1)); }
          100% { opacity:1; transform:scale(1) rotate(var(--r2)); }
        }
        @keyframes hintAnim {
          0%   { opacity:0; transform:translateX(-50%) translateY(8px); }
          20%  { opacity:1; transform:translateX(-50%) translateY(0); }
          75%  { opacity:1; transform:translateX(-50%) translateY(0); }
          100% { opacity:0; transform:translateX(-50%) translateY(-6px); }
        }

        .sw-blob {
          position:fixed; border-radius:50%;
          filter:blur(130px); pointer-events:none; z-index:0;
        }
        .sw-blob-1 {
          width:500px; height:500px; background:rgba(195,7,63,0.08);
          top:-150px; left:-150px;
          animation:blobDrift 20s ease-in-out infinite alternate;
        }
        .sw-blob-2 {
          width:350px; height:350px; background:rgba(195,7,63,0.05);
          bottom:-100px; right:-100px;
          animation:blobDrift 26s ease-in-out infinite alternate-reverse;
        }

        .stamp {
          position:absolute; top:32px; border:3px solid;
          border-radius:10px; font-family:'Unbounded',sans-serif;
          font-weight:900; font-size:20px; padding:6px 14px;
          pointer-events:none; z-index:10; opacity:0;
          letter-spacing:0.04em; white-space:nowrap;
        }
        .stamp-like { left:20px; color:#22c55e; border-color:#22c55e; --r0:-25deg; --r1:-18deg; --r2:-20deg; }
        .stamp-skip { right:20px; color:#C3073F; border-color:#C3073F; --r0:25deg; --r1:18deg; --r2:20deg; }
        .fly-right .stamp-like { animation:stampPop 0.3s cubic-bezier(.22,1,.36,1) forwards; }
        .fly-left  .stamp-skip { animation:stampPop 0.3s cubic-bezier(.22,1,.36,1) forwards; }
        .fly-right { animation:flyRight 0.4s cubic-bezier(.4,0,.2,1) forwards; }
        .fly-left  { animation:flyLeft  0.4s cubic-bezier(.4,0,.2,1) forwards; }

        .card-enter { animation:cardIn 0.35s cubic-bezier(.22,1,.36,1) both; }
        .next-rise  { animation:nextRise 0.4s cubic-bezier(.22,1,.36,1) both; }

        .ov-r {
          position:absolute; top:0; right:0; bottom:0; width:55%;
          border-radius:inherit; pointer-events:none;
          background:linear-gradient(to left, rgba(34,197,94,0.7) 0%, transparent 100%);
        }
        .ov-l {
          position:absolute; top:0; left:0; bottom:0; width:55%;
          border-radius:inherit; pointer-events:none;
          background:linear-gradient(to right, rgba(195,7,63,0.7) 0%, transparent 100%);
        }

        .sw-btn {
          border:none; border-radius:50%; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          -webkit-tap-highlight-color:transparent;
          transition:transform 0.15s, box-shadow 0.15s;
        }
        .sw-btn:active { transform:scale(0.86) !important; }

        .hint-pill {
          position:absolute; bottom:18px; left:50%;
          transform:translateX(-50%);
          display:flex; align-items:center; gap:12px;
          background:rgba(9,9,11,0.85); backdrop-filter:blur(14px);
          border:1px solid rgba(255,255,255,0.07); border-radius:100px;
          padding:10px 22px; pointer-events:none; z-index:20;
          animation:hintAnim 4.5s 1s ease both; white-space:nowrap;
        }
        .hint-sep { width:1px; height:14px; background:rgba(255,255,255,0.1); }
      `}</style>

      <div className="sw-blob sw-blob-1"/>
      <div className="sw-blob sw-blob-2"/>

      <main style={{
        height:'100dvh', background:'var(--bg)',
        display:'flex', flexDirection:'column',
        fontFamily:"'Onest',sans-serif", color:'#F0F0F0',
        userSelect:'none', overflow:'hidden', position:'relative', zIndex:1,
      }}>

        {/* Хедер */}
        <div style={{ padding:'max(48px,env(safe-area-inset-top,48px)) 24px 0', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexShrink:0, animation:'fadeUp 0.4s ease both' }}>
          <div>
            <h1 style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:20, letterSpacing:'-1px', lineHeight:1, color:'#fff' }}>
              tusi<span style={{ color:'#C3073F' }}>'m</span>
            </h1>
            <p style={{ color:'rgba(255,255,255,0.25)', fontSize:12, marginTop:5 }}>Голосование</p>
          </div>
          {photos.length > 0 && !done && (
            <div style={{ textAlign:'right', animation:'fadeUp 0.4s 0.05s ease both' }}>
              <div style={{ fontSize:13, color:'#C3073F', fontWeight:900, background:'rgba(195,7,63,0.1)', border:'1px solid rgba(195,7,63,0.2)', padding:'5px 14px', borderRadius:100, fontFamily:"'Unbounded',sans-serif", letterSpacing:'-0.3px' }}>
                {index + 1} <span style={{ color:'rgba(195,7,63,0.4)' }}>/ {photos.length}</span>
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', marginTop:5 }}>❤️ {likedCount} лайков</div>
            </div>
          )}
        </div>

        {/* Прогресс */}
        {photos.length > 0 && !done && (
          <div style={{ padding:'12px 24px 0', flexShrink:0 }}>
            <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:100, height:3, overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:100, background:'linear-gradient(90deg,#6F2232,#C3073F)', width:`${progress}%`, transition:'width 0.4s cubic-bezier(.22,1,.36,1)' }}/>
            </div>
          </div>
        )}

        {/* Карточки */}
        <div style={{ flex:1, position:'relative', padding:'14px 18px 0', overflow:'hidden', minHeight:0 }}>

          {/* Загрузка */}
          {loading && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.05)', borderTopColor:'#C3073F', animation:'spin 0.8s linear infinite' }}/>
              <span style={{ color:'rgba(255,255,255,0.2)', fontSize:13 }}>Загружаем фото...</span>
            </div>
          )}

          {/* Нет фото */}
          {!loading && photos.length === 0 && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
              <div style={{ width:80, height:80, borderRadius:24, background:'rgba(195,7,63,0.06)', border:'1px solid rgba(195,7,63,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>📸</div>
              <p style={{ color:'rgba(255,255,255,0.25)', fontSize:14, textAlign:'center', lineHeight:1.7 }}>
                Пока нет фото<br/><span style={{ fontSize:12 }}>Сначала сделай снимки</span>
              </p>
            </div>
          )}

          {/* Готово */}
          {done && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:24 }}>
              <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 60% 50% at 50% 50%,rgba(195,7,63,0.07) 0%,transparent 70%)' }}/>
              <div style={{ fontSize:64, lineHeight:1, animation:'popIn 0.5s cubic-bezier(.22,1,.36,1) both' }}>🎉</div>
              <h2 style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:22, textAlign:'center', letterSpacing:'-0.8px', lineHeight:1.2, animation:'fadeUp 0.4s 0.1s ease both' }}>
                Всё просмотрел!
              </h2>
              <p style={{ color:'rgba(255,255,255,0.35)', fontSize:14, textAlign:'center', lineHeight:1.7, animation:'fadeUp 0.4s 0.18s ease both' }}>
                Ты лайкнул <span style={{ color:'#C3073F', fontWeight:900 }}>{likedCount}</span> из {photos.length} фото
              </p>
              <button onClick={reset} style={{
                background:'linear-gradient(135deg,#C3073F,#6F2232)', color:'#fff', border:'none',
                borderRadius:100, padding:'16px 36px', fontSize:15, fontWeight:700, cursor:'pointer',
                fontFamily:"'Onest',sans-serif", boxShadow:'0 4px 28px rgba(195,7,63,0.4)',
                WebkitTapHighlightColor:'transparent',
                animation:'fadeUp 0.4s 0.26s ease both',
              }}>
                Смотреть снова
              </button>
            </div>
          )}

          {/* Следующая карточка */}
          {!loading && !done && next && (
            <div className={flying ? 'next-rise' : ''} style={{
              position:'absolute', inset:'14px 18px 0',
              borderRadius:24, overflow:'hidden', zIndex:1,
              transform: flying ? undefined : `scale(${0.92 + dragProg * 0.08}) translateY(${14 - dragProg * 14}px)`,
              transition: dragX !== 0 ? 'none' : 'transform 0.3s ease',
            }}>
              <img src={next.url} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.2)' }}/>
            </div>
          )}

          {/* Текущая карточка */}
          {!loading && !done && current && (
            <div
              id={cardId.current}
              className={`card-enter${flying ? ` fly-${flying}` : ''}`}
              style={{
                position:'absolute', inset:'14px 18px 0',
                borderRadius:24, overflow:'hidden', zIndex:2,
                cursor:'grab',
                transform: !flying && dragX !== 0 ? `translateX(${dragX}px) rotate(${dragX * 0.04}deg)` : undefined,
                transition: !flying && dragX !== 0 ? 'none' : undefined,
                boxShadow: showOv === 'right'
                  ? `0 20px 60px rgba(34,197,94,${dragProg * 0.4}), 0 4px 20px rgba(0,0,0,0.5)`
                  : showOv === 'left'
                  ? `0 20px 60px rgba(195,7,63,${dragProg * 0.4}), 0 4px 20px rgba(0,0,0,0.5)`
                  : '0 8px 40px rgba(0,0,0,0.5)',
                willChange:'transform',
              }}
            >
              <img src={current.url} style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block', userSelect:'none' }} draggable={false}/>

              {showOv === 'right' && <div className="ov-r" style={{ opacity:Math.min(dragProg * 1.2, 1) }}/>}
              {showOv === 'left'  && <div className="ov-l" style={{ opacity:Math.min(dragProg * 1.2, 1) }}/>}

              <div className="stamp stamp-like">ОГОНЬ 🔥</div>
              <div className="stamp stamp-skip">ДАЛЬШЕ</div>

              {/* Инфо автора */}
              <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,0.85))', padding:'52px 20px 24px', pointerEvents:'none' }}>
                <div style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:15, color:'#fff', marginBottom:5, letterSpacing:'-0.3px' }}>
                  {current.author || 'Гость'}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>{current.votes||0} лайков</span>
                  {isLiked && (
                    <span style={{ fontSize:10, color:'#C3073F', background:'rgba(195,7,63,0.25)', padding:'2px 9px', borderRadius:100, fontWeight:700 }}>
                      уже лайкнул
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Подсказка */}
          {!loading && !done && photos.length > 0 && index === 0 && (
            <div className="hint-pill">
              <span style={{ fontSize:16 }}>👈</span>
              <span style={{ fontFamily:"'Onest',sans-serif", fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.35)' }}>пропустить</span>
              <div className="hint-sep"/>
              <span style={{ fontFamily:"'Onest',sans-serif", fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.35)' }}>лайк</span>
              <span style={{ fontSize:16 }}>👉</span>
            </div>
          )}
        </div>

        {/* Кнопки */}
        {!loading && !done && current && (
          <div style={{
            padding:'16px 32px',
            paddingBottom:'max(24px,env(safe-area-inset-bottom,24px))',
            display:'flex', alignItems:'center', justifyContent:'center', gap:28,
            flexShrink:0, animation:'fadeUp 0.4s 0.15s ease both',
          }}>
            {/* Пропустить */}
            <button className="sw-btn" onClick={triggerSkip} style={{
              width:64, height:64,
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.08)',
              boxShadow:'0 4px 20px rgba(0,0,0,0.4)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Лайк */}
            <button className="sw-btn" onClick={triggerLike} style={{
              width:80, height:80, border:'none', fontSize:30,
              background: isLiked
                ? 'linear-gradient(135deg,#6F2232,#950740)'
                : 'linear-gradient(135deg,#C3073F,#6F2232)',
              boxShadow: isLiked
                ? '0 4px 20px rgba(195,7,63,0.2)'
                : '0 6px 32px rgba(195,7,63,0.5)',
              transform: showOv === 'right' ? `scale(${1 + dragProg * 0.2})` : 'scale(1)',
              transition:'background 0.2s, box-shadow 0.2s, transform 0.08s',
            }}>
              {isLiked ? '✓' : '❤️'}
            </button>
          </div>
        )}

        <div style={{ height:90, flexShrink:0 }}/>
      </main>
    </>
  )
}