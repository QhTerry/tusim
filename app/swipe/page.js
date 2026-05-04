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
  @keyframes popIn   { 0%{opacity:0;transform:scale(0.4);} 60%{opacity:1;transform:scale(1.1);} 100%{opacity:1;transform:scale(1);} }
  @keyframes cardIn  { from{opacity:0;transform:scale(0.94) translateY(16px);} to{opacity:1;transform:scale(1) translateY(0);} }

  /* Карточка улетает вправо */
  @keyframes flyRight {
    0%   { transform:translateX(0) rotate(0deg); opacity:1; }
    100% { transform:translateX(140%) rotate(18deg); opacity:0; }
  }
  /* Карточка улетает влево */
  @keyframes flyLeft {
    0%   { transform:translateX(0) rotate(0deg); opacity:1; }
    100% { transform:translateX(-140%) rotate(-18deg); opacity:0; }
  }
  /* Следующая карточка поднимается */
  @keyframes nextRise {
    from { transform:scale(0.92) translateY(14px); }
    to   { transform:scale(1) translateY(0); }
  }
  /* Штамп */
  @keyframes stampPop {
    0%   { opacity:0; transform:scale(0.5) rotate(var(--r0)); }
    55%  { opacity:1; transform:scale(1.2) rotate(var(--r1)); }
    100% { opacity:1; transform:scale(1)   rotate(var(--r2)); }
  }
  /* Подсказка */
  @keyframes hintAnim {
    0%   { opacity:0; transform:translateX(-50%) translateY(8px); }
    20%  { opacity:1; transform:translateX(-50%) translateY(0); }
    75%  { opacity:1; transform:translateX(-50%) translateY(0); }
    100% { opacity:0; transform:translateX(-50%) translateY(-6px); }
  }
  /* Кнопка лайк-пульс при свайпе вправо */
  @keyframes likePulse {
    0%   { box-shadow: 0 6px 32px rgba(195,7,63,0.5); transform:scale(1); }
    50%  { box-shadow: 0 6px 48px rgba(195,7,63,0.8); transform:scale(1.12); }
    100% { box-shadow: 0 6px 32px rgba(195,7,63,0.5); transform:scale(1); }
  }

  .stamp {
    position:absolute; top:32px; border:3px solid;
    border-radius:10px; font-family:'Unbounded',sans-serif;
    font-weight:900; font-size:22px; padding:6px 14px;
    pointer-events:none; z-index:10; opacity:0;
    letter-spacing:0.04em; white-space:nowrap;
  }
  .stamp-like { left:20px; color:#1DB954; border-color:#1DB954; --r0:-25deg; --r1:-18deg; --r2:-20deg; text-shadow:0 0 24px rgba(29,185,84,0.6); }
  .stamp-skip { right:20px; color:#C3073F; border-color:#C3073F; --r0:25deg; --r1:18deg; --r2:20deg; text-shadow:0 0 24px rgba(195,7,63,0.6); }

  .fly-right .stamp-like { animation:stampPop 0.3s cubic-bezier(.22,1,.36,1) forwards; }
  .fly-left  .stamp-skip { animation:stampPop 0.3s cubic-bezier(.22,1,.36,1) forwards; }
  .fly-right { animation:flyRight 0.4s cubic-bezier(.4,0,.2,1) forwards; }
  .fly-left  { animation:flyLeft  0.4s cubic-bezier(.4,0,.2,1) forwards; }

  .card-enter { animation:cardIn 0.35s cubic-bezier(.22,1,.36,1) both; }
  .next-rise  { animation:nextRise 0.4s cubic-bezier(.22,1,.36,1) both; }

  /* Боковые оверлеи — только с края */
  .ov-r {
    position:absolute; top:0; right:0; bottom:0; width:50%;
    border-radius:inherit; pointer-events:none;
    background:linear-gradient(to left, rgba(29,185,84,0.75) 0%, transparent 100%);
  }
  .ov-l {
    position:absolute; top:0; left:0; bottom:0; width:50%;
    border-radius:inherit; pointer-events:none;
    background:linear-gradient(to right, rgba(195,7,63,0.75) 0%, transparent 100%);
  }

  .act-btn {
    border:none; border-radius:50%; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    -webkit-tap-highlight-color:transparent;
    transition:transform 0.15s, box-shadow 0.15s;
  }
  .act-btn:active { transform:scale(0.86) !important; }

  .hint-pill {
    position:absolute; bottom:18px; left:50%;
    transform:translateX(-50%);
    display:flex; align-items:center; gap:12px;
    background:rgba(8,8,10,0.8); backdrop-filter:blur(14px);
    border:1px solid rgba(255,255,255,0.08); border-radius:100px;
    padding:10px 22px; pointer-events:none; z-index:20;
    animation:hintAnim 4.5s 1s ease both; white-space:nowrap;
  }
  .hint-pill span { font-family:'Onest',sans-serif; font-size:12px; font-weight:500; color:#666; }
  .hint-sep { width:1px; height:14px; background:rgba(255,255,255,0.1); }

  .done-emoji { animation:popIn 0.5s cubic-bezier(.22,1,.36,1) both; }
  .done-h2    { animation:fadeUp 0.4s cubic-bezier(.22,1,.36,1) 0.1s both; }
  .done-p     { animation:fadeUp 0.4s cubic-bezier(.22,1,.36,1) 0.18s both; }
  .done-btn   { animation:fadeUp 0.4s cubic-bezier(.22,1,.36,1) 0.26s both; }
`

export default function SwipePage() {
  const [photos, setPhotos]         = useState([])
  const [index, setIndex]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [done, setDone]             = useState(false)
  const [flying, setFlying]         = useState(null) // 'right' | 'left' | null
  const [showOv, setShowOv]         = useState(null) // overlay direction during drag
  const [likedCount, setLikedCount] = useState(0)
  const [liked, setLiked]           = useState({})
  const [dragX, setDragX]           = useState(0)

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

  // Touch listeners с passive:false для надёжного preventDefault
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
    setDragX(0); setShowOv(null)
    setFlying('right')
    if (!liked[current.id]) {
      const nl = { ...liked, [current.id]: true }
      saveLiked(nl); setLikedCount(p => p + 1)
      supabase.from('photos').update({ votes: (current.votes || 0) + 1 }).eq('id', current.id)
    }
    setTimeout(() => { setFlying(null); advance() }, 420)
  }

  function triggerSkip() {
    if (!current || animating.current) return
    animating.current = true
    setDragX(0); setShowOv(null)
    setFlying('left')
    setTimeout(() => { setFlying(null); advance() }, 420)
  }

  function reset() { setIndex(0); setDone(false); setLikedCount(0); setDragX(0) }

  const isLiked = current && liked[current.id]

  return (
    <>
      <style>{STYLES}</style>
      <main style={{
        height: '100dvh', background: '#1A1A1D',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Onest',sans-serif", color: '#F0F0F0',
        userSelect: 'none', overflow: 'hidden',
      }}>

        {/* Header */}
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

        {/* Progress */}
        {photos.length > 0 && !done && (
          <div style={{ padding:'12px 24px 0', flexShrink:0 }}>
            <div style={{ background:'#161616', borderRadius:'100px', height:'3px', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:'100px', background:'linear-gradient(90deg,#6F2232,#C3073F)', width:`${progress}%`, transition:'width 0.4s cubic-bezier(.22,1,.36,1)' }}/>
            </div>
          </div>
        )}

        {/* Cards area */}
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
              <p style={{ color:'#2a2a2a', fontSize:'14px', textAlign:'center', lineHeight:1.6 }}>
                Пока нет фото<br/><span style={{ fontSize:'12px' }}>Сначала сделай снимки</span>
              </p>
            </div>
          )}

          {done && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'14px', padding:'24px' }}>
              <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 60% 50% at 50% 50%,rgba(195,7,63,0.08) 0%,transparent 70%)' }}/>
              <div className="done-emoji" style={{ fontSize:'68px', lineHeight:1 }}>🎉</div>
              <h2 className="done-h2" style={{ fontFamily:"'Unbounded',sans-serif", fontWeight:900, fontSize:'22px', textAlign:'center', letterSpacing:'-0.5px', lineHeight:1.2 }}>Всё просмотрел!</h2>
              <p className="done-p" style={{ color:'#555', fontSize:'14px', textAlign:'center', lineHeight:1.7 }}>
                Ты лайкнул <span style={{ color:'#C3073F', fontWeight:700 }}>{likedCount}</span> из {photos.length} фото
              </p>
              <button className="done-btn" onClick={reset} style={{ background:'linear-gradient(135deg,#C3073F,#6F2232)', color:'#fff', border:'none', borderRadius:'100px', padding:'16px 36px', fontSize:'15px', fontWeight:700, cursor:'pointer', fontFamily:"'Onest',sans-serif", boxShadow:'0 4px 28px rgba(195,7,63,0.4)', WebkitTapHighlightColor:'transparent' }}>
                Смотреть снова
              </button>
            </div>
          )}

          {/* Next card (behind) */}
          {!loading && !done && next && (
            <div className={flying ? 'next-rise' : ''} style={{
              position:'absolute', inset:'14px 18px 0',
              borderRadius:'22px', overflow:'hidden', zIndex:1,
              transform: flying ? undefined : `scale(${0.92 + dragProg * 0.08}) translateY(${14 - dragProg * 14}px)`,
              transition: dragX !== 0 ? 'none' : 'transform 0.3s ease',
            }}>
              <img src={next.url} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.22)' }}/>
            </div>
          )}

          {/* Current card */}
          {!loading && !done && current && (
            <div
              id={cardId.current}
              className={`card-enter ${flying ? `fly-${flying}` : ''}`}
              style={{
                position:'absolute', inset:'14px 18px 0',
                borderRadius:'22px', overflow:'hidden', zIndex:2,
                cursor: 'grab',
                transform: !flying && dragX !== 0 ? `translateX(${dragX}px)` : undefined,
                transition: !flying && dragX !== 0 ? 'none' : undefined,
                boxShadow: showOv === 'right'
                  ? `0 20px 60px rgba(29,185,84,${dragProg * 0.45}), 0 4px 20px rgba(0,0,0,0.4)`
                  : showOv === 'left'
                  ? `0 20px 60px rgba(195,7,63,${dragProg * 0.45}), 0 4px 20px rgba(0,0,0,0.4)`
                  : '0 8px 32px rgba(0,0,0,0.4)',
                willChange: 'transform',
              }}
            >
              <img src={current.url} style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block', userSelect:'none' }} draggable={false}/>

              {/* Side overlays */}
              {showOv === 'right' && <div className="ov-r" style={{ opacity: Math.min(dragProg * 1.2, 1) }}/>}
              {showOv === 'left'  && <div className="ov-l" style={{ opacity: Math.min(dragProg * 1.2, 1) }}/>}

              <div className="stamp stamp-like">ОГОНЬ 🔥</div>
              <div className="stamp stamp-skip">ДАЛЬШЕ</div>

              {/* Author info */}
              <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,0.88))', padding:'52px 20px 22px', pointerEvents:'none' }}>
                <div style={{ fontWeight:700, fontSize:'16px', color:'#fff', marginBottom:'4px' }}>{current.author || 'Гость'}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>{current.votes||0} лайков</span>
                  {isLiked && <span style={{ fontSize:'10px', color:'#C3073F', background:'rgba(195,7,63,0.28)', padding:'2px 9px', borderRadius:'100px' }}>уже лайкнул</span>}
                </div>
              </div>
            </div>
          )}

          {/* Hint */}
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

        {/* Action buttons — only 2 */}
        {!loading && !done && current && (
          <div style={{
            padding:'16px 32px', paddingBottom:'max(24px,env(safe-area-inset-bottom,24px))',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'28px',
            flexShrink:0, animation:'fadeUp 0.4s 0.15s ease both',
          }}>
            {/* Skip */}
            <button className="act-btn" onClick={triggerSkip} style={{
              width:'64px', height:'64px',
              background:'#161616', border:'1px solid rgba(255,255,255,0.08)',
              fontSize:'22px', color:'#555',
              boxShadow:'0 4px 16px rgba(0,0,0,0.5)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Like — big */}
            <button className="act-btn" onClick={triggerLike} style={{
              width:'80px', height:'80px', fontSize:'30px', border:'none',
              background: isLiked ? 'linear-gradient(135deg,#6F2232,#950740)' : 'linear-gradient(135deg,#C3073F,#6F2232)',
              boxShadow: isLiked ? '0 4px 20px rgba(195,7,63,0.2)' : '0 6px 32px rgba(195,7,63,0.5)',
              transform: showOv === 'right' ? `scale(${1 + dragProg * 0.2})` : 'scale(1)',
              transition: 'background 0.2s, box-shadow 0.2s, transform 0.08s',
            }}>
              {isLiked ? '✓' : '❤️'}
            </button>
          </div>
        )}

        <div style={{ height:'90px', flexShrink:0 }}/>
      </main>
    </>
  )
}