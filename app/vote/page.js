'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function getDeviceId() {
  let id = localStorage.getItem('tusim_device_id')
  if (!id) {
    id = Math.random().toString(36).substring(2) + Date.now()
    localStorage.setItem('tusim_device_id', id)
  }
  return id
}

export default function VotePage() {
  const [photos, setPhotos] = useState([])
  const [voted, setVoted] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('grid')

  const sorted = [...photos].sort((a, b) => b.votes - a.votes)
  const maxVotes = sorted[0]?.votes || 1

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
      .order('votes', { ascending: false })
    if (data) setPhotos(data)
    setLoading(false)
  }

  async function toggleVote(id) {
    const isVoted = voted.has(id)
    const photo = photos.find(p => p.id === id)
    const newVotes = photo.votes + (isVoted ? -1 : 1)

    setVoted(prev => {
      const next = new Set(prev)
      isVoted ? next.delete(id) : next.add(id)
      return next
    })
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, votes: newVotes } : p))

    await supabase.from('photos').update({ votes: newVotes }).eq('id', id)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Onest:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1A1A1D; }
        .like-btn {
          border: none; cursor: pointer; border-radius: 100px;
          font-family: 'Onest', sans-serif; font-weight: 600;
          font-size: 13px; padding: 8px 16px;
          transition: transform 0.1s, background 0.15s;
          display: flex; align-items: center; gap: 6px;
        }
        .like-btn:active { transform: scale(0.92); }
        .tab {
          background: transparent; border: 1px solid #2a2a2a;
          color: #4E4E50; border-radius: 100px; padding: 8px 18px;
          font-family: 'Onest', sans-serif; font-size: 13px;
          cursor: pointer; transition: all 0.15s;
        }
        .tab.active {
          background: rgba(195,7,63,0.1);
          border-color: rgba(195,7,63,0.4);
          color: #C3073F;
        }
      `}</style>

      <main style={{
        minHeight: '100vh', background: '#1A1A1D',
        color: '#F0F0F0', fontFamily: "'Onest', sans-serif",
        maxWidth: '600px', margin: '0 auto', padding: '0 20px 60px',
      }}>

        <div style={{ paddingTop: '40px', marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{
            fontFamily: "'Unbounded', sans-serif", fontWeight: 900,
            fontSize: '24px', letterSpacing: '-1px', marginBottom: '6px',
          }}>
            tusi<span style={{ color: '#C3073F' }}>'m</span>
          </h1>
          <p style={{ color: '#4E4E50', fontSize: '13px', marginBottom: '20px' }}>
            Голосуй за лучший кадр
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button className={`tab ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}>
              Все фото
            </button>
            <button className={`tab ${view === 'top' ? 'active' : ''}`} onClick={() => setView('top')}>
              Топ 3
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#4E4E50' }}>Загружаем...</div>
        )}

        {!loading && photos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#4E4E50', fontSize: '13px' }}>
            Пока нет фото для голосования
          </div>
        )}

        {!loading && view === 'top' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sorted.slice(0, 3).map((photo, i) => (
              <div key={photo.id} style={{
                background: '#1A1A1D',
                border: `1px solid ${i === 0 ? 'rgba(195,7,63,0.5)' : '#2a2a2a'}`,
                borderRadius: '20px', overflow: 'hidden',
                display: 'flex', alignItems: 'center', gap: '16px', padding: '12px',
              }}>
                <div style={{ fontSize: '28px', minWidth: '48px', textAlign: 'center' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </div>
                <img src={photo.url} loading="lazy" style={{
                  width: '72px', height: '72px',
                  objectFit: 'cover', borderRadius: '12px', flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '4px', background: '#2a2a2a', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '100px',
                        background: 'linear-gradient(90deg, #6F2232, #C3073F)',
                        width: `${(photo.votes / maxVotes) * 100}%`,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: '13px', color: '#C3073F', fontWeight: 600 }}>{photo.votes}</span>
                  </div>
                </div>
                <button className="like-btn" onClick={() => toggleVote(photo.id)} style={{
                  background: voted.has(photo.id) ? 'rgba(195,7,63,0.15)' : '#222',
                  color: voted.has(photo.id) ? '#C3073F' : '#888',
                  border: voted.has(photo.id) ? '1px solid rgba(195,7,63,0.4)' : '1px solid #333',
                }}>
                  {voted.has(photo.id) ? '♥' : '♡'}
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && view === 'grid' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sorted.map((photo, i) => (
              <div key={photo.id} style={{
                background: '#1A1A1D',
                border: `1px solid ${i === 0 ? 'rgba(195,7,63,0.4)' : '#2a2a2a'}`,
                borderRadius: '20px', overflow: 'hidden',
              }}>
                <img src={photo.url} loading="lazy" style={{
                  width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block',
                }} />
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {i === 0 && (
                    <span style={{
                      fontSize: '11px', fontWeight: 700, color: '#C3073F',
                      background: 'rgba(195,7,63,0.1)', border: '1px solid rgba(195,7,63,0.3)',
                      padding: '2px 8px', borderRadius: '100px',
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>Топ</span>
                  )}
                  <span style={{ flex: 1 }} />
                  <button className="like-btn" onClick={() => toggleVote(photo.id)} style={{
                    background: voted.has(photo.id) ? 'rgba(195,7,63,0.15)' : '#222',
                    color: voted.has(photo.id) ? '#C3073F' : '#888',
                    border: voted.has(photo.id) ? '1px solid rgba(195,7,63,0.4)' : '1px solid #333',
                  }}>
                    <span style={{ fontSize: '16px' }}>{voted.has(photo.id) ? '♥' : '♡'}</span>
                    {photo.votes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </>
  )
}