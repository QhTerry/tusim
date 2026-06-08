'use client'
import { useEffect, useState } from 'react'

// Тумблер тёмная/светлая. Тема хранится в data-theme на <html> и в localStorage.
// Первичная установка темы — в no-flash скрипте layout (до отрисовки), чтобы не мигало.
export default function ThemeToggle({ floating = false }) {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') || 'dark')
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('tusim-theme', next) } catch {}
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', next === 'light' ? '#FBF8FB' : '#0a0a0d')
    setTheme(next)
  }

  const btn = (
    <button className="ds-theme-toggle" onClick={toggle} aria-label="Сменить тему" title="Тёмная / светлая">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )

  if (!floating) return btn
  return (
    <div style={{ position:'fixed', left:16, bottom:16, zIndex:900 }}>{btn}</div>
  )
}
