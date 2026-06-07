'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || ''
const DEV_LOGIN = process.env.NEXT_PUBLIC_DEV_LOGIN === '1'

export default function OrganizerLogin() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const widgetRef = useRef(null)

  // Уже авторизован? — сразу в кабинет
  useEffect(() => {
    setMounted(true)
    fetch('/api/me')
      .then(r => { if (r.ok) router.replace('/organizer/dashboard') })
      .catch(() => {})
  }, [])

  async function auth(payload) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/telegram-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Не удалось войти')
      }
      router.replace('/organizer/dashboard')
    } catch (e) {
      setError(e.message || 'Ошибка входа')
      setLoading(false)
    }
  }

  // Встраиваем официальный Telegram Login Widget
  useEffect(() => {
    if (!mounted || !BOT_USERNAME || !widgetRef.current) return
    window.onTelegramAuth = (user) => auth(user)
    widgetRef.current.innerHTML = ''
    const s = document.createElement('script')
    s.src = 'https://telegram.org/js/telegram-widget.js?22'
    s.async = true
    s.setAttribute('data-telegram-login', BOT_USERNAME)
    s.setAttribute('data-size', 'large')
    s.setAttribute('data-radius', '12')
    s.setAttribute('data-request-access', 'write')
    s.setAttribute('data-onauth', 'onTelegramAuth(user)')
    widgetRef.current.appendChild(s)
  }, [mounted])

  if (!mounted) return null

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .ol-root {
          min-height: 100vh; min-height: 100dvh; background: #09090b;
          display: flex; font-family: 'Onest', sans-serif; color: #F0F0F0;
          position: relative; overflow: hidden;
        }
        .ol-blob { position: fixed; border-radius: 50%; filter: blur(100px); pointer-events: none; z-index: 0; }
        .ol-blob-1 { width: 600px; height: 600px; background: rgba(195,7,63,0.1); top: -200px; left: -200px;
          animation: blobDrift 20s ease-in-out infinite alternate; }
        .ol-blob-2 { width: 400px; height: 400px; background: rgba(195,7,63,0.06); bottom: -100px; right: -100px;
          animation: blobDrift 26s ease-in-out infinite alternate-reverse; }
        @keyframes blobDrift { from { transform: translate(0,0) scale(1); } to { transform: translate(50px,60px) scale(1.12); } }

        .ol-left {
          display: none; width: 46%; position: relative; overflow: hidden;
          flex-direction: column; justify-content: space-between; padding: 52px;
          border-right: 1px solid rgba(255,255,255,0.04);
        }
        @media(min-width: 960px) { .ol-left { display: flex; } }
        .ol-grid { position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 52px 52px; }
        .ol-grid-fade { position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, #09090b 100%); }
        .ol-left-logo { position: relative; z-index: 2; font-family: 'Unbounded', sans-serif; font-weight: 900;
          font-size: 26px; color: #fff; letter-spacing: -1.5px; text-decoration: none; }
        .ol-left-logo span { color: #C3073F; }
        .ol-left-mid { position: relative; z-index: 2; }
        .ol-left-mid h2 { font-family: 'Unbounded', sans-serif; font-size: clamp(32px,3vw,46px); font-weight: 900;
          color: #fff; letter-spacing: -2px; line-height: 1.08; margin-bottom: 20px; }
        .ol-left-mid h2 span { color: #C3073F; }
        .ol-left-mid p { font-size: 14px; color: rgba(255,255,255,0.3); line-height: 1.75; font-weight: 300; }
        .ol-left-stats { position: relative; z-index: 2; display: flex; gap: 36px; }
        .ol-stat-num { font-family: 'Unbounded', sans-serif; font-size: 26px; font-weight: 900; color: #fff;
          letter-spacing: -1px; display: block; margin-bottom: 4px; }
        .ol-stat-label { font-size: 10px; color: rgba(255,255,255,0.3); letter-spacing: 1.5px; text-transform: uppercase; }

        .ol-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 24px; position: relative; z-index: 1; }
        .ol-form-wrap { width: 100%; max-width: 400px; animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .ol-mobile-logo { font-family: 'Unbounded', sans-serif; font-weight: 900; font-size: 22px; color: #fff;
          letter-spacing: -1.5px; margin-bottom: 40px; display: block; text-decoration: none; }
        .ol-mobile-logo span { color: #C3073F; }
        @media(min-width: 960px) { .ol-mobile-logo { display: none; } }
        .ol-head { margin-bottom: 32px; }
        .ol-title { font-family: 'Unbounded', sans-serif; font-size: 24px; font-weight: 900; color: #fff;
          letter-spacing: -0.8px; margin-bottom: 8px; }
        .ol-sub { font-size: 13px; color: rgba(255,255,255,0.3); font-weight: 300; line-height: 1.6; }

        .ol-tg-screen { text-align: center; padding: 8px 0; }
        .ol-tg-big { width: 88px; height: 88px; border-radius: 28px; background: rgba(34,158,217,0.08);
          border: 1px solid rgba(34,158,217,0.15); display: flex; align-items: center; justify-content: center;
          font-size: 40px; margin: 0 auto 24px; }
        .ol-widget { display: flex; justify-content: center; min-height: 48px; align-items: center; }
        .ol-loading { display: flex; align-items: center; justify-content: center; gap: 10px;
          color: rgba(255,255,255,0.4); font-size: 13px; }
        .ol-spin { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff;
          border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ol-error { margin-top: 16px; font-size: 13px; color: #C3073F; text-align: center; }
        .ol-notice { margin-top: 12px; font-size: 12px; color: rgba(255,255,255,0.35); text-align: center; line-height: 1.6;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 14px; }
        .ol-dev-btn { margin-top: 18px; width: 100%; padding: 13px; background: rgba(255,255,255,0.05);
          border: 1px dashed rgba(255,255,255,0.18); border-radius: 12px; color: rgba(255,255,255,0.5);
          font-size: 13px; font-family: 'Onest', sans-serif; cursor: pointer; transition: all 0.15s; }
        .ol-dev-btn:hover { color: #fff; background: rgba(255,255,255,0.08); }
        .ol-footer { margin-top: 28px; text-align: center; font-size: 11px; color: rgba(255,255,255,0.2); line-height: 1.8; }
        .ol-footer a { color: rgba(255,255,255,0.35); text-decoration: none; }
        .ol-footer a:hover { color: rgba(255,255,255,0.6); }
      `}</style>

      <div className="ol-blob ol-blob-1"/>
      <div className="ol-blob ol-blob-2"/>

      <div className="ol-root">
        <div className="ol-left">
          <div className="ol-grid"/>
          <div className="ol-grid-fade"/>
          <a href="/" className="ol-left-logo">tusi<span>&apos;m</span></a>
          <div className="ol-left-mid">
            <h2>Краудсорсинг<br/>фото на твоём<br/><span>мероприятии</span></h2>
            <p>QR-код вместо фотографа.<br/>Гости снимают — альбом<br/>собирается сам.</p>
          </div>
          <div className="ol-left-stats">
            <div><span className="ol-stat-num">500+</span><span className="ol-stat-label">гостей</span></div>
            <div><span className="ol-stat-num">0</span><span className="ol-stat-label">приложений</span></div>
            <div><span className="ol-stat-num">∞</span><span className="ol-stat-label">фото</span></div>
          </div>
        </div>

        <div className="ol-right">
          <div className="ol-form-wrap">
            <a href="/" className="ol-mobile-logo">tusi<span>&apos;m</span></a>

            <div className="ol-head">
              <div className="ol-title">Кабинет организатора</div>
              <div className="ol-sub">Вход через Telegram — без паролей и регистрации</div>
            </div>

            <div className="ol-tg-screen">
              <div className="ol-tg-big">✈️</div>

              {loading ? (
                <div className="ol-loading"><span className="ol-spin"/> Входим…</div>
              ) : BOT_USERNAME ? (
                <div className="ol-widget" ref={widgetRef}/>
              ) : (
                <div className="ol-notice">
                  Telegram-вход не настроен.<br/>
                  Задайте переменную <b>NEXT_PUBLIC_TELEGRAM_BOT_USERNAME</b> и привяжите домен в @BotFather.
                </div>
              )}

              {error && <div className="ol-error">{error}</div>}

              {DEV_LOGIN && (
                <button className="ol-dev-btn" onClick={() => auth({ dev: true })} disabled={loading}>
                  Dev-вход (локально)
                </button>
              )}
            </div>

            <div className="ol-footer">
              Нажимая «войти», вы соглашаетесь с условиями сервиса.<br/>
              <a href="/">← На главную</a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
