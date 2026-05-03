'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AlbumPage() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [eventName, setEventName] = useState('')

  useEffect(() => {
    const eventId = localStorage.getItem('tusim_event_id')
    const name = localStorage.getItem('tusim_event_name')
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Onest:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1A1A1D; }
        .thumb { cursor: pointer; overflow: hidden; }
        .thumb img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; transition: transform 0.2s; }
        .thumb:active img { transform: scale(0.97); }
      `}</style>

      <main style={{
        minHeight: '100vh', background: '#1A1A1D',
        color: '#F0F0F0', fontFamily: "'Onest', sans-serif",
        padding: '0 0 20px',
      }}>

        <div style={{ padding: '48px 20px 24px' }}>
          <h1 style={{
            fontFamily: "'Unbounded', sans-serif", fontWeight: 900,
            fontSize: '22px', letterSpacing: '-0.5px', marginBottom: '4px',
          }}>
            Альбом
          </h1>
          <p style={{ color: '#4E4E50', fontSize: '13px' }}>
            {loading ? 'Загружаем...' : `${photos.length} фото · ${eventName}`}
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#4E4E50', fontSize: '14px' }}>
            Загружаем...
          </div>
        )}

        {!loading && photos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(195,7,63,0.08)', border: '1px solid rgba(195,7,63,0.2)',
              margin: '0 auto 12px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '24px',
            }}>📸</div>
            <p style={{ color: '#4E4E50', fontSize: '13px', lineHeight: 1.6 }}>
              Пока нет фото<br/>Сделай первый кадр!
            </p>
          </div>
        )}

        {!loading && photos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
            {photos.map(photo => (
              <div key={photo.id} className="thumb" onClick={() => setSelected(photo)}>
                <img src={photo.url} loading="lazy" />
              </div>
            ))}
          </div>
        )}

      </main>

      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
          zIndex: 500, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <img src={selected.url} style={{
            maxWidth: '100%', maxHeight: '70vh',
            objectFit: 'contain', borderRadius: '12px',
          }} />
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: '15px', color: '#F0F0F0' }}>
                {selected.author || 'Гость'}
            </div>
            <div style={{ color: '#4E4E50', fontSize: '13px', marginTop: '4px' }}>
                {selected.votes} голосов
            </div>
          </div>
        </div>
      )}
    </>
  )
}