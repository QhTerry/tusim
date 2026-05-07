'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OrganizerPage() {
  const router = useRouter()
  const telegramRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('organizer_token')
    if (token) { router.replace('/organizer/dashboard'); return }

    window.onTelegramAuth = async (tgData) => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/telegram-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tgData)
        })
        const data = await res.json()
        if (data.ok) {
          localStorage.setItem('organizer_token', data.token)
          localStorage.setItem('organizer', JSON.stringify(data.organizer))
          router.push('/organizer/dashboard')
        } else {
          setError(data.error || 'Ошибка авторизации')
          setLoading(false)
        }
      } catch {
        setError('Ошибка сети')
        setLoading(false)
      }
    }

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'tusim_bot')
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    script.async = true
    if (telegramRef.current) telegramRef.current.appendChild(script)

    return () => { delete window.onTelegramAuth }
  }, [])

  const features = [
    { icon: '📸', text: 'краудсорсинг фото' },
    { icon: '🔗', text: 'QR-код для гостей' },
    { icon: '📊', text: 'статистика события' },
    { icon: '🎛️', text: 'модерация альбома' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Onest:wght@300;400;500&display=swap');

        .op-root {
          min-height: 100vh;
          background: #0e0e10;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Onest', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .op-glow1 {
          position: absolute;
          width: 700px; height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(195,7,63,0.13) 0%, transparent 65%);
          top: -250px; left: -250px;
          animation: opDrift1 9s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .op-glow2 {
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(111,34,50,0.1) 0%, transparent 65%);
          bottom: -180px; right: -120px;
          animation: opDrift2 11s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .op-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 56px 56px;
          pointer-events: none;
        }

        @keyframes opDrift1 {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(80px,50px) scale(1.12); }
        }
        @keyframes opDrift2 {
          from { transform: translate(0,0); }
          to   { transform: translate(-50px,-70px) scale(1.1); }
        }

        .op-content {
          position: relative; z-index: 10;
          width: 100%; max-width: 400px;
          padding: 24px;
          opacity: 0; transform: translateY(20px);
          animation: opFadeUp 0.55s cubic-bezier(0.16,1,0.3,1) 0.05s forwards;
        }
        @keyframes opFadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        .op-logo {
          margin-bottom: 40px;
        }
        .op-logo-text {
          font-family: 'Unbounded', sans-serif;
          font-size: 38px; font-weight: 900;
          color: #F0F0F0; letter-spacing: -2px;
          line-height: 1; margin-bottom: 10px;
        }
        .op-logo-text span { color: #C3073F; }
        .op-logo-sub {
          font-size: 11px; color: #444;
          letter-spacing: 3px; text-transform: uppercase; font-weight: 300;
        }

        .op-card {
          background: rgba(20,20,24,0.95);
          border: 0.5px solid rgba(255,255,255,0.06);
          border-radius: 24px; padding: 32px;
          position: relative; overflow: hidden;
          backdrop-filter: blur(30px);
          margin-bottom: 10px;
        }
        .op-card::before {
          content: '';
          position: absolute; top: 0; left: 10%; right: 10%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(195,7,63,0.5), transparent);
        }
        .op-card::after {
          content: '';
          position: absolute; bottom: 0; left: 0; right: 0; top: 0;
          background: radial-gradient(ellipse at top left, rgba(195,7,63,0.04) 0%, transparent 60%);
          pointer-events: none;
        }

        .op-dot {
          position: absolute; border-radius: 50%; pointer-events: none;
        }
        .op-dot1 { width: 5px; height: 5px; background: #C3073F; top: 28px; right: 28px; opacity: 0.7; animation: opPulse 2.5s ease-in-out infinite; }
        .op-dot2 { width: 3px; height: 3px; background: #C3073F; top: 44px; right: 44px; opacity: 0.3; animation: opPulse 2.5s ease-in-out infinite 0.8s; }
        @keyframes opPulse {
          0%,100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }

        .op-title {
          font-size: 19px; font-weight: 500;
          color: #F0F0F0; margin-bottom: 7px; letter-spacing: -0.3px;
        }
        .op-desc {
          font-size: 13px; color: #4a4a4a;
          line-height: 1.65; margin-bottom: 26px; font-weight: 300;
        }

        .op-tg-wrap {
          display: flex; justify-content: center;
          min-height: 52px; position: relative; z-index: 1;
        }

        .op-spinner {
          display: flex; align-items: center;
          justify-content: center; gap: 12px;
          padding: 16px; color: #444; font-size: 13px;
        }
        .op-spin {
          width: 18px; height: 18px;
          border: 2px solid #222; border-top-color: #C3073F;
          border-radius: 50%;
          animation: opSpin 0.7s linear infinite;
        }
        @keyframes opSpin { to { transform: rotate(360deg); } }

        .op-error {
          margin-top: 14px; padding: 12px 16px;
          background: rgba(195,7,63,0.07);
          border: 0.5px solid rgba(195,7,63,0.18);
          border-radius: 12px; color: #d04060; font-size: 13px;
        }

        .op-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 22px 0 0; color: #2a2a2a;
          font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
        }
        .op-divider::before, .op-divider::after {
          content: ''; flex: 1; height: 0.5px;
          background: rgba(255,255,255,0.04);
        }

        .op-feats {
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
          margin-top: 10px;
        }
        .op-feat {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px;
          background: rgba(255,255,255,0.015);
          border: 0.5px solid rgba(255,255,255,0.04);
          border-radius: 14px;
          font-size: 12px; color: #3a3a3a;
          transition: border-color 0.25s, color 0.25s, background 0.25s;
          cursor: default;
        }
        .op-feat:hover {
          border-color: rgba(195,7,63,0.18);
          color: #666;
          background: rgba(195,7,63,0.03);
        }
        .op-feat-icon {
          width: 30px; height: 30px;
          background: rgba(195,7,63,0.07);
          border-radius: 9px;
          display: flex; align-items: center;
          justify-content: center; font-size: 15px; flex-shrink: 0;
        }

        /* Скрываем глобальную нижнюю навигацию */
        nav[class], footer[class],
        div[class*="bottom"], div[class*="nav-bar"],
        div[class*="tabbar"] {
          display: none !important;
        }
      `}</style>

      <div className="op-root">
        <div className="op-glow1" />
        <div className="op-glow2" />
        <div className="op-grid" />

        <div className="op-content">
          <div className="op-logo">
            <div className="op-logo-text">tusi<span>'</span>m</div>
            <div className="op-logo-sub">кабинет организатора</div>
          </div>

          <div className="op-card">
            <div className="op-dot op-dot1" />
            <div className="op-dot op-dot2" />

            <div className="op-title">Войди через Telegram</div>
            <div className="op-desc">
              Один клик — и ты в кабинете. Создавай события, выбирай тариф и управляй альбомом своих гостей.
            </div>

            {!loading
              ? <div className="op-tg-wrap" ref={telegramRef} />
              : (
                <div className="op-spinner">
                  <div className="op-spin" />
                  входим в кабинет...
                </div>
              )
            }

            {error && <div className="op-error">{error}</div>}

            <div className="op-divider">включено</div>
          </div>

          <div className="op-feats">
            {features.map((f, i) => (
              <div className="op-feat" key={i}>
                <div className="op-feat-icon">{f.icon}</div>
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}