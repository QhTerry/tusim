'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OrganizerLogin() {
  const router = useRouter()
  const [tab, setTab] = useState('phone')
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
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ol-root {
          min-height: 100vh; min-height: 100dvh;
          background: #09090b;
          display: flex; font-family: 'Onest', sans-serif;
          color: #F0F0F0; position: relative; overflow: hidden;
        }

        /* Блобы */
        .ol-blob {
          position: fixed; border-radius: 50%;
          filter: blur(100px); pointer-events: none; z-index: 0;
        }
        .ol-blob-1 {
          width: 600px; height: 600px;
          background: rgba(195,7,63,0.1);
          top: -200px; left: -200px;
          animation: blobDrift 20s ease-in-out infinite alternate;
        }
        .ol-blob-2 {
          width: 400px; height: 400px;
          background: rgba(195,7,63,0.06);
          bottom: -100px; right: -100px;
          animation: blobDrift 26s ease-in-out infinite alternate-reverse;
        }
        @keyframes blobDrift {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(50px,60px) scale(1.12); }
        }

        /* Левая панель */
        .ol-left {
          display: none;
          width: 46%; position: relative; overflow: hidden;
          flex-direction: column; justify-content: space-between;
          padding: 52px;
          border-right: 1px solid rgba(255,255,255,0.04);
        }
        @media(min-width: 960px) { .ol-left { display: flex; } }

        .ol-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 52px 52px;
        }
        .ol-grid-fade {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, #09090b 100%);
        }

        .ol-left-logo {
          position: relative; z-index: 2;
          font-family: 'Unbounded', sans-serif; font-weight: 900;
          font-size: 26px; color: #fff; letter-spacing: -1.5px;
          text-decoration: none;
        }
        .ol-left-logo span { color: #C3073F; }

        .ol-left-mid { position: relative; z-index: 2; }
        .ol-left-mid h2 {
          font-family: 'Unbounded', sans-serif; font-size: clamp(32px,3vw,46px);
          font-weight: 900; color: #fff; letter-spacing: -2px;
          line-height: 1.08; margin-bottom: 20px;
        }
        .ol-left-mid h2 span { color: #C3073F; }
        .ol-left-mid p { font-size: 14px; color: rgba(255,255,255,0.3); line-height: 1.75; font-weight: 300; }

        .ol-left-stats { position: relative; z-index: 2; display: flex; gap: 36px; }
        .ol-stat-num {
          font-family: 'Unbounded', sans-serif; font-size: 26px;
          font-weight: 900; color: #fff; letter-spacing: -1px; display: block; margin-bottom: 4px;
        }
        .ol-stat-label { font-size: 10px; color: rgba(255,255,255,0.3); letter-spacing: 1.5px; text-transform: uppercase; }

        /* Правая панель — форма */
        .ol-right {
          flex: 1; display: flex; align-items: center;
          justify-content: center; padding: 40px 24px;
          position: relative; z-index: 1;
        }

        .ol-form-wrap {
          width: 100%; max-width: 400px;
          animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ol-mobile-logo {
          font-family: 'Unbounded', sans-serif; font-weight: 900;
          font-size: 22px; color: #fff; letter-spacing: -1.5px;
          margin-bottom: 40px; display: block; text-decoration: none;
        }
        .ol-mobile-logo span { color: #C3073F; }
        @media(min-width: 960px) { .ol-mobile-logo { display: none; } }

        .ol-head { margin-bottom: 36px; }
        .ol-title {
          font-family: 'Unbounded', sans-serif; font-size: 24px;
          font-weight: 900; color: #fff; letter-spacing: -0.8px; margin-bottom: 8px;
        }
        .ol-sub { font-size: 13px; color: rgba(255,255,255,0.3); font-weight: 300; line-height: 1.6; }

        /* Табы */
        .ol-tabs {
          display: flex; gap: 4px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px; padding: 4px; margin-bottom: 28px;
        }
        .ol-tab {
          flex: 1; padding: 11px; border-radius: 10px; border: none;
          cursor: pointer; font-family: 'Onest', sans-serif;
          font-size: 13px; font-weight: 600; transition: all 0.2s;
          background: transparent; color: rgba(255,255,255,0.3);
        }
        .ol-tab.active {
          background: rgba(195,7,63,0.15);
          color: #fff; border: 1px solid rgba(195,7,63,0.25);
        }

        /* Поля */
        .ol-field { margin-bottom: 14px; }
        .ol-label {
          font-size: 11px; color: rgba(255,255,255,0.3);
          letter-spacing: 1px; text-transform: uppercase;
          margin-bottom: 8px; display: block; font-weight: 600;
        }
        .ol-input-wrap { position: relative; }
        .ol-input {
          width: 100%; padding: 14px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; color: #F0F0F0;
          font-size: 15px; font-family: 'Onest', sans-serif;
          outline: none; transition: border-color 0.2s, background 0.2s;
          -webkit-appearance: none;
        }
        .ol-input:focus {
          border-color: rgba(195,7,63,0.5);
          background: rgba(195,7,63,0.03);
        }
        .ol-input::placeholder { color: rgba(255,255,255,0.15); }
        .ol-eye {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.3); font-size: 16px; padding: 4px;
          transition: color 0.15s;
        }
        .ol-eye:hover { color: rgba(255,255,255,0.6); }

        /* Кнопка */
        .ol-btn {
          width: 100%; padding: 15px;
          background: #C3073F; border: none;
          border-radius: 12px; color: #fff;
          font-size: 15px; font-weight: 700;
          font-family: 'Onest', sans-serif; cursor: pointer;
          margin-top: 8px; transition: transform 0.15s, box-shadow 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 24px rgba(195,7,63,0.35);
        }
        .ol-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 36px rgba(195,7,63,0.5); }
        .ol-btn:active { transform: scale(0.98); }
        .ol-btn:disabled { background: rgba(195,7,63,0.2); color: rgba(255,255,255,0.3); cursor: not-allowed; box-shadow: none; transform: none; }

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
          margin: 20px 0; font-size: 11px;
          letter-spacing: 1px; text-transform: uppercase;
          color: rgba(255,255,255,0.15);
        }
        .ol-or::before, .ol-or::after {
          content: ''; flex: 1; height: 1px;
          background: rgba(255,255,255,0.06);
        }

        /* TG кнопка */
        .ol-tg-btn {
          width: 100%; padding: 14px;
          background: rgba(34,158,217,0.06);
          border: 1px solid rgba(34,158,217,0.18);
          border-radius: 12px; color: #229ED9;
          font-size: 14px; font-weight: 600;
          font-family: 'Onest', sans-serif; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: background 0.2s, border-color 0.2s;
        }
        .ol-tg-btn:hover {
          background: rgba(34,158,217,0.1);
          border-color: rgba(34,158,217,0.3);
        }
        .ol-tg-icon {
          width: 26px; height: 26px; border-radius: 50%;
          background: #229ED9; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; font-size: 14px;
        }

        /* TG экран */
        .ol-tg-screen { text-align: center; padding: 16px 0 8px; }
        .ol-tg-big {
          width: 88px; height: 88px; border-radius: 28px;
          background: rgba(34,158,217,0.08); border: 1px solid rgba(34,158,217,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 40px; margin: 0 auto 20px;
        }
        .ol-tg-screen h3 {
          font-family: 'Unbounded', sans-serif; font-size: 18px;
          font-weight: 900; color: #fff; margin-bottom: 10px; letter-spacing: -0.5px;
        }
        .ol-tg-screen p { font-size: 13px; color: rgba(255,255,255,0.3); line-height: 1.7; margin-bottom: 28px; }

        .ol-back {
          background: none; border: none; color: rgba(255,255,255,0.25);
          font-size: 13px; cursor: pointer; font-family: 'Onest', sans-serif;
          margin-top: 14px; display: block; width: 100%;
          text-align: center; padding: 10px; transition: color 0.15s;
        }
        .ol-back:hover { color: rgba(255,255,255,0.5); }

        .ol-footer {
          margin-top: 28px; text-align: center;
          font-size: 11px; color: rgba(255,255,255,0.15); line-height: 1.8;
        }
        .ol-footer a { color: rgba(255,255,255,0.3); text-decoration: none; transition: color 0.15s; }
        .ol-footer a:hover { color: rgba(255,255,255,0.6); }

        /* Декоративные точки на левой панели */
        .ol-dot {
          position: absolute; border-radius: 50%;
          background: rgba(195,7,63,0.4);
          filter: blur(0px);
          animation: dotPulse 3s ease-in-out infinite;
        }
        @keyframes dotPulse {
          0%,100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 0.8; transform: scale(1.3); }
        }
      `}</style>

      <div className="ol-blob ol-blob-1"/>
      <div className="ol-blob ol-blob-2"/>

      <div className="ol-root">
        {/* Левая декоративная панель */}
        <div className="ol-left">
          <div className="ol-grid"/>
          <div className="ol-grid-fade"/>

          {/* Декоративные точки */}
          <div className="ol-dot" style={{width:4,height:4,top:'22%',left:'18%',animationDelay:'0s'}}/>
          <div className="ol-dot" style={{width:3,height:3,top:'45%',left:'72%',animationDelay:'1s'}}/>
          <div className="ol-dot" style={{width:5,height:5,top:'68%',left:'35%',animationDelay:'2s'}}/>
          <div className="ol-dot" style={{width:3,height:3,top:'80%',left:'60%',animationDelay:'0.5s'}}/>
          <div className="ol-dot" style={{width:4,height:4,top:'15%',left:'55%',animationDelay:'1.5s'}}/>

          <a href="/" className="ol-left-logo">tusi<span>'m</span></a>

          <div className="ol-left-mid">
            <h2>
              Краудсорсинг<br/>
              фото на твоём<br/>
              <span>мероприятии</span>
            </h2>
            <p>
              QR-код вместо фотографа.<br/>
              Гости снимают — альбом<br/>
              собирается сам.
            </p>
          </div>

          <div className="ol-left-stats">
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
          <div className="ol-form-wrap">
            <a href="/" className="ol-mobile-logo">tusi<span>'m</span></a>

            <div className="ol-head">
              <div className="ol-title">Кабинет организатора</div>
              <div className="ol-sub">Войди чтобы управлять событиями</div>
            </div>

            {tab !== 'tg-screen' && (
              <div className="ol-tabs">
                <button className={`ol-tab${tab==='phone'?' active':''}`} onClick={() => setTab('phone')}>
                  📱 Телефон
                </button>
                <button className={`ol-tab${tab==='tg'?' active':''}`} onClick={() => setTab('tg')}>
                  ✈️ Telegram
                </button>
              </div>
            )}

            {tab === 'phone' && (
              <form onSubmit={handleLogin}>
                <div className="ol-field">
                  <label className="ol-label">Телефон</label>
                  <input
                    className="ol-input" type="tel"
                    placeholder="+7 999 000-00-00"
                    value={phone} onChange={e => setPhone(formatPhone(e.target.value))}
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
                      value={password} onChange={e => setPassword(e.target.value)}
                      style={{ paddingRight: '44px' }} required
                    />
                    <button type="button" className="ol-eye" onClick={() => setShowPass(v => !v)}>
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                <button className="ol-btn" type="submit" disabled={loading}>
                  {loading ? <span className="ol-spin"/> : 'Войти →'}
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
                  {loading ? <span className="ol-spin"/> : 'Открыть Telegram'}
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
                  {loading ? <span className="ol-spin"/> : 'Открыть Telegram'}
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