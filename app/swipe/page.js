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

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
  }
  @keyframes popIn {
    0%   { opacity: 0; transform: scale(0.4) rotate(-15deg); }
    60%  { opacity: 1; transform: scale(1.15) rotate(4deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes stampFire {
    0%   { opacity: 0; transform: scale(0.5) rotate(-22deg); }
    55%  { opacity: 1; transform: scale(1.18) rotate(-18deg); }
    100% { opacity: 0.9; transform: scale(1) rotate(-20deg); }
  }
  @keyframes stampSkip {
    0%   { opacity: 0; transform: scale(0.5) rotate(22deg); }
    55%  { opacity: 1; transform: scale(1.18) rotate(18deg); }
    100% { opacity: 0.9; transform: scale(1) rotate(20deg); }
  }
  @keyframes cardEnter {
    from { opacity: 0; transform: scale(0.94) translateY(12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes confetti {
    0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(-120px) rotate(720deg); opacity: 0; }
  }
  @keyframes btnPop {
    0%   { transform: scale(1); }
    40%  { transform: scale(0.88); }
    70%  { transform: scale(1.12); }
    100% { transform: scale(1); }
  }

  .stamp-fire {
    position: absolute; top: 36px; left: 20px;
    border: 3px solid #1DB954; border-radius: 8px;
    color: #1DB954; font-family: 'Unbounded', sans-serif;
    font-weight: 900; font-size: 24px; padding: 5px 14px;
    transform: rotate(-20deg); opacity: 0;
    pointer-events: none; z-index: 10;
    letter-spacing: 0.03em;
    text-shadow: 0 0 20px rgba(29,185,84,0.5);
  }
  .stamp-skip {
    position: absolute; top: 36px; right: 20px;
    border: 3px solid #C3073F; border-radius: 8px;
    color: #C3073F; font-family: 'Unbounded', sans-serif;
    font-weight: 900; font-size: 24px; padding: 5px 14px;
    transform: rotate(20deg); opacity: 0;
    pointer-events: none; z-index: 10;
    letter-spacing: 0.03em;
    text-shadow: 0 0 20px rgba(195,7,63,0.5);
  }
  .swipe-right .stamp-fire { animation: stampFire 0.35s cubic-bezier(.22,1,.36,1) forwards; }
  .swipe-left  .stamp-skip { animation: stampSkip 0.35s cubic-bezier(.22,1,.36,1) forwards; }

  .action-btn {
    border: none; border-radius: 50%; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    -webkit-tap-highlight-color: transparent;
    transition: box-shadow 0.2s;
    position: relative; overflow: visible;
  }
  .action-btn:active { animation: btnPop 0.3s ease; }

  .like-btn-glow {
    box-shadow: 0 4px 28px rgba(195,7,63,0.45);
  }
  .like-btn-glow:hover {
    box-shadow: 0 6px 36px rgba(195,7,63,0.6);
  }

  .card-wrapper {
    animation: cardEnter 0.35s cubic-bezier(.22,1,.36,1) both;
  }

  .done-emoji {
    animation: popIn 0.5s cubic-bezier(.22,1,.36,1) both;
  }
  .done-title {
    animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.1s both;
  }
  .done-sub {
    animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.2s both;
  }
  .done-btn {
    animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.3s both;
  }
`

export default function SwipePage() {
  const [photos, setPhotos]       = useState([])
  const [index, setIndex]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [done, setDone]           = useState(false)
  const [swipeDir, setSwipeDir]   = useState(null)
  const [likedCount, setLikedCount] = useState(0)
  const [dragX, setDragX]         = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [liked, setLiked]         = useState({}) // id → bool, защита от двойных лайков

  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const cardRef     = useRef(null)
  const animating   = useRef(false)

  useEffect(() => {
    const eventId = localStorage.getItem('tusim_event_id')
    // Загружаем уже лайкнутые из localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('tusim_liked') || '{}')
      setLiked(saved)
    } catch {}
    if (eventId) loadPhotos(eventId)
    else setLoading(false)
  }, [])

  async function loadPhotos(eventId) {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    if (data) setPhotos(data)
    setLoading(false)
  }

  const current = photos[index]
  const next    = photos[index + 1]
  const progress = photos.length ? (index / photos.length) * 100 : 0

  function saveLiked(newLiked) {
    localStorage.setItem('tusim_liked', JSON.stringify(newLiked))
    setLiked(newLiked)
  }

  async function handleLike() {
    if (!current || animating.current) return
    animating.current = true
    setSwipeDir('right')

    // Защита от повторных лайков
    if (!liked[current.id]) {
      const newLiked = { ...liked, [current.id]: true }
      saveLiked(newLiked)
      setLikedCount(prev => prev + 1)
      await supabase
        .from('photos')
        .update({ votes: (current.votes || 0) + 1 })
        .eq('id', current.id)
    }

    setTimeout(() => {
      setSwipeDir(null)
      setDragX(0)
      if (index + 1 >= photos.length) setDone(true)
      else setIndex(prev => prev + 1)
      animating.current = false
    }, 380)
  }

  async function handleSkip() {
    if (!current || animating.current) return
    animating.current = true
    setSwipeDir('left')

    setTimeout(() => {
      setSwipeDir(null)
      setDragX(0)
      if (index + 1 >= photos.length) setDone(true)
      else setIndex(prev => prev + 1)
      animating.current = false
    }, 380)
  }

  // Touch
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
    if (Math.abs(dx) > Math.abs(dy)) {
      setDragX(dx)
    }
  }
  function onTouchEnd(e) {
    setIsDragging(false)
    if (!touchStartX.current) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      dx > 0 ? handleLike() : handleSkip()
    } else {
      setDragX(0)
    }
    touchStartX.current = null
  }

  // Mouse
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

  function getCardTransform() {
    if (swipeDir === 'right') return 'translateX(130%) rotate(22deg)'
    if (swipeDir === 'left')  return 'translateX(-130%) rotate(-22deg)'
    if (dragX !== 0) {
      const rot = dragX * 0.08
      return `translateX(${dragX}px) rotate(${rot}deg)`
    }
    return 'translateX(0) rotate(0deg)'
  }

  const dragProgress = Math.min(Math.abs(dragX) / 80, 1)
  const isDragRight  = dragX > 20
  const isDragLeft   = dragX < -20

  function resetVoting() {
    setIndex(0)
    setDone(false)
    setLikedCount(0)
    setDragX(0)
  }

  return (
    <>
      <style>{STYLES}</style>

      <main style={{
        height: '100dvh',
        background: '#1A1A1D',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Onest', sans-serif",
        color: '#F0F0F0',
        userSelect: 'none',
        overflow: 'hidden',
      }}>

        {/* ── Шапка ── */}
        <div style={{
          padding: 'max(48px, env(safe-area-inset-top, 48px)) 24px 0',
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ animation: 'fadeUp 0.4s ease both' }}>
            <h1 style={{
              fontFamily: "'Unbounded', sans-serif", fontWeight: 900,
              fontSize: '20px', letterSpacing: '-0.5px', lineHeight: 1,
            }}>
              tusi<span style={{ color: '#C3073F' }}>'m</span>
            </h1>
            <p style={{ color: '#3a3a3a', fontSize: '12px', marginTop: '4px' }}>
              Голосование
            </p>
          </div>

          {photos.length > 0 && !done && (
            <div style={{ textAlign: 'right', animation: 'fadeUp 0.4s 0.05s ease both' }}>
              <div style={{
                fontSize: '13px', color: '#C3073F', fontWeight: 700,
                background: 'rgba(195,7,63,0.1)',
                border: '1px solid rgba(195,7,63,0.2)',
                padding: '5px 14px', borderRadius: '100px',
                fontFamily: "'Unbounded', sans-serif",
              }}>
                {index + 1} <span style={{ color: '#6F2232' }}>/ {photos.length}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#3a3a3a', marginTop: '5px' }}>
                ❤️ {likedCount} лайков
              </div>
            </div>
          )}
        </div>

        {/* ── Прогресс-бар ── */}
        {photos.length > 0 && !done && (
          <div style={{ padding: '14px 24px 0', flexShrink: 0, animation: 'fadeIn 0.5s 0.1s ease both' }}>
            <div style={{ background: '#1e1e1e', borderRadius: '100px', height: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '100px',
                background: 'linear-gradient(90deg, #6F2232, #C3073F)',
                width: `${progress}%`,
                transition: 'width 0.4s cubic-bezier(.22,1,.36,1)',
              }}/>
            </div>
          </div>
        )}

        {/* ── Зона карточек ── */}
        <div style={{
          flex: 1, position: 'relative',
          padding: '16px 20px 0',
          overflow: 'hidden', minHeight: 0,
        }}>

          {/* Загрузка */}
          {loading && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '16px',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                border: '3px solid #2a2a2a', borderTopColor: '#C3073F',
                animation: 'spin 0.8s linear infinite',
              }}/>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <span style={{ color: '#3a3a3a', fontSize: '13px' }}>Загружаем фото...</span>
            </div>
          )}

          {/* Нет фото */}
          {!loading && photos.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '14px', padding: '24px',
              animation: 'fadeUp 0.5s ease both',
            }}>
              <div style={{ fontSize: '56px' }}>📸</div>
              <p style={{ color: '#3a3a3a', fontSize: '14px', textAlign: 'center', lineHeight: 1.6 }}>
                Пока нет фото<br/>
                <span style={{ fontSize: '12px' }}>Сначала сделай снимки</span>
              </p>
            </div>
          )}

          {/* Финальный экран */}
          {done && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '16px', padding: '24px',
            }}>
              {/* Декор */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(195,7,63,0.08) 0%, transparent 70%)',
              }}/>

              <div className="done-emoji" style={{ fontSize: '72px', lineHeight: 1 }}>🎉</div>
              <h2 className="done-title" style={{
                fontFamily: "'Unbounded', sans-serif", fontWeight: 900,
                fontSize: '24px', textAlign: 'center', letterSpacing: '-1px', lineHeight: 1.2,
              }}>
                Всё просмотрел!
              </h2>
              <p className="done-sub" style={{
                color: '#555', fontSize: '14px', textAlign: 'center', lineHeight: 1.7,
              }}>
                Ты лайкнул <span style={{ color: '#C3073F', fontWeight: 700 }}>{likedCount}</span> из {photos.length} фото
              </p>
              <button
                className="done-btn"
                onClick={resetVoting}
                style={{
                  background: 'linear-gradient(135deg, #C3073F, #6F2232)',
                  color: '#fff', border: 'none', borderRadius: '100px',
                  padding: '16px 36px', fontSize: '15px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Onest', sans-serif",
                  marginTop: '8px',
                  boxShadow: '0 4px 24px rgba(195,7,63,0.35)',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Смотреть снова
              </button>
            </div>
          )}

          {/* Следующая карточка (фон) */}
          {!loading && !done && next && (
            <div style={{
              position: 'absolute', inset: '16px 20px 0',
              borderRadius: '24px', overflow: 'hidden',
              transform: 'scale(0.94) translateY(10px)',
              zIndex: 1, transition: 'transform 0.3s ease',
            }}>
              <img src={next.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.25)',
              }}/>
            </div>
          )}

          {/* Текущая карточка */}
          {!loading && !done && current && (
            <div
              ref={cardRef}
              className={`card-wrapper ${swipeDir ? `swipe-${swipeDir}` : ''}`}
              style={{
                position: 'absolute', inset: '16px 20px 0',
                borderRadius: '24px', overflow: 'hidden',
                zIndex: 2,
                cursor: isDragging ? 'grabbing' : 'grab',
                transform: getCardTransform(),
                transition: swipeDir ? 'transform 0.38s cubic-bezier(.22,1,.36,1), opacity 0.38s ease' : isDragging ? 'none' : 'transform 0.25s ease',
                opacity: swipeDir ? 0 : 1,
                boxShadow: isDragRight
                  ? `0 12px 48px rgba(29,185,84,${dragProgress * 0.4})`
                  : isDragLeft
                  ? `0 12px 48px rgba(195,7,63,${dragProgress * 0.4})`
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
              <img
                src={current.url}
                style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', display: 'block' }}
              />

              {/* Оверлей при драге вправо */}
              {isDragRight && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `rgba(29,185,84,${dragProgress * 0.25})`,
                  pointerEvents: 'none',
                }}/>
              )}
              {/* Оверлей при драге влево */}
              {isDragLeft && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `rgba(195,7,63,${dragProgress * 0.25})`,
                  pointerEvents: 'none',
                }}/>
              )}

              <div className="stamp-fire">ОГОНЬ 🔥</div>
              <div className="stamp-skip">ДАЛЬШЕ</div>

              {/* Инфо об авторе */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                padding: '48px 20px 20px',
                pointerEvents: 'none',
              }}>
                <div style={{
                  fontWeight: 700, fontSize: '16px', color: '#fff',
                  fontFamily: "'Onest', sans-serif",
                }}>
                  {current.author || 'Гость'}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  marginTop: '4px',
                }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                    {current.votes || 0} лайков
                  </span>
                  {liked[current.id] && (
                    <span style={{
                      fontSize: '11px', color: '#C3073F',
                      background: 'rgba(195,7,63,0.2)',
                      padding: '1px 8px', borderRadius: '100px',
                    }}>уже лайкнул</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Подсказка при первом показе */}
          {!loading && !done && photos.length > 0 && index === 0 && (
            <div style={{
              position: 'absolute', bottom: '12px', left: 0, right: 0,
              display: 'flex', justifyContent: 'center', gap: '8px',
              pointerEvents: 'none', animation: 'fadeIn 1s 1.5s ease both',
              zIndex: 5,
            }}>
              <span style={{ fontSize: '11px', color: '#333' }}>← свайп влево — пропустить</span>
              <span style={{ fontSize: '11px', color: '#333' }}>лайк — вправо →</span>
            </div>
          )}
        </div>

        {/* ── Кнопки действий ── */}
        {!loading && !done && current && (
          <div style={{
            padding: '16px 32px',
            paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '28px',
            flexShrink: 0,
            animation: 'fadeUp 0.4s 0.15s ease both',
          }}>

            {/* Пропустить */}
            <button
              className="action-btn"
              onClick={handleSkip}
              style={{
                width: '60px', height: '60px',
                background: '#161616',
                border: '1px solid #2a2a2a',
                fontSize: '26px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}
            >
              👎
            </button>

            {/* Лайк — главная кнопка */}
            <button
              className="action-btn like-btn-glow"
              onClick={handleLike}
              style={{
                width: '76px', height: '76px',
                background: liked[current?.id]
                  ? 'linear-gradient(135deg, #6F2232, #950740)'
                  : 'linear-gradient(135deg, #C3073F, #6F2232)',
                border: 'none', fontSize: '30px',
              }}
            >
              {liked[current?.id] ? '✓' : '❤️'}
            </button>

            {/* Следующее */}
            <button
              className="action-btn"
              onClick={handleSkip}
              style={{
                width: '60px', height: '60px',
                background: '#161616',
                border: '1px solid #2a2a2a',
                fontSize: '22px',
                color: '#555',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}
            >
              →
            </button>
          </div>
        )}

        {/* Отступ под навигацию */}
        <div style={{ height: '90px', flexShrink: 0 }} />
      </main>
    </>
  )
}