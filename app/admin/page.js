'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AdminPage() {
  const [events, setEvents] = useState([])
  const [eventName, setEventName] = useState('')
  const [creating, setCreating] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [photos, setPhotos] = useState([])

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    if (!selectedEvent) return
    loadPhotos(selectedEvent.code)

    const channel = supabase
      .channel('photos')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'photos',
        filter: `event_id=eq.${selectedEvent.id}`,
      }, (payload) => {
        setPhotos(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [selectedEvent])

  async function loadEvents() {
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false })
    if (data) setEvents(data)
  }

  async function loadPhotos(code) {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('event_id', selectedEvent?.id)
      .order('created_at', { ascending: false })
    if (data) setPhotos(data)
  }

  async function createEvent() {
    if (!eventName.trim()) return
    setCreating(true)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data, error } = await supabase
      .from('events')
      .insert({ name: eventName, code })
      .select()
      .single()
    if (data) {
      setEvents(prev => [data, ...prev])
      setEventName('')
    }
    setCreating(false)
  }

  const qrUrl = selectedEvent
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`http://localhost:3000/event/${selectedEvent.code}`)}`
    : null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Onest:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1A1A1D; }
        .input {
          width: 100%; padding: 14px 18px;
          background: #1A1A1D; border: 1px solid #2a2a2a;
          border-radius: 12px; color: #F0F0F0;
          font-family: 'Onest', sans-serif; font-size: 15px;
          outline: none; transition: border-color 0.2s;
        }
        .input:focus { border-color: #C3073F; }
        .input::placeholder { color: #4E4E50; }
        .btn-primary {
          background: linear-gradient(135deg, #C3073F, #950740);
          color: #fff; border: none; border-radius: 12px;
          font-family: 'Onest', sans-serif; font-weight: 700;
          font-size: 15px; padding: 14px 28px; cursor: pointer;
          transition: transform 0.15s, opacity 0.15s; white-space: nowrap;
        }
        .btn-primary:hover { opacity: 0.9; transform: scale(1.02); }
        .btn-primary:active { transform: scale(0.98); }
        .btn-primary:disabled { background: #2a2a2a; color: #555; cursor: not-allowed; transform: none; }
        .event-card {
          background: #1A1A1D; border: 1px solid #2a2a2a;
          border-radius: 16px; padding: 16px 20px;
          cursor: pointer; transition: border-color 0.2s;
        }
        .event-card:hover { border-color: #6F2232; }
        .event-card.active { border-color: #C3073F; background: rgba(195,7,63,0.05); }
        .photo-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
        }
        .photo-thumb {
          width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 10px;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: '#1A1A1D',
        color: '#F0F0F0',
        fontFamily: "'Onest', sans-serif",
        padding: '40px 20px 60px',
        maxWidth: '800px',
        margin: '0 auto',
      }}>

        {/* Шапка */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontFamily: "'Unbounded', sans-serif",
            fontWeight: 900, fontSize: '24px',
            letterSpacing: '-1px', marginBottom: '6px',
          }}>
            tusi<span style={{ color: '#C3073F' }}>'m</span>
            <span style={{ color: '#4E4E50', fontSize: '14px', fontFamily: "'Onest', sans-serif", fontWeight: 400, marginLeft: '12px' }}>
              панель организатора
            </span>
          </h1>
        </div>

        {/* Создать событие */}
        <div style={{
          background: '#1A1A1D', border: '1px solid #2a2a2a',
          borderRadius: '20px', padding: '24px', marginBottom: '32px',
        }}>
          <div style={{ fontSize: '13px', color: '#4E4E50', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Новое мероприятие
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              className="input"
              placeholder="Свадьба Маши и Коли"
              value={eventName}
              onChange={e => setEventName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createEvent()}
            />
            <button className="btn-primary" onClick={createEvent} disabled={creating || !eventName.trim()}>
              {creating ? 'Создаём...' : 'Создать'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: events.length > 0 ? '280px 1fr' : '1fr', gap: '24px' }}>

          {/* Список событий */}
          {events.length > 0 && (
            <div>
              <div style={{ fontSize: '13px', color: '#4E4E50', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Мероприятия
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {events.map(event => (
                  <div
                    key={event.id}
                    className={`event-card ${selectedEvent?.id === event.id ? 'active' : ''}`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                      {event.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#4E4E50' }}>
                      код: <span style={{ color: '#C3073F', fontWeight: 600 }}>{event.code}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Детали события */}
          {selectedEvent && (
            <div>

              {/* QR код */}
              <div style={{
                background: '#1A1A1D', border: '1px solid #2a2a2a',
                borderRadius: '20px', padding: '24px', marginBottom: '20px',
              }}>
                <div style={{ fontSize: '13px', color: '#4E4E50', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  QR-код для гостей
                </div>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{
                    background: '#fff', borderRadius: '12px', padding: '12px',
                    display: 'inline-block',
                  }}>
                    <img src={qrUrl} width={160} height={160} alt="QR" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#4E4E50', marginBottom: '8px' }}>
                      Ссылка для гостей
                    </div>
                    <div style={{
                      background: '#111', border: '1px solid #2a2a2a',
                      borderRadius: '8px', padding: '10px 14px',
                      fontSize: '13px', color: '#C3073F',
                      fontFamily: 'monospace', marginBottom: '16px',
                      wordBreak: 'break-all',
                    }}>
                      localhost:3000/event/{selectedEvent.code}
                    </div>
                    <div style={{ fontSize: '12px', color: '#4E4E50', lineHeight: 1.6 }}>
                      Распечатай QR и расставь на столах.<br/>
                      Гость сканирует — и сразу снимает.
                    </div>
                  </div>
                </div>
              </div>

              {/* Фото */}
              <div style={{
                background: '#1A1A1D', border: '1px solid #2a2a2a',
                borderRadius: '20px', padding: '24px',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: '16px',
                }}>
                  <div style={{ fontSize: '13px', color: '#4E4E50', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Фото гостей
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C3073F', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                    <span style={{ fontSize: '12px', color: '#C3073F' }}>live</span>
                    <span style={{
                      fontSize: '11px', color: '#C3073F',
                      background: 'rgba(195,7,63,0.1)',
                      padding: '2px 8px', borderRadius: '100px', marginLeft: '4px',
                    }}>
                      {photos.length} фото
                    </span>
                  </div>
                </div>

                {photos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#4E4E50', fontSize: '13px' }}>
                    Пока нет фото — жди гостей
                  </div>
                ) : (
                  <div className="photo-grid">
                    {photos.map((photo, i) => (
                      <img
                        key={photo.id || i}
                        src={photo.url}
                        className="photo-thumb"
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </main>
    </>
  )
}