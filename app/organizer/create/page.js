'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const PLANS = [
  { id: 'free',     name: 'Пробный',       price: 0,    guests: 5,   photos: 2,  features: ['Галерея', 'Watermark tusi\'m'] },
  { id: 'mini',     name: 'Тусовка',       price: 299,  guests: 15,  photos: 10, features: ['Без watermark', 'Скачать ZIP'] },
  { id: 'standard', name: 'Стандарт',      price: 799,  guests: 30,  photos: 20, features: ['Без watermark', 'Скачать ZIP', 'Статистика'], popular: true },
  { id: 'max',      name: 'Вечеринка',     price: 1490, guests: 60,  photos: 30, features: ['Без watermark', 'Скачать ZIP', 'Статистика', 'Обложка события'] },
  { id: 'ultra',    name: 'Свадьба / Корп',price: 2990, guests: 150, photos: 30, features: ['Без watermark', 'Скачать ZIP', 'Статистика', 'Обложка события', 'Слайдшоу на экран'] },
]

const DURATIONS = [
  { label: '1 час',    val: 1  },
  { label: '2 часа',   val: 2  },
  { label: '3 часа',   val: 3  },
  { label: '4 часа',   val: 4  },
  { label: '6 часов',  val: 6  },
  { label: 'Весь день',val: 24 },
]

export default function CreateEvent() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [plan, setPlan] = useState('standard')
  const [name, setName] = useState('')
  const [duration, setDuration] = useState(3)
  const [loading, setLoading] = useState(false)
  const [payMethod, setPayMethod] = useState('card')

  useEffect(() => {
    fetch('/api/me').then(r => { if (!r.ok) router.replace('/organizer') }).catch(() => router.replace('/organizer'))
  }, [])

  const selectedPlan = PLANS.find(p => p.id === plan)

  function handleCreate() {
    setLoading(true)
    setTimeout(() => router.push('/organizer/dashboard'), 1500)
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .cr-root {
          min-height: 100vh; min-height: 100dvh;
          background: #09090b; font-family: 'Onest', sans-serif;
          color: #F0F0F0; position: relative; overflow-x: hidden;
        }

        .cr-blob {
          position: fixed; border-radius: 50%;
          filter: blur(120px); pointer-events: none; z-index: 0;
        }
        .cr-blob-1 {
          width: 600px; height: 600px;
          background: rgba(195,7,63,0.07);
          top: -200px; right: -100px;
          animation: blobDrift 22s ease-in-out infinite alternate;
        }
        .cr-blob-2 {
          width: 400px; height: 400px;
          background: rgba(195,7,63,0.04);
          bottom: -100px; left: -100px;
          animation: blobDrift 28s ease-in-out infinite alternate-reverse;
        }
        @keyframes blobDrift {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(50px,70px) scale(1.12); }
        }

        .cr-header {
          position: sticky; top: 0; z-index: 100;
          background: rgba(9,9,11,0.85);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 0 28px; height: 62px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .cr-logo {
          font-family: 'Unbounded', sans-serif; font-weight: 900;
          font-size: 20px; color: #fff; letter-spacing: -1.5px; text-decoration: none;
        }
        .cr-logo span { color: #C3073F; }
        .cr-back {
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.4); font-size: 13px; font-weight: 600;
          font-family: 'Onest', sans-serif; padding: 8px 14px; border-radius: 10px;
          cursor: pointer; transition: all 0.15s;
        }
        .cr-back:hover { color: #fff; background: rgba(255,255,255,0.07); }

        .cr-body {
          max-width: 880px; margin: 0 auto;
          padding: 44px 24px 120px;
          position: relative; z-index: 1;
        }

        /* Прогресс */
        .cr-progress {
          display: flex; align-items: center;
          margin-bottom: 48px;
          animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cr-step-wrap { display: flex; align-items: center; gap: 10px; }
        .cr-step-num {
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; flex-shrink: 0;
          transition: all 0.3s; font-family: 'Unbounded', sans-serif;
        }
        .cr-step-num.done {
          background: #C3073F; color: #fff;
          box-shadow: 0 0 0 4px rgba(195,7,63,0.15);
        }
        .cr-step-num.current {
          background: rgba(195,7,63,0.12); color: #C3073F;
          border: 1px solid rgba(195,7,63,0.3);
          box-shadow: 0 0 0 4px rgba(195,7,63,0.06);
        }
        .cr-step-num.todo {
          background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.25);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .cr-step-label { font-size: 12px; font-weight: 600; white-space: nowrap; }
        .cr-step-label.done    { color: rgba(255,255,255,0.5); }
        .cr-step-label.current { color: #fff; }
        .cr-step-label.todo    { color: rgba(255,255,255,0.2); }
        .cr-step-line {
          flex: 1; height: 1px; margin: 0 12px;
          background: rgba(255,255,255,0.07);
        }
        .cr-step-line.done { background: rgba(195,7,63,0.4); }

        .cr-title {
          font-family: 'Unbounded', sans-serif;
          font-size: clamp(20px, 4vw, 28px);
          font-weight: 900; letter-spacing: -1px; color: #fff;
          margin-bottom: 8px;
          animation: fadeUp 0.5s 0.05s cubic-bezier(.22,1,.36,1) both;
        }
        .cr-subtitle {
          font-size: 13px; color: rgba(255,255,255,0.3);
          margin-bottom: 36px; font-weight: 300;
          animation: fadeUp 0.5s 0.08s cubic-bezier(.22,1,.36,1) both;
        }

        /* Тарифы */
        .cr-plans {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
          gap: 10px; margin-bottom: 36px;
          animation: fadeUp 0.5s 0.1s cubic-bezier(.22,1,.36,1) both;
        }
        @media(max-width: 560px) { .cr-plans { grid-template-columns: 1fr 1fr; } }

        .cr-plan {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px; padding: 20px 16px;
          cursor: pointer; transition: all 0.2s;
          position: relative; display: flex; flex-direction: column; gap: 10px;
        }
        .cr-plan:hover { border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.03); }
        .cr-plan.selected {
          border-color: #C3073F;
          background: rgba(195,7,63,0.06);
          box-shadow: 0 0 0 1px rgba(195,7,63,0.2), 0 4px 24px rgba(195,7,63,0.1);
        }
        .cr-plan-popular {
          position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
          background: #C3073F; color: #fff; font-size: 9px; font-weight: 700;
          padding: 3px 10px; border-radius: 10px; white-space: nowrap;
          letter-spacing: 0.5px; font-family: 'Unbounded', sans-serif;
        }
        .cr-plan-name {
          font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4);
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .cr-plan-price {
          font-family: 'Unbounded', sans-serif; font-size: 20px;
          font-weight: 900; color: #fff; letter-spacing: -1px; line-height: 1;
        }
        .cr-plan-price-free { color: #22c55e; }
        .cr-plan-guests { font-size: 11px; color: rgba(255,255,255,0.3); }
        .cr-plan-features { display: flex; flex-direction: column; gap: 5px; margin-top: 4px; }
        .cr-plan-feat {
          font-size: 11px; color: rgba(255,255,255,0.35);
          display: flex; align-items: center; gap: 6px;
        }
        .cr-plan-feat::before { content: '✓'; color: #C3073F; font-weight: 900; font-size: 10px; }

        /* Форма деталей */
        .cr-form {
          display: flex; flex-direction: column; gap: 24px;
          animation: fadeUp 0.5s 0.08s cubic-bezier(.22,1,.36,1) both;
        }
        .cr-field label {
          display: block; font-size: 11px; color: rgba(255,255,255,0.3);
          letter-spacing: 1px; text-transform: uppercase;
          margin-bottom: 10px; font-weight: 700;
        }
        .cr-input {
          width: 100%; padding: 15px 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; color: #F0F0F0;
          font-size: 15px; font-family: 'Onest', sans-serif;
          outline: none; transition: border-color 0.2s, background 0.2s;
          -webkit-appearance: none;
        }
        .cr-input:focus { border-color: rgba(195,7,63,0.5); background: rgba(195,7,63,0.03); }
        .cr-input::placeholder { color: rgba(255,255,255,0.15); }

        .cr-durations { display: flex; gap: 8px; flex-wrap: wrap; }
        .cr-dur-btn {
          padding: 10px 16px; border-radius: 10px; cursor: pointer;
          font-size: 13px; font-weight: 600; font-family: 'Onest', sans-serif;
          transition: all 0.15s;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.35);
        }
        .cr-dur-btn:hover { border-color: rgba(255,255,255,0.14); color: rgba(255,255,255,0.7); }
        .cr-dur-btn.active {
          background: rgba(195,7,63,0.1); border-color: rgba(195,7,63,0.35); color: #fff;
        }

        /* Сводка */
        .cr-summary {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 28px;
          margin-bottom: 24px;
          animation: fadeUp 0.5s 0.06s cubic-bezier(.22,1,.36,1) both;
        }
        .cr-summary-title {
          font-family: 'Unbounded', sans-serif; font-size: 13px;
          font-weight: 900; color: #fff; margin-bottom: 20px; letter-spacing: -0.3px;
        }
        .cr-sum-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 11px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
          font-size: 14px;
        }
        .cr-sum-row:last-child { border-bottom: none; padding-bottom: 0; }
        .cr-sum-label { color: rgba(255,255,255,0.35); }
        .cr-sum-val { color: #fff; font-weight: 600; }
        .cr-sum-total {
          font-family: 'Unbounded', sans-serif; font-size: 26px;
          font-weight: 900; color: #C3073F; letter-spacing: -1px;
        }

        /* Способы оплаты */
        .cr-pay-methods {
          display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px;
          animation: fadeUp 0.5s 0.1s cubic-bezier(.22,1,.36,1) both;
        }
        .cr-pay-method {
          display: flex; align-items: center; gap: 16px;
          padding: 16px 20px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; cursor: pointer; transition: all 0.15s;
        }
        .cr-pay-method:hover { border-color: rgba(255,255,255,0.12); }
        .cr-pay-method.selected {
          border-color: rgba(195,7,63,0.35);
          background: rgba(195,7,63,0.04);
        }
        .cr-pay-icon { font-size: 24px; flex-shrink: 0; }
        .cr-pay-name { font-size: 14px; font-weight: 600; color: #fff; }
        .cr-pay-sub { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 2px; }
        .cr-pay-radio {
          margin-left: auto; width: 20px; height: 20px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.15); flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .cr-pay-radio.checked { border-color: #C3073F; background: #C3073F; }
        .cr-pay-radio.checked::after {
          content: ''; width: 8px; height: 8px;
          border-radius: 50%; background: #fff;
        }

        /* Навигация */
        .cr-nav {
          display: flex; gap: 12px; margin-top: 40px;
          animation: fadeUp 0.5s 0.15s cubic-bezier(.22,1,.36,1) both;
        }
        .cr-btn-back {
          padding: 15px 20px; border-radius: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.4); font-size: 15px;
          font-family: 'Onest', sans-serif; cursor: pointer; transition: all 0.15s;
        }
        .cr-btn-back:hover { color: #fff; background: rgba(255,255,255,0.07); }
        .cr-btn-next {
          flex: 1; padding: 15px 20px; border-radius: 12px;
          background: #C3073F; border: none; color: #fff;
          font-size: 15px; font-weight: 700; font-family: 'Onest', sans-serif;
          cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 24px rgba(195,7,63,0.35);
        }
        .cr-btn-next:hover { transform: translateY(-1px); box-shadow: 0 8px 36px rgba(195,7,63,0.5); }
        .cr-btn-next:active { transform: scale(0.98); }
        .cr-btn-next:disabled { background: rgba(195,7,63,0.2); color: rgba(255,255,255,0.3); cursor: not-allowed; box-shadow: none; transform: none; }

        .cr-spin {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="cr-blob cr-blob-1"/>
      <div className="cr-blob cr-blob-2"/>

      <div className="cr-root">
        <header className="cr-header">
          <a href="/organizer/dashboard" className="cr-logo">tusi<span>'m</span></a>
          <button className="cr-back"
            onClick={() => step > 1 ? setStep(s => s-1) : router.push('/organizer/dashboard')}>
            ← {step === 1 ? 'Дашборд' : 'Назад'}
          </button>
        </header>

        <div className="cr-body">
          {/* Прогресс */}
          <div className="cr-progress">
            {['Тариф','Детали','Оплата'].map((label, i) => {
              const n = i + 1
              const state = n < step ? 'done' : n === step ? 'current' : 'todo'
              return (
                <div key={n} style={{ display:'flex', alignItems:'center', flex: i < 2 ? 1 : 'none' }}>
                  <div className="cr-step-wrap">
                    <div className={`cr-step-num ${state}`}>{n < step ? '✓' : n}</div>
                    <span className={`cr-step-label ${state}`}>{label}</span>
                  </div>
                  {i < 2 && <div className={`cr-step-line${n < step ? ' done' : ''}`}/>}
                </div>
              )
            })}
          </div>

          {/* Шаг 1 — Тариф */}
          {step === 1 && (
            <>
              <div className="cr-title">Выбери тариф</div>
              <div className="cr-subtitle">Оплата за одно событие — без подписок</div>
              <div className="cr-plans">
                {PLANS.map(p => (
                  <div
                    key={p.id}
                    className={`cr-plan${plan === p.id ? ' selected' : ''}`}
                    onClick={() => setPlan(p.id)}
                  >
                    {p.popular && <div className="cr-plan-popular">ПОПУЛЯРНЫЙ</div>}
                    <div className="cr-plan-name">{p.name}</div>
                    <div className={`cr-plan-price${p.price === 0 ? ' cr-plan-price-free' : ''}`}>
                      {p.price === 0 ? 'Бесплатно' : `${p.price.toLocaleString()} ₽`}
                    </div>
                    <div className="cr-plan-guests">до {p.guests} гостей · {p.photos} фото</div>
                    <div className="cr-plan-features">
                      {p.features.map(f => <div key={f} className="cr-plan-feat">{f}</div>)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="cr-nav">
                <button className="cr-btn-next" onClick={() => setStep(2)}>
                  Продолжить →
                </button>
              </div>
            </>
          )}

          {/* Шаг 2 — Детали */}
          {step === 2 && (
            <>
              <div className="cr-title">Настрой событие</div>
              <div className="cr-subtitle">Название и продолжительность</div>
              <div className="cr-form">
                <div className="cr-field">
                  <label>Название события</label>
                  <input
                    className="cr-input"
                    placeholder="Свадьба Ани и Коли"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                  />
                </div>
                {selectedPlan?.id !== 'free' && (
                  <div className="cr-field">
                    <label>Продолжительность</label>
                    <div className="cr-durations">
                      {DURATIONS.map(d => (
                        <button
                          key={d.val}
                          className={`cr-dur-btn${duration === d.val ? ' active' : ''}`}
                          onClick={() => setDuration(d.val)}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="cr-nav">
                <button className="cr-btn-back" onClick={() => setStep(1)}>←</button>
                <button className="cr-btn-next" disabled={!name.trim()} onClick={() => setStep(3)}>
                  Продолжить →
                </button>
              </div>
            </>
          )}

          {/* Шаг 3 — Оплата */}
          {step === 3 && (
            <>
              <div className="cr-title">Оплата</div>
              <div className="cr-subtitle">Проверь и подтверди</div>

              <div className="cr-summary">
                <div className="cr-summary-title">Сводка заказа</div>
                {[
                  ['Тариф',         selectedPlan?.name],
                  ['Событие',       name],
                  ['Гостей',        `до ${selectedPlan?.guests}`],
                  ['Фото / гость',  `${selectedPlan?.photos} шт`],
                  ['Длительность',  selectedPlan?.id === 'free' ? '2 часа' : `${duration} ч`],
                ].map(([l, v]) => (
                  <div className="cr-sum-row" key={l}>
                    <span className="cr-sum-label">{l}</span>
                    <span className="cr-sum-val">{v}</span>
                  </div>
                ))}
                <div className="cr-sum-row" style={{ marginTop: 8 }}>
                  <span className="cr-sum-label">Итого</span>
                  <span className="cr-sum-total">
                    {selectedPlan?.price === 0 ? 'Бесплатно' : `${selectedPlan?.price?.toLocaleString()} ₽`}
                  </span>
                </div>
              </div>

              {selectedPlan?.price > 0 && (
                <div className="cr-pay-methods">
                  {[
                    { id:'card', icon:'💳', name:'Банковская карта', sub:'Visa, Mastercard, МИР' },
                    { id:'sbp',  icon:'📱', name:'СБП',              sub:'Система быстрых платежей' },
                    { id:'ym',   icon:'💰', name:'ЮMoney',           sub:'Электронный кошелёк' },
                  ].map(m => (
                    <div
                      key={m.id}
                      className={`cr-pay-method${payMethod === m.id ? ' selected' : ''}`}
                      onClick={() => setPayMethod(m.id)}
                    >
                      <span className="cr-pay-icon">{m.icon}</span>
                      <div>
                        <div className="cr-pay-name">{m.name}</div>
                        <div className="cr-pay-sub">{m.sub}</div>
                      </div>
                      <div className={`cr-pay-radio${payMethod === m.id ? ' checked' : ''}`}/>
                    </div>
                  ))}
                </div>
              )}

              <div className="cr-nav">
                <button className="cr-btn-back" onClick={() => setStep(2)}>←</button>
                <button className="cr-btn-next" onClick={handleCreate} disabled={loading}>
                  {loading
                    ? <span className="cr-spin"/>
                    : selectedPlan?.price === 0
                      ? 'Создать бесплатно 🎉'
                      : `Оплатить ${selectedPlan?.price?.toLocaleString()} ₽`
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}