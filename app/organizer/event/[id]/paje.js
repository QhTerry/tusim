'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import QRCode from 'qrcode'

const MOCK_EVENT = {
  id: '1', name: 'Свадьба Ани и Коли', code: 'WEDDING1',
  status: 'active', guests: 87, photos: 312, limit: 150, photoLimit: 30,
  plan: 'Ультра', endsAt: Date.now() + 3600000 * 4,
}

const MOCK_PHOTOS = Array.from({ length: 12 }, (_, i) => ({
  id: `p${i}`, author: ['Аня', 'Коля', 'Маша', 'Петя', 'Света'][i % 5],
  url: `https://picsum.photos/seed/${i + 10}/300/300`, votes: Math.floor(Math.random() * 20),
}))

function timeLeft(ts) {
  const diff = ts - Date.now()
  if (diff <= 0) return 'завершено'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

export default function EventPage() {
  const router = useRouter()
  const params = useParams()
  const [tab, setTab] = useState('overview') // overview | photos | qr | settings
  const [event] = useState(MOCK_EVENT)
  const [photos] = useState(MOCK_PHOTOS)
  const [timer, setTimer] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const qrRef = useRef(null)

  useEffect(() => {
    if (!localStorage.getItem('organizer_token')) { router.replace('/organizer'); return }
    const t = setInterval(() => setTimer(timeLeft(event.endsAt)), 1000)
    setTimer(timeLeft(event.endsAt))

    const eventUrl = `${window.location.origin}/event/${event.code}`
    QRCode.toDataURL(eventUrl, { width: 400, margin: 2, color: { dark: '#F0F0F0', light: '#0000' } })
      .then(setQrUrl).catch(() => {})

    return () => clearInterval(t)
  }, [])

  const pct = Math.round(event.guests / event.limit * 100)
  const eventUrl = typeof window !== 'undefined' ? `${window.location.origin}/event/${event.code}` : ''

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Onest:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ev-root { min-height:100vh; min-height:100dvh; background:#0c0c0e; font-family:'Onest',sans-serif; color:#F0F0F0; }

        .ev-header {
          position:sticky; top:0; z-index:100;
          background:rgba(12,12,14,0.92); backdrop-filter:blur(20px);
          border-bottom:0.5px solid rgba(255,255,255,0.05);
          padding:0 20px; height:60px;
          display:flex; align-items:center; justify-content:space-between; gap:12px;
        }
        .ev-header-left { display:flex; align-items:center; gap:12px; min-width:0; }
        .ev-back {
          background:none; border:none; color:#555; font-size:18px;
          cursor:pointer; flex-shrink:0; transition:color 0.15s; padding:4px;
        }
        .ev-back:hover { color:#fff; }
        .ev-name {
          font-family:'Syne',sans-serif; font-weight:700; font-size:16px;
          color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .ev-status {
          padding:3px 10px; border-radius:20px; font-size:11px; font-weight:500;
          background:rgba(34,197,94,0.1); color:#22c55e;
          border:0.5px solid rgba(34,197,94,0.2); flex-shrink:0;
        }
        .ev-timer { font-size:13px; color:#C3073F; font-weight:600; font-family:monospace; flex-shrink:0; }

        /* Табы */
        .ev-tabs {
          display:flex; gap:2px; padding:0 20px;
          border-bottom:0.5px solid rgba(255,255,255,0.05);
          background:rgba(12,12,14,0.7); overflow-x:auto;
        }
        .ev-tab {
          padding:14px 16px; background:none; border:none; border-bottom:2px solid transparent;
          color:#444; font-size:13px; font-weight:500; font-family:'Onest',sans-serif;
          cursor:pointer; white-space:nowrap; transition:all 0.15s;
        }
        .ev-tab.active { color:#fff; border-bottom-color:#C3073F; }

        .ev-body { max-width:860px; margin:0 auto; padding:28px 20px 100px; }

        /* Обзор */
        .ev-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px; }
        @media(min-width:600px) { .ev-grid { grid-template-columns:repeat(4,1fr); } }

        .ev-stat {
          background:#111114; border:0.5px solid rgba(255,255,255,0.05);
          border-radius:16px; padding:18px;
        }
        .ev-stat-val {
          font-family:'Syne',sans-serif; font-size:26px;
          font-weight:800; color:#fff; letter-spacing:-1px; display:block; margin-bottom:4px;
        }
        .ev-stat-label { font-size:11px; color:#444; text-transform:uppercase; letter-spacing:1px; }

        .ev-progress-block {
          background:#111114; border:0.5px solid rgba(255,255,255,0.05);
          border-radius:16px; padding:20px; margin-bottom:24px;
        }
        .ev-prog-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
        .ev-prog-label { font-size:13px; color:#888; }
        .ev-prog-val { font-size:13px; color:#fff; font-weight:500; }
        .ev-bar { height:6px; border-radius:3px; background:rgba(255,255,255,0.06); overflow:hidden; }
        .ev-bar-fill { height:100%; border-radius:3px; background:linear-gradient(90deg,#C3073F,#6F2232); transition:width 0.5s; }

        .ev-quick-actions { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:24px; }
        .ev-qa-btn {
          display:flex; align-items:center; gap:8px;
          padding:11px 18px; border-radius:12px;
          font-size:13px; font-weight:500; font-family:'Onest',sans-serif;
          cursor:pointer; border:none; transition:all 0.15s;
        }
        .ev-qa-btn.primary { background:#C3073F; color:#fff; }
        .ev-qa-btn.primary:hover { background:#a8063a; }
        .ev-qa-btn.secondary { background:rgba(255,255,255,0.04); border:0.5px solid rgba(255,255,255,0.08); color:#888; }
        .ev-qa-btn.secondary:hover { color:#fff; background:rgba(255,255,255,0.07); }
        .ev-qa-btn.danger { background:rgba(195,7,63,0.08); border:0.5px solid rgba(195,7,63,0.2); color:#C3073F; }
        .ev-qa-btn.danger:hover { background:rgba(195,7,63,0.15); }

        /* Топ фото */
        .ev-top-photos { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        @media(min-width:500px) { .ev-top-photos { grid-template-columns:repeat(4,1fr); } }
        .ev-photo {
          aspect-ratio:1; border-radius:12px; overflow:hidden;
          position:relative; cursor:pointer; background:#111;
        }
        .ev-photo img { width:100%; height:100%; object-fit:cover; display:block; }
        .ev-photo-overlay {
          position:absolute; inset:0; background:linear-gradient(transparent 50%,rgba(0,0,0,0.7));
          display:flex; align-items:flex-end; padding:8px;
          opacity:0; transition:opacity 0.2s;
        }
        .ev-photo:hover .ev-photo-overlay { opacity:1; }
        .ev-photo-author { font-size:10px; color:#fff; font-weight:500; }
        .ev-photo-votes { font-size:10px; color:#C3073F; margin-left:auto; }

        /* QR */
        .ev-qr-block {
          display:flex; flex-direction:column; align-items:center; gap:24px;
          padding:32px 24px; background:#111114;
          border:0.5px solid rgba(255,255,255,0.05); border-radius:24px;
        }
        .ev-qr-wrap {
          background:#1A1A1D; border-radius:20px; padding:24px;
          border:0.5px solid rgba(255,255,255,0.06);
        }
        .ev-qr-wrap img { width:200px; height:200px; display:block; }
        .ev-qr-url {
          font-size:13px; color:#444; text-align:center;
          word-break:break-all; max-width:300px; line-height:1.5;
        }
        .ev-qr-url span { color:#C3073F; font-weight:600; }
        .ev-qr-actions { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; }

        /* Настройки */
        .ev-settings { display:flex; flex-direction:column; gap:16px; }
        .ev-setting-row {
          display:flex; align-items:center; justify-content:space-between;
          padding:18px 20px; background:#111114;
          border:0.5px solid rgba(255,255,255,0.05); border-radius:16px; gap:12px;
        }
        .ev-setting-info { flex:1; min-width:0; }
        .ev-setting-name { font-size:14px; font-weight:500; color:#fff; margin-bottom:3px; }
        .ev-setting-sub { font-size:12px; color:#444; }
        .ev-toggle {
          width:44px; height:26px; border-radius:13px;
          border:none; cursor:pointer; position:relative; transition:background 0.2s; flex-shrink:0;
        }
        .ev-toggle.on { background:#C3073F; }
        .ev-toggle.off { background:rgba(255,255,255,0.1); }
        .ev-toggle::after {
          content:''; position:absolute; width:20px; height:20px;
          border-radius:50%; background:#fff; top:3px; transition:left 0.2s;
        }
        .ev-toggle.on::after { left:21px; }
        .ev-toggle.off::after { left:3px; }

        .ev-section-title {
          font-family:'Syne',sans-serif; font-size:16px;
          font-weight:700; color:#fff; margin-bottom:14px; margin-top:28px;
        }
        .ev-section-title:first-child { margin-top:0; }

        /* Фото грид */
        .ev-photos-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        @media(min-width:500px) { .ev-photos-grid { grid-template-columns:repeat(4,1fr); } }
        @media(min-width:700px) { .ev-photos-grid { grid-template-columns:repeat(5,1fr); } }
      `}</style>

      <div className="ev-root">
        <header className="ev-header">
          <div className="ev-header-left">
            <button className="ev-back" onClick={() => router.push('/organizer/dashboard')}>←</button>
            <span className="ev-name">{event.name}</span>
            <span className="ev-status">● Активно</span>
          </div>
          <span className="ev-timer">{timer}</span>
        </header>

        <div className="ev-tabs">
          {[
            { id:'overview', label:'📊 Обзор' },
            { id:'photos', label:'📸 Фото' },
            { id:'qr', label:'🔗 QR-код' },
            { id:'settings', label:'⚙️ Настройки' },
          ].map(t => (
            <button key={t.id} className={`ev-tab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="ev-body">

          {/* ОБЗОР */}
          {tab === 'overview' && (
            <>
              <div className="ev-grid">
                {[
                  { val: event.guests, label: 'Гостей' },
                  { val: event.photos, label: 'Фото' },
                  { val: Math.round(event.photos / Math.max(event.guests,1)), label: 'Фото/гость' },
                  { val: event.plan, label: 'Тариф', small: true },
                ].map((s, i) => (
                  <div key={i} className="ev-stat">
                    <span className="ev-stat-val" style={s.small ? {fontSize:16,marginTop:4}:{}}>{s.val}</span>
                    <span className="ev-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>

              <div className="ev-progress-block">
                <div className="ev-prog-head">
                  <span className="ev-prog-label">Заполненность</span>
                  <span className="ev-prog-val">{event.guests} / {event.limit} гостей</span>
                </div>
                <div className="ev-bar">
                  <div className="ev-bar-fill" style={{ width:`${pct}%` }} />
                </div>
                <div style={{fontSize:11,color:'#444',marginTop:8}}>{pct}% заполнено</div>
              </div>

              <div className="ev-quick-actions">
                <button className="ev-qa-btn primary" onClick={() => setTab('qr')}>🔗 Показать QR</button>
                <button className="ev-qa-btn secondary" onClick={() => router.push(`/album?event_id=${event.id}`)}>📸 Открыть альбом</button>
                <button className="ev-qa-btn secondary">+ Продлить</button>
                <button className="ev-qa-btn danger">Закрыть событие</button>
              </div>

              <div className="ev-section-title">Последние фото</div>
              <div className="ev-top-photos">
                {photos.slice(0,8).map(p => (
                  <div key={p.id} className="ev-photo">
                    <img src={p.url} alt="" loading="lazy" />
                    <div className="ev-photo-overlay">
                      <span className="ev-photo-author">{p.author}</span>
                      <span className="ev-photo-votes">❤️ {p.votes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ФОТО */}
          {tab === 'photos' && (
            <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12}}>
                <div style={{fontSize:14,color:'#888'}}>{event.photos} фото от {event.guests} гостей</div>
                <button className="ev-qa-btn secondary">⬇️ Скачать всё ZIP</button>
              </div>
              <div className="ev-photos-grid">
                {photos.map(p => (
                  <div key={p.id} className="ev-photo">
                    <img src={p.url} alt="" loading="lazy" />
                    <div className="ev-photo-overlay">
                      <span className="ev-photo-author">{p.author}</span>
                      <span className="ev-photo-votes">❤️ {p.votes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* QR */}
          {tab === 'qr' && (
            <div className="ev-qr-block">
              <div style={{textAlign:'center'}}>
                <div className="ev-section-title" style={{marginBottom:4}}>QR-код события</div>
                <div style={{fontSize:13,color:'#444'}}>Распечатай и размести на мероприятии</div>
              </div>
              <div className="ev-qr-wrap">
                {qrUrl
                  ? <img src={qrUrl} alt="QR код" />
                  : <div style={{width:200,height:200,display:'flex',alignItems:'center',justifyContent:'center',color:'#444'}}>Загрузка...</div>
                }
              </div>
              <div className="ev-qr-url">
                {eventUrl.replace('https://','')} · код <span>{event.code}</span>
              </div>
              <div className="ev-qr-actions">
                <button className="ev-qa-btn primary" onClick={() => {
                  const a = document.createElement('a'); a.download = `qr_${event.code}.png`; a.href = qrUrl; a.click()
                }}>⬇️ Скачать PNG</button>
                <button className="ev-qa-btn secondary" onClick={() => navigator.clipboard?.writeText(eventUrl)}>
                  📋 Скопировать ссылку
                </button>
              </div>
            </div>
          )}

          {/* НАСТРОЙКИ */}
          {tab === 'settings' && (
            <div className="ev-settings">
              <div className="ev-section-title">Настройки события</div>
              {[
                { name: 'Приём фото', sub: 'Гости могут загружать фото', on: true },
                { name: 'Новые гости', sub: 'Разрешить новым гостям входить', on: true },
                { name: 'Реакции', sub: 'Гости могут ставить реакции', on: true },
                { name: 'Альбом публичный', sub: 'Альбом виден без входа', on: false },
              ].map((s, i) => (
                <div key={i} className="ev-setting-row">
                  <div className="ev-setting-info">
                    <div className="ev-setting-name">{s.name}</div>
                    <div className="ev-setting-sub">{s.sub}</div>
                  </div>
                  <button className={`ev-toggle${s.on?' on':' off'}`} />
                </div>
              ))}

              <div className="ev-section-title" style={{marginTop:32}}>Опасная зона</div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                <button className="ev-qa-btn secondary">+ Продлить на 1 час</button>
                <button className="ev-qa-btn secondary">+ Продлить на 2 часа</button>
                <button className="ev-qa-btn danger">Закрыть событие</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}