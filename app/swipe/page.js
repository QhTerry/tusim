'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Onest:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #1A1A1D; overflow: hidden; touch-action: none; }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(18px);} to{opacity:1;transform:translateY(0);} }
  @keyframes fadeIn  { from{opacity:0;} to{opacity:1;} }
  @keyframes pulse   { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
  @keyframes spin    { to{transform:rotate(360deg);} }
  @keyframes popIn   { 0%{opacity:0;transform:scale(0.4) rotate(-12deg);} 60%{opacity:1;transform:scale(1.12) rotate(3deg);} 100%{opacity:1;transform:scale(1) rotate(0);} }
  @keyframes cardIn  { from{opacity:0;transform:scale(0.93) translateY(14px);} to{opacity:1;transform:scale(1) translateY(0);} }
  @keyframes stampShow {
    0%   { opacity:0; transform:scale(0.5) rotate(var(--r0)); }
    55%  { opacity:1; transform:scale(1.15) rotate(var(--r1)); }
    100% { opacity:1; transform:scale(1) rotate(var(--r2)); }
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

  .card-enter { animation:cardIn 0.35s cubic-bezier(.22,1,.36,1) both; }

  .overlay-right {
    position:absolute; inset:0; pointer-events:none; border-radius:inherit;
    background:linear-gradient(to left, rgba(29,185,84,0.6) 0%, transparent 60%);
  }
  .overlay-left {
    position:absolute; inset:0; pointer-events:none; border-radius:inherit;
    background:linear-gradient(to right, rgba(195,7,63,0.6) 0%, transparent 60%);
  }

  .act-btn {
    border:none; border-radius:50%; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    -webkit-tap-highlight-color:transparent;
    transition:transform 0.15s, box-shadow 0.15s;
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
    background:rgba(10,10,12,0.7); backdrop-filter:blur(12px);
    border:1px solid rgba(255,255,255,0.09); border-radius:100px;
    padding:9px 20px; pointer-events:none; z-index:20;
    animation:hintSlide 4s 1.2s ease both;
    white-space:nowrap;
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

  // Drag state — храним в refs чтобы не было stale closures в touch handlers
  const dragXRef      = useRef(0)
  const isDraggingRef = useRef(false)
  const touchStartX   = useRef(null)
  const touchStartY   = useRef(null)
  const animating     = useRef(false)

  // cardRef как ref callback — гарантирует что listeners вешаются сразу при mount
  const cardNodeRef   = useRef(null)

  // Для рендера drag — отдельный state обновляем через rAF
  const [dragX, setDragX] = useState(0)

  // Refs на актуальные handleLike/handleSkip (избегаем stale closure в touch handlers)
  const likeRef = useRef(null)
  const skipRef = useRef(null)

  useEffect(() => {
    const params  = new URLSearchParams(window.location.search)
    const eventId = params.get('event_id') || localStorage.getItem('tusim_event_id')
    try { setLiked(JSON.parse(localStorage.getItem('tusim_liked') || '{}')) } catch {}
    if (eventId) loadPhotos(eventId)
    else setLoading(false)
  }, [])

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
  const dragProgress = Math.min(Math.abs(dragX) / 100, 1)
  const isDragRight  = dragX > 12
  const isDragLeft   = dragX < -12
  const stampClass   = isDragRight ? 'show-like' : isDragLeft ? 'show-skip' : ''

  function saveLiked(nl) { localStorage.setItem('tusim_liked', JSON.stringify(nl)); setLiked(nl) }

  function handleLike() {
    if (!current || animating.current) return
    animating.current = true
    // Сбрасываем drag
    dragXRef.current = 0; setDragX(0)
    setSwipeDir('right')

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

  function handleSkip() {
    if (!current || animating.current) return
    animating.current = true
    dragXRef.current = 0; setDragX(0)
    setSwipeDir('left')

    setTimeout(() => {
      setSwipeDir(null)
      if (index + 1 >= photos.length) setDone(true)
      else setIndex(p => p + 1)
      animating.current = false
    }, 380)
  }

  // Обновляем refs каждый рендер
  likeRef.current = handleLike
  skipRef.current = handleSkip

  // ref callback — вешаем/снимаем listeners при каждом mount/unmount карточки
  const cardRef = useCallback((node) => {
    // Снимаем с предыдущего
    if (cardNodeRef.current) {
      cardNodeRef.current.removeEventListener('touchstart', onTouchStart)
      cardNodeRef.current.removeEventListener('touchmove',  onTouchMove)
      cardNodeRef.current.removeEventListener('touchend',   onTouchEnd)
    }
    cardNodeRef.current = node
    if (!node) return

    node.addEventListener('touchstart', onTouchStart, { passive: true })
    node.addEventListener('touchmove',  onTouchMove,  { passive: false }) // false чтобы preventDefault работал
    node.addEventListener('touchend',   onTouchEnd,   { passive: true })
  }, [index, done]) // пересоздаём при смене карточки

  function onTouchStart(e) {
    if (animating.current) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isDraggingRef.current = true
  }

  function onTouchMove(e) {
    if (!isDraggingRef.current || touchStartX.current === null) return
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current

    // Только горизонтальный свайп
    if (Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault()
      dragXRef.current = dx
      setDragX(dx) // триггерим ре-рендер для трансформации
    }
  }

  function onTouchEnd(e) {
    isDraggingRef.current = false
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 55) {
      dx > 0 ? likeRef.current() : skipRef.current()
    } else {
      dragXRef.current = 0
      setDragX(0)
    }
    touchStartX.current = null
  }

  // Mouse handlers
  function onMouseDown(e) {
    if (animating.current) return
    touchStartX.current = e.clientX
    isDraggingRef.current = true
  }
  function onMouseMove(e) {
    if (!isDraggingRef.current || touchStartX.current === null) return
    const dx = e.clientX - touchStartX.current
    dragXRef.current = dx
    setDragX(dx)
  }
  function onMouseUp(e) {
    isDraggingRef.current = false
    if (touchStartX.current === null) return
    const dx = e.clientX - touchStartX.current
    if (Math.abs(dx) > 55) dx > 0 ? handleLike() : handleSkip()
    else { dragXRef.current = 0; setDragX(0) }
    touchStartX.current = null
  }

  function getCardTransform() {
    if (swipeDir === 'right') return 'translateX(145%) rotate(26deg)'
    if (swipeDir === 'left')  return 'translateX(-145%) rotate(-26deg)'
    if (dragX !== 0) {
      // Наклон нелинейный — резкий в начале, плавеет к максимуму
      const absDx = Math.abs(dragX)
      const rot   = Math.sign(dragX) * Math.min(absDx * 0.12, 22)
      const liftY = -absDx * 0.04
      return `translateX(${dragX}px) translateY(${liftY}px) rotate(${rot}deg)`
    }
    return 'translateX(0) rotate(0)'
  }

  function getNextTransform() {
    const scale  = 0.92 + dragProgress * 0.08
    const transY = 14  - dragProgress * 14
    return `scale(${scale}) translateY(${transY}px)`
  }

  function reset() {
    setIndex(0); setDone(false); setLikedCount(0)
    dragXRef.current = 0; setDragX(0)
  }

  const isCurrentDragging = isDraggingRef.current

  return (
    <>
      <style>{STYLES}</style>

      <main style={{
        height: '100dvh', background: '#1A1A1D',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Onest',sans-serif", color: '#F0F0F0',
        userSelect: 'none', overflow: 'hidden', touchAction: 'none',
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

        {/* Зона карточек */}
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
              transition: dragX !== 0 ? 'none' : 'transform 0.3s ease',
            }}>
              <img src={next.url} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.2)' }}/>
            </div>
          )}

          {/* Текущая карточка */}
          {!loading && !done && current && (
            <div
              ref={cardRef}
              key={`card-${index}`}
              className={`card-enter ${stampClass}`}
              style={{
                position:'absolute', inset:'14px 18px 0',
                borderRadius:'22px', overflow:'hidden', zIndex:2,
                cursor: isDraggingRef.current ? 'grabbing' : 'grab',
                transform: getCardTransform(),
                transition: swipeDir
                  ? 'transform 0.38s cubic-bezier(.22,1,.36,1), opacity 0.38s ease'
                  : dragX !== 0 ? 'none' : 'transform 0.18s cubic-bezier(.22,1,.36,1)',
                opacity: swipeDir ? 0 : 1,
                boxShadow: isDragRight
                  ? `0 20px 60px rgba(29,185,84,${dragProgress * 0.45}), 0 4px 20px rgba(0,0,0,0.4)`
                  : isDragLeft
                  ? `0 20px 60px rgba(195,7,63,${dragProgress * 0.45}), 0 4px 20px rgba(0,0,0,0.4)`
                  : '0 8px 32px rgba(0,0,0,0.4)',
                willChange: 'transform',
              }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <img src={current.url} style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block' }} draggable={false}/>

              {/* Боковые оверлеи — только со стороны свайпа */}
              {isDragRight && <div className="overlay-right" style={{ opacity: Math.min(dragProgress * 1.2, 1) }}/>}
              {isDragLeft  && <div className="overlay-left"  style={{ opacity: Math.min(dragProgress * 1.2, 1) }}/>}

              {/* Штампы */}
              <div className="stamp stamp-like">ОГОНЬ 🔥</div>
              <div className="stamp stamp-skip">ДАЛЬШЕ</div>

              {/* Инфо об авторе */}
              <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,0.85))', padding:'48px 18px 20px', pointerEvents:'none' }}>
                <div style={{ fontWeight:700, fontSize:'15px', color:'#fff', fontFamily:"'Onest',sans-serif" }}>
                  {current.author || 'Гость'}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'4px' }}>
                  <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>{current.votes||0} лайков</span>
                  {liked[current.id] && (
                    <span style={{ fontSize:'10px', color:'#C3073F', background:'rgba(195,7,63,0.25)', padding:'1px 8px', borderRadius:'100px' }}>уже лайкнул</span>
                  )}
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

        {/* Кнопки действий */}
        {!loading && !done && current && (
          <div style={{
            padding:'14px 32px', paddingBottom:'max(20px,env(safe-area-inset-bottom,20px))',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'24px',
            flexShrink:0, animation:'fadeUp 0.4s 0.15s ease both',
          }}>
            <button className="act-btn" onClick={handleSkip}
              style={{ width:'58px', height:'58px', background:'#161616', border:'1px solid #222', fontSize:'24px', boxShadow:'0 4px 16px rgba(0,0,0,0.4)' }}>
              👎
            </button>

            <button className="act-btn" onClick={handleLike}
              style={{
                width:'74px', height:'74px', fontSize:'28px', border:'none',
                background: liked[current?.id] ? 'linear-gradient(135deg,#6F2232,#950740)' : 'linear-gradient(135deg,#C3073F,#6F2232)',
                boxShadow: liked[current?.id] ? '0 4px 20px rgba(195,7,63,0.25)' : '0 4px 28px rgba(195,7,63,0.5)',
                transform: isDragRight ? `scale(${1 + dragProgress * 0.2})` : 'scale(1)',
                transition: 'background 0.2s, box-shadow 0.2s, transform 0.08s',
              }}>
              {liked[current?.id] ? '✓' : '❤️'}
            </button>

            <button className="act-btn" onClick={handleSkip}
              style={{ width:'58px', height:'58px', background:'#161616', border:'1px solid #222', fontSize:'20px', color:'#444', boxShadow:'0 4px 16px rgba(0,0,0,0.4)' }}>
              →
            </button>
          </div>
        )}

        <div style={{ height:'90px', flexShrink:0 }}/>
      </main>
    </>
  )
}