'use client'

import { useState, useRef } from 'react'

const PHOTO_LIMIT = 30

export default function GuestPage() {
  const [photos, setPhotos] = useState([])
  const [cameraOpen, setCameraOpen] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const remaining = PHOTO_LIMIT - photos.length
  const used = photos.length
  const progress = (used / PHOTO_LIMIT) * 100

  async function openCamera() {
    setCameraOpen(true)
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    })
    streamRef.current = stream
    videoRef.current.srcObject = stream
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setCameraOpen(false)
  }

  function takePhoto() {
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    const url = canvas.toDataURL('image/jpeg')
    setPhotos(prev => [...prev, url])
    closeCamera()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Onest:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1A1A1D; }
        .shoot-btn {
          background: linear-gradient(135deg, #C3073F, #950740);
          color: #fff; border: none;
          border-radius: 100px; font-family: 'Onest', sans-serif;
          font-weight: 700; font-size: 17px; cursor: pointer;
          padding: 18px 48px; transition: transform 0.15s, opacity 0.15s;
          letter-spacing: -0.3px;
        }
        .shoot-btn:hover { transform: scale(1.03); opacity: 0.9; }
        .shoot-btn:active { transform: scale(0.97); }
        .shoot-btn:disabled { background: #2a2a2a; color: #555; cursor: not-allowed; transform: none; }
        .photo-thumb {
          width: 100%; aspect-ratio: 1; object-fit: cover;
          border-radius: 10px; display: block;
        }
        .cancel-btn {
          background: transparent; color: #888;
          border: 1px solid #333; border-radius: 100px;
          font-family: 'Onest', sans-serif; font-size: 15px;
          padding: 14px 28px; cursor: pointer; transition: border-color 0.2s;
        }
        .cancel-btn:hover { border-color: #666; }
        .snap-btn {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg, #C3073F, #950740);
          border: 4px solid #1A1A1D;
          outline: 2px solid #C3073F;
          cursor: pointer; transition: transform 0.1s;
        }
        .snap-btn:active { transform: scale(0.92); }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: '#1A1A1D',
        color: '#F0F0F0',
        fontFamily: "'Onest', sans-serif",
        maxWidth: '480px',
        margin: '0 auto',
        padding: '0 20px 48px',
      }}>

        {/* Шапка */}
        <div style={{ paddingTop: '48px', marginBottom: '40px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            background: 'rgba(195,7,63,0.1)',
            border: '1px solid rgba(195,7,63,0.3)',
            borderRadius: '100px', padding: '5px 14px',
            fontSize: '12px', color: '#C3073F',
            fontWeight: 600, letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: '20px',
          }}>
            <span style={{
              display: 'inline-block', width: '6px', height: '6px',
              borderRadius: '50%', background: '#C3073F',
              marginRight: '6px', animation: 'pulse 1.5s infinite',
            }}/>
            Идёт съёмка
          </div>
          <h1 style={{
            fontFamily: "'Unbounded', sans-serif",
            fontWeight: 900, fontSize: '28px',
            color: '#F0F0F0', letterSpacing: '-1px',
            marginBottom: '6px',
          }}>
            tusi<span style={{ color: '#C3073F' }}>'m</span>
          </h1>
          <p style={{ color: '#4E4E50', fontSize: '14px' }}>Свадьба Маши и Коли</p>
        </div>

        {/* Счётчик */}
        <div style={{
          background: '#1A1A1D',
          border: '1px solid #2a2a2a',
          borderRadius: '24px',
          padding: '28px 24px',
          marginBottom: '24px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '72px',
            fontFamily: "'Unbounded', sans-serif",
            fontWeight: 900,
            color: remaining > 5 ? '#F0F0F0' : '#C3073F',
            lineHeight: 1,
            marginBottom: '4px',
          }}>
            {remaining}
          </div>
          <div style={{ color: '#4E4E50', fontSize: '13px', marginBottom: '20px' }}>
            кадров осталось из {PHOTO_LIMIT}
          </div>

          {/* Прогресс-бар */}
          <div style={{
            background: '#2a2a2a', borderRadius: '100px',
            height: '6px', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: '100px',
              background: `linear-gradient(90deg, #6F2232, #C3073F)`,
              width: `${progress}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: '8px', fontSize: '11px', color: '#4E4E50',
          }}>
            <span>использовано {used}</span>
            <span>лимит {PHOTO_LIMIT}</span>
          </div>
        </div>

        {/* Кнопка */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          {remaining > 0 ? (
            <button className="shoot-btn" onClick={openCamera}>
              Сделать фото
            </button>
          ) : (
            <div style={{
              background: '#1A1A1D', border: '1px solid #2a2a2a',
              borderRadius: '16px', padding: '20px',
              color: '#4E4E50', fontSize: '14px', lineHeight: 1.6,
            }}>
              Лимит исчерпан<br/>
              <span style={{ color: '#2a2a2a' }}>Спасибо за твои кадры!</span>
            </div>
          )}
        </div>

        {/* Сетка фото */}
        {photos.length > 0 && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: '14px',
            }}>
              <span style={{ fontSize: '13px', color: '#4E4E50' }}>
                Твои фото
              </span>
              <span style={{
                fontSize: '11px', fontWeight: 600,
                color: '#C3073F',
                background: 'rgba(195,7,63,0.1)',
                padding: '3px 10px', borderRadius: '100px',
              }}>
                {photos.length} шт
              </span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
            }}>
              {photos.map((url, i) => (
                <img key={i} src={url} className="photo-thumb" />
              ))}
            </div>
          </div>
        )}

        {/* Пустое состояние */}
        {photos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(195,7,63,0.08)',
              border: '1px solid rgba(195,7,63,0.2)',
              margin: '0 auto 12px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '24px',
            }}>
              📸
            </div>
            <p style={{ color: '#4E4E50', fontSize: '13px', lineHeight: 1.6 }}>
              Поймай лучшие моменты<br/>у тебя {PHOTO_LIMIT} кадров
            </p>
          </div>
        )}

      </main>

      {/* Камера */}
      {cameraOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          background: '#000', zIndex: 200,
          display: 'flex', flexDirection: 'column',
        }}>
          <video ref={videoRef} autoPlay playsInline style={{
            flex: 1, width: '100%', objectFit: 'cover',
          }} />
          <div style={{
            padding: '32px 24px 48px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <button className="cancel-btn" onClick={closeCamera}>
              Отмена
            </button>
            <button className="snap-btn" onClick={takePhoto} />
            <div style={{ width: '80px' }} />
          </div>
        </div>
      )}
    </>
  )
}