'use client'

import { useState } from 'react'

const MOCK_PHOTOS = [
  { id: 1, url: 'https://picsum.photos/seed/1/400/400', votes: 24, author: 'Анна' },
  { id: 2, url: 'https://picsum.photos/seed/2/400/400', votes: 17, author: 'Игорь' },
  { id: 3, url: 'https://picsum.photos/seed/3/400/400', votes: 31, author: 'Света' },
  { id: 4, url: 'https://picsum.photos/seed/4/400/400', votes: 8, author: 'Коля' },
  { id: 5, url: 'https://picsum.photos/seed/5/400/400', votes: 45, author: 'Маша' },
  { id: 6, url: 'https://picsum.photos/seed/6/400/400', votes: 12, author: 'Дима' },
]

export default function VotePage() {
  const [photos, setPhotos] = useState(MOCK_PHOTOS)
  const [voted, setVoted] = useState(new Set())
  const [view, setView] = useState('grid')

  const sorted = [...photos].sort((a, b) => b.votes - a.votes)
  const maxVotes = sorted[0]?.votes || 1

  function toggleVote(id) {
    setVoted(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setPhotos(p => p.map(ph => ph.id === id ? { ...ph, votes: ph.votes - 1 } : ph))
      } else {
        next.add(id)
        setPhotos(p => p.map(ph => ph.id === id ? { ...ph, votes: ph.votes + 1 } : ph))
      }
      return next
    })
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
        @keyframes heartPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
        .voted { animation: heartPop 0.3s ease; }
        @keyframes pulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }
      `}</style>

      <main style={{
        minHeight: '100vh', background: '#1A1A1D',
        color: '#F0F0F0', fontFamily: "'Onest', sans-serif",
        maxWidth: '600px', margin: '0 auto', padding: '0 20px 60px',
      }}>

        {/* Шапка */}
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

        {/* Топ 3 */}
        {view === 'top' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sorted.slice(0, 3).map((photo, i) => (
              <div key={photo.id} style={{
                background: '#1A1A1D',
                border: `1px solid ${i === 0 ? 'rgba(195,7,63,0.5)' : '#2a2a2a'}`,
                borderRadius: '20px', overflow: 'hidden',
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '12px',
              }}>
                <div style={{
                  fontFamily: "'Unbounded', sans-serif", fontWeight: 900,
                  fontSize: '28px', minWidth: '48px', textAlign: 'center',
                  color: i === 0 ? '#C3073F' : i === 1 ? '#888' : '#4E4E50',
                }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </div>
                <img src={photo.url} style={{
                  width: '72px', height: '72px',
                  objectFit: 'cover', borderRadius: '12px', flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                    {photo.author}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      flex: 1, height: '4px', background: '#2a2a2a',
                      borderRadius: '100px', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', borderRadius: '100px',
                        background: 'linear-gradient(90deg, #6F2232, #C3073F)',
                        width: `${(photo.votes / maxVotes) * 100}%`,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: '13px', color: '#C3073F', fontWeight: 600, minWidth: '32px' }}>
                      {photo.votes}
                    </span>
                  </div>
                </div>
                <button
                  className="like-btn"
                  onClick={() => toggleVote(photo.id)}
                  style={{
                    background: voted.has(photo.id) ? 'rgba(195,7,63,0.15)' : '#222',
                    color: voted.has(photo.id) ? '#C3073F' : '#888',
                    border: voted.has(photo.id) ? '1px solid rgba(195,7,63,0.4)' : '1px solid #333',
                  }}
                >
                  <span className={voted.has(photo.id) ? 'voted' : ''}>
                    {voted.has(photo.id) ? '♥' : '♡'}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Сетка */}
        {view === 'grid' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sorted.map((photo, i) => (
              <div key={photo.id} style={{
                background: '#1A1A1D',
                border: `1px solid ${i === 0 ? 'rgba(195,7,63,0.4)' : '#2a2a2a'}`,
                borderRadius: '20px', overflow: 'hidden',
              }}>
                <img src={photo.url} style={{
                  width: '100%', aspectRatio: '1',
                  objectFit: 'cover', display: 'block',
                }} />
                <div style={{
                  padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  {i === 0 && (
                    <span style={{
                      fontSize: '11px', fontWeight: 700,
                      color: '#C3073F', background: 'rgba(195,7,63,0.1)',
                      border: '1px solid rgba(195,7,63,0.3)',
                      padding: '2px 8px', borderRadius: '100px',
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>
                      Топ
                    </span>
                  )}
                  <span style={{ fontSize: '13px', color: '#888', flex: 1 }}>
                    {photo.author}
                  </span>
                  <button
                    className="like-btn"
                    onClick={() => toggleVote(photo.id)}
                    style={{
                      background: voted.has(photo.id) ? 'rgba(195,7,63,0.15)' : '#222',
                      color: voted.has(photo.id) ? '#C3073F' : '#888',
                      border: voted.has(photo.id) ? '1px solid rgba(195,7,63,0.4)' : '1px solid #333',
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>
                      {voted.has(photo.id) ? '♥' : '♡'}
                    </span>
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