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

  @keyframes fadeUp   { from{opacity:0;transform:translateY(18px);} to{opacity:1;transform:translateY(0);} }
  @keyframes fadeIn   { from{opacity:0;} to{opacity:1;} }
  @keyframes pulse    { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
  @keyframes spin     { to{transform:rotate(360deg);} }
  @keyframes popIn    { 0%{opacity:0;transform:scale(0.4) rotate(-12deg);} 60%{opacity:1;transform:scale(1.12) rotate(3deg);} 100%{opacity:1;transform:scale(1) rotate(0);} }
  @keyframes cardIn   { from{opacity:0;transform:scale(0.93) translateY(14px);} to{opacity:1;transform:scale(1) translateY(0);} }
  @keyframes stampShow {
    0%   { opacity:0; transform:scale(0.5) rotate(var(--r0)); }
    55%  { opacity:1; transform:scale(1.15) rotate(var(--r1)); }
    100% { opacity:1; transform:scale(1) rotate(var(--r2)); }
  }
  @keyframes hintSlide {
    0%   { opacity:0; transform:translateY(6px); }
    20%  { opacity:1; transform:translateY(0); }
    75%  { opacity:1; transform:translateY(0); }
    100% { opacity:0; transform:translateY(-4px); }
  }

  .stamp {
    position:absolute; top:32px;
    border:3px solid; border-radius:10px;
    font-family:'Unbounded',sans-serif; font-weight:900;
    font-size:22px; padding:6px 14px;
    pointer-events:none; z-index:10;
    opacity:0; letter-spacing:0.04em; white-space:nowrap;
  }
  .stamp-like { left:20px; color:#1DB954; border-color:#1DB954; --r0:-25deg; --r1:-18deg; --r2:-20deg; text-shadow:0 0 24px rgba(29,185,84,0.6); }
  .stamp-skip { right:20px; color:#C3073F; border-color:#C3073F; --r0:25deg; --r1:18deg; --r2:20deg; text-shadow:0 0 24px rgba(195,7,63,0.6); }
  .show-like .stamp-like { animation:stampShow 0.35s cubic-bezier(.22,1,.36,1) forwards; }
  .show-skip .stamp-skip { animation:stampShow 0.35s cubic-bezier(.22,1,.36,1) forwards; }

  .card-wrap { animation:cardIn 0.35s cubic-bezier(.22,1,.36,1) both; }

  .side-overlay-right {
    position:absolute; inset:0; pointer-events:none; border-radius:inherit;
    background:linear-gradient(to left, rgba(29,185,84,0.55) 0%, transparent 65%);
  }
  .side-overlay-left {
    position:absolute; inset:0; pointer-events:none; border-radius:inherit;
    background:linear-gradient(to right, rgba(195,7,63,0.55) 0%, transparent 65%);
  }

  .act-btn {
    border:none; border-radius:50%; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    -webkit-tap-highlight-color:transparent;
  }
  .act-btn:active { transform:scale(0.88) !important; }

  .done-emoji { animation:popIn 0.5s cubic-bezier(.22,1,.36,1) both; }
  .done-title { animation:fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.1s both; }
  .done-sub   { animation:fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.18s both; }
  .done-btn   { animation:fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.26s both; }

  .hint-bar {
    position:absolute; bottom:16px; left:50%; transform:translateX(-50%);
    display:flex; align-items:center; gap:16px;
    background:rgba(0,0,0,0.55); backdrop-filter:blur(10px);
    border:1px solid rgba(255,255,255,0.08);
    border-radius:100px; padding:10px 20px;
    animation:hintSlide 3.5s 1s ease both;
    pointer-events:none; z-index:10; white-space:nowrap;
  }
  .hint-item {
    display:flex; align-items:center; gap:6px;
    font-family:'Onest',sans-serif; font-size:12px; font-weight:500; color:#888;
  }
  .hint-sep { width:1px; height:14px; background:rgba(255,255,255,0.1); }
`

export default function SwipePage() {
  const [photos, setPhotos]         = useState([])
  const [index, setIndex]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [done, setDone]             = useState(false)
  const [swipeDir, setSwipeDir]     = useState(null)
  const [likedCount, setLikedCount] = useState(0)
  const [dragX, setDragX]           = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [liked, setLiked]           = useState({})

  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const animating   = useRef(false)
  const cardRef     = useRef(null)
  const dragXRef    = useRef(0) // ref для touch handlers (избегаем stale closure)

  useEffect(() => {
    // Берём event_id из URL или localStorage
    const params  = new URLSearchParams(window.location.search)
    const eventId = params.get('event_id') || localStorage.getItem('tusim_event_id')
    try { setLiked(JSON.parse(localStorage.getItem('tusim_liked') || '{}')) } catch {}
    if (eventId) loadPhotos(eventId)
    else setLoading(false)
  }, [])

  // Вешаем touch-обработчики с { passive: false } через useEffect
  // чтобы preventDefault работал и карточка тянулась без scroll
  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    function handleTouchStart(e) {
      if (animating.current) return
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      setIsDragging(true)
    }

    function handleTouchMove(e) {
      if (touchStartX.current === null) return
      const dx = e.touches[0].clientX - touchStartX.current
      const dy = e.touches[0].clientY - touchStartY.current
      if (Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault() // теперь работает — listener не passive
        dragXRef.current = dx
        setDragX(dx)
      }
    }

    function handleTouchEnd(e) {
      setIsDragging(false)
      if (touchStartX.current === null) return
      const dx = e.changedTouches[0].clientX - touchStartX.current
      const dy = e.changedTouches[0].clientY - touchStartY.current
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 55) {
        dx > 0 ? handleLikeRef.current() : handleSkipRef.current()
      } else {
        setDragX(0)
        dragXRef.current = 0
      }
      touchStartX.current = null
    }

    card.addEventListener('touchstart', handleTouchStart, { passive: true })
    card.addEventListener('touchmove',  handleTouchMove,  { passive: false })
    card.addEventListener('touchend',   handleTouchEnd,   { passive: true })

    return () => {
      card.removeEventListener('touchstart', handleTouchStart)
      card.removeEventListener('touchmove',  handleTouchMove)
      card.removeEventListener('touchend',   handleTouchEnd)
    }
  }, [index, done]) // перевешиваем при смене карточки

  // Refs для функций чтобы touch handlers могли их вызвать
  const handleLikeRef = useRef(null)
  const handleSkipRef = useRef(null)

  async function loadPhotos(eventId) {
    const { data } = await supabase
      .from('photos').select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    if (data) setPhotos(data)
    setLoading(false)
  }

  const current      = photos[index]
  const next         = photos[index + 1]
  const progress     = photos.length ? (index / photos.length) * 100 : 0
  const dragProgress = Math.min(Math.abs(dragX) / 90, 1)
  const isDragRight  = dragX > 15
  const isDragLeft   = dragX < -15
  const stampClass   = isDragRight ? 'show-like' : isDragLeft ? 'show-skip' : ''

  function saveLiked(nl) { localStorage.setItem('tusim_liked', JSON.stringify(nl)); setLiked(nl) }

  async function handleLike() {
    if (!current || animating.current) return
    animating.current = true
    setSwipeDir('right')
    setDragX(0); dragXRef.current = 0

    if (!liked[current.id]) {
      const nl = { ...liked, [current.id]: true }
      saveLiked(nl)
      setLikedCount(p => p + 1)
      supabase.from('photos').update({ votes: (current.votes || 0) + 1 }).eq('id', current.id)
    }

    setTimeout(() => {
      setSwipeDir(null)
      if (index + 1 >= photos.length) setDone(true)
      else setIndex(p => p + 1)
      animating.current = false
    }, 380)
  }

  async function handleSkip() {
    if (!current || animating.current) return
    animating.current = true
    setSwipeDir('left')
    setDragX(0); dragXRef.current = 0

    setTimeout(() => {
      setSwipeDir(null)
      if (index + 1 >= photos.length) setDone(true)
      else setIndex(p => p + 1)
      animating.current = false
    }, 380)
  }

  // Обновляем refs при каждом рендере
  handleLikeRef.current = handleLike
  handleSkipRef.current = handleSkip

  // Mouse drag
  function onMouseDown(e) {
    if (animating.current) return
    touchStartX.current = e.clientX
    setIsDragging(true)
  }
  function onMouseMove(e) {
    if (touchStartX.current === null || !isDragging) return
    const dx = e.clientX - touchStartX.current
    setDragX(dx)
  }
  function onMouseUp(e) {
    setIsDragging(false)
    if (touchStartX.current === null) return
    const dx = e.clientX - touchStartX.current
    if (Math.abs(dx) > 55) dx > 0 ? handleLike() : handleSkip()
    else setDragX(0)
    touchStartX.current = null
  }

  function getCardTransform() {
    if (swipeDir === 'right') return 'translateX(140%) rotate(25deg)'
    if (swipeDir === 'left')  return 'translateX(-140%) rotate(-25deg)'
    if (dragX !== 0) {
      // Нелинейный наклон — быстрый в начале, плавеет к концу
      const rot   = Math.sign(dragX) * Math.min(Math.pow(Math.abs(dragX) / 8, 0.72), 20)
      const liftY = -Math.abs(dragX) * 0.045
      return `translateX(${dragX}px) translateY(${liftY}px) rotate(${rot}deg)`
    }
    return 'translateX(0) rotate(0deg)'
  }

  function getNextTransform() {
    const scale  = 0.93 + dragProgress * 0.07
    const transY = 12 - dragProgress * 12
    return `scale(${scale}) translateY(${transY}px)`
  }

  function reset() { setIndex(0); setDone(false); setLikedCount(0); setDragX(0) }

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
          <div style={{ padding:'12px 24px 0', flexShrink:0, animation:'fadeIn 0.5s 0.1s ease both' }}>
            <div style={{ background:'#1a1a1a', borderRadius:'100px', height:'3px', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:'100px', background:'linear-gradient(90deg,#6F2232,#C3073F)', width:`${progress}%`, transition:'width 0.4s cubic-bezier(.22,1,.36,1)' }}/>
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
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px', animation:'fadeUp 0.5s ease both' }}>
              <div style={{ fontSize:'52px' }}>📸</div>
              <p style={{ color:'#2a2a2a', fontSize:'14px', textAlign:'center', lineHeight:1.6 }}>
                Пока нет фото<br/><span style={{ fontSize:'12px' }}>Сначала сделай снимки</span>
              </p>
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
              transform: getNextTransform(),
              transition: isDragging ? 'none' : 'transform 0.3s ease',
            }}>
              <img src={next.url} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.2)' }}/>
            </div>
          )}

          {/* Текущая карточка */}
          {!loading && !done && current && (
            <div
              ref={cardRef}
              className={`card-wrap ${stampClass}`}
              style={{
                position:'absolute', inset:'14px 18px 0',
                borderRadius:'22px', overflow:'hidden', zIndex:2,
                cursor: isDragging ? 'grabbing' : 'grab',
                transform: getCardTransform(),
                transition: swipeDir
                  ? 'transform 0.38s cubic-bezier(.22,1,.36,1), opacity 0.38s ease'
                  : isDragging ? 'none' : 'transform 0.2s cubic-bezier(.22,1,.36,1)',
                opacity: swipeDir ? 0 : 1,
                boxShadow: isDragRight
                  ? `0 16px 56px rgba(29,185,84,${dragProgress * 0.4}), 0 4px 16px rgba(0,0,0,0.4)`
                  : isDragLeft
                  ? `0 16px 56px rgba(195,7,63,${dragProgress * 0.4}), 0 4px 16px rgba(0,0,0,0.4)`
                  : '0 8px 32px rgba(0,0,0,0.4)',
                willChange: 'transform',
              }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <img src={current.url} style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block' }}/>

              {isDragRight && <div className="side-overlay-right" style={{ opacity: dragProgress }}/>}
              {isDragLeft  && <div className="side-overlay-left"  style={{ opacity: dragProgress }}/>}

              <div className="stamp stamp-like">ОГОНЬ 🔥</div>
              <div className="stamp stamp-skip">ДАЛЬШЕ</div>

              <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,0.82))', padding:'44px 18px 18px', pointerEvents:'none' }}>
                <div style={{ fontWeight:700, fontSize:'15px', color:'#fff', fontFamily:"'Onest',sans-serif" }}>
                  {current.author || 'Гость'}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'4px' }}>
                  <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)' }}>{current.votes||0} лайков</span>
                  {liked[current.id] && (
                    <span style={{ fontSize:'10px', color:'#C3073F', background:'rgba(195,7,63,0.25)', padding:'1px 8px', borderRadius:'100px' }}>уже лайкнул</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Подсказка — красивый pill внутри карточки */}
          {!loading && !done && photos.length > 0 && index === 0 && (
            <div className="hint-bar">
              <div className="hint-item">
                <span style={{ fontSize:'15px' }}>👈</span>
                <span>пропустить</span>
              </div>
              <div className="hint-sep"/>
              <div className="hint-item">
                <span>лайк</span>
                <span style={{ fontSize:'15px' }}>👉</span>
              </div>
            </div>
          )}
        </div>

        {/* Кнопки */}
        {!loading && !done && current && (
          <div style={{
            padding:'14px 32px', paddingBottom:'max(20px,env(safe-area-inset-bottom,20px))',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'24px',
            flexShrink:0, animation:'fadeUp 0.4s 0.15s ease both',
          }}>
            <button className="act-btn" onClick={handleSkip} style={{ width:'58px', height:'58px', background:'#161616', border:'1px solid #222', fontSize:'24px', boxShadow:'0 4px 16px rgba(0,0,0,0.4)', transition:'transform 0.15s' }}>
              👎
            </button>
            <button className="act-btn" onClick={handleLike} style={{
              width:'74px', height:'74px', fontSize:'28px',
              background: liked[current?.id] ? 'linear-gradient(135deg,#6F2232,#950740)' : 'linear-gradient(135deg,#C3073F,#6F2232)',
              border:'none',
              boxShadow: liked[current?.id] ? '0 4px 20px rgba(195,7,63,0.25)' : '0 4px 28px rgba(195,7,63,0.5)',
              transform: isDragRight ? `scale(${1 + dragProgress * 0.18})` : 'scale(1)',
              transition:'transform 0.1s, box-shadow 0.2s',
            }}>
              {liked[current?.id] ? '✓' : '❤️'}
            </button>
            <button className="act-btn" onClick={handleSkip} style={{ width:'58px', height:'58px', background:'#161616', border:'1px solid #222', fontSize:'20px', color:'#444', boxShadow:'0 4px 16px rgba(0,0,0,0.4)', transition:'transform 0.15s' }}>
              →
            </button>
          </div>
        )}

        <div style={{ height:'90px', flexShrink:0 }}/>
      </main>
    </>
  )
}