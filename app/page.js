import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>tusi'm — все фото гостей в одном альбоме</title>
        <meta name="description" content="QR-код вместо фотографа. Гости снимают сами — альбом собирается в реальном времени." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=Onest:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0f0f11; color: #fff; font-family: 'Onest', sans-serif; overflow-x: hidden; }

        /* ── BLOBS ── */
        .blob { position: absolute; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0; }
        .blob1 { width: 520px; height: 520px; background: rgba(195,7,63,0.14); top: -160px; left: -160px; }
        .blob2 { width: 340px; height: 340px; background: rgba(195,7,63,0.08); top: 320px; right: -120px; }
        .blob3 { width: 400px; height: 400px; background: rgba(195,7,63,0.07); bottom: -100px; left: 50%; transform: translateX(-50%); }

        /* ── NAV ── */
        .nav {
          display: flex; justify-content: space-between; align-items: center;
          padding: 22px 48px;
          position: sticky; top: 0; z-index: 100;
          border-bottom: 0.5px solid rgba(255,255,255,0.06);
          background: rgba(15,15,17,0.85);
          backdrop-filter: blur(16px);
        }
        .logo { font-family: 'Unbounded', sans-serif; font-size: 22px; font-weight: 700; color: #fff; letter-spacing: -0.5px; text-decoration: none; }
        .logo em { color: #C3073F; font-style: normal; }
        .nav-right { display: flex; gap: 14px; align-items: center; }
        .nav-link { font-size: 13px; color: rgba(255,255,255,0.38); cursor: pointer; background: none; border: none; font-family: 'Onest', sans-serif; transition: color .2s; }
        .nav-link:hover { color: #fff; }
        .nav-cta {
          background: #C3073F; color: #fff; border: none;
          border-radius: 10px; padding: 10px 22px;
          font-size: 13px; font-family: 'Onest', sans-serif; font-weight: 600;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(195,7,63,0.3);
          transition: transform .15s, box-shadow .15s;
        }
        .nav-cta:hover { transform: translateY(-1px); box-shadow: 0 0 32px rgba(195,7,63,0.5); }

        /* ── HERO ── */
        .hero-wrap { position: relative; overflow: hidden; }
        .hero {
          padding: 96px 48px 72px;
          text-align: center;
          position: relative; z-index: 2;
        }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          border: 0.5px solid rgba(195,7,63,0.35);
          background: rgba(195,7,63,0.07);
          border-radius: 30px; padding: 6px 16px;
          font-size: 12px; color: rgba(255,255,255,0.6);
          margin-bottom: 36px; font-weight: 400;
        }
        .pulse-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #C3073F;
          animation: blink 2s infinite;
        }
        @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:.2;} }

        .hero h1 {
          font-family: 'Unbounded', sans-serif;
          font-size: clamp(36px, 5vw, 56px);
          font-weight: 900;
          line-height: 1.1; letter-spacing: -2px;
          max-width: 660px; margin: 0 auto 28px;
        }
        .hero h1 .red { color: #C3073F; }
        .hero h1 .dim { color: rgba(255,255,255,0.25); font-weight: 400; }
        .hero-sub {
          font-size: 16px; line-height: 1.75;
          color: rgba(255,255,255,0.42);
          max-width: 380px; margin: 0 auto 48px; font-weight: 300;
        }
        .hero-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

        /* ── BUTTONS ── */
        .btn-primary {
          background: #C3073F; color: #fff; border: none;
          border-radius: 14px; padding: 16px 36px;
          font-size: 15px; font-family: 'Onest', sans-serif; font-weight: 600;
          cursor: pointer;
          box-shadow: 0 0 36px rgba(195,7,63,0.4);
          transition: transform .15s, box-shadow .15s;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 52px rgba(195,7,63,0.6); }
        .btn-ghost {
          background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.65);
          border: 0.5px solid rgba(255,255,255,0.13);
          border-radius: 14px; padding: 16px 30px;
          font-size: 15px; font-family: 'Onest', sans-serif; font-weight: 500;
          cursor: pointer; transition: background .2s, transform .15s;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.08); transform: translateY(-2px); }

        /* ── PROOF ── */
        .proof {
          display: flex; justify-content: center; gap: 56px; flex-wrap: wrap;
          padding: 36px 48px 0; position: relative; z-index: 2;
        }
        .proof-item { text-align: center; }
        .proof-num { font-family: 'Unbounded', sans-serif; font-size: 26px; font-weight: 700; }
        .proof-label { font-size: 11px; color: rgba(255,255,255,0.28); margin-top: 4px; font-weight: 300; }

        .red-divider { height: 0.5px; background: linear-gradient(90deg,transparent,rgba(195,7,63,0.25),transparent); margin: 72px 0 0; }

        /* ── SECTIONS ── */
        .sec { padding: 72px 48px; position: relative; z-index: 2; }
        .sec-label {
          text-align: center; font-size: 10px; letter-spacing: 3.5px;
          text-transform: uppercase; color: rgba(255,255,255,0.2);
          margin-bottom: 52px; font-weight: 500;
        }
        .grid-center { max-width: 760px; margin: 0 auto; }

        /* ── HOW IT WORKS ── */
        .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .step {
          background: rgba(255,255,255,0.025); border: 0.5px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 30px 24px;
          transition: border-color .3s, background .3s, transform .2s;
          position: relative; overflow: hidden;
        }
        .step:hover { border-color: rgba(195,7,63,0.28); background: rgba(195,7,63,0.04); transform: translateY(-3px); }
        .step-num {
          font-family: 'Unbounded', sans-serif; font-size: 42px; font-weight: 900;
          color: #C3073F; opacity: .45; margin-bottom: 16px; line-height: 1;
        }
        .step-title { font-family: 'Unbounded', sans-serif; font-size: 12px; font-weight: 700; margin-bottom: 10px; letter-spacing: -0.2px; }
        .step-desc { font-size: 12px; color: rgba(255,255,255,0.38); line-height: 1.65; font-weight: 300; }

        /* ── FEATURES ── */
        .feat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .feat {
          background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.06);
          border-radius: 18px; padding: 24px 22px;
          display: flex; gap: 18px; align-items: flex-start;
          transition: border-color .3s, transform .2s;
        }
        .feat:hover { border-color: rgba(195,7,63,0.22); transform: translateY(-2px); }
        .feat-icon {
          width: 46px; height: 46px; border-radius: 12px;
          background: rgba(195,7,63,0.1); border: 0.5px solid rgba(195,7,63,0.2);
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        }
        .feat-title { font-family: 'Unbounded', sans-serif; font-size: 11px; font-weight: 700; margin-bottom: 7px; letter-spacing: -0.2px; }
        .feat-text { font-size: 12px; color: rgba(255,255,255,0.36); line-height: 1.65; font-weight: 300; }

        /* ── WHO ── */
        .who-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
        .who-card {
          border: 0.5px solid rgba(255,255,255,0.07); border-radius: 18px;
          padding: 22px 12px; text-align: center;
          background: rgba(255,255,255,0.02);
          transition: border-color .3s, background .3s, transform .2s; cursor: default;
        }
        .who-card:hover { border-color: rgba(195,7,63,0.3); background: rgba(195,7,63,0.05); transform: translateY(-3px); }
        .who-emoji { font-size: 28px; margin-bottom: 12px; display: block; }
        .who-label { font-size: 11px; color: rgba(255,255,255,0.5); font-family: 'Unbounded', sans-serif; font-weight: 400; letter-spacing: -0.2px; }

        /* ── ONBOARDING ── */
        .onb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .onb-card {
          background: rgba(255,255,255,0.025); border: 0.5px solid rgba(255,255,255,0.07);
          border-radius: 22px; padding: 32px 22px 28px; text-align: center;
          transition: border-color .3s, transform .2s;
          position: relative; overflow: hidden;
        }
        .onb-card::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 0%, rgba(195,7,63,0.08), transparent 65%);
          pointer-events: none;
        }
        .onb-card:hover { border-color: rgba(195,7,63,0.28); transform: translateY(-3px); }
        .onb-dots { display: flex; gap: 6px; justify-content: center; margin-bottom: 22px; }
        .onb-dot { height: 4px; border-radius: 2px; background: rgba(255,255,255,0.13); }
        .onb-dot.active { background: #C3073F; width: 28px; }
        .onb-dot:not(.active) { width: 18px; }
        .onb-icon-wrap {
          width: 76px; height: 76px; border-radius: 22px;
          margin: 0 auto 22px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(195,7,63,0.1); border: 0.5px solid rgba(195,7,63,0.22);
          position: relative; z-index: 1;
        }
        .onb-step-label {
          font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(195,7,63,0.7); margin-bottom: 10px; font-weight: 600;
          position: relative; z-index: 1;
        }
        .onb-title {
          font-family: 'Unbounded', sans-serif; font-size: 14px; font-weight: 700;
          margin-bottom: 10px; line-height: 1.35; letter-spacing: -0.3px;
          position: relative; z-index: 1;
        }
        .onb-desc {
          font-size: 12px; color: rgba(255,255,255,0.38); line-height: 1.65;
          font-weight: 300; margin-bottom: 24px; position: relative; z-index: 1;
        }
        .onb-btn {
          width: 100%; background: #C3073F; color: #fff; border: none;
          border-radius: 12px; padding: 13px;
          font-size: 13px; font-family: 'Onest', sans-serif; font-weight: 600;
          cursor: pointer; box-shadow: 0 0 20px rgba(195,7,63,0.3);
          transition: opacity .15s; position: relative; z-index: 1;
        }
        .onb-btn:hover { opacity: .85; }
        .onb-skip {
          display: block; font-size: 11px; color: rgba(255,255,255,0.2);
          margin-top: 10px; cursor: pointer; position: relative; z-index: 1;
        }

        /* ── PRICING ── */
        .price-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .price-card {
          background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.07);
          border-radius: 22px; padding: 30px 24px; position: relative;
          transition: transform .2s;
        }
        .price-card:hover { transform: translateY(-3px); }
        .price-card.featured {
          border: 1px solid rgba(195,7,63,0.45);
          background: rgba(195,7,63,0.05);
          box-shadow: 0 0 52px rgba(195,7,63,0.1);
        }
        .badge {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: #C3073F; color: #fff;
          font-size: 10px; font-weight: 700; font-family: 'Unbounded', sans-serif;
          padding: 4px 16px; border-radius: 20px; white-space: nowrap;
          box-shadow: 0 0 16px rgba(195,7,63,0.5);
        }
        .plan-name {
          font-family: 'Unbounded', sans-serif; font-size: 10px;
          letter-spacing: 2px; text-transform: uppercase;
          color: rgba(255,255,255,0.28); margin-bottom: 16px;
        }
        .plan-price {
          font-family: 'Unbounded', sans-serif; font-size: 36px; font-weight: 900;
          margin-bottom: 4px; letter-spacing: -1px;
        }
        .plan-price sup { font-size: 16px; vertical-align: top; margin-top: 8px; display: inline-block; font-weight: 400; }
        .plan-per { font-size: 11px; color: rgba(255,255,255,0.28); margin-bottom: 22px; font-weight: 300; }
        .plan-line { height: 0.5px; background: rgba(255,255,255,0.07); margin-bottom: 18px; }
        .plan-ul { list-style: none; margin-bottom: 24px; }
        .plan-ul li {
          font-size: 12px; color: rgba(255,255,255,0.48); padding: 7px 0;
          display: flex; gap: 10px; align-items: center;
          border-bottom: 0.5px solid rgba(255,255,255,0.04); font-weight: 300;
        }
        .ck {
          width: 16px; height: 16px; border-radius: 50%;
          background: rgba(195,7,63,0.15); flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .plan-btn {
          width: 100%; border-radius: 12px; padding: 13px;
          font-size: 13px; font-family: 'Onest', sans-serif; font-weight: 600;
          cursor: pointer; transition: transform .15s, opacity .15s;
          border: 0.5px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.75);
        }
        .price-card.featured .plan-btn {
          background: #C3073F; color: #fff; border: none;
          box-shadow: 0 0 24px rgba(195,7,63,0.35);
        }
        .plan-btn:hover { opacity: .85; transform: translateY(-1px); }

        /* ── CTA ── */
        .cta { padding: 72px 48px; text-align: center; position: relative; z-index: 2; }
        .cta-box {
          max-width: 520px; margin: 0 auto;
          background: rgba(195,7,63,0.05); border: 0.5px solid rgba(195,7,63,0.18);
          border-radius: 28px; padding: 56px 44px;
          position: relative; overflow: hidden;
        }
        .cta-box::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 0%, rgba(195,7,63,0.18), transparent 60%);
          pointer-events: none;
        }
        .cta h2 {
          font-family: 'Unbounded', sans-serif; font-size: 26px; font-weight: 900;
          margin-bottom: 12px; letter-spacing: -0.8px; position: relative;
        }
        .cta-sub {
          font-size: 14px; color: rgba(255,255,255,0.38); margin-bottom: 36px;
          font-weight: 300; line-height: 1.6; position: relative;
        }
        .form { max-width: 320px; margin: 0 auto; position: relative; }
        .form input {
          width: 100%; background: rgba(255,255,255,0.06);
          border: 0.5px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 14px 16px;
          color: #fff; font-size: 14px; font-family: 'Onest', sans-serif;
          outline: none; transition: border-color .2s; margin-bottom: 10px;
        }
        .form input:focus { border-color: rgba(195,7,63,0.45); }
        .form input::placeholder { color: rgba(255,255,255,0.18); }
        .form-submit {
          width: 100%; background: #C3073F; color: #fff; border: none;
          border-radius: 12px; padding: 15px;
          font-size: 14px; font-family: 'Onest', sans-serif; font-weight: 700;
          cursor: pointer;
          box-shadow: 0 0 28px rgba(195,7,63,0.4);
          transition: transform .15s, box-shadow .15s;
        }
        .form-submit:hover { transform: translateY(-2px); box-shadow: 0 0 44px rgba(195,7,63,0.6); }
        .form-note { font-size: 11px; color: rgba(255,255,255,0.18); margin-top: 12px; font-weight: 300; }

        /* ── FOOTER ── */
        .footer {
          padding: 24px 48px; border-top: 0.5px solid rgba(255,255,255,0.06);
          display: flex; justify-content: space-between; align-items: center;
          position: relative; z-index: 2;
        }
        .footer-logo { font-family: 'Unbounded', sans-serif; font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.28); }
        .footer-logo em { color: rgba(195,7,63,0.55); font-style: normal; }
        .footer-text { font-size: 11px; color: rgba(255,255,255,0.18); font-weight: 300; }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .anim-1 { animation: fadeUp .6s ease both; }
        .anim-2 { animation: fadeUp .7s .1s ease both; }
        .anim-3 { animation: fadeUp .7s .2s ease both; }
        .anim-4 { animation: fadeUp .7s .3s ease both; }
        .anim-5 { animation: fadeUp .7s .4s ease both; }

        @media (max-width: 768px) {
          .nav { padding: 18px 20px; }
          .hero { padding: 64px 20px 48px; }
          .proof { gap: 32px; padding: 28px 20px 0; }
          .sec { padding: 52px 20px; }
          .steps-grid, .onb-grid, .price-grid { grid-template-columns: 1fr; }
          .feat-grid { grid-template-columns: 1fr; }
          .who-grid { grid-template-columns: repeat(3, 1fr); }
          .footer { flex-direction: column; gap: 8px; text-align: center; }
          .cta { padding: 48px 20px; }
          .cta-box { padding: 36px 24px; }
        }
      `}</style>

      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="blob blob1" />
        <div className="blob blob2" />
        <div className="blob blob3" />

        {/* NAV */}
        <nav className="nav">
          <a href="/" className="logo">tusi<em>'</em>m</a>
          <div className="nav-right">
            <button className="nav-link">Войти</button>
            <button className="nav-cta">Попробовать →</button>
          </div>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="hero-eyebrow anim-1">
            <span className="pulse-dot" />
            Краудсорсинг фото на мероприятиях
          </div>
          <h1 className="anim-2">
            Все фото гостей<br />
            <span className="red">в одном альбоме</span><br />
            <span className="dim">без фотографа</span>
          </h1>
          <p className="hero-sub anim-3">
            QR-код вместо найма. Гости снимают сами — альбом собирается в реальном времени прямо на вашем событии.
          </p>
          <div className="hero-btns anim-4">
            <button className="btn-primary">Выбрать тариф</button>
            <button className="btn-ghost">Смотреть демо →</button>
          </div>
        </section>

        {/* PROOF */}
        <div className="proof anim-5">
          <div className="proof-item"><div className="proof-num">500+</div><div className="proof-label">событий проведено</div></div>
          <div className="proof-item"><div className="proof-num">20 000+</div><div className="proof-label">фото собрано</div></div>
          <div className="proof-item"><div className="proof-num">0</div><div className="proof-label">приложений скачивать</div></div>
        </div>

        <div className="red-divider" />
      </div>

      {/* HOW */}
      <section className="sec">
        <div className="sec-label">Как это работает</div>
        <div className="grid-center">
          <div className="steps-grid">
            <div className="step"><div className="step-num">01</div><div className="step-title">Создаёте событие</div><div className="step-desc">Выбираете тариф, задаёте лимит кадров на гостя — получаете уникальный QR-код</div></div>
            <div className="step"><div className="step-num">02</div><div className="step-title">Гости снимают</div><div className="step-desc">Сканируют QR телефоном и фотографируют прямо в браузере — без скачивания приложений</div></div>
            <div className="step"><div className="step-num">03</div><div className="step-title">Альбом готов</div><div className="step-desc">Все кадры в одном альбоме. Голосование, реакции, скачать архив — всё сразу</div></div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="sec-label">Почему tusi'm</div>
        <div className="grid-center">
          <div className="feat-grid">
            <div className="feat">
              <div className="feat-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="7" stroke="#C3073F" strokeWidth="1.6"/><path d="M11 7.5V11l2.5 1.8" stroke="#C3073F" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div><div className="feat-title">Лимит кадров</div><div className="feat-text">Гости снимают осознанно — 200 живых моментов вместо 2000 случайных</div></div>
            </div>
            <div className="feat">
              <div className="feat-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 11c2-5 12-5 14 0" stroke="#C3073F" strokeWidth="1.5" strokeLinecap="round"/><path d="M18 11c-2 5-12 5-14 0" stroke="#C3073F" strokeWidth="1.5" strokeLinecap="round"/><circle cx="11" cy="11" r="2.5" fill="#C3073F" opacity=".7"/><path d="M15 6l2-2M7 6L5 4" stroke="#C3073F" strokeWidth="1.3" strokeLinecap="round"/></svg>
              </div>
              <div><div className="feat-title">Свайп-голосование</div><div className="feat-text">Гости листают фото как на сайтах знакомств — вправо огонь, влево пропустить. Вы понимаете как работают свайпы 😉</div></div>
            </div>
            <div className="feat">
              <div className="feat-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="5" width="16" height="12" rx="2.5" stroke="#C3073F" strokeWidth="1.5"/><circle cx="11" cy="11" r="3" stroke="#C3073F" strokeWidth="1.4"/><circle cx="11" cy="11" r="1" fill="#C3073F"/></svg>
              </div>
              <div><div className="feat-title">Без приложений</div><div className="feat-text">Работает в браузере любого смартфона — сканируй QR и сразу снимай</div></div>
            </div>
            <div className="feat">
              <div className="feat-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="3" width="16" height="16" rx="3" stroke="#C3073F" strokeWidth="1.5"/><path d="M7 11l3 3 5-5" stroke="#C3073F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div><div className="feat-title">Оплата картами РФ</div><div className="feat-text">На русском, российский хостинг, поддержка Мир, Visa, Mastercard</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO */}
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="sec-label">Для кого</div>
        <div className="grid-center">
          <div className="who-grid">
            {[['💍','Свадьбы'],['🏢','Корпоративы'],['🎂','Дни рождения'],['🎓','Выпускные'],['🎉','Тусовки']].map(([emoji, label]) => (
              <div className="who-card" key={label}>
                <span className="who-emoji">{emoji}</span>
                <div className="who-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ONBOARDING */}
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="sec-label">Что видят ваши гости</div>
        <div className="grid-center">
          <div className="onb-grid">
            {/* Step 1 */}
            <div className="onb-card">
              <div className="onb-dots">
                <div className="onb-dot active" /><div className="onb-dot" /><div className="onb-dot" />
              </div>
              <div className="onb-icon-wrap">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <rect x="4" y="9" width="28" height="20" rx="4" fill="rgba(195,7,63,0.15)" stroke="#C3073F" strokeWidth="1.5"/>
                  <circle cx="18" cy="19" r="6" stroke="#C3073F" strokeWidth="1.5"/>
                  <circle cx="18" cy="19" r="2.5" fill="#C3073F" opacity=".7"/>
                  <rect x="13" y="7" width="10" height="4" rx="1.5" fill="rgba(195,7,63,0.3)" stroke="#C3073F" strokeWidth="1"/>
                  <circle cx="27" cy="13" r="1.5" fill="#C3073F" opacity=".5"/>
                </svg>
              </div>
              <div className="onb-step-label">Шаг 1</div>
              <div className="onb-title">Снимай лучшие моменты</div>
              <div className="onb-desc">У тебя ограниченное количество кадров — используй их осознанно. Выбирай только лучшие!</div>
              <button className="onb-btn">Дальше →</button>
              <span className="onb-skip">Пропустить</span>
            </div>

            {/* Step 2 */}
            <div className="onb-card">
              <div className="onb-dots">
                <div className="onb-dot" /><div className="onb-dot active" /><div className="onb-dot" />
              </div>
              <div className="onb-icon-wrap">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path d="M18 30C18 30 6 22 6 13a7 7 0 0 1 12-4.9A7 7 0 0 1 30 13c0 9-12 17-12 17z" fill="rgba(195,7,63,0.2)" stroke="#C3073F" strokeWidth="1.5"/>
                  <path d="M13 13l2.5 2.5L22 9" stroke="#C3073F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 20l-3 3M28 20l3 3" stroke="#C3073F" strokeWidth="1.3" strokeLinecap="round" opacity=".5"/>
                </svg>
              </div>
              <div className="onb-step-label">Шаг 2</div>
              <div className="onb-title">Голосуй за фото</div>
              <div className="onb-desc">Свайпай вправо если фото огонь, влево — если нет. Лучшие фото победят!</div>
              <button className="onb-btn">Дальше →</button>
              <span className="onb-skip">Пропустить</span>
            </div>

            {/* Step 3 */}
            <div className="onb-card">
              <div className="onb-dots">
                <div className="onb-dot" /><div className="onb-dot" /><div className="onb-dot active" />
              </div>
              <div className="onb-icon-wrap">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <rect x="5" y="7" width="26" height="22" rx="4" fill="rgba(195,7,63,0.12)" stroke="#C3073F" strokeWidth="1.5"/>
                  <rect x="10" y="12" width="10" height="8" rx="2" fill="rgba(195,7,63,0.25)" stroke="#C3073F" strokeWidth="1"/>
                  <path d="M22 14h5M22 17h3M22 20h4" stroke="#C3073F" strokeWidth="1.2" strokeLinecap="round" opacity=".6"/>
                  <circle cx="27" cy="27" r="5" fill="#C3073F"/>
                  <path d="M25 27l1.5 1.5 2.5-2.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="onb-step-label">Шаг 3</div>
              <div className="onb-title">Общий альбом</div>
              <div className="onb-desc">Все фото попадают в один альбом в реальном времени. Смотри что снимают другие гости!</div>
              <button className="onb-btn">Поехали! 🎉</button>
              <span className="onb-skip">Пропустить</span>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="sec-label">Тарифы</div>
        <div className="grid-center">
          <div className="price-grid">
            {[
              { name: 'Старт', price: '990', per: 'одно событие', features: ['До 50 гостей','5 фото на гостя','Альбом 7 дней','QR-код'], featured: false },
              { name: 'Праздник', price: '1 990', per: 'одно событие', features: ['До 150 гостей','10 фото на гостя','Альбом 30 дней','Свайп-голосование'], featured: true },
              { name: 'Про', price: '3 490', per: 'одно событие', features: ['Безлимит гостей','20 фото на гостя','Альбом 90 дней','Скачать ZIP-архив'], featured: false },
            ].map(({ name, price, per, features, featured }) => (
              <div className={`price-card${featured ? ' featured' : ''}`} key={name}>
                {featured && <div className="badge">Популярный</div>}
                <div className="plan-name">{name}</div>
                <div className="plan-price"><sup>₽</sup>{price}</div>
                <div className="plan-per">{per}</div>
                <div className="plan-line" />
                <ul className="plan-ul">
                  {features.map(f => (
                    <li key={f}>
                      <span className="ck">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2 3-3" stroke="#C3073F" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button className="plan-btn">Выбрать</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta-box">
          <h2>Готовите мероприятие?</h2>
          <p className="cta-sub">Оставьте заявку — пришлём QR-код и инструкцию в течение 2 часов</p>
          <div className="form">
            <input placeholder="Ваше имя" />
            <input placeholder="Email или Telegram" />
            <input placeholder="Тип события (свадьба, корпоратив...)" />
            <button className="form-submit">Оставить заявку</button>
            <p className="form-note">Без спама. Только по делу.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-logo">tusi<em>'</em>m</div>
        <div className="footer-text">© 2025 · Российский сервис · Хостинг в РФ</div>
      </footer>
    </>
  )
}