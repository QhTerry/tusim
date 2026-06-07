'use client'
import { useEffect, useState, useRef } from 'react'

function useCounter(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime = null
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, duration])
  return count
}

export default function Home() {
  const [formData, setFormData] = useState({ name: '', contact: '', type: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [onbStep, setOnbStep] = useState(0)
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef(null)

  const count1 = useCounter(500, 1600, statsVisible)
  const count2 = useCounter(20000, 2000, statsVisible)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))

    const statsObs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { setStatsVisible(true); statsObs.disconnect() } }),
      { threshold: 0.3 }
    )
    if (statsRef.current) statsObs.observe(statsRef.current)

    return () => { observer.disconnect(); statsObs.disconnect() }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setFormError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          contact: formData.contact.trim(),
          type: formData.type.trim(),
          source: 'landing',
        }),
      })
      if (!res.ok) throw new Error('bad status')
      setSubmitted(true)
    } catch (err) {
      setFormError('Не удалось отправить. Попробуйте ещё раз или напишите нам в Telegram.')
    } finally {
      setSubmitting(false)
    }
  }
  const go = (path) => { window.location.href = path }

  const onbSteps = [
    {
      step: '01', title: 'Сканируй QR-код',
      desc: 'Организатор расставил QR-коды по залу. Наводи камеру — и ты уже внутри. Без регистрации, без приложения.',
      btn: 'Понятно →',
      svg: <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="4" y="4" width="14" height="14" rx="3" stroke="#C3073F" strokeWidth="1.6"/>
        <rect x="7" y="7" width="8" height="8" rx="1.5" fill="rgba(195,7,63,0.3)"/>
        <rect x="22" y="4" width="14" height="14" rx="3" stroke="#C3073F" strokeWidth="1.6"/>
        <rect x="25" y="7" width="8" height="8" rx="1.5" fill="rgba(195,7,63,0.3)"/>
        <rect x="4" y="22" width="14" height="14" rx="3" stroke="#C3073F" strokeWidth="1.6"/>
        <rect x="7" y="25" width="8" height="8" rx="1.5" fill="rgba(195,7,63,0.3)"/>
        <rect x="22" y="22" width="6" height="6" rx="1.5" fill="rgba(195,7,63,0.5)"/>
        <rect x="30" y="22" width="6" height="6" rx="1.5" fill="rgba(195,7,63,0.2)"/>
        <rect x="22" y="30" width="6" height="6" rx="1.5" fill="rgba(195,7,63,0.2)"/>
        <rect x="30" y="30" width="6" height="6" rx="1.5" fill="rgba(195,7,63,0.5)"/>
      </svg>
    },
    {
      step: '02', title: 'Снимай — осознанно',
      desc: 'У тебя лимит кадров. Не 200 случайных снимков, а 10 настоящих моментов. Выбирай лучшее.',
      btn: 'Дальше →',
      svg: <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="4" y="10" width="32" height="23" rx="4" fill="rgba(195,7,63,0.12)" stroke="#C3073F" strokeWidth="1.6"/>
        <circle cx="20" cy="21" r="7" stroke="#C3073F" strokeWidth="1.5"/>
        <circle cx="20" cy="21" r="3" fill="#C3073F" opacity=".7"/>
        <rect x="14" y="7" width="12" height="5" rx="2" fill="rgba(195,7,63,0.25)" stroke="#C3073F" strokeWidth="1"/>
        <circle cx="30" cy="14" r="2" fill="#C3073F" opacity=".5"/>
      </svg>
    },
    {
      step: '03', title: 'Свайпай и голосуй',
      desc: 'Листай фото как в тиндере. Вправо — огонь 🔥 влево — следующее. Лучшие кадры поднимаются наверх.',
      btn: 'Ещё →',
      svg: <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="12" y="6" width="16" height="28" rx="4" fill="rgba(195,7,63,0.12)" stroke="#C3073F" strokeWidth="1.5"/>
        <path d="M16 20h8M16 24h5" stroke="#C3073F" strokeWidth="1.3" strokeLinecap="round" opacity=".5"/>
        <path d="M3 18l4 4-4 4" stroke="#C3073F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".4"/>
        <path d="M37 18l-4 4 4 4" stroke="#C3073F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".4"/>
        <circle cx="20" cy="13" r="3" fill="rgba(195,7,63,0.4)" stroke="#C3073F" strokeWidth="1"/>
      </svg>
    },
    {
      step: '04', title: 'Смотри всё в реальном времени',
      desc: 'Общий альбом обновляется мгновенно. Реакции, лайки, архив на скачивание — прямо с телефона.',
      btn: 'Готово! 🎉',
      svg: <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="4" y="8" width="32" height="26" rx="4" fill="rgba(195,7,63,0.1)" stroke="#C3073F" strokeWidth="1.5"/>
        <rect x="8" y="13" width="11" height="9" rx="2" fill="rgba(195,7,63,0.3)" stroke="#C3073F" strokeWidth="1"/>
        <rect x="21" y="13" width="11" height="4" rx="1.5" fill="rgba(195,7,63,0.2)"/>
        <rect x="21" y="19" width="7" height="3" rx="1.5" fill="rgba(195,7,63,0.15)"/>
        <rect x="8" y="25" width="24" height="3" rx="1.5" fill="rgba(195,7,63,0.1)"/>
        <circle cx="32" cy="32" r="6" fill="#C3073F"/>
        <path d="M29.5 32l1.8 1.8 3-3" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    },
  ]

  const checkSvg = (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <path d="M1.5 4l2 2 3-3" stroke="#C3073F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: #09090b !important;
          color: #f0f0f0;
          font-family: 'Onest', sans-serif;
          overflow-x: hidden;
          padding-bottom: 0 !important;
        }

        .blob-wrap { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .blob { position: absolute; border-radius: 50%; filter: blur(120px); animation: drift 22s ease-in-out infinite; }
        .blob-1 { width: 700px; height: 700px; background: rgba(195,7,63,0.08); top: -250px; left: -200px; }
        .blob-2 { width: 450px; height: 450px; background: rgba(195,7,63,0.05); top: 45vh; right: -180px; animation-delay: -8s; }
        .blob-3 { width: 550px; height: 550px; background: rgba(195,7,63,0.03); bottom: -120px; left: 25%; animation-delay: -15s; }
        @keyframes drift { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(35px,-45px) scale(1.06);} 66%{transform:translate(-25px,35px) scale(0.96);} }

        .wrap { position: relative; z-index: 2; max-width: 1100px; margin: 0 auto; padding: 0 40px; }

        /* NAV */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 0 40px; height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(9,9,11,0.8); backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .nav-logo {
          font-family: 'Unbounded', sans-serif; font-size: 20px; font-weight: 900;
          color: #fff; text-decoration: none; letter-spacing: -1.5px;
        }
        .nav-logo span { color: #C3073F; }
        .nav-right { display: flex; align-items: center; gap: 8px; }
        .nav-login {
          font-size: 13px; color: rgba(255,255,255,0.35); background: none; border: none;
          cursor: pointer; font-family: 'Onest', sans-serif; padding: 8px 14px;
          border-radius: 8px; transition: color .2s, background .2s;
        }
        .nav-login:hover { color: #fff; background: rgba(255,255,255,0.05); }
        .nav-cta {
          font-size: 13px; font-weight: 600; font-family: 'Onest', sans-serif; color: #fff;
          background: #C3073F; border: none; border-radius: 10px; padding: 9px 20px;
          cursor: pointer; box-shadow: 0 0 20px rgba(195,7,63,0.3);
          transition: transform .15s, box-shadow .15s;
        }
        .nav-cta:hover { transform: translateY(-1px); box-shadow: 0 0 36px rgba(195,7,63,0.55); }

        /* HERO */
        .hero {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; padding: 120px 40px 80px; position: relative; z-index: 2;
        }
        .hero-tag {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(195,7,63,0.08); border: 1px solid rgba(195,7,63,0.2);
          border-radius: 100px; padding: 6px 16px;
          font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.5);
          margin-bottom: 40px; animation: fadeUp .6s ease both;
        }
        .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #C3073F; animation: pulse 2s infinite; flex-shrink: 0; }
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(195,7,63,0.4);} 50%{opacity:.5;box-shadow:0 0 0 6px rgba(195,7,63,0);} }

        .hero-h1 {
          font-family: 'Unbounded', sans-serif; font-size: clamp(36px,5.5vw,68px);
          font-weight: 900; line-height: 1.08; letter-spacing: -2px;
          max-width: 820px; margin-bottom: 28px; animation: fadeUp .7s .1s ease both;
        }
        .line2 { color: #C3073F; display: block; }
        .line3 { color: rgba(255,255,255,.15); font-weight: 700; display: block; font-style: italic; }
        .hero-sub {
          font-size: 16px; line-height: 1.8; font-weight: 300; color: rgba(255,255,255,.38);
          max-width: 420px; margin-bottom: 48px; animation: fadeUp .7s .2s ease both;
        }
        .hero-btns {
          display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
          animation: fadeUp .7s .3s ease both; margin-bottom: 64px;
        }

        .btn-red {
          background: #C3073F; color: #fff; border: none; border-radius: 14px;
          padding: 16px 36px; font-size: 15px; font-weight: 600;
          font-family: 'Onest', sans-serif; cursor: pointer;
          box-shadow: 0 4px 28px rgba(195,7,63,.45);
          transition: transform .15s, box-shadow .15s;
        }
        .btn-red:hover { transform: translateY(-2px); box-shadow: 0 8px 44px rgba(195,7,63,.6); }
        .btn-ghost {
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.09);
          color: rgba(255,255,255,.55); border-radius: 14px; padding: 16px 30px;
          font-size: 15px; font-weight: 500; font-family: 'Onest', sans-serif;
          cursor: pointer; transition: background .2s, transform .15s, color .2s;
        }
        .btn-ghost:hover { background: rgba(255,255,255,.08); transform: translateY(-2px); color: #fff; }

        /* STATS */
        .stats {
          display: flex; background: rgba(255,255,255,.02);
          border: 1px solid rgba(255,255,255,.06); border-radius: 22px;
          overflow: hidden; animation: fadeUp .7s .4s ease both;
          width: 100%; max-width: 520px;
        }
        .stat { flex: 1; padding: 22px 24px; text-align: center; border-right: 1px solid rgba(255,255,255,.06); }
        .stat:last-child { border-right: none; }
        .stat-num { font-family: 'Unbounded', sans-serif; font-size: 26px; font-weight: 900; display: block; margin-bottom: 4px; }
        .stat-num span { color: #C3073F; }
        .stat-label { font-size: 11px; color: rgba(255,255,255,.25); font-weight: 300; }

        /* REVEAL */
        .reveal { opacity: 0; transform: translateY(32px); transition: opacity .75s ease, transform .75s ease; }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .d1{transition-delay:.05s;}.d2{transition-delay:.15s;}.d3{transition-delay:.25s;}
        .d4{transition-delay:.35s;}.d5{transition-delay:.45s;}

        /* SECTION */
        .section { padding: 100px 0; position: relative; z-index: 2; }
        .sec-tag {
          text-align: center; font-size: 10px; font-weight: 600; letter-spacing: 4px;
          text-transform: uppercase; color: rgba(195,7,63,.6); margin-bottom: 56px;
          display: flex; align-items: center; justify-content: center; gap: 14px;
        }
        .sec-tag::before, .sec-tag::after { content: ''; flex: 1; max-width: 80px; height: 1px; }
        .sec-tag::before { background: linear-gradient(90deg, transparent, rgba(195,7,63,.3)); }
        .sec-tag::after  { background: linear-gradient(90deg, rgba(195,7,63,.3), transparent); }

        /* STEPS */
        .steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .step {
          background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.06);
          border-radius: 24px; padding: 36px 28px; position: relative; overflow: hidden;
          transition: border-color .3s, transform .25s, background .3s;
        }
        .step:hover { border-color: rgba(195,7,63,.3); background: rgba(195,7,63,.03); transform: translateY(-5px); }
        .step-num { font-family: 'Unbounded', sans-serif; font-size: 48px; font-weight: 900; color: #C3073F; opacity: .2; line-height: 1; margin-bottom: 22px; }
        .step-title { font-family: 'Unbounded', sans-serif; font-size: 13px; font-weight: 700; margin-bottom: 12px; letter-spacing: -0.3px; }
        .step-desc { font-size: 13px; color: rgba(255,255,255,.34); line-height: 1.75; font-weight: 300; }

        /* FEATS */
        .feats { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px; }
        .feat {
          background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.055);
          border-radius: 22px; padding: 28px; display: flex; gap: 20px; align-items: flex-start;
          transition: border-color .3s, transform .25s, background .3s;
        }
        .feat:hover { border-color: rgba(195,7,63,.2); transform: translateY(-3px); background: rgba(195,7,63,.02); }
        .feat-icon {
          width: 48px; height: 48px; flex-shrink: 0; border-radius: 14px;
          background: rgba(195,7,63,.08); border: 1px solid rgba(195,7,63,.16);
          display: flex; align-items: center; justify-content: center;
        }
        .feat-title { font-family: 'Unbounded', sans-serif; font-size: 12px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.3px; }
        .feat-text { font-size: 13px; color: rgba(255,255,255,.32); line-height: 1.75; font-weight: 300; }

        /* WHO */
        .who-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 12px; }
        .who-card {
          background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.06);
          border-radius: 20px; padding: 28px 16px; text-align: center;
          transition: border-color .3s, transform .25s, background .3s;
        }
        .who-card:hover { border-color: rgba(195,7,63,.3); background: rgba(195,7,63,.04); transform: translateY(-4px); }
        .who-emoji { font-size: 34px; display: block; margin-bottom: 12px; }
        .who-label { font-family: 'Unbounded', sans-serif; font-size: 9px; font-weight: 700; color: rgba(255,255,255,.4); letter-spacing: 0.5px; }

        /* ONBOARDING */
        .onb-wrap { max-width: 420px; margin: 0 auto; }
        .onb-card {
          background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.07);
          border-radius: 28px; padding: 44px 36px 36px; text-align: center; position: relative; overflow: hidden;
        }
        .onb-card::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% -10%,rgba(195,7,63,.1),transparent 65%); pointer-events: none;
        }
        .onb-progress { display: flex; gap: 6px; justify-content: center; margin-bottom: 36px; position: relative; z-index: 1; }
        .onb-pip { height: 4px; border-radius: 2px; transition: all .35s ease; cursor: pointer; }
        .onb-pip-on { background: #C3073F; width: 32px; }
        .onb-pip-off { background: rgba(255,255,255,.08); width: 16px; }
        .onb-icon-wrap {
          width: 88px; height: 88px; border-radius: 28px;
          background: rgba(195,7,63,.08); border: 1px solid rgba(195,7,63,.2);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 28px; position: relative; z-index: 1;
        }
        .onb-step-label { font-size: 10px; font-weight: 700; letter-spacing: 3.5px; color: rgba(195,7,63,.6); text-transform: uppercase; margin-bottom: 14px; position: relative; z-index: 1; }
        .onb-title { font-family: 'Unbounded', sans-serif; font-size: 17px; font-weight: 900; letter-spacing: -.5px; margin-bottom: 14px; position: relative; z-index: 1; }
        .onb-desc { font-size: 13px; color: rgba(255,255,255,.36); line-height: 1.8; font-weight: 300; margin-bottom: 32px; position: relative; z-index: 1; }
        .onb-actions { display: flex; flex-direction: column; gap: 10px; position: relative; z-index: 1; }
        .onb-btn-main {
          background: #C3073F; color: #fff; border: none; border-radius: 12px;
          padding: 14px 28px; font-size: 14px; font-weight: 600;
          font-family: 'Onest', sans-serif; cursor: pointer;
          box-shadow: 0 4px 20px rgba(195,7,63,.35); transition: transform .15s, box-shadow .15s;
        }
        .onb-btn-main:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(195,7,63,.5); }
        .onb-skip { background: none; border: none; color: rgba(255,255,255,.2); font-size: 12px; font-family: 'Onest', sans-serif; cursor: pointer; transition: color .2s; padding: 4px; }
        .onb-skip:hover { color: rgba(255,255,255,.4); }
        .onb-nav { display: flex; align-items: center; justify-content: center; gap: 20px; margin-top: 20px; }
        .onb-nav-btn {
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
          color: rgba(255,255,255,.4); border-radius: 10px; width: 40px; height: 40px;
          cursor: pointer; font-size: 16px; transition: all .2s;
          display: flex; align-items: center; justify-content: center;
        }
        .onb-nav-btn:hover:not(:disabled) { background: rgba(255,255,255,.08); color: #fff; }
        .onb-nav-btn:disabled { opacity: .3; cursor: default; }
        .onb-counter { font-size: 12px; color: rgba(255,255,255,.22); font-family: 'Unbounded', sans-serif; font-weight: 700; }
        @keyframes onbIn { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
        .onb-content { animation: onbIn .35s ease both; }

        /* PRICING */
        .price-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .price-card {
          background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.07);
          border-radius: 28px; padding: 36px 28px; position: relative; overflow: hidden;
          transition: border-color .3s, transform .25s; display: flex; flex-direction: column;
        }
        .price-card:hover { border-color: rgba(195,7,63,.25); transform: translateY(-4px); }
        .price-card.hot { border-color: rgba(195,7,63,.3); background: rgba(195,7,63,.03); }
        .price-badge {
          position: absolute; top: 20px; right: 20px;
          background: #C3073F; color: #fff; font-size: 10px; font-weight: 700;
          padding: 4px 12px; border-radius: 20px; letter-spacing: 0.5px;
        }
        .price-tier { font-family: 'Unbounded', sans-serif; font-size: 11px; font-weight: 700; color: rgba(255,255,255,.35); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
        .price-amount { font-family: 'Unbounded', sans-serif; font-size: 44px; font-weight: 900; letter-spacing: -2px; line-height: 1; margin-bottom: 4px; }
        .price-amount sup { font-size: 18px; vertical-align: super; letter-spacing: 0; margin-right: 2px; color: #C3073F; }
        .price-note { font-size: 12px; color: rgba(255,255,255,.22); margin-bottom: 24px; font-weight: 300; }
        .price-sep { height: 1px; background: rgba(255,255,255,.06); margin-bottom: 24px; }
        .price-list { list-style: none; display: flex; flex-direction: column; gap: 10px; flex: 1; margin-bottom: 28px; }
        .price-list li { display: flex; align-items: center; gap: 10px; font-size: 13px; color: rgba(255,255,255,.5); font-weight: 300; }
        .price-check { width: 18px; height: 18px; flex-shrink: 0; border-radius: 50%; background: rgba(195,7,63,.1); border: 1px solid rgba(195,7,63,.22); display: flex; align-items: center; justify-content: center; }
        .price-btn {
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09);
          color: #fff; border-radius: 12px; padding: 14px; font-size: 14px; font-weight: 600;
          font-family: 'Onest', sans-serif; cursor: pointer; transition: all .2s;
        }
        .price-btn:hover { background: #C3073F; border-color: #C3073F; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(195,7,63,.4); }
        .price-card.hot .price-btn { background: #C3073F; border-color: #C3073F; box-shadow: 0 4px 24px rgba(195,7,63,.4); }
        .price-card.hot .price-btn:hover { box-shadow: 0 8px 36px rgba(195,7,63,.6); }

        /* CTA */
        .red-line { height: 1px; background: linear-gradient(90deg,transparent,rgba(195,7,63,.2),transparent); position: relative; z-index: 2; }
        .cta-box {
          background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.07);
          border-radius: 32px; padding: 64px 48px; position: relative; overflow: hidden; text-align: center;
        }
        .cta-box::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% -10%,rgba(195,7,63,.18),transparent 60%); pointer-events: none; }
        .cta-h2 { font-family: 'Unbounded', sans-serif; font-size: 28px; font-weight: 900; letter-spacing: -.8px; margin-bottom: 12px; position: relative; z-index: 1; }
        .cta-sub { font-size: 15px; color: rgba(255,255,255,.35); font-weight: 300; line-height: 1.7; margin-bottom: 40px; position: relative; z-index: 1; }
        .cta-form { max-width: 360px; margin: 0 auto; position: relative; z-index: 1; }
        .cta-input {
          width: 100%; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px; padding: 14px 18px; color: #fff; font-size: 14px;
          font-family: 'Onest', sans-serif; outline: none; margin-bottom: 10px; transition: border-color .2s;
        }
        .cta-input:focus { border-color: rgba(195,7,63,.5); }
        .cta-input::placeholder { color: rgba(255,255,255,.18); }
        .cta-submit {
          width: 100%; background: #C3073F; color: #fff; border: none; border-radius: 12px;
          padding: 16px; font-size: 15px; font-family: 'Onest', sans-serif; font-weight: 700;
          cursor: pointer; box-shadow: 0 4px 28px rgba(195,7,63,.4); transition: transform .15s, box-shadow .15s; margin-top: 4px;
        }
        .cta-submit:hover { transform: translateY(-2px); box-shadow: 0 8px 44px rgba(195,7,63,.6); }
        .cta-note { font-size: 12px; color: rgba(255,255,255,.15); margin-top: 14px; font-weight: 300; }
        .cta-success { font-family: 'Unbounded', sans-serif; font-size: 20px; font-weight: 900; padding: 40px 0; position: relative; z-index: 1; line-height: 1.5; }
        .cta-success span { color: #C3073F; }

        /* FOOTER */
        .footer {
          position: relative; z-index: 2; padding: 28px 40px;
          border-top: 1px solid rgba(255,255,255,.04);
          display: flex; align-items: center; justify-content: space-between;
        }
        .footer-logo { font-family: 'Unbounded', sans-serif; font-size: 16px; font-weight: 900; color: rgba(255,255,255,.2); letter-spacing: -1px; }
        .footer-logo span { color: rgba(195,7,63,.4); }
        .footer-text { font-size: 11px; color: rgba(255,255,255,.14); font-weight: 300; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(24px);} to{opacity:1;transform:translateY(0);} }

        @media (max-width: 768px) {
          .wrap { padding: 0 20px; } .nav { padding: 0 20px; }
          .hero { padding: 100px 20px 60px; }
          .hero-h1 { font-size: clamp(30px,9vw,46px); letter-spacing: -1.5px; }
          .steps, .price-grid { grid-template-columns: 1fr; }
          .feats { grid-template-columns: 1fr; }
          .who-grid { grid-template-columns: repeat(3,1fr); }
          .section { padding: 68px 0; }
          .stats { flex-direction: column; }
          .stat { border-right: none; border-bottom: 1px solid rgba(255,255,255,.06); }
          .stat:last-child { border-bottom: none; }
          .cta-box { padding: 40px 24px; border-radius: 24px; }
          .footer { flex-direction: column; gap: 8px; text-align: center; padding: 20px; }
          .onb-wrap { max-width: 100%; }
          .onb-card { padding: 36px 24px 28px; }
        }
      `}</style>

      <div className="blob-wrap">
        <div className="blob blob-1"/><div className="blob blob-2"/><div className="blob blob-3"/>
      </div>

      <nav className="nav">
        <a href="/" className="nav-logo">tusi<span>'m</span></a>
        <div className="nav-right">
          <button className="nav-login" onClick={() => go('/organizer')}>Войти</button>
          <button className="nav-cta" onClick={() => go('/organizer/create')}>Создать альбом →</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-tag"><span className="pulse-dot"/>Краудсорсинг фото на мероприятиях</div>
        <h1 className="hero-h1">
          500 гостей. Один альбом.
          <span className="line2">Ноль фотографов.</span>
          <span className="line3">без приложений.</span>
        </h1>
        <p className="hero-sub">
          Расставьте QR-коды по залу — гости снимают через браузер,
          всё собирается в один живой альбом прямо на вашем событии.
        </p>
        <div className="hero-btns">
          <button className="btn-red" onClick={() => go('/organizer/create')}>Создать событие</button>
          <button className="btn-ghost" onClick={() => document.querySelector('.section')?.scrollIntoView({behavior:'smooth'})}>Как это работает →</button>
        </div>
        <div className="stats" ref={statsRef}>
          <div className="stat">
            <span className="stat-num">{statsVisible ? count1 : 0}<span>+</span></span>
            <span className="stat-label">событий</span>
          </div>
          <div className="stat">
            <span className="stat-num">{statsVisible ? count2.toLocaleString('ru') : 0}<span>+</span></span>
            <span className="stat-label">фото собрано</span>
          </div>
          <div className="stat">
            <span className="stat-num">0</span>
            <span className="stat-label">приложений</span>
          </div>
        </div>
      </section>

      <div className="red-line"/>

      <section className="section">
        <div className="wrap">
          <div className="sec-tag reveal">Как это работает</div>
          <div className="steps">
            {[
              {n:'01',t:'Создаёте событие за минуту',d:'Выбираете тариф, задаёте лимит кадров на гостя — получаете уникальный QR-код. Никакой настройки.'},
              {n:'02',t:'Гости снимают через браузер',d:'Сканируют QR телефоном и сразу фотографируют. Без регистрации, без скачивания. Просто нажать и снять.'},
              {n:'03',t:'Альбом живёт в реальном времени',d:'Каждый кадр появляется мгновенно. Свайп-голосование, реакции, живое слайд-шоу на экране в зале.'},
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

      <div className="red-line"/>

      <section className="section">
        <div className="wrap">
          <div className="sec-tag reveal">Почему tusi&apos;m</div>
          <div className="feats">
            {[
              {title:'Лимит кадров',text:'Гости снимают осознанно — 150 живых моментов вместо 2000 размытых случайных кадров.',
                icon:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="7" stroke="#C3073F" strokeWidth="1.6"/><path d="M11 7.5V11l2.5 1.8" stroke="#C3073F" strokeWidth="1.5" strokeLinecap="round"/></svg>},
              {title:'Свайп-голосование',text:'Гости листают как в тиндере — вправо огонь, влево пропустить. Вы понимаете как работают свайпы 😉',
                icon:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 19s-8-5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6-8 11-8 11z" stroke="#C3073F" strokeWidth="1.5" strokeLinejoin="round"/></svg>},
              {title:'Без приложений',text:'Работает в браузере любого смартфона. QR → сразу снимает. Никаких «скачайте наш app».',
                icon:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="5" y="2" width="12" height="18" rx="2.5" stroke="#C3073F" strokeWidth="1.5"/><circle cx="11" cy="16.5" r="1" fill="#C3073F"/><path d="M8 5.5h6" stroke="#C3073F" strokeWidth="1.3" strokeLinecap="round"/></svg>},
              {title:'Оплата картами РФ',text:'Полностью на русском. Российский хостинг, поддержка карт Мир, Visa, Mastercard. Без VPN.',
                icon:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="6" width="18" height="13" rx="2.5" stroke="#C3073F" strokeWidth="1.5"/><path d="M2 10h18" stroke="#C3073F" strokeWidth="1.5"/><path d="M6 14h4" stroke="#C3073F" strokeWidth="1.3" strokeLinecap="round"/></svg>},
            ].map((f,i) => (
              <div key={f.title} className={`feat reveal d${(i%2)+1}`}>
                <div className="feat-icon">{f.icon}</div>
                <div><div className="feat-title">{f.title}</div><div className="feat-text">{f.text}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="red-line"/>

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

      <div className="red-line"/>

      <section className="section">
        <div className="wrap">
          <div className="sec-tag reveal">Что видят ваши гости</div>
          <div className="onb-wrap reveal">
            <div className="onb-card">
              <div className="onb-progress">
                {onbSteps.map((_,i) => (
                  <div key={i} className={`onb-pip ${i===onbStep?'onb-pip-on':'onb-pip-off'}`} onClick={() => setOnbStep(i)}/>
                ))}
              </div>
              <div className="onb-content" key={onbStep}>
                <div className="onb-icon-wrap">{onbSteps[onbStep].svg}</div>
                <div className="onb-step-label">ШАГ {onbSteps[onbStep].step}</div>
                <div className="onb-title">{onbSteps[onbStep].title}</div>
                <div className="onb-desc">{onbSteps[onbStep].desc}</div>
                <div className="onb-actions">
                  <button className="onb-btn-main" onClick={() => setOnbStep(s => Math.min(s+1, onbSteps.length-1))}>
                    {onbStep < onbSteps.length-1 ? onbSteps[onbStep].btn : 'Начать снимать 🎉'}
                  </button>
                  {onbStep < onbSteps.length-1 && <button className="onb-skip" onClick={() => setOnbStep(onbSteps.length-1)}>Пропустить</button>}
                </div>
              </div>
            </div>
            <div className="onb-nav">
              <button className="onb-nav-btn" onClick={() => setOnbStep(s => Math.max(s-1,0))} disabled={onbStep===0}>←</button>
              <span className="onb-counter">{onbStep+1} / {onbSteps.length}</span>
              <button className="onb-nav-btn" onClick={() => setOnbStep(s => Math.min(s+1,onbSteps.length-1))} disabled={onbStep===onbSteps.length-1}>→</button>
            </div>
          </div>
        </div>
      </section>

      <div className="red-line"/>

      <section className="section">
        <div className="wrap">
          <div className="sec-tag reveal">Тарифы</div>
          <div className="price-grid">
            {[
              {name:'Тусовка',price:'299',features:['До 15 гостей','10 фото на гостя','Без watermark','Скачать ZIP'],hot:false},
              {name:'Стандарт',price:'799',features:['До 30 гостей','20 фото на гостя','Статистика события','Скачать ZIP'],hot:true},
              {name:'Ультра',price:'2 990',features:['До 150 гостей','30 фото на гостя','Обложка события','Слайдшоу на экран'],hot:false},
            ].map((p,i) => (
              <div key={p.name} className={`price-card${p.hot?' hot':''} reveal d${i+1}`}>
                {p.hot && <div className="price-badge">Популярный</div>}
                <div className="price-tier">{p.name}</div>
                <div className="price-amount"><sup>₽</sup>{p.price}</div>
                <div className="price-note">одно событие</div>
                <div className="price-sep"/>
                <ul className="price-list">
                  {p.features.map(f => <li key={f}><span className="price-check">{checkSvg}</span>{f}</li>)}
                </ul>
                <button className="price-btn" onClick={() => go('/organizer/create')}>Выбрать</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="red-line"/>

      <section className="section">
        <div className="wrap">
          <div className="cta-box reveal">
            {submitted ? (
              <div className="cta-success">Заявка принята! 🎉<br/><span>Ответим в течение 2 часов</span></div>
            ) : (
              <>
                <h2 className="cta-h2">Готовите мероприятие?</h2>
                <p className="cta-sub">Оставьте заявку — пришлём QR-код и инструкцию в течение 2 часов.</p>
                <form className="cta-form" onSubmit={handleSubmit}>
                  <input className="cta-input" placeholder="Ваше имя" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} required/>
                  <input className="cta-input" placeholder="Email или Telegram" value={formData.contact} onChange={e=>setFormData({...formData,contact:e.target.value})} required/>
                  <input className="cta-input" placeholder="Тип события (свадьба, корпоратив...)" value={formData.type} onChange={e=>setFormData({...formData,type:e.target.value})}/>
                  <button type="submit" className="cta-submit" disabled={submitting}>
                    {submitting ? 'Отправляем…' : 'Оставить заявку →'}
                  </button>
                  {formError && <p className="cta-note" style={{ color:'#C3073F' }}>{formError}</p>}
                  {!formError && <p className="cta-note">Без спама. Только по делу.</p>}
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-logo">tusi<span>'m</span></div>
        <div className="footer-text">© 2025 · Российский сервис · Хостинг в РФ</div>
      </footer>
    </>
  )
}