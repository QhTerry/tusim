'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const PLANS = [
  { id: 'free', name: 'Пробный', price: 0, guests: 5, photos: 2, time: '2 часа', color: '#444', features: ['Галерея', 'Watermark tusi\'m'] },
  { id: 'mini', name: 'Тусовка', price: 299, guests: 15, photos: 10, time: '∞', color: '#22c55e', features: ['Без watermark', 'Скачать ZIP'] },
  { id: 'standard', name: 'Стандарт', price: 799, guests: 30, photos: 20, time: '∞', color: '#3b82f6', popular: true, features: ['Без watermark', 'Скачать ZIP', 'Статистика'] },
  { id: 'max', name: 'Вечеринка', price: 1490, guests: 60, photos: 30, time: '∞', color: '#f59e0b', features: ['Без watermark', 'Скачать ZIP', 'Статистика', 'Обложка события'] },
  { id: 'ultra', name: 'Свадьба / Корп', price: 2990, guests: 150, photos: 30, time: '∞', color: '#C3073F', features: ['Без watermark', 'Скачать ZIP', 'Статистика', 'Обложка события', 'Слайдшоу на экран'] },
]

const DURATIONS = [
  { label: '1 час', val: 1 }, { label: '2 часа', val: 2 },
  { label: '3 часа', val: 3 }, { label: '4 часа', val: 4 },
  { label: '6 часов', val: 6 }, { label: 'Весь день', val: 24 },
]

export default function CreateEvent() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1=тариф 2=детали 3=оплата
  const [plan, setPlan] = useState('standard')
  const [name, setName] = useState('')
  const [duration, setDuration] = useState(3)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('organizer_token')) router.replace('/organizer')
  }, [])

  const selectedPlan = PLANS.find(p => p.id === plan)

  function handleCreate() {
    setLoading(true)
    setTimeout(() => {
      router.push('/organizer/dashboard')
    }, 1500)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Onest:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .cr-root {
          min-height: 100vh; min-height: 100dvh;
          background: #0c0c0e; font-family: 'Onest', sans-serif; color: #F0F0F0;
        }

        .cr-header {
          position: sticky; top: 0; z-index: 100;
          background: rgba(12,12,14,0.92); backdrop-filter: blur(20px);
          border-bottom: 0.5px solid rgba(255,255,255,0.05);
          padding: 0 24px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .cr-logo {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 20px; color: #fff; letter-spacing: -1px; text-decoration: none;
        }
        .cr-logo em { font-style: normal; color: #C3073F; }
        .cr-back {
          display: flex; align-items: center; gap: 6px;
          background: none; border: none; color: #555;
          font-size: 13px; cursor: pointer;
          font-family: 'Onest', sans-serif; transition: color 0.15s;
        }
        .cr-back:hover { color: #fff; }

        .cr-body { max-width: 860px; margin: 0 auto; padding: 36px 20px 100px; }

        /* Прогресс */
        .cr-progress { display: flex; align-items: center; gap: 0; margin-bottom: 40px; }
        .cr-step {
          display: flex; align-items: center; gap: 10px; flex: 1;
        }
        .cr-step-num {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 600; flex-shrink: 0;
          transition: all 0.3s;
        }
        .cr-step-num.done { background: #C3073F; color: #fff; }
        .cr-step-num.current { background: rgba(195,7,63,0.15); color: #C3073F; border: 1px solid rgba(195,7,63,0.3); }
        .cr-step-num.todo { background: rgba(255,255,255,0.04); color: #444; border: 0.5px solid rgba(255,255,255,0.07); }
        .cr-step-label { font-size: 12px; color: #444; white-space: nowrap; }
        .cr-step-label.current { color: #fff; }
        .cr-step-line { flex: 1; height: 0.5px; background: rgba(255,255,255,0.06); margin: 0 8px; }

        .cr-title {
          font-family: 'Syne', sans-serif; font-size: clamp(22px, 5vw, 30px);
          font-weight: 800; letter-spacing: -1px; color: #fff; margin-bottom: 8px;
        }
        .cr-subtitle { font-size: 13px; color: #444; margin-bottom: 32px; }

        /* Тарифы */
        .cr-plans {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 10px; margin-bottom: 32px;
        }
        @media(max-width: 600px) { .cr-plans { grid-template-columns: 1fr 1fr; } }

        .cr-plan {
          background: #111114; border: 1.5px solid rgba(255,255,255,0.06);
          border-radius: 18px; padding: 18px 16px;
          cursor: pointer; transition: all 0.2s; position: relative;
          display: flex; flex-direction: column; gap: 10px;
        }
        .cr-plan:hover { border-color: rgba(255,255,255,0.12); }
        .cr-plan.selected { border-color: var(--plan-color); background: rgba(0,0,0,0.3); }
        .cr-plan-popular {
          position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
          background: #C3073F; color: #fff; font-size: 10px; font-weight: 600;
          padding: 3px 10px; border-radius: 10px; white-space: nowrap; letter-spacing: 0.5px;
        }
        .cr-plan-name { font-size: 13px; font-weight: 600; color: #888; }
        .cr-plan-price {
          font-family: 'Syne', sans-serif; font-size: 22px;
          font-weight: 800; color: #fff; letter-spacing: -1px;
        }
        .cr-plan-price span { font-size: 13px; font-weight: 400; color: #444; }
        .cr-plan-guests { font-size: 12px; color: #555; }
        .cr-plan-features { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
        .cr-plan-feat { font-size: 11px; color: #444; display: flex; align-items: center; gap: 5px; }
        .cr-plan-feat::before { content: '✓'; color: var(--plan-color); font-weight: 700; }

        /* Форма деталей */
        .cr-form { display: flex; flex-direction: column; gap: 20px; }
        .cr-field label { display: block; font-size: 11px; color: #444; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
        .cr-input {
          width: 100%; padding: 14px 16px;
          background: rgba(255,255,255,0.03);
          border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 12px; color: #F0F0F0;
          font-size: 15px; font-family: 'Onest', sans-serif;
          outline: none; transition: border-color 0.2s;
        }
        .cr-input:focus { border-color: rgba(195,7,63,0.4); }
        .cr-input::placeholder { color: #333; }

        .cr-durations { display: flex; gap: 8px; flex-wrap: wrap; }
        .cr-dur-btn {
          padding: 10px 16px; border-radius: 10px; cursor: pointer;
          font-size: 13px; font-weight: 500; font-family: 'Onest', sans-serif;
          transition: all 0.15s; border: 0.5px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03); color: #555;
        }
        .cr-dur-btn.active {
          background: rgba(195,7,63,0.1); border-color: rgba(195,7,63,0.3); color: #fff;
        }

        /* Сводка */
        .cr-summary {
          background: #111114; border: 0.5px solid rgba(255,255,255,0.06);
          border-radius: 20px; padding: 24px; margin-bottom: 24px;
        }
        .cr-summary h3 {
          font-family: 'Syne', sans-serif; font-size: 16px;
          font-weight: 700; color: #fff; margin-bottom: 16px;
        }
        .cr-sum-row {
          display: flex; justify-content: space-between;
          align-items: center; padding: 10px 0;
          border-bottom: 0.5px solid rgba(255,255,255,0.04);
          font-size: 14px;
        }
        .cr-sum-row:last-child { border-bottom: none; }
        .cr-sum-label { color: #555; }
        .cr-sum-val { color: #fff; font-weight: 500; }
        .cr-sum-total { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: #C3073F; }

        /* Способы оплаты */
        .cr-pay-methods { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
        .cr-pay-method {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 18px; background: #111114;
          border: 1.5px solid rgba(255,255,255,0.06);
          border-radius: 14px; cursor: pointer; transition: all 0.15s;
        }
        .cr-pay-method:hover { border-color: rgba(195,7,63,0.2); }
        .cr-pay-method.selected { border-color: rgba(195,7,63,0.4); background: rgba(195,7,63,0.04); }
        .cr-pay-icon { font-size: 22px; }
        .cr-pay-name { font-size: 14px; font-weight: 500; color: #fff; }
        .cr-pay-sub { font-size: 11px; color: #444; margin-top: 2px; }
        .cr-pay-radio {
          margin-left: auto; width: 18px; height: 18px; border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
        }
        .cr-pay-radio.checked { border-color: #C3073F; background: #C3073F; }
        .cr-pay-radio.checked::after { content: ''; width: 7px; height: 7px; border-radius: 50%; background: #fff; }

        /* Кнопки навигации */
        .cr-nav { display: flex; gap: 12px; margin-top: 32px; }
        .cr-btn-back {
          padding: 14px 20px; border-radius: 12px;
          background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.08);
          color: #888; font-size: 15px; font-family: 'Onest', sans-serif;
          cursor: pointer; transition: all 0.15s;
        }
        .cr-btn-back:hover { color: #fff; }
        .cr-btn-next {
          flex: 1; padding: 14px 20px; border-radius: 12px;
          background: #C3073F; border: none; color: #fff;
          font-size: 15px; font-weight: 600; font-family: 'Onest', sans-serif;
          cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .cr-btn-next:hover { background: #a8063a; }
        .cr-btn-next:disabled { background: #2a0a14; color: #555; cursor: not-allowed; }
        .cr-spin {
          width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="cr-root">
        <header className="cr-header">
          <a href="/organizer/dashboard" className="cr-logo">tusi<em>'m</em></a>
          <button className="cr-back" onClick={() => step > 1 ? setStep(s => s-1) : router.push('/organizer/dashboard')}>
            ← {step === 1 ? 'Дашборд' : 'Назад'}
          </button>
        </header>

        <div className="cr-body">
          {/* Прогресс */}
          <div className="cr-progress">
            {['Тариф', 'Детали', 'Оплата'].map((label, i) => {
              const n = i + 1
              const state = n < step ? 'done' : n === step ? 'current' : 'todo'
              return (
                <div key={n} className="cr-step">
                  <div className={`cr-step-num ${state}`}>{n < step ? '✓' : n}</div>
                  <span className={`cr-step-label ${state === 'current' ? 'current' : ''}`}>{label}</span>
                  {i < 2 && <div className="cr-step-line" />}
                </div>
              )
            })}
          </div>

          {/* Шаг 1: Тариф */}
          {step === 1 && (
            <>
              <div className="cr-title">Выбери тариф</div>
              <div className="cr-subtitle">Оплата за одно событие — без подписок</div>
              <div className="cr-plans">
                {PLANS.map(p => (
                  <div
                    key={p.id}
                    className={`cr-plan${plan === p.id ? ' selected' : ''}`}
                    style={{ '--plan-color': p.color }}
                    onClick={() => setPlan(p.id)}
                  >
                    {p.popular && <div className="cr-plan-popular">ПОПУЛЯРНЫЙ</div>}
                    <div className="cr-plan-name">{p.name}</div>
                    <div className="cr-plan-price">
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

          {/* Шаг 2: Детали */}
          {step === 2 && (
            <>
              <div className="cr-title">Настрой событие</div>
              <div className="cr-subtitle">Заполни основные данные</div>
              <div className="cr-form">
                <div className="cr-field">
                  <label>Название события</label>
                  <input
                    className="cr-input"
                    placeholder="Свадьба Ани и Коли"
                    value={name}
                    onChange={e => setName(e.target.value)}
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

          {/* Шаг 3: Оплата */}
          {step === 3 && (
            <>
              <div className="cr-title">Оплата</div>
              <div className="cr-subtitle">Проверь и оплати</div>

              <div className="cr-summary">
                <h3>Сводка заказа</h3>
                {[
                  ['Тариф', selectedPlan?.name],
                  ['Событие', name],
                  ['Гостей', `до ${selectedPlan?.guests}`],
                  ['Фото/гость', `${selectedPlan?.photos} шт`],
                  ['Длительность', selectedPlan?.id === 'free' ? '2 часа' : `${duration} ч`],
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
                    { icon: '💳', name: 'Банковская карта', sub: 'Visa, Mastercard, МИР' },
                    { icon: '📱', name: 'СБП', sub: 'Система быстрых платежей' },
                    { icon: '💰', name: 'ЮMoney', sub: 'Электронный кошелёк' },
                  ].map((m, i) => (
                    <div key={i} className="cr-pay-method selected" style={i > 0 ? {opacity:0.5} : {}}>
                      <span className="cr-pay-icon">{m.icon}</span>
                      <div>
                        <div className="cr-pay-name">{m.name}</div>
                        <div className="cr-pay-sub">{m.sub}</div>
                      </div>
                      <div className={`cr-pay-radio${i === 0 ? ' checked' : ''}`} />
                    </div>
                  ))}
                </div>
              )}

              <div className="cr-nav">
                <button className="cr-btn-back" onClick={() => setStep(2)}>←</button>
                <button className="cr-btn-next" onClick={handleCreate} disabled={loading}>
                  {loading
                    ? <span className="cr-spin" />
                    : selectedPlan?.price === 0 ? 'Создать бесплатно' : `Оплатить ${selectedPlan?.price?.toLocaleString()} ₽`
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