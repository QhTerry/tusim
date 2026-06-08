'use client'
import { useEffect, useState } from 'react'

// Лёгкая система тостов без контекста: любой клиентский экран зовёт toast(...),
// а <Toaster/> (смонтирован в layout) слушает событие и рисует уведомления.
// Заменяет alert() — нативный, не блокирующий, в стиле бренда.

let seq = 0

export function toast(message, type = 'info', ms = 3200) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('ds-toast', { detail: { id: ++seq, message, type, ms } }))
}

const ICONS = { success: '✓', error: '!', info: '★' }

export default function Toaster() {
  const [items, setItems] = useState([])

  useEffect(() => {
    function onToast(e) {
      const t = e.detail
      setItems(prev => [...prev, t])
      // помечаем на выход, затем удаляем
      setTimeout(() => {
        setItems(prev => prev.map(x => x.id === t.id ? { ...x, out: true } : x))
        setTimeout(() => setItems(prev => prev.filter(x => x.id !== t.id)), 260)
      }, t.ms)
    }
    window.addEventListener('ds-toast', onToast)
    return () => window.removeEventListener('ds-toast', onToast)
  }, [])

  if (!items.length) return null
  return (
    <div className="ds-toast-wrap">
      {items.map(t => (
        <div key={t.id} className={`ds-toast ds-toast-${t.type}${t.out ? ' out' : ''}`}>
          <span className="ds-toast-ic">{ICONS[t.type] || ICONS.info}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
