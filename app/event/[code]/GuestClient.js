'use client'

import { useState, useRef, useEffect } from 'react'

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

export default function GuestClient({ event }) {
  const [photos, setPhotos] = useState([])
  const [cameraOpen, setCameraOpen] = useState(false)
  const [deviceId, setDeviceId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [author, setAuthor] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [showNameScreen, setShowNameScreen] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

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
  }, [])

  async function loadMyPhotos(id) {
    const res = await fetch(`/api/my-photos?event_id=${event.id}&device_id=${id}`)
    const { photos: data } = await res.json()
    if (data) setPhotos(data.map(p => ({ ...p, mine: true })))
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

  async function takePhoto() {
    const video = videoRef.current
    const maxSize = 1200
    const scale = Math.min(maxSize / video.videoWidth, maxSize / video.videoHeight, 1)
    const width = Math.round(video.videoWidth * scale)
    const height = Math.round(video.videoHeight * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(video, 0, 0, width, height)
    closeCamera()
    setUploading(true)

    canvas.toBlob(async (blob) => {
      const formData = new FormData()
      formData.append('file', blob, 'photo.jpg')
      formData.append('event_id', event.id)
      formData.append('device_id', deviceId)
      formData.append('author', author)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const { photo, error } = await res.json()

      if (photo) {
        setPhotos(prev => [{ ...photo, mine: true }, ...prev])
      } else {
        console.error('Ошибка загрузки:', error)
      }

      setUploading(false)
    }, 'image/jpeg', 0.5)
  }

  const myPhotos = photos.filter(p => p.mine)

  if (showNameScreen) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Onest:wght@400;500;600&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #1A1A1D; }
          .name-input {
            width: 100%; padding: 16px 20px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px; color: #F0F0F0;
            font-family: 'Onest', sans-serif; font-size: 18px;
            outline: none; text-align: center;
            transition: border-color 0.2s;
          }
          .name-input:focus { border-color: rgba(195,7,63,0.5); }
          .name-input::placeholder { color: #4E4E50; }
          .confirm-btn {
            width: 100%; padding: 18px;
            background: linear-gradient(135deg, #C3073F, #950740);
            color: #fff; border: none; border-radius: 100px;
            font-family: 'Onest', sans-serif; font-weight: 700;
            font-size: 17px; cursor: pointer;
            transition: transform 0.15s, opacity 0.15s;
          }
          .confirm-btn:hover { opacity: 0.9; transform: scale(1.02); }
          .confirm-btn:active { transform: scale(0.97); }
          .confirm-btn:disabled { background: #2a2a2a; color: #555; cursor: not-allowed; transform: none; }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fade-up { animation: fadeUp 0.5s ease both; }
        `}</style>

        <main style={{
          minHeight: '100vh', background: '#1A1A1D',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px', fontFamily: "'Onest', sans-serif",
        }}>

          <div className="fade-up" style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(195,7,63,0.1)', border: '1px solid rgba(195,7,63,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', margin: '0 auto 24px',
            }}>
              👋
            </div>
            <h1 style={{
              fontFamily: "'Unbounded', sans-serif", fontWeight: 900,
              fontSize: '26px', color: '#F0F0F0',
              letterSpacing: '-1px', marginBottom: '12px',
            }}>
              Привет!
            </h1>
            <p style={{ color: '#4E4E50', fontSize: '15px', lineHeight: 1.6 }}>
              Ты на <span style={{ color: '#C3073F' }}>{event.name}</span><br/>
              Как тебя зовут?
            </p>
          </div>

          <div className="fade-up" style={{ width: '100%', maxWidth: '320px', animationDelay: '0.1s' }}>
            <input
              className="name-input"
              placeholder="Твоё имя"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmName()}
              autoFocus
            />
            <div style={{ height: '16px' }} />
            <button
              className="confirm-btn"
              onClick={confirmName}
              disabled={!nameInput.trim()}
            >
              Погнали снимать
            </button>
          </div>

          <p className="fade-up" style={{
            color: '#333', fontSize: '12px', marginTop: '24px',
            textAlign: 'center', animationDelay: '0.2s',
          }}>
            У тебя {limit} кадров · Выбирай лучшие моменты
          </p>

        </main>
      </>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Onest:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1A1A1D; }
        .shoot-btn {
          background: linear-gradient(135deg, #C3073F, #950740);
          color: #fff; border: none; border-radius: 100px;
          font-family: 'Onest', sans-serif; font-weight: 700;
          font-size: 17px; cursor: pointer; padding: 18px 48px;
          transition: transform 0.15s, opacity 0.15s;
        }
        .shoot-btn:hover { transform: scale(1.03); opacity: 0.9; }
        .shoot-btn:active { transform: scale(0.97); }
        .shoot-btn:disabled { background: #2a2a2a; color: #555; cursor: not-allowed; transform: none; }
        .cancel-btn {
          background: transparent; color: #888;
          border: 1px solid #333; border-radius: 100px;
          font-family: 'Onest', sans-serif; font-size: 15px;
          padding: 14px 28px; cursor: pointer;
        }
        .snap-btn {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg, #C3073F, #950740);
          border: 4px solid #1A1A1D; outline: 2px solid #C3073F;
          cursor: pointer; transition: transform 0.1s;
        }
        .snap-btn:active { transform: scale(0.92); }
        @keyframes pulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }
      `}</style>

      <main style={{
        minHeight: '100vh', background: '#1A1A1D',
        color: '#F0F0F0', fontFamily: "'Onest', sans-serif",
        maxWidth: '480px', margin: '0 auto', padding: '0 20px 48px',
      }}>

        <div style={{ paddingTop: '48px', marginBottom: '40px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            background: 'rgba(195,7,63,0.1)', border: '1px solid rgba(195,7,63,0.3)',
            borderRadius: '100px', padding: '5px 14px',
            fontSize: '12px', color: '#C3073F',
            fontWeight: 600, letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: '20px',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#C3073F', marginRight: '6px',
              animation: 'pulse 1.5s infinite', display: 'inline-block',
            }}/>
            Идёт съёмка
          </div>
          <h1 style={{
            fontFamily: "'Unbounded', sans-serif", fontWeight: 900,
            fontSize: '28px', letterSpacing: '-1px', marginBottom: '6px',
          }}>
            tusi<span style={{ color: '#C3073F' }}>'m</span>
          </h1>
          <p style={{ color: '#4E4E50', fontSize: '14px' }}>
            {event.name} · <span style={{ color: '#888' }}>{author}</span>
          </p>
        </div>

        <div style={{
          background: '#1A1A1D', border: '1px solid #2a2a2a',
          borderRadius: '24px', padding: '28px 24px',
          marginBottom: '24px', textAlign: 'center',
        }}>
          <div style={{
            fontSize: '72px', fontFamily: "'Unbounded', sans-serif",
            fontWeight: 900, color: remaining > 5 ? '#F0F0F0' : '#C3073F',
            lineHeight: 1, marginBottom: '4px',
          }}>
            {remaining}
          </div>
          <div style={{ color: '#4E4E50', fontSize: '13px', marginBottom: '20px' }}>
            кадров осталось из {limit}
          </div>
          <div style={{ background: '#2a2a2a', borderRadius: '100px', height: '6px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '100px',
              background: 'linear-gradient(90deg, #6F2232, #C3073F)',
              width: `${progress}%`, transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#4E4E50' }}>
            <span>использовано {used}</span>
            <span>лимит {limit}</span>
          </div>
        </div>

        {uploading && (
          <p style={{ textAlign: 'center', color: '#C3073F', marginBottom: '16px', fontSize: '13px' }}>
            Загружаем фото...
          </p>
        )}

        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          {remaining > 0 ? (
            <button className="shoot-btn" onClick={openCamera} disabled={uploading}>
              Сделать фото
            </button>
          ) : (
            <div style={{
              background: '#1A1A1D', border: '1px solid #2a2a2a',
              borderRadius: '16px', padding: '20px',
              color: '#4E4E50', fontSize: '14px', lineHeight: 1.6,
            }}>
              Лимит исчерпан — спасибо за кадры!
            </div>
          )}
        </div>

        {myPhotos.length > 0 ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', color: '#4E4E50' }}>Твои фото</span>
              <span style={{
                fontSize: '11px', fontWeight: 600, color: '#C3073F',
                background: 'rgba(195,7,63,0.1)', padding: '3px 10px', borderRadius: '100px',
              }}>{myPhotos.length} шт</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {myPhotos.map((photo, i) => (
                <img key={photo.id || i} src={photo.url} loading="lazy" style={{
                  width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '10px',
                }} />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(195,7,63,0.08)', border: '1px solid rgba(195,7,63,0.2)',
              margin: '0 auto 12px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '24px',
            }}>📸</div>
            <p style={{ color: '#4E4E50', fontSize: '13px', lineHeight: 1.6 }}>
              Поймай лучшие моменты<br/>у тебя {limit} кадров
            </p>
          </div>
        )}

      </main>

      {cameraOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000',
          zIndex: 200, display: 'flex', flexDirection: 'column',
        }}>
          <video ref={videoRef} autoPlay playsInline style={{ flex: 1, width: '100%', objectFit: 'cover' }} />
          <div style={{
            padding: '32px 24px 48px', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
          }}>
            <button className="cancel-btn" onClick={closeCamera}>Отмена</button>
            <button className="snap-btn" onClick={takePhoto} />
            <div style={{ width: '80px' }} />
          </div>
        </div>
      )}
    </>
  )
}