'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function SwipePage() {
  const [photos, setPhotos] = useState([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)
  const [swipeDir, setSwipeDir] = useState(null)
  const [likedCount, setLikedCount] = useState(0)

  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const cardRef = useRef(null)

  useEffect(() => {
    const eventId = localStorage.getItem('tusim_event_id')
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
  const next = photos[index + 1]

  async function handleLike() {
    if (!current || swipeDir) return
    setSwipeDir('right')
    setLikedCount(prev => prev + 1)

    await supabase
      .from('photos')
      .update({ votes: (current.votes || 0) + 1 })
      .eq('id', current.id)

    setTimeout(() => {
      setSwipeDir(null)
      if (index + 1 >= photos.length) setDone(true)
      else setIndex(prev => prev + 1)
    }, 400)
  }

  async function handleSkip() {
    if (!current || swipeDir) return
    setSwipeDir('left')

    setTimeout(() => {
      setSwipeDir(null)
      if (index + 1 >= photos.length) setDone(true)
      else setIndex(prev => prev + 1)
    }, 400)
  }

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function onTouchEnd(e) {
    if (!touchStartX.current) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx > 0) handleLike()
      else handleSkip()
    }
    touchStartX.current = null
  }

  function onMouseDown(e) {
    touchStartX.current = e.clientX
  }

  function onMouseUp(e) {
    if (!touchStartX.current) return
    const dx = e.clientX - touchStartX.current
    if (Math.abs(dx) > 50) {
      if (dx > 0) handleLike()
      else handleSkip()
    }
    touchStartX.current = null
  }

  const getCardStyle = () => {
    if (swipeDir === 'right') return {
      transform: 'translateX(120%) rotate(20deg)',
      opacity: 0,
      transition: 'all 0.4s ease',
    }
    if (swipeDir === 'left') return {
      transform: 'translateX(-120%) rotate(-20deg)',
      opacity: 0,
      transition: 'all 0.4s ease',
    }
    return {
      transform: 'translateX(0) rotate(0deg)',
      opacity: 1,
      transition: swipeDir === null ? 'none' : 'all 0.4s ease',
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Onest:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1A1A1D; overflow: hidden; }
        .action-btn {
          border: none; border-radius: 50%; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.15s, box-shadow 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .action-btn:active { transform: scale(0.9); }
        @keyframes likeAnim {
          0% { opacity: 0; transform: scale(0.5) rotate(-20deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(5deg); }
          100% { opacity: 0; transform: scale(1) rotate(0deg); }
        }
        @keyframes skipAnim {
          0% { opacity: 0; transform: scale(0.5) rotate(20deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(-5deg); }
          100% { opacity: 0; transform: scale(1) rotate(0deg); }
        }
        .like-stamp {
          position: absolute; top: 40px; left: 24px;
          border: 4px solid #1D9E75; border-radius: 8px;
          color: #1D9E75; font-family: 'Unbounded', sans-serif;
          font-weight: 900; font-size: 32px; padding: 4px 12px;
          transform: rotate(-20deg); opacity: 0;
          pointer-events: none; z-index: 10;
        }
        .skip-stamp {
          position: absolute; top: 40px; right: 24px;
          border: 4px solid #C3073F; border-radius: 8px;
          color: #C3073F; font-family: 'Unbounded', sans-serif;
          font-weight: 900; font-size: 32px; padding: 4px 12px;
          transform: rotate(20deg); opacity: 0;
          pointer-events: none; z-index: 10;
        }
        .swipe-right .like-stamp { animation: likeAnim 0.4s ease forwards; }
        .swipe-left .skip-stamp { animation: skipAnim 0.4s ease forwards; }
        @keyframes pulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }
      `}</style>

      <main style={{
        height: '100vh', background: '#1A1A1D',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Onest', sans-serif", color: '#F0F0F0',
        userSelect: 'none',
      }}>

        {/* Шапка */}
        <div style={{
          padding: '48px 24px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{
              fontFamily: "'Unbounded', sans-serif", fontWeight: 900,
              fontSize: '20px', letterSpacing: '-0.5px',
            }}>
              tusi<span style={{ color: '#C3073F' }}>'m</span>
            </h1>
            <p style={{ color: '#4E4E50', fontSize: '12px', marginTop: '2px' }}>
              Голосование
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '13px', color: '#C3073F', fontWeight: 600,
              background: 'rgba(195,7,63,0.1)', border: '1px solid rgba(195,7,63,0.2)',
              padding: '4px 12px', borderRadius: '100px',
            }}>
              {index + 1} / {photos.length}
            </div>
            <div style={{ fontSize: '11px', color: '#4E4E50', marginTop: '4px' }}>
              ❤️ {likedCount} лайков
            </div>
          </div>
        </div>

        {/* Прогресс */}
        <div style={{ padding: '0 24px', marginBottom: '16px' }}>
          <div style={{ background: '#2a2a2a', borderRadius: '100px', height: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '100px',
              background: 'linear-gradient(90deg, #6F2232, #C3073F)',
              width: `${photos.length ? ((index) / photos.length) * 100 : 0}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Карточки */}
        <div style={{ flex: 1, position: 'relative', padding: '0 24px', overflow: 'hidden' }}>

          {loading && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#4E4E50',
            }}>
              Загружаем...
            </div>
          )}

          {!loading && photos.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '12px',
            }}>
              <div style={{ fontSize: '48px' }}>📸</div>
              <p style={{ color: '#4E4E50', fontSize: '14px' }}>Пока нет фото</p>
            </div>
          )}

          {done && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '24px',
            }}>
              <div style={{ fontSize: '64px' }}>🎉</div>
              <h2 style={{
                fontFamily: "'Unbounded', sans-serif", fontWeight: 900,
                fontSize: '22px', textAlign: 'center', letterSpacing: '-0.5px',
              }}>
                Ты всё<br/>просмотрел!
              </h2>
              <p style={{ color: '#4E4E50', fontSize: '14px', textAlign: 'center' }}>
                Ты поставил ❤️ {likedCount} из {photos.length} фото
              </p>
              <button
                onClick={() => { setIndex(0); setDone(false); setLikedCount(0) }}
                style={{
                  background: 'linear-gradient(135deg, #C3073F, #950740)',
                  color: '#fff', border: 'none', borderRadius: '100px',
                  padding: '14px 32px', fontSize: '15px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Onest', sans-serif",
                  marginTop: '8px',
                }}
              >
                Смотреть снова
              </button>
            </div>
          )}

          {!loading && !done && next && (
            <div style={{
              position: 'absolute', inset: '0 24px',
              borderRadius: '24px', overflow: 'hidden',
              transform: 'scale(0.95) translateY(8px)',
              zIndex: 1,
            }}>
              <img src={next.url} style={{
                width: '100%', height: '100%', objectFit: 'cover',
              }} />
            </div>
          )}

          {!loading && !done && current && (
            <div
              ref={cardRef}
              className={swipeDir ? `swipe-${swipeDir}` : ''}
              style={{
                position: 'absolute', inset: '0 24px',
                borderRadius: '24px', overflow: 'hidden',
                zIndex: 2, cursor: 'grab',
                ...getCardStyle(),
              }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
            >
              <img src={current.url} style={{
                width: '100%', height: '100%', objectFit: 'cover',
                pointerEvents: 'none',
              }} />

              <div className="like-stamp">ОГОНЬ</div>
              <div className="skip-stamp">ДАЛЬШЕ</div>

              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                padding: '40px 20px 20px',
              }}>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>
                  {current.author || 'Гость'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginTop: '2px' }}>
                  {current.votes || 0} лайков
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Кнопки */}
        {!loading && !done && current && (
          <div style={{
            padding: '20px 24px 32px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '32px',
          }}>
            <button
              className="action-btn"
              onClick={handleSkip}
              style={{
                width: '64px', height: '64px',
                background: '#1A1A1D', border: '1px solid #2a2a2a',
                fontSize: '28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              👎
            </button>

            <button
              className="action-btn"
              onClick={handleLike}
              style={{
                width: '80px', height: '80px',
                background: 'linear-gradient(135deg, #C3073F, #950740)',
                border: 'none', fontSize: '32px',
                boxShadow: '0 4px 24px rgba(195,7,63,0.4)',
              }}
            >
              ❤️
            </button>

            <button
              className="action-btn"
              onClick={handleSkip}
              style={{
                width: '64px', height: '64px',
                background: '#1A1A1D', border: '1px solid #2a2a2a',
                fontSize: '28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              ➡️
            </button>
          </div>
        )}

        <div style={{ height: '90px' }} />

      </main>
    </>
  )
}