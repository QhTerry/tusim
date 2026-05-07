'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function OrganizerPage() {
  const router = useRouter()
  const [step, setStep] = useState('phone') // 'phone' | 'need_bot' | 'code'
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [botLink, setBotLink] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const codeRefs = useRef([])

  useEffect(() => {
    const token = localStorage.getItem('organizer_token')
    if (token) router.replace('/organizer/dashboard')
  }, [])

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendTimer])

  function formatPhone(val) {
    const digits = val.replace(/\D/g, '').slice(0, 11)
    if (!digits) return ''
    if (digits.length <= 1) return '+7'
    const d = digits.startsWith('8') ? '7' + digits.slice(1) : digits
    let result = '+7'
    if (d.length > 1) result += ' ' + d.slice(1, 4)
    if (d.length > 4) result += ' ' + d.slice(4, 7)
    if (d.length > 7) result += '-' + d.slice(7, 9)
    if (d.length > 9) result += '-' + d.slice(9, 11)
    return result
  }

  async function handleSendCode() {
    setError('')
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 11) {
      setError('Введи полный номер телефона')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits })
      })
      const data = await res.json()
      if (data.status === 'sent') {
        setStep('code')
        setResendTimer(45)
      } else if (data.status === 'need_bot') {
        setBotLink(data.botLink)
        setStep('need_bot')
      } else {
        setError(data.error || 'Ошибка')
      }
    } catch {
      setError('Ошибка сети')
    }
    setLoading(false)
  }

  async function handleBotLinked() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\D/g, '') })
      })
      const data = await res.json()
      if (data.status === 'sent') {
        setStep('code')
        setResendTimer(45)
      } else {
        setError('Ты ещё не написал боту. Напиши /start боту и вернись сюда.')
      }
    } catch {
      setError('Ошибка сети')
    }
    setLoading(false)
  }

  function handleCodeInput(idx, val) {
    if (!/^\d*$/.test(val)) return
    const next = [...code]
    next[idx] = val.slice(-1)
    setCode(next)
    if (val && idx < 5) codeRefs.current[idx + 1]?.focus()
    if (next.every(d => d !== '')) verifyCode(next.join(''))
  }

  function handleCodeKeyDown(idx, e) {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus()
    }
  }

  async function verifyCode(fullCode) {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\D/g, ''), code: fullCode })
      })
      const data = await res.json()
      if (data.ok) {
        localStorage.setItem('organizer_token', data.token)
        localStorage.setItem('organizer', JSON.stringify(data.organizer))
        router.push('/organizer/dashboard')
      } else {
        setError(data.error || 'Неверный код')
        setCode(['', '', '', '', '', ''])
        codeRefs.current[0]?.focus()
      }
    } catch {
      setError('Ошибка сети')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#1A1A1D',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: "'Onest', sans-serif"
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        <div style={{ marginBottom: '32px' }}>
          <div style={{
            fontSize: '28px', fontWeight: '800', color: '#F0F0F0',
            fontFamily: "'Unbounded', sans-serif", letterSpacing: '-1px', marginBottom: '6px'
          }}>
            tusi<span style={{ color: '#C3073F' }}>'m</span>
          </div>
          <div style={{ fontSize: '13px', color: '#888' }}>кабинет организатора</div>
        </div>

        {/* ШАГ 1: Ввод телефона */}
        {step === 'phone' && (
          <div>
            <div style={{ fontSize: '11px', color: '#4E4E50', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '20px' }}>
              вход / регистрация
            </div>

            <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '8px' }}>
              номер телефона
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && handleSendCode()}
              placeholder="+7 999 000 00-00"
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                background: '#2a2a2a', border: '0.5px solid #4E4E50',
                color: '#F0F0F0', fontSize: '16px', outline: 'none',
                boxSizing: 'border-box', marginBottom: '12px'
              }}
            />

            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', background: '#2a2a2a', borderRadius: '10px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#229ED9', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0, fontSize: '14px'
              }}>✈️</div>
              <div style={{ fontSize: '12px', color: '#888', lineHeight: '1.4' }}>
                код придёт в Telegram от бота <span style={{ color: '#F0F0F0' }}>@tusim_bot</span>
              </div>
            </div>

            {error && <div style={{ color: '#C3073F', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}

            <button
              onClick={handleSendCode}
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                background: loading ? '#950740' : '#C3073F', border: 'none',
                color: '#F0F0F0', fontSize: '15px', fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'отправляем...' : 'получить код'}
            </button>

            <div style={{ marginTop: '20px', fontSize: '11px', color: '#4E4E50', textAlign: 'center', lineHeight: '1.6' }}>
              нажимая кнопку, вы соглашаетесь с условиями использования
            </div>
          </div>
        )}

        {/* ШАГ 1.5: Нужно написать боту */}
        {step === 'need_bot' && (
          <div>
            <div style={{ fontSize: '15px', color: '#F0F0F0', marginBottom: '8px', fontWeight: '500' }}>
              Сначала напиши боту
            </div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '24px', lineHeight: '1.6' }}>
              Чтобы бот мог отправить тебе код, нужно один раз написать ему в Telegram.
            </div>

            <a
              href={botLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', width: '100%', padding: '14px', borderRadius: '12px',
                background: '#229ED9', border: 'none', color: '#fff',
                fontSize: '15px', fontWeight: '600', textAlign: 'center',
                textDecoration: 'none', marginBottom: '12px', boxSizing: 'border-box'
              }}
            >
              открыть @tusim_bot
            </a>

            {error && <div style={{ color: '#C3073F', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}

            <button
              onClick={handleBotLinked}
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                background: loading ? '#2a2a2a' : '#2a2a2a',
                border: '0.5px solid #4E4E50', color: '#F0F0F0',
                fontSize: '15px', cursor: 'pointer'
              }}
            >
              {loading ? 'проверяем...' : 'я написал боту → отправить код'}
            </button>

            <button
              onClick={() => { setStep('phone'); setError('') }}
              style={{
                width: '100%', padding: '12px', marginTop: '10px',
                background: 'none', border: 'none', color: '#4E4E50',
                fontSize: '13px', cursor: 'pointer'
              }}
            >
              ← изменить номер
            </button>
          </div>
        )}

        {/* ШАГ 2: Ввод кода */}
        {step === 'code' && (
          <div>
            <button
              onClick={() => { setStep('phone'); setCode(['','','','','','']); setError('') }}
              style={{
                background: 'none', border: 'none', color: '#888',
                fontSize: '13px', cursor: 'pointer', padding: '0',
                marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              ← {phone}
            </button>

            <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px', lineHeight: '1.6' }}>
              Код отправлен в Telegram. Проверь сообщения от <span style={{ color: '#F0F0F0' }}>@tusim_bot</span>
            </div>

            <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '8px' }}>
              код из Telegram
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => codeRefs.current[idx] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeInput(idx, e.target.value)}
                  onKeyDown={e => handleCodeKeyDown(idx, e)}
                  style={{
                    flex: 1, height: '52px', textAlign: 'center',
                    borderRadius: '10px', background: '#2a2a2a',
                    border: digit ? '1px solid #C3073F' : '0.5px solid #4E4E50',
                    color: '#F0F0F0', fontSize: '22px', fontWeight: '600', outline: 'none'
                  }}
                />
              ))}
            </div>

            {error && <div style={{ color: '#C3073F', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}

            <div style={{ textAlign: 'center', fontSize: '13px', color: '#4E4E50' }}>
              {resendTimer > 0
                ? `повторная отправка через ${resendTimer} сек`
                : (
                  <button
                    onClick={handleSendCode}
                    style={{ background: 'none', border: 'none', color: '#C3073F', fontSize: '13px', cursor: 'pointer' }}
                  >
                    отправить снова
                  </button>
                )
              }
            </div>

            {loading && (
              <div style={{ textAlign: 'center', color: '#888', fontSize: '13px', marginTop: '12px' }}>
                проверяем...
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}