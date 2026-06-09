'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

// Тонкий градиентный прогресс-бар сверху при переходах между страницами.
export default function RouteProgress() {
  const pathname = usePathname()
  const [w, setW] = useState(0)
  const [show, setShow] = useState(false)

  useEffect(() => {
    function onClick(e) {
      const a = e.target.closest && e.target.closest('a[href]')
      if (!a) return
      const href = a.getAttribute('href') || ''
      if (!href || href.startsWith('#') || a.target === '_blank' || href.startsWith('http')) return
      setShow(true); setW(14); setTimeout(() => setW(72), 120)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  useEffect(() => {
    setShow(true); setW(100)
    const t1 = setTimeout(() => setShow(false), 350)
    const t2 = setTimeout(() => setW(0), 720)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [pathname])

  return <div className="ds-progress" style={{ width: w + '%', opacity: show && w > 0 ? 1 : 0 }} aria-hidden="true" />
}
