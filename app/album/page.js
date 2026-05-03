'use client'

import { useState } from 'react'

const MOCK_PHOTOS = [
  { id: 1, url: 'https://picsum.photos/seed/1/400/400', author: 'Анна', votes: 24 },
  { id: 2, url: 'https://picsum.photos/seed/2/400/400', author: 'Игорь', votes: 17 },
  { id: 3, url: 'https://picsum.photos/seed/3/400/400', author: 'Света', votes: 31 },
  { id: 4, url: 'https://picsum.photos/seed/4/400/400', author: 'Коля', votes: 8 },
  { id: 5, url: 'https://picsum.photos/seed/5/400/400', author: 'Маша', votes: 45 },
  { id: 6, url: 'https://picsum.photos/seed/6/400/400', author: 'Дима', votes: 12 },
  { id: 7, url: 'https://picsum.photos/seed/7/400/400', author: 'Катя', votes: 19 },
  { id: 8, url: 'https://picsum.photos/seed/8/400/400', author: 'Вася', votes: 6 },
  { id: 9, url: 'https://picsum.photos/seed/9/400/400', author: 'Оля', votes: 33 },
]

export default function AlbumPage() {
  const [selected, setSelected] = useState(null)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Onest:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1A1A1D; }
        .thumb { transition: transform 0.15s; cursor: pointer; }
        .thumb:active { transform: scale(0.95); }
      `}</style>

      <main style={{
        minHeight: '100vh', background: '#1A1A1D',
        color: '#F0F0F0', fontFamily: "'Onest', sans-serif",
        padding: '0 0 20px',
      }}>

        {/* Шапка */}
        <div style={{ padding: '48px 20px 24px' }}>
          <h1 style={{
            fontFamily: "'Unbounded', sans-serif", fontWeight: 900,
            fontSize: '22px', letterSpacing: '-0.5px', marginBottom: '4px',
          }}>
            Альбом
          </h1>
          <p style={{ color: '#4E4E50', fontSize: '13px' }}>
            {MOCK_PHOTOS.length} фото · Свадьба Маши и Коли
          </p>
        </div>

        {/* Сетка */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '2px',
        }}>
          {MOCK_PHOTOS.map(photo => (
            <div key={photo.id} className="thumb" onClick={() => setSelected(photo)}>
              <img src={photo.url} style={{
                width: '100%', aspectRatio: '1',
                objectFit: 'cover', display: 'block',
              }} />
            </div>
          ))}
        </div>

      </main>

      {/* Просмотр фото */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
            zIndex: 500, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}
        >
          <img src={selected.url} style={{
            maxWidth: '100%', maxHeight: '70vh',
            objectFit: 'contain', borderRadius: '12px',
          }} />
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: '15px' }}>{selected.author}</div>
            <div style={{ color: '#4E4E50', fontSize: '13px', marginTop: '4px' }}>
              {selected.votes} голосов
            </div>
          </div>
          <div style={{ color: '#4E4E50', fontSize: '12px', marginTop: '20px' }}>
            нажми чтобы закрыть
          </div>
        </div>
      )}
    </>
  )
}