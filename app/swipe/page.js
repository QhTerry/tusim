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

  /* Штампы */
  @keyframes stampShow {
    0%   { opacity:0; transform:scale(0.5) rotate(var(--r0)); }
    55%  { opacity:1; transform:scale(1.15) rotate(var(--r1)); }
    100% { opacity:1; transform:scale(1)    rotate(var(--r2)); }
  }

  .stamp {
    position:absolute; top:32px;
    border:3px solid; border-radius:10px;
    font-family:'Unbounded',sans-serif; font-weight:900;
    font-size:22px; padding:6px 14px;
    pointer-events:none; z-index:10;
    opacity:0; letter-spacing:0.04em;
    white-space:nowrap;
  }
  .stamp-like { left:20px; color:#1DB954; border-color:#1DB954; --r0:-25deg; --r1:-18deg; --r2:-20deg; text-shadow:0 0 24px rgba(29,185,84,0.6); }
  .stamp-skip { right:20px; color:#C3073F; border-color:#C3073F; --r0:25deg; --r1:18deg; --r2:20deg; text-shadow:0 0 24px rgba(195,7,63,0.6); }
  .show-like .stamp-like { animation:stampShow 0.35s cubic-bezier(.22,1,.36,1) forwards; }
  .show-skip .stamp-skip { animation:stampShow 0.35s cubic-bezier(.22,1,.36,1) forwards; }

  /* Карточка */
  .card-wrap { animation:cardIn 0.35s cubic-bezier(.22,1,.36,1) both; }

  /* Боковые градиентные оверлеи — только с нужной стороны */
  .side-overlay-right {
    position:absolute; inset:0; pointer-events:none;
    background:linear-gradient(to left, rgba(29,185,84,0.55) 0%, transparent 60%);
    border-radius:inherit;
  }
  .side-overlay-left {
    position:absolute; inset:0; pointer-events:none;
    background:linear-gradient(to right, rgba(195,7,63,0.55) 0%, transparent 60%);
    border-radius:inherit;
  }

  /* Кнопки */
  .act-btn {
    border:none; border-radius:50%; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    -webkit-tap-highlight-color:transparent;
    transition:transform 0.15s, box-shadow 0.15s;
  }
  .act-btn:active { transform:scale(0.88) !important; }

  /* Финал */
  .done-emoji { animation:popIn 0.5s cubic-bezier(.22,1,.36,1) both; }
  .done-title { animation:fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.1s both; }
  .done-sub   { animation:fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.18s both; }
  .done-btn   { animation:fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.26s both; }

  /* Подсказка свайпа */
  @keyframes hintFade { 0%{opacity:0;} 30%{opacity:1;} 70%{opacity:1;} 100%{opacity:0;} }
  .hint { animation:hintFade 3s 1.2s ease both; pointer-events:none; }
`

export default function SwipePage() {
  const [photos, setPhotos]         = useState([])
  const [index, setIndex]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [done, setDone]             = useState(false)
  const [swipeDir, setSwipeDir]     = useState(null) // 'right'|'left'|null
  const [likedCount, setLikedCount] = useState(0)
  const [dragX, setDragX]           = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [liked, setLiked]           = useState({})

  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const animating   = useRef(false)
  const cardRef     = useRef(null)

  useEffect(() => {
    const eventId = localStorage.getItem('tusim_event_id')
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

  const current  = photos[index]
  const next     = photos[index + 1]
  const progress = photos.length ? (index / photos.length) * 100 : 0

  // Нормализованный прогресс свайпа 0..1
  const dragProgress = Math.min(Math.abs(dragX) / 90, 1)
  const isDragRight  = dragX > 15
  const isDragLeft   = dragX < -15

  // Показываем штамп на карточке в зависимости от направления
  const stampClass = isDragRight ? 'show-like' : isDragLeft ? 'show-skip' : ''

  function saveLiked(nl) { localStorage.setItem('tusim_liked', JSON.stringify(nl)); setLiked(nl) }

  async function handleLike() {
    if (!current || animating.current) return
    animating.current = true
    setSwipeDir('right')
    setDragX(0)

    if (!liked[current.id]) {
      const nl = { ...liked, [current.id]: true }
      saveLiked(nl)
      setLikedCount(p => p + 1)
      await supabase.from('photos').update({ votes: (current.votes || 0) + 1 }).eq('id', current.id)
    }

    setTimeout(() => {
      setSwipeDir(null)
      if (index + 1 >= photos.length) setDone(true)
      else setIndex(p => p + 1)
      animating.current = false
    }, 400)
  }

  async function handleSkip() {
    if (!current || animating.current) return
    animating.current = true
    setSwipeDir('left')
    setDragX(0)

    setTimeout(() => {
      setSwipeDir(null)
      if (index + 1 >= photos.length) setDone(true)
      else setIndex(p => p + 1)
      animating.current = false
    }, 400)
  }

  // ── Touch ──
  function onTouchStart(e) {
    if (animating.current) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    setIsDragging(true)
  }
  function onTouchMove(e) {
    if (!touchStartX.current) return
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy)) { e.preventDefault(); setDragX(dx) }
  }
  function onTouchEnd(e) {
    setIsDragging(false)
    if (!touchStartX.current) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      dx > 0 ? handleLike() : handleSkip()
    } else { setDragX(0) }
    touchStartX.current = null
  }

  // ── Mouse ──
  function onMouseDown(e) {
    if (animating.current) return
    touchStartX.current = e.clientX
    setIsDragging(true)
  }
  function onMouseMove(e) {
    if (!touchStartX.current || !isDragging) return
    setDragX(e.clientX - touchStartX.current)
  }
  function onMouseUp(e) {
    setIsDragging(false)
    if (!touchStartX.current) return
    const dx = e.clientX - touchStartX.current
    if (Math.abs(dx) > 60) dx > 0 ? handleLike() : handleSkip()
    else setDragX(0)
    touchStartX.current = null
  }

  // Трансформация карточки — наклон пропорционален смещению
  function getCardTransform() {
    if (swipeDir === 'right') return 'translateX(135%) rotate(24deg)'
    if (swipeDir === 'left')  return 'translateX(-135%) rotate(-24deg)'
    if (dragX !== 0) {
      // Наклон до ±18 градусов, нелинейный (быстрее в начале)
      const rot = Math.sign(dragX) * Math.min(Math.pow(Math.abs(dragX) / 10, 0.75), 18)
      // Лёгкий подъём при драге — эффект "берём карточку"
      const liftY = -Math.abs(dragX) * 0.04
      return `translateX(${dragX}px) translateY(${liftY}px) rotate(${rot}deg)`
    }
    return 'translateX(0) rotate(0deg)'
  }

  // Следующая карточка слегка "поднимается" по мере свайпа
  function getNextCardTransform() {
    const scale  = 0.94 + dragProgress * 0.06
    const transY = 10  - dragProgress * 10
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

        {/* ── Шапка ── */}
        <div style={{
          padding: 'max(48px,env(safe-area-inset-top,48px)) 24px 0',
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ animation: 'fadeUp 0.4s ease both' }}>
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

        {/* ── Прогресс ── */}
        {photos.length > 0 && !done && (
          <div style={{ padding:'12px 24px 0', flexShrink:0, animation:'fadeIn 0.5s 0.1s ease both' }}>
            <div style={{ background:'#1a1a1a', borderRadius:'100px', height:'3px', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:'100px', background:'linear-gradient(90deg,#6F2232,#C3073F)', width:`${progress}%`, transition:'width 0.4s cubic-bezier(.22,1,.36,1)' }}/>
            </div>
          </div>
        )}

        {/* ── Карточки ── */}
        <div style={{ flex:1, position:'relative', padding:'14px 18px 0', overflow:'hidden', minHeight:0 }}>

          {/* Загрузка */}
          {loading && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'14px' }}>
              <div style={{ width:'34px', height:'34px', borderRadius:'50%', border:'3px solid #1e1e1e', borderTopColor:'#C3073F', animation:'spin 0.8s linear infinite' }}/>
              <span style={{ color:'#2a2a2a', fontSize:'13px' }}>Загружаем фото...</span>
            </div>
          )}

          {/* Нет фото */}
          {!loading && photos.length === 0 && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px', animation:'fadeUp 0.5s ease both' }}>
              <div style={{ fontSize:'52px' }}>📸</div>
              <p style={{ color:'#2a2a2a', fontSize:'14px', textAlign:'center', lineHeight:1.6 }}>Пока нет фото<br/><span style={{ fontSize:'12px' }}>Сначала сделай снимки</span></p>
            </div>
          )}

          {/* Финал */}
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
              transform: getNextCardTransform(),
              transition: isDragging ? 'none' : 'transform 0.3s ease',
            }}>
              <img src={next.url} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.22)' }}/>
            </div>
          )}

          {/* Текущая карточка */}
          {!loading && !done && current && (
            <div
              ref={cardRef}
              className={`card-wrap ${stampClass} ${swipeDir ? `swipe-${swipeDir}` : ''}`}
              style={{
                position:'absolute', inset:'14px 18px 0',
                borderRadius:'22px', overflow:'hidden', zIndex:2,
                cursor: isDragging ? 'grabbing' : 'grab',
                transform: getCardTransform(),
                transition: swipeDir
                  ? 'transform 0.4s cubic-bezier(.22,1,.36,1), opacity 0.4s ease'
                  : isDragging ? 'none' : 'transform 0.22s cubic-bezier(.22,1,.36,1)',
                opacity: swipeDir ? 0 : 1,
                boxShadow: isDragRight
                  ? `0 16px 56px rgba(29,185,84,${dragProgress * 0.35}), 0 4px 16px rgba(0,0,0,0.4)`
                  : isDragLeft
                  ? `0 16px 56px rgba(195,7,63,${dragProgress * 0.35}), 0 4px 16px rgba(0,0,0,0.4)`
                  : '0 8px 32px rgba(0,0,0,0.4)',
                willChange: 'transform',
              }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <img src={current.url} style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block' }}/>

              {/* Боковой оверлей — только со стороны свайпа */}
              {isDragRight && (
                <div className="side-overlay-right" style={{ opacity: dragProgress }}/>
              )}
              {isDragLeft && (
                <div className="side-overlay-left" style={{ opacity: dragProgress }}/>
              )}

              {/* Штампы */}
              <div className="stamp stamp-like">ОГОНЬ 🔥</div>
              <div className="stamp stamp-skip">ДАЛЬШЕ</div>

              {/* Инфо */}
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

          {/* Подсказка — показывается один раз */}
          {!loading && !done && photos.length > 0 && index === 0 && (
            <div className="hint" style={{ position:'absolute', bottom:'10px', left:0, right:0, display:'flex', justifyContent:'center', gap:'20px', zIndex:5 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', color:'#333' }}>
                <span style={{ fontSize:'16px' }}>👈</span> пропустить
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', color:'#333' }}>
                лайк <span style={{ fontSize:'16px' }}>👉</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Кнопки ── */}
        {!loading && !done && current && (
          <div style={{
            padding:'14px 32px', paddingBottom:'max(20px,env(safe-area-inset-bottom,20px))',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'24px',
            flexShrink:0, animation:'fadeUp 0.4s 0.15s ease both',
          }}>
            {/* Пропустить */}
            <button className="act-btn" onClick={handleSkip} style={{ width:'58px', height:'58px', background:'#161616', border:'1px solid #222', fontSize:'24px', boxShadow:'0 4px 16px rgba(0,0,0,0.4)' }}>
              👎
            </button>

            {/* Лайк */}
            <button className="act-btn" onClick={handleLike} style={{
              width:'74px', height:'74px', fontSize:'28px',
              background: liked[current?.id] ? 'linear-gradient(135deg,#6F2232,#950740)' : 'linear-gradient(135deg,#C3073F,#6F2232)',
              border:'none',
              boxShadow: liked[current?.id] ? '0 4px 20px rgba(195,7,63,0.25)' : '0 4px 28px rgba(195,7,63,0.5)',
              transform: isDragRight ? `scale(${1 + dragProgress * 0.15})` : 'scale(1)',
              transition:'transform 0.1s, box-shadow 0.2s',
            }}>
              {liked[current?.id] ? '✓' : '❤️'}
            </button>

            {/* Следующее */}
            <button className="act-btn" onClick={handleSkip} style={{ width:'58px', height:'58px', background:'#161616', border:'1px solid #222', fontSize:'20px', color:'#444', boxShadow:'0 4px 16px rgba(0,0,0,0.4)' }}>
              →
            </button>
          </div>
        )}

        <div style={{ height:'90px', flexShrink:0 }}/>
      </main>
    </>
  )
}