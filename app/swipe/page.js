'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Onest:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #1A1A1D; overflow: hidden; }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(18px);} to{opacity:1;transform:translateY(0);} }
  @keyframes fadeIn  { from{opacity:0;} to{opacity:1;} }
  @keyframes spin    { to{transform:rotate(360deg);} }
  @keyframes popIn   { 0%{opacity:0;transform:scale(0.4) rotate(-12deg);} 60%{opacity:1;transform:scale(1.12) rotate(3deg);} 100%{opacity:1;transform:scale(1);} }
  @keyframes cardIn  { from{opacity:0;transform:scale(0.93) translateY(14px);} to{opacity:1;transform:scale(1) translateY(0);} }
  @keyframes stampShow {
    0%   { opacity:0; transform:scale(0.5) rotate(var(--r0)); }
    55%  { opacity:1; transform:scale(1.2)  rotate(var(--r1)); }
    100% { opacity:1; transform:scale(1)    rotate(var(--r2)); }
  }
  @keyframes hintSlide {
    0%   { opacity:0; transform:translateX(-50%) translateY(8px); }
    20%  { opacity:1; transform:translateX(-50%) translateY(0); }
    75%  { opacity:1; transform:translateX(-50%) translateY(0); }
    100% { opacity:0; transform:translateX(-50%) translateY(-6px); }
  }

  .stamp {
    position:absolute; top:32px; border:3px solid; border-radius:10px;
    font-family:'Unbounded',sans-serif; font-weight:900;
    font-size:22px; padding:6px 14px; pointer-events:none; z-index:10;
    opacity:0; letter-spacing:0.04em; white-space:nowrap;
  }
  .stamp-like { left:20px; color:#1DB954; border-color:#1DB954; --r0:-25deg; --r1:-18deg; --r2:-20deg; text-shadow:0 0 24px rgba(29,185,84,0.6); }
  .stamp-skip { right:20px; color:#C3073F; border-color:#C3073F; --r0:25deg; --r1:18deg; --r2:20deg; text-shadow:0 0 24px rgba(195,7,63,0.6); }
  .show-like .stamp-like { animation:stampShow 0.35s cubic-bezier(.22,1,.36,1) forwards; }
  .show-skip .stamp-skip { animation:stampShow 0.35s cubic-bezier(.22,1,.36,1) forwards; }

  .card-el { animation:cardIn 0.35s cubic-bezier(.22,1,.36,1) both; }

  /* Боковые оверлеи — gradient только от края */
  .ov-right {
    position:absolute; top:0; right:0; bottom:0; width:55%;
    pointer-events:none; border-radius:inherit;
    background:linear-gradient(to left, rgba(29,185,84,0.7) 0%, transparent 100%);
  }
  .ov-left {
    position:absolute; top:0; left:0; bottom:0; width:55%;
    pointer-events:none; border-radius:inherit;
    background:linear-gradient(to right, rgba(195,7,63,0.7) 0%, transparent 100%);
  }

  .act-btn {
    border:none; border-radius:50%; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    -webkit-tap-highlight-color:transparent;
  }
  .act-btn:active { transform:scale(0.88) !important; }

  .done-emoji { animation:popIn 0.5s cubic-bezier(.22,1,.36,1) both; }
  .done-title { animation:fadeUp 0.45s cubic-bezier(.22,1,.36,1) 0.1s both; }
  .done-sub   { animation:fadeUp 0.45s cubic-bezier(.22,1,.36,1) 0.18s both; }
  .done-btn   { animation:fadeUp 0.45s cubic-bezier(.22,1,.36,1) 0.26s both; }

  .hint-pill {
    position:absolute; bottom:18px; left:50%;
    transform:translateX(-50%);
    display:flex; align-items:center; gap:14px;
    background:rgba(10,10,12,0.75); backdrop-filter:blur(14px);
    border:1px solid rgba(255,255,255,0.08); border-radius:100px;
    padding:9px 20px; pointer-events:none; z-index:20;
    animation:hintSlide 4s 1.2s ease both; white-space:nowrap;
  }
  .hint-pill span { font-family:'Onest',sans-serif; font-size:12px; font-weight:500; color:#777; }
  .hint-sep { width:1px; height:13px; background:rgba(255,255,255,0.1); flex-shrink:0; }
`

export default function SwipePage() {
  const [photos, setPhotos]         = useState([])
  const [index, setIndex]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [done, setDone]             = useState(false)
  const [swipeDir, setSwipeDir]     = useState(null)
  const [likedCount, setLikedCount] = useState(0)
  const [liked, setLiked]           = useState({})
  const [dragState, setDragState]   = useState({ x: 0, dragging: false })

  const animating   = useRef(false)
  const touchStart  = useRef(null)
  const cardId      = useRef(`card-${Date.now()}`) // уникальный id для DOM

  useEffect(() => {
    const params  = new URLSearchParams(window.location.search)
    const eventId = params.get('event_id') || localStorage.getItem('tusim_event_id')
    try { setLiked(JSON.parse(localStorage.getItem('tusim_liked') || '{}')) } catch {}
    if (eventId) loadPhotos(eventId)
    else setLoading(false)
  }, [])

  // Вешаем touch listeners напрямую на DOM-элемент по id
  useEffect(() => {
    const card = document.getElementById(cardId.current)
    if (!card || done || loading) return

    let startX = null, startY = null, dragging = false

    function onStart(e) {
      if (animating.current) return
      const touch = e.touches ? e.touches[0] : e
      startX = touch.clientX
      startY = touch.clientY
      dragging = true
    }

    function onMove(e) {
      if (!dragging || startX === null) return
      const touch = e.touches ? e.touches[0] : e
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY
      if (e.touches && Math.abs(dy) > Math.abs(dx)) return // вертикальный скролл — не трогаем
      if (e.cancelable) e.preventDefault()
      setDragState({ x: dx, dragging: true })
    }

    function onEnd(e) {
      if (!dragging) return
      dragging = false
      const touch = e.changedTouches ? e.changedTouches[0] : e
      const dx = touch.clientX - startX
      setDragState({ x: 0, dragging: false })
      if (Math.abs(dx) > 60) {
        dx > 0 ? doLike() : doSkip()
      }
      startX = null
    }

    card.addEventListener('touchstart', onStart, { passive: true })
    card.addEventListener('touchmove',  onMove,  { passive: false })
    card.addEventListener('touchend',   onEnd,   { passive: true })
    card.addEventListener('mousedown',  onStart)
    card.addEventListener('mousemove',  (e) => { if (dragging) onMove(e) })
    card.addEventListener('mouseup',    onEnd)
    card.addEventListener('mouseleave', onEnd)

    return () => {
      card.removeEventListener('touchstart', onStart)
      card.removeEventListener('touchmove',  onMove)
      card.removeEventListener('touchend',   onEnd)
      card.removeEventListener('mousedown',  onStart)
      card.removeEventListener('mousemove',  onMove)
      card.removeEventListener('mouseup',    onEnd)
      card.removeEventListener('mouseleave', onEnd)
    }
  }, [index, done, loading, liked]) // перевешиваем при смене карточки

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
  const dx       = dragState.x
  const absDx    = Math.abs(dx)
  const dragProg = Math.min(absDx / 100, 1)
  const goRight  = dx > 12
  const goLeft   = dx < -12

  function doLike() {
    if (!current || animating.current) return
    animating.current = true
    setDragState({ x: 0, dragging: false })
    setSwipeDir('right')
    if (!liked[current.id]) {
      const nl = { ...liked, [current.id]: true }
      localStorage.setItem('tusim_liked', JSON.stringify(nl))
      setLiked(nl)
      setLikedCount(p => p + 1)
      supabase.from('photos').update({ votes: (current.votes || 0) + 1 }).eq('id', current.id)
    }
    setTimeout(() => {
      setSwipeDir(null)
      cardId.current = `card-${Date.now()}`
      if (index + 1 >= photos.length) setDone(true)
      else setIndex(p => p + 1)
      animating.current = false
    }, 380)
  }

  function doSkip() {
    if (!current || animating.current) return
    animating.current = true
    setDragState({ x: 0, dragging: false })
    setSwipeDir('left')
    setTimeout(() => {
      setSwipeDir(null)
      cardId.current = `card-${Date.now()}`
      if (index + 1 >= photos.length) setDone(true)
      else setIndex(p => p + 1)
      animating.current = false
    }, 380)
  }

  function getCardTransform() {
    if (swipeDir === 'right') return 'translateX(145%) rotate(26deg)'
    if (swipeDir === 'left')  return 'translateX(-145%) rotate(-26deg)'
    if (dx !== 0) {
      const rot = Math.sign(dx) * Math.min(absDx * 0.13, 22)
      const liftY = -absDx * 0.035
      return `translateX(${dx}px) translateY(${liftY}px) rotate(${rot}deg)`
    }
    return 'none'
  }

  function reset() {
    setIndex(0); setDone(false); setLikedCount(0)
    setDragState({ x: 0, dragging: false })
  }

  const stampClass = goRight ? 'show-like' : goLeft ? 'show-skip' : ''

  return (
    <>
      <style>{STYLES}</style>
      <main style={{
        height: '100dvh', background: '#1A1A1D',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Onest',sans-serif", color: '#F0F0F0',
        userSelect: 'none', overflow: 'hidden',
      }}>

        {/* Шапка */}
        <div style={{ padding:'max(48px,env(safe-area-inset-top,48px)) 24px 0', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ animation:'fadeUp 0.4s ease both' }}>
            <h1 style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'20px', letterSpacing:'-0.5px', lineHeight:1 }}>
              tusi<span style={{ color:'#C3073F' }}>'m</span>
            </h1>
            <p style={{ color:'#2a2a2a', fontSize:'12px', marginTop:'4px' }}>Голосование</p>
          </div>
          {photos.length > 0 && !done && (
            <div style={{ textAlign:'right', animation:'fadeUp 0.4s 0.05s ease both' }}>
              <div style={{ fontSize:'13px', color:'#C3073F', fontWeight:700, background:'rgba(195,7,63,0.1)', border:'1px solid rgba(195,7,63,0.2)', padding:'5px 14px', borderRadius:'100px', fontFamily:"'Unbounded',sans-serif" }}>
                {index + 1} <span style={{ color:'#6F2232' }}>/ {photos.length}</span>
              </div>
              <div style={{ fontSize:'11px', color:'#2a2a2a', marginTop:'5px' }}>❤️ {likedCount} лайков</div>
            </div>
          )}
        </div>

        {/* Прогресс */}
        {photos.length > 0 && !done && (
          <div style={{ padding:'12px 24px 0', flexShrink:0 }}>
            <div style={{ background:'#1a1a1a', borderRadius:'100px', height:'3px', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:'100px', background:'linear-gradient(90deg,#6F2232,#C3073F)', width:`${progress}%`, transition:'width 0.4s ease' }}/>
            </div>
          </div>
        )}

        {/* Карточки */}
        <div style={{ flex:1, position:'relative', padding:'14px 18px 0', overflow:'hidden', minHeight:0 }}>

          {loading && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'14px' }}>
              <div style={{ width:'34px', height:'34px', borderRadius:'50%', border:'3px solid #1e1e1e', borderTopColor:'#C3073F', animation:'spin 0.8s linear infinite' }}/>
              <span style={{ color:'#2a2a2a', fontSize:'13px' }}>Загружаем фото...</span>
            </div>
          )}

          {!loading && photos.length === 0 && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px' }}>
              <div style={{ fontSize:'52px' }}>📸</div>
              <p style={{ color:'#2a2a2a', fontSize:'14px', textAlign:'center', lineHeight:1.6 }}>Пока нет фото</p>
            </div>
          )}

          {done && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'14px', padding:'24px' }}>
              <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 60% 50% at 50% 50%,rgba(195,7,63,0.07) 0%,transparent 70%)' }}/>
              <div className="done-emoji" style={{ fontSize:'68px', lineHeight:1 }}>🎉</div>
              <h2 className="done-title" style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'22px', textAlign:'center', letterSpacing:'-0.5px', lineHeight:1.2 }}>Всё просмотрел!</h2>
              <p className="done-sub" style={{ color:'#555', fontSize:'14px', textAlign:'center', lineHeight:1.7 }}>
                Ты лайкнул <span style={{ color:'#C3073F', fontWeight:700 }}>{likedCount}</span> из {photos.length} фото
              </p>
              <button className="done-btn" onClick={reset} style={{ background:'linear-gradient(135deg,#C3073F,#6F2232)', color:'#fff', border:'none', borderRadius:'100px', padding:'15px 34px', fontSize:'15px', fontWeight:700, cursor:'pointer', fontFamily:"'Onest',sans-serif", boxShadow:'0 4px 24px rgba(195,7,63,0.35)', WebkitTapHighlightColor:'transparent' }}>
                Смотреть снова
              </button>
            </div>
          )}

          {/* Следующая карточка */}
          {!loading && !done && next && (
            <div style={{
              position:'absolute', inset:'14px 18px 0',
              borderRadius:'22px', overflow:'hidden', zIndex:1,
              transform: `scale(${0.92 + dragProg * 0.08}) translateY(${14 - dragProg * 14}px)`,
              transition: dx !== 0 ? 'none' : 'transform 0.3s ease',
            }}>
              <img src={next.url} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.22)' }}/>
            </div>
          )}

          {/* Текущая карточка */}
          {!loading && !done && current && (
            <div
              id={cardId.current}
              className={`card-el ${stampClass}`}
              style={{
                position:'absolute', inset:'14px 18px 0',
                borderRadius:'22px', overflow:'hidden', zIndex:2,
                cursor: dragState.dragging ? 'grabbing' : 'grab',
                transform: getCardTransform(),
                transition: swipeDir
                  ? 'transform 0.38s cubic-bezier(.22,1,.36,1), opacity 0.38s ease'
                  : dx !== 0 ? 'none' : 'transform 0.18s ease',
                opacity: swipeDir ? 0 : 1,
                boxShadow: goRight
                  ? `0 20px 60px rgba(29,185,84,${dragProg * 0.4}), 0 4px 20px rgba(0,0,0,0.4)`
                  : goLeft
                  ? `0 20px 60px rgba(195,7,63,${dragProg * 0.4}), 0 4px 20px rgba(0,0,0,0.4)`
                  : '0 8px 32px rgba(0,0,0,0.4)',
                willChange: 'transform',
              }}
            >
              <img src={current.url} style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block', userSelect:'none' }} draggable={false}/>

              {/* Боковые оверлеи — только с нужной стороны */}
              {goRight && <div className="ov-right" style={{ opacity: Math.min(dragProg * 1.3, 0.9) }}/>}
              {goLeft  && <div className="ov-left"  style={{ opacity: Math.min(dragProg * 1.3, 0.9) }}/>}

              <div className="stamp stamp-like">ОГОНЬ 🔥</div>
              <div className="stamp stamp-skip">ДАЛЬШЕ</div>

              <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,0.85))', padding:'48px 18px 20px', pointerEvents:'none' }}>
                <div style={{ fontWeight:700, fontSize:'15px', color:'#fff' }}>{current.author || 'Гость'}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'4px' }}>
                  <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>{current.votes||0} лайков</span>
                  {liked[current.id] && <span style={{ fontSize:'10px', color:'#C3073F', background:'rgba(195,7,63,0.25)', padding:'1px 8px', borderRadius:'100px' }}>уже лайкнул</span>}
                </div>
              </div>
            </div>
          )}

          {/* Подсказка */}
          {!loading && !done && photos.length > 0 && index === 0 && (
            <div className="hint-pill">
              <span style={{ fontSize:'16px' }}>👈</span>
              <span>пропустить</span>
              <div className="hint-sep"/>
              <span>лайк</span>
              <span style={{ fontSize:'16px' }}>👉</span>
            </div>
          )}
        </div>

        {/* Кнопки — только две */}
        {!loading && !done && current && (
          <div style={{
            padding:'16px 32px', paddingBottom:'max(24px,env(safe-area-inset-bottom,24px))',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'32px',
            flexShrink:0, animation:'fadeUp 0.4s 0.15s ease both',
          }}>
            {/* Пропустить */}
            <button className="act-btn" onClick={doSkip} style={{
              width:'62px', height:'62px', background:'#161616',
              border:'1px solid #2a2a2a', fontSize:'22px', color:'#555',
              boxShadow:'0 4px 16px rgba(0,0,0,0.4)',
              transform: goLeft ? `scale(${1 + dragProg * 0.15})` : 'scale(1)',
              transition:'transform 0.08s, box-shadow 0.2s',
            }}>→</button>

            {/* Лайк */}
            <button className="act-btn" onClick={doLike} style={{
              width:'80px', height:'80px', fontSize:'32px', border:'none',
              background: liked[current?.id] ? 'linear-gradient(135deg,#6F2232,#950740)' : 'linear-gradient(135deg,#C3073F,#6F2232)',
              boxShadow: liked[current?.id] ? '0 4px 20px rgba(195,7,63,0.2)' : '0 6px 32px rgba(195,7,63,0.55)',
              transform: goRight ? `scale(${1 + dragProg * 0.22})` : 'scale(1)',
              transition:'transform 0.08s, box-shadow 0.2s, background 0.2s',
            }}>
              {liked[current?.id] ? '✓' : '❤️'}
            </button>
          </div>
        )}

        <div style={{ height:'90px', flexShrink:0 }}/>
      </main>
    </>
  )
}