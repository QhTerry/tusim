'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

function getDeviceId() {
  let id = localStorage.getItem('tusim_device_id')
  if (!id) {
    id = Math.random().toString(36).substring(2) + Date.now()
    localStorage.setItem('tusim_device_id', id)
  }
  return id
}

function getAuthor() {
  return localStorage.getItem('tusim_author') || ''
}

function saveAuthor(name) {
  localStorage.setItem('tusim_author', name)
}

// Анимации — инжектируем один раз
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Onest:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #1A1A1D; height: 100%; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.88); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes flashWhite {
    0%   { opacity: 0; }
    10%  { opacity: 1; }
    100% { opacity: 0; }
  }
  @keyframes photoAppear {
    from { opacity: 0; transform: scale(0.8) rotate(-2deg); }
    to   { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes uploading {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .fade-up   { animation: fadeUp  0.5s cubic-bezier(.22,1,.36,1) both; }
  .fade-in   { animation: fadeIn  0.4s ease both; }
  .scale-in  { animation: scaleIn 0.4s cubic-bezier(.22,1,.36,1) both; }

  .name-input {
    width: 100%; padding: 18px 20px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px; color: #F0F0F0;
    font-family: 'Onest', sans-serif; font-size: 18px;
    outline: none; text-align: center;
    transition: border-color 0.25s, background 0.25s;
    -webkit-appearance: none;
  }
  .name-input:focus {
    border-color: rgba(195,7,63,0.6);
    background: rgba(195,7,63,0.04);
  }
  .name-input::placeholder { color: #3a3a3a; }

  .confirm-btn {
    width: 100%; padding: 18px;
    background: linear-gradient(135deg, #C3073F, #950740);
    color: #fff; border: none; border-radius: 100px;
    font-family: 'Onest', sans-serif; font-weight: 700;
    font-size: 17px; cursor: pointer;
    transition: transform 0.15s, opacity 0.15s, box-shadow 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .confirm-btn:hover:not(:disabled) {
    opacity: 0.92; transform: scale(1.02);
    box-shadow: 0 8px 32px rgba(195,7,63,0.35);
  }
  .confirm-btn:active:not(:disabled) { transform: scale(0.97); }
  .confirm-btn:disabled { background: #222; color: #444; cursor: not-allowed; }

  .shoot-btn {
    background: linear-gradient(135deg, #C3073F, #6F2232);
    color: #fff; border: none; border-radius: 100px;
    font-family: 'Onest', sans-serif; font-weight: 700;
    font-size: 17px; cursor: pointer; padding: 20px 52px;
    transition: transform 0.15s, box-shadow 0.15s;
    -webkit-tap-highlight-color: transparent;
    box-shadow: 0 4px 24px rgba(195,7,63,0.3);
    letter-spacing: 0.02em;
  }
  .shoot-btn:hover:not(:disabled) {
    transform: scale(1.04);
    box-shadow: 0 8px 32px rgba(195,7,63,0.45);
  }
  .shoot-btn:active:not(:disabled) { transform: scale(0.96); }
  .shoot-btn:disabled { background: #1e1e1e; color: #444; cursor: not-allowed; box-shadow: none; }

  /* Кнопки камеры */
  .cam-control-btn {
    width: 44px; height: 44px; border-radius: 50%;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.15);
    color: #fff; font-size: 18px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background 0.15s, transform 0.1s;
    -webkit-tap-highlight-color: transparent;
    backdrop-filter: blur(8px);
  }
  .cam-control-btn:active { transform: scale(0.9); }
  .cam-control-btn.active {
    background: rgba(195,7,63,0.5);
    border-color: rgba(195,7,63,0.7);
  }

  .snap-btn {
    width: 76px; height: 76px; border-radius: 50%;
    background: #fff;
    border: 5px solid rgba(255,255,255,0.3);
    outline: 3px solid rgba(255,255,255,0.15);
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.15s;
    -webkit-tap-highlight-color: transparent;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    position: relative;
  }
  .snap-btn::after {
    content: '';
    position: absolute; inset: 6px;
    border-radius: 50%;
    background: linear-gradient(135deg, #C3073F, #6F2232);
    transition: opacity 0.1s;
  }
  .snap-btn:active { transform: scale(0.9); }

  .photo-thumb {
    width: 100%; aspect-ratio: 1; object-fit: cover;
    border-radius: 10px; cursor: pointer;
    transition: transform 0.2s, opacity 0.2s;
    animation: photoAppear 0.4s cubic-bezier(.22,1,.36,1) both;
  }
  .photo-thumb:hover { transform: scale(1.04); opacity: 0.9; }

  .stat-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px; padding: 16px;
    text-align: center;
    transition: border-color 0.2s;
  }
  .stat-card:hover { border-color: rgba(195,7,63,0.2); }
`

export default function GuestClient({ event }) {
  const [photos, setPhotos] = useState([])
  const [cameraOpen, setCameraOpen] = useState(false)
  const [deviceId, setDeviceId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [author, setAuthor] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [showNameScreen, setShowNameScreen] = useState(false)

  // Камера
  const [facingMode, setFacingMode] = useState('environment') // 'environment' | 'user'
  const [flashOn, setFlashOn] = useState(false)
  const [flashActive, setFlashActive] = useState(false) // белая вспышка на экране
  const [torchSupported, setTorchSupported] = useState(false)

  // Статистика события
  const [totalPhotos, setTotalPhotos] = useState(0)
  const [guestCount, setGuestCount] = useState(0)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const trackRef = useRef(null)

  useEffect(() => {
    const id = getDeviceId()
    setDeviceId(id)
    const savedAuthor = getAuthor()
    if (savedAuthor) {
      setAuthor(savedAuthor)
      loadMyPhotos(id)
    } else {
      setShowNameScreen(true)
    }
    localStorage.setItem('tusim_event_id', event.id)
    localStorage.setItem('tusim_event_code', event.code)
    localStorage.setItem('tusim_event_name', event.name)
    loadEventStats()
  }, [])

  async function loadMyPhotos(id) {
    const res = await fetch(`/api/my-photos?event_id=${event.id}&device_id=${id}`)
    const { photos: data } = await res.json()
    if (data) setPhotos(data.map(p => ({ ...p, mine: true })))
  }

  async function loadEventStats() {
    try {
      const res = await fetch(`/api/event-stats?event_id=${event.id}`)
      const data = await res.json()
      if (data) {
        setTotalPhotos(data.total_photos || 0)
        setGuestCount(data.guest_count || 0)
      }
    } catch (e) {
      // не критично
    }
  }

  function confirmName() {
    const name = nameInput.trim()
    if (!name) return
    saveAuthor(name)
    setAuthor(name)
    setShowNameScreen(false)
    loadMyPhotos(deviceId)
  }

  const limit = event.photo_limit || 30
  const used = photos.filter(p => p.mine).length
  const remaining = limit - used
  const progress = (used / limit) * 100

  // Открыть камеру
  async function openCamera() {
    setCameraOpen(true)
    await startStream(facingMode)
  }

  async function startStream(mode) {
    // Останавливаем предыдущий поток
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }

    try {
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Проверяем поддержку фонарика
      const track = stream.getVideoTracks()[0]
      trackRef.current = track
      const caps = track.getCapabilities?.() || {}
      setTorchSupported(!!caps.torch)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Ошибка камеры:', err)
      // Fallback — пробуем без ограничений
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch (e) {
        alert('Не удалось открыть камеру. Разреши доступ в настройках браузера.')
        setCameraOpen(false)
      }
    }
  }

  function closeCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    streamRef.current = null
    trackRef.current = null
    setCameraOpen(false)
    setFlashActive(false)
  }

  async function toggleFlash() {
    if (!torchSupported || !trackRef.current) return
    const newFlash = !flashOn
    setFlashOn(newFlash)
    try {
      await trackRef.current.applyConstraints({ advanced: [{ torch: newFlash }] })
    } catch (e) {
      console.warn('Torch error:', e)
    }
  }

  async function toggleCamera() {
    const newMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newMode)
    setFlashOn(false) // фронталка не поддерживает torch
    await startStream(newMode)
  }

  async function takePhoto() {
    const video = videoRef.current
    if (!video) return

    // Вспышка-эффект
    setFlashActive(true)
    setTimeout(() => setFlashActive(false), 500)

    const maxSize = 1200
    const scale = Math.min(maxSize / video.videoWidth, maxSize / video.videoHeight, 1)
    const width = Math.round(video.videoWidth * scale)
    const height = Math.round(video.videoHeight * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    // Зеркалим если фронталка
    if (facingMode === 'user') {
      ctx.translate(width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, width, height)

    closeCamera()
    setUploading(true)

    canvas.toBlob(async (blob) => {
      const formData = new FormData()
      formData.append('file', blob, 'photo.jpg')
      formData.append('event_id', event.id)
      formData.append('device_id', deviceId)
      formData.append('author', author)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const { photo, error } = await res.json()

      if (photo) {
        setPhotos(prev => [{ ...photo, mine: true }, ...prev])
        setTotalPhotos(prev => prev + 1)
      } else {
        console.error('Ошибка загрузки:', error)
      }
      setUploading(false)
    }, 'image/jpeg', 0.82)
  }

  const myPhotos = photos.filter(p => p.mine)

  // ─── Экран ввода имени ───────────────────────────────────────────────────────
  if (showNameScreen) {
    return (
      <>
        <style>{GLOBAL_STYLES}</style>
        <main style={{
          minHeight: '100dvh', background: '#1A1A1D',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px', fontFamily: "'Onest', sans-serif",
        }}>

          {/* Декоративный фон */}
          <div style={{
            position: 'fixed', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(195,7,63,0.12) 0%, transparent 70%)',
          }} />

          <div className="fade-up" style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              width: '88px', height: '88px', borderRadius: '50%',
              background: 'rgba(195,7,63,0.08)',
              border: '1px solid rgba(195,7,63,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '40px', margin: '0 auto 28px',
              boxShadow: '0 0 40px rgba(195,7,63,0.15)',
            }}>👋</div>

            <h1 style={{
              fontFamily: "'Unbounded', sans-serif", fontWeight: 900,
              fontSize: '28px', color: '#F0F0F0',
              letterSpacing: '-1px', marginBottom: '14px',
            }}>Привет!</h1>

            <p style={{ color: '#555', fontSize: '15px', lineHeight: 1.7 }}>
              Ты на{' '}
              <span style={{ color: '#C3073F', fontWeight: 600 }}>{event.name}</span>
              <br/>Как тебя зовут?
            </p>
          </div>

          <div className="fade-up" style={{ width: '100%', maxWidth: '340px', animationDelay: '0.1s' }}>
            <input
              className="name-input"
              placeholder="Введи своё имя"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmName()}
              autoFocus
            />
            <div style={{ height: '14px' }} />
            <button className="confirm-btn" onClick={confirmName} disabled={!nameInput.trim()}>
              Погнали снимать 📸
            </button>
          </div>

          <p className="fade-up" style={{
            color: '#2a2a2a', fontSize: '12px', marginTop: '28px',
            textAlign: 'center', animationDelay: '0.2s', lineHeight: 1.7,
          }}>
            У тебя {limit} кадров · Снимай лучшие моменты
          </p>
        </main>
      </>
    )
  }

  // ─── Главный экран гостя ─────────────────────────────────────────────────────
  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      {/* Декоративный фон */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 70% 40% at 50% -10%, rgba(195,7,63,0.1) 0%, transparent 60%)',
      }} />

      <main style={{
        minHeight: '100dvh', background: '#1A1A1D',
        color: '#F0F0F0', fontFamily: "'Onest', sans-serif",
        maxWidth: '480px', margin: '0 auto',
        padding: '0 20px 120px',
        position: 'relative', zIndex: 1,
      }}>

        {/* ── Шапка ── */}
        <div className="fade-up" style={{ paddingTop: '52px', marginBottom: '32px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            background: 'rgba(195,7,63,0.1)', border: '1px solid rgba(195,7,63,0.25)',
            borderRadius: '100px', padding: '5px 14px',
            fontSize: '11px', color: '#C3073F',
            fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', marginBottom: '18px',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#C3073F', marginRight: '7px',
              animation: 'pulse 1.5s infinite', display: 'inline-block',
            }}/>
            Идёт съёмка
          </div>

          <h1 style={{
            fontFamily: "'Unbounded', sans-serif", fontWeight: 900,
            fontSize: '30px', letterSpacing: '-1.5px', marginBottom: '8px',
          }}>
            tusi<span style={{ color: '#C3073F' }}>'m</span>
          </h1>

          <p style={{ color: '#444', fontSize: '14px' }}>
            {event.name}
            {author && <span style={{ color: '#666' }}> · {author}</span>}
          </p>
        </div>

        {/* ── Статистика события ── */}
        <div className="fade-up" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: '10px', marginBottom: '20px', animationDelay: '0.05s',
        }}>
          <div className="stat-card">
            <div style={{
              fontSize: '22px', fontFamily: "'Unbounded', sans-serif",
              fontWeight: 900, color: '#F0F0F0', lineHeight: 1,
            }}>{guestCount || '—'}</div>
            <div style={{ fontSize: '10px', color: '#444', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              гостей
            </div>
          </div>
          <div className="stat-card">
            <div style={{
              fontSize: '22px', fontFamily: "'Unbounded', sans-serif",
              fontWeight: 900, color: '#C3073F', lineHeight: 1,
            }}>{totalPhotos || myPhotos.length}</div>
            <div style={{ fontSize: '10px', color: '#444', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              фото в альбоме
            </div>
          </div>
          <div className="stat-card">
            <div style={{
              fontSize: '22px', fontFamily: "'Unbounded', sans-serif",
              fontWeight: 900,
              color: remaining <= 5 ? '#C3073F' : '#F0F0F0',
              lineHeight: 1,
            }}>{remaining}</div>
            <div style={{ fontSize: '10px', color: '#444', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              твоих кадров
            </div>
          </div>
        </div>

        {/* ── Прогресс-бар ── */}
        <div className="fade-up" style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px', padding: '16px 20px',
          marginBottom: '24px', animationDelay: '0.1s',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: '12px', color: '#555', marginBottom: '10px',
          }}>
            <span>Использовано: <span style={{ color: '#888' }}>{used}</span></span>
            <span>Лимит: <span style={{ color: '#888' }}>{limit}</span></span>
          </div>
          <div style={{ background: '#1e1e1e', borderRadius: '100px', height: '5px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '100px',
              background: progress > 80
                ? 'linear-gradient(90deg, #950740, #C3073F)'
                : 'linear-gradient(90deg, #6F2232, #C3073F)',
              width: `${progress}%`,
              transition: 'width 0.5s cubic-bezier(.22,1,.36,1)',
            }}/>
          </div>
        </div>

        {/* ── Кнопка съёмки ── */}
        <div className="fade-up" style={{
          textAlign: 'center', marginBottom: '36px', animationDelay: '0.15s',
        }}>
          {uploading && (
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                border: '2px solid #C3073F', borderTopColor: 'transparent',
                animation: 'uploading 0.8s linear infinite',
              }}/>
              <span style={{ color: '#C3073F', fontSize: '13px' }}>Загружаем фото...</span>
            </div>
          )}

          {remaining > 0 ? (
            <button className="shoot-btn" onClick={openCamera} disabled={uploading}>
              📸 Сделать фото
            </button>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px', padding: '20px',
              color: '#444', fontSize: '14px', lineHeight: 1.7,
            }}>
              Лимит исчерпан — спасибо за кадры! 🎉
            </div>
          )}
        </div>

        {/* ── Мои фото ── */}
        {myPhotos.length > 0 ? (
          <div className="fade-in" style={{ animationDelay: '0.2s' }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: '14px',
            }}>
              <span style={{ fontSize: '13px', color: '#555' }}>Твои фото</span>
              <span style={{
                fontSize: '11px', fontWeight: 600, color: '#C3073F',
                background: 'rgba(195,7,63,0.1)', padding: '3px 10px',
                borderRadius: '100px',
              }}>{myPhotos.length} шт</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {myPhotos.map((photo, i) => (
                <img
                  key={photo.id || i}
                  src={photo.url}
                  loading="lazy"
                  className="photo-thumb"
                  style={{ animationDelay: `${i * 0.05}s` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="fade-up" style={{
            textAlign: 'center', padding: '32px 0', animationDelay: '0.2s',
          }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'rgba(195,7,63,0.06)', border: '1px solid rgba(195,7,63,0.15)',
              margin: '0 auto 14px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '28px',
            }}>📸</div>
            <p style={{ color: '#3a3a3a', fontSize: '13px', lineHeight: 1.7 }}>
              Поймай лучшие моменты<br/>
              <span style={{ color: '#555' }}>У тебя {limit} кадров — выбирай осознанно</span>
            </p>
          </div>
        )}

      </main>

      {/* ─── Камера ─────────────────────────────────────────────────────────────── */}
      {cameraOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000',
          zIndex: 2000, // выше навигации (1000)
          display: 'flex', flexDirection: 'column',
          animation: 'fadeIn 0.2s ease',
        }}>
          {/* Вспышка-эффект */}
          {flashActive && (
            <div style={{
              position: 'absolute', inset: 0, background: '#fff',
              zIndex: 10, pointerEvents: 'none',
              animation: 'flashWhite 0.5s ease forwards',
            }}/>
          )}

          {/* Видео — занимает весь экран */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
            }}
          />

          {/* Верхняя панель */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            paddingTop: 'max(52px, env(safe-area-inset-top, 52px))',
            paddingLeft: '24px', paddingRight: '24px', paddingBottom: '20px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            zIndex: 5,
          }}>
            <button
              className={`cam-control-btn ${flashOn ? 'active' : ''}`}
              onClick={toggleFlash}
              title={torchSupported ? 'Вспышка' : 'Не поддерживается'}
              style={{ opacity: torchSupported ? 1 : 0.35 }}
            >
              ⚡
            </button>

            <div style={{
              background: 'rgba(0,0,0,0.55)', borderRadius: '100px',
              padding: '7px 18px', fontSize: '13px', color: '#fff',
              fontFamily: "'Onest', sans-serif", fontWeight: 600,
              backdropFilter: 'blur(8px)',
            }}>
              {remaining} кадров
            </div>

            <button className="cam-control-btn" onClick={toggleCamera}>
              🔄
            </button>
          </div>

          {/* Нижняя панель — фиксированная высота, не зависит от контента */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '160px',
            paddingBottom: 'max(28px, env(safe-area-inset-bottom, 28px))',
            background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingLeft: '36px', paddingRight: '36px',
            zIndex: 5,
          }}>
            {/* Отмена */}
            <button
              onClick={closeCamera}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', borderRadius: '100px',
                padding: '12px 22px', fontSize: '14px',
                cursor: 'pointer',
                fontFamily: "'Onest', sans-serif",
                backdropFilter: 'blur(8px)',
                WebkitTapHighlightColor: 'transparent',
                flexShrink: 0,
              }}
            >
              Отмена
            </button>

            {/* Кнопка съёмки — строго по центру */}
            <button
              className="snap-btn"
              onClick={takePhoto}
              style={{ flexShrink: 0 }}
            />

            {/* Превью или пустой блок */}
            <div style={{ width: '52px', height: '52px', flexShrink: 0 }}>
              {myPhotos[0] ? (
                <img
                  src={myPhotos[0].url}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover', borderRadius: '12px',
                    border: '2px solid rgba(255,255,255,0.3)',
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  )
}