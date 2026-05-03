import './globals.css'

export const metadata = {
  title: "tusi'm",
  description: 'Краудсорсинг фото на твоём мероприятии',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, background: '#1A1A1D', paddingBottom: '90px' }}>
        {children}
        <BottomNav />
      </body>
    </html>
  )
}

function BottomNav() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600&display=swap');
        .bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: rgba(20,20,22,0.95);
          backdrop-filter: blur(24px);
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center;
          justify-content: space-around;
          padding: 12px 24px 28px;
          z-index: 1000;
        }
        .nav-item {
          display: flex; flex-direction: column;
          align-items: center; gap: 5px;
          text-decoration: none;
          padding: 8px 16px; border-radius: 14px;
          transition: background 0.15s;
          cursor: pointer; border: none;
          background: transparent;
          font-family: 'Onest', sans-serif;
          -webkit-tap-highlight-color: transparent;
        }
        .nav-item:active { background: rgba(255,255,255,0.05); }
        .nav-label {
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.02em; color: #4E4E50;
        }
        .nav-center {
          width: 56px; height: 56px; border-radius: 50%;
          background: linear-gradient(135deg, #C3073F, #6F2232);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: -8px;
          box-shadow: 0 0 0 4px rgba(195,7,63,0.15);
          transition: transform 0.15s;
        }
        .nav-center:active { transform: scale(0.93); }
      `}</style>

      <nav className="bottom-nav">

        {/* Голосование */}
        <a href="/vote" className="nav-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#4E4E50"/>
          </svg>
          <span className="nav-label">Голосование</span>
        </a>

        {/* Камера — центральная */}
        <a href="/" className="nav-item" style={{ padding: 0 }}>
          <div className="nav-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7-10h-3l-2-2H10L8 5.5H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2v-11a2 2 0 00-2-2z" fill="white"/>
            </svg>
          </div>
        </a>

        {/* Альбом */}
        <a href="/album" className="nav-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="8" height="8" rx="2" fill="#4E4E50"/>
            <rect x="13" y="3" width="8" height="8" rx="2" fill="#4E4E50"/>
            <rect x="3" y="13" width="8" height="8" rx="2" fill="#4E4E50"/>
            <rect x="13" y="13" width="8" height="8" rx="2" fill="#4E4E50"/>
          </svg>
          <span className="nav-label">Альбом</span>
        </a>

      </nav>
    </>
  )
}