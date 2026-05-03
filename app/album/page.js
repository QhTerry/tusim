'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Onest:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #1A1A1D; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes photoIn {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes shimmer {
    0%   { opacity: 0.4; }
    50%  { opacity: 0.8; }
    100% { opacity: 0.4; }
  }

  .thumb-item {
    position: relative; overflow: hidden;
    aspect-ratio: 1; cursor: pointer;
    background: #161616;
    animation: photoIn 0.4s cubic-bezier(.22,1,.36,1) both;
  }
  .thumb-item img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    transition: transform 0.35s cubic-bezier(.22,1,.36,1);
  }
  .thumb-item:hover img { transform: scale(1.06); }
  .thumb-item:active img { transform: scale(0.97); }

  .thumb-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%);
    opacity: 0; transition: opacity 0.25s;
    display: flex; align-items: flex-end; padding: 10px;
  }
  .thumb-item:hover .thumb-overlay { opacity: 1; }

  .lightbox-bg {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.97);
    z-index: 1000;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .lightbox-img {
    max-width: 100%; max-height: 70dvh;
    object-fit: contain; border-radius: 16px;
    animation: scaleIn 0.3s cubic-bezier(.22,1,.36,1);
    box-shadow: 0 24px 80px rgba(0,0,0,0.8);
  }
  .close-btn {
    position: absolute; top: max(20px, env(safe-area-inset-top, 20px)); right: 20px;
    width: 40px; height: 40px; border-radius: 50%;
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
    color: #fff; font-size: 18px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .close-btn:hover { background: rgba(255,255,255,0.15); }

  .votes-badge {
    display: inline-flex; align-items: center; gap: '4px';
    background: rgba(195,7,63,0.15); border: 1px solid rgba(195,7,63,0.25);
    border-radius: 100px; padding: 4px 12px;
    font-size: 13px; color: #C3073F; font-weight: 600;
  }
`

export default function AlbumPage() {
  const [photos, setPhotos]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [eventName, setEventName] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)

  useEffect(() => {
    const eventId = localStorage.getItem('tusim_event_id')
    const name    = localStorage.getItem('tusim_event_name')
    if (name) setEventName(name)
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

  function openPhoto(photo, idx) {
    setSelected(photo)
    setSelectedIdx(idx)
  }

  function closePhoto() { setSelected(null) }

  function prevPhoto(e) {
    e.stopPropagation()
    const newIdx = (selectedIdx - 1 + photos.length) % photos.length
    setSelectedIdx(newIdx)
    setSelected(photos[newIdx])
  }

  function nextPhoto(e) {
    e.stopPropagation()
    const newIdx = (selectedIdx + 1) % photos.length
    setSelectedIdx(newIdx)
    setSelected(photos[newIdx])
  }

  // Свайп в лайтбоксе
  let lbTouchStart = null
  function lbTouchStartFn(e) { lbTouchStart = e.touches[0].clientX }
  function lbTouchEndFn(e) {
    if (!lbTouchStart) return
    const dx = e.changedTouches[0].clientX - lbTouchStart
    if (Math.abs(dx) > 50) dx > 0 ? prevPhoto(e) : nextPhoto(e)
    lbTouchStart = null
  }

  return (
    <>
      <style>{STYLES}</style>

      <main style={{
        minHeight: '100dvh', background: '#1A1A1D',
        color: '#F0F0F0', fontFamily: "'Onest', sans-serif",
        paddingBottom: '100px',
      }}>

        {/* ── Шапка ── */}
        <div style={{
          padding: 'max(48px, env(safe-area-inset-top, 48px)) 20px 20px',
          animation: 'fadeUp 0.4s ease both',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontFamily: "'Unbounded', sans-serif", fontWeight: 900,
                fontSize: '24px', letterSpacing: '-1px', lineHeight: 1,
              }}>
                Альбом
              </h1>
              <p style={{ color: '#3a3a3a', fontSize: '13px', marginTop: '6px' }}>
                {loading ? 'Загружаем...' : (
                  <>
                    <span style={{ color: '#555' }}>{photos.length} фото</span>
                    {eventName && <span style={{ color: '#2a2a2a' }}> · {eventName}</span>}
                  </>
                )}
              </p>
            </div>

            {/* Сортировка — в будущем */}
            {!loading && photos.length > 0 && (
              <div style={{
                fontSize: '11px', color: '#3a3a3a',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px', padding: '6px 12px',
              }}>
                новые сначала
              </div>
            )}
          </div>
        </div>

        {/* ── Загрузка ── */}
        {loading && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '80px 0', gap: '16px',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              border: '3px solid #1e1e1e', borderTopColor: '#C3073F',
              animation: 'spin 0.8s linear infinite',
            }}/>
            <span style={{ color: '#3a3a3a', fontSize: '13px' }}>Загружаем фото...</span>
          </div>
        )}

        {/* ── Пусто ── */}
        {!loading && photos.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '80px 24px', gap: '16px',
            animation: 'fadeUp 0.5s ease both',
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(195,7,63,0.06)',
              border: '1px solid rgba(195,7,63,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px',
            }}>📸</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>Пока пусто</div>
              <div style={{ color: '#3a3a3a', fontSize: '13px', lineHeight: 1.7 }}>
                Сделай первый кадр —<br/>он появится здесь мгновенно
              </div>
            </div>
          </div>
        )}

        {/* ── Сетка фото ── */}
        {!loading && photos.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2px',
            animation: 'fadeIn 0.3s ease both',
          }}>
            {photos.map((photo, i) => (
              <div
                key={photo.id}
                className="thumb-item"
                style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
                onClick={() => openPhoto(photo, i)}
              >
                <img src={photo.url} loading="lazy" alt={photo.author || 'фото'} />
                <div className="thumb-overlay">
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                    {photo.author || 'Гость'}
                  </span>
                </div>
                {photo.votes > 0 && (
                  <div style={{
                    position: 'absolute', top: '6px', right: '6px',
                    background: 'rgba(0,0,0,0.6)', borderRadius: '100px',
                    padding: '2px 7px', fontSize: '10px', color: '#C3073F',
                    fontWeight: 700, backdropFilter: 'blur(4px)',
                  }}>
                    ❤️ {photo.votes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Лайтбокс ── */}
      {selected && (
        <div
          className="lightbox-bg"
          onClick={closePhoto}
          onTouchStart={lbTouchStartFn}
          onTouchEnd={lbTouchEndFn}
        >
          <button className="close-btn" onClick={closePhoto}>✕</button>

          {/* Навигация */}
          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                style={{
                  position: 'absolute', left: '16px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', width: '40px', height: '40px',
                  borderRadius: '50%', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px',
                }}
              >‹</button>
              <button
                onClick={nextPhoto}
                style={{
                  position: 'absolute', right: '16px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', width: '40px', height: '40px',
                  borderRadius: '50%', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px',
                }}
              >›</button>
            </>
          )}

          <img
            key={selected.id}
            src={selected.url}
            className="lightbox-img"
            onClick={e => e.stopPropagation()}
          />

          <div
            style={{ marginTop: '20px', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              fontWeight: 700, fontSize: '16px', color: '#F0F0F0', marginBottom: '8px',
            }}>
              {selected.author || 'Гость'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
              {selected.votes > 0 && (
                <span className="votes-badge">❤️ {selected.votes}</span>
              )}
              <span style={{ fontSize: '12px', color: '#333' }}>
                {selectedIdx + 1} из {photos.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}