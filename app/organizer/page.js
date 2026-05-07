'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OrganizerPage() {
  const router = useRouter()
  const telegramRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Если уже залогинен — редиректим
    const token = localStorage.getItem('organizer_token')
    if (token) {
      router.replace('/organizer/dashboard')
      return
    }

    // Вешаем глобальный колбэк для Telegram виджета
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

    // Подгружаем Telegram Login Widget скрипт
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'tusim_bot')
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    script.async = true
    telegramRef.current?.appendChild(script)

    return () => {
      delete window.onTelegramAuth
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1A1A1D',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Onest', sans-serif"
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Лого */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#F0F0F0',
            fontFamily: "'Unbounded', sans-serif",
            letterSpacing: '-1px',
            marginBottom: '8px'
          }}>
            tusi<span style={{ color: '#C3073F' }}>'m</span>
          </div>
          <div style={{ fontSize: '13px', color: '#888' }}>
            кабинет организатора
          </div>
        </div>

        {/* Карточка */}
        <div style={{
          background: '#161616',
          borderRadius: '20px',
          padding: '28px 24px',
          border: '0.5px solid #2a2a2a'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '500',
            color: '#F0F0F0',
            marginBottom: '8px'
          }}>
            Войди через Telegram
          </div>
          <div style={{
            fontSize: '13px',
            color: '#888',
            marginBottom: '24px',
            lineHeight: '1.6'
          }}>
            Создавай события, выбирай тариф и получай QR-коды для гостей.
          </div>

          {/* Telegram Login Widget */}
          {!loading && (
            <div
              ref={telegramRef}
              style={{
                display: 'flex',
                justifyContent: 'center',
                minHeight: '48px'
              }}
            />
          )}

          {loading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px',
              color: '#888',
              fontSize: '14px'
            }}>
              <span style={{
                width: '16px', height: '16px',
                border: '2px solid #4E4E50',
                borderTopColor: '#C3073F',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.8s linear infinite'
              }} />
              входим...
            </div>
          )}

          {error && (
            <div style={{
              marginTop: '12px',
              padding: '10px 14px',
              background: '#2a0a14',
              borderRadius: '10px',
              color: '#C3073F',
              fontSize: '13px'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Описание */}
        <div style={{
          marginTop: '24px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px'
        }}>
          {[
            { icon: '📸', text: 'краудсорсинг фото' },
            { icon: '🔗', text: 'QR-код для гостей' },
            { icon: '📊', text: 'статистика события' },
            { icon: '🎛️', text: 'управление альбомом' },
          ].map((item, i) => (
            <div key={i} style={{
              background: '#161616',
              border: '0.5px solid #2a2a2a',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '12px',
              color: '#888',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  )
}