'use client'
import { useEffect, useState } from 'react'

export default function Home() {
  const [formData, setFormData] = useState({ name: '', contact: '', type: '' })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const handleSubmit = (e) => { e.preventDefault(); setSubmitted(true) }

  const checkSvg = (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <path d="M1.5 4l2 2 3-3" stroke="#C3073F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=Onest:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0c0c0e !important; color: #fff; font-family: 'Onest', sans-serif; overflow-x: hidden; padding-bottom: 0 !important; }

        .noise { position: fixed; inset: 0; z-index: 1; pointer-events: none; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E"); opacity: 0.5; }
        .blob-wrap { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .blob { position: absolute; border-radius: 50%; filter: blur(100px); animation: drift 20s ease-in-out infinite; }
        .blob-1 { width: 600px; height: 600px; background: rgba(195,7,63,0.10); top: -200px; left: -200px; }
        .blob-2 { width: 400px; height: 400px; background: rgba(195,7,63,0.07); top: 40vh; right: -150px; animation-delay: -7s; }
        .blob-3 { width: 500px; height: 500px; background: rgba(195,7,63,0.05); bottom: -100px; left: 30%; animation-delay: -14s; }
        @keyframes drift { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(30px,-40px) scale(1.05);} 66%{transform:translate(-20px,30px) scale(0.97);} }

        .wrap { position: relative; z-index: 2; max-width: 1100px; margin: 0 auto; padding: 0 40px; }

        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 0 40px; height: 64px; display: flex; align-items: center; justify-content: space-between; background: rgba(12,12,14,0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .nav-logo { font-family: 'Unbounded', sans-serif; font-size: 20px; font-weight: 700; color: #fff; text-decoration: none; letter-spacing: -0.5px; }
        .nav-logo em { color: #C3073F; font-style: normal; }
        .nav-right { display: flex; align-items: center; gap: 8px; }
        .nav-login { font-size: 13px; color: rgba(255,255,255,0.4); background: none; border: none; cursor: pointer; font-family: 'Onest', sans-serif; padding: 8px 14px; border-radius: 8px; transition: color .2s, background .2s; }
        .nav-login:hover { color: #fff; background: rgba(255,255,255,0.05); }
        .nav-cta { font-size: 13px; font-weight: 600; font-family: 'Onest', sans-serif; color: #fff; background: #C3073F; border: none; border-radius: 10px; padding: 9px 20px; cursor: pointer; box-shadow: 0 0 20px rgba(195,7,63,0.3); transition: transform .15s, box-shadow .15s; }
        .nav-cta:hover { transform: translateY(-1px); box-shadow: 0 0 32px rgba(195,7,63,0.5); }

        .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 120px 40px 80px; position: relative; z-index: 2; }
        .hero-tag { display: inline-flex; align-items: center; gap: 8px; background: rgba(195,7,63,0.08); border: 1px solid rgba(195,7,63,0.25); border-radius: 100px; padding: 6px 16px; font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.6); margin-bottom: 40px; animation: fadeUp .6s ease both; }
        .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #C3073F; animation: pulse 2s infinite; flex-shrink: 0; }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.2;} }

        .hero-h1 { font-family: 'Unbounded', sans-serif; font-size: clamp(38px,5.5vw,68px); font-weight: 900; line-height: 1.08; letter-spacing: -3px; max-width: 800px; margin-bottom: 28px; animation: fadeUp .7s .1s ease both; }
        .line2 { color: #C3073F; display: block; }
        .line3 { color: rgba(255,255,255,.2); font-weight: 400; display: block; }
        .hero-sub { font-size: 16px; line-height: 1.75; font-weight: 300; color: rgba(255,255,255,.42); max-width: 400px; margin-bottom: 48px; animation: fadeUp .7s .2s ease both; }
        .hero-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; animation: fadeUp .7s .3s ease both; margin-bottom: 64px; }

        .btn-red { background: #C3073F; color: #fff; border: none; border-radius: 14px; padding: 16px 36px; font-size: 15px; font-weight: 600; font-family: 'Onest', sans-serif; cursor: pointer; box-shadow: 0 4px 24px rgba(195,7,63,.4); transition: transform .15s, box-shadow .15s; }
        .btn-red:hover { transform: translateY(-2px); box-shadow: 0 8px 40px rgba(195,7,63,.55); }
        .btn-ghost { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12); color: rgba(255,255,255,.65); border-radius: 14px; padding: 16px 30px; font-size: 15px; font-weight: 500; font-family: 'Onest', sans-serif; cursor: pointer; transition: background .2s, transform .15s, color .2s; }
        .btn-ghost:hover { background: rgba(255,255,255,.09); transform: translateY(-2px); color: #fff; }

        .stats { display: flex; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07); border-radius: 20px; overflow: hidden; animation: fadeUp .7s .4s ease both; width: 100%; max-width: 520px; }
        .stat { flex: 1; padding: 20px 24px; text-align: center; border-right: 1px solid rgba(255,255,255,.07); }
        .stat:last-child { border-right: none; }
        .stat-num { font-family: 'Unbounded', sans-serif; font-size: 24px; font-weight: 900; display: block; margin-bottom: 4px; }
        .stat-label { font-size: 11px; color: rgba(255,255,255,.3); font-weight: 300; }

        .reveal { opacity: 0; transform: translateY(28px); transition: opacity .7s ease, transform .7s ease; }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .d1 { transition-delay: .05s; } .d2 { transition-delay: .15s; } .d3 { transition-delay: .25s; }

        .section { padding: 96px 0; position: relative; z-index: 2; }
        .sec-tag { text-align: center; font-size: 10px; font-weight: 600; letter-spacing: 4px; text-transform: uppercase; color: rgba(195,7,63,.7); margin-bottom: 52px; display: flex; align-items: center; justify-content: center; gap: 14px; }
        .sec-tag::before, .sec-tag::after { content: ''; flex: 1; max-width: 80px; height: 1px; }
        .sec-tag::before { background: linear-gradient(90deg, transparent, rgba(195,7,63,.35)); }
        .sec-tag::after { background: linear-gradient(90deg, rgba(195,7,63,.35), transparent); }

        .steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .step { background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.07); border-radius: 24px; padding: 36px 28px; position: relative; overflow: hidden; transition: border-color .3s, transform .25s, background .3s; }
        .step:hover { border-color: rgba(195,7,63,.35); background: rgba(195,7,63,.04); transform: translateY(-4px); }
        .step::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg,transparent,#C3073F,transparent); opacity: 0; transition: opacity .3s; }
        .step:hover::after { opacity: .5; }
        .step-num { font-family: 'Unbounded', sans-serif; font-size: 48px; font-weight: 900; color: #C3073F; opacity: .35; line-height: 1; margin-bottom: 20px; }
        .step-title { font-family: 'Unbounded', sans-serif; font-size: 13px; font-weight: 700; margin-bottom: 12px; }
        .step-desc { font-size: 13px; color: rgba(255,255,255,.38); line-height: 1.7; font-weight: 300; }

        .feats { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px; }
        .feat { background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.06); border-radius: 22px; padding: 28px; display: flex; gap: 20px; align-items: flex-start; transition: border-color .3s, transform .25s; }
        .feat:hover { border-color: rgba(195,7,63,.2); transform: translateY(-3px); }
        .feat-icon { width: 48px; height: 48px; flex-shrink: 0; border-radius: 14px; background: rgba(195,7,63,.1); border: 1px solid rgba(195,7,63,.18); display: flex; align-items: center; justify-content: center; }
        .feat-title { font-family: 'Unbounded', sans-serif; font-size: 12px; font-weight: 700; margin-bottom: 8px; }
        .feat-text { font-size: 13px; color: rgba(255,255,255,.36); line-height: 1.7; font-weight: 300; }

        .who-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 12px; }
        .who-card { background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.07); border-radius: 20px; padding: 28px 16px; text-align: center; transition: border-color .3s, transform .25s, background .3s; }
        .who-card:hover { border-color: rgba(195,7,63,.3); background: rgba(195,7,63,.05); transform: translateY(-4px); }
        .who-emoji { font-size: 32px; display: block; margin-bottom: 12px; }
        .who-label { font-family: 'Unbounded', sans-serif; font-size: 10px; font-weight: 600; color: rgba(255,255,255,.55); }

        .onb-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .onb-card { background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.07); border-radius: 24px; padding: 36px 24px 28px; text-align: center; position: relative; overflow: hidden; transition: border-color .3s, transform .25s; }
        .onb-card:hover { border-color: rgba(195,7,63,.28); transform: translateY(-4px); }
        .onb-card::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% -10%,rgba(195,7,63,.1),transparent 65%); pointer-events: none; }
        .onb-dots { display: flex; gap: 6px; justify-content: center; margin-bottom: 24px; position: relative; z-index: 1; }
        .onb-dot-on { width: 28px; height: 4px; border-radius: 2px; background: #C3073F; }
        .onb-dot-off { width: 16px; height: 4px; border-radius: 2px; background: rgba(255,255,255,.12); }
        .onb-icon { width: 80px; height: 80px; border-radius: 24px; background: rgba(195,7,63,.1); border: 1px solid rgba(195,7,63,.2); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; position: relative; z-index: 1; }
        .onb-step { font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: rgba(195,7,63,.7); margin-bottom: 10px; position: relative; z-index: 1; }
        .onb-title { font-family: 'Unbounded', sans-serif; font-size: 15px; font-weight: 700; margin-bottom: 12px; line-height: 1.3; letter-spacing: -.3px; position: relative; z-index: 1; }
        .onb-desc { font-size: 13px; color: rgba(255,255,255,.38); line-height: 1.7; font-weight: 300; margin-bottom: 28px; position: relative; z-index: 1; }
        .onb-btn { width: 100%; background: #C3073F; color: #fff; border: none; border-radius: 14px; padding: 14px; font-size: 14px; font-family: 'Onest', sans-serif; font-weight: 700; cursor: pointer; box-shadow: 0 4px 20px rgba(195,7,63,.3); transition: opacity .15s, transform .15s; position: relative; z-index: 1; }
        .onb-btn:hover { opacity: .88; transform: translateY(-1px); }
        .onb-skip { display: block; margin-top: 12px; font-size: 12px; color: rgba(255,255,255,.2); cursor: pointer; position: relative; z-index: 1; transition: color .2s; }
        .onb-skip:hover { color: rgba(255,255,255,.4); }

        .red-line { height: 1px; background: linear-gradient(90deg,transparent,rgba(195,7,63,.25),transparent); position: relative; z-index: 2; }

        .price-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
        .price-card { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07); border-radius: 24px; padding: 32px 26px; position: relative; transition: transform .25s; }
        .price-card:hover { transform: translateY(-4px); }
        .price-card.hot { border-color: rgba(195,7,63,.45); background: rgba(195,7,63,.05); box-shadow: 0 0 60px rgba(195,7,63,.08); }
        .price-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #C3073F; color: #fff; font-family: 'Unbounded', sans-serif; font-size: 10px; font-weight: 700; padding: 4px 18px; border-radius: 100px; box-shadow: 0 4px 16px rgba(195,7,63,.4); white-space: nowrap; }
        .price-tier { font-size: 10px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,.3); margin-bottom: 18px; }
        .price-amount { font-family: 'Unbounded', sans-serif; font-size: 40px; font-weight: 900; letter-spacing: -1px; margin-bottom: 4px; }
        .price-amount sup { font-size: 18px; vertical-align: top; margin-top: 10px; display: inline-block; font-weight: 400; }
        .price-note { font-size: 12px; color: rgba(255,255,255,.3); margin-bottom: 24px; font-weight: 300; }
        .price-sep { height: 1px; background: rgba(255,255,255,.07); margin-bottom: 20px; }
        .price-list { list-style: none; margin-bottom: 28px; }
        .price-list li { font-size: 13px; color: rgba(255,255,255,.5); font-weight: 300; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,.04); display: flex; align-items: center; gap: 10px; }
        .price-check { width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; background: rgba(195,7,63,.15); display: flex; align-items: center; justify-content: center; }
        .price-btn { width: 100%; padding: 13px; border-radius: 12px; font-size: 14px; font-weight: 700; font-family: 'Onest', sans-serif; cursor: pointer; transition: opacity .15s, transform .15s; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); color: rgba(255,255,255,.75); }
        .price-card.hot .price-btn { background: #C3073F; color: #fff; border: none; box-shadow: 0 4px 20px rgba(195,7,63,.35); }
        .price-btn:hover { opacity: .85; transform: translateY(-1px); }

        .cta-box { max-width: 600px; margin: 0 auto; background: rgba(195,7,63,.05); border: 1px solid rgba(195,7,63,.15); border-radius: 32px; padding: 60px 48px; position: relative; overflow: hidden; text-align: center; }
        .cta-box::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% -10%,rgba(195,7,63,.2),transparent 60%); pointer-events: none; }
        .cta-h2 { font-family: 'Unbounded', sans-serif; font-size: 28px; font-weight: 900; letter-spacing: -.8px; margin-bottom: 12px; position: relative; z-index: 1; }
        .cta-sub { font-size: 15px; color: rgba(255,255,255,.4); font-weight: 300; line-height: 1.6; margin-bottom: 40px; position: relative; z-index: 1; }
        .cta-form { max-width: 360px; margin: 0 auto; position: relative; z-index: 1; }
        .cta-input { width: 100%; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: 14px 18px; color: #fff; font-size: 14px; font-family: 'Onest', sans-serif; outline: none; margin-bottom: 10px; transition: border-color .2s, background .2s; }
        .cta-input:focus { border-color: rgba(195,7,63,.5); background: rgba(255,255,255,.08); }
        .cta-input::placeholder { color: rgba(255,255,255,.2); }
        .cta-submit { width: 100%; background: #C3073F; color: #fff; border: none; border-radius: 12px; padding: 16px; font-size: 15px; font-family: 'Onest', sans-serif; font-weight: 700; cursor: pointer; box-shadow: 0 4px 28px rgba(195,7,63,.4); transition: transform .15s, box-shadow .15s; margin-top: 4px; }
        .cta-submit:hover { transform: translateY(-2px); box-shadow: 0 8px 44px rgba(195,7,63,.6); }
        .cta-note { font-size: 12px; color: rgba(255,255,255,.2); margin-top: 14px; font-weight: 300; }
        .cta-success { font-family: 'Unbounded', sans-serif; font-size: 20px; font-weight: 700; padding: 40px 0; position: relative; z-index: 1; line-height: 1.5; }
        .cta-success span { color: #C3073F; }

        .footer { position: relative; z-index: 2; padding: 24px 40px; border-top: 1px solid rgba(255,255,255,.05); display: flex; align-items: center; justify-content: space-between; }
        .footer-logo { font-family: 'Unbounded', sans-serif; font-size: 16px; font-weight: 700; color: rgba(255,255,255,.25); }
        .footer-logo em { color: rgba(195,7,63,.5); font-style: normal; }
        .footer-text { font-size: 11px; color: rgba(255,255,255,.18); font-weight: 300; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(24px);} to{opacity:1;transform:translateY(0);} }

        @media (max-width: 768px) {
          .wrap { padding: 0 20px; } .nav { padding: 0 20px; }
          .hero { padding: 100px 20px 60px; }
          .hero-h1 { font-size: clamp(32px,9vw,48px); letter-spacing: -2px; }
          .steps, .onb-grid, .price-grid { grid-template-columns: 1fr; }
          .feats { grid-template-columns: 1fr; }
          .who-grid { grid-template-columns: repeat(3,1fr); }
          .section { padding: 64px 0; }
          .stats { flex-direction: column; }
          .stat { border-right: none; border-bottom: 1px solid rgba(255,255,255,.07); }
          .stat:last-child { border-bottom: none; }
          .cta-box { padding: 40px 24px; border-radius: 24px; }
          .footer { flex-direction: column; gap: 8px; text-align: center; padding: 20px; }
        }
      `}</style>

      <div className="noise" />
      <div className="blob-wrap">
        <div className="blob blob-1" /><div className="blob blob-2" /><div className="blob blob-3" />
      </div>

      <nav className="nav">
        <a href="/" className="nav-logo">tusi<em>&apos;</em>m</a>
        <div className="nav-right">
          <button className="nav-login">Войти</button>
          <button className="nav-cta">Попробовать →</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-tag"><span className="pulse-dot" />Краудсорсинг фото на мероприятиях</div>
        <h1 className="hero-h1">Все фото гостей<span className="line2">в одном альбоме</span><span className="line3">без фотографа</span></h1>
        <p className="hero-sub">QR-код вместо найма. Гости снимают сами — альбом собирается в реальном времени прямо на вашем событии.</p>
        <div className="hero-btns">
          <button className="btn-red">Выбрать тариф</button>
          <button className="btn-ghost">Как это работает →</button>
        </div>
        <div className="stats">
          <div className="stat"><span className="stat-num">500+</span><span className="stat-label">событий</span></div>
          <div className="stat"><span className="stat-num">20 000+</span><span className="stat-label">фото собрано</span></div>
          <div className="stat"><span className="stat-num">0</span><span className="stat-label">приложений</span></div>
        </div>
      </section>

      <div className="red-line" />

      <section className="section">
        <div className="wrap">
          <div className="sec-tag reveal">Как это работает</div>
          <div className="steps">
            {[
              {n:'01',t:'Создаёте событие',d:'Выбираете тариф, задаёте лимит кадров — получаете уникальный QR-код за минуту'},
              {n:'02',t:'Гости снимают',d:'Сканируют QR телефоном и фотографируют прямо в браузере — без скачивания приложений'},
              {n:'03',t:'Альбом готов',d:'Все кадры в одном альбоме. Голосование свайпом, реакции, скачать архив — всё сразу'},
            ].map((s,i) => (
              <div key={s.n} className={`step reveal d${i+1}`}>
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.t}</div>
                <div className="step-desc">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="red-line" />

      <section className="section">
        <div className="wrap">
          <div className="sec-tag reveal">Почему tusi&apos;m</div>
          <div className="feats">
            {[
              {title:'Лимит кадров',text:'Гости снимают осознанно — 200 живых моментов вместо 2000 случайных размытых кадров',icon:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="7" stroke="#C3073F" strokeWidth="1.6"/><path d="M11 7.5V11l2.5 1.8" stroke="#C3073F" strokeWidth="1.5" strokeLinecap="round"/></svg>},
              {title:'Свайп-голосование',text:'Гости листают фото как на сайтах знакомств — вправо огонь, влево пропустить. Вы понимаете как работают свайпы 😉',icon:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 19s-8-5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6-8 11-8 11z" stroke="#C3073F" strokeWidth="1.5" strokeLinejoin="round"/></svg>},
              {title:'Без приложений',text:'Работает в браузере любого смартфона. Гость сканирует QR — и сразу снимает. Никаких загрузок',icon:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="5" y="2" width="12" height="18" rx="2.5" stroke="#C3073F" strokeWidth="1.5"/><circle cx="11" cy="16.5" r="1" fill="#C3073F"/><path d="M8 5.5h6" stroke="#C3073F" strokeWidth="1.3" strokeLinecap="round"/></svg>},
              {title:'Оплата картами РФ',text:'Полностью на русском. Российский хостинг и поддержка карт Мир, Visa, Mastercard',icon:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="6" width="18" height="13" rx="2.5" stroke="#C3073F" strokeWidth="1.5"/><path d="M2 10h18" stroke="#C3073F" strokeWidth="1.5"/><path d="M6 14h4" stroke="#C3073F" strokeWidth="1.3" strokeLinecap="round"/></svg>},
            ].map((f,i) => (
              <div key={f.title} className={`feat reveal d${(i%2)+1}`}>
                <div className="feat-icon">{f.icon}</div>
                <div><div className="feat-title">{f.title}</div><div className="feat-text">{f.text}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="red-line" />

      <section className="section">
        <div className="wrap">
          <div className="sec-tag reveal">Для кого</div>
          <div className="who-grid">
            {[['💍','Свадьбы'],['🏢','Корпоративы'],['🎂','Дни рождения'],['🎓','Выпускные'],['🎉','Тусовки']].map(([e,l],i) => (
              <div key={l} className={`who-card reveal d${Math.min(i+1,3)}`}>
                <span className="who-emoji">{e}</span>
                <div className="who-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="red-line" />

      <section className="section">
        <div className="wrap">
          <div className="sec-tag reveal">Что видят ваши гости</div>
          <div className="onb-grid">
            {[
              {dots:['on','off','off'],step:'ШАГ 1',title:'Снимай лучшие моменты',desc:'У тебя ограниченное количество кадров — используй осознанно. Выбирай только лучшие!',btn:'Дальше →',
                svg:<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><rect x="4" y="9" width="28" height="20" rx="4" fill="rgba(195,7,63,0.15)" stroke="#C3073F" strokeWidth="1.5"/><circle cx="18" cy="19" r="6" stroke="#C3073F" strokeWidth="1.5"/><circle cx="18" cy="19" r="2.5" fill="#C3073F" opacity=".7"/><rect x="13" y="7" width="10" height="4" rx="1.5" fill="rgba(195,7,63,0.3)" stroke="#C3073F" strokeWidth="1"/><circle cx="27" cy="13" r="1.5" fill="#C3073F" opacity=".5"/></svg>},
              {dots:['off','on','off'],step:'ШАГ 2',title:'Голосуй за фото',desc:'Свайпай вправо если фото огонь, влево — если нет. Лучшие фото победят!',btn:'Дальше →',
                svg:<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M18 30C18 30 6 22 6 13a7 7 0 0 1 12-4.9A7 7 0 0 1 30 13c0 9-12 17-12 17z" fill="rgba(195,7,63,0.2)" stroke="#C3073F" strokeWidth="1.5"/><path d="M13 13l2.5 2.5L22 9" stroke="#C3073F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>},
              {dots:['off','off','on'],step:'ШАГ 3',title:'Общий альбом',desc:'Все фото в одном альбоме в реальном времени. Смотри что снимают другие гости!',btn:'Поехали! 🎉',
                svg:<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><rect x="5" y="7" width="26" height="22" rx="4" fill="rgba(195,7,63,0.12)" stroke="#C3073F" strokeWidth="1.5"/><rect x="10" y="12" width="10" height="8" rx="2" fill="rgba(195,7,63,0.25)" stroke="#C3073F" strokeWidth="1"/><path d="M22 14h5M22 17h3M22 20h4" stroke="#C3073F" strokeWidth="1.2" strokeLinecap="round" opacity=".6"/><circle cx="27" cy="27" r="5" fill="#C3073F"/><path d="M25 27l1.5 1.5 2.5-2.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>},
            ].map((c,i) => (
              <div key={c.step} className={`onb-card reveal d${i+1}`}>
                <div className="onb-dots">{c.dots.map((d,j)=><div key={j} className={d==='on'?'onb-dot-on':'onb-dot-off'}/>)}</div>
                <div className="onb-icon">{c.svg}</div>
                <div className="onb-step">{c.step}</div>
                <div className="onb-title">{c.title}</div>
                <div className="onb-desc">{c.desc}</div>
                <button className="onb-btn">{c.btn}</button>
                <span className="onb-skip">Пропустить</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="red-line" />

      <section className="section">
        <div className="wrap">
          <div className="sec-tag reveal">Тарифы</div>
          <div className="price-grid">
            {[
              {name:'Старт',price:'990',features:['До 50 гостей','5 фото на гостя','Альбом 7 дней','QR-код'],hot:false},
              {name:'Праздник',price:'1 990',features:['До 150 гостей','10 фото на гостя','Альбом 30 дней','Свайп-голосование'],hot:true},
              {name:'Про',price:'3 490',features:['Безлимит гостей','20 фото на гостя','Альбом 90 дней','Скачать ZIP-архив'],hot:false},
            ].map((p,i) => (
              <div key={p.name} className={`price-card${p.hot?' hot':''} reveal d${i+1}`}>
                {p.hot&&<div className="price-badge">Популярный</div>}
                <div className="price-tier">{p.name}</div>
                <div className="price-amount"><sup>₽</sup>{p.price}</div>
                <div className="price-note">одно событие</div>
                <div className="price-sep"/>
                <ul className="price-list">
                  {p.features.map(f=><li key={f}><span className="price-check">{checkSvg}</span>{f}</li>)}
                </ul>
                <button className="price-btn">Выбрать</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="red-line" />

      <section className="section">
        <div className="wrap">
          <div className="cta-box reveal">
            {submitted ? (
              <div className="cta-success">Заявка принята! 🎉<br/><span>Ответим в течение 2 часов</span></div>
            ) : (
              <>
                <h2 className="cta-h2">Готовите мероприятие?</h2>
                <p className="cta-sub">Оставьте заявку — пришлём QR-код и инструкцию в течение 2 часов</p>
                <form className="cta-form" onSubmit={handleSubmit}>
                  <input className="cta-input" placeholder="Ваше имя" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} required/>
                  <input className="cta-input" placeholder="Email или Telegram" value={formData.contact} onChange={e=>setFormData({...formData,contact:e.target.value})} required/>
                  <input className="cta-input" placeholder="Тип события (свадьба, корпоратив...)" value={formData.type} onChange={e=>setFormData({...formData,type:e.target.value})}/>
                  <button type="submit" className="cta-submit">Оставить заявку</button>
                  <p className="cta-note">Без спама. Только по делу.</p>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-logo">tusi<em>&apos;</em>m</div>
        <div className="footer-text">© 2025 · Российский сервис · Хостинг в РФ</div>
      </footer>
    </>
  )
}