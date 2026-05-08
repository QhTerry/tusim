'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OrganizerLogin() {
  const router = useRouter()
  const [tab, setTab] = useState('phone') // 'phone' | 'tg'
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (localStorage.getItem('organizer_token')) router.replace('/organizer/dashboard')
  }, [])

  function formatPhone(val) {
    const d = val.replace(/\D/g, '').slice(0, 11)
    if (!d) return ''
    const n = d.startsWith('8') ? '7' + d.slice(1) : d
    let r = '+7'
    if (n.length > 1) r += ' ' + n.slice(1, 4)
    if (n.length > 4) r += ' ' + n.slice(4, 7)
    if (n.length > 7) r += '-' + n.slice(7, 9)
    if (n.length > 9) r += '-' + n.slice(9, 11)
    return r
  }

  function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      localStorage.setItem('organizer_token', 'stub_token')
      localStorage.setItem('organizer', JSON.stringify({ name: 'Организатор', phone }))
      router.push('/organizer/dashboard')
    }, 1000)
  }

  function handleTgLogin() {
    setLoading(true)
    setTimeout(() => {
      localStorage.setItem('organizer_token', 'stub_token')
      localStorage.setItem('organizer', JSON.stringify({ name: 'TG Пользователь' }))
      router.push('/organizer/dashboard')
    }, 1200)
  }

  if (!mounted) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Onest:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ol-root {
          min-height: 100vh; min-height: 100dvh;
          background: #0c0c0e;
          display: flex; font-family: 'Onest', sans-serif;
          position: relative; overflow: hidden;
        }

        /* Левая панель — декоративная */
        .ol-left {
          display: none;
          width: 45%; background: #111114;
          border-right: 0.5px solid rgba(255,255,255,0.04);
          position: relative; overflow: hidden;
          flex-direction: column; justify-content: space-between;
          padding: 48px;
        }
        @media(min-width: 900px) { .ol-left { display: flex; } }

        .ol-left-glow {
          position: absolute; width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(195,7,63,0.15) 0%, transparent 65%);
          top: -100px; left: -100px;
          animation: glowDrift 8s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .ol-left-glow2 {
          position: absolute; width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(111,34,50,0.1) 0%, transparent 65%);
          bottom: 100px; right: -50px;
          animation: glowDrift 11s ease-in-out infinite alternate-reverse;
          pointer-events: none;
        }
        @keyframes glowDrift {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(40px,60px) scale(1.1); }
        }

        .ol-left-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .ol-logo {
          position: relative; z-index: 2;
          font-family: 'Syne', sans-serif;
          font-weight: 800; font-size: 28px;
          color: #fff; letter-spacing: -1px;
        }
        .ol-logo em { font-style: normal; color: #C3073F; }

        .ol-tagline {
          position: relative; z-index: 2;
        }
        .ol-tagline h2 {
          font-family: 'Syne', sans-serif;
          font-size: 42px; font-weight: 800;
          color: #fff; letter-spacing: -2px;
          line-height: 1.1; margin-bottom: 16px;
        }
        .ol-tagline h2 span { color: #C3073F; }
        .ol-tagline p { font-size: 14px; color: #444; line-height: 1.7; font-weight: 300; }

        .ol-stats {
          position: relative; z-index: 2;
          display: flex; gap: 32px;
        }
        .ol-stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 28px; font-weight: 800;
          color: #fff; letter-spacing: -1px; display: block;
        }
        .ol-stat-label { font-size: 11px; color: #444; letter-spacing: 1px; text-transform: uppercase; }

        /* Правая панель — форма */
        .ol-right {
          flex: 1; display: flex; align-items: center;
          justify-content: center; padding: 24px;
          position: relative;
        }

        .ol-right-glow {
          position: absolute; width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(195,7,63,0.07) 0%, transparent 65%);
          top: -100px; right: -100px; pointer-events: none;
        }

        .ol-form-wrap {
          width: 100%; max-width: 400px;
          position: relative; z-index: 2;
          animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Мобильный логотип */
        .ol-mobile-logo {
          font-family: 'Syne', sans-serif;
          font-weight: 800; font-size: 24px;
          color: #fff; letter-spacing: -1px;
          margin-bottom: 36px; display: block;
        }
        .ol-mobile-logo em { font-style: normal; color: #C3073F; }
        @media(min-width: 900px) { .ol-mobile-logo { display: none; } }

        .ol-head { margin-bottom: 32px; }
        .ol-title {
          font-family: 'Syne', sans-serif;
          font-size: 26px; font-weight: 800;
          color: #fff; letter-spacing: -0.5px; margin-bottom: 6px;
        }
        .ol-sub { font-size: 13px; color: #444; font-weight: 300; }

        /* Табы */
        .ol-tabs {
          display: flex; gap: 4px;
          background: rgba(255,255,255,0.03);
          border: 0.5px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 4px;
          margin-bottom: 28px;
        }
        .ol-tab {
          flex: 1; padding: 10px; border-radius: 9px;
          border: none; cursor: pointer;
          font-family: 'Onest', sans-serif;
          font-size: 13px; font-weight: 500;
          transition: all 0.2s;
          background: transparent; color: #555;
        }
        .ol-tab.active {
          background: rgba(195,7,63,0.12);
          color: #fff;
          border: 0.5px solid rgba(195,7,63,0.2);
        }

        /* Поля */
        .ol-field { margin-bottom: 14px; }
        .ol-label { font-size: 11px; color: #444; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; display: block; }
        .ol-input-wrap { position: relative; }
        .ol-input {
          width: 100%; padding: 14px 16px;
          background: rgba(255,255,255,0.03);
          border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 12px; color: #F0F0F0;
          font-size: 15px; font-family: 'Onest', sans-serif;
          outline: none; transition: border-color 0.2s;
        }
        .ol-input:focus { border-color: rgba(195,7,63,0.4); }
        .ol-input::placeholder { color: #333; }
        .ol-eye {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #444; font-size: 16px; padding: 4px;
        }

        /* Кнопка */
        .ol-btn {
          width: 100%; padding: 15px;
          background: #C3073F; border: none;
          border-radius: 12px; color: #fff;
          font-size: 15px; font-weight: 600;
          font-family: 'Onest', sans-serif;
          cursor: pointer; margin-top: 8px;
          transition: background 0.2s, transform 0.1s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .ol-btn:hover { background: #a8063a; }
        .ol-btn:active { transform: scale(0.98); }
        .ol-btn:disabled { background: #2a0a14; color: #555; cursor: not-allowed; }

        .ol-spin {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Разделитель */
        .ol-or {
          display: flex; align-items: center; gap: 12px;
          margin: 20px 0; color: #2a2a2a;
          font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
        }
        .ol-or::before, .ol-or::after {
          content: ''; flex: 1; height: 0.5px;
          background: rgba(255,255,255,0.05);
        }

        /* TG кнопка */
        .ol-tg-btn {
          width: 100%; padding: 14px;
          background: rgba(34,158,217,0.08);
          border: 0.5px solid rgba(34,158,217,0.2);
          border-radius: 12px; color: #229ED9;
          font-size: 14px; font-weight: 500;
          font-family: 'Onest', sans-serif;
          cursor: pointer; display: flex;
          align-items: center; justify-content: center; gap: 10px;
          transition: background 0.2s;
        }
        .ol-tg-btn:hover { background: rgba(34,158,217,0.14); }

        .ol-tg-icon {
          width: 24px; height: 24px; border-radius: 50%;
          background: #229ED9; display: flex;
          align-items: center; justify-content: center;
          flex-shrink: 0; font-size: 13px;
        }

        /* TG экран */
        .ol-tg-screen { text-align: center; padding: 8px 0; }
        .ol-tg-big { font-size: 48px; margin-bottom: 12px; }
        .ol-tg-screen h3 {
          font-family: 'Syne', sans-serif; font-size: 18px;
          font-weight: 700; color: #fff; margin-bottom: 8px;
        }
        .ol-tg-screen p { font-size: 13px; color: #444; line-height: 1.6; margin-bottom: 24px; }

        .ol-back {
          background: none; border: none; color: #444;
          font-size: 13px; cursor: pointer;
          font-family: 'Onest', sans-serif;
          margin-top: 16px; display: block; width: 100%;
          text-align: center; padding: 8px;
        }
        .ol-back:hover { color: #888; }

        .ol-footer { margin-top: 24px; text-align: center; font-size: 11px; color: #2a2a2a; line-height: 1.6; }
        .ol-footer a { color: #444; text-decoration: none; }
      `}</style>

      <div className="ol-root">
        {/* Левая декоративная панель */}
        <div className="ol-left">
          <div className="ol-left-glow" />
          <div className="ol-left-glow2" />
          <div className="ol-left-grid" />
          <div className="ol-logo">tusi<em>'m</em></div>
          <div className="ol-tagline">
            <h2>Краудсорсинг<br/>фото на твоём<br/><span>мероприятии</span></h2>
            <p>QR-код вместо фотографа.<br/>Гости снимают — альбом собирается сам.</p>
          </div>
          <div className="ol-stats">
            <div>
              <span className="ol-stat-num">500+</span>
              <span className="ol-stat-label">гостей</span>
            </div>
            <div>
              <span className="ol-stat-num">0</span>
              <span className="ol-stat-label">приложений</span>
            </div>
            <div>
              <span className="ol-stat-num">∞</span>
              <span className="ol-stat-label">фото</span>
            </div>
          </div>
        </div>

        {/* Правая панель — форма */}
        <div className="ol-right">
          <div className="ol-right-glow" />
          <div className="ol-form-wrap">
            <span className="ol-mobile-logo">tusi<em>'m</em></span>

            <div className="ol-head">
              <div className="ol-title">Кабинет организатора</div>
              <div className="ol-sub">Войди чтобы управлять событиями</div>
            </div>

            {tab !== 'tg-screen' && (
              <div className="ol-tabs">
                <button className={`ol-tab${tab === 'phone' ? ' active' : ''}`} onClick={() => setTab('phone')}>
                  📱 Телефон
                </button>
                <button className={`ol-tab${tab === 'tg' ? ' active' : ''}`} onClick={() => setTab('tg')}>
                  ✈️ Telegram
                </button>
              </div>
            )}

            {tab === 'phone' && (
              <form onSubmit={handleLogin}>
                <div className="ol-field">
                  <label className="ol-label">Телефон</label>
                  <input
                    className="ol-input"
                    type="tel"
                    placeholder="+7 999 000-00-00"
                    value={phone}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                    required
                  />
                </div>
                <div className="ol-field">
                  <label className="ol-label">Пароль</label>
                  <div className="ol-input-wrap">
                    <input
                      className="ol-input"
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ paddingRight: '44px' }}
                      required
                    />
                    <button type="button" className="ol-eye" onClick={() => setShowPass(v => !v)}>
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                <button className="ol-btn" type="submit" disabled={loading}>
                  {loading ? <span className="ol-spin" /> : 'Войти'}
                </button>
                <div className="ol-or">или</div>
                <button type="button" className="ol-tg-btn" onClick={() => setTab('tg-screen')}>
                  <div className="ol-tg-icon">✈️</div>
                  Войти через Telegram
                </button>
              </form>
            )}

            {tab === 'tg' && (
              <div>
                <div className="ol-tg-screen">
                  <div className="ol-tg-big">✈️</div>
                  <h3>Войти через Telegram</h3>
                  <p>Нажми кнопку ниже — откроется Telegram.<br/>Подтверди вход одним касанием.</p>
                </div>
                <button className="ol-btn" onClick={handleTgLogin} disabled={loading}>
                  {loading ? <span className="ol-spin" /> : <><span>Открыть Telegram</span></>}
                </button>
                <button className="ol-back" onClick={() => setTab('phone')}>← Войти по телефону</button>
              </div>
            )}

            {tab === 'tg-screen' && (
              <div>
                <div className="ol-tg-screen">
                  <div className="ol-tg-big">✈️</div>
                  <h3>Войти через Telegram</h3>
                  <p>Нажми кнопку ниже — откроется Telegram.<br/>Подтверди вход одним касанием.</p>
                </div>
                <button className="ol-btn" onClick={handleTgLogin} disabled={loading}>
                  {loading ? <span className="ol-spin" /> : 'Открыть Telegram'}
                </button>
                <button className="ol-back" onClick={() => setTab('phone')}>← Войти по телефону</button>
              </div>
            )}

            <div className="ol-footer">
              Нет аккаунта? <a href="#">Зарегистрироваться</a><br/>
              <a href="#">Забыл пароль</a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}