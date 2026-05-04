import './globals.css'

export const metadata = {
  title: "tusi'm",
  description: 'Краудсорсинг фото на твоём мероприятии',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        {/* Запрет браузерного зума — кнопки не улетают */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#1A1A1D" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body style={{ margin:0, padding:0, background:'#1A1A1D', overflowX:'hidden' }}>
        {children}
        <BottomNavWrapper />
      </body>
    </html>
  )
}

function BottomNavWrapper() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600&display=swap');

        .bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: rgba(14,14,16,0.94);
          backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: space-around;
          padding: 10px 24px;
          padding-bottom: max(10px, env(safe-area-inset-bottom, 10px));
          z-index: 1000;
          animation: navFadeIn 0.4s 0.1s cubic-bezier(.22,1,.36,1) both;
        }

        .nav-item {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          text-decoration: none; padding: 8px 20px; border-radius: 14px;
          transition: background 0.15s, opacity 0.15s;
          cursor: pointer; border: none; background: transparent;
          font-family: 'Onest', sans-serif; -webkit-tap-highlight-color: transparent; opacity: 0.9;
        }
        .nav-item:active { background: rgba(255,255,255,0.04); opacity: 0.7; }

        .nav-label { font-size: 10px; font-weight: 500; letter-spacing: 0.02em; color: #3a3a3a; }

        .nav-center-wrap { display: flex; align-items: center; justify-content: center; padding: 4px; }
        .nav-center {
          width: 54px; height: 54px; border-radius: 50%;
          background: linear-gradient(135deg, #C3073F, #6F2232);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 0 4px rgba(195,7,63,0.12), 0 4px 16px rgba(195,7,63,0.3);
          transition: transform 0.15s, box-shadow 0.15s; -webkit-tap-highlight-color: transparent;
        }
        .nav-center:active {
          transform: scale(0.91);
          box-shadow: 0 0 0 4px rgba(195,7,63,0.08), 0 2px 8px rgba(195,7,63,0.2);
        }

        @keyframes navFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <nav className="bottom-nav">
        <a id="nav-swipe-link" href="/swipe" className="nav-item">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#3a3a3a"/>
          </svg>
          <span className="nav-label">Голосование</span>
        </a>

        <div className="nav-center-wrap">
          <a id="nav-camera-link" href="/event/loading" style={{ textDecoration:'none', display:'block' }}>
            <div className="nav-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7-10h-3l-2-2H10L8 5.5H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2v-11a2 2 0 00-2-2z" fill="white"/>
              </svg>
            </div>
          </a>
        </div>

        <a id="nav-album-link" href="/album" className="nav-item">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="8" height="8" rx="2" fill="#3a3a3a"/>
            <rect x="13" y="3" width="8" height="8" rx="2" fill="#3a3a3a"/>
            <rect x="3" y="13" width="8" height="8" rx="2" fill="#3a3a3a"/>
            <rect x="13" y="13" width="8" height="8" rx="2" fill="#3a3a3a"/>
          </svg>
          <span className="nav-label">Альбом</span>
        </a>
      </nav>

      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          try {
            var code    = localStorage.getItem('tusim_event_code');
            var eventId = localStorage.getItem('tusim_event_id');

            // Камера — ведёт на /event/КОД
            var camLink = document.getElementById('nav-camera-link');
            if (camLink && code) camLink.href = '/event/' + code;

            // Голосование и альбом — передаём event_id в URL
            // чтобы разделение по событиям работало даже если localStorage протух
            if (eventId) {
              var swipeLink = document.getElementById('nav-swipe-link');
              if (swipeLink) swipeLink.href = '/swipe?event_id=' + eventId;

              var albumLink = document.getElementById('nav-album-link');
              if (albumLink) albumLink.href = '/album?event_id=' + eventId;
            }

            // Скрываем навигацию на /admin
            if (window.location.pathname.startsWith('/admin')) {
              var nav = document.querySelector('.bottom-nav');
              if (nav) nav.style.display = 'none';
              document.body.style.paddingBottom = '0';
            }
          } catch(e) {}
        })();
      `}} />
    </>
  )
}